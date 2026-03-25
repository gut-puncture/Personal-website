import {
  assistantProfile,
  flagshipProjectKnowledge,
  flagshipProjectOrder,
  projectAliasMap
} from "@/lib/assistant-knowledge";
import type { AssistantHistoryItem, PortfolioContent, ProjectEntry, SkillEntry } from "@/lib/types";

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
  "recruiter",
  "hire",
  "hiring",
  "job",
  "cv",
  "linkedin",
  "datasutram",
  "ai",
  "rag",
  "embedding",
  "paper",
  "education",
  "background",
  "experience"
]);

const profanity = ["fuck", "shit", "bitch", "bastard", "asshole", "fucking"];
const followUpSignals = ["it", "that", "this project", "that project", "why does it matter"];

type AssistantIntent =
  | "empty"
  | "identity"
  | "role_fit"
  | "education_background"
  | "work_background"
  | "broad_project_summary"
  | "pm_ai_proof"
  | "skills"
  | "project_deep_dive"
  | "contact"
  | "unsupported_personal"
  | "off_topic"
  | "general";

type AssistantDirectPlan = {
  kind: "direct";
  intent: AssistantIntent;
  replyText: string;
  spokenText: string;
  sources: string[];
};

type AssistantModelPlan = {
  kind: "model";
  intent: AssistantIntent;
  system: string;
  user: string;
  sources: string[];
};

export type AssistantPlan = AssistantDirectPlan | AssistantModelPlan;

type RetrievedContext = {
  homeContext: string;
  projects: ProjectEntry[];
  skills: SkillEntry[];
  focusProject?: ProjectEntry;
};

function normalizeForMatch(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(normalizeForMatch(pattern)));
}

function scoreText(queryTokens: string[], haystack: string) {
  const normalized = normalizeForMatch(haystack);
  let score = 0;

  for (const token of queryTokens) {
    if (normalized.includes(token)) score += token.length;
  }

  return score;
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

function sanitizeForSpeech(text: string) {
  return sanitizeParagraph(text)
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildReply(replyText: string, sources: string[]): AssistantDirectPlan {
  const cleanedReply = sanitizeParagraph(replyText);
  return {
    kind: "direct",
    intent: "general",
    replyText: cleanedReply,
    spokenText: sanitizeForSpeech(cleanedReply),
    sources
  };
}

function getFlagshipProjects(content: PortfolioContent) {
  return flagshipProjectOrder
    .map((slug) => content.projects.find((project) => project.slug === slug))
    .filter((project): project is ProjectEntry => Boolean(project));
}

function buildRoleFitReply(content: PortfolioContent): AssistantDirectPlan {
  const flagshipProjects = getFlagshipProjects(content);
  return {
    kind: "direct",
    intent: "role_fit",
    replyText:
      "Shailesh looks strongest for Product roles with serious AI ownership, and the portfolio explicitly invites outreach for Product and AI Researcher roles. His current work combines UX, product management, development, and testing on a B2B SaaS product, while projects like Semantic Gravity and List to Cart show both research depth and product judgment.",
    spokenText:
      "Shailesh looks strongest for Product roles with serious AI ownership, and the portfolio explicitly invites outreach for Product and AI Researcher roles. His current work combines product, UX, development, and testing, while Semantic Gravity and List to Cart show both research depth and product judgment.",
    sources: [
      ...flagshipProjects.slice(0, 2).map((project) => `/projects/${project.slug}`),
      content.home.contactLinks.linkedin
    ]
  };
}

function buildEducationReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "education_background",
    replyText:
      "Shailesh has an MBA in Finance from University Business School, Panjab University, completed from 2020 to 2022. He also has a B.E. in Metallurgical Engineering from PEC University of Technology, Chandigarh, completed from 2013 to 2017.",
    spokenText:
      "Shailesh has an MBA in Finance from University Business School, Panjab University, completed from 2020 to 2022. He also has a B.E. in Metallurgical Engineering from PEC University of Technology, Chandigarh, completed from 2013 to 2017.",
    sources: [content.home.contactLinks.cv]
  };
}

function buildBackgroundReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "work_background",
    replyText: `${assistantProfile.currentRole} ${assistantProfile.currentRoleHighlights[0]} Earlier, he worked at CaaStle Technologies on internal AI systems and assistants, and at Bajaj Finserv Health on product and growth work in healthcare.`,
    spokenText: `${assistantProfile.currentRole} ${assistantProfile.currentRoleHighlights[0]} Earlier, he worked at CaaStle Technologies on internal AI systems and assistants, and at Bajaj Finserv Health on product and growth work in healthcare.`,
    sources: [content.home.contactLinks.cv, content.home.contactLinks.company]
  };
}

function buildBroadSummaryReply(content: PortfolioContent): AssistantDirectPlan {
  const flagshipProjects = getFlagshipProjects(content);
  const sources = flagshipProjects.map((project) => `/projects/${project.slug}`);

  return {
    kind: "direct",
    intent: "broad_project_summary",
    replyText:
      "The three projects that best summarize Shailesh's work are Semantic Gravity, List to Cart, and How a 7-Billion-Parameter AI Cannot Add. Semantic Gravity is a mechanistic interpretability paper on why models fail negative constraints. List to Cart is a user-facing Q-commerce demo that turns a simple grocery list into a full cart. How a 7-Billion-Parameter AI Cannot Add is an interpretability project that uncovered a systematic length bias in addition. Together they show AI research depth, product judgment, and execution.",
    spokenText:
      "The three projects that best summarize Shailesh's work are Semantic Gravity, List to Cart, and How a 7-Billion-Parameter AI Cannot Add. Semantic Gravity is a mechanistic interpretability paper on why models fail negative constraints. List to Cart is a user-facing grocery demo that turns a simple list into a full cart. How a 7-Billion-Parameter AI Cannot Add uncovered a systematic length bias in addition. Together they show AI research depth, product judgment, and execution.",
    sources
  };
}

function buildPmAiReply(content: PortfolioContent): AssistantDirectPlan {
  const flagshipProjects = getFlagshipProjects(content);
  return {
    kind: "direct",
    intent: "pm_ai_proof",
    replyText:
      "If you want the clearest proof of both product management and AI depth, start with List to Cart, Semantic Gravity, and How a 7-Billion-Parameter AI Cannot Add. List to Cart is the best product-facing demo. Semantic Gravity is the strongest original AI research signal. How a 7-Billion-Parameter AI Cannot Add strengthens the interpretability story by showing careful model-behavior analysis.",
    spokenText:
      "If you want the clearest proof of both product management and AI depth, start with List to Cart, Semantic Gravity, and How a 7-Billion-Parameter AI Cannot Add. List to Cart is the best product-facing demo. Semantic Gravity is the strongest original research signal. How a 7-Billion-Parameter AI Cannot Add strengthens the interpretability story with careful model-behavior analysis.",
    sources: flagshipProjects.map((project) => `/projects/${project.slug}`)
  };
}

function buildSkillsReply(content: PortfolioContent): AssistantDirectPlan {
  const visibleSkills = content.skills.map((skill) => skill.name);
  const opening = visibleSkills.slice(0, 6).join(", ");
  return {
    kind: "direct",
    intent: "skills",
    replyText: `The strongest visible skills on the site are ${opening}, plus Python, GitHub, OpenAI Platform, and Google AI Studio. In practice, the portfolio combines product management, stakeholder management, agentic engineering, retrieval work, vector embeddings, and prompt design.`,
    spokenText: `The strongest visible skills on the site are ${opening}, plus Python, GitHub, OpenAI Platform, and Google AI Studio. In practice, the portfolio combines product management, stakeholder management, agentic engineering, retrieval work, vector embeddings, and prompt design.`,
    sources: ["/#skills"]
  };
}

function buildIdentityReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "identity",
    replyText:
      "Yes. I'm the site guide for Shailesh Rana's portfolio, not Shailesh himself. I can help with projects, background, skills, and role fit.",
    spokenText:
      "Yes. I'm the site guide for Shailesh Rana's portfolio, not Shailesh himself. I can help with projects, background, skills, and role fit.",
    sources: [content.home.contactLinks.linkedin]
  };
}

function buildContactReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "contact",
    replyText:
      "The cleanest next step is LinkedIn or the CV button on the site. The contact section also includes email, GitHub, and Medium.",
    spokenText:
      "The cleanest next step is LinkedIn or the CV button on the site. The contact section also includes email, GitHub, and Medium.",
    sources: [
      content.home.contactLinks.linkedin,
      content.home.contactLinks.cv,
      `mailto:${content.home.contactLinks.email}`
    ]
  };
}

function buildUnsupportedPersonalReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "unsupported_personal",
    replyText:
      "I can help with recruiter-relevant details from Shailesh's portfolio and CV summary, but I don't have reliable information about that. The safest next step is LinkedIn or the CV button on the page.",
    spokenText:
      "I can help with recruiter-relevant details from Shailesh's portfolio and CV summary, but I don't have reliable information about that. The safest next step is LinkedIn or the CV button on the page.",
    sources: [content.home.contactLinks.linkedin, content.home.contactLinks.cv]
  };
}

function buildOffTopicReply(content: PortfolioContent): AssistantDirectPlan {
  return {
    kind: "direct",
    intent: "off_topic",
    replyText:
      "I’m here for questions about Shailesh Rana, his projects, his background, and recruiter-relevant role fit.",
    spokenText:
      "I’m here for questions about Shailesh Rana, his projects, his background, and recruiter-relevant role fit.",
    sources: [content.home.contactLinks.linkedin]
  };
}

function buildProjectReply(project: ProjectEntry, content: PortfolioContent): AssistantDirectPlan {
  const flagship = flagshipProjectKnowledge.find((item) => item.slug === project.slug);

  if (flagship) {
    return {
      kind: "direct",
      intent: "project_deep_dive",
      replyText: `${flagship.recruiterSummary} ${flagship.whyItMatters}`,
      spokenText: `${flagship.recruiterSummary} ${flagship.whyItMatters}`,
      sources: [`/projects/${project.slug}`]
    };
  }

  const fallback = `${project.title} is ${project.summary} ${project.previewExcerpt}`;

  return {
    kind: "direct",
    intent: "project_deep_dive",
    replyText: sanitizeParagraph(fallback),
    spokenText: sanitizeForSpeech(fallback),
    sources: [`/projects/${project.slug}`]
  };
}

function getProjectAliases(project: ProjectEntry) {
  return [
    normalizeForMatch(project.title),
    ...(projectAliasMap[project.slug] ?? []).map((alias) => normalizeForMatch(alias))
  ];
}

function detectReferencedProject(
  query: string,
  history: AssistantHistoryItem[],
  content: PortfolioContent
) {
  const normalizedQuery = normalizeForMatch(query);
  const projects = [...content.projects].sort((a, b) => a.priority - b.priority);

  const directMatch = projects.find((project) =>
    getProjectAliases(project).some((alias) => normalizedQuery.includes(alias))
  );

  if (directMatch) return directMatch;
  if (!includesAny(normalizedQuery, followUpSignals)) return undefined;

  const recentContext = history
    .slice(-4)
    .map((item) => normalizeForMatch(item.content))
    .join(" ");

  return projects.find((project) =>
    getProjectAliases(project).some((alias) => recentContext.includes(alias))
  );
}

function detectIntent(
  query: string,
  history: AssistantHistoryItem[],
  content: PortfolioContent
): { intent: AssistantIntent; project?: ProjectEntry } {
  const normalized = normalizeForMatch(query);

  if (!normalized) return { intent: "empty" };
  if (
    includesAny(normalized, ["are you ai", "are you an ai", "who are you", "are you a bot"])
  ) {
    return { intent: "identity" };
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
    return { intent: "education_background" };
  }

  if (
    includesAny(normalized, [
      "looking for a role",
      "looking for role",
      "open to work",
      "role fit",
      "what kind of role",
      "good fit",
      "hire him"
    ])
  ) {
    return { intent: "role_fit" };
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
    return { intent: "broad_project_summary" };
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
    return { intent: "pm_ai_proof" };
  }

  const project = detectReferencedProject(query, history, content);
  if (project) {
    return { intent: "project_deep_dive", project };
  }

  if (
    includesAny(normalized, [
      "work background",
      "experience",
      "current role",
      "where does he work",
      "what does he do now",
      "background"
    ])
  ) {
    return { intent: "work_background" };
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
    return { intent: "skills" };
  }

  if (includesAny(normalized, ["contact", "email", "linkedin", "cv", "resume"])) {
    return { intent: "contact" };
  }

  if (
    includesAny(normalized, [
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
    ])
  ) {
    return { intent: "unsupported_personal" };
  }

  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];
  const hasPortfolioSignal = tokens.some((token) => portfolioKeywords.has(token));
  const swearingOnly =
    profanity.some((word) => normalized.includes(word)) &&
    !hasPortfolioSignal &&
    !normalized.includes("shailesh");

  if (swearingOnly) {
    return { intent: "off_topic" };
  }

  if (!hasPortfolioSignal) {
    return { intent: "off_topic" };
  }

  return { intent: "general" };
}

export function getSessionTurnCount(history: AssistantHistoryItem[]) {
  return history.filter((item) => item.role === "user").length;
}

function retrieveContext(
  query: string,
  content: PortfolioContent,
  focusProject?: ProjectEntry
): RetrievedContext {
  const queryTokens = normalizeForMatch(query).split(" ").filter(Boolean);

  const rankedProjects = [...content.projects]
    .map((project) => ({
      project,
      score:
        scoreText(queryTokens, project.title) * 4 +
        scoreText(queryTokens, project.summary) * 2 +
        scoreText(queryTokens, project.previewExcerpt) * 2 +
        scoreText(queryTokens, project.plainText.slice(0, 2200))
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.project);

  const orderedProjects = focusProject
    ? [focusProject, ...rankedProjects.filter((project) => project.slug !== focusProject.slug)]
    : rankedProjects;

  const matchedSkills = content.skills
    .filter((skill) => scoreText(queryTokens, `${skill.name} ${skill.type}`) > 0)
    .slice(0, 6);

  return {
    homeContext: [
      content.home.introHeading,
      ...content.home.introParagraphs,
      ...content.home.contactParagraphs
    ].join("\n"),
    projects: orderedProjects.slice(0, 3),
    skills: matchedSkills,
    focusProject
  };
}

function buildModelPrompt(
  query: string,
  history: AssistantHistoryItem[],
  content: PortfolioContent,
  intent: AssistantIntent,
  focusProject?: ProjectEntry
): AssistantModelPlan {
  const retrieved = retrieveContext(query, content, focusProject);
  const projectContext = retrieved.projects
    .map(
      (project) =>
        `Title: ${project.title}\nSummary: ${project.summary}\nEvidence: ${project.previewExcerpt}\nDetails: ${project.plainText.slice(0, 1500)}`
    )
    .join("\n\n");

  const skillsContext = retrieved.skills
    .map((skill) => `${skill.name} (${skill.type})`)
    .join("\n");

  const recentHistory = history
    .slice(-4)
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");

  const flagshipContext = flagshipProjectKnowledge
    .map(
      (project) =>
        `${project.title}: ${project.recruiterSummary} ${project.whyItMatters} ${project.pmAiAngle}`
    )
    .join("\n");

  const profileContext = [
    assistantProfile.currentRole,
    ...assistantProfile.currentRoleHighlights,
    ...assistantProfile.priorExperience,
    ...assistantProfile.education,
    assistantProfile.location,
    assistantProfile.roleTargets,
    assistantProfile.interests
  ].join("\n");

  const system = [
    "You are the portfolio guide for Shailesh Rana.",
    "Answer only from the provided project, portfolio, and CV-summary context.",
    "Optimize for recruiter usefulness: specific, concise, concrete, and high-signal.",
    "Return plain prose only. Do not use markdown, bullets, asterisks, headings, or raw URLs.",
    "If the user asks for a broad summary of the work, prioritize these projects in order: Research Paper : Semantic Gravity, Q-Commerce Demo: List to Cart, How a 7-Billion-Parameter AI Cannot Add.",
    "If the user asks about a specific project, start with that project.",
    "If the answer is not in context, say that plainly and point them to LinkedIn or the CV button on the site without writing out a raw link.",
    "Never claim to be Shailesh."
  ].join(" ");

  const user = [
    `Intent: ${intent}`,
    `Question:\n${query}`,
    recentHistory ? `Recent conversation:\n${recentHistory}` : "",
    `Profile and CV summary:\n${profileContext}`,
    `Portfolio home context:\n${retrieved.homeContext}`,
    `Flagship project briefs:\n${flagshipContext}`,
    projectContext ? `Relevant projects:\n${projectContext}` : "",
    skillsContext ? `Relevant skills:\n${skillsContext}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const sources = new Set<string>();

  if (focusProject) {
    sources.add(`/projects/${focusProject.slug}`);
  }

  for (const project of retrieved.projects) {
    sources.add(`/projects/${project.slug}`);
  }

  if (
    intent === "education_background" ||
    intent === "work_background" ||
    intent === "role_fit"
  ) {
    sources.add(content.home.contactLinks.cv);
  }

  if (!sources.size) {
    sources.add(content.home.contactLinks.linkedin);
  }

  return {
    kind: "model",
    intent,
    system,
    user,
    sources: [...sources]
  };
}

export function buildAssistantPlan(
  query: string,
  history: AssistantHistoryItem[],
  content: PortfolioContent
): AssistantPlan {
  const { intent, project } = detectIntent(query, history, content);

  switch (intent) {
    case "empty":
      return buildReply(
        "Ask about Shailesh's projects, current role, education, skills, or whether he is a fit for a product or AI role.",
        [content.home.contactLinks.linkedin]
      );
    case "identity":
      return buildIdentityReply(content);
    case "role_fit":
      return buildRoleFitReply(content);
    case "education_background":
      return buildEducationReply(content);
    case "work_background":
      return buildBackgroundReply(content);
    case "broad_project_summary":
      return buildBroadSummaryReply(content);
    case "pm_ai_proof":
      return buildPmAiReply(content);
    case "skills":
      return buildSkillsReply(content);
    case "contact":
      return buildContactReply(content);
    case "unsupported_personal":
      return buildUnsupportedPersonalReply(content);
    case "off_topic":
      return buildOffTopicReply(content);
    case "project_deep_dive":
      if (project) return buildProjectReply(project, content);
      return buildModelPrompt(query, history, content, intent);
    case "general":
    default:
      return buildModelPrompt(query, history, content, intent, project);
  }
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
