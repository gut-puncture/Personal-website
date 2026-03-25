import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const evalsPath = path.join(root, "data", "assistant-eval.json");

function includesCaseInsensitive(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

async function main() {
  if (!process.env.SARVAM_API_KEY) {
    console.error("SARVAM_API_KEY is required to run the live assistant evals.");
    process.exit(1);
  }

  const baseUrl = process.env.ASSISTANT_EVAL_BASE_URL || "http://localhost:3000";
  const evalCases = JSON.parse(await fs.readFile(evalsPath, "utf8"));
  const failures = [];
  const modelCounts = new Map();

  console.log(`Running ${evalCases.length} assistant evals against ${baseUrl}`);

  for (const evalCase of evalCases) {
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/api/assistant/turn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: evalCase.question,
        history: evalCase.history ?? [],
        workingMemory: evalCase.workingMemory,
        contextProjectSlug: evalCase.contextProjectSlug,
        turnOrigin: evalCase.turnOrigin
      })
    });

    const latencyMs = Date.now() - startedAt;
    const data = await response.json();
    const replyText = String(data.replyText ?? "");
    const spokenText = String(data.spokenText ?? "");
    const selectedFactIds = Array.isArray(data.selectedFactIds) ? data.selectedFactIds : [];
    const modelUsed = String(data.modelUsed ?? "");
    const targetText = evalCase.checkSpokenText ? spokenText : replyText;
    const reasons = [];

    if (modelUsed) {
      modelCounts.set(modelUsed, (modelCounts.get(modelUsed) ?? 0) + 1);
    }

    if (!response.ok) {
      reasons.push(`HTTP ${response.status}`);
    }

    for (const required of evalCase.requiredAll ?? []) {
      if (!includesCaseInsensitive(targetText, required)) {
        reasons.push(`missing required phrase: ${required}`);
      }
    }

    if (evalCase.requiredAny?.length) {
      const hasOne = evalCase.requiredAny.some((required) =>
        includesCaseInsensitive(targetText, required)
      );
      if (!hasOne) {
        reasons.push(`missing any-of phrases: ${evalCase.requiredAny.join(" | ")}`);
      }
    }

    for (const forbidden of evalCase.forbiddenAny ?? []) {
      const forbiddenMatch = evalCase.checkSpokenText
        ? includesCaseInsensitive(targetText, forbidden)
        : includesCaseInsensitive(replyText, forbidden) ||
          includesCaseInsensitive(spokenText, forbidden);
      if (forbiddenMatch) {
        reasons.push(`contains forbidden phrase: ${forbidden}`);
      }
    }

    if (evalCase.maxCharacters && replyText.length > evalCase.maxCharacters) {
      reasons.push(
        `reply too long: ${replyText.length} chars > ${evalCase.maxCharacters}`
      );
    }

    for (const factId of evalCase.requiredFactIds ?? []) {
      if (!selectedFactIds.includes(factId)) {
        reasons.push(`missing required fact id: ${factId}`);
      }
    }

    if (evalCase.expectedModelUsed && modelUsed !== evalCase.expectedModelUsed) {
      reasons.push(`expected modelUsed=${evalCase.expectedModelUsed}, got ${modelUsed || "none"}`);
    }

    if (evalCase.allowedModels?.length && !evalCase.allowedModels.includes(modelUsed)) {
      reasons.push(`modelUsed ${modelUsed || "none"} not in allowed set: ${evalCase.allowedModels.join(", ")}`);
    }

    if (includesCaseInsensitive(spokenText, "http") || includesCaseInsensitive(spokenText, "www.")) {
      reasons.push("spokenText contains a raw URL");
    }

    if (includesCaseInsensitive(spokenText, "**")) {
      reasons.push("spokenText still contains markdown emphasis");
    }

    if (reasons.length) {
      failures.push({ id: evalCase.id, latencyMs, reasons, replyText, spokenText });
      console.log(`FAIL ${evalCase.id} (${latencyMs} ms)`);
      for (const reason of reasons) {
        console.log(`  - ${reason}`);
      }
    } else {
      console.log(`PASS ${evalCase.id} (${latencyMs} ms)`);
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} eval(s) failed.`);
    process.exit(1);
  }

  if (modelCounts.size) {
    console.log("\nModel usage:");
    for (const [model, count] of [...modelCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${model}: ${count}`);
    }
  }

  console.log("\nAll assistant evals passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
