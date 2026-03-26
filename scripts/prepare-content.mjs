import fs from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";
import { buildAssistantArtifacts } from "./lib/assistant-artifacts.mjs";

const projectRoot = process.cwd();
const exportRoot = path.join(
  projectRoot,
  "ExportBlock-e2394868-2cb2-4211-acc4-d953f60f2124-Part-1"
);
const workRoot = path.join(exportRoot, "Shailesh’s Work");
const outputDir = path.join(projectRoot, "data", "generated");
const publicDir = path.join(projectRoot, "public", "export");
const assistantFactsSeedPath = path.join(projectRoot, "data", "assistant-facts.json");

const projectGroups = {
  "Q-Commerce Demo: List to Cart": "Build for users",
  "Smart Medical Search": "Build for users",
  "Q-Commerce Demo: Grocery Crate Analysis wrt Customer Profile":
    "Build for users",
  "AI Shoe Design": "Build for users",
  "Research Paper : Semantic Gravity": "Research & systems",
  "How a 7-Billion-Parameter AI Cannot Add": "Research & systems",
  "Continuous Learning LLM": "Research & systems",
  "AI Agent Communication Protocol": "Research & systems",
  "The Medium AI Articles": "Research & systems",
  "Parker Square Search": "Research & systems",
  "Garden Watering System": "Side quests",
  "Claude 3.5 Sonnet Twitter Account": "Side quests"
};

const skillIconIds = {
  "Product Management": "roadmap",
  Codex: "brackets",
  "Project Management": "milestones",
  "Data Warehouse Management": "warehouse",
  "Stakeholder Management": "orbits",
  "Retrieval Augmented Generation (RAG)": "magnet",
  "Vector Embeddings": "vectors",
  "Prompt Engineering": "cursor",
  "Data Analytics": "analytics",
  "Google Sheets": "sheets",
  Python: "python",
  Jira: "jira",
  Confluence: "confluence",
  GitHub: "github",
  "OpenAI Platform": "aperture",
  "Google AI Studio": "star",
  "Google Slides": "slides",
  MySQL: "database",
  Tableau: "tableau",
  "Google Analytics": "bars",
  Trino: "rings",
  English: "quotes",
  Hindi: "headline",
  Punjabi: "arcbar"
};

const selectedSkillNames = new Set([
  "Product Management",
  "Stakeholder Management",
  "Codex",
  "Retrieval Augmented Generation (RAG)",
  "Vector Embeddings",
  "Prompt Engineering",
  "OpenAI Platform",
  "Google AI Studio",
  "Python",
  "GitHub"
]);

const actionLabelMap = {
  github: "GitHub",
  app: "App",
  code: "Code",
  demo: "Demo",
  paper: "Paper",
  repository: "Repository"
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s._]+/g, "-")
    .replace(/-+/g, "-");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function encodePublicPath(relativePath) {
  return relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function copyAsset(absPath) {
  const relative = path.relative(workRoot, absPath);
  const outputPath = path.join(publicDir, relative);
  await ensureDir(path.dirname(outputPath));
  await fs.copyFile(absPath, outputPath);
  return `/export/${encodePublicPath(relative)}`;
}

function splitSections(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const parts = normalized.split(/^##\s+/m);
  const [head, ...rest] = parts;
  const sections = {};

  for (const chunk of rest) {
    const newlineIndex = chunk.indexOf("\n");
    const title = chunk.slice(0, newlineIndex).trim();
    const body = chunk.slice(newlineIndex + 1).trim();
    sections[title] = body;
  }

  return {
    head: head.trim(),
    sections
  };
}

function extractParagraphs(sectionBody) {
  return sectionBody
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph &&
        !paragraph.startsWith("![") &&
        !/^https?:\/\//i.test(paragraph) &&
        !/^My \[.*\]\(.*\)$/i.test(paragraph) &&
        !/^Email\s+-/i.test(paragraph) &&
        paragraph !== "Me against the Tech." &&
        !/^Image from /i.test(paragraph) &&
        !/^\[.*\]\(.*\)$/.test(paragraph)
    );
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripInlineMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparable(text) {
  return stripMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractHeadings(markdown) {
  const seen = new Set();

  return markdown
    .split("\n")
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (!match) return null;

      const text = stripInlineMarkdown(match[2]);
      const depth = match[1].length;
      const key = `${depth}:${text.toLowerCase()}`;

      if (!text || seen.has(key)) return null;
      seen.add(key);

      return {
        depth,
        text
      };
    })
    .filter(Boolean);
}

function extractExternalLinks(markdown) {
  const links = new Set();
  const markdownLinkRegex = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  const bareRegex = /(^|\s)(https?:\/\/[^\s)]+)(?=\s|$)/gm;

  for (const match of markdown.matchAll(markdownLinkRegex)) {
    links.add(match[1]);
  }

  for (const match of markdown.matchAll(bareRegex)) {
    links.add(match[2]);
  }
  return [...links];
}

function parseActionPiece(piece) {
  const normalizedPiece = piece.replace(/^#{1,6}\s+/, "").trim();
  const match = normalizedPiece.match(
    /^(Github|GitHub|App|Code|Demo|Paper|Repository)\s*:\s*(.+)$/i
  );
  if (!match) return null;

  const rawTarget = match[2].trim();
  const markdownLink = rawTarget.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
  const bareLink = rawTarget.match(/^(https?:\/\/\S+)$/);
  const href = markdownLink?.[1] ?? bareLink?.[1];

  if (!href) return null;

  return {
    label: actionLabelMap[match[1].toLowerCase()] ?? match[1],
    href
  };
}

function isActionLine(line) {
  const trimmed = line.replace(/^#{1,6}\s+/, "").trim();
  if (!trimmed) return false;
  const pieces = trimmed.split(/\s+\|\s+/);
  return pieces.every((piece) => Boolean(parseActionPiece(piece.trim())));
}

function extractActions(markdown) {
  const actions = [];

  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (!isActionLine(line)) continue;

    for (const piece of line.trim().split(/\s+\|\s+/)) {
      const action = parseActionPiece(piece.trim());
      if (action) actions.push(action);
    }
  }

  return actions.filter(
    (action, index, all) =>
      all.findIndex(
        (candidate) => candidate.label === action.label && candidate.href === action.href
      ) === index
  );
}

function stripActionLines(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !isActionLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripLeadSummary(markdown) {
  return markdown.replace(/(^#\s+[^\n]+\n\n)Text:\s.*?\n\n/m, "$1").trim();
}

function extractFeaturedProjectFiles(markdown) {
  const match = markdown.match(/## Projects\s+([\s\S]*?)(?=\n##\s|\s*$)/m);
  if (!match) return [];

  const links = [...match[1].matchAll(/\]\(([^)]+\/Projects\/[^)]+\.md)\)/g)];
  return links
    .map((item) => path.basename(decodeURIComponent(item[1])))
    .filter((value, index, all) => all.indexOf(value) === index);
}

function extractPreviewExcerpt(markdown, summary, title) {
  const normalizedSummary = summary.trim();
  const comparableTitle = normalizeComparable(title);
  const comparableSummary = normalizeComparable(summary);

  const paragraphs = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((block) => stripMarkdown(block))
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !block.startsWith("Text:"))
    .filter((block) => block.toLowerCase() !== title.toLowerCase())
    .filter((block) => !/^overview$/i.test(block))
    .filter((block) => !/^(Github|GitHub|App|Code|Demo|Paper|Repository)\s*:/i.test(block))
    .filter((block) => !/^https?:\/\//i.test(block))
    .filter((block) => block.length > 36)
    .filter((block) => {
      const comparableBlock = normalizeComparable(block);
      return comparableBlock !== comparableTitle && comparableBlock !== comparableSummary;
    });

  const excerpt = paragraphs[0] ?? normalizedSummary;
  if (excerpt.length <= 220) return excerpt;

  const truncated = excerpt.slice(0, 220);
  return `${truncated.slice(0, truncated.lastIndexOf(" ")).trim()}...`;
}

async function rewriteLocalLinks(markdown, currentFile) {
  const currentDir = path.dirname(currentFile);
  const markdownLinkRegex = /(!?\[[^\]]*\]\()([^)]+)(\))/g;
  let rewritten = markdown;

  for (const match of markdown.matchAll(markdownLinkRegex)) {
    const rawTarget = match[2];
    if (/^(https?:|mailto:|#)/.test(rawTarget)) {
      continue;
    }

    const resolved = path.resolve(currentDir, decodeURIComponent(rawTarget));
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) continue;
      if (resolved.endsWith(".md") || resolved.endsWith(".csv")) continue;
      const publicUrl = await copyAsset(resolved);
      rewritten = rewritten.replace(match[0], `${match[1]}${publicUrl}${match[3]}`);
    } catch {
      continue;
    }
  }

  const siblingFiles = await walk(currentDir);
  for (const sibling of siblingFiles) {
    if (!/\.(png|jpe?g|gif|webp|mp4)$/i.test(sibling)) continue;
    if (!sibling.includes("(")) continue;
    const relativeRef = path
      .relative(currentDir, sibling)
      .split(path.sep)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    if (!rewritten.includes(relativeRef)) continue;
    const publicUrl = await copyAsset(sibling);
    rewritten = rewritten.split(relativeRef).join(publicUrl);
  }

  return rewritten;
}

async function listProjectMedia(projectDir) {
  try {
    const mediaFiles = await walk(projectDir);
    const filtered = mediaFiles.filter((file) =>
      /\.(png|jpe?g|gif|webp|mp4)$/i.test(file)
    );
    const items = [];
    for (const file of filtered) {
      const publicUrl = await copyAsset(file);
      items.push({
        url: publicUrl,
        kind: file.endsWith(".mp4") ? "video" : "image",
        alt: path.basename(file)
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function build() {
  await ensureDir(outputDir);
  await ensureDir(publicDir);

  const homeFile = path.join(
    exportRoot,
    "Shailesh’s Work 1971a6d96e548046b527e53e2d1d6349.md"
  );
  const homeMarkdown = await fs.readFile(homeFile, "utf8");
  const heroImagePath = path.join(workRoot, "ChatGPT_Image_Mar_25_2026_04_16_07_AM.png");
  const heroImageUrl = await copyAsset(heroImagePath);
  const homeSections = splitSections(homeMarkdown);
  const featuredProjectFiles = extractFeaturedProjectFiles(homeMarkdown);
  const helloBody = homeSections.sections["Hello, I’m Shailesh Rana."];
  const contactBody = homeSections.sections["Contact Me"];

  const projectCsv = await fs.readFile(
    path.join(workRoot, "Projects 1971a6d96e5481ad937cff1c1a8fbb61.csv"),
    "utf8"
  );
  const skillCsv = await fs.readFile(
    path.join(workRoot, "Skills 1971a6d96e5481029bdfd4a78e8aba7b_all.csv"),
    "utf8"
  );

  const projectRows = parse(projectCsv, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
  const skillRows = parse(skillCsv, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  const projectFiles = (await walk(path.join(workRoot, "Projects")))
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const projects = [];

  for (const [index, file] of projectFiles.entries()) {
    const raw = await fs.readFile(file, "utf8");
    const rewritten = await rewriteLocalLinks(raw, file);
    const cleanedMarkdown = stripLeadSummary(stripActionLines(rewritten));
    const title = raw.split("\n")[0].replace(/^#\s+/, "").trim();
    const row = projectRows.find((item) => item.Name.trim() === title.trim());
    const slug = slugify(title);
    const localMedia = await listProjectMedia(
      path.join(path.dirname(file), path.basename(file, ".md"))
    );
    const media = localMedia.length
      ? localMedia
      : rewritten.includes("![](") || rewritten.includes("![")
        ? [...rewritten.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((match) => ({
            url: match[2],
            kind: /\.(mp4)$/i.test(match[2]) ? "video" : "image",
            alt: match[1] || title
          }))
        : [];

    projects.push({
      slug,
      title,
      sourceFile: path.basename(file),
      summary: row?.Text?.trim() ?? "",
      group: projectGroups[title] ?? "Research & systems",
      priority: index + 1,
      markdown: cleanedMarkdown,
      plainText: stripMarkdown(cleanedMarkdown),
      previewExcerpt: extractPreviewExcerpt(cleanedMarkdown, row?.Text?.trim() ?? "", title),
      headings: extractHeadings(cleanedMarkdown),
      actions: extractActions(rewritten),
      externalLinks: extractExternalLinks(rewritten),
      media
    });
  }

  const projectsByTitle = new Map(projects.map((project) => [project.title, project]));
  const projectsBySourceFile = new Map(projects.map((project) => [project.sourceFile, project]));
  const featuredProjects = featuredProjectFiles
    .map((file) => projectsBySourceFile.get(file))
    .filter(Boolean);
  const featuredSlugs = new Set(featuredProjects.map((project) => project.slug));

  const csvOrderedProjects = projectRows
    .map((row, index) => {
      const project = projectsByTitle.get(row.Name.trim());
      if (!project) return null;
      return {
        ...project,
        priority: index + 1
      };
    })
    .filter(Boolean)
    .filter((project) => !featuredSlugs.has(project.slug));

  const unorderedRemainder = projects.filter(
    (project) =>
      !featuredSlugs.has(project.slug) &&
      !csvOrderedProjects.some((orderedProject) => orderedProject.slug === project.slug)
  );

  const orderedProjects = [...featuredProjects, ...csvOrderedProjects, ...unorderedRemainder].map(
    (project, index) => {
      const { sourceFile, ...rest } = project;
      return {
        ...rest,
        priority: index + 1
      };
    }
  );

  const skills = skillRows
    .filter((row) => selectedSkillNames.has(row.Name))
    .map((row, index) => ({
      name: row.Name,
      type: row.Type,
      description: "",
      iconId: skillIconIds[row.Name] ?? "generic",
      priority: index + 1
    }));

  const content = {
    generatedAt: new Date().toISOString(),
    home: {
      title: "Shailesh’s Work",
      introHeading: "Hello, I’m Shailesh Rana.",
      introParagraphs: extractParagraphs(helloBody),
      heroImage: {
        url: heroImageUrl,
        alt: "Me against the Tech.",
        caption: "Me against the Tech."
      },
      contactParagraphs: extractParagraphs(contactBody),
      contactLinks: {
        linkedin: "https://www.linkedin.com/in/shailesh-rana-9236971b6/",
        medium: "https://medium.com/@shaileshrana1995",
        github: "https://github.com/gut-puncture",
        cv: "https://drive.google.com/drive/folders/1yb1t3-OF5uc9kl6p6uryOhMNN8gkMmSQ?usp=drive_link",
        email: "shaileshrana1995@gmail.com",
        company: "https://datasutram.com/"
      }
    },
    projects: orderedProjects,
    skills
  };

  const assistantSeed = JSON.parse(await fs.readFile(assistantFactsSeedPath, "utf8"));
  const { assistantCorpus, assistantEvalCases } = buildAssistantArtifacts(content, assistantSeed);

  await fs.writeFile(
    path.join(outputDir, "portfolio-content.json"),
    JSON.stringify(content, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, "assistant-corpus.json"),
    JSON.stringify(assistantCorpus, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, "assistant-eval.v2.json"),
    JSON.stringify(assistantEvalCases, null, 2)
  );
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
