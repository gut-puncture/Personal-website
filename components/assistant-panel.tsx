"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import type {
  AssistantHistoryItem,
  AssistantTurnOrigin,
  WorkingMemory
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AssistantResponse = {
  transcript?: string;
  replyText: string;
  spokenText?: string;
  sources: string[];
  selectedFactIds?: string[];
  modelUsed?: string;
  nextWorkingMemory?: WorkingMemory;
  remainingTurns: number;
  limitReached: boolean;
  errorCode?: string;
};

type TranscriptionResponse = {
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

type AssistantPanelProps = {
  variant?: "hero" | "floating";
  contextProjectSlug?: string;
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
  history: AssistantHistoryItem[];
  draft: string;
  remainingTurns: number;
  open: boolean;
  workingMemory: WorkingMemory;
  updatedAt: number;
};

type LastAudioState = {
  src: string;
  mimeType: string;
} | null;

const MAX_RECORDING_MS = 25_000;
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_TURNS = 6;
const ASSISTANT_STORAGE_KEY = "portfolio-assistant-state-v5";
const ASSISTANT_STORAGE_TTL_MS = 6 * 60 * 60 * 1000;
const WAVEFORM_POINT_COUNT = 72;
const defaultWaveform = Array.from({ length: WAVEFORM_POINT_COUNT }, () => 0);

const starterPrompts = [
  "What kind of role is Shailesh a fit for?",
  "Which projects best show product management and AI skills?",
  "What is his educational and work background?"
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
      return "Allow mic access";
    case "recording":
      return "Listening";
    case "transcribing":
      return "Transcribing";
    case "grounding":
      return "Selecting context";
    case "composing":
      return "Writing answer";
    case "preparing_voice":
      return "Preparing voice";
    case "ready":
      return "Ready";
    case "speaking":
      return "Speaking";
    case "limit_reached":
      return "Limit reached";
    case "error":
      return "Retry needed";
    default:
      return "Idle";
  }
}

function getStatusDescription(status: AssistantStatus) {
  switch (status) {
    case "arming":
      return "Preparing the mic.";
    case "recording":
      return "Recording live audio from the mic.";
    case "transcribing":
      return "Turning the recording into a clean question.";
    case "grounding":
      return "Selecting the smallest reliable context pack.";
    case "composing":
      return "Writing the answer.";
    case "preparing_voice":
      return "Turning the answer into speech.";
    case "ready":
      return "Answer ready.";
    case "speaking":
      return "Reading the answer out loud.";
    case "limit_reached":
      return "Start a new conversation later.";
    case "error":
      return "Something slipped. Retry or use text.";
    default:
      return "Speak or type for grounded context.";
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
          <p className="font-structure text-[11px] uppercase tracking-[0.3em] text-ember-amber">
            {label}
          </p>
          <p className="text-sm leading-6 text-smoke-gray">{helper}</p>
        </div>
        <p className="font-structure text-sm uppercase tracking-[0.22em] text-bone-white">
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
      label: "Transcript",
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
      label: "Context",
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
      <div className="font-structure flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
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
                "font-structure text-[10px] uppercase tracking-[0.24em] transition-colors",
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

function LatestTurn({
  history,
  pendingUserText,
  hideAssistant = false,
  canReplayAudio = false,
  onReplayAudio
}: {
  history: AssistantHistoryItem[];
  pendingUserText: string | null;
  hideAssistant?: boolean;
  canReplayAudio?: boolean;
  onReplayAudio?: () => Promise<void> | void;
}) {
  const latestUserMessage = [...history].reverse().find((item) => item.role === "user");
  const latestAssistantMessage = [...history].reverse().find(
    (item) => item.role === "assistant"
  );

  const userText = pendingUserText ?? latestUserMessage?.content;

  if (!userText && !latestAssistantMessage) return null;

  return (
    <div className="space-y-3">
      {userText ? (
        <div className="border border-line bg-[rgba(18,8,10,0.88)] px-4 py-4">
          <p className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
            {pendingUserText ? "Transcript" : "Question"}
          </p>
          <p className="mt-2 text-sm leading-7 text-bone-white">{userText}</p>
        </div>
      ) : null}

      {latestAssistantMessage && !hideAssistant ? (
        <div className="border border-line bg-charcoal-steel/76 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <p className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
              Answer
            </p>
            {canReplayAudio && onReplayAudio ? (
              <button
                type="button"
                onClick={() => void onReplayAudio()}
                className="font-structure text-[10px] uppercase tracking-[0.22em] text-smoke-gray transition-colors hover:text-bone-white"
              >
                Play answer
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-bone-white">{latestAssistantMessage.content}</p>
        </div>
      ) : null}
    </div>
  );
}

function getRecordButtonLabel(status: AssistantStatus) {
  switch (status) {
    case "arming":
      return "Allow mic access...";
    case "recording":
      return "Release to send";
    case "transcribing":
    case "grounding":
    case "composing":
    case "preparing_voice":
      return "Working...";
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
  onClose,
  floating,
  hasReplayAudio
}: {
  history: AssistantHistoryItem[];
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
  onClose?: () => void;
  floating: boolean;
  hasReplayAudio: boolean;
}) {
  const showPrompts = history.length === 0 && !pendingUserText && status === "idle";
  const showStatusRail =
    Boolean(pendingUserText) ||
    ["transcribing", "grounding", "composing", "preparing_voice", "ready", "speaking"].includes(
      status
    );
  const busy = isProcessingStatus(status);
  const recordingActive = status === "arming" || status === "recording";

  return (
    <section
      id={!floating ? "assistant" : undefined}
      className={cn(
        "edge-panel cut-corner overflow-hidden border border-line bg-[linear-gradient(180deg,rgba(15,6,8,0.98),rgba(7,3,4,0.995))]",
        floating && "shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur"
      )}
    >
      <div className="border-b border-line px-4 py-4 md:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-structure text-[11px] uppercase tracking-[0.3em] text-smoke-gray">
              Voice agent
            </p>
            <h2
              className={cn(
                "text-bone-white",
                floating ? "text-xl font-medium leading-tight" : "text-[1.9rem] font-medium leading-[1.02]"
              )}
            >
              Ask about projects, background, or role fit.
            </h2>
            <p className="max-w-md text-sm leading-7 text-smoke-gray">
              Speak or type for grounded context from the portfolio and CV.
            </p>
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="font-structure text-[11px] uppercase tracking-[0.22em] text-smoke-gray transition-colors hover:text-bone-white"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
        {showPrompts ? (
          <div className="space-y-3">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void onStarterPrompt(prompt)}
                className="font-structure cut-corner flex w-full items-center justify-between border border-line px-4 py-3 text-left text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:border-ember-amber/50 hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.08),transparent_44%)]"
              >
                <span>{prompt}</span>
                <span aria-hidden="true" className="text-ember-amber">
                  /
                </span>
              </button>
            ))}
          </div>
        ) : (
          <LatestTurn
            history={history}
            pendingUserText={pendingUserText}
            hideAssistant={Boolean(
              pendingUserText && ["transcribing", "grounding", "composing"].includes(status)
            )}
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

        <div className="font-structure flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-smoke-gray">
          <span>{remainingTurns} turns left</span>
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
            placeholder="Ask about projects, skills, background, or role fit"
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
                "font-structure cut-corner border px-4 py-3 text-sm uppercase tracking-[0.08em] transition-colors",
                !floating && "md:w-full",
                recordingActive
                  ? "border-ember-amber bg-ember-amber-soft text-bone-white"
                  : "border-line text-smoke-gray hover:border-ember-amber/60 hover:text-bone-white",
                (busy && !recordingActive) || status === "limit_reached"
                  ? "cursor-not-allowed opacity-50"
                  : undefined
              )}
            >
              {getRecordButtonLabel(status)}
            </button>
            <button
              type="submit"
              disabled={!draft.trim() || busy || status === "limit_reached"}
              className="font-structure cut-corner bg-ember-amber px-5 py-3 text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:bg-[#ff5b3d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
            Powered by Sarvam AI
          </span>
          <img src="/sarvam-logo-white.svg" alt="Sarvam AI" className="h-5 w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}

export function AssistantPanel({
  variant = "floating",
  contextProjectSlug
}: AssistantPanelProps) {
  const isHero = variant === "hero";
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AssistantHistoryItem[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [remainingTurns, setRemainingTurns] = useState(DEFAULT_TURNS);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [waveformSamples, setWaveformSamples] = useState<number[]>(defaultWaveform);
  const [recordingMs, setRecordingMs] = useState(0);
  const [workingMemory, setWorkingMemory] = useState<WorkingMemory>({});
  const [lastAudioState, setLastAudioState] = useState<LastAudioState>(null);

  const stopTimeoutRef = useRef<number | null>(null);
  const stageTimeoutsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<AssistantHistoryItem[]>([]);
  const recorderSessionRef = useRef<RecorderSession | null>(null);
  const waveformSessionRef = useRef<WaveformSession | null>(null);
  const recordPressActiveRef = useRef(false);
  const releaseHandledRef = useRef(false);
  const pointerTargetRef = useRef<HTMLButtonElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const floatingLauncherEyebrow = "Voice agent";
  const floatingLauncherTitle = isHero ? "Talk to the voice agent" : "Talk about this project";
  const floatingLauncherSubline = isHero
    ? "Get project and background context fast."
    : "Get project context without leaving the page.";

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

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

      setHistory(parsed.history ?? []);
      setDraft(parsed.draft ?? "");
      setRemainingTurns(parsed.remainingTurns ?? DEFAULT_TURNS);
      setOpen(Boolean(parsed.open));
      setWorkingMemory(parsed.workingMemory ?? {});
    } catch {
      window.sessionStorage.removeItem(ASSISTANT_STORAGE_KEY);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    const snapshot: PersistedAssistantState = {
      history,
      draft,
      remainingTurns,
      open,
      workingMemory,
      updatedAt: Date.now()
    };

    window.sessionStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(snapshot));
  }, [draft, history, hydrated, open, remainingTurns, workingMemory]);

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
        setNotice("Mic is ready. Hold again to talk.");
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

  function clearStageTimers() {
    for (const timeoutId of stageTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    stageTimeoutsRef.current = [];
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
      setNotice("Answer is ready. Tap play answer to hear it out loud.");
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
                payload.set("history", JSON.stringify(historyRef.current));
                payload.set("workingMemory", JSON.stringify(workingMemory));
                return payload;
              })()
            : JSON.stringify({
                ...payload,
                history: historyRef.current,
                workingMemory
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
    setNotice("Selecting the strongest context for the question.");
    scheduleAnswerStages();

    try {
      const { response, data } = await fetchAssistantResponse({
        mode: "answer",
        transcript: text,
        contextProjectSlug: contextProjectSlugForTurn ?? undefined,
        turnOrigin
      });

      if (!response.ok) {
        clearStageTimers();
        const assistantData = data as AssistantResponse;
        setPendingUserText(null);
        const nextHistory: AssistantHistoryItem[] = [
          ...historyRef.current,
          { role: "user", content: text },
          { role: "assistant", content: assistantData.replyText || "Something went wrong." }
        ];
        historyRef.current = nextHistory;
        setHistory(nextHistory);
        setRemainingTurns(assistantData.remainingTurns ?? remainingTurns);
        setLastAudioState(null);

        if (assistantData.limitReached || response.status === 429) {
          setStatus("limit_reached");
          setNotice("This conversation has reached its limit. Start again later.");
          return;
        }

        setStatus("error");
        setNotice("The assistant hit a snag. Retry, or ask the same thing as text.");
        return;
      }

      clearStageTimers();
      const assistantData = data as AssistantResponse;
      setRemainingTurns(assistantData.remainingTurns);
      setWorkingMemory(assistantData.nextWorkingMemory ?? {});
      setNotice(null);

      const nextHistory: AssistantHistoryItem[] = [...historyRef.current];
      const userText = assistantData.transcript ?? text;
      nextHistory.push({ role: "user", content: userText });
      nextHistory.push({ role: "assistant", content: assistantData.replyText });

      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setPendingUserText(null);

      if (assistantData.limitReached) {
        setStatus("limit_reached");
        setNotice("This conversation has reached its limit. Start again later.");
        return;
      }

      if (shouldAutoSpeak && assistantData.spokenText) {
        setStatus("preparing_voice");
        setNotice("Preparing the voice answer.");

        try {
          const audioState = await requestSpeech(assistantData.spokenText);
          setNotice(null);
          await playAudioFromState(audioState);
        } catch {
          setStatus("ready");
          setNotice("Answer is ready. Tap play answer to hear it out loud.");
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
          ? "That took too long. Try again, or use a shorter question."
          : "The assistant hit a snag. Retry, or use text."
      );
      setPendingUserText(null);
      setLastAudioState(null);
      const nextHistory: AssistantHistoryItem[] = [
        ...historyRef.current,
        { role: "user", content: text },
        {
          role: "assistant",
          content: aborted
            ? "That request timed out. Please try again, or ask the same question more briefly."
            : "I hit a temporary issue while processing that request. Please try again."
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
    setNotice("Turning the recording into a clean question.");

    try {
      const { response, data } = await fetchAssistantResponse(formData);
      const transcriptionData = data as TranscriptionResponse;

      if (!response.ok || !transcriptionData.transcript?.trim()) {
        setStatus("error");
        setNotice("I couldn't transcribe that clearly. Try again or use text.");
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
          ? "Transcription took too long. Try again, or type the same question."
          : "Mic capture worked, but transcription failed. Try again or use text."
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
      setNotice("Voice capture is unavailable here. Type the question instead.");
      return;
    }

    try {
      const mimeType = getRecordingMimeType();
      clearAudioPlayback();
      setStatus("arming");
      setNotice("Allow mic access to start recording.");

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
        setNotice("Mic is ready. Hold again to talk.");
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
      setNotice("Mic access failed. Type the question instead.");
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
      setNotice("Voice capture failed. Try again or type the question instead.");
      return;
    }

    if (session.blob.size < 1_500) {
      setStatus("error");
      setNotice("Too short to transcribe. Try again or type the question instead.");
      return;
    }

    if (reason === "interrupted") {
      setNotice("The page focus changed, but the captured audio is still being processed.");
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
      setNotice("Mic is ready. Hold again to talk.");
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
            floating={false}
            hasReplayAudio={Boolean(lastAudioState)}
          />
        </div>
      ) : null}

      <div
        className={cn(
          isHero
            ? "fixed inset-x-4 z-50 lg:hidden"
            : "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[24rem]",
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
              className={cn(isHero && "overflow-y-auto")}
              style={
                isHero
                  ? {
                      maxHeight: "calc(100svh - env(safe-area-inset-bottom, 0px) - 2rem)"
                    }
                  : undefined
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
                onClose={() => setOpen(false)}
                floating
                hasReplayAudio={Boolean(lastAudioState)}
              />
            </motion.section>
          ) : (
            <motion.button
              key="trigger"
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={() => setOpen(true)}
              className={cn(
                "ml-auto flex w-full items-center gap-3 border border-line bg-[rgba(16,9,10,0.94)] px-4 py-3 text-left shadow-[0_16px_60px_rgba(0,0,0,0.42)] backdrop-blur transition-colors hover:border-line-strong",
                isHero && "mx-auto max-w-none"
              )}
            >
              <span
                className={cn(
                  "mt-1 inline-flex h-2 w-2 shrink-0 bg-ember-amber",
                  (status === "recording" || status === "speaking") && "animate-pulse"
                )}
              />
              <span className="min-w-0">
                <span className="font-structure block text-[11px] uppercase tracking-[0.26em] text-smoke-gray">
                  {floatingLauncherEyebrow}
                </span>
                <span className="mt-1 block text-sm text-bone-white">
                  {floatingLauncherTitle}
                </span>
                <span className="mt-1 block text-xs leading-5 text-smoke-gray">
                  {floatingLauncherSubline}
                </span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
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
