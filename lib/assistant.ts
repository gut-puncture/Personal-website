import {
  assistantTimeline,
  ensureAssistantFactsConsistency,
  flagshipProjectKnowledge,
  flagshipProjectOrder,
  getAssistantFact,
  projectAliasMap
} from "@/lib/assistant-knowledge";
import type {
  AssistantFact,
  AssistantHistoryItem,
  AssistantTurnOrigin,
  EscalationReason,
  PortfolioContent,
  ProjectEntry,
  QuestionShape,
  WorkingMemory
} from "@/lib/types";

const portfolioKeywords = new Set([
  "shailesh",
  "rana",
  "project",
  "projects",
  "portfolio",
  "work",
  "skills",
  "product",
  "manager",
  "research",
  "researcher",
  "role",
  "fit",
  "cv",
  "linkedin",
  "datasutram",
  "ai",
  "rag",
  "embedding",
  "paper",
  "education",
  "background",
  "experience",
  "caastle",
  "bajaj"
]);

const profanity = ["fuck", "shit", "bitch", "bastard", "asshole", "fucking"];

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
  "salary",
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

const followUpSignals = [
  "it",
  "that",
  "this project",
  "that project",
  "why does it matter",
  "tell me more",
  "more detail",
  "go deeper",
  "explain more",
  "what about that",
  "and this",
  "and that"
];

type EdgeIntent = "empty" | "identity" | "contact" | "unsupported_personal" | "off_topic";

type AssistantDirectPlan = {
  kind: "direct";
  intent: EdgeIntent | "fact";
  replyText: string;
  spokenText: string;
  sources: string[];
  selectedFactIds: string[];
  nextWorkingMemory: WorkingMemory;
};

type AssistantModelPlan = {
  kind: "model";
  questionShape: QuestionShape;
  system: string;
  user: string;
  sources: string[];
  selectedFactIds: string[];
  nextWorkingMemory: WorkingMemory;
  modelPreference: "fast" | "strong";
  escalationReason?: EscalationReason;
};

export type AssistantPlan = AssistantDirectPlan | AssistantModelPlan;

type BuildAssistantPlanOptions = {
  contextProjectSlug?: string;
  workingMemory?: WorkingMemory;
  turnOrigin?: AssistantTurnOrigin;
};

type QuestionEntity =
  | "empty"
  | "identity"
  | "contact"
  | "unsupported_personal"
  | "off_topic"
  | "current_role"
  | "education"
  | "role_fit"
  | "career_background"
  | "prior_companies"
  | "compensation_expectation"
  | "skills"
  | "research_interests"
  | "location"
  | "background_previous_role"
  | "pm_experience_years"
  | "current_company_duration"
  | "count_unknown"
  | "company_timeline"
  | `project:${string}`
  | `company:${string}`
  | "general";

type QuestionAnalysis = {
  shape: QuestionShape;
  entity: QuestionEntity;
  targetProject?: ProjectEntry;
  comparisonProjects?: ProjectEntry[];
  targetCompany?: string;
  memoryNeed: "none" | "last_topic" | "active_project";
  edgeIntent?: EdgeIntent;
  includeOnTopicProfanity: boolean;
  explicitFactIds: string[];
  needsStrongModel: boolean;
  escalationReason?: EscalationReason;
  repairedQuery: string;
};

type ContextPack = {
  facts: AssistantFact[];
  timeline: typeof assistantTimeline;
  projects: Array<{
    slug: string;
    title: string;
    summary: string;
    whyItMatters: string;
    support?: string;
  }>;
  workingMemorySummary?: string;
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
  return sentence.slice(0, 220);
}

function buildWorkingMemory(
  analysis: QuestionAnalysis,
  turnOrigin: AssistantTurnOrigin | undefined,
  replyText: string
): WorkingMemory {
  return {
    lastQuestionType: analysis.shape,
    lastEntity: analysis.entity,
    lastProjectSlug: analysis.targetProject?.slug ?? null,
    lastAnswerSummary: summarizeForMemory(replyText),
    turnOrigin: turnOrigin ?? null
  };
}

function buildDirectReply(
  intent: AssistantDirectPlan["intent"],
  replyText: string,
  sources: string[],
  selectedFactIds: string[],
  analysis: QuestionAnalysis,
  turnOrigin?: AssistantTurnOrigin,
  spokenText?: string
): AssistantDirectPlan {
  const cleanedReply = sanitizeParagraph(replyText);
  return {
    kind: "direct",
    intent,
    replyText: cleanedReply,
    spokenText: sanitizeForSpeech(spokenText ?? cleanedReply),
    sources,
    selectedFactIds,
    nextWorkingMemory: buildWorkingMemory(analysis, turnOrigin, cleanedReply)
  };
}

function getFlagshipProjects(content: PortfolioContent) {
  return flagshipProjectOrder
    .map((slug) => content.projects.find((project) => project.slug === slug))
    .filter((project): project is ProjectEntry => Boolean(project));
}

function getProjectAliases(project: ProjectEntry) {
  return [
    normalizeForMatch(project.title),
    ...(projectAliasMap[project.slug] ?? []).map((alias) => normalizeForMatch(alias))
  ];
}

function getFlagshipBrief(projectSlug: string) {
  return flagshipProjectKnowledge.find((project) => project.slug === projectSlug);
}

function getProjectMatchScore(project: ProjectEntry, normalizedQuery: string) {
  return getProjectAliases(project).reduce((best, alias) => {
    if (!alias || !normalizedQuery.includes(alias)) return best;
    const exactBonus = normalizedQuery === alias ? 10_000 : 0;
    return Math.max(best, alias.length + exactBonus);
  }, 0);
}

function findProjectByQuery(query: string, content: PortfolioContent) {
  const normalized = normalizeForMatch(query);
  return content.projects.reduce<ProjectEntry | undefined>((bestProject, project) => {
    const bestScore = bestProject ? getProjectMatchScore(bestProject, normalized) : 0;
    const nextScore = getProjectMatchScore(project, normalized);
    return nextScore > bestScore ? project : bestProject;
  }, undefined);
}

function findProjectsByQuery(query: string, content: PortfolioContent) {
  const normalized = normalizeForMatch(query);
  return content.projects
    .map((project) => ({
      project,
      score: getProjectMatchScore(project, normalized)
    }))
    .filter(({ score }) => score >= 4)
    .sort((left, right) => right.score - left.score)
    .map(({ project }) => project);
}

function isReferentialQuery(normalizedQuery: string) {
  return includesAny(normalizedQuery, followUpSignals);
}

function isCompensationAskQuery(normalizedQuery: string) {
  return (
    includesAny(normalizedQuery, [
      "compensation",
      "salary expectation",
      "expected salary",
      "salary ask",
      "expected package",
      "target package",
      "expected ctc",
      "target ctc",
      "cash plus esops",
      "cash and esops"
    ]) ||
    (normalizedQuery.includes("salary") &&
      includesAny(normalizedQuery, [
        "expect",
        "expected",
        "expectation",
        "ask",
        "target",
        "looking for"
      ]))
  );
}

function detectEdgeIntent(normalizedQuery: string): EdgeIntent | undefined {
  if (!normalizedQuery) return "empty";

  if (
    includesAny(normalizedQuery, ["are you ai", "are you an ai", "who are you", "are you a bot"])
  ) {
    return "identity";
  }

  if (includesAny(normalizedQuery, ["contact", "email", "linkedin", "cv", "resume"])) {
    return "contact";
  }

  if (!isCompensationAskQuery(normalizedQuery) && includesAny(normalizedQuery, unsupportedPersonalKeywords)) {
    return "unsupported_personal";
  }

  return undefined;
}

function detectCompanyEntity(normalizedQuery: string) {
  if (normalizedQuery.includes("caastle")) return "CaaStle Technologies";
  if (normalizedQuery.includes("bajaj")) return "Bajaj Finserv Health";
  if (normalizedQuery.includes("data sutram") || normalizedQuery.includes("datasutram")) {
    return "Data Sutram";
  }
  return undefined;
}

function analyzeQuestion(
  query: string,
  content: PortfolioContent,
  workingMemory?: WorkingMemory,
  contextProjectSlug?: string
): QuestionAnalysis {
  const repairedQuery = repairTranscriptForRouting(query).trim();
  const normalized = normalizeForMatch(repairedQuery);
  const edgeIntent = detectEdgeIntent(normalized);
  const includeOnTopicProfanity = profanity.some((word) => normalized.includes(word));
  const explicitFactIds: string[] = [];

  if (edgeIntent) {
    return {
      shape: "edge_case",
      entity: edgeIntent,
      memoryNeed: "none",
      edgeIntent,
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  const currentProject = contextProjectSlug
    ? content.projects.find((project) => project.slug === contextProjectSlug)
    : undefined;
  const referencedProjects = findProjectsByQuery(repairedQuery, content);
  const referencedProject = referencedProjects[0] ?? findProjectByQuery(repairedQuery, content);
  const referential = isReferentialQuery(normalized);
  const workingMemoryProject = workingMemory?.lastProjectSlug
    ? content.projects.find((project) => project.slug === workingMemory.lastProjectSlug)
    : undefined;
  const targetProject =
    referencedProject ??
    (referential ? workingMemoryProject ?? currentProject ?? undefined : undefined);
  const targetCompany = detectCompanyEntity(normalized);
  const tokens = tokenize(normalized);
  const hasPortfolioSignal =
    tokens.some((token) => portfolioKeywords.has(token)) ||
    Boolean(targetProject) ||
    Boolean(targetCompany) ||
    normalized.includes("shailesh") ||
    normalized.includes("data sutram");

  const isCountOrDuration =
    includesAny(normalized, [
      "how many years",
      "how long",
      "years of",
      "yoe",
      "number of years",
      "duration"
    ]) || /\b\d+\s+years\b/.test(normalized);

  if (
    includesAny(normalized, [
      "where is he based",
      "where is shailesh based",
      "location",
      "based in"
    ])
  ) {
    explicitFactIds.push("background.location");
    return {
      shape: "fact",
      entity: "location",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    isCountOrDuration &&
    includesAny(normalized, ["product management", "pm experience", "product manager"])
  ) {
    explicitFactIds.push("background.pm-years");
    return {
      shape: "count_or_duration",
      entity: "pm_experience_years",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    isCountOrDuration &&
    includesAny(normalized, ["current company", "data sutram", "current role", "there"])
  ) {
    return {
      shape: "count_or_duration",
      entity: "current_company_duration",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (isCountOrDuration) {
    return {
      shape: "count_or_duration",
      entity: "count_unknown",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "before product management",
      "before he became a product manager",
      "before becoming a product manager"
    ])
  ) {
    explicitFactIds.push("background.previous-role");
    return {
      shape: "fact",
      entity: "background_previous_role",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "current role",
      "where does he work",
      "what does he do now",
      "what is his role",
      "what is shailesh doing now",
      "what does he work on"
    ])
  ) {
    explicitFactIds.push("role.current", "role.current-scope");
    return {
      shape: "fact",
      entity: "current_role",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "educational background",
      "education",
      "what did he study",
      "degree",
      "mba",
      "college",
      "university"
    ])
  ) {
    explicitFactIds.push("education.mba", "education.be");
    return {
      shape: "fact",
      entity: "education",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "research interests",
      "what does he research",
      "what kind of research",
      "what kind of ai research",
      "what does he do for fun",
      "research focus"
    ])
  ) {
    explicitFactIds.push("research.interests");
    return {
      shape: "fact",
      entity: "research_interests",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    targetCompany &&
    !includesAny(normalized, ["before"]) &&
    includesAny(normalized, ["what did", "work on", "there", "at", "role", "did he do", "build"])
  ) {
    return {
      shape: "fact",
      entity: `company:${targetCompany}`,
      targetCompany,
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "brief summary of the projects",
      "summary of the projects",
      "summarize his strongest work",
      "summarize the projects",
      "top projects",
      "strongest work",
      "best work"
    ])
  ) {
    return {
      shape: "summary",
      entity: "general",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "product management and ai",
      "pm and ai",
      "show product management",
      "show ai skills",
      "best show product"
    ])
  ) {
    return {
      shape: "compare",
      entity: "role_fit",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: true,
      escalationReason: "comparison",
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "looking for a role",
      "looking for role",
      "role fit",
      "what kind of role",
      "good fit"
    ])
  ) {
    return {
      shape: "summary",
      entity: "role_fit",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (isCompensationAskQuery(normalized)) {
    explicitFactIds.push("background.compensation-ask");
    return {
      shape: "summary",
      entity: "compensation_expectation",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "before data sutram",
      "before his current role",
      "before current role",
      "before joining data sutram"
    ])
  ) {
    return {
      shape: "summary",
      entity: "prior_companies",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "career",
      "journey",
      "work background",
      "background",
      "tell me about shailesh",
      "who is shailesh",
      "what has he done"
    ])
  ) {
    return {
      shape: "summary",
      entity: "career_background",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "compare",
      "versus",
      "vs",
      "difference between",
      "better than",
      "what stands out"
    ])
  ) {
    return {
      shape: "compare",
      entity: targetProject ? `project:${targetProject.slug}` : "general",
      targetProject,
      comparisonProjects: referencedProjects,
      memoryNeed: targetProject ? "active_project" : "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: true,
      escalationReason: "comparison",
      repairedQuery
    };
  }

  if (targetProject) {
    const needsNuancedProjectExplanation =
      referential ||
      includesAny(normalized, [
        "why does",
        "how does",
        "how did",
        "tradeoff",
        "tradeoffs",
        "limitations",
        "architecture"
      ]);

    return {
      shape: referential ? "follow_up" : "project",
      entity: `project:${targetProject.slug}`,
      targetProject,
      memoryNeed: referential ? "active_project" : "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: needsNuancedProjectExplanation,
      escalationReason: needsNuancedProjectExplanation
        ? "nuanced_project_explanation"
        : undefined,
      repairedQuery
    };
  }

  if (
    includesAny(normalized, [
      "skills",
      "what is he good at",
      "strengths",
      "stack",
      "tools",
      "capabilities"
    ])
  ) {
    return {
      shape: "summary",
      entity: "skills",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (referential && workingMemory?.lastProjectSlug) {
    const project = content.projects.find((item) => item.slug === workingMemory.lastProjectSlug);
    return {
      shape: "follow_up",
      entity: project ? `project:${project.slug}` : "general",
      targetProject: project,
      memoryNeed: project ? "active_project" : "last_topic",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (referential) {
    return {
      shape: "follow_up",
      entity: "general",
      memoryNeed: "none",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  if (!hasPortfolioSignal) {
    return {
      shape: "edge_case",
      entity: "off_topic",
      memoryNeed: "none",
      edgeIntent: "off_topic",
      includeOnTopicProfanity,
      explicitFactIds,
      needsStrongModel: false,
      repairedQuery
    };
  }

  return {
    shape: "summary",
    entity: "general",
    memoryNeed: "none",
    includeOnTopicProfanity,
    explicitFactIds,
    needsStrongModel: false,
    repairedQuery
  };
}

function getProjectSupport(project: ProjectEntry) {
  return project.plainText.slice(0, 520).replace(/\s+/g, " ").trim();
}

function getRelevantFactsForEntity(entity: QuestionEntity) {
  switch (entity) {
    case "current_role":
      return ["role.current", "role.current-scope"];
    case "education":
      return ["education.mba", "education.be"];
    case "pm_experience_years":
      return ["background.pm-years", "background.previous-role"];
    case "career_background":
      return [
        "background.pm-years",
        "background.previous-role",
        "role.current",
        "role.current-scope",
        "research.interests",
        "education.mba",
        "education.be"
      ];
    case "prior_companies":
      return ["background.previous-role"];
    case "compensation_expectation":
      return ["background.compensation-ask", "background.role-fit"];
    case "research_interests":
      return ["research.interests"];
    case "location":
      return ["background.location"];
    case "background_previous_role":
      return ["background.previous-role"];
    case "role_fit":
      return ["background.role-fit", "role.current", "research.interests"];
    case "skills":
      return [
        "background.pm-years",
        "role.current-scope",
        "research.interests",
        "background.code-with-ai"
      ];
    default:
      return [];
  }
}

function compileContextPack(
  analysis: QuestionAnalysis,
  content: PortfolioContent,
  workingMemory?: WorkingMemory
): ContextPack {
  const factIds = new Set<string>(analysis.explicitFactIds);
  for (const factId of getRelevantFactsForEntity(analysis.entity)) {
    factIds.add(factId);
  }

  if (analysis.entity.startsWith("company:")) {
    const company = analysis.entity.replace("company:", "");
    const timelineItem = assistantTimeline.find((item) => item.company === company);
    if (timelineItem) {
      factIds.add("background.pm-years");
    }
  }

  const facts = [...factIds]
    .map((factId) => getAssistantFact(factId))
    .filter((fact): fact is AssistantFact => Boolean(fact));

  const timeline =
    analysis.entity === "career_background"
      ? assistantTimeline
      : analysis.entity.startsWith("company:")
        ? assistantTimeline.filter(
            (item) => item.company === analysis.entity.replace("company:", "")
          )
        : [];

  const projects: ContextPack["projects"] = [];

  if (analysis.shape === "summary" && analysis.entity === "general") {
    for (const brief of flagshipProjectKnowledge.slice(0, 3)) {
      projects.push({
        slug: brief.slug,
        title: brief.title,
        summary: brief.coreSummary,
        whyItMatters: brief.whyItMatters
      });
    }
  } else if (analysis.entity === "role_fit" || analysis.entity === "skills") {
    for (const brief of flagshipProjectKnowledge.slice(0, 3)) {
      projects.push({
        slug: brief.slug,
        title: brief.title,
        summary: brief.coreSummary,
        whyItMatters: brief.pmAiAngle
      });
    }
  } else if (analysis.targetProject) {
    const brief = getFlagshipBrief(analysis.targetProject.slug);
    projects.push({
      slug: analysis.targetProject.slug,
      title: analysis.targetProject.title,
      summary: brief?.coreSummary ?? analysis.targetProject.summary,
      whyItMatters: brief?.whyItMatters ?? analysis.targetProject.previewExcerpt,
      support: getProjectSupport(analysis.targetProject)
    });
  } else if (analysis.shape === "compare") {
    const candidates =
      analysis.comparisonProjects && analysis.comparisonProjects.length >= 2
        ? analysis.comparisonProjects
        : getFlagshipProjects(content).slice(0, 3);
    for (const project of candidates) {
      const brief = getFlagshipBrief(project.slug);
      if (!brief) continue;
      projects.push({
        slug: project.slug,
        title: project.title,
        summary: brief.coreSummary,
        whyItMatters: brief.pmAiAngle
      });
    }
  }

  let workingMemorySummary: string | undefined;
  if (analysis.memoryNeed !== "none" && workingMemory?.lastAnswerSummary) {
    workingMemorySummary = workingMemory.lastAnswerSummary;
  }

  return { facts, timeline, projects, workingMemorySummary };
}

function buildEdgeReply(
  edgeIntent: EdgeIntent,
  content: PortfolioContent,
  analysis: QuestionAnalysis,
  turnOrigin?: AssistantTurnOrigin
) {
  switch (edgeIntent) {
    case "empty":
      return buildDirectReply(
        "empty",
        "Ask about Shailesh's projects, current role, education, background, or role fit.",
        [content.home.contactLinks.linkedin],
        [],
        analysis,
        turnOrigin
      );
    case "identity":
      return buildDirectReply(
        "identity",
        "I am the voice agent for Shailesh Rana's portfolio, not Shailesh himself.",
        [content.home.contactLinks.linkedin],
        ["identity.voice-agent"],
        analysis,
        turnOrigin
      );
    case "contact":
      return buildDirectReply(
        "contact",
        "The cleanest next step is LinkedIn or the CV button on the site.",
        [content.home.contactLinks.linkedin, content.home.contactLinks.cv],
        ["contact.next-step"],
        analysis,
        turnOrigin
      );
    case "unsupported_personal":
      return buildDirectReply(
        "unsupported_personal",
        "I can help with details grounded in Shailesh's portfolio and CV summary, but I do not have reliable information about that private personal topic.",
        [content.home.contactLinks.linkedin, content.home.contactLinks.cv],
        ["boundary.unsupported-personal"],
        analysis,
        turnOrigin
      );
    case "off_topic":
    default:
      return buildDirectReply(
        "off_topic",
        "I’m here for questions about Shailesh Rana, his projects, his background, and role fit.",
        [content.home.contactLinks.linkedin],
        [],
        analysis,
        turnOrigin
      );
  }
}

function buildExactFactReply(
  analysis: QuestionAnalysis,
  content: PortfolioContent,
  turnOrigin?: AssistantTurnOrigin
): AssistantDirectPlan | null {
  if (analysis.entity === "pm_experience_years") {
    const fact = getAssistantFact("background.pm-years");
    if (!fact) return null;
    return buildDirectReply(
      "fact",
      fact.value,
      [content.home.contactLinks.cv],
      [fact.id],
      analysis,
      turnOrigin,
      fact.spokenForm
    );
  }

  if (analysis.entity === "background_previous_role") {
    const fact = getAssistantFact("background.previous-role");
    if (!fact) return null;
    return buildDirectReply(
      "fact",
      fact.value,
      [content.home.contactLinks.cv],
      [fact.id],
      analysis,
      turnOrigin,
      fact.spokenForm
    );
  }

  if (analysis.entity === "current_role") {
    const roleFact = getAssistantFact("role.current");
    const scopeFact = getAssistantFact("role.current-scope");
    if (!roleFact || !scopeFact) return null;
    return buildDirectReply(
      "fact",
      "Shailesh is currently a Product Manager and Member of Technical Staff at Data Sutram, where he owns UX, design, product management, development, and testing for the company's only B2B SaaS application.",
      [content.home.contactLinks.company, content.home.contactLinks.cv],
      [roleFact.id, scopeFact.id],
      analysis,
      turnOrigin
    );
  }

  if (analysis.entity === "education") {
    const mba = getAssistantFact("education.mba");
    const be = getAssistantFact("education.be");
    if (!mba || !be) return null;
    return buildDirectReply(
      "fact",
      "Shailesh has an MBA in Finance from University Business School, Panjab University, and a B.E. in Metallurgical Engineering from PEC University of Technology, Chandigarh.",
      [content.home.contactLinks.cv],
      [mba.id, be.id],
      analysis,
      turnOrigin
    );
  }

  if (analysis.entity === "research_interests") {
    const fact = getAssistantFact("research.interests");
    if (!fact) return null;
    return buildDirectReply(
      "fact",
      fact.value,
      ["/#projects"],
      [fact.id],
      analysis,
      turnOrigin,
      fact.spokenForm
    );
  }

  if (analysis.entity === "location") {
    const fact = getAssistantFact("background.location");
    if (!fact) return null;
    return buildDirectReply(
      "fact",
      fact.value,
      [content.home.contactLinks.linkedin],
      [fact.id],
      analysis,
      turnOrigin,
      fact.spokenForm
    );
  }

  if (analysis.entity === "current_company_duration") {
    return buildDirectReply(
      "fact",
      "The site does not state a canonical duration for Shailesh's time at Data Sutram.",
      [content.home.contactLinks.cv],
      [],
      analysis,
      turnOrigin
    );
  }

  if (analysis.entity === "prior_companies") {
    return buildDirectReply(
      "fact",
      "Before Data Sutram, Shailesh worked at CaaStle Technologies and Bajaj Finserv Health.",
      [content.home.contactLinks.cv],
      ["timeline.caastle", "timeline.bajaj"],
      analysis,
      turnOrigin
    );
  }

  if (analysis.entity === "career_background") {
    return buildDirectReply(
      "fact",
      "Shailesh is a Product Manager and Member of Technical Staff at Data Sutram; earlier he worked at CaaStle Technologies and Bajaj Finserv Health after starting as a Data Analyst. He has an MBA in Finance, a B.E. in Metallurgical Engineering, and researches agents, mechanistic interpretability, and continual learning.",
      [content.home.contactLinks.cv, content.home.contactLinks.linkedin],
      [
        "role.current",
        "background.previous-role",
        "education.mba",
        "education.be",
        "research.interests",
        "timeline.datasutram",
        "timeline.caastle",
        "timeline.bajaj"
      ],
      analysis,
      turnOrigin
    );
  }

  if (analysis.shape === "summary" && analysis.entity === "general") {
    return buildDirectReply(
      "fact",
      "The strongest work starts with Semantic Gravity, a mechanistic interpretability paper on negative constraints, then List to Cart, a grocery-cart generation demo, and then How a 7-Billion-Parameter AI Cannot Add, which uncovered length bias in large-number addition.",
      flagshipProjectOrder.map((slug) => `/projects/${slug}`),
      [],
      analysis,
      turnOrigin,
      "The strongest work starts with Semantic Gravity, a mechanistic interpretability paper on negative constraints, then List to Cart, a grocery cart generation demo, and then the seven billion parameter addition interpretability project, which uncovered length bias in large number addition."
    );
  }

  if (analysis.entity === "count_unknown") {
    return buildDirectReply(
      "fact",
      "The site does not state a canonical count or duration for that.",
      [content.home.contactLinks.cv],
      [],
      analysis,
      turnOrigin
    );
  }

  if (analysis.entity.startsWith("company:")) {
    const company = analysis.entity.replace("company:", "");
    const item = assistantTimeline.find((timelineItem) => timelineItem.company === company);
    if (!item) return null;
    return buildDirectReply(
      "fact",
      item.summary,
      [content.home.contactLinks.cv],
      [item.id],
      analysis,
      turnOrigin,
      item.spokenForm
    );
  }

  if (analysis.shape === "project" && analysis.targetProject) {
    const brief = getFlagshipBrief(analysis.targetProject.slug);
    if (brief) {
      return buildDirectReply(
        "fact",
        brief.coreSummary,
        [`/projects/${analysis.targetProject.slug}`],
        [],
        analysis,
        turnOrigin,
        brief.spokenCoreSummary ?? brief.coreSummary
      );
    }
  }

  if (
    analysis.shape === "follow_up" &&
    analysis.targetProject &&
    includesAny(normalizeForMatch(analysis.repairedQuery), [
      "why does it matter",
      "why does that matter",
      "why is it important",
      "why does this matter"
    ])
  ) {
    const brief = getFlagshipBrief(analysis.targetProject.slug);
    if (brief) {
      return buildDirectReply(
        "fact",
        brief.whyItMatters,
        [`/projects/${analysis.targetProject.slug}`],
        [],
        analysis,
        turnOrigin,
        brief.spokenWhyItMatters ?? brief.whyItMatters
      );
    }
  }

  if (analysis.shape === "compare" && analysis.comparisonProjects?.length) {
    const comparisonSlugs = analysis.comparisonProjects.map((project) => project.slug);
    const sources = analysis.comparisonProjects.map((project) => `/projects/${project.slug}`);

    if (
      comparisonSlugs.includes("research-paper-semantic-gravity") &&
      comparisonSlugs.includes("how-a-7-billion-parameter-ai-cannot-add")
    ) {
      return buildDirectReply(
        "fact",
        "Semantic Gravity is the stronger explanatory research piece around negative constraints, while How a 7-Billion-Parameter AI Cannot Add focuses on length bias in arithmetic behavior; together they show serious model-behavior analysis.",
        sources,
        [],
        analysis,
        turnOrigin,
        "Semantic Gravity is the stronger explanatory research piece around negative constraints, while the seven billion parameter addition interpretability project focuses on length bias in arithmetic behavior; together they show serious model behavior analysis."
      );
    }
  }

  if (
    analysis.shape === "compare" &&
    analysis.entity === "general" &&
    includesAny(normalizeForMatch(analysis.repairedQuery), ["what stands out", "stands out most"])
  ) {
    return buildDirectReply(
      "fact",
      "What stands out is the mix of serious AI research and product judgment: Semantic Gravity and the 7-Billion-Parameter AI Cannot Add project show model-behavior research, while List to Cart shows user-facing AI product design.",
      flagshipProjectOrder.map((slug) => `/projects/${slug}`),
      [],
      analysis,
      turnOrigin,
      "What stands out is the mix of serious AI research and product judgment: Semantic Gravity and the seven billion parameter addition interpretability project show model behavior research, while List to Cart shows user facing AI product design."
    );
  }

  return null;
}

function buildModelPrompt(
  analysis: QuestionAnalysis,
  contextPack: ContextPack,
  turnOrigin?: AssistantTurnOrigin
): AssistantModelPlan {
  const factsBlock = contextPack.facts
    .map((fact) => `[${fact.id}] ${fact.value}`)
    .join("\n");
  const timelineBlock = contextPack.timeline
    .map(
      (item) =>
        `[${item.id}] ${item.company} | ${item.title}${item.start || item.end ? ` | ${item.start ?? "unknown"} to ${item.end ?? "present"}` : ""}\n${item.summary}`
    )
    .join("\n\n");
  const projectsBlock = contextPack.projects
    .map(
      (project) =>
        `Title: ${project.title}\nSummary: ${project.summary}\nWhy it matters: ${project.whyItMatters}${
          project.support ? `\nSupport: ${project.support}` : ""
        }`
    )
    .join("\n\n");

  const shapeSpecificRules: string[] = [];

  if (analysis.entity === "career_background") {
    shapeSpecificRules.push(
      "For career or background questions, answer in no more than two sentences and include the current role at Data Sutram, the earlier companies CaaStle Technologies and Bajaj Finserv Health, and either education or research focus."
    );
  }

  if (analysis.shape === "project") {
    shapeSpecificRules.push(
      "For direct project summaries, answer in one sentence under 220 characters unless the user explicitly asks for more detail."
    );
  }

  if (analysis.shape === "follow_up") {
    shapeSpecificRules.push(
      "For follow-up answers, stay under 220 characters and focus only on the current project or topic."
    );
  }

  if (analysis.shape === "compare") {
    shapeSpecificRules.push(
      "For comparisons, explicitly name each compared project or work item and keep the answer under 300 characters."
    );
  }

  if (analysis.entity === "compensation_expectation") {
    shapeSpecificRules.push(
      "For compensation expectation questions, answer in one sentence, use the explicit compensation fact if present, and do not speculate about current salary."
    );
  }

  const system = [
    "You are the voice agent for Shailesh Rana's portfolio.",
    "Answer only from the provided canonical facts, project briefs, and working memory summary.",
    "Answer only the question asked.",
    "Prefer explicit facts over narrative summaries.",
    "If a requested fact is not clearly stated in the provided context, say that plainly.",
    "Do not reuse the previous answer format unless this is clearly a follow-up.",
    "Do not volunteer unrelated biography, projects, or role commentary.",
    "Keep the answer to one direct sentence by default. Use a second sentence only if the first would be misleading without it.",
    "Return plain prose only. No markdown, bullets, headings, lists, or raw URLs.",
    "If the question is a broad work summary, lead with Semantic Gravity, List to Cart, then How a 7-Billion-Parameter AI Cannot Add.",
    ...shapeSpecificRules
  ].join(" ");

  const user = [
    `Question: ${analysis.repairedQuery}`,
    `Question shape: ${analysis.shape}`,
    `Target entity: ${analysis.entity}`,
    `Turn origin: ${turnOrigin ?? "external"}`,
    contextPack.workingMemorySummary
      ? `Working memory summary: ${contextPack.workingMemorySummary}`
      : "",
    factsBlock ? `Canonical facts:\n${factsBlock}` : "",
    timelineBlock ? `Career timeline:\n${timelineBlock}` : "",
    projectsBlock ? `Project briefs:\n${projectsBlock}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const selectedFactIds = [
    ...contextPack.facts.map((fact) => fact.id),
    ...contextPack.timeline.map((item) => item.id)
  ];
  const sources = new Set<string>();

  for (const project of contextPack.projects) {
    sources.add(`/projects/${project.slug}`);
  }

  if (selectedFactIds.length) {
    sources.add("/#contact");
  }

  return {
    kind: "model",
    questionShape: analysis.shape,
    system,
    user,
    sources: [...sources],
    selectedFactIds,
    nextWorkingMemory: buildWorkingMemory(
      analysis,
      turnOrigin,
      contextPack.workingMemorySummary ?? analysis.repairedQuery
    ),
    modelPreference: analysis.needsStrongModel ? "strong" : "fast",
    escalationReason: analysis.escalationReason
  };
}

export function getSessionTurnCount(history: AssistantHistoryItem[]) {
  return history.filter((item) => item.role === "user").length;
}

export function buildAssistantPlan(
  query: string,
  content: PortfolioContent,
  options: BuildAssistantPlanOptions = {}
): AssistantPlan {
  ensureAssistantFactsConsistency(content);

  const analysis = analyzeQuestion(
    query,
    content,
    options.workingMemory,
    options.contextProjectSlug
  );

  if (analysis.edgeIntent) {
    return buildEdgeReply(analysis.edgeIntent, content, analysis, options.turnOrigin);
  }

  if (analysis.shape === "follow_up" && analysis.memoryNeed === "none") {
    return buildDirectReply(
      "fact",
      "I need the project or topic first. Ask about a specific project, role detail, or background detail and then follow up.",
      ["/#projects"],
      [],
      analysis,
      options.turnOrigin
    );
  }

  const exactFactReply = buildExactFactReply(analysis, content, options.turnOrigin);
  if (exactFactReply) {
    return exactFactReply;
  }

  const contextPack = compileContextPack(analysis, content, options.workingMemory);
  return buildModelPrompt(analysis, contextPack, options.turnOrigin);
}

export function finalizeAssistantReply(rawText: string) {
  const replyText =
    sanitizeParagraph(rawText) ||
    "I couldn't assemble a reliable answer from the portfolio context.";
  const spokenText =
    sanitizeForSpeech(replyText) ||
    "I couldn't assemble a reliable answer from the portfolio context.";

  return { replyText, spokenText };
}

export function finalizeWorkingMemory(plan: AssistantPlan, replyText: string): WorkingMemory {
  return {
    ...plan.nextWorkingMemory,
    lastAnswerSummary: summarizeForMemory(replyText)
  };
}
