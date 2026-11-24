"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import {
  createConversationId,
  createEmptyConversationState,
  normalizeConversationState
} from "@/lib/assistant-state";
import type {
  AssistantCurrentPageContext,
  AssistantHistoryItem,
  AssistantSource,
  AssistantTurnOrigin,
  ConversationState
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AssistantResponse = {
  conversationId: string;
  transcript?: string;
  replyText: string;
  spokenText?: string;
  sources?: AssistantSource[];
  modelUsed?: string;
  nextConversationState?: ConversationState;
  remainingTurns: number;
  limitReached: boolean;
  errorCode?: string;
};

type TranscriptionResponse = {
  conversationId?: string;
  transcript?: string;
  remainingTurns: number;
  limitReached: boolean;
  errorCode?: string;
};

type SpeakResponse = {
  audio?: string;
  audioMimeType?: string;
  replyText?: string;
  spokenText?: string;
};

/** One line of the conversation as shown in the panel. Answers may carry page links. */
type ThreadItem = AssistantHistoryItem & { sources?: AssistantSource[] };

type AssistantPanelProps = {
  variant?: "hero" | "floating";
  contextProjectSlug?: string;
  showClosedTrigger?: boolean;
  /** Extra classes for the closed launcher, e.g. to hide it where the page has its own button. */
  triggerClassName?: string;
};

type OpenEventDetail = {
  prompt?: string;
  autoSubmit?: boolean;
  contextProjectSlug?: string;
  source?: "hero" | "project" | "launcher" | "external";
};

type AssistantStatus =
  | "idle"
  | "arming"
  | "recording"
  | "transcribing"
  | "grounding"
  | "composing"
  | "preparing_voice"
  | "ready"
  | "speaking"
  | "error"
  | "limit_reached";

type RecorderSession = {
  stream: MediaStream;
  recorder: MediaRecorder;
  mimeType: string;
  stopped: Promise<Blob>;
};

type WaveformSession = {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  data: Uint8Array;
  frameId: number | null;
  startedAt: number;
};

type PersistedAssistantState = {
  conversationId: string;
  conversationState: ConversationState;
  history: AssistantHistoryItem[];
  draft: string;
  remainingTurns: number;
  open: boolean;
  updatedAt: number;
};

type LastAudioState = {
  src: string;
  mimeType: string;
} | null;

const MAX_RECORDING_MS = 25_000;
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_TURNS = 10;
const ASSISTANT_STORAGE_KEY = "portfolio-assistant-state-v7";
const ASSISTANT_STORAGE_TTL_MS = 6 * 60 * 60 * 1000;
const WAVEFORM_POINT_COUNT = 72;
const defaultWaveform = Array.from({ length: WAVEFORM_POINT_COUNT }, () => 0);

const homeStarterPrompts = [
  "What did the consciousness paper actually find?",
  "Which of his papers is the strongest, and why?",
  "What kind of role is he a fit for?"
];

const projectStarterPrompts = [
  "Explain this project in plain words.",
  "What are its limits?",
  "How does it compare with his other work?"
];

const recordingMimeCandidates = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
];

function getRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return "audio/webm";
  }

  return (
    recordingMimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ??
    null
  );
}

/** The server needs only who said what. */
function toServerHistory(items: ThreadItem[]): AssistantHistoryItem[] {
  return items.map(({ role, content }) => ({ role, content }));
}

function dispatchAssistantEvent(detail?: OpenEventDetail) {
  window.dispatchEvent(
    new CustomEvent("portfolio-assistant:open", {
      detail
    })
  );
}

function formatRecordingTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getStatusLabel(status: AssistantStatus) {
  switch (status) {
    case "arming":
      return "Waiting for the mic";
    case "recording":
      return "Listening";
    case "transcribing":
      return "Writing down your question";
    case "grounding":
    case "composing":
      return "Thinking";
    case "preparing_voice":
      return "Preparing the voice";
    case "ready":
      return "Answered";
    case "speaking":
      return "Speaking";
    case "limit_reached":
      return "Limit reached";
    case "error":
      return "That didn't work";
    default:
      return "Ready";
  }
}

function getStatusDescription(status: AssistantStatus) {
  switch (status) {
    case "arming":
      return "Allow the mic when your browser asks.";
    case "recording":
      return "Release the button when you are done.";
    case "transcribing":
      return "Turning the recording into text.";
    case "grounding":
    case "composing":
      return "Reading the work and writing the answer.";
    case "preparing_voice":
      return "Turning the answer into speech.";
    case "ready":
      return "Ask a follow-up any time.";
    case "speaking":
      return "Reading the answer aloud.";
    case "limit_reached":
      return "Start a new conversation to continue.";
    case "error":
      return "Ask again, or type the question.";
    default:
      return "Hold to talk, or type.";
  }
}

function isProcessingStatus(status: AssistantStatus) {
  return (
    status === "arming" ||
    status === "recording" ||
    status === "transcribing" ||
    status === "grounding" ||
    status === "composing" ||
    status === "preparing_voice"
  );
}

function buildWaveformPath(samples: number[]) {
  const width = 100;
  const height = 44;
  const centerY = height / 2;
  const usableAmplitude = 15;

  return samples
    .map((sample, index) => {
      const x = (index / Math.max(1, samples.length - 1)) * width;
      const y = centerY - sample * usableAmplitude;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function WaveformLine({
  samples,
  emphasis = "idle"
}: {
  samples: number[];
  emphasis?: "idle" | "recording" | "speaking";
}) {
  const path = buildWaveformPath(samples);

  return (
    <div className="relative h-20 overflow-hidden border border-line bg-[rgba(14,6,8,0.75)] px-3 py-3">
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/8" />
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-full w-full">
        <line x1="0" y1="22" x2="100" y2="22" className="stroke-white/10" strokeWidth="0.7" />
        <path
          d={path}
          fill="none"
          className={cn(
            emphasis === "recording"
              ? "stroke-[#ff5b3d]"
              : emphasis === "speaking"
                ? "stroke-[rgba(255,244,238,0.92)]"
                : "stroke-white/35"
          )}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function RecordingStrip({
  status,
  samples,
  elapsedMs
}: {
  status: AssistantStatus;
  samples: number[];
  elapsedMs: number;
}) {
  const label = status === "arming" ? "Allow mic access..." : "Listening";
  const helper =
    status === "arming"
      ? "Stay pressed while the mic is prepared."
      : "Release to send. Recording stops automatically at 25 seconds.";

  return (
    <div className="space-y-3 border border-line bg-[linear-gradient(180deg,rgba(14,6,8,0.94),rgba(8,3,4,0.98))] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="kicker text-ember-amber-bright">
            {label}
          </p>
          <p className="text-sm leading-6 text-smoke-gray">{helper}</p>
        </div>
        <p className="kicker text-bone-white">
          {formatRecordingTime(elapsedMs)}
        </p>
      </div>

      <WaveformLine samples={samples} emphasis={status === "recording" ? "recording" : "idle"} />
    </div>
  );
}

function StatusRail({
  status,
  transcriptVisible
}: {
  status: AssistantStatus;
  transcriptVisible: boolean;
}) {
  const steps = [
    {
      key: "transcribing",
      label: "Heard",
      active: status === "transcribing",
      complete:
        transcriptVisible ||
        status === "grounding" ||
        status === "composing" ||
        status === "ready" ||
        status === "speaking"
    },
    {
      key: "grounding",
      label: "Reading",
      active: status === "grounding",
      complete: status === "composing" || status === "ready" || status === "speaking"
    },
    {
      key: "composing",
      label: "Answer",
      active: status === "composing",
      complete: status === "ready" || status === "speaking"
    },
    {
      key: "speaking",
      label: "Voice",
      active: status === "preparing_voice" || status === "speaking",
      complete: status === "ready" || status === "preparing_voice" || status === "speaking"
    }
  ];

  return (
    <div className="space-y-3 border border-line bg-charcoal-steel/60 px-4 py-4">
      <div className="kicker flex items-center justify-between gap-4">
        <span>{getStatusLabel(status)}</span>
        <span className="text-right">{getStatusDescription(status)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <div key={step.key} className="space-y-2">
            <div
              className={cn(
                "h-px w-full transition-colors",
                step.active || step.complete ? "bg-ember-amber" : "bg-white/10"
              )}
            />
            <p
              className={cn(
                "kicker tracking-[0.2em] transition-colors",
                step.active
                  ? "text-bone-white"
                  : step.complete
                    ? "text-smoke-gray"
                    : "text-smoke-gray-soft"
              )}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Thread({
  history,
  pendingUserText,
  canReplayAudio = false,
  onReplayAudio
}: {
  history: ThreadItem[];
  pendingUserText: string | null;
  canReplayAudio?: boolean;
  onReplayAudio?: () => Promise<void> | void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [history.length, pendingUserText]);

  if (!history.length && !pendingUserText) return null;

  const lastAssistantIndex = history.map((item) => item.role).lastIndexOf("assistant");

  return (
    <div className="space-y-3" aria-live="polite">
      {history.map((item, index) =>
        item.role === "user" ? (
          <div key={index} className="border-l border-line-strong pl-4">
            <p className="kicker">You asked</p>
            <p className="mt-1 text-sm leading-6 text-bone-white/85">{item.content}</p>
          </div>
        ) : (
          <div key={index} className="border border-line bg-charcoal-steel/80 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <p className="kicker">Answer</p>
              {index === lastAssistantIndex && canReplayAudio && onReplayAudio ? (
                <button
                  type="button"
                  onClick={() => void onReplayAudio()}
                  className="kicker transition-colors hover:text-bone-white"
                >
                  Play answer
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[0.9375rem] leading-7 text-bone-white">{item.content}</p>
            {item.sources?.length ? (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">
                {item.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} className="text-link text-sm">
                      {source.label} →
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      )}

      {pendingUserText ? (
        <div className="border-l border-ember-amber pl-4">
          <p className="kicker">You asked</p>
          <p className="mt-1 text-sm leading-6 text-bone-white/85">{pendingUserText}</p>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}

function getRecordButtonLabel(status: AssistantStatus) {
  switch (status) {
    case "arming":
      return "Allow the mic";
    case "recording":
      return "Release to send";
    case "transcribing":
    case "grounding":
    case "composing":
    case "preparing_voice":
      return "Working";
    case "limit_reached":
      return "Limit reached";
    default:
      return "Hold to talk";
  }
}

function AssistantSurface({
  history,
  status,
  remainingTurns,
  draft,
  setDraft,
  notice,
  pendingUserText,
  waveformSamples,
  recordingMs,
  onSubmit,
  onRecordPressStart,
  onRecordPressEnd,
  onReplayAudio,
  onStarterPrompt,
  onNewConversation,
  onClose,
  floating,
  hasReplayAudio,
  starterPrompts
}: {
  history: ThreadItem[];
  status: AssistantStatus;
  remainingTurns: number;
  draft: string;
  setDraft: (value: string) => void;
  notice: string | null;
  pendingUserText: string | null;
  waveformSamples: number[];
  recordingMs: number;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onRecordPressStart: (
    event: React.PointerEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => Promise<void>;
  onRecordPressEnd: (
    event?: React.PointerEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => Promise<void>;
  onReplayAudio: () => Promise<void>;
  onStarterPrompt: (prompt: string) => Promise<void>;
  onNewConversation: () => void;
  onClose?: () => void;
  floating: boolean;
  hasReplayAudio: boolean;
  starterPrompts: string[];
}) {
  const showPrompts = history.length === 0 && !pendingUserText && status === "idle";
  const showStatusRail =
    Boolean(pendingUserText) ||
    ["transcribing", "grounding", "composing", "preparing_voice", "ready", "speaking"].includes(
      status
    );
  const showConversationActions =
    (history.length > 0 || draft.trim() || remainingTurns < DEFAULT_TURNS) &&
    !isProcessingStatus(status);
  const busy = isProcessingStatus(status);
  const recordingActive = status === "arming" || status === "recording";

  return (
    <section
      id={!floating ? "assistant" : undefined}
      className={cn(
        "flex h-full flex-col overflow-hidden border border-line-strong bg-[linear-gradient(180deg,rgba(15,6,8,0.98),rgba(7,3,4,0.995))]",
        floating && "shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur"
      )}
    >
      <div className="shrink-0 border-b border-line bg-[rgba(12,5,7,0.98)] px-4 py-4 md:px-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="kicker">Voice agent</p>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {showConversationActions ? (
                <button
                  type="button"
                  onClick={onNewConversation}
                  className="kicker border border-line px-3 py-2 tracking-[0.18em] transition-colors hover:border-line-strong hover:text-bone-white"
                >
                  New conversation
                </button>
              ) : null}

              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="kicker border border-line px-3 py-2 tracking-[0.18em] transition-colors hover:border-line-strong hover:text-bone-white"
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <h2
              className={cn(
                "text-bone-white",
                floating
                  ? "max-w-[17rem] text-[1.15rem] font-medium leading-[1.08] sm:max-w-md sm:text-xl"
                  : "max-w-lg text-[1.9rem] font-medium leading-[1.02]"
              )}
            >
              Ask about the research, the builds, or his background.
            </h2>
            <p
              className={cn(
                "text-sm text-smoke-gray",
                floating
                  ? "max-w-[16rem] leading-6 sm:max-w-md sm:leading-7"
                  : "max-w-md leading-7"
              )}
            >
              Hold the button and speak, or type. It answers from the work on this site and says so when it does not know.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
        <div className="space-y-4">
        {showPrompts ? (
          <div className="space-y-3">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void onStarterPrompt(prompt)}
                className="flex w-full items-center justify-between gap-4 border border-line px-4 py-3 text-left text-sm leading-6 text-bone-white transition-colors hover:border-ember-amber/50 hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.08),transparent_44%)]"
              >
                <span>{prompt}</span>
                <span aria-hidden="true" className="text-ember-amber">
                  →
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Thread
            history={history}
            pendingUserText={pendingUserText}
            canReplayAudio={hasReplayAudio}
            onReplayAudio={onReplayAudio}
          />
        )}

        {recordingActive ? (
          <RecordingStrip status={status} samples={waveformSamples} elapsedMs={recordingMs} />
        ) : null}

        {showStatusRail ? (
          <StatusRail status={status} transcriptVisible={Boolean(pendingUserText)} />
        ) : null}

        <div className="kicker flex items-center justify-between gap-4">
          <span>
            {remainingTurns} {remainingTurns === 1 ? "question" : "questions"} left
          </span>
          <span
            className={cn(
              recordingActive && "text-ember-amber",
              ["ready", "speaking"].includes(status) && "text-bone-white",
              status === "limit_reached" && "text-ember-amber"
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        {notice ? <p className="text-sm leading-6 text-smoke-gray">{notice}</p> : null}

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a question"
            aria-label="Your question"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={floating ? 3 : 4}
            disabled={recordingActive || status === "limit_reached"}
            className="w-full resize-none border border-line bg-charcoal-steel px-4 py-3 text-sm text-bone-white outline-none transition-colors placeholder:text-smoke-gray focus:border-ember-amber/70 disabled:cursor-not-allowed disabled:opacity-65"
          />

          <div className={cn("flex gap-2", !floating && "md:grid md:grid-cols-[1fr_auto]")}>
            <button
              type="button"
              onPointerDown={(event) => void onRecordPressStart(event)}
              onPointerUp={(event) => void onRecordPressEnd(event)}
              onPointerCancel={(event) => void onRecordPressEnd(event)}
              onKeyDown={(event) => {
                if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                  event.preventDefault();
                  void onRecordPressStart(event);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  void onRecordPressEnd(event);
                }
              }}
              disabled={
                remainingTurns <= 0 ||
                (busy && !recordingActive) ||
                status === "limit_reached"
              }
              className={cn(
                "btn flex-1 touch-none select-none",
                recordingActive && "border-ember-amber bg-ember-amber-soft text-bone-white"
              )}
            >
              {getRecordButtonLabel(status)}
            </button>
            <button
              type="submit"
              disabled={!draft.trim() || busy || status === "limit_reached"}
              className="btn btn-primary"
            >
              Send
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="kicker">Powered by Sarvam AI</span>
          <img src="/sarvam-logo-white.svg" alt="Sarvam AI" className="h-5 w-auto opacity-90" />
        </div>
        </div>
      </div>
    </section>
  );
}

export function AssistantPanel({
  variant = "floating",
  contextProjectSlug,
  showClosedTrigger = true,
  triggerClassName
}: AssistantPanelProps) {
  const isHero = variant === "hero";
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ThreadItem[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [remainingTurns, setRemainingTurns] = useState(DEFAULT_TURNS);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [waveformSamples, setWaveformSamples] = useState<number[]>(defaultWaveform);
  const [recordingMs, setRecordingMs] = useState(0);
  const [conversationId, setConversationId] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>(
    createEmptyConversationState(contextProjectSlug ? "project" : undefined)
  );
  const [lastAudioState, setLastAudioState] = useState<LastAudioState>(null);

  const stopTimeoutRef = useRef<number | null>(null);
  const stageTimeoutsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<ThreadItem[]>([]);
  const conversationIdRef = useRef("");
  const conversationStateRef = useRef<ConversationState>(
    createEmptyConversationState(contextProjectSlug ? "project" : undefined)
  );
  const recorderSessionRef = useRef<RecorderSession | null>(null);
  const waveformSessionRef = useRef<WaveformSession | null>(null);
  const recordPressActiveRef = useRef(false);
  const releaseHandledRef = useRef(false);
  const pointerTargetRef = useRef<HTMLButtonElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const floatingLauncherEyebrow = "Voice agent";
  const floatingLauncherTitle = contextProjectSlug ? "Ask about this project" : "Ask about the work";
  const floatingLauncherSubline = "Speak or type. It has read every page here.";
  const starterPrompts = contextProjectSlug ? projectStarterPrompts : homeStarterPrompts;

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    try {
      const raw = window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedAssistantState;
      if (Date.now() - parsed.updatedAt > ASSISTANT_STORAGE_TTL_MS) {
        window.sessionStorage.removeItem(ASSISTANT_STORAGE_KEY);
        return;
      }

      const restoredConversationId = parsed.conversationId || createConversationId();
      setHistory(parsed.history ?? []);
      setDraft(parsed.draft ?? "");
      setRemainingTurns(parsed.remainingTurns ?? DEFAULT_TURNS);
      setOpen(Boolean(parsed.open));
      setConversationId(restoredConversationId);
      setConversationState(
        normalizeConversationState(
          parsed.conversationState,
          contextProjectSlug ? "project" : undefined
        )
      );
    } catch {
      window.sessionStorage.removeItem(ASSISTANT_STORAGE_KEY);
    }
  }, [contextProjectSlug, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (conversationId) return;
    setConversationId(createConversationId());
  }, [conversationId, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (!conversationId) return;

    const snapshot: PersistedAssistantState = {
      conversationId,
      conversationState,
      history,
      draft,
      remainingTurns,
      open,
      updatedAt: Date.now()
    };

    window.sessionStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(snapshot));
  }, [conversationId, conversationState, draft, history, hydrated, open, remainingTurns]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      clearStageTimers();
      void teardownRecorder();
      void teardownWaveform();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    async function handleOpen(event: Event) {
      const detail = (event as CustomEvent<OpenEventDetail>).detail;

      if (!isHero || window.innerWidth < 1024) {
        setOpen(true);
      }

      if (!detail?.prompt) return;

      if (detail.autoSubmit) {
        const turnOrigin: AssistantTurnOrigin =
          detail.source === "project"
            ? "project"
            : detail.source === "hero"
              ? "starter"
              : detail.source ?? "external";
        await submitTextTurn(detail.prompt, false, turnOrigin, detail.contextProjectSlug ?? null);
      } else {
        setDraft(detail.prompt);
      }
    }

    window.addEventListener("portfolio-assistant:open", handleOpen);
    return () => window.removeEventListener("portfolio-assistant:open", handleOpen);
  }, [hydrated, isHero]);

  useEffect(() => {
    function handleInterruption() {
      if (status === "recording") {
        void stopRecordingAndSubmit("interrupted");
        return;
      }

      if (status === "arming") {
        recordPressActiveRef.current = false;
        setStatus("idle");
        setNotice("The mic is ready. Hold the button to talk.");
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        handleInterruption();
      }
    }

    window.addEventListener("blur", handleInterruption);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleInterruption);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status]);

  function buildCurrentPageContext(
    projectSlug?: string | null
  ): AssistantCurrentPageContext | undefined {
    if (!projectSlug) return undefined;
    return {
      projectSlug,
      pathname: `/projects/${projectSlug}`
    };
  }

  function clearStageTimers() {
    for (const timeoutId of stageTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    stageTimeoutsRef.current = [];
  }

  function resetConversation() {
    clearStageTimers();
    clearAudioPlayback();
    setLastAudioState(null);
    historyRef.current = [];
    setHistory([]);
    setDraft("");
    setNotice(null);
    setPendingUserText(null);
    setStatus("idle");
    setRemainingTurns(DEFAULT_TURNS);
    setConversationId(createConversationId());
    setConversationState(createEmptyConversationState(contextProjectSlug ? "project" : undefined));
  }

  function scheduleAnswerStages() {
    clearStageTimers();
    stageTimeoutsRef.current.push(
      window.setTimeout(() => {
        setStatus((current) => (current === "grounding" ? "composing" : current));
      }, 850)
    );
  }

  async function teardownWaveform() {
    const session = waveformSessionRef.current;
    if (!session) return;

    waveformSessionRef.current = null;

    if (session.frameId) {
      window.cancelAnimationFrame(session.frameId);
    }

    session.source.disconnect();
    session.analyser.disconnect();
    if (session.context.state !== "closed") {
      await session.context.close();
    }

    setWaveformSamples(defaultWaveform);
    setRecordingMs(0);
  }

  async function teardownRecorder() {
    const session = recorderSessionRef.current;
    if (!session) return null;

    recorderSessionRef.current = null;
    if (session.recorder.state !== "inactive") {
      try {
        session.recorder.requestData();
      } catch {}
      session.recorder.stop();
    }

    let blob: Blob | null = null;
    try {
      blob = await session.stopped;
    } catch {
      blob = null;
    } finally {
      session.stream.getTracks().forEach((track) => track.stop());
      await teardownWaveform();
    }

    return blob
      ? {
          blob,
          mimeType: session.mimeType
        }
      : null;
  }

  async function playAudioFromState(audioState: LastAudioState) {
    if (!audioState || !audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = audioState.src;

    try {
      await audioRef.current.play();
      setStatus("speaking");
      setNotice(null);
    } catch {
      setStatus("ready");
      setNotice("Tap “Play answer” to hear it.");
    }
  }

  function clearAudioPlayback() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  async function requestSpeech(spokenText: string) {
    const { response, data } = await fetchAssistantResponse({
      mode: "speak",
      spokenText
    });

    if (!response.ok) {
      throw new Error((data as SpeakResponse).replyText || "voice_failed");
    }

    const speechData = data as SpeakResponse;
    if (!speechData.audio || !speechData.audioMimeType) {
      throw new Error("voice_missing");
    }

    const audioState = {
      src: `data:${speechData.audioMimeType};base64,${speechData.audio}`,
      mimeType: speechData.audioMimeType
    };
    setLastAudioState(audioState);
    return audioState;
  }

  async function fetchAssistantResponse(payload: FormData | Record<string, unknown>) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/assistant/turn", {
        method: "POST",
        body:
          payload instanceof FormData
            ? (() => {
                payload.set("history", JSON.stringify(toServerHistory(historyRef.current)));
                payload.set("conversationId", conversationIdRef.current);
                payload.set(
                  "conversationState",
                  JSON.stringify(conversationStateRef.current)
                );
                return payload;
              })()
            : JSON.stringify({
                ...payload,
                history: toServerHistory(historyRef.current),
                conversationId: conversationIdRef.current,
                conversationState: conversationStateRef.current
              }),
        headers:
          payload instanceof FormData
            ? undefined
            : {
                "Content-Type": "application/json"
              },
        signal: controller.signal
      });

      const data = (await response.json()) as
        | AssistantResponse
        | TranscriptionResponse
        | SpeakResponse;
      return { response, data };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function submitTextTurn(
    text: string,
    shouldAutoSpeak: boolean,
    turnOrigin: AssistantTurnOrigin,
    contextProjectSlugForTurn?: string | null
  ) {
    clearAudioPlayback();
    setLastAudioState(null);
    setPendingUserText(text);
    setStatus("grounding");
    setNotice(null);
    scheduleAnswerStages();

    try {
      const { response, data } = await fetchAssistantResponse({
        mode: "answer",
        transcript: text,
        currentPageContext: buildCurrentPageContext(
          contextProjectSlugForTurn ?? contextProjectSlug ?? undefined
        ),
        turnOrigin
      });

      if (!response.ok) {
        clearStageTimers();
        const assistantData = data as AssistantResponse;
        setPendingUserText(null);
        const nextHistory: ThreadItem[] = [
          ...historyRef.current,
          { role: "user", content: text },
          { role: "assistant", content: assistantData.replyText || "Something went wrong." }
        ];
        historyRef.current = nextHistory;
        setHistory(nextHistory);
        setRemainingTurns(assistantData.remainingTurns ?? remainingTurns);
        if (assistantData.conversationId) {
          setConversationId(assistantData.conversationId);
        }
        setConversationState(
          normalizeConversationState(
            assistantData.nextConversationState,
            turnOrigin
          )
        );
        setLastAudioState(null);

        if (assistantData.limitReached || response.status === 429) {
          setStatus("limit_reached");
          setNotice("This conversation has reached its limit. Start a new conversation to continue.");
          return;
        }

        setStatus("error");
        setNotice(null);
        return;
      }

      clearStageTimers();
      const assistantData = data as AssistantResponse;
      setRemainingTurns(assistantData.remainingTurns);
      setConversationId(assistantData.conversationId);
      setConversationState(
        normalizeConversationState(
          assistantData.nextConversationState,
          turnOrigin
        )
      );
      setNotice(null);

      const nextHistory: ThreadItem[] = [...historyRef.current];
      const userText = assistantData.transcript ?? text;
      nextHistory.push({ role: "user", content: userText });
      nextHistory.push({
        role: "assistant",
        content: assistantData.replyText,
        sources: assistantData.sources ?? []
      });

      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setPendingUserText(null);

      if (assistantData.limitReached) {
        setStatus("limit_reached");
        setNotice("This conversation has reached its limit. Start a new conversation to continue.");
        return;
      }

      if (shouldAutoSpeak && assistantData.spokenText) {
        setStatus("preparing_voice");
        setNotice(null);

        try {
          const audioState = await requestSpeech(assistantData.spokenText);
          setNotice(null);
          await playAudioFromState(audioState);
        } catch {
          setStatus("ready");
          setNotice("Tap “Play answer” to hear it.");
        }
      } else {
        setStatus("ready");
      }
    } catch (error) {
      clearStageTimers();
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setStatus("error");
      setNotice(
        aborted
          ? "That took too long. Ask again, or try a shorter question."
          : "The answer did not come through. Ask again."
      );
      setPendingUserText(null);
      setLastAudioState(null);
      const nextHistory: ThreadItem[] = [
        ...historyRef.current,
        { role: "user", content: text },
        {
          role: "assistant",
          content: aborted
            ? "That took too long to answer. Please ask again."
            : "Something went wrong while answering that. Please ask again."
        }
      ];
      historyRef.current = nextHistory;
      setHistory(nextHistory);
    }
  }

  async function transcribeRecording(blob: Blob, mimeType: string) {
    const formData = new FormData();
    const extension = getAudioExtension(mimeType);
    formData.set("mode", "transcribe");
    formData.set("audio", blob, `question.${extension}`);
    formData.set("audioMimeType", mimeType);

    setStatus("transcribing");
    setNotice(null);

    try {
      const { response, data } = await fetchAssistantResponse(formData);
      const transcriptionData = data as TranscriptionResponse;

      if (!response.ok || !transcriptionData.transcript?.trim()) {
        setStatus("error");
        setNotice("I couldn't make out the words. Hold the button while you speak, or type the question.");
        return null;
      }

      setRemainingTurns(transcriptionData.remainingTurns ?? remainingTurns);
      setPendingUserText(transcriptionData.transcript.trim());
      return transcriptionData.transcript.trim();
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setStatus("error");
      setNotice(
        aborted
          ? "Turning the recording into text took too long. Try again, or type the question."
          : "The recording could not be turned into text. Try again, or type the question."
      );
      return null;
    }
  }

  async function handleTextSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isProcessingStatus(status) || status === "limit_reached") return;
    setDraft("");
    await submitTextTurn(text, false, "text");
  }

  async function handleStarterPrompt(prompt: string) {
    setDraft("");
    await submitTextTurn(prompt, false, "starter", contextProjectSlug ?? null);
  }

  function startWaveform(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.84;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    const session: WaveformSession = {
      context,
      analyser,
      source,
      data,
      frameId: null,
      startedAt: performance.now()
    };

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      const step = Math.max(1, Math.floor(data.length / WAVEFORM_POINT_COUNT));
      const samples = Array.from({ length: WAVEFORM_POINT_COUNT }, (_, index) => {
        const sampleIndex = Math.min(data.length - 1, index * step);
        return (data[sampleIndex] - 128) / 128;
      });

      setWaveformSamples(samples);
      setRecordingMs(performance.now() - session.startedAt);
      session.frameId = window.requestAnimationFrame(tick);
    };

    waveformSessionRef.current = session;
    tick();
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("error");
      setNotice("This browser cannot record audio. Type the question instead.");
      return;
    }

    try {
      const mimeType = getRecordingMimeType();
      clearAudioPlayback();
      setStatus("arming");
      setNotice(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (!recordPressActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("idle");
        setNotice("The mic is ready. Hold the button to talk.");
        return;
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const stopped = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onerror = () => reject(new Error("recording_failed"));
        recorder.onstop = () => {
          resolve(
            new Blob(chunks, {
              type: normalizeAudioMimeType(recorder.mimeType || mimeType || "audio/webm")
            })
          );
        };
      });

      recorder.start(250);

      recorderSessionRef.current = {
        stream,
        recorder,
        mimeType: normalizeAudioMimeType(recorder.mimeType || mimeType || "audio/webm"),
        stopped
      };

      startWaveform(stream);
      setStatus("recording");
      setNotice("Release to send the question.");

      stopTimeoutRef.current = window.setTimeout(() => {
        void stopRecordingAndSubmit("timeout");
      }, MAX_RECORDING_MS);
    } catch {
      recordPressActiveRef.current = false;
      releaseHandledRef.current = true;
      setStatus("error");
      setNotice("The mic is blocked. Allow it in your browser's site settings, or type the question.");
    }
  }

  async function stopRecordingAndSubmit(reason: "release" | "timeout" | "interrupted") {
    if (releaseHandledRef.current) return;

    releaseHandledRef.current = true;
    recordPressActiveRef.current = false;

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    const session = await teardownRecorder();
    if (!session) {
      setStatus("error");
      setNotice("The recording did not work. Try again, or type the question.");
      return;
    }

    if (session.blob.size < 1_500) {
      setStatus("error");
      setNotice("That was too short to hear. Hold the button for the whole question.");
      return;
    }

    if (reason === "interrupted") {
      setNotice(null);
    }

    const transcript = await transcribeRecording(session.blob, session.mimeType);
    if (!transcript) return;
    await submitTextTurn(transcript, true, "voice");
  }

  async function handleRecordPressStart(
    event: React.PointerEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) {
    if (remainingTurns <= 0 || isProcessingStatus(status) || status === "limit_reached") return;

    clearAudioPlayback();
    setLastAudioState(null);
    setPendingUserText(null);
    recordPressActiveRef.current = true;
    releaseHandledRef.current = false;

    if ("pointerId" in event) {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerTargetRef.current = event.currentTarget;
      activePointerIdRef.current = event.pointerId;
    }

    await startRecording();
  }

  async function handleRecordPressEnd(
    event?: React.PointerEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) {
    if ("pointerId" in (event ?? {})) {
      const pointerEvent = event as React.PointerEvent<HTMLButtonElement>;
      if (
        pointerTargetRef.current &&
        activePointerIdRef.current !== null &&
        pointerTargetRef.current.hasPointerCapture(activePointerIdRef.current)
      ) {
        pointerTargetRef.current.releasePointerCapture(activePointerIdRef.current);
      }
      pointerTargetRef.current = null;
      activePointerIdRef.current = null;
      pointerEvent.preventDefault();
    }

    recordPressActiveRef.current = false;

    if (status === "recording") {
      await stopRecordingAndSubmit("release");
      return;
    }

    if (status === "arming") {
      setNotice("The mic is ready. Hold the button to talk.");
      return;
    }
  }

  async function handleReplayAudio() {
    if (!lastAudioState) return;
    await playAudioFromState(lastAudioState);
  }

  const speakingWaveform = useMemo(
    () =>
      waveformSamples.map((sample, index) => {
        const modulation = Math.sin((index / 6) * Math.PI) * 0.12;
        return sample * 0.5 + modulation;
      }),
    [waveformSamples]
  );

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setStatus("ready")}
        className="hidden"
        aria-hidden="true"
      />

      {isHero ? (
        <div className="hidden lg:block">
          <AssistantSurface
            history={history}
            status={status}
            remainingTurns={remainingTurns}
            draft={draft}
            setDraft={setDraft}
            notice={notice}
            pendingUserText={pendingUserText}
            waveformSamples={status === "speaking" ? speakingWaveform : waveformSamples}
            recordingMs={recordingMs}
            onSubmit={handleTextSubmit}
            onRecordPressStart={handleRecordPressStart}
            onRecordPressEnd={handleRecordPressEnd}
            onReplayAudio={handleReplayAudio}
            onStarterPrompt={handleStarterPrompt}
            onNewConversation={resetConversation}
            floating={false}
            hasReplayAudio={Boolean(lastAudioState)}
                  starterPrompts={starterPrompts}
          />
        </div>
      ) : null}

      {hydrated ? (
        <div
          className={cn(
            isHero
              ? "fixed inset-x-4 z-50 lg:hidden"
              : "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[22rem] sm:max-w-[24rem]",
            isHero && "bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
          )}
        >
          <AnimatePresence initial={false}>
            {open ? (
              <motion.section
                key="panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className={cn(
                  "overflow-hidden",
                  isHero ? "max-h-[calc(100svh-2rem)]" : "max-h-[calc(100svh-2rem)]"
                )}
                style={
                  isHero
                    ? {
                        maxHeight: "calc(100svh - env(safe-area-inset-bottom, 0px) - 2rem)"
                      }
                    : {
                        maxHeight: "calc(100svh - 2rem)"
                      }
                }
              >
                <AssistantSurface
                  history={history}
                  status={status}
                  remainingTurns={remainingTurns}
                  draft={draft}
                  setDraft={setDraft}
                  notice={notice}
                  pendingUserText={pendingUserText}
                  waveformSamples={status === "speaking" ? speakingWaveform : waveformSamples}
                  recordingMs={recordingMs}
                  onSubmit={handleTextSubmit}
                  onRecordPressStart={handleRecordPressStart}
                  onRecordPressEnd={handleRecordPressEnd}
                  onReplayAudio={handleReplayAudio}
                  onStarterPrompt={handleStarterPrompt}
                  onNewConversation={resetConversation}
                  onClose={() => setOpen(false)}
                  floating
                  hasReplayAudio={Boolean(lastAudioState)}
                  starterPrompts={starterPrompts}
                />
              </motion.section>
            ) : showClosedTrigger ? (
              <motion.button
                key="trigger"
                type="button"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                onClick={() => setOpen(true)}
                className={cn(
                  "ml-auto flex w-full items-center gap-3 border border-line bg-[rgba(16,9,10,0.94)] px-4 py-3 text-left shadow-[0_16px_60px_rgba(0,0,0,0.42)] backdrop-blur transition-colors hover:border-line-strong",
                  isHero && "mx-auto max-w-none",
                  triggerClassName
                )}
              >
                <span
                  className={cn(
                    "mt-1 inline-flex h-2 w-2 shrink-0 bg-ember-amber",
                    (status === "recording" || status === "speaking") && "animate-pulse"
                  )}
                />
                <span className="min-w-0">
                  <span className="kicker block">{floatingLauncherEyebrow}</span>
                  <span className="mt-1 block text-sm text-bone-white">
                    {floatingLauncherTitle}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-smoke-gray">
                    {floatingLauncherSubline}
                  </span>
                </span>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </>
  );
}

export function openAssistant(
  prompt?: string,
  autoSubmit = false,
  contextProjectSlug?: string,
  source: OpenEventDetail["source"] = "external"
) {
  dispatchAssistantEvent(
    prompt
      ? {
          prompt,
          autoSubmit,
          contextProjectSlug,
          source
        }
      : {
          contextProjectSlug,
          source
        }
  );
}
