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
        history: evalCase.history ?? []
      })
    });

    const latencyMs = Date.now() - startedAt;
    const data = await response.json();
    const replyText = String(data.replyText ?? "");
    const spokenText = String(data.spokenText ?? "");
    const reasons = [];

    if (!response.ok) {
      reasons.push(`HTTP ${response.status}`);
    }

    for (const required of evalCase.requiredAll ?? []) {
      if (!includesCaseInsensitive(replyText, required)) {
        reasons.push(`missing required phrase: ${required}`);
      }
    }

    if (evalCase.requiredAny?.length) {
      const hasOne = evalCase.requiredAny.some((required) =>
        includesCaseInsensitive(replyText, required)
      );
      if (!hasOne) {
        reasons.push(`missing any-of phrases: ${evalCase.requiredAny.join(" | ")}`);
      }
    }

    for (const forbidden of evalCase.forbiddenAny ?? []) {
      if (
        includesCaseInsensitive(replyText, forbidden) ||
        includesCaseInsensitive(spokenText, forbidden)
      ) {
        reasons.push(`contains forbidden phrase: ${forbidden}`);
      }
    }

    if (evalCase.maxCharacters && replyText.length > evalCase.maxCharacters) {
      reasons.push(
        `reply too long: ${replyText.length} chars > ${evalCase.maxCharacters}`
      );
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

  console.log("\nAll assistant evals passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
