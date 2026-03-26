import fs from "node:fs/promises";
import path from "node:path";

import type { AssistantCorpus } from "@/lib/types";

const assistantCorpusPath = path.join(
  process.cwd(),
  "data",
  "generated",
  "assistant-corpus.json"
);

let cachedAssistantCorpus: AssistantCorpus | null = null;

export async function getAssistantCorpus(): Promise<AssistantCorpus> {
  if (cachedAssistantCorpus) return cachedAssistantCorpus;
  const raw = await fs.readFile(assistantCorpusPath, "utf8");
  cachedAssistantCorpus = JSON.parse(raw) as AssistantCorpus;
  return cachedAssistantCorpus;
}

export function resetAssistantCorpusCache() {
  cachedAssistantCorpus = null;
}
