export type ProjectGroup =
  | "Build for users"
  | "Research & systems"
  | "Side quests";

export type MediaItem = {
  url: string;
  kind: "image" | "video";
  alt: string;
};

export type ProjectAction = {
  label: string;
  href: string;
};

export type HeadingItem = {
  depth: number;
  text: string;
};

export type ProjectEntry = {
  slug: string;
  title: string;
  summary: string;
  group: ProjectGroup;
  priority: number;
  markdown: string;
  plainText: string;
  previewExcerpt: string;
  headings: HeadingItem[];
  actions: ProjectAction[];
  externalLinks: string[];
  media: MediaItem[];
};

export type SkillEntry = {
  name: string;
  type: "Expertise" | "Software" | "Language";
  description?: string;
  iconId: string;
  priority: number;
};

export type PortfolioContent = {
  generatedAt: string;
  home: {
    title: string;
    introHeading: string;
    introParagraphs: string[];
    heroImage: {
      url: string;
      alt: string;
      caption: string;
    };
    contactParagraphs: string[];
    contactLinks: {
      linkedin: string;
      medium: string;
      github: string;
      cv: string;
      email: string;
      company: string;
    };
  };
  projects: ProjectEntry[];
  skills: SkillEntry[];
};

export type AssistantHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantFactCertainty = "explicit" | "derived";

export type AssistantFactCategory =
  | "identity"
  | "background"
  | "current_role"
  | "experience"
  | "education"
  | "research"
  | "scalar"
  | "contact"
  | "boundary";

export type AssistantFact = {
  id: string;
  category: AssistantFactCategory;
  value: string;
  spokenForm?: string;
  certainty: AssistantFactCertainty;
  source: string;
  entity?: string;
  keywords: string[];
};

export type ExperienceTimelineItem = {
  id: string;
  company: string;
  title: string;
  start?: string | null;
  end?: string | null;
  summary: string;
  spokenForm?: string;
  certainty: AssistantFactCertainty;
  source: string;
  keywords: string[];
};

export type FlagshipProjectBrief = {
  slug: string;
  title: string;
  aliases: string[];
  coreSummary: string;
  spokenCoreSummary?: string;
  whyItMatters: string;
  spokenWhyItMatters?: string;
  pmAiAngle: string;
  source: string;
};

export type AssistantTurnOrigin =
  | "text"
  | "voice"
  | "starter"
  | "hero"
  | "project"
  | "launcher"
  | "external";

export type QuestionShape =
  | "fact"
  | "count_or_duration"
  | "summary"
  | "compare"
  | "project"
  | "follow_up"
  | "edge_case";

export type WorkingMemory = {
  lastQuestionType?: QuestionShape;
  lastEntity?: string | null;
  lastProjectSlug?: string | null;
  lastAnswerSummary?: string | null;
  turnOrigin?: AssistantTurnOrigin | null;
};

export type TurnStage =
  | "listening"
  | "transcribing"
  | "selecting_context"
  | "writing_answer"
  | "preparing_voice"
  | "speaking";

export type EscalationReason =
  | "comparison"
  | "open_ended_summary"
  | "nuanced_project_explanation"
  | "broad_background_synthesis";
