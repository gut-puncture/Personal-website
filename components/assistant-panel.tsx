"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import type { AssistantHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AssistantResponse = {
  transcript?: string;
  replyText: string;
  spokenText?: string;
  sources: string[];
  audio?: string;
  audioMimeType?: string;
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

type AssistantPanelProps = {
  variant?: "hero" | "floating";
};

type OpenEventDetail = {
  prompt?: string;
  autoSubmit?: boolean;
};

type AssistantStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "finding_context"
  | "writing_answer"
  | "speaking"
  | "error";

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

const MAX_RECORDING_MS = 25_000;
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_TURNS = 6;
const WAVEFORM_BAR_COUNT = 20;
const waveformMidpoint = (WAVEFORM_BAR_COUNT - 1) / 2;
const defaultWaveform = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
  const distanceFromCenter = Math.abs(index - waveformMidpoint) / waveformMidpoint;
  return 0.18 + (1 - distanceFromCenter) * 0.18;
});

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

function dispatchAssistantEvent(detail?: { prompt?: string; autoSubmit?: boolean }) {
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
    case "recording":
      return "Listening";
    case "transcribing":
      return "Transcribing";
    case "finding_context":
      return "Finding context";
    case "writing_answer":
      return "Writing answer";
    case "speaking":
      return "Speaking";
    case "error":
      return "Retry needed";
    default:
      return "Idle";
  }
}

function getStatusDescription(status: AssistantStatus) {
  switch (status) {
    case "recording":
      return "Recording live audio from the mic.";
    case "transcribing":
      return "Turning the recording into a clean question.";
    case "finding_context":
      return "Pulling the strongest portfolio and CV context.";
    case "writing_answer":
      return "Assembling a short, recruiter-ready answer.";
    case "speaking":
      return "Reading the answer out loud.";
    case "error":
      return "Something slipped. Retry or use text.";
    default:
      return "Talk or type for a direct answer.";
  }
}

function isProcessingStatus(status: AssistantStatus) {
  return (
    status === "transcribing" ||
    status === "finding_context" ||
    status === "writing_answer"
  );
}

function WaveformBars({
  levels,
  emphasis = "idle"
}: {
  levels: number[];
  emphasis?: "idle" | "recording" | "speaking";
}) {
  return (
    <div className="flex h-28 items-center justify-center gap-1 overflow-hidden">
      {levels.map((level, index) => (
        <span
          key={`${index}-${level}`}
          className={cn(
            "block h-full w-full max-w-[12px] rounded-full transition-[height,background-color,opacity] duration-150",
            emphasis === "recording"
              ? "bg-[linear-gradient(180deg,rgba(255,213,203,0.95),rgba(255,67,35,0.95))]"
              : emphasis === "speaking"
                ? "bg-[linear-gradient(180deg,rgba(255,244,238,0.9),rgba(245,232,222,0.62))]"
                : "bg-white/14"
          )}
          style={{
            height: `${Math.max(16, Math.round(level * 112))}px`,
            opacity: emphasis === "idle" ? 0.55 : 0.95
          }}
        />
      ))}
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
      complete: transcriptVisible || status !== "transcribing"
    },
    {
      key: "finding_context",
      label: "Context",
      active: status === "finding_context",
      complete: status === "writing_answer" || status === "speaking"
    },
    {
      key: "writing_answer",
      label: "Answer",
      active: status === "writing_answer",
      complete: status === "speaking"
    },
    {
      key: "speaking",
      label: "Voice",
      active: status === "speaking",
      complete: false
    }
  ];

  return (
    <div className="space-y-3 border border-line bg-charcoal-steel/60 px-4 py-4">
      <div className="font-structure flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
        <span>{getStatusLabel(status)}</span>
        <span>{getStatusDescription(status)}</span>
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
                step.active ? "text-bone-white" : step.complete ? "text-smoke-gray" : "text-smoke-gray-soft"
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
  hideAssistant = false
}: {
  history: AssistantHistoryItem[];
  pendingUserText: string | null;
  hideAssistant?: boolean;
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
          <p className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
            Answer
          </p>
          <p className="mt-2 text-sm leading-7 text-bone-white">{latestAssistantMessage.content}</p>
        </div>
      ) : null}
    </div>
  );
}

function RecordingTakeover({
  levels,
  elapsedMs,
  onStop
}: {
  levels: number[];
  elapsedMs: number;
  onStop: () => Promise<void>;
}) {
  return (
    <div className="space-y-5 border border-line bg-[linear-gradient(180deg,rgba(16,6,9,0.9),rgba(10,4,5,0.96))] px-4 py-5 md:px-5 md:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-structure text-[11px] uppercase tracking-[0.3em] text-ember-amber">
            Recording live
          </p>
          <p className="text-lg leading-tight text-bone-white">Hold to record. Release to answer.</p>
        </div>
        <p className="font-structure text-sm uppercase tracking-[0.24em] text-bone-white">
          {formatRecordingTime(elapsedMs)}
        </p>
      </div>

      <WaveformBars levels={levels} emphasis="recording" />

      <div className="flex items-center justify-between gap-3">
        <p className="max-w-sm text-sm leading-6 text-smoke-gray">
          The recording stops automatically at 25 seconds, or you can stop it now.
        </p>
        <button
          type="button"
          onClick={() => void onStop()}
          className="font-structure cut-corner border border-ember-amber bg-ember-amber-soft px-4 py-3 text-sm uppercase tracking-[0.12em] text-bone-white transition-colors hover:bg-ember-amber/18"
        >
          Stop and answer
        </button>
      </div>
    </div>
  );
}

function AssistantSurface({
  history,
  status,
  remainingTurns,
  draft,
  setDraft,
  notice,
  pendingUserText,
  waveformLevels,
  recordingMs,
  onSubmit,
  onRecordPressStart,
  onRecordPressEnd,
  onStopRecording,
  onStarterPrompt,
  onClose,
  floating
}: {
  history: AssistantHistoryItem[];
  status: AssistantStatus;
  remainingTurns: number;
  draft: string;
  setDraft: (value: string) => void;
  notice: string | null;
  pendingUserText: string | null;
  waveformLevels: number[];
  recordingMs: number;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onRecordPressStart: () => Promise<void>;
  onRecordPressEnd: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onStarterPrompt: (prompt: string) => Promise<void>;
  onClose?: () => void;
  floating: boolean;
}) {
  const showPrompts = history.length === 0 && !pendingUserText && status === "idle";
  const showProgress = isProcessingStatus(status) || status === "speaking";
  const busy = isProcessingStatus(status) || status === "recording";

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
              Quick answers
            </p>
            <h2
              className={cn(
                "text-bone-white",
                floating ? "text-xl font-medium leading-tight" : "text-[1.9rem] font-medium leading-[1.02]"
              )}
            >
              Ask about projects, role fit, background, or what stands out.
            </h2>
            <p className="max-w-md text-sm leading-7 text-smoke-gray">
              Talk or type for a sharp answer on the work.
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
        {status === "recording" ? (
          <RecordingTakeover
            levels={waveformLevels}
            elapsedMs={recordingMs}
            onStop={onStopRecording}
          />
        ) : (
          <>
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
                hideAssistant={Boolean(pendingUserText && isProcessingStatus(status))}
              />
            )}

            {showProgress ? (
              <StatusRail
                status={status}
                transcriptVisible={Boolean(pendingUserText)}
              />
            ) : null}
          </>
        )}

        <div className="font-structure flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-smoke-gray">
          <span>{remainingTurns} turns left</span>
          <span
            className={cn(
              status === "recording" && "text-ember-amber",
              showProgress && "text-bone-white"
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        {notice ? <p className="text-sm leading-6 text-smoke-gray">{notice}</p> : null}

        {status !== "recording" ? (
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about projects, skills, background, or role fit"
              rows={floating ? 3 : 4}
              className="w-full resize-none border border-line bg-charcoal-steel px-4 py-3 text-sm text-bone-white outline-none transition-colors placeholder:text-smoke-gray focus:border-ember-amber/70"
            />

            <div className={cn("flex gap-2", !floating && "md:grid md:grid-cols-[1fr_auto]")}>
              <button
                type="button"
                onPointerDown={() => void onRecordPressStart()}
                onPointerUp={() => void onRecordPressEnd()}
                onPointerCancel={() => void onRecordPressEnd()}
                onKeyDown={(event) => {
                  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                    event.preventDefault();
                    void onRecordPressStart();
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    void onRecordPressEnd();
                  }
                }}
                disabled={remainingTurns <= 0 || busy}
                className={cn(
                  "font-structure cut-corner border px-4 py-3 text-sm uppercase tracking-[0.08em] transition-colors",
                  !floating && "md:w-full",
                  "border-line text-smoke-gray hover:border-ember-amber/60 hover:text-bone-white disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Hold to talk
              </button>
              <button
                type="submit"
                disabled={!draft.trim() || remainingTurns <= 0 || busy}
                className="font-structure cut-corner bg-ember-amber px-5 py-3 text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:bg-[#ff5b3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        ) : null}

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
            Powered by Sarvam AI
          </span>
          <div className="flex items-center gap-2">
            <img src="/sarvam-logo-white.svg" alt="Sarvam AI" className="h-5 w-auto opacity-90" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AssistantPanel({ variant = "floating" }: AssistantPanelProps) {
  const isHero = variant === "hero";
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AssistantHistoryItem[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [remainingTurns, setRemainingTurns] = useState(DEFAULT_TURNS);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(defaultWaveform);
  const [recordingMs, setRecordingMs] = useState(0);

  const stopTimeoutRef = useRef<number | null>(null);
  const stageTimeoutsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<AssistantHistoryItem[]>([]);
  const recorderSessionRef = useRef<RecorderSession | null>(null);
  const waveformSessionRef = useRef<WaveformSession | null>(null);
  const recordPressActiveRef = useRef(false);
  const shouldStopAfterStartRef = useRef(false);
  const recordReleaseHandledRef = useRef(false);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      clearStageTimers();
      void teardownRecorder();
      void teardownWaveform();
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;

    const handleRelease = () => {
      void handleRecordPressEnd();
    };

    window.addEventListener("pointerup", handleRelease);
    window.addEventListener("pointercancel", handleRelease);
    return () => {
      window.removeEventListener("pointerup", handleRelease);
      window.removeEventListener("pointercancel", handleRelease);
    };
  }, [status]);

  useEffect(() => {
    async function handleOpen(event: Event) {
      const detail = (event as CustomEvent<OpenEventDetail>).detail;
      if (!isHero || window.innerWidth < 1024) {
        setOpen(true);
      }

      if (!detail?.prompt) return;

      if (detail.autoSubmit) {
        await submitTextTurn(detail.prompt, false);
      } else {
        setDraft(detail.prompt);
      }
    }

    window.addEventListener("portfolio-assistant:open", handleOpen);
    return () => window.removeEventListener("portfolio-assistant:open", handleOpen);
  }, [isHero]);

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
        setStatus((current) => (current === "finding_context" ? "writing_answer" : current));
      }, 1200)
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

    setWaveformLevels(defaultWaveform);
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

  async function playAudioIfPresent(response: AssistantResponse) {
    if (!response.audio || !response.audioMimeType) {
      setStatus("idle");
      return;
    }

    const src = `data:${response.audioMimeType};base64,${response.audio}`;
    if (!audioRef.current) {
      setStatus("idle");
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = src;
    try {
      await audioRef.current.play();
      setStatus("speaking");
    } catch {
      setStatus("idle");
    }
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
                return payload;
              })()
            : JSON.stringify({ ...payload, history: historyRef.current }),
        headers:
          payload instanceof FormData
            ? undefined
            : {
                "Content-Type": "application/json"
              },
        signal: controller.signal
      });

      const data = (await response.json()) as AssistantResponse | TranscriptionResponse;
      return { response, data };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function submitTextTurn(text: string, returnAudio: boolean) {
    setPendingUserText(text);
    setStatus("finding_context");
    setNotice("Pulling the strongest context for the question.");
    scheduleAnswerStages();

    try {
      const { response, data } = await fetchAssistantResponse({
        text,
        returnAudio
      });
      const assistantData = data as AssistantResponse;

      if (!response.ok) {
        clearStageTimers();
        setStatus("error");
        setRemainingTurns(assistantData.remainingTurns ?? remainingTurns);
        setNotice("The assistant hit a snag. Retry, or ask the same thing as text.");
        setPendingUserText(null);
        setHistory((current) => [
          ...current,
          { role: "user", content: text },
          { role: "assistant", content: assistantData.replyText || "Something went wrong." }
        ]);
        return;
      }

      clearStageTimers();
      setRemainingTurns(assistantData.remainingTurns);
      setNotice(null);

      const nextHistory = [...historyRef.current];
      const userText = assistantData.transcript ?? text;
      nextHistory.push({ role: "user", content: userText });
      nextHistory.push({ role: "assistant", content: assistantData.replyText });

      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setPendingUserText(null);
      void playAudioIfPresent(assistantData);
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
      setHistory((current) => [
        ...current,
        { role: "user", content: text },
        {
          role: "assistant",
          content: aborted
            ? "That request timed out. Please try again, or ask the same question more briefly."
            : "I hit a temporary issue while processing that request. Please try again."
        }
      ]);
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
    if (!text || isProcessingStatus(status) || status === "recording") return;
    setDraft("");
    await submitTextTurn(text, false);
  }

  async function handleStarterPrompt(prompt: string) {
    setDraft("");
    await submitTextTurn(prompt, false);
  }

  function startWaveform(stream: MediaStream) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

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

      const halfCount = WAVEFORM_BAR_COUNT / 2;
      const bucketSize = Math.max(1, Math.floor(data.length / halfCount));
      const mirroredLevels = Array.from({ length: halfCount }, (_, index) => {
        const start = index * bucketSize;
        const slice = data.slice(start, start + bucketSize);
        const amplitude =
          slice.reduce((sum, value) => sum + Math.abs(value - 128), 0) /
          Math.max(1, slice.length) /
          128;
        const centerBias = 0.78 + ((index + 1) / halfCount) * 0.34;
        return Math.max(0.16, amplitude * centerBias * 1.85);
      });

      const nextLevels = [...mirroredLevels, ...mirroredLevels.slice().reverse()];

      setWaveformLevels(nextLevels);
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

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
      setNotice("Listening live. Release when the question is complete.");

      stopTimeoutRef.current = window.setTimeout(() => {
        void stopRecordingAndSubmit();
      }, MAX_RECORDING_MS);

      if (shouldStopAfterStartRef.current || !recordPressActiveRef.current) {
        shouldStopAfterStartRef.current = false;
        await stopRecordingAndSubmit();
      }
    } catch {
      recordPressActiveRef.current = false;
      shouldStopAfterStartRef.current = false;
      recordReleaseHandledRef.current = true;
      setStatus("error");
      setNotice("Mic access failed. Type the question instead.");
    }
  }

  async function stopRecordingAndSubmit() {
    recordPressActiveRef.current = false;
    recordReleaseHandledRef.current = true;
    shouldStopAfterStartRef.current = false;

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
      setNotice("I couldn't hear enough audio. Try again or type the question instead.");
      return;
    }

    const transcript = await transcribeRecording(session.blob, session.mimeType);
    if (!transcript) return;
    await submitTextTurn(transcript, true);
  }

  async function handleRecordPressStart() {
    if (remainingTurns <= 0 || isProcessingStatus(status) || status === "recording") return;
    recordPressActiveRef.current = true;
    shouldStopAfterStartRef.current = false;
    recordReleaseHandledRef.current = false;
    await startRecording();
  }

  async function handleRecordPressEnd() {
    if (recordReleaseHandledRef.current) return;
    if (!recordPressActiveRef.current && status !== "recording") return;
    recordReleaseHandledRef.current = true;
    recordPressActiveRef.current = false;

    if (status === "recording") {
      await stopRecordingAndSubmit();
      return;
    }

    shouldStopAfterStartRef.current = true;
  }

  const floatingLauncherLabel = isHero ? "Quick answers" : "Ask about the work";
  const pulsingWaveform = useMemo(
    () =>
      defaultWaveform.map((level, index) =>
        status === "speaking" ? level + ((index % 4) + 1) * 0.02 : level
      ),
    [status]
  );

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setStatus("idle")}
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
            waveformLevels={status === "speaking" ? pulsingWaveform : waveformLevels}
            recordingMs={recordingMs}
            onSubmit={handleTextSubmit}
            onRecordPressStart={handleRecordPressStart}
            onRecordPressEnd={handleRecordPressEnd}
            onStopRecording={stopRecordingAndSubmit}
            onStarterPrompt={handleStarterPrompt}
            floating={false}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-[24rem]",
          isHero && "lg:hidden"
        )}
      >
        <AnimatePresence initial={false}>
          {open ? (
            <motion.section
              key="panel"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              <AssistantSurface
                history={history}
                status={status}
                remainingTurns={remainingTurns}
                draft={draft}
                setDraft={setDraft}
                notice={notice}
                pendingUserText={pendingUserText}
                waveformLevels={status === "speaking" ? pulsingWaveform : waveformLevels}
                recordingMs={recordingMs}
                onSubmit={handleTextSubmit}
                onRecordPressStart={handleRecordPressStart}
                onRecordPressEnd={handleRecordPressEnd}
                onStopRecording={stopRecordingAndSubmit}
                onStarterPrompt={handleStarterPrompt}
                onClose={() => setOpen(false)}
                floating
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
              className="ml-auto flex w-full items-center gap-3 border border-line bg-[rgba(16,9,10,0.94)] px-4 py-3 text-left shadow-[0_16px_60px_rgba(0,0,0,0.42)] backdrop-blur transition-colors hover:border-line-strong"
            >
              <span
                className={cn(
                  "inline-flex h-2 w-2 bg-ember-amber",
                  (status === "recording" || status === "speaking") && "animate-pulse"
                )}
              />
              <span>
                <span className="font-structure block text-[11px] uppercase tracking-[0.26em] text-smoke-gray">
                  Quick answers
                </span>
                <span className="block text-sm text-bone-white">{floatingLauncherLabel}</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export function openAssistant(prompt?: string, autoSubmit = false) {
  dispatchAssistantEvent(
    prompt
      ? {
          prompt,
          autoSubmit
        }
      : undefined
  );
}
