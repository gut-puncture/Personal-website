import assistantFactsData from "@/data/assistant-facts.json";
import type {
  AssistantFact,
  ExperienceTimelineItem,
  FlagshipProjectBrief,
  PortfolioContent
} from "@/lib/types";

type AssistantKnowledgeData = {
  facts: AssistantFact[];
  timeline: ExperienceTimelineItem[];
  flagshipProjects: FlagshipProjectBrief[];
  projectAliases: Record<string, string[]>;
};

const data = assistantFactsData as AssistantKnowledgeData;

export const assistantFacts = data.facts;
export const assistantTimeline = data.timeline;
export const flagshipProjectKnowledge = data.flagshipProjects;
export const flagshipProjectOrder = flagshipProjectKnowledge.map((project) => project.slug);
export const projectAliasMap = data.projectAliases;

const factById = new Map(assistantFacts.map((fact) => [fact.id, fact]));
const timelineById = new Map(assistantTimeline.map((item) => [item.id, item]));

export function getAssistantFact(id: string) {
  return factById.get(id);
}

export function getTimelineItem(id: string) {
  return timelineById.get(id);
}

export function getFactsByEntity(entity: string) {
  return assistantFacts.filter((fact) => fact.entity === entity);
}

export function getTimelineByCompany(query: string) {
  const normalized = query.toLowerCase();
  return assistantTimeline.find((item) => {
    const company = item.company.toLowerCase();
    return company.includes(normalized) || normalized.includes(company);
  });
}

let validated = false;

export function ensureAssistantFactsConsistency(content: PortfolioContent) {
  if (validated) return;

  const issues: string[] = [];
  const intro = content.home.introParagraphs.join("\n");

  const requiredIntroSignals: Array<{ factId: string; signals: string[] }> = [
    {
      factId: "background.pm-years",
      signals: ["4 yoe", "product management"]
    },
    {
      factId: "role.current",
      signals: ["product manager", "member of technical staff", "data sutram"]
    },
    {
      factId: "role.current-scope",
      signals: ["ux/design", "product management", "development and testing"]
    },
    {
      factId: "research.interests",
      signals: ["agents", "mechanistic interpretability", "continual learning"]
    },
    {
      factId: "background.code-with-ai",
      signals: ["code in the projects", "written using ai"]
    }
  ];

  for (const requiredFact of requiredIntroSignals) {
    const missing = requiredFact.signals.some(
      (signal) => !intro.toLowerCase().includes(signal.toLowerCase())
    );

    if (missing) {
      issues.push(`Generated homepage is missing expected signals for ${requiredFact.factId}`);
    }
  }

  if (issues.length) {
    const message = issues.join("\n");
    if (process.env.NODE_ENV === "production") {
      console.error(message);
    } else {
      throw new Error(message);
    }
  }

  validated = true;
}
