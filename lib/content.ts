import fs from "node:fs/promises";
import path from "node:path";

import type { PortfolioContent, ProjectEntry, SkillEntry } from "@/lib/types";

const generatedPath = path.join(
  process.cwd(),
  "data",
  "generated",
  "portfolio-content.json"
);

let cachedContent: PortfolioContent | null = null;

export async function getPortfolioContent(): Promise<PortfolioContent> {
  if (cachedContent) return cachedContent;
  const raw = await fs.readFile(generatedPath, "utf8");
  cachedContent = JSON.parse(raw) as PortfolioContent;
  return cachedContent;
}

export async function getProjects() {
  const content = await getPortfolioContent();
  return content.projects;
}

export async function getProjectBySlug(slug: string): Promise<ProjectEntry | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
}

export async function getSkillsByType() {
  const content = await getPortfolioContent();
  const grouped = content.skills.reduce<Record<string, SkillEntry[]>>((acc, skill) => {
    const key = skill.type;
    acc[key] ??= [];
    acc[key].push(skill);
    return acc;
  }, {});

  return grouped as Record<SkillEntry["type"], SkillEntry[]>;
}
