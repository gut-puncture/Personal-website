export type ProjectGroup = "research" | "builds" | "side-quests";

export type ProjectLink = {
  label: string;
  href: string;
};

export type ProjectStat = {
  value: string;
  label: string;
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
  groupLabel: string;
  order: number;
  year: string;
  kind: string;
  status: string;
  links: ProjectLink[];
  stats: ProjectStat[];
  aliases: string[];
  markdown: string;
  headings: HeadingItem[];
};

export type ExperienceItem = {
  id: string;
  company: string;
  formerName?: string;
  note?: string;
  title: string;
  start: string;
  end: string;
  summary: string;
  details: string[];
};

export type EducationItem = {
  id: string;
  degree: string;
  school: string;
  years: string;
};

export type SkillEntry = {
  name: string;
  iconId: string;
};

export type Profile = {
  name: string;
  role: string;
  location: string;
  tagline: string;
  strip: Array<{ label: string; value: string }>;
  about: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillEntry[];
  contactParagraphs: string[];
  links: {
    linkedin: string;
    cv: string;
    email: string;
    github: string;
    medium: string;
  };
};

export type PortfolioContent = {
  profile: Profile;
  projects: ProjectEntry[];
};

// Voice agent

export type AssistantHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantTurnOrigin =
  | "text"
  | "voice"
  | "starter"
  | "hero"
  | "project"
  | "launcher"
  | "external";

export type AssistantCurrentPageContext = {
  projectSlug?: string | null;
  pathname?: string | null;
  sectionId?: string | null;
};

/** What the agent carries from one turn to the next. Kept small on purpose. */
export type ConversationState = {
  /** Projects the conversation is currently about, most recent first. */
  focusProjectSlugs: string[];
  turnOrigin?: AssistantTurnOrigin | null;
};

export type AssistantKnowledgeProject = {
  slug: string;
  title: string;
  aliases: string[];
  deepText: string;
};

export type AssistantKnowledge = {
  dossier: string;
  projects: AssistantKnowledgeProject[];
};

export type AssistantSource = {
  label: string;
  href: string;
};

export type AssistantTurnResponse = {
  conversationId: string;
  transcript?: string;
  replyText: string;
  spokenText?: string;
  sources: AssistantSource[];
  /** "direct" for fixed replies, otherwise the Sarvam model that wrote the answer. */
  modelUsed?: string;
  /** True when the answer had to be corrected or replaced by the grounding check. */
  corrected?: boolean;
  nextConversationState: ConversationState;
  remainingTurns: number;
  limitReached: boolean;
  errorCode?: string;
};
