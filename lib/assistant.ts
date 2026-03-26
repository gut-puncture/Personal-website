import { getAssistantCorpus } from "@/lib/assistant-corpus";
import { getSarvamClient } from "@/lib/sarvam";
import {
  createConversationId,
  createEmptyConversationState,
  normalizeConversationState
} from "@/lib/assistant-state";
import type {
  AnswerDraft,
  AssistantConfidenceBand,
  AssistantCurrentPageContext,
  AssistantDecision,
  AssistantHistoryItem,
  AssistantRiskBand,
  AssistantTurnOrigin,
  AssistantTurnResponse,
  ConversationState,
  EvidenceChunk,
  PlannerResult,
  QuestionShape,
  RawFallbackExcerpt,
  VerifierResult,
  VerifierVerdict,
  WorkingMemory
} from "@/lib/types";

const SESSION_FALLBACK_MESSAGE =
  "I don’t have enough grounded portfolio context to answer that reliably. Ask about a specific project, background detail, or role-fit angle and I’ll stay inside that.";

const portfolioKeywords = new Set([
  "shailesh",
  "rana",
  "portfolio",
  "project",
  "projects",
  "background",
  "role",
  "fit",
  "datasutram",
  "data",
  "sutram",
  "product",
  "management",
  "pm",
  "manager",
  "research",
  "resume",
  "cv",
  "linkedin",
  "company",
  "experience",
  "education",
  "ai",
  "agent",
  "paper",
  "demo",
  "recruiter",
  "hiring",
  "candidate",
  "note"
]);

const unsupportedPersonalKeywords = [
  "family",
  "wife",
  "married",
  "girlfriend",
  "boyfriend",
  "relationship",
  "personal life",
  "religion",
  "politics",
  "address",
  "age"
];

const transcriptRepairPatterns: Array<[RegExp, string]> = [
  [/\b(shellish|shellies|shalish|shaylesh|shailes|shaillesh|shelish|saleesh)\b/gi, "Shailesh"],
  [/\b(datasatram|datasutrm|datasutramm)\b/gi, "Data Sutram"],
  [/\bcastle\b/gi, "CaaStle"],
  [/\bhow many years of product management experience the shailesh have\b/gi, "How many years of product management experience does Shailesh have"],
  [/\bwhat is how many years of product management experience\b/gi, "How many years of product management experience"]
];

const speechLexicon: Array<[RegExp, string]> = [
  [
    /How a 7-Billion-Parameter AI Cannot Add/gi,
    "the seven billion parameter addition interpretability project"
  ],
  [/\b7-?Billion-Parameter\b/gi, "seven billion parameter"],
  [/\bSaaS\b/g, "software as a service"],
  [/\bB2B\b/g, "business to business"],
  [/\bQ-?commerce\b/gi, "quick commerce"],
  [/\bLLM\b/g, "large language model"],
  [/\bRAG\b/g, "retrieval augmented generation"],
  [/\bGPT-4\b/gi, "G P T four"],
  [/\bv2\.0\b/gi, "version 2"],
  [/\bCaaStle\b/g, "Castle"]
];

const referentialSignals = [
  "it",
  "that",
  "this",
  "this project",
  "that project",
  "that one",
  "the other one",
  "the other",
  "same one",
  "go deeper",
  "tell me more",
  "why does it matter",
  "what about it",
  "what about that",
  "limitation",
  "tradeoff",
  "trade off"
];

const rewriteSignals = [
  "shorter",
  "plain english",
  "less salesy",
  "less hype",
  "rewrite",
  "rephrase",
  "simplify",
  "make it tighter",
  "make it crisp",
  "one sentence",
  "more direct",
  "not salesy"
];

const synthesisSignals = [
  "recruiter",
  "note",
  "compare",
  "comparison",
  "why",
  "matter",
  "matters",
  "strongest",
  "best",
  "which project",
  "projects",
  "summary",
  "summarize",
  "write",
  "role fit",
  "fit for",
  "limitation",
  "tradeoff",
  "trade off",
  "plain english",
  "less salesy",
  "shorter"
];

type SupportedSarvamModel = "sarvam-m" | "sarvam-30b" | "sarvam-105b";
type SupportedReasoningEffort = "low" | "medium" | "high";

type PolicyReply = {
  decision: AssistantDecision;
  answer: string;
  answerType: "identity" | "contact" | "clarification" | "abstention";
  confidenceBand: AssistantConfidenceBand;
  verifierVerdict: VerifierVerdict;
  usedEvidenceIds: string[];
  sources: string[];
};

type RetrievedEvidence = {
  id: string;
  kind: EvidenceChunk["kind"] | "fallback";
  label: string;
  text: string;
  source: string;
  sourceHref?: string;
  projectSlug?: string;
  company?: string;
  keywords: string[];
  entityTags: string[];
  score: number;
};

type AssistantTurnInput = {
  query: string;
  history: AssistantHistoryItem[];
  conversationId: string;
  conversationState?: ConversationState;
  currentPageContext?: AssistantCurrentPageContext;
  turnOrigin?: AssistantTurnOrigin;
};

type AssistantTurnExecution = Omit<
  AssistantTurnResponse,
  "remainingTurns" | "limitReached" | "transcript"
>;

type PlannerPromptInput = {
  query: string;
  normalizedQuery: string;
  currentPageContext?: AssistantCurrentPageContext;
  state: ConversationState;
  recentHistory: AssistantHistoryItem[];
  candidateProjectSlugs: string[];
  dossierProjectList: string;
};

type CanonicalFactRecord = {
  id: string;
  category: string;
  value: string;
  certainty?: string;
  entity?: string;
  keywords?: string[];
};

function normalizeForMatch(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeForMatch(text).split(" ").filter(Boolean);
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => {
    const normalizedPattern = normalizeForMatch(pattern);
    if (!normalizedPattern) return false;
    const escaped = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^| )${escaped}(?:$| )`).test(text);
  });
}

function sanitizeParagraph(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_`#>~]+/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSpeechTerms(text: string) {
  return speechLexicon.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  );
}

function sanitizeForSpeech(text: string) {
  return normalizeSpeechTerms(
    sanitizeParagraph(text)
      .replace(/\bhttps?:\/\/\S+/gi, "")
      .replace(/\bwww\.\S+/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function repairTranscriptForRouting(text: string) {
  return transcriptRepairPatterns.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  );
}

function summarizeForMemory(text: string) {
  const cleaned = sanitizeParagraph(text);
  if (!cleaned) return null;
  const sentence = cleaned.split(/(?<=[.?!])\s+/)[0] ?? cleaned;
  return sentence.slice(0, 240);
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

function getSessionTurnCount(history: AssistantHistoryItem[]) {
  return history.filter((item) => item.role === "user").length;
}

export { getSessionTurnCount };

function getRecentHistory(history: AssistantHistoryItem[]) {
  return history.slice(-4);
}

function renderRecentHistory(history: AssistantHistoryItem[]) {
  if (!history.length) return "No prior conversation.";
  return history
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${sanitizeParagraph(item.content)}`)
    .join("\n");
}

function isRewritePrompt(normalizedQuery: string) {
  return includesAny(normalizedQuery, rewriteSignals);
}

function isReferentialQuery(normalizedQuery: string) {
  if (normalizedQuery.split(" ").length <= 5 && /^(it|that|this)\b/.test(normalizedQuery)) {
    return true;
  }
  return includesAny(normalizedQuery, referentialSignals);
}

function detectPolicyReply(normalizedQuery: string): PolicyReply | null {
  if (!normalizedQuery) {
    return {
      decision: "clarify",
      answer:
        "Ask about a specific project, Shailesh’s background, current role, or role fit and I’ll stay grounded in the portfolio.",
      answerType: "clarification",
      confidenceBand: "high",
      verifierVerdict: "pass",
      usedEvidenceIds: [],
      sources: ["/#projects"]
    };
  }

  if (
    includesAny(normalizedQuery, [
      "are you shailesh",
      "who are you",
      "are you the actual person",
      "site assistant",
      "actual person or the site assistant",
      "who am i talking to",
      "are you ai",
      "are you an ai",
      "are you a bot"
    ])
  ) {
    return {
      decision: "answer",
      answer: "I’m the portfolio voice agent for Shailesh Rana, not Shailesh himself.",
      answerType: "identity",
      confidenceBand: "high",
      verifierVerdict: "pass",
      usedEvidenceIds: [],
      sources: ["/"]
    };
  }

  if (includesAny(normalizedQuery, ["contact", "email", "linkedin", "cv", "resume"])) {
    return {
      decision: "answer",
      answer: "The cleanest next step is the LinkedIn, CV, or email links on the site.",
      answerType: "contact",
      confidenceBand: "high",
      verifierVerdict: "pass",
      usedEvidenceIds: [],
      sources: ["/#contact"]
    };
  }

  if (
    includesAny(normalizedQuery, [
      "reach him",
      "reach shailesh",
      "best way to reach",
      "best way to contact",
      "how do i reach",
      "how do i contact"
    ])
  ) {
    return {
      decision: "answer",
      answer: "The cleanest next step is the LinkedIn, CV, or email links on the site.",
      answerType: "contact",
      confidenceBand: "high",
      verifierVerdict: "pass",
      usedEvidenceIds: [],
      sources: ["/#contact"]
    };
  }

  if (includesAny(normalizedQuery, unsupportedPersonalKeywords)) {
    return {
      decision: "abstain",
      answer:
        "I can help with portfolio-grounded background, project, and role-fit questions, but I don’t have reliable information about that private personal topic.",
      answerType: "abstention",
      confidenceBand: "high",
      verifierVerdict: "pass",
      usedEvidenceIds: [],
      sources: ["/#contact"]
    };
  }

  return null;
}

function countTokenOverlap(queryTokens: string[], candidateTokens: string[]) {
  const candidateSet = new Set(candidateTokens);
  return [...new Set(queryTokens)].reduce(
    (count, token) => count + (candidateSet.has(token) ? 1 : 0),
    0
  );
}

function isSimpleCanonicalFactQuery(normalizedQuery: string) {
  if (!normalizedQuery) return false;
  if (isRewritePrompt(normalizedQuery) || isReferentialQuery(normalizedQuery)) return false;
  if (includesAny(normalizedQuery, synthesisSignals)) return false;
  return true;
}

function isBroadEducationQuery(normalizedQuery: string) {
  if (
    !includesAny(normalizedQuery, [
      "what did he study",
      "what does he study",
      "studied",
      "education",
      "degree",
      "degrees",
      "academic background"
    ])
  ) {
    return false;
  }

  return !includesAny(normalizedQuery, [
    "mba",
    "finance",
    "engineering",
    "metallurgical",
    "pec",
    "panjab university",
    "university business school"
  ]);
}

function scoreCanonicalFactMatch(
  normalizedQuery: string,
  queryTokens: string[],
  fact: CanonicalFactRecord
) {
  const keywords = fact.keywords ?? [];
  let score = countTokenOverlap(
    queryTokens,
    tokenize(`${fact.value} ${fact.category} ${fact.entity ?? ""}`)
  );

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForMatch(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.split(" ").length >= 2 ? 10 : 5;
    }

    score += countTokenOverlap(queryTokens, tokenize(keyword)) * 2;
  }

  if (
    fact.id === "background.pm-years" &&
    includesAny(normalizedQuery, [
      "how many years",
      "pm experience",
      "product management experience",
      "yoe"
    ])
  ) {
    score += 12;
  }

  if (
    fact.id === "background.previous-role" &&
    includesAny(normalizedQuery, [
      "before product management",
      "before becoming a pm",
      "before becoming pm",
      "before he became a pm",
      "before he became pm"
    ])
  ) {
    score += 12;
  }

  if (
    fact.id === "role.current" &&
    includesAny(normalizedQuery, [
      "current role",
      "current job",
      "where does he work",
      "where does he work now",
      "what company does he work at",
      "what does he do now"
    ])
  ) {
    score += 12;
  }

  if (
    fact.id === "role.current-scope" &&
    includesAny(normalizedQuery, ["responsibilities", "scope", "what does he own"])
  ) {
    score += 12;
  }

  if (
    fact.id === "research.interests" &&
    includesAny(normalizedQuery, [
      "what research is he into",
      "research interests",
      "what is he researching",
      "research"
    ])
  ) {
    score += 12;
  }

  if (
    fact.id === "education.mba" &&
    includesAny(normalizedQuery, ["mba", "finance degree", "business school"])
  ) {
    score += 12;
  }

  if (
    fact.id === "education.be" &&
    includesAny(normalizedQuery, ["metallurgical engineering", "engineering degree", "pec"])
  ) {
    score += 12;
  }

  if (fact.category === "education" && isBroadEducationQuery(normalizedQuery)) {
    score += 8;
  }

  return score;
}

function buildDeterministicFactFallback({
  normalizedQuery,
  facts
}: {
  normalizedQuery: string;
  facts: CanonicalFactRecord[];
}) {
  if (!isSimpleCanonicalFactQuery(normalizedQuery)) return null;

  const educationFacts = facts.filter((fact) => fact.category === "education");
  if (isBroadEducationQuery(normalizedQuery) && educationFacts.length >= 2) {
    const orderedFacts = ["education.be", "education.mba"]
      .map((id) => educationFacts.find((fact) => fact.id === id))
      .filter((fact): fact is CanonicalFactRecord => Boolean(fact));

    if (orderedFacts.length >= 2) {
      return {
        decision: "answer" as const,
        answer: orderedFacts.map((fact) => fact.value).join(" "),
        usedEvidenceIds: orderedFacts.map((fact) => fact.id),
        answerType: "fact" as const,
        confidenceBand: "high" as const,
        reason: "Resolved from explicit education facts."
      };
    }
  }

  const queryTokens = tokenize(normalizedQuery);
  const rankedFacts = facts
    .map((fact) => ({
      fact,
      score: scoreCanonicalFactMatch(normalizedQuery, queryTokens, fact)
    }))
    .filter((item) => item.score > 0 && item.fact.certainty !== "implicit")
    .sort((left, right) => right.score - left.score);

  const top = rankedFacts[0];
  const second = rankedFacts[1];

  if (!top) return null;
  if (top.score < 12) return null;
  if (second && top.score < second.score + 4) return null;

  return {
    decision: "answer" as const,
    answer: top.fact.value,
    usedEvidenceIds: [top.fact.id],
    answerType: "fact" as const,
    confidenceBand: "high" as const,
    reason: "Resolved from a uniquely matching canonical fact."
  };
}

function getProjectAliasScore(
  slug: string,
  normalizedQuery: string,
  projectAliases: Record<string, string[]>
) {
  const aliases = projectAliases[slug] ?? [];
  return aliases.reduce((best, alias) => {
    const normalizedAlias = normalizeForMatch(alias);
    if (!normalizedAlias || !normalizedQuery.includes(normalizedAlias)) return best;
    const aliasTokens = normalizedAlias.split(" ").length;
    const exactBonus = normalizedAlias === normalizedQuery ? 30 : 0;
    return Math.max(best, aliasTokens * 8 + normalizedAlias.length + exactBonus);
  }, 0);
}

function getDeterministicProjectCandidates(
  normalizedQuery: string,
  projectAliases: Record<string, string[]>,
  state: ConversationState,
  currentPageContext?: AssistantCurrentPageContext
) {
  const candidates = Object.keys(projectAliases)
    .map((slug) => ({
      slug,
      score:
        getProjectAliasScore(slug, normalizedQuery, projectAliases) +
        (currentPageContext?.projectSlug === slug && isReferentialQuery(normalizedQuery) ? 18 : 0) +
        (state.lastProjectSlugs.includes(slug) && isReferentialQuery(normalizedQuery) ? 15 : 0)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.slug);

  if (!candidates.length && currentPageContext?.projectSlug && isReferentialQuery(normalizedQuery)) {
    return [currentPageContext.projectSlug];
  }

  if (!candidates.length && state.lastProjectSlugs.length && isReferentialQuery(normalizedQuery)) {
    return state.lastProjectSlugs.slice(0, 2);
  }

  return candidates.slice(0, 4);
}

function getQuestionShapeFallback(normalizedQuery: string): QuestionShape {
  if (isRewritePrompt(normalizedQuery)) return "rewrite";
  if (normalizedQuery.includes("compare") || normalizedQuery.includes(" vs ")) return "compare";
  if (isReferentialQuery(normalizedQuery)) return "follow_up";
  if (
    includesAny(normalizedQuery, [
      "how many years",
      "how long",
      "years of",
      "duration",
      "number of years"
    ])
  ) {
    return "count_or_duration";
  }
  if (normalizedQuery.includes("project") || normalizedQuery.includes("demo") || normalizedQuery.includes("paper")) {
    return "project";
  }
  return "summary";
}

function hasPortfolioSignal({
  normalizedQuery,
  candidateProjectSlugs,
  state,
  currentPageContext
}: {
  normalizedQuery: string;
  candidateProjectSlugs: string[];
  state: ConversationState;
  currentPageContext?: AssistantCurrentPageContext;
}) {
  return (
    candidateProjectSlugs.length > 0 ||
    Boolean(currentPageContext?.projectSlug) ||
    tokenize(normalizedQuery).some((token) => portfolioKeywords.has(token)) ||
    includesAny(normalizedQuery, [
      "recruiter",
      "hiring manager",
      "candidate",
      "role fit",
      "fit for",
      "write a note",
      "note on him",
      "note on her",
      "background",
      "career"
    ]) ||
    state.lastResolvedEntities.length > 0
  );
}

function getSlotsFallback(normalizedQuery: string) {
  const slots: string[] = [];

  if (includesAny(normalizedQuery, ["role fit", "what kind of role", "fit for"])) {
    slots.push("role_fit");
  }
  if (includesAny(normalizedQuery, ["recruiter", "hiring manager", "why should i care"])) {
    slots.push("recruiter_framing");
  }
  if (includesAny(normalizedQuery, ["compare", "versus", "vs"])) {
    slots.push("comparison");
  }
  if (includesAny(normalizedQuery, ["limitation", "tradeoff", "risk"])) {
    slots.push("limitations");
  }
  if (includesAny(normalizedQuery, ["plain english", "shorter", "rewrite", "simplify"])) {
    slots.push("rewrite");
  }
  if (!slots.length) {
    slots.push("direct_answer");
  }

  return slots;
}

function buildPlannerFallback({
  query,
  normalizedQuery,
  candidateProjectSlugs,
  currentPageContext,
  state
}: PlannerPromptInput): PlannerResult {
  const shape = getQuestionShapeFallback(normalizedQuery);
  const hasSignal = hasPortfolioSignal({
    normalizedQuery,
    candidateProjectSlugs,
    state,
    currentPageContext
  });

  if (shape === "follow_up" && !candidateProjectSlugs.length && !state.lastResolvedEntities.length) {
    return {
      decision: "clarify",
      rationale: "The query reads like a follow-up but does not contain a reliable referent.",
      questionType: "follow_up",
      domain: "portfolio",
      risk: "low",
      resolvedEntities: [],
      candidateProjectSlugs: [],
      slots: ["referent"],
      retrievalQuery: query,
      needsFallbackEvidence: false,
      needsStrongModel: false,
      clarificationQuestion: "Which project or topic do you want me to focus on?"
    };
  }

  if (!hasSignal) {
    return {
      decision: "abstain",
      rationale: "The query does not appear to be about the portfolio domain.",
      questionType: "edge_case",
      domain: "out_of_domain",
      risk: "low",
      resolvedEntities: [],
      candidateProjectSlugs: [],
      slots: [],
      retrievalQuery: query,
      needsFallbackEvidence: false,
      needsStrongModel: false
    };
  }

  return {
    decision: "answer",
    rationale: "The query is in domain and can be answered from dossier plus retrieved evidence.",
    questionType: shape,
    domain: "portfolio",
    risk:
      shape === "compare" || includesAny(normalizedQuery, ["recruiter", "role fit", "balanced"])
        ? "high"
        : candidateProjectSlugs.length > 1 || shape === "follow_up"
          ? "medium"
          : "low",
    resolvedEntities: candidateProjectSlugs.map((slug) => `project:${slug}`),
    candidateProjectSlugs,
    slots: getSlotsFallback(normalizedQuery),
    retrievalQuery: query,
    needsFallbackEvidence: includesAny(normalizedQuery, [
      "tradeoff",
      "limitation",
      "architecture",
      "go deeper",
      "more detail"
    ]),
    needsStrongModel: includesAny(normalizedQuery, [
      "compare",
      "versus",
      "recruiter",
      "role fit",
      "balanced",
      "skeptical"
    ])
  };
}

function buildPlannerPrompt(input: PlannerPromptInput) {
  const system = [
    "You are the planner for a portfolio-domain grounded QA assistant.",
    "The assistant only answers about Shailesh Rana's portfolio, projects, background, current role, and recruiter-fit questions.",
    "Recruiter notes, hiring-manager summaries, role-fit questions, and skeptical-summary prompts are in domain when they are grounded in the portfolio evidence.",
    "Resolve follow-ups from recent conversation, explicit page context, and prior conversation state when possible.",
    "Choose answer when the query is grounded and answerable from the portfolio domain.",
    "Choose clarify when a referent or requested comparison is ambiguous.",
    "Choose abstain when the query is outside the portfolio domain or would require guessing.",
    "Return strict JSON only with keys:",
    'decision, rationale, questionType, domain, risk, resolvedEntities, candidateProjectSlugs, slots, retrievalQuery, needsFallbackEvidence, needsStrongModel, clarificationQuestion.'
  ].join(" ");

  const user = [
    `Question: ${input.query}`,
    `Normalized question: ${input.normalizedQuery}`,
    `Current page project: ${input.currentPageContext?.projectSlug ?? "none"}`,
    `Recent conversation:\n${renderRecentHistory(input.recentHistory)}`,
    `Conversation state: lastResolvedEntities=${input.state.lastResolvedEntities.join(", ") || "none"}; lastProjectSlugs=${input.state.lastProjectSlugs.join(", ") || "none"}; pendingSlots=${input.state.pendingSlots.join(", ") || "none"}; lastQuestionType=${input.state.lastQuestionType ?? "none"}.`,
    `Candidate projects: ${input.candidateProjectSlugs.join(", ") || "none"}`,
    `Project roster:\n${input.dossierProjectList}`
  ].join("\n\n");

  return { system, user };
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim(),
    trimmed
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {}
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

function extractFieldWithRegex(raw: string, pattern: RegExp) {
  const match = raw.match(pattern);
  return match?.[1] ?? null;
}

function parseStructuredFields(raw: string) {
  const fields = new Map<string, string>();
  let currentKey: string | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*[:=]\s*(.*)$/);
    if (fieldMatch) {
      currentKey = fieldMatch[1].toLowerCase();
      fields.set(currentKey, fieldMatch[2].trim());
      continue;
    }

    if (currentKey && line.trim()) {
      fields.set(currentKey, `${fields.get(currentKey) ?? ""} ${line.trim()}`.trim());
    }
  }

  return fields;
}

function parseStructuredList(value: string | undefined) {
  if (!value) return [];
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => item.replace(/["'\s]/g, "").trim())
    .filter(Boolean);
}

function readBooleanLike(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  if (/^true$/i.test(value.trim())) return true;
  if (/^false$/i.test(value.trim())) return false;
  return fallback;
}

function extractDraftFromTruncatedJson(raw: string): AnswerDraft | null {
  const decision = extractFieldWithRegex(raw, /"decision"\s*:\s*"(answer|clarify|abstain)"/i);
  const answer = extractFieldWithRegex(raw, /"answer"\s*:\s*"((?:\\.|[^"])*)"/i);

  if (!decision || !answer) return null;

  const usedEvidenceRaw =
    extractFieldWithRegex(raw, /"usedEvidenceIds"\s*:\s*\[([^\]]*)\]/i) ?? "";
  const usedEvidenceIds = usedEvidenceRaw
    .split(",")
    .map((item) => item.replace(/["\s]/g, "").trim())
    .filter(Boolean);
  const answerType =
    extractFieldWithRegex(raw, /"answerType"\s*:\s*"([^"]+)"/i) ?? "fact";
  const confidenceBand =
    extractFieldWithRegex(raw, /"confidenceBand"\s*:\s*"(low|medium|high)"/i) ?? "medium";
  const reason =
    extractFieldWithRegex(raw, /"reason"\s*:\s*"((?:\\.|[^"])*)"/i) ??
    "Recovered answer from truncated JSON.";

  return {
    decision: readDecision(decision, "abstain"),
    answer: sanitizeParagraph(answer.replace(/\\"/g, '"')) || SESSION_FALLBACK_MESSAGE,
    usedEvidenceIds,
    answerType: answerType as AnswerDraft["answerType"],
    confidenceBand: readConfidence(confidenceBand, "medium"),
    reason: sanitizeParagraph(reason.replace(/\\"/g, '"'))
  };
}

function extractDraftFromStructuredText(raw: string): AnswerDraft | null {
  const fields = parseStructuredFields(raw);
  const decision = fields.get("decision");
  const answer = fields.get("answer");

  if (!decision || !answer) return null;

  const usedEvidenceIds = parseStructuredList(fields.get("usedevidenceids"));
  const answerType = fields.get("answertype") ?? "fact";
  const confidenceBand = fields.get("confidenceband") ?? "medium";
  const reason = fields.get("reason") ?? "Recovered answer from structured key-value output.";

  return {
    decision: readDecision(decision, "abstain"),
    answer: sanitizeParagraph(answer) || SESSION_FALLBACK_MESSAGE,
    usedEvidenceIds,
    answerType: answerType.trim() as AnswerDraft["answerType"],
    confidenceBand: readConfidence(confidenceBand, "medium"),
    reason: sanitizeParagraph(reason)
  };
}

function readDecision(value: unknown, fallback: AssistantDecision): AssistantDecision {
  return value === "answer" || value === "clarify" || value === "abstain" ? value : fallback;
}

function readRisk(value: unknown, fallback: AssistantRiskBand): AssistantRiskBand {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function readQuestionShape(value: unknown, fallback: QuestionShape): QuestionShape {
  return value === "fact" ||
    value === "count_or_duration" ||
    value === "summary" ||
    value === "compare" ||
    value === "project" ||
    value === "follow_up" ||
    value === "rewrite" ||
    value === "edge_case"
    ? value
    : fallback;
}

function readConfidence(value: unknown, fallback: AssistantConfidenceBand): AssistantConfidenceBand {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function readVerifierVerdict(value: unknown, fallback: VerifierVerdict): VerifierVerdict {
  return value === "pass" || value === "retry" || value === "clarify" || value === "abstain"
    ? value
    : fallback;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

async function runJsonModel({
  system,
  user,
  model,
  maxTokens
}: {
  system: string;
  user: string;
  model: SupportedSarvamModel;
  maxTokens: number;
}) {
  const client = getSarvamClient();
  const completion = await client.chat.completions({
    model,
    reasoning_effort: getReasoningEffort(),
    temperature: 0.15,
    max_tokens: maxTokens,
    seed: 7,
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: user
      }
    ]
  });

  return completion.choices?.[0]?.message?.content?.trim() ?? "";
}

async function planQuery(input: PlannerPromptInput): Promise<PlannerResult> {
  const { system, user } = buildPlannerPrompt(input);
  const raw = await runJsonModel({
    system,
    user,
    model: getFastModel(),
    maxTokens: 240
  });
  const parsed = extractJsonObject(raw);

  if (!parsed) {
    return buildPlannerFallback(input);
  }

  return {
    decision: readDecision(parsed.decision, "clarify"),
    rationale:
      typeof parsed.rationale === "string" && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : "Planner response did not include a rationale.",
    questionType: readQuestionShape(parsed.questionType, getQuestionShapeFallback(input.normalizedQuery)),
    domain: parsed.domain === "out_of_domain" ? "out_of_domain" : "portfolio",
    risk: readRisk(parsed.risk, "medium"),
    resolvedEntities: toStringArray(parsed.resolvedEntities),
    candidateProjectSlugs: toStringArray(parsed.candidateProjectSlugs),
    slots: toStringArray(parsed.slots),
    retrievalQuery:
      typeof parsed.retrievalQuery === "string" && parsed.retrievalQuery.trim()
        ? parsed.retrievalQuery.trim()
        : input.query,
    needsFallbackEvidence: Boolean(parsed.needsFallbackEvidence),
    needsStrongModel: Boolean(parsed.needsStrongModel),
    clarificationQuestion:
      typeof parsed.clarificationQuestion === "string" && parsed.clarificationQuestion.trim()
        ? parsed.clarificationQuestion.trim()
        : undefined
  };
}

function buildEvidenceLookup(
  chunks: EvidenceChunk[],
  fallbacks: RawFallbackExcerpt[]
) {
  const base = new Map<string, RetrievedEvidence>();

  for (const chunk of chunks) {
    base.set(chunk.id, {
      id: chunk.id,
      kind: chunk.kind,
      label: chunk.label,
      text: chunk.text,
      source: chunk.source,
      sourceHref: chunk.sourceHref,
      projectSlug: chunk.projectSlug,
      company: chunk.company,
      keywords: chunk.keywords,
      entityTags: chunk.entityTags,
      score: 0
    });
  }

  for (const fallback of fallbacks) {
    base.set(fallback.id, {
      id: fallback.id,
      kind: "fallback",
      label: fallback.label,
      text: fallback.text,
      source: fallback.source,
      sourceHref: fallback.sourceHref,
      projectSlug: fallback.projectSlug,
      keywords: fallback.keywords,
      entityTags: fallback.entityTags,
      score: 0
    });
  }

  return base;
}

function inferEvidencePreference(normalizedQuery: string, planner: PlannerResult) {
  if (planner.questionType === "rewrite") return ["project", "project_section", "profile", "fact"];
  if (
    planner.questionType === "project" ||
    planner.questionType === "follow_up" ||
    planner.questionType === "compare"
  ) {
    return ["project", "project_section", "project_excerpt", "fallback"];
  }
  if (
    includesAny(normalizedQuery, [
      "role",
      "background",
      "education",
      "experience",
      "company",
      "datasutram"
    ])
  ) {
    return ["fact", "timeline", "profile"];
  }
  return ["fact", "timeline", "profile", "project", "project_section", "project_excerpt"];
}

function scoreEvidenceItem({
  item,
  normalizedQuery,
  queryTokens,
  planner,
  state,
  currentPageContext
}: {
  item: RetrievedEvidence;
  normalizedQuery: string;
  queryTokens: string[];
  planner: PlannerResult;
  state: ConversationState;
  currentPageContext?: AssistantCurrentPageContext;
}) {
  const keywordTokens = tokenize(`${item.label} ${item.text} ${(item.keywords ?? []).join(" ")}`);
  const overlap = queryTokens.reduce((count, token) => count + (keywordTokens.includes(token) ? 1 : 0), 0);
  const keywordHits = (item.keywords ?? []).reduce((count, keyword) => {
    const normalizedKeyword = normalizeForMatch(keyword);
    return count + (normalizedKeyword && normalizedQuery.includes(normalizedKeyword) ? 1 : 0);
  }, 0);

  let score = overlap * 3 + keywordHits * 5;

  if (planner.candidateProjectSlugs.includes(item.projectSlug ?? "")) score += 28;
  if (planner.resolvedEntities.some((entity) => item.entityTags.includes(normalizeForMatch(entity)))) {
    score += 12;
  }
  if (currentPageContext?.projectSlug && currentPageContext.projectSlug === item.projectSlug) {
    score += 16;
  }
  if (state.lastProjectSlugs.includes(item.projectSlug ?? "") && isReferentialQuery(normalizedQuery)) {
    score += 18;
  }
  if (state.lastEvidenceIds.includes(item.id) && isReferentialQuery(normalizedQuery)) {
    score += 10;
  }
  if (
    item.projectSlug &&
    planner.questionType === "compare" &&
    planner.candidateProjectSlugs.includes(item.projectSlug)
  ) {
    score += 10;
  }

  const preferredKinds = inferEvidencePreference(normalizedQuery, planner);
  if (preferredKinds.includes(item.kind)) score += 4;

  if (normalizedQuery.includes(normalizeForMatch(item.label))) score += 12;
  if (item.projectSlug && normalizedQuery.includes(item.projectSlug.replace(/-/g, " "))) score += 10;

  return score;
}

function retrieveEvidence({
  normalizedQuery,
  planner,
  state,
  currentPageContext,
  evidenceLookup,
  includeFallback
}: {
  normalizedQuery: string;
  planner: PlannerResult;
  state: ConversationState;
  currentPageContext?: AssistantCurrentPageContext;
  evidenceLookup: Map<string, RetrievedEvidence>;
  includeFallback: boolean;
}) {
  const queryTokens = tokenize(normalizedQuery);
  const retrieved = [...evidenceLookup.values()]
    .filter((item) => includeFallback || item.kind !== "fallback")
    .map((item) => ({
      ...item,
      score: scoreEvidenceItem({
        item,
        normalizedQuery,
        queryTokens,
        planner,
        state,
        currentPageContext
      })
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const limit = planner.risk === "high" || includeFallback ? 12 : 8;
  return retrieved.slice(0, limit);
}

function renderEvidenceBlock(evidence: RetrievedEvidence[]) {
  if (!evidence.length) return "No additional evidence retrieved.";
  return evidence
    .map(
      (item) =>
        `[${item.id}] [${item.kind}] ${item.label}\nSource: ${item.source}\n${item.text}`
    )
    .join("\n\n");
}

function buildAnswerPrompt({
  query,
  planner,
  state,
  recentHistory,
  currentPageContext,
  globalDossier,
  evidence,
  retryFeedback
}: {
  query: string;
  planner: PlannerResult;
  state: ConversationState;
  recentHistory: AssistantHistoryItem[];
  currentPageContext?: AssistantCurrentPageContext;
  globalDossier: string;
  evidence: RetrievedEvidence[];
  retryFeedback?: string;
}) {
  const system = [
    "You are the evidence-first voice agent for Shailesh Rana's portfolio.",
    "Write the answer only from the dossier, recent conversation, and retrieved evidence.",
    "For in-domain questions, answer directly if the evidence supports all material claims.",
    "Recruiter notes, role-fit summaries, balanced hiring-manager takes, and skeptical summaries are all in-domain outputs when grounded in the evidence.",
    "Do not ask whether the user wants a recruiter note if they already asked for one; write the grounded note directly.",
    "If the question is ambiguous, return decision=clarify and ask one narrow question.",
    "If the evidence is insufficient, return decision=abstain and say that briefly instead of guessing.",
    "For rewrite requests such as 'shorter', 'plain English', or 'less salesy', rewrite the prior answer on the same topic instead of broadening scope.",
    "Keep the final answer concise by default: at most 4 sentences, and recruiter notes should stay under about 120 words.",
    "Keep the prose direct, specific, and unsalesy. No markdown. No bullet list. No raw URLs.",
    "Return strict JSON only with keys:",
    'decision, answer, usedEvidenceIds, answerType, confidenceBand, reason.'
  ].join(" ");

  const user = [
    `Question: ${query}`,
    `Planner result: ${JSON.stringify(planner)}`,
    `Current page context: ${JSON.stringify(currentPageContext ?? {})}`,
    `Conversation state: ${JSON.stringify({
      lastResolvedEntities: state.lastResolvedEntities,
      lastProjectSlugs: state.lastProjectSlugs,
      pendingSlots: state.pendingSlots,
      lastQuestionType: state.lastQuestionType,
      lastAnswerSummary: state.lastAnswerSummary,
      lastUserQuestion: state.lastUserQuestion,
      lastAssistantAnswer: state.lastAssistantAnswer
    })}`,
    `Recent conversation:\n${renderRecentHistory(recentHistory)}`,
    `Global dossier:\n${globalDossier}`,
    `Retrieved evidence:\n${renderEvidenceBlock(evidence)}`,
    retryFeedback ? `Verifier feedback from the previous attempt: ${retryFeedback}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user };
}

function parseAnswerDraft(raw: string, fallbackEvidenceIds: string[]): AnswerDraft {
  const parsed = extractJsonObject(raw);
  if (!parsed) {
    const salvaged = extractDraftFromTruncatedJson(raw);
    if (salvaged) {
      return {
        ...salvaged,
        usedEvidenceIds: salvaged.usedEvidenceIds.length
          ? salvaged.usedEvidenceIds
          : fallbackEvidenceIds
      };
    }

    const structured = extractDraftFromStructuredText(raw);
    if (structured) {
      return {
        ...structured,
        usedEvidenceIds: structured.usedEvidenceIds.length
          ? structured.usedEvidenceIds
          : fallbackEvidenceIds
      };
    }

    return {
      decision: "abstain",
      answer: sanitizeParagraph(raw) || SESSION_FALLBACK_MESSAGE,
      usedEvidenceIds: fallbackEvidenceIds,
      answerType: "abstention",
      confidenceBand: "low",
      reason: "The answerer did not return valid JSON."
    };
  }

  const decision = readDecision(parsed.decision, "abstain");
  const answer = sanitizeParagraph(typeof parsed.answer === "string" ? parsed.answer : "");

  return {
    decision,
    answer: answer || SESSION_FALLBACK_MESSAGE,
    usedEvidenceIds: toStringArray(parsed.usedEvidenceIds),
    answerType:
      typeof parsed.answerType === "string" && parsed.answerType.trim()
        ? (parsed.answerType.trim() as AnswerDraft["answerType"])
        : decision === "clarify"
          ? "clarification"
          : decision === "abstain"
            ? "abstention"
            : "fact",
    confidenceBand: readConfidence(parsed.confidenceBand, "medium"),
    reason:
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "The answerer did not provide reasoning."
  };
}

async function draftAnswer({
  query,
  planner,
  state,
  recentHistory,
  currentPageContext,
  globalDossier,
  evidence,
  useStrongModel,
  retryFeedback
}: {
  query: string;
  planner: PlannerResult;
  state: ConversationState;
  recentHistory: AssistantHistoryItem[];
  currentPageContext?: AssistantCurrentPageContext;
  globalDossier: string;
  evidence: RetrievedEvidence[];
  useStrongModel?: boolean;
  retryFeedback?: string;
}) {
  const { system, user } = buildAnswerPrompt({
    query,
    planner,
    state,
    recentHistory,
    currentPageContext,
    globalDossier,
    evidence,
    retryFeedback
  });
  const model = useStrongModel ? getStrongModel() : planner.needsStrongModel ? getStrongModel() : getFastModel();
  const raw = await runJsonModel({
    system,
    user,
    model,
    maxTokens: 360
  });

  return {
    draft: parseAnswerDraft(raw, evidence.map((item) => item.id)),
    modelUsed: model
  };
}

function buildVerifierPrompt({
  query,
  planner,
  answer,
  evidence
}: {
  query: string;
  planner: PlannerResult;
  answer: AnswerDraft;
  evidence: RetrievedEvidence[];
}) {
  const system = [
    "You are the verifier for a grounded portfolio QA assistant.",
    "Judge whether the candidate answer is relevant, supported by the evidence, complete enough for the question, and free of unsupported overreach.",
    "Choose verdict=pass only when all material claims are supported and the answer actually addresses the question.",
    "Choose verdict=retry when more evidence or a tighter rewrite could reasonably fix the answer.",
    "Choose verdict=clarify when the question is ambiguous and the answer should ask a narrow follow-up instead.",
    "Choose verdict=abstain when the answer would still be unsupported even with more evidence.",
    "Return strict JSON only with keys:",
    'verdict, relevant, grounded, complete, overreach, reason, missingSlots, needsMoreEvidence.'
  ].join(" ");

  const user = [
    `Question: ${query}`,
    `Planner result: ${JSON.stringify(planner)}`,
    `Candidate answer: ${JSON.stringify(answer)}`,
    `Evidence:\n${renderEvidenceBlock(evidence)}`
  ].join("\n\n");

  return { system, user };
}

function parseVerifierResult(raw: string): VerifierResult {
  const parsed = extractJsonObject(raw);
  if (!parsed) {
    const fields = parseStructuredFields(raw);
    const verdict = fields.get("verdict");

    if (verdict) {
      return {
        verdict: readVerifierVerdict(verdict, "abstain"),
        relevant: readBooleanLike(fields.get("relevant"), false),
        grounded: readBooleanLike(fields.get("grounded"), false),
        complete: readBooleanLike(fields.get("complete"), false),
        overreach: readBooleanLike(fields.get("overreach"), true),
        reason:
          sanitizeParagraph(fields.get("reason") ?? "") ||
          "Recovered verifier result from structured key-value output.",
        missingSlots: parseStructuredList(fields.get("missingslots")),
        needsMoreEvidence: readBooleanLike(fields.get("needsmoreevidence"), false)
      };
    }

    return {
      verdict: "abstain",
      relevant: false,
      grounded: false,
      complete: false,
      overreach: true,
      reason: "Verifier did not return valid JSON.",
      missingSlots: [],
      needsMoreEvidence: false
    };
  }

  return {
    verdict: readVerifierVerdict(parsed.verdict, "abstain"),
    relevant: Boolean(parsed.relevant),
    grounded: Boolean(parsed.grounded),
    complete: Boolean(parsed.complete),
    overreach: Boolean(parsed.overreach),
    reason:
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "Verifier response did not include reasoning.",
    missingSlots: toStringArray(parsed.missingSlots),
    needsMoreEvidence: Boolean(parsed.needsMoreEvidence)
  };
}

async function verifyAnswer({
  query,
  planner,
  answer,
  evidence,
  useStrongModel
}: {
  query: string;
  planner: PlannerResult;
  answer: AnswerDraft;
  evidence: RetrievedEvidence[];
  useStrongModel?: boolean;
}) {
  const { system, user } = buildVerifierPrompt({
    query,
    planner,
    answer,
    evidence
  });

  const raw = await runJsonModel({
    system,
    user,
    model: useStrongModel ? getStrongModel() : getFastModel(),
    maxTokens: 220
  });

  return parseVerifierResult(raw);
}

function buildClarificationFromPlanner(planner: PlannerResult) {
  if (planner.clarificationQuestion) return planner.clarificationQuestion;
  if (planner.slots.includes("referent")) {
    return "Which project or topic do you want me to focus on?";
  }
  if (planner.questionType === "compare") {
    return "Which two projects do you want me to compare?";
  }
  return "Which project, background detail, or role-fit angle do you want me to focus on?";
}

function buildVerifierFallbackAnswer(verifier: VerifierResult, planner: PlannerResult) {
  if (verifier.verdict === "clarify") {
    return {
      decision: "clarify" as const,
      answer: buildClarificationFromPlanner(planner),
      confidenceBand: "high" as const,
      verifierVerdict: "clarify" as const
    };
  }

  return {
    decision: "abstain" as const,
    answer:
      verifier.reason && verifier.reason !== "Verifier response did not include reasoning."
        ? sanitizeParagraph(verifier.reason)
        : SESSION_FALLBACK_MESSAGE,
    confidenceBand: "low" as const,
    verifierVerdict: "abstain" as const
  };
}

function buildNextConversationState({
  previous,
  planner,
  answer,
  verifierVerdict,
  query,
  turnOrigin,
  resolvedProjectSlugs
}: {
  previous: ConversationState;
  planner: PlannerResult;
  answer: {
    decision: AssistantDecision;
    answer: string;
    usedEvidenceIds: string[];
  };
  verifierVerdict: VerifierVerdict;
  query: string;
  turnOrigin?: AssistantTurnOrigin;
  resolvedProjectSlugs: string[];
}) {
  const nextProjects = resolvedProjectSlugs.length
    ? resolvedProjectSlugs
    : previous.lastProjectSlugs;
  const nextEntities = planner.resolvedEntities.length
    ? planner.resolvedEntities
    : previous.lastResolvedEntities;

  return {
    lastResolvedEntities: nextEntities,
    lastProjectSlugs: nextProjects,
    lastEvidenceIds: answer.usedEvidenceIds.length
      ? [...new Set(answer.usedEvidenceIds)]
      : previous.lastEvidenceIds,
    pendingSlots: answer.decision === "clarify" ? planner.slots : [],
    lastDecision: answer.decision,
    lastVerifierVerdict: verifierVerdict,
    lastQuestionType: planner.questionType,
    lastAnswerSummary: summarizeForMemory(answer.answer),
    lastUserQuestion: sanitizeParagraph(query),
    lastAssistantAnswer: sanitizeParagraph(answer.answer),
    turnOrigin: turnOrigin ?? previous.turnOrigin ?? null
  };
}

function getResolvedProjectSlugs(
  planner: PlannerResult,
  evidenceIds: string[],
  evidenceLookup: Map<string, RetrievedEvidence>,
  previous: ConversationState,
  currentPageContext?: AssistantCurrentPageContext
) {
  const fromPlanner = planner.candidateProjectSlugs;
  const fromEvidence = evidenceIds
    .map((id) => evidenceLookup.get(id)?.projectSlug)
    .filter((slug): slug is string => Boolean(slug));

  const merged = [...new Set([...fromPlanner, ...fromEvidence])];
  if (merged.length) return merged;
  if (currentPageContext?.projectSlug && isReferentialQuery(normalizeForMatch(previous.lastUserQuestion ?? ""))) {
    return [currentPageContext.projectSlug];
  }
  return previous.lastProjectSlugs;
}

function getSourcesForEvidence(
  evidenceIds: string[],
  evidenceLookup: Map<string, RetrievedEvidence>,
  planner: PlannerResult,
  currentPageContext?: AssistantCurrentPageContext
) {
  const sources = new Set<string>();
  for (const id of evidenceIds) {
    const item = evidenceLookup.get(id);
    if (item?.sourceHref) {
      sources.add(item.sourceHref);
    }
  }

  if (!sources.size && currentPageContext?.projectSlug) {
    sources.add(`/projects/${currentPageContext.projectSlug}`);
  }

  if (!sources.size && planner.candidateProjectSlugs.length) {
    for (const slug of planner.candidateProjectSlugs.slice(0, 2)) {
      sources.add(`/projects/${slug}`);
    }
  }

  if (!sources.size) {
    sources.add("/");
  }

  return [...sources];
}

function getSelectedFactIds(
  evidenceIds: string[],
  factIds: Set<string>,
  timelineIds: Set<string>
) {
  return evidenceIds.filter((id) => factIds.has(id) || timelineIds.has(id));
}

function buildDirectExecution({
  conversationId,
  state,
  query,
  turnOrigin,
  planner,
  policy
}: {
  conversationId: string;
  state: ConversationState;
  query: string;
  turnOrigin?: AssistantTurnOrigin;
  planner: PlannerResult;
  policy: PolicyReply;
}): AssistantTurnExecution {
  const nextConversationState = buildNextConversationState({
    previous: state,
    planner,
    answer: {
      decision: policy.decision,
      answer: policy.answer,
      usedEvidenceIds: policy.usedEvidenceIds
    },
    verifierVerdict: policy.verifierVerdict,
    query,
    turnOrigin,
    resolvedProjectSlugs: state.lastProjectSlugs
  });

  return {
    conversationId,
    replyText: sanitizeParagraph(policy.answer),
    spokenText: sanitizeForSpeech(policy.answer),
    sources: policy.sources,
    usedEvidenceIds: policy.usedEvidenceIds,
    selectedFactIds: [],
    decision: policy.decision,
    confidenceBand: policy.confidenceBand,
    verifierVerdict: policy.verifierVerdict,
    modelUsed: "direct",
    plannerDecision: planner.decision,
    plannerRisk: planner.risk,
    escalationUsed: false,
    nextConversationState,
    nextWorkingMemory: nextConversationState
  };
}

function buildLoggingPayload(payload: Record<string, unknown>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload
  });
}

export async function runAssistantTurn({
  query,
  history,
  conversationId,
  conversationState,
  currentPageContext,
  turnOrigin
}: AssistantTurnInput): Promise<AssistantTurnExecution> {
  const repairedQuery = repairTranscriptForRouting(query).trim();
  const normalizedQuery = normalizeForMatch(repairedQuery);
  const state = normalizeConversationState(conversationState, turnOrigin);
  const directPolicy = detectPolicyReply(normalizedQuery);

  if (directPolicy) {
    const planner: PlannerResult = {
      decision: directPolicy.decision,
      rationale: "Policy gate handled this request directly.",
      questionType: directPolicy.decision === "clarify" ? "edge_case" : "fact",
      domain: "portfolio",
      risk: "low",
      resolvedEntities: [],
      candidateProjectSlugs: [],
      slots: [],
      retrievalQuery: repairedQuery,
      needsFallbackEvidence: false,
      needsStrongModel: false
    };

    console.info(
      "assistant.turn",
      buildLoggingPayload({
        conversationId,
        query: repairedQuery,
        plannerDecision: planner.decision,
        resolvedEntities: [],
        evidenceIds: [],
        modelUsed: "direct",
        verifierVerdict: directPolicy.verifierVerdict,
        finalDecision: directPolicy.decision,
        latencyMs: 0
      })
    );

    return buildDirectExecution({
      conversationId,
      state,
      query: repairedQuery,
      turnOrigin,
      planner,
      policy: directPolicy
    });
  }

  const startedAt = Date.now();
  const corpus = await getAssistantCorpus();
  const evidenceLookup = buildEvidenceLookup(corpus.evidenceChunks, corpus.rawFallbackExcerpts);
  const candidateProjectSlugs = getDeterministicProjectCandidates(
    normalizedQuery,
    corpus.projectAliases,
    state,
    currentPageContext
  );
  const recentHistory = getRecentHistory(history);
  const dossierProjectList = corpus.dossierSections.projectBriefs
    .map((project, index) => `${index + 1}. ${project.title} (${project.slug}) aliases: ${project.aliases.join(", ")}`)
    .join("\n");

  const plannerInput: PlannerPromptInput = {
    query: repairedQuery,
    normalizedQuery,
    currentPageContext,
    state,
    recentHistory,
    candidateProjectSlugs,
    dossierProjectList
  };

  const planner = await planQuery(plannerInput);
  const plannerWithGuard =
    planner.domain === "out_of_domain" &&
    hasPortfolioSignal({
      normalizedQuery,
      candidateProjectSlugs,
      state,
      currentPageContext
    })
      ? buildPlannerFallback(plannerInput)
      : planner;
  const initialEvidence = retrieveEvidence({
    normalizedQuery,
    planner: plannerWithGuard,
    state,
    currentPageContext,
    evidenceLookup,
    includeFallback: plannerWithGuard.needsFallbackEvidence
  });

  const firstPass = await draftAnswer({
    query: repairedQuery,
    planner: plannerWithGuard,
    state,
    recentHistory,
    currentPageContext,
    globalDossier: corpus.globalDossier,
    evidence: initialEvidence
  });

  let finalDraft = firstPass.draft;
  let finalVerifier: VerifierResult = {
    verdict: finalDraft.decision === "answer" ? "retry" : "pass",
    relevant: true,
    grounded: finalDraft.decision !== "abstain",
    complete: finalDraft.decision !== "clarify",
    overreach: false,
    reason: "No verifier run yet.",
    missingSlots: [],
    needsMoreEvidence: false
  };
  let finalEvidence = initialEvidence;
  let modelUsed: string = firstPass.modelUsed;
  let escalationUsed = false;

  if (finalDraft.decision === "answer") {
    finalVerifier = await verifyAnswer({
      query: repairedQuery,
      planner: plannerWithGuard,
      answer: finalDraft,
      evidence: initialEvidence
    });

    if (finalVerifier.verdict === "retry") {
      const retryEvidence = retrieveEvidence({
        normalizedQuery,
        planner: plannerWithGuard,
        state,
        currentPageContext,
        evidenceLookup,
        includeFallback: true
      });

      const retryPass = await draftAnswer({
        query: repairedQuery,
        planner: plannerWithGuard,
        state,
        recentHistory,
        currentPageContext,
        globalDossier: corpus.globalDossier,
        evidence: retryEvidence,
        useStrongModel: true,
        retryFeedback: finalVerifier.reason
      });

      finalDraft = retryPass.draft;
      modelUsed = retryPass.modelUsed;
      finalEvidence = retryEvidence;
      escalationUsed = true;

      if (finalDraft.decision === "answer") {
        finalVerifier = await verifyAnswer({
          query: repairedQuery,
          planner: plannerWithGuard,
          answer: finalDraft,
          evidence: retryEvidence,
          useStrongModel: true
        });
      } else {
        finalVerifier = {
          verdict: "pass",
          relevant: true,
          grounded: finalDraft.decision !== "abstain",
          complete: finalDraft.decision !== "clarify",
          overreach: false,
          reason: finalDraft.reason,
          missingSlots: [],
          needsMoreEvidence: false
        };
      }
    }
  }

  let finalDecision = finalDraft.decision;
  let finalAnswer = finalDraft.answer;
  let finalConfidence = finalDraft.confidenceBand;
  let finalVerifierVerdict = finalVerifier.verdict;

  if (finalDraft.decision === "answer" && finalVerifier.verdict !== "pass") {
    const fallback = buildVerifierFallbackAnswer(finalVerifier, planner);
    finalDecision = fallback.decision;
    finalAnswer = fallback.answer;
    finalConfidence = fallback.confidenceBand;
    finalVerifierVerdict = fallback.verifierVerdict;
    finalDraft = {
      decision: fallback.decision,
      answer: fallback.answer,
      usedEvidenceIds: finalEvidence.map((item) => item.id),
      answerType: fallback.decision === "clarify" ? "clarification" : "abstention",
      confidenceBand: fallback.confidenceBand,
      reason: finalVerifier.reason
    };
  }

  if (finalDecision !== "answer") {
    const deterministicFactFallback = buildDeterministicFactFallback({
      normalizedQuery,
      facts: corpus.facts
    });

    if (deterministicFactFallback) {
      finalDecision = deterministicFactFallback.decision;
      finalAnswer = deterministicFactFallback.answer;
      finalConfidence = deterministicFactFallback.confidenceBand;
      finalVerifierVerdict = "pass";
      finalDraft = deterministicFactFallback;
      modelUsed = `${modelUsed}+fact-fallback`;
    }
  }

  const resolvedProjectSlugs = getResolvedProjectSlugs(
    plannerWithGuard,
    finalDraft.usedEvidenceIds,
    evidenceLookup,
    state,
    currentPageContext
  );
  const nextConversationState = buildNextConversationState({
    previous: state,
    planner: plannerWithGuard,
    answer: {
      decision: finalDecision,
      answer: finalAnswer,
      usedEvidenceIds: finalDraft.usedEvidenceIds
    },
    verifierVerdict: finalVerifierVerdict,
    query: repairedQuery,
    turnOrigin,
    resolvedProjectSlugs
  });
  const factIds = new Set(corpus.facts.map((fact) => fact.id));
  const timelineIds = new Set(corpus.timeline.map((item) => item.id));
  const sources = getSourcesForEvidence(
    finalDraft.usedEvidenceIds,
    evidenceLookup,
    plannerWithGuard,
    currentPageContext
  );
  const latencyMs = Date.now() - startedAt;

  console.info(
    "assistant.turn",
    buildLoggingPayload({
      conversationId,
      query: repairedQuery,
      plannerDecision: plannerWithGuard.decision,
      plannerRisk: plannerWithGuard.risk,
      resolvedEntities: plannerWithGuard.resolvedEntities,
      evidenceIds: finalDraft.usedEvidenceIds,
      modelUsed,
      verifierVerdict: finalVerifierVerdict,
      finalDecision,
      latencyMs
    })
  );

  return {
    conversationId: conversationId || createConversationId(),
    replyText: sanitizeParagraph(finalAnswer) || SESSION_FALLBACK_MESSAGE,
    spokenText: sanitizeForSpeech(finalAnswer) || sanitizeForSpeech(SESSION_FALLBACK_MESSAGE),
    sources,
    usedEvidenceIds: finalDraft.usedEvidenceIds,
    selectedFactIds: getSelectedFactIds(finalDraft.usedEvidenceIds, factIds, timelineIds),
    decision: finalDecision,
    confidenceBand: finalConfidence,
    verifierVerdict: finalVerifierVerdict,
    modelUsed,
    plannerDecision: plannerWithGuard.decision,
    plannerRisk: plannerWithGuard.risk,
    escalationUsed,
    nextConversationState,
    nextWorkingMemory: nextConversationState
  };
}

export function finalizeAssistantReply(rawText: string) {
  const replyText = sanitizeParagraph(rawText) || SESSION_FALLBACK_MESSAGE;
  const spokenText = sanitizeForSpeech(replyText) || sanitizeForSpeech(SESSION_FALLBACK_MESSAGE);
  return { replyText, spokenText };
}

export function finalizeWorkingMemory(
  _response: Partial<AssistantTurnResponse>,
  replyText: string
): WorkingMemory {
  return {
    ...createEmptyConversationState(),
    lastAnswerSummary: summarizeForMemory(replyText)
  };
}
