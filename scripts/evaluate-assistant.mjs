// Asks the running site's voice agent every question in data/assistant-eval.json and
// checks each answer. Needs the dev server running with SARVAM_API_KEY set.
//   npm run dev            (one terminal)
//   npm run eval:assistant (another)
// Optional: ASSISTANT_EVAL_FILTER=wisdom to run matching cases only.

import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ASSISTANT_EVAL_BASE_URL || "http://localhost:3000";
const filter = process.env.ASSISTANT_EVAL_FILTER?.toLowerCase().trim();

const includes = (text, needle) => text.toLowerCase().includes(needle.toLowerCase());

function check(evalCase, data, status) {
  const reply = String(data.replyText ?? "");
  const spoken = String(data.spokenText ?? "");
  const reasons = [];

  if (status !== 200) reasons.push(`HTTP ${status} (${data.errorCode ?? "no error code"})`);
  if (!reply) reasons.push("empty answer");

  for (const required of evalCase.requiredAll ?? []) {
    if (!includes(reply, required)) reasons.push(`missing: ${required}`);
  }
  if (evalCase.requiredAny?.length && !evalCase.requiredAny.some((item) => includes(reply, item))) {
    reasons.push(`none of: ${evalCase.requiredAny.join(" | ")}`);
  }
  if (evalCase.requiredAnyTwo?.length && !evalCase.requiredAnyTwo.some((item) => includes(reply, item))) {
    reasons.push(`none of: ${evalCase.requiredAnyTwo.join(" | ")}`);
  }
  for (const forbidden of evalCase.forbiddenAny ?? []) {
    if (includes(reply, forbidden)) reasons.push(`contains: ${forbidden}`);
  }
  // A year such as 2026 is fine; any other figure would have to be made up.
  if (evalCase.forbidDigits && /\d/.test(reply.replace(/\b20\d{2}\b/g, ""))) {
    reasons.push("contains a figure it cannot know");
  }
  if (evalCase.maxWords && reply.split(/\s+/).length > evalCase.maxWords) {
    reasons.push(`${reply.split(/\s+/).length} words; limit ${evalCase.maxWords}`);
  }
  if (/[*#_`]|https?:\/\//.test(reply)) reasons.push("contains markdown or a web address");
  if (/https?:\/\/|[*#`]/.test(spoken)) reasons.push("spoken text contains markdown or a web address");
  if (evalCase.expectSource && !(data.sources ?? []).some((source) => source.href === evalCase.expectSource)) {
    reasons.push(`no link to ${evalCase.expectSource}`);
  }
  if (data.corrected) reasons.push("note: the grounding check had to correct this answer");

  return reasons;
}

async function main() {
  let cases = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "data", "assistant-eval.json"), "utf8")
  );
  if (filter) cases = cases.filter((item) => `${item.id} ${item.question}`.toLowerCase().includes(filter));

  console.log(`Asking ${cases.length} questions at ${baseUrl}\n`);
  const latencies = [];
  let failed = 0;

  for (const evalCase of cases) {
    const startedAt = Date.now();
    let status = 0;
    let data = {};
    try {
      const response = await fetch(`${baseUrl}/api/assistant/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `eval-${evalCase.id}` },
        body: JSON.stringify({
          text: evalCase.question,
          history: evalCase.history ?? [],
          conversationId: `eval-${evalCase.id}`,
          currentPageContext: evalCase.currentPageContext
        })
      });
      status = response.status;
      data = await response.json();
    } catch (error) {
      data = { replyText: "", errorCode: String(error) };
    }
    const seconds = (Date.now() - startedAt) / 1000;
    latencies.push(seconds);

    const reasons = check(evalCase, data, status);
    const problems = reasons.filter((reason) => !reason.startsWith("note:"));
    if (problems.length) failed += 1;

    console.log(`${problems.length ? "FAIL" : "ok  "} ${evalCase.id}  (${seconds.toFixed(1)} s, ${data.modelUsed ?? "?"})`);
    console.log(`     Q: ${evalCase.question}`);
    console.log(`     A: ${data.replyText ?? ""}`);
    for (const reason of reasons) console.log(`     - ${reason}`);
    console.log("");

    if (data.errorCode === "not_configured") {
      console.error("The site has no SARVAM_API_KEY. Add it to .env.local and restart the dev server.");
      process.exit(1);
    }
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  console.log(
    `${cases.length - failed} of ${cases.length} passed. Median answer time ${median.toFixed(1)} s, slowest ${(sorted.at(-1) ?? 0).toFixed(1)} s.`
  );
  process.exit(failed ? 1 : 0);
}

main();
