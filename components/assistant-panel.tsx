"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import type { AssistantHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AssistantResponse = {
  transcript?: string;
  replyText: string;
  sources: string[];
  audio?: string;
  audioMimeType?: string;
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

type RecorderSession = {
  stream: MediaStream;
  recorder: MediaRecorder;
  chunks: Blob[];
  mimeType: string;
  stopped: Promise<Blob>;
};

const MAX_RECORDING_MS = 25_000;
const REQUEST_TIMEOUT_MS = 35_000;

const starterPrompts = [
  "What kind of role is Shailesh a fit for?",
  "Which projects best show product management and AI skills?",
  "Summarize his strongest work in one minute."
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

function AssistantSurface({
  history,
  latestMessages,
  status,
  remainingTurns,
  draft,
  setDraft,
  notice,
  onSubmit,
  onRecordToggle,
  onStarterPrompt,
  onClose,
  floating
}: {
  history: AssistantHistoryItem[];
  latestMessages: AssistantHistoryItem[];
  status: "idle" | "recording" | "loading" | "speaking" | "error";
  remainingTurns: number;
  draft: string;
  setDraft: (value: string) => void;
  notice: string | null;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onRecordToggle: () => Promise<void>;
  onStarterPrompt: (prompt: string) => Promise<void>;
  onClose?: () => void;
  floating: boolean;
}) {
  return (
    <section
      id={!floating ? "assistant" : undefined}
      className={cn(
        "edge-panel cut-corner overflow-hidden border border-line bg-[linear-gradient(180deg,rgba(15,6,8,0.98),rgba(7,3,4,0.99))]",
        floating && "shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur"
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
              Ask about projects, role fit, or background.
            </h2>
            <p className="max-w-md text-sm leading-7 text-smoke-gray">
              Talk or type for a fast answer.
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
        {history.length === 0 ? (
          <div className="space-y-3">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void onStarterPrompt(prompt)}
                className="font-structure cut-corner flex w-full items-center justify-between border border-line px-4 py-3 text-left text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:border-ember-amber/50 hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.08),transparent_40%)]"
              >
                <span>{prompt}</span>
                <span aria-hidden="true" className="text-ember-amber">
                  /
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "space-y-3 overflow-y-auto pr-1",
              floating ? "max-h-80" : "max-h-[24rem]"
            )}
          >
            {latestMessages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={cn(
                  "px-4 py-3 text-sm leading-7",
                  item.role === "assistant"
                    ? "bg-charcoal-steel text-bone-white"
                    : "bg-graphite-blue/70 text-smoke-gray"
                )}
              >
                {item.content}
              </div>
            ))}
          </div>
        )}

        <div className="font-structure flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-smoke-gray">
          <span>{remainingTurns} turns left</span>
          <span
            className={cn(
              status === "recording" && "text-ember-amber",
              status === "loading" && "text-bone-white"
            )}
          >
            {status === "recording"
              ? "Listening"
              : status === "loading"
                ? "Answering"
                : status === "speaking"
                  ? "Speaking"
                  : status === "error"
                    ? "Retry needed"
                    : "Idle"}
          </span>
        </div>

        {notice ? <p className="text-sm leading-6 text-smoke-gray">{notice}</p> : null}

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about projects, role fit, or background"
            rows={floating ? 3 : 4}
            className="w-full resize-none border border-line bg-charcoal-steel px-4 py-3 text-sm text-bone-white outline-none transition-colors placeholder:text-smoke-gray focus:border-ember-amber/70"
          />

          <div className={cn("flex gap-2", !floating && "md:grid md:grid-cols-[1fr_auto]")}>
            <button
              type="button"
              onClick={() => void onRecordToggle()}
              disabled={remainingTurns <= 0 || status === "loading"}
              className={cn(
                "font-structure cut-corner border px-4 py-3 text-sm uppercase tracking-[0.08em] transition-colors",
                !floating && "md:w-full",
                status === "recording"
                  ? "border-ember-amber bg-ember-amber-soft text-bone-white"
                  : "border-line text-smoke-gray hover:border-ember-amber/60 hover:text-bone-white"
              )}
            >
              {status === "recording" ? "Stop recording" : "Push to talk"}
            </button>
            <button
              type="submit"
              disabled={!draft.trim() || remainingTurns <= 0 || status === "loading"}
              className="font-structure cut-corner bg-ember-amber px-5 py-3 text-sm uppercase tracking-[0.08em] text-bone-white transition-colors hover:bg-[#ff5b3d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="font-structure text-[10px] uppercase tracking-[0.28em] text-smoke-gray">
            Powered by
          </span>
          <img src="/sarvam-logo-white.svg" alt="Sarvam AI" className="h-5 w-auto opacity-90" />
        </div>
      </div>
    </section>
  );
}

export function AssistantPanel({ variant = "floating" }: AssistantPanelProps) {
  const isHero = variant === "hero";
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AssistantHistoryItem[]>([]);
  const [status, setStatus] = useState<
    "idle" | "recording" | "loading" | "speaking" | "error"
  >("idle");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [remainingTurns, setRemainingTurns] = useState(6);
  const stopTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<AssistantHistoryItem[]>([]);
  const recorderSessionRef = useRef<RecorderSession | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
      void teardownRecorder();
    };
  }, []);

  useEffect(() => {
    async function handleOpen(event: Event) {
      const detail = (event as CustomEvent<OpenEventDetail>).detail;
      if (!isHero || window.innerWidth < 1024) {
        setOpen(true);
      }

      if (!detail?.prompt) return;

      if (detail.autoSubmit) {
        await submitTurn({ text: detail.prompt });
      } else {
        setDraft(detail.prompt);
      }
    }

    window.addEventListener("portfolio-assistant:open", handleOpen);
    return () => window.removeEventListener("portfolio-assistant:open", handleOpen);
  }, [isHero]);

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

  async function submitTurn(payload: FormData | { text: string }) {
    setStatus("loading");
    setNotice(
      payload instanceof FormData ? "Transcribing your question and preparing an answer..." : null
    );

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

      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        setStatus("error");
        setRemainingTurns(data.remainingTurns ?? remainingTurns);
        setNotice("Voice hit a snag. You can retry or type the same question.");
        setHistory((current) => [
          ...current,
          { role: "assistant", content: data.replyText || "Something went wrong." }
        ]);
        return;
      }

      setRemainingTurns(data.remainingTurns);
      setNotice(null);

      const nextHistory = [...historyRef.current];
      if (data.transcript) {
        nextHistory.push({ role: "user", content: data.transcript });
      } else if (!(payload instanceof FormData)) {
        nextHistory.push({ role: "user", content: payload.text });
      }

      nextHistory.push({ role: "assistant", content: data.replyText });
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      void playAudioIfPresent(data);
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";

      setStatus("error");
      setNotice(
        aborted
          ? "That took too long. Try once more or send the same question as text."
          : "Voice hit a snag. You can retry or type the same question."
      );
      setHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: aborted
            ? "That request timed out. Please try again, or ask the same question as text."
            : "I hit a temporary issue while processing that request. Please try again, or use text instead."
        }
      ]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function handleTextSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || status === "loading") return;
    setDraft("");
    await submitTurn({ text });
  }

  async function handleStarterPrompt(prompt: string) {
    setDraft("");
    await submitTurn({ text: prompt });
  }

  async function startRecording() {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
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
        chunks,
        mimeType: normalizeAudioMimeType(recorder.mimeType || mimeType || "audio/webm"),
        stopped
      };

      setStatus("recording");
      setNotice("Listening...");

      stopTimeoutRef.current = window.setTimeout(() => {
        void stopRecordingAndSubmit();
      }, MAX_RECORDING_MS);
    } catch {
      setStatus("error");
      setNotice("Mic access failed. Type the question instead.");
    }
  }

  async function stopRecordingAndSubmit() {
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

    const formData = new FormData();
    const extension = getAudioExtension(session.mimeType);
    formData.set("audio", session.blob, `question.${extension}`);
    formData.set("audioMimeType", session.mimeType);
    await submitTurn(formData);
  }

  async function handleRecordToggle() {
    if (status === "recording") {
      await stopRecordingAndSubmit();
      return;
    }

    await startRecording();
  }

  const latestMessages = useMemo(() => history.slice(-6), [history]);
  const floatingLauncherLabel = isHero ? "Voice or text" : "Ask about the work";

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
            latestMessages={latestMessages}
            status={status}
            remainingTurns={remainingTurns}
            draft={draft}
            setDraft={setDraft}
            notice={notice}
            onSubmit={handleTextSubmit}
            onRecordToggle={handleRecordToggle}
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
                latestMessages={latestMessages}
                status={status}
                remainingTurns={remainingTurns}
                draft={draft}
                setDraft={setDraft}
                notice={notice}
                onSubmit={handleTextSubmit}
                onRecordToggle={handleRecordToggle}
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
                  status === "recording" && "animate-pulse"
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
