import generated from "@/data/generated/portfolio-content.json";
import type { PortfolioContent, ProjectEntry, ProjectGroup } from "@/lib/types";

const content = generated as unknown as PortfolioContent;

export function getPortfolioContent(): PortfolioContent {
  return content;
}

export function getProjects(): ProjectEntry[] {
  return content.projects;
}

export function getProjectsByGroup(group: ProjectGroup): ProjectEntry[] {
  return content.projects.filter((project) => project.group === group);
}

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return content.projects.find((project) => project.slug === slug);
}
