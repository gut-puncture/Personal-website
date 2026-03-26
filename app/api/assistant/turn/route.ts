import { NextResponse } from "next/server";

import {
  buildAssistantPlan,
  finalizeAssistantReply,
  finalizeWorkingMemory,
  getSessionTurnCount
} from "@/lib/assistant";
import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import { getPortfolioContent } from "@/lib/content";
import { getSarvamClient } from "@/lib/sarvam";
import type {
  AssistantHistoryItem,
  AssistantTurnOrigin,
  WorkingMemory
} from "@/lib/types";

export const runtime = "nodejs";

const HOURLY_LIMIT = Number(process.env.ASSISTANT_HOURLY_LIMIT ?? "12");
const SESSION_LIMIT = Number(process.env.ASSISTANT_SESSION_LIMIT ?? "6");

type SupportedSarvamModel =
  | "sarvam-m"
  | "sarvam-30b"
  | "sarvam-105b";

type SupportedReasoningEffort = "low" | "medium" | "high";

type AssistantMode = "transcribe" | "answer" | "speak";

type RateStore = Map<string, number[]>;

type ParsedRequest = {
  audio: File | null;
  audioMimeType?: string;
  history: AssistantHistoryItem[];
  workingMemory?: WorkingMemory;
  mode: AssistantMode;
  text?: string;
  transcript?: string;
  spokenText?: string;
  contextProjectSlug?: string;
  turnOrigin?: AssistantTurnOrigin;
};

function getRateStore(): RateStore {
  const globalStore = globalThis as typeof globalThis & {
    __portfolioRateStore?: RateStore;
  };
  globalStore.__portfolioRateStore ??= new Map();
  return globalStore.__portfolioRateStore;
}

function registerHit(ip: string) {
  const store = getRateStore();
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const existing = (store.get(ip) ?? []).filter((stamp) => stamp > windowStart);
  if (existing.length >= HOURLY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  existing.push(now);
  store.set(ip, existing);
  return { allowed: true, remaining: HOURLY_LIMIT - existing.length };
}

function parseWorkingMemory(raw: FormDataEntryValue | string | null | undefined) {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    return JSON.parse(raw) as WorkingMemory;
  } catch {
    return undefined;
  }
}

function parseHistory(raw: FormDataEntryValue | string | null | undefined) {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw) as AssistantHistoryItem[];
  } catch {
    return [];
  }
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const audio = formData.get("audio");
    return {
      audio: audio instanceof File ? audio : null,
      audioMimeType: normalizeAudioMimeType(
        typeof formData.get("audioMimeType") === "string"
          ? String(formData.get("audioMimeType"))
          : audio instanceof File
            ? audio.type
            : "audio/webm"
      ),
      history: parseHistory(formData.get("history")),
      workingMemory: parseWorkingMemory(formData.get("workingMemory")),
      mode:
        typeof formData.get("mode") === "string"
          ? (String(formData.get("mode")) as AssistantMode)
          : "answer",
      text: typeof formData.get("text") === "string" ? String(formData.get("text")) : undefined,
      transcript:
        typeof formData.get("transcript") === "string"
          ? String(formData.get("transcript"))
          : undefined,
      spokenText:
        typeof formData.get("spokenText") === "string"
          ? String(formData.get("spokenText"))
          : undefined,
      contextProjectSlug:
        typeof formData.get("contextProjectSlug") === "string"
          ? String(formData.get("contextProjectSlug"))
          : undefined,
      turnOrigin:
        typeof formData.get("turnOrigin") === "string"
          ? (String(formData.get("turnOrigin")) as AssistantTurnOrigin)
          : undefined
    };
  }

  const body = (await request.json()) as {
    text?: string;
    transcript?: string;
    spokenText?: string;
    history?: AssistantHistoryItem[];
    workingMemory?: WorkingMemory;
    mode?: AssistantMode;
    contextProjectSlug?: string;
    turnOrigin?: AssistantTurnOrigin;
  };

  return {
    audio: null,
    audioMimeType: undefined,
    history: body.history ?? [],
    workingMemory: body.workingMemory,
    mode: body.mode ?? "answer",
    text: body.text,
    transcript: body.transcript,
    spokenText: body.spokenText,
    contextProjectSlug: body.contextProjectSlug,
    turnOrigin: body.turnOrigin
  };
}

async function transcribeAudio(file: File, mimeType?: string) {
  const client = getSarvamClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const normalizedMimeType = normalizeAudioMimeType(mimeType ?? file.type);
  const stt = await client.speechToText.transcribe({
    file: new File([buffer], file.name || `question.${getAudioExtension(normalizedMimeType)}`, {
      type: normalizedMimeType
    }),
    model: "saaras:v3",
    mode: "translate",
    language_code: "unknown"
  } as never);
  return stt.transcript.trim();
}

async function synthesizeSpeech(text: string) {
  const client = getSarvamClient();
  const speech = await client.textToSpeech.convert({
    model: "bulbul:v3",
    text,
    speaker: "anand",
    target_language_code: "en-IN"
  } as never);

  return {
    audio: speech.audios?.[0],
    audioMimeType: "audio/wav"
  };
}

function getFastModel() {
  return normalizeSarvamModel(process.env.SARVAM_CHAT_MODEL_FAST, "sarvam-30b");
}

function getStrongModel() {
  return normalizeSarvamModel(
    process.env.SARVAM_CHAT_MODEL_STRONG ?? process.env.SARVAM_CHAT_MODEL,
    "sarvam-105b"
  );
}

function getReasoningEffort() {
  return (process.env.SARVAM_REASONING_EFFORT ?? "medium") as SupportedReasoningEffort;
}

function normalizeSarvamModel(
  value: string | undefined,
  fallback: SupportedSarvamModel
): SupportedSarvamModel {
  switch (value) {
    case "sarvam-m":
    case "sarvam-30b":
    case "sarvam-105b":
      return value;
    case "sarvam-30b-16k":
      return "sarvam-30b";
    case "sarvam-105b-32k":
      return "sarvam-105b";
    default:
      return fallback;
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseRequest(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const sessionTurns = getSessionTurnCount(parsed.history);

    if (parsed.mode === "answer" && sessionTurns >= SESSION_LIMIT) {
      return NextResponse.json(
        {
          replyText:
            "This conversation has reached its limit. The best next step is to open Shailesh's CV or contact him on LinkedIn.",
          spokenText:
            "This conversation has reached its limit. The best next step is to open Shailesh's C V or contact him on LinkedIn.",
          sources: [],
          selectedFactIds: [],
          modelUsed: "direct",
          nextWorkingMemory: parsed.workingMemory ?? {},
          remainingTurns: 0,
          limitReached: true
        },
        { status: 429 }
      );
    }

    if (parsed.mode === "answer") {
      const rateCheck = registerHit(ip);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            replyText:
              "The hourly assistant limit has been reached. Please try again later, or use the CV, LinkedIn, or email links on the page.",
            spokenText:
              "The hourly assistant limit has been reached. Please try again later, or use the C V, LinkedIn, or email links on the page.",
            sources: [],
            selectedFactIds: [],
            modelUsed: "direct",
            nextWorkingMemory: parsed.workingMemory ?? {},
            remainingTurns: 0,
            limitReached: true
          },
          { status: 429 }
        );
      }
    }

    let transcript = parsed.transcript?.trim() ?? parsed.text?.trim() ?? "";

    if (parsed.audio && parsed.mode !== "speak") {
      transcript = await transcribeAudio(parsed.audio, parsed.audioMimeType);
    }

    if (parsed.mode === "transcribe") {
      if (!transcript) {
        return NextResponse.json(
          {
            replyText:
              "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
            spokenText:
              "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
            remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
            limitReached: false
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        transcript,
        remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
        limitReached: false
      });
    }

    if (parsed.mode === "speak") {
      const text = (parsed.spokenText ?? parsed.text ?? "").trim();
      if (!text) {
        return NextResponse.json(
          {
            replyText: "I need text before I can prepare voice.",
            spokenText: "I need text before I can prepare voice."
          },
          { status: 400 }
        );
      }

      try {
        const audio = await synthesizeSpeech(text);
        return NextResponse.json(audio);
      } catch {
        return NextResponse.json(
          {
            replyText: "Voice playback is unavailable right now.",
            spokenText: "Voice playback is unavailable right now."
          },
          { status: 502 }
        );
      }
    }

    if (!transcript) {
      return NextResponse.json(
        {
          replyText:
            "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
          spokenText:
            "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
          sources: [],
          selectedFactIds: [],
          modelUsed: "direct",
          nextWorkingMemory: parsed.workingMemory ?? {},
          remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
          limitReached: false
        },
        { status: 400 }
      );
    }

    const content = await getPortfolioContent();
    const plan = buildAssistantPlan(transcript, content, {
      contextProjectSlug: parsed.contextProjectSlug,
      workingMemory: parsed.workingMemory,
      turnOrigin: parsed.turnOrigin
    });
    const remainingTurns = Math.max(0, SESSION_LIMIT - (sessionTurns + 1));

    if (plan.kind === "direct") {
      return NextResponse.json({
        transcript,
        replyText: plan.replyText,
        spokenText: plan.spokenText,
        sources: plan.sources,
        selectedFactIds: plan.selectedFactIds,
        modelUsed: "direct",
        nextWorkingMemory: finalizeWorkingMemory(plan, plan.replyText),
        remainingTurns,
        limitReached: remainingTurns === 0
      });
    }

    const client = getSarvamClient();
    const model = plan.modelPreference === "strong" ? getStrongModel() : getFastModel();
    const completion = await client.chat.completions({
      model,
      reasoning_effort: getReasoningEffort(),
      temperature: 0.2,
      max_tokens: 220,
      seed: 7,
      messages: [
        {
          role: "system",
          content: plan.system
        },
        {
          role: "user",
          content: plan.user
        }
      ]
    });

    const { replyText, spokenText } = finalizeAssistantReply(
      completion.choices?.[0]?.message?.content?.trim() ||
        "I couldn't assemble a reliable answer from the portfolio context."
    );

    return NextResponse.json({
      transcript,
      replyText,
      spokenText,
      sources: plan.sources,
      selectedFactIds: plan.selectedFactIds,
      modelUsed: model,
      escalationReason: plan.escalationReason,
      nextWorkingMemory: finalizeWorkingMemory(plan, replyText),
      remainingTurns,
      limitReached: remainingTurns === 0
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        replyText:
          "I hit a temporary issue while processing that request. Please try again.",
        spokenText:
          "I hit a temporary issue while processing that request. Please try again.",
        sources: [],
        selectedFactIds: [],
        modelUsed: "direct",
        nextWorkingMemory: {},
        remainingTurns: 0,
        limitReached: false
      },
      { status: 500 }
    );
  }
}
