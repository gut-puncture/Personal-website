import { NextResponse } from "next/server";

import {
  buildAssistantPlan,
  finalizeAssistantReply,
  getSessionTurnCount
} from "@/lib/assistant";
import { getAudioExtension, normalizeAudioMimeType } from "@/lib/audio";
import { getPortfolioContent } from "@/lib/content";
import { getSarvamClient } from "@/lib/sarvam";
import type { AssistantHistoryItem } from "@/lib/types";

export const runtime = "nodejs";

const HOURLY_LIMIT = Number(process.env.ASSISTANT_HOURLY_LIMIT ?? "12");
const SESSION_LIMIT = Number(process.env.ASSISTANT_SESSION_LIMIT ?? "6");
type SupportedSarvamModel =
  | "sarvam-m"
  | "sarvam-30b"
  | "sarvam-30b-16k"
  | "sarvam-105b"
  | "sarvam-105b-32k";
type SupportedReasoningEffort = "low" | "medium" | "high";

type RateStore = Map<string, number[]>;

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

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const historyRaw = formData.get("history");
    return {
      audio: audio instanceof File ? audio : null,
      audioMimeType: normalizeAudioMimeType(
        typeof formData.get("audioMimeType") === "string"
          ? String(formData.get("audioMimeType"))
          : audio instanceof File
            ? audio.type
            : "audio/webm"
      ),
      mode: typeof formData.get("mode") === "string" ? String(formData.get("mode")) : "answer",
      returnAudio:
        typeof formData.get("returnAudio") === "string"
          ? String(formData.get("returnAudio")) === "true"
          : false,
      history:
        typeof historyRaw === "string"
          ? (JSON.parse(historyRaw) as AssistantHistoryItem[])
          : []
    };
  }

  const body = (await request.json()) as {
    text?: string;
    history?: AssistantHistoryItem[];
    returnAudio?: boolean;
  };

  return {
    text: body.text ?? "",
    history: body.history ?? [],
    mode: "answer",
    returnAudio: body.returnAudio ?? false,
    audio: null as File | null,
    audioMimeType: undefined
  };
}

export async function POST(request: Request) {
  let sessionTurns = 0;

  try {
    const parsed = await parseRequest(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    sessionTurns = getSessionTurnCount(parsed.history);

    if (sessionTurns >= SESSION_LIMIT) {
      return NextResponse.json(
        {
          replyText:
            "This conversation has reached its limit. The best next step is to open Shailesh's CV or contact him on LinkedIn.",
          sources: [],
          remainingTurns: 0,
          limitReached: true
        },
        { status: 429 }
      );
    }

    if (parsed.mode !== "transcribe") {
      const rateCheck = registerHit(ip);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            replyText:
              "The hourly assistant limit has been reached. Please try again later, or use the CV, LinkedIn, or email links on the page.",
            spokenText:
              "The hourly assistant limit has been reached. Please try again later, or use the CV, LinkedIn, or email links on the page.",
            sources: [],
            remainingTurns: 0,
            limitReached: true
          },
          { status: 429 }
        );
      }
    }

    let transcript = parsed.text?.trim() ?? "";
    const shouldReturnAudio = parsed.returnAudio || Boolean(parsed.audio);

    if (parsed.audio) {
      const client = getSarvamClient();
      const buffer = Buffer.from(await parsed.audio.arrayBuffer());
      const mimeType = normalizeAudioMimeType(parsed.audioMimeType ?? parsed.audio.type);
      const stt = await client.speechToText.transcribe({
        file: new File([buffer], parsed.audio.name || `question.${getAudioExtension(mimeType)}`, {
          type: mimeType
        }),
        model: "saaras:v3",
        mode: "translate",
        language_code: "unknown"
      } as never);
      transcript = stt.transcript.trim();
    }

    if (!transcript) {
      return NextResponse.json(
        {
          replyText:
            "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
          spokenText:
            "I couldn't hear a clear question there. Please try recording again, or type the question instead.",
          sources: [],
          remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
          limitReached: false
        },
        { status: 400 }
      );
    }

    if (parsed.mode === "transcribe") {
      return NextResponse.json({
        transcript,
        remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
        limitReached: false
      });
    }

    const content = await getPortfolioContent();
    const plan = buildAssistantPlan(transcript, parsed.history, content);
    const remainingTurns = Math.max(0, SESSION_LIMIT - (sessionTurns + 1));

    if (plan.kind === "direct") {
      let audio: string | undefined;
      let audioMimeType: string | undefined;

      if (shouldReturnAudio) {
        try {
          const client = getSarvamClient();
          const speech = await client.textToSpeech.convert({
            model: "bulbul:v3",
            text: plan.spokenText,
            speaker: "anand",
            target_language_code: "en-IN"
          } as never);
          audio = speech.audios?.[0];
          audioMimeType = "audio/wav";
        } catch {
          audio = undefined;
          audioMimeType = undefined;
        }
      }

      return NextResponse.json({
        transcript,
        replyText: plan.replyText,
        spokenText: plan.spokenText,
        sources: plan.sources,
        audio,
        audioMimeType,
        remainingTurns,
        limitReached: remainingTurns === 0
      });
    }

    const client = getSarvamClient();
    const model = (process.env.SARVAM_CHAT_MODEL ||
      "sarvam-105b-32k") as SupportedSarvamModel;
    const reasoningEffort = (process.env.SARVAM_REASONING_EFFORT ||
      "medium") as SupportedReasoningEffort;
    const completion = await client.chat.completions({
      model,
      reasoning_effort: reasoningEffort,
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

    let audio: string | undefined;
    let audioMimeType: string | undefined;

    if (shouldReturnAudio) {
      try {
        const speech = await client.textToSpeech.convert({
          model: "bulbul:v3",
          text: spokenText,
          speaker: "anand",
          target_language_code: "en-IN"
        } as never);
        audio = speech.audios?.[0];
        audioMimeType = "audio/wav";
      } catch {
        audio = undefined;
        audioMimeType = undefined;
      }
    }

    return NextResponse.json({
      transcript,
      replyText,
      spokenText,
      sources: plan.sources,
      audio,
      audioMimeType,
      remainingTurns,
      limitReached: remainingTurns === 0
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The assistant hit a temporary problem.";

    return NextResponse.json(
      {
        replyText:
          "The assistant hit a temporary issue. You can still use the page directly, or jump to LinkedIn and the CV from the contact section.",
        spokenText:
          "The assistant hit a temporary issue. You can still use the page directly, or jump to LinkedIn and the CV from the contact section.",
        sources: [],
        remainingTurns: Math.max(0, SESSION_LIMIT - sessionTurns),
        limitReached: false,
        errorCode: message
      },
      { status: 500 }
    );
  }
}
