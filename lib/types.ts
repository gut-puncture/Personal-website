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

export type AssistantDecision = "answer" | "clarify" | "abstain";

export type AssistantConfidenceBand = "low" | "medium" | "high";

export type AssistantRiskBand = "low" | "medium" | "high";

export type VerifierVerdict = "pass" | "retry" | "clarify" | "abstain";

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
  | "rewrite"
  | "edge_case";

export type AssistantCurrentPageContext = {
  projectSlug?: string | null;
  pathname?: string | null;
  sectionId?: string | null;
};

export type ConversationState = {
  lastResolvedEntities: string[];
  lastProjectSlugs: string[];
  lastEvidenceIds: string[];
  pendingSlots: string[];
  lastDecision?: AssistantDecision | null;
  lastVerifierVerdict?: VerifierVerdict | null;
  lastQuestionType?: QuestionShape | null;
  lastAnswerSummary?: string | null;
  lastUserQuestion?: string | null;
  lastAssistantAnswer?: string | null;
  turnOrigin?: AssistantTurnOrigin | null;
};

export type WorkingMemory = ConversationState;

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

export type AssistantAnswerType =
  | "identity"
  | "contact"
  | "fact"
  | "project_summary"
  | "project_deep_dive"
  | "comparison"
  | "background"
  | "recruiter_synthesis"
  | "rewrite"
  | "clarification"
  | "abstention"
  | "policy";

export type CanonicalProjectBrief = {
  slug: string;
  title: string;
  group: ProjectGroup;
  summary: string;
  whyItMatters: string;
  aliases: string[];
  source: string;
};

export type EvidenceKind =
  | "fact"
  | "timeline"
  | "profile"
  | "project"
  | "project_section"
  | "project_excerpt";

export type EvidenceChunk = {
  id: string;
  kind: EvidenceKind;
  label: string;
  text: string;
  source: string;
  sourceHref?: string;
  projectSlug?: string;
  company?: string;
  heading?: string;
  keywords: string[];
  entityTags: string[];
  order: number;
};

export type RawFallbackExcerpt = {
  id: string;
  parentEvidenceId: string;
  label: string;
  text: string;
  source: string;
  sourceHref?: string;
  projectSlug?: string;
  keywords: string[];
  entityTags: string[];
  order: number;
};

export type AssistantCorpus = {
  generatedAt: string;
  globalDossier: string;
  dossierSections: {
    identity: string;
    background: string;
    roleFit: string;
    answerStyle: string;
    projectBriefs: CanonicalProjectBrief[];
  };
  facts: AssistantFact[];
  timeline: ExperienceTimelineItem[];
  projectAliases: Record<string, string[]>;
  evidenceChunks: EvidenceChunk[];
  rawFallbackExcerpts: RawFallbackExcerpt[];
};

export type PlannerResult = {
  decision: AssistantDecision;
  rationale: string;
  questionType: QuestionShape;
  domain: "portfolio" | "out_of_domain";
  risk: AssistantRiskBand;
  resolvedEntities: string[];
  candidateProjectSlugs: string[];
  slots: string[];
  retrievalQuery: string;
  needsFallbackEvidence: boolean;
  needsStrongModel: boolean;
  clarificationQuestion?: string | null;
};

export type AnswerDraft = {
  decision: AssistantDecision;
  answer: string;
  usedEvidenceIds: string[];
  answerType: AssistantAnswerType;
  confidenceBand: AssistantConfidenceBand;
  reason: string;
};

export type VerifierResult = {
  verdict: VerifierVerdict;
  relevant: boolean;
  grounded: boolean;
  complete: boolean;
  overreach: boolean;
  reason: string;
  missingSlots: string[];
  needsMoreEvidence: boolean;
};

export type AssistantTurnResponse = {
  conversationId: string;
  transcript?: string;
  replyText: string;
  spokenText?: string;
  sources: string[];
  usedEvidenceIds: string[];
  selectedFactIds: string[];
  decision: AssistantDecision;
  confidenceBand: AssistantConfidenceBand;
  verifierVerdict: VerifierVerdict;
  modelUsed?: string;
  plannerDecision?: AssistantDecision;
  plannerRisk?: AssistantRiskBand;
  escalationUsed?: boolean;
  nextConversationState: ConversationState;
  nextWorkingMemory?: ConversationState;
  remainingTurns: number;
  limitReached: boolean;
  errorCode?: string;
};
