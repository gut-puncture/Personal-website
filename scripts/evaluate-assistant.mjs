import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const generatedEvalsPath = path.join(root, "data", "generated", "assistant-eval.v2.json");
const legacyEvalsPath = path.join(root, "data", "assistant-eval.json");

function includesCaseInsensitive(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

async function loadEvalCases() {
  try {
    return JSON.parse(await fs.readFile(generatedEvalsPath, "utf8"));
  } catch {
    return JSON.parse(await fs.readFile(legacyEvalsPath, "utf8"));
  }
}

function decisionMatches(expectedDecision, actualDecision) {
  if (!expectedDecision) return true;
  const allowed = Array.isArray(expectedDecision) ? expectedDecision : [expectedDecision];
  return allowed.includes(actualDecision);
}

async function main() {
  if (!process.env.SARVAM_API_KEY) {
    console.error("SARVAM_API_KEY is required to run the live assistant evals.");
    process.exit(1);
  }

  const baseUrl = process.env.ASSISTANT_EVAL_BASE_URL || "http://localhost:3000";
  const filter = process.env.ASSISTANT_EVAL_FILTER?.toLowerCase().trim();
  const limit = Number(process.env.ASSISTANT_EVAL_LIMIT ?? "0");
  let evalCases = await loadEvalCases();
  if (filter) {
    evalCases = evalCases.filter((evalCase) => {
      const haystack = `${evalCase.id} ${evalCase.question}`.toLowerCase();
      return haystack.includes(filter);
    });
  }
  if (Number.isFinite(limit) && limit > 0) {
    evalCases = evalCases.slice(0, limit);
  }
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
        conversationId: evalCase.conversationId ?? `eval-${evalCase.id}`,
        conversationState: evalCase.conversationState,
        currentPageContext: evalCase.currentPageContext,
        turnOrigin: evalCase.turnOrigin
      })
    });

    const latencyMs = Date.now() - startedAt;
    const data = await response.json();
    const replyText = String(data.replyText ?? "");
    const spokenText = String(data.spokenText ?? "");
    const modelUsed = String(data.modelUsed ?? "");
    const decision = String(data.decision ?? "");
    const verifierVerdict = String(data.verifierVerdict ?? "");
    const usedEvidenceIds = Array.isArray(data.usedEvidenceIds) ? data.usedEvidenceIds : [];
    const targetText = evalCase.checkSpokenText ? spokenText : replyText;
    const reasons = [];

    if (modelUsed) {
      modelCounts.set(modelUsed, (modelCounts.get(modelUsed) ?? 0) + 1);
    }

    if (!response.ok) {
      reasons.push(`HTTP ${response.status}`);
    }

    if (!decisionMatches(evalCase.expectedDecision, decision)) {
      reasons.push(
        `expected decision ${JSON.stringify(evalCase.expectedDecision)}, got ${decision || "none"}`
      );
    }

    if (evalCase.requiredAll?.length) {
      for (const required of evalCase.requiredAll) {
        if (!includesCaseInsensitive(targetText, required)) {
          reasons.push(`missing required phrase: ${required}`);
        }
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

    if (evalCase.forbiddenAny?.length) {
      for (const forbidden of evalCase.forbiddenAny) {
        const forbiddenMatch = evalCase.checkSpokenText
          ? includesCaseInsensitive(targetText, forbidden)
          : includesCaseInsensitive(replyText, forbidden) ||
            includesCaseInsensitive(spokenText, forbidden);
        if (forbiddenMatch) {
          reasons.push(`contains forbidden phrase: ${forbidden}`);
        }
      }
    }

    if (evalCase.requiredEvidenceAny?.length) {
      const hasEvidence = evalCase.requiredEvidenceAny.some((requiredId) =>
        usedEvidenceIds.includes(requiredId)
      );
      if (!hasEvidence) {
        reasons.push(
          `missing required evidence id from set: ${evalCase.requiredEvidenceAny.join(", ")}`
        );
      }
    }

    if (evalCase.maxCharacters && replyText.length > evalCase.maxCharacters) {
      reasons.push(`reply too long: ${replyText.length} chars > ${evalCase.maxCharacters}`);
    }

    if (decision === "answer" && verifierVerdict !== "pass") {
      reasons.push(`answer returned with verifierVerdict=${verifierVerdict}`);
    }

    if (includesCaseInsensitive(spokenText, "http") || includesCaseInsensitive(spokenText, "www.")) {
      reasons.push("spokenText contains a raw URL");
    }

    if (includesCaseInsensitive(spokenText, "**")) {
      reasons.push("spokenText still contains markdown emphasis");
    }

    if (reasons.length) {
      failures.push({
        id: evalCase.id,
        latencyMs,
        reasons,
        decision,
        verifierVerdict,
        replyText,
        usedEvidenceIds
      });
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
