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
