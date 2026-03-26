import { NextResponse } from "next/server";

import { getSessionTurnCount, runAssistantTurn } from "@/lib/assistant";
import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import { createEmptyConversationState } from "@/lib/assistant-state";
import { getSarvamClient } from "@/lib/sarvam";
import type {
  AssistantCurrentPageContext,
  AssistantHistoryItem,
  AssistantTurnOrigin,
  AssistantTurnResponse,
  ConversationState
} from "@/lib/types";

export const runtime = "nodejs";

const HOURLY_LIMIT = Number(process.env.ASSISTANT_HOURLY_LIMIT ?? "12");
const SESSION_LIMIT = Number(process.env.ASSISTANT_SESSION_LIMIT ?? "6");

type AssistantMode = "transcribe" | "answer" | "speak";

type RateStore = Map<string, number[]>;

type ParsedRequest = {
  audio: File | null;
  audioMimeType?: string;
  history: AssistantHistoryItem[];
  conversationId?: string;
  conversationState?: ConversationState;
  mode: AssistantMode;
  text?: string;
  transcript?: string;
  spokenText?: string;
  currentPageContext?: AssistantCurrentPageContext;
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

function parseConversationState(raw: FormDataEntryValue | string | null | undefined) {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    return JSON.parse(raw) as ConversationState;
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

function parseCurrentPageContext(
  raw: FormDataEntryValue | string | null | undefined,
  legacyProjectSlug?: string
) {
  if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw) as AssistantCurrentPageContext;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {}
  }

  if (legacyProjectSlug) {
    return {
      projectSlug: legacyProjectSlug
    };
  }

  return undefined;
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const legacyProjectSlug =
      typeof formData.get("contextProjectSlug") === "string"
        ? String(formData.get("contextProjectSlug"))
        : undefined;

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
      conversationId:
        typeof formData.get("conversationId") === "string"
          ? String(formData.get("conversationId"))
          : undefined,
      conversationState:
        parseConversationState(formData.get("conversationState")) ??
        parseConversationState(formData.get("workingMemory")),
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
      currentPageContext: parseCurrentPageContext(
        formData.get("currentPageContext"),
        legacyProjectSlug
      ),
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
    conversationId?: string;
    conversationState?: ConversationState;
    workingMemory?: ConversationState;
    mode?: AssistantMode;
    currentPageContext?: AssistantCurrentPageContext;
    contextProjectSlug?: string;
    turnOrigin?: AssistantTurnOrigin;
  };

  return {
    audio: null,
    audioMimeType: undefined,
    history: body.history ?? [],
    conversationId: body.conversationId,
    conversationState: body.conversationState ?? body.workingMemory,
    mode: body.mode ?? "answer",
    text: body.text,
    transcript: body.transcript,
    spokenText: body.spokenText,
    currentPageContext:
      body.currentPageContext ??
      (body.contextProjectSlug
        ? {
            projectSlug: body.contextProjectSlug
          }
        : undefined),
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

function buildSystemResponse(
  conversationId: string,
  conversationState: ConversationState | undefined,
  {
    replyText,
    spokenText = replyText,
    remainingTurns,
    limitReached,
    status = 200,
    decision = "abstain",
    errorCode
  }: {
    replyText: string;
    spokenText?: string;
    remainingTurns: number;
    limitReached: boolean;
    status?: number;
    decision?: AssistantTurnResponse["decision"];
    errorCode?: string;
  }
) {
  const nextConversationState = conversationState ?? createEmptyConversationState();

  return NextResponse.json(
    {
      conversationId,
      replyText,
      spokenText,
      sources: [],
      usedEvidenceIds: [],
      selectedFactIds: [],
      decision,
      confidenceBand: "high",
      verifierVerdict: "pass",
      modelUsed: "direct",
      plannerDecision: decision,
      plannerRisk: "low",
      escalationUsed: false,
      nextConversationState,
      nextWorkingMemory: nextConversationState,
      remainingTurns,
      limitReached,
      errorCode
    } satisfies AssistantTurnResponse,
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const parsed = await parseRequest(request);
    const conversationId = parsed.conversationId ?? crypto.randomUUID();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const sessionTurns = getSessionTurnCount(parsed.history);

    if (parsed.mode === "answer" && sessionTurns >= SESSION_LIMIT) {
      return buildSystemResponse(conversationId, parsed.conversationState, {
        replyText:
          "This conversation has reached its limit. Start a new conversation, or use the CV / LinkedIn links on the site for the next step.",
        spokenText:
          "This conversation has reached its limit. Start a new conversation, or use the C V or LinkedIn links on the site for the next step.",
        remainingTurns: 0,
        limitReached: true,
        status: 429,
        errorCode: "session_limit"
      });
    }

    if (parsed.mode === "answer") {
      const rateCheck = registerHit(ip);
      if (!rateCheck.allowed) {
        return buildSystemResponse(conversationId, parsed.conversationState, {
          replyText:
            "The hourly assistant limit has been reached. Please try again later, or use the CV, LinkedIn, or email links on the page.",
          spokenText:
            "The hourly assistant limit has been reached. Please try again later, or use the C V, LinkedIn, or email links on the page.",
          remainingTurns: 0,
          limitReached: true,
          status: 429,
          errorCode: "hourly_limit"
        });
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
            conversationId,
            replyText:
              "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
            spokenText:
              "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
            remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
            limitReached: false,
            errorCode: "transcription_empty"
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        conversationId,
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
            conversationId,
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
            conversationId,
            replyText: "Voice playback is unavailable right now.",
            spokenText: "Voice playback is unavailable right now."
          },
          { status: 502 }
        );
      }
    }

    if (!transcript) {
      return buildSystemResponse(conversationId, parsed.conversationState, {
        replyText:
          "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
        spokenText:
          "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
        remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
        limitReached: false,
        status: 400,
        decision: "clarify",
        errorCode: "empty_turn"
      });
    }

    const execution = await runAssistantTurn({
      query: transcript,
      history: parsed.history,
      conversationId,
      conversationState: parsed.conversationState,
      currentPageContext: parsed.currentPageContext,
      turnOrigin: parsed.turnOrigin
    });
    const remainingTurns = Math.max(0, SESSION_LIMIT - (sessionTurns + 1));

    return NextResponse.json({
      transcript,
      ...execution,
      remainingTurns,
      limitReached: remainingTurns === 0
    } satisfies AssistantTurnResponse & { transcript: string });
  } catch (error) {
    console.error(error);
    const fallbackConversationId = crypto.randomUUID();
    return buildSystemResponse(fallbackConversationId, createEmptyConversationState(), {
      replyText:
        "I hit a temporary issue while processing that request. Please try again.",
      spokenText:
        "I hit a temporary issue while processing that request. Please try again.",
      remainingTurns: 0,
      limitReached: false,
      status: 500,
      errorCode: "server_error"
    });
  }
}
