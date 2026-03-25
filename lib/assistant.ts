import type { AssistantHistoryItem, PortfolioContent, ProjectEntry } from "@/lib/types";

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
  "paper"
]);

const profanity = ["fuck", "shit", "bitch", "bastard", "asshole", "fucking"];

export function getSessionTurnCount(history: AssistantHistoryItem[]) {
  return history.filter((item) => item.role === "user").length;
}

export function classifyGuardrail(query: string, content: PortfolioContent) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      kind: "direct" as const,
      response:
        "Ask me about Shailesh's projects, product management work, AI research interests, or whether he is a fit for a role."
    };
  }

  if (normalized.includes("are you ai")) {
    return {
      kind: "direct" as const,
      response:
        "Yes. I'm an AI guide for Shailesh Rana's portfolio. I can answer questions about his projects, skills, and role fit."
    };
  }

  if (
    normalized.includes("looking for a role") ||
    normalized.includes("looking for role") ||
    normalized.includes("open to work") ||
    normalized.includes("what kind of role")
  ) {
    return {
      kind: "direct" as const,
      response:
        "The site says to contact Shailesh on LinkedIn if you think he is a good fit for a Product or AI Researcher role."
    };
  }

  if (profanity.some((word) => normalized.includes(word))) {
    return {
      kind: "direct" as const,
      response:
        "I can still help if the question is about Shailesh's portfolio, projects, skills, or role fit."
    };
  }

  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];
  const hasPortfolioSignal = tokens.some((token) => portfolioKeywords.has(token));
  const mentionsKnownProject = content.projects.some((project) =>
    normalized.includes(project.title.toLowerCase())
  );

  if (!hasPortfolioSignal && !mentionsKnownProject) {
    return {
      kind: "direct" as const,
      response:
        "I’m here only for questions about Shailesh Rana, his projects, his skills, and recruiter-relevant role fit."
    };
  }

  return { kind: "model" as const };
}

function scoreText(queryTokens: string[], haystack: string) {
  const normalized = haystack.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (normalized.includes(token)) score += token.length;
  }
  return score;
}

export function retrieveContext(query: string, content: PortfolioContent) {
  const queryTokens = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const rankedProjects = [...content.projects]
    .map((project) => ({
      project,
      score:
        scoreText(queryTokens, project.title) * 3 +
        scoreText(queryTokens, project.summary) * 2 +
        scoreText(queryTokens, project.plainText.slice(0, 1800))
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.project);

  const matchedSkills = content.skills
    .filter((skill) => scoreText(queryTokens, `${skill.name} ${skill.description ?? ""}`) > 0)
    .slice(0, 6);

  return {
    homeContext: [
      content.home.introHeading,
      ...content.home.introParagraphs,
      ...content.home.contactParagraphs
    ].join("\n"),
    projects: rankedProjects,
    skills: matchedSkills
  };
}

export function buildAssistantPrompt(
  query: string,
  history: AssistantHistoryItem[],
  content: PortfolioContent
) {
  const retrieved = retrieveContext(query, content);
  const projectContext = retrieved.projects
    .map(
      (project: ProjectEntry) =>
        `Title: ${project.title}\nSummary: ${project.summary}\nDetails: ${project.plainText.slice(0, 1500)}`
    )
    .join("\n\n");
  const skillsContext = retrieved.skills
    .map((skill) => `${skill.name} (${skill.type})${skill.description ? ` - ${skill.description}` : ""}`)
    .join("\n");
  const recentHistory = history
    .slice(-4)
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");

  const system = [
    "You are an AI guide for Shailesh Rana's portfolio website.",
    "Answer only from the provided portfolio context.",
    "Be direct, recruiter-friendly, and concise.",
    "Do not invent facts.",
    "If the answer is not in the provided context, say that clearly and redirect to LinkedIn, CV, or email when appropriate.",
    "Never claim to be Shailesh. Say you are the site guide when identity is asked."
  ].join(" ");

  const user = [
    `Question:\n${query}`,
    recentHistory ? `Recent conversation:\n${recentHistory}` : "",
    `Portfolio home context:\n${retrieved.homeContext}`,
    projectContext ? `Relevant projects:\n${projectContext}` : "",
    skillsContext ? `Relevant skills:\n${skillsContext}` : "",
    `Contact links:\nLinkedIn: ${content.home.contactLinks.linkedin}\nCV: ${content.home.contactLinks.cv}\nEmail: ${content.home.contactLinks.email}`
  ]
    .filter(Boolean)
    .join("\n\n");

  const sourceSet = new Set<string>();
  for (const project of retrieved.projects) sourceSet.add(`/projects/${project.slug}`);
  if (!sourceSet.size) sourceSet.add(content.home.contactLinks.linkedin);

  return {
    system,
    user,
    sources: [...sourceSet]
  };
}
