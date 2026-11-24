// Builds the two data files the site reads at run time:
//   data/generated/portfolio-content.json   pages, cards and profile
//   data/generated/assistant-knowledge.json everything the voice agent may say
// Source of truth: content/profile.json and content/projects/*.md.
// The build fails on any malformed project file, so a broken page never ships.

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const projectsDir = path.join(root, "content", "projects");
const profilePath = path.join(root, "content", "profile.json");
const publicDir = path.join(root, "public");
const outputDir = path.join(root, "data", "generated");

const GROUPS = ["research", "builds", "side-quests"];
const GROUP_LABELS = {
  research: "Research",
  builds: "Builds",
  "side-quests": "Side quests"
};
const KINDS = [
  "Paper",
  "Study",
  "Finding",
  "Demo",
  "App",
  "Prototype",
  "Writing",
  "Hardware",
  "Experiment"
];
const SUMMARY_LIMIT = 280;
const STATUS_LIMIT = 90;
const DEEP_TEXT_WORD_LIMIT = 1100;

function fail(file, message) {
  throw new Error(`content/projects/${file}: ${message}`);
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, " ")
    .replace(/[>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(markdown) {
  const seen = new Set();
  const headings = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.*)$/);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    headings.push({ depth: match[1].length, text });
  }

  return headings;
}

function limitWords(text, limit) {
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  return `${words.slice(0, limit).join(" ")} ...`;
}

async function assertMediaExists(file, markdown) {
  const references = [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^https?:\/\//.test(reference)) continue;
    if (!reference.startsWith("/")) fail(file, `image path must start with "/": ${reference}`);
    try {
      await fs.access(path.join(publicDir, decodeURIComponent(reference)));
    } catch {
      fail(file, `image or video not found in public/: ${reference}`);
    }
  }
}

function readString(file, data, key, { required = true, max } = {}) {
  const value = data[key];
  if (value === undefined || value === null || value === "") {
    if (required) fail(file, `missing "${key}"`);
    return "";
  }
  if (typeof value !== "string" && typeof value !== "number") {
    fail(file, `"${key}" must be text`);
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  if (max && text.length > max) {
    fail(file, `"${key}" is ${text.length} characters; the limit is ${max}`);
  }
  return text;
}

async function loadProject(file) {
  const raw = await fs.readFile(path.join(projectsDir, file), "utf8");
  const { data, content } = matter(raw);
  const markdown = content.trim();

  const slug = readString(file, data, "slug");
  if (`${slug}.md` !== file) fail(file, `file name must be "${slug}.md"`);
  if (!/^[a-z0-9-]+$/.test(slug)) fail(file, "slug may only use a-z, 0-9 and hyphens");

  const group = readString(file, data, "group");
  if (!GROUPS.includes(group)) fail(file, `group must be one of ${GROUPS.join(", ")}`);

  const kind = readString(file, data, "kind");
  if (!KINDS.includes(kind)) fail(file, `kind must be one of ${KINDS.join(", ")}`);

  const order = Number(data.order);
  if (!Number.isFinite(order)) fail(file, `"order" must be a number`);

  const links = Array.isArray(data.links) ? data.links : [];
  for (const link of links) {
    if (!link?.label || !/^https?:\/\//.test(link?.href ?? "")) {
      fail(file, `every link needs a label and an https address`);
    }
  }

  const stats = Array.isArray(data.stats) ? data.stats : [];
  if (stats.length > 3) fail(file, "at most 3 stats");
  for (const stat of stats) {
    if (!stat?.value || !stat?.label) fail(file, "every stat needs a value and a label");
  }

  const aliases = Array.isArray(data.aliases) ? data.aliases.map((alias) => String(alias)) : [];
  if (!aliases.length) fail(file, `"aliases" needs at least one entry`);

  if (/^#\s/m.test(markdown.split("```")[0])) {
    fail(file, "the body must not contain a top-level '# ' heading; the title comes from the header");
  }
  if (!markdown) fail(file, "the page has no body text");

  await assertMediaExists(file, markdown);

  let cover = null;
  if (data.cover) {
    if (!data.cover.src || !data.cover.alt) fail(file, `"cover" needs src and alt`);
    await assertMediaExists(file, `![x](${data.cover.src})`);
    cover = { src: String(data.cover.src), alt: String(data.cover.alt) };
  }

  return {
    slug,
    title: readString(file, data, "title", { max: 70 }),
    summary: readString(file, data, "summary", { max: SUMMARY_LIMIT }),
    group,
    groupLabel: GROUP_LABELS[group],
    order,
    year: readString(file, data, "year"),
    kind,
    status: readString(file, data, "status", { max: STATUS_LIMIT }),
    links: links.map((link) => ({ label: String(link.label), href: String(link.href) })),
    stats: stats.map((stat) => ({ value: String(stat.value), label: String(stat.label) })),
    cover,
    aliases,
    agentBrief: readString(file, data, "agent"),
    markdown,
    plainText: stripMarkdown(markdown),
    headings: extractHeadings(markdown)
  };
}

function renderExperience(profile) {
  return profile.experience
    .map((role) => {
      const former = role.formerName ? ` (formerly ${role.formerName})` : "";
      const note = role.note ? ` ${role.note}` : "";
      return [
        `${role.company}${former}: ${role.title}, ${role.start} to ${role.end}.${note}`,
        role.summary,
        ...role.details.map((detail) => `- ${detail}`)
      ].join("\n");
    })
    .join("\n\n");
}

function renderProjectForDossier(project, index) {
  const stats = project.stats.length
    ? `Headline numbers: ${project.stats.map((stat) => `${stat.value} ${stat.label}`).join("; ")}.`
    : "";
  const links = project.links.length
    ? `On its page the visitor can open: ${project.links.map((link) => link.label).join(", ")}.`
    : "It has no external links.";

  return [
    `${index + 1}. ${project.title} [id: ${project.slug}]`,
    `Type: ${project.kind}, ${project.year}. Section of the site: ${project.groupLabel}. Status: ${project.status}`,
    `Also called: ${project.aliases.join(", ")}.`,
    project.agentBrief,
    stats,
    links
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDossier(profile, projects) {
  const research = projects.filter((project) => project.group === "research");
  const lead = research[0];

  return [
    "WHO HE IS",
    `${profile.name} is an independent AI researcher based in ${profile.location}.`,
    profile.agentBio,
    profile.roleFit,
    profile.workingStyle,
    lead
      ? `The work he puts first is "${lead.title}". After it, in order of prominence on the site: ${research
          .slice(1)
          .map((project) => `"${project.title}"`)
          .join(", ")}.`
      : "",
    "",
    "WORK HISTORY (most recent first)",
    renderExperience(profile),
    profile.earlier,
    "He describes this as five years as an AI product manager.",
    "",
    "EDUCATION",
    profile.education.map((item) => `${item.degree}, ${item.school}, ${item.years}.`).join("\n"),
    "",
    "SKILLS",
    `${profile.skills.map((skill) => skill.name).join(", ")}.`,
    "",
    "HOW TO REACH HIM",
    "The contact section at the bottom of the home page has LinkedIn, the CV, email, GitHub and Medium. LinkedIn is the fastest. The CV button also sits at the top of the home page.",
    "",
    "WHAT IS NOT KNOWN HERE",
    profile.agentNotes.join("\n"),
    "",
    `PROJECTS (${projects.length} in total, listed in the order the site shows them)`,
    projects.map((project, index) => renderProjectForDossier(project, index)).join("\n\n")
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");
}

async function main() {
  const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
  const files = (await fs.readdir(projectsDir)).filter((file) => file.endsWith(".md")).sort();
  if (!files.length) throw new Error("content/projects has no project files");

  const loaded = await Promise.all(files.map((file) => loadProject(file)));

  const seen = new Set();
  for (const project of loaded) {
    const key = `${project.group}:${project.order}`;
    if (seen.has(key)) {
      throw new Error(`Two projects share order ${project.order} in group "${project.group}"`);
    }
    seen.add(key);
  }

  const projects = loaded.sort(
    (left, right) =>
      GROUPS.indexOf(left.group) - GROUPS.indexOf(right.group) || left.order - right.order
  );

  const portfolioContent = {
    profile: {
      name: profile.name,
      role: profile.role,
      location: profile.location,
      tagline: profile.tagline,
      strip: profile.strip,
      aiNote: profile.aiNote,
      contactParagraphs: profile.contactParagraphs,
      links: profile.links
    },
    projects: projects.map(({ agentBrief: _agentBrief, plainText: _plainText, ...project }) => project)
  };

  const assistantKnowledge = {
    dossier: buildDossier(profile, projects),
    projects: projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      aliases: project.aliases,
      deepText: limitWords(project.plainText, DEEP_TEXT_WORD_LIMIT)
    }))
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "portfolio-content.json"),
    `${JSON.stringify(portfolioContent, null, 2)}\n`
  );
  await fs.writeFile(
    path.join(outputDir, "assistant-knowledge.json"),
    `${JSON.stringify(assistantKnowledge, null, 2)}\n`
  );

  const dossierWords = assistantKnowledge.dossier.split(/\s+/).length;
  console.log(
    `Prepared ${projects.length} projects. Voice agent dossier: ${dossierWords} words.`
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
