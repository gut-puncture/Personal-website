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

function normalizeForMatch(text) {
  return stripMarkdown(text)
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeForMatch(text).split(" ").filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sentenceCase(text) {
  return stripInlineMarkdown(text).replace(/\s+/g, " ").trim();
}

function firstSentence(text) {
  const normalized = sentenceCase(text);
  if (!normalized) return "";
  return normalized.split(/(?<=[.?!])\s+/)[0] ?? normalized;
}

function clampWords(text, maxWords) {
  const words = sentenceCase(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ").trim()}...`;
}

function splitProjectSections(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let current = {
    heading: "Overview",
    lines: []
  };

  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.*)$/);
    if (match) {
      const text = stripMarkdown(current.lines.join("\n"));
      if (text) {
        sections.push({
          heading: current.heading,
          text
        });
      }
      current = {
        heading: stripInlineMarkdown(match[2]) || "Section",
        lines: []
      };
      continue;
    }

    current.lines.push(line);
  }

  const trailing = stripMarkdown(current.lines.join("\n"));
  if (trailing) {
    sections.push({
      heading: current.heading,
      text: trailing
    });
  }

  return sections.filter((section) => section.text);
}

function deriveProjectWhyItMatters(project) {
  const summary = sentenceCase(project.summary);
  const excerpt = sentenceCase(project.previewExcerpt);

  if (excerpt && excerpt !== summary) {
    return firstSentence(excerpt);
  }

  const sections = splitProjectSections(project.markdown);
  const candidate = sections.find((section) => section.heading !== "Overview");
  return firstSentence(candidate?.text ?? excerpt ?? summary);
}

function buildProjectAliases(project, seedAliases = []) {
  const title = sentenceCase(project.title).replace(/\u00a0/g, " ");
  const aliases = [
    title,
    title.replace(/\s*:\s*/g, " "),
    project.slug.replace(/-/g, " "),
    ...seedAliases
  ];

  if (title.includes(":")) {
    aliases.push(title.split(":").slice(1).join(":").trim());
  }

  if (/^Research Paper/i.test(title)) {
    aliases.push(title.replace(/^Research Paper\s*:?\s*/i, "").trim());
  }

  if (/^Q-Commerce Demo/i.test(title)) {
    aliases.push(title.replace(/^Q-Commerce Demo\s*:?\s*/i, "").trim());
    aliases.push(title.replace(/^Q-Commerce Demo\s*:?\s*/i, "").replace(/wrt/gi, "with respect to").trim());
  }

  if (/How a 7-Billion-Parameter AI Cannot/i.test(title)) {
    aliases.push("7 billion parameter AI cannot add");
    aliases.push("seven billion parameter AI cannot add");
    aliases.push("length bias addition project");
  }

  if (/Continuous Learning LLM/i.test(title)) {
    aliases.push("continual learning");
  }

  return unique(
    aliases
      .map((value) => sentenceCase(value))
      .filter(Boolean)
  );
}

function buildProfileEvidence(content, facts, timeline) {
  const chunks = [];
  let order = 0;

  for (const [index, paragraph] of content.home.introParagraphs.entries()) {
    const text = sentenceCase(paragraph);
    if (!text) continue;
    chunks.push({
      id: `profile:intro:${index + 1}`,
      kind: "profile",
      label: `Intro ${index + 1}`,
      text,
      source: `home.introParagraphs[${index}]`,
      sourceHref: "/",
      keywords: tokenize(text).slice(0, 18),
      entityTags: ["profile"],
      order: order++
    });
  }

  for (const fact of facts) {
    chunks.push({
      id: fact.id,
      kind: "fact",
      label: fact.id,
      text: sentenceCase(fact.value),
      source: fact.source,
      sourceHref: fact.category === "contact" ? "/#contact" : "/",
      keywords: unique([...(fact.keywords ?? []), ...(fact.entity ? [fact.entity] : [])]),
      entityTags: unique([fact.category, fact.entity ?? "profile"]),
      order: order++
    });
  }

  for (const item of timeline) {
    chunks.push({
      id: item.id,
      kind: "timeline",
      label: `${item.company} timeline`,
      text: sentenceCase(item.summary),
      source: item.source,
      sourceHref: "/",
      company: item.company,
      keywords: unique([item.company, item.title, ...(item.keywords ?? [])]),
      entityTags: unique(["timeline", normalizeForMatch(item.company)]),
      order: order++
    });
  }

  return chunks;
}

function buildProjectEvidence(content, projectAliases) {
  const evidenceChunks = [];
  const rawFallbackExcerpts = [];
  const projectBriefs = [];
  let order = 0;

  for (const project of content.projects) {
    const aliases = buildProjectAliases(project, projectAliases[project.slug]);
    const whyItMatters = deriveProjectWhyItMatters(project);
    const summary = sentenceCase(project.summary || project.previewExcerpt || project.plainText);

    projectBriefs.push({
      slug: project.slug,
      title: project.title.replace(/\u00a0/g, " "),
      group: project.group,
      summary: clampWords(summary, 38),
      whyItMatters: clampWords(whyItMatters || summary, 34),
      aliases,
      source: `/projects/${project.slug}`
    });

    evidenceChunks.push({
      id: `project:${project.slug}:overview`,
      kind: "project",
      label: `${project.title} overview`,
      text: clampWords(
        `${summary}. ${whyItMatters ? `Why it matters: ${whyItMatters}` : ""} ${project.previewExcerpt}`,
        120
      ),
      source: project.sourceFile ?? `projects.${project.slug}`,
      sourceHref: `/projects/${project.slug}`,
      projectSlug: project.slug,
      keywords: unique([project.title, project.group, ...aliases]),
      entityTags: unique([project.slug, project.group.toLowerCase()]),
      order: order++
    });

    const sections = splitProjectSections(project.markdown);
    for (const [sectionIndex, section] of sections.entries()) {
      const sectionText = sentenceCase(section.text);
      if (!sectionText) continue;

      evidenceChunks.push({
        id: `project:${project.slug}:section:${sectionIndex + 1}`,
        kind: section.heading === "Overview" ? "project_excerpt" : "project_section",
        label: `${project.title} - ${section.heading}`,
        text: clampWords(sectionText, 140),
        source: `${project.sourceFile ?? project.slug}#${section.heading}`,
        sourceHref: `/projects/${project.slug}`,
        projectSlug: project.slug,
        heading: section.heading,
        keywords: unique([project.title, section.heading, ...aliases]),
        entityTags: unique([project.slug, project.group.toLowerCase(), normalizeForMatch(section.heading)]),
        order: order++
      });

      if (sectionText.split(/\s+/).length > 120) {
        rawFallbackExcerpts.push({
          id: `fallback:${project.slug}:${sectionIndex + 1}`,
          parentEvidenceId: `project:${project.slug}:section:${sectionIndex + 1}`,
          label: `${project.title} - ${section.heading} (extended)`,
          text: clampWords(sectionText, 260),
          source: `${project.sourceFile ?? project.slug}#${section.heading}`,
          sourceHref: `/projects/${project.slug}`,
          projectSlug: project.slug,
          keywords: unique([project.title, section.heading, ...aliases]),
          entityTags: unique([project.slug, normalizeForMatch(section.heading)]),
          order: rawFallbackExcerpts.length
        });
      }
    }
  }

  return {
    evidenceChunks,
    rawFallbackExcerpts,
    projectBriefs
  };
}

function buildGlobalDossier(content, facts, timeline, projectBriefs) {
  const factById = new Map(facts.map((fact) => [fact.id, fact]));
  const identity = [
    "This assistant answers only about Shailesh Rana's portfolio, background, current role, projects, and role fit.",
    factById.get("identity.voice-agent")?.value ?? "This assistant is the portfolio voice agent, not Shailesh himself."
  ]
    .filter(Boolean)
    .join(" ");

  const background = [
    factById.get("role.current")?.value,
    factById.get("role.current-scope")?.value,
    factById.get("background.pm-years")?.value,
    factById.get("background.previous-role")?.value,
    factById.get("research.interests")?.value,
    factById.get("education.mba")?.value,
    factById.get("education.be")?.value,
    factById.get("background.location")?.value,
    ...timeline.map((item) => item.summary)
  ]
    .filter(Boolean)
    .join(" ");

  const roleFit = [
    factById.get("background.role-fit")?.value,
    "Recruiter and hiring-manager questions should be answered with grounded evidence from current role, project mix, and prior work, not generic praise."
  ]
    .filter(Boolean)
    .join(" ");

  const answerStyle = [
    "Answer in plain, high-signal prose.",
    "Be direct, specific, and unsalesy.",
    "If the evidence is ambiguous, ask a narrow clarification question.",
    "If the evidence is insufficient, abstain instead of guessing.",
    "Do not invent details, timeline dates, or project outcomes that are not in the corpus."
  ].join(" ");

  const projectLines = projectBriefs.map(
    (project, index) =>
      `${index + 1}. ${project.title} [${project.group}] - ${project.summary} Why it matters: ${project.whyItMatters}`
  );

  return {
    identity,
    background,
    roleFit,
    answerStyle,
    text: [
      "Portfolio dossier:",
      `Identity: ${identity}`,
      `Background: ${background}`,
      `Role fit: ${roleFit}`,
      "Projects:",
      ...projectLines,
      `Answer style: ${answerStyle}`
    ].join("\n")
  };
}

function buildSignalTerms(projectBrief) {
  const titleTokens = tokenize(projectBrief.title).filter(
    (token) => token.length > 3 && !["demo", "project", "paper", "with", "from", "that"].includes(token)
  );
  const summaryTokens = tokenize(projectBrief.summary).filter(
    (token) => token.length > 4 && !["which", "their", "about", "because", "shows"].includes(token)
  );
  return unique([...projectBrief.aliases.slice(0, 3), ...titleTokens.slice(0, 3), ...summaryTokens.slice(0, 3)]).slice(0, 6);
}

function starterConversationState(projectSlug) {
  return {
    lastResolvedEntities: projectSlug ? [`project:${projectSlug}`] : [],
    lastProjectSlugs: projectSlug ? [projectSlug] : [],
    lastEvidenceIds: projectSlug ? [`project:${projectSlug}:overview`] : [],
    pendingSlots: [],
    lastDecision: "answer",
    lastVerifierVerdict: "pass",
    lastQuestionType: projectSlug ? "project" : "summary",
    lastAnswerSummary: null,
    lastUserQuestion: null,
    lastAssistantAnswer: null,
    turnOrigin: projectSlug ? "project" : "starter"
  };
}

function buildAssistantEvalCases(content, assistantCorpus) {
  const cases = [];
  const addCase = (entry) => {
    cases.push({
      id: entry.id ?? `case-${String(cases.length + 1).padStart(3, "0")}`,
      ...entry
    });
  };

  const genericForbidden = [
    "strongest work starts with",
    "i’m here for questions about shailesh rana",
    "i am here for questions about shailesh rana",
    "i couldn't assemble a reliable answer",
    "i need the project or topic first"
  ];

  addCase({
    id: "identity-voice-agent",
    question: "Are you Shailesh?",
    expectedDecision: "answer",
    requiredAny: ["voice agent", "not shailesh"],
    forbiddenAny: genericForbidden
  });

  addCase({
    id: "contact-linkedin",
    question: "What is the cleanest way to reach him?",
    expectedDecision: "answer",
    requiredAny: ["linkedin", "cv"],
    forbiddenAny: genericForbidden
  });

  addCase({
    id: "unsupported-personal",
    question: "Is he married?",
    expectedDecision: "abstain",
    requiredAny: ["private", "do not have reliable information", "portfolio"],
    forbiddenAny: genericForbidden
  });

  addCase({
    id: "off-domain",
    question: "Who won the 2026 IPL?",
    expectedDecision: "abstain",
    requiredAny: ["portfolio", "projects", "background"],
    forbiddenAny: ["ipl champion"]
  });

  const factPromptsById = {
    "identity.voice-agent": [
      "Who am I talking to?",
      "Are you the actual person or the site assistant?"
    ],
    "background.pm-years": [
      "How many years of product management experience does he have?",
      "What is his PM experience in years?"
    ],
    "background.previous-role": [
      "What did he do before product management?",
      "What was his background before becoming a PM?"
    ],
    "role.current": [
      "What is his current role?",
      "Where does he work now and what is the role?"
    ],
    "role.current-scope": [
      "What does he own in the current job?",
      "What is the scope of his current role?"
    ],
    "research.interests": [
      "What does he research for fun?",
      "What are his AI research interests?"
    ],
    "education.mba": [
      "What is his MBA background?",
      "Where did he do his MBA?"
    ],
    "education.be": [
      "What engineering degree does he have?",
      "Where did he do his engineering degree?"
    ],
    "background.location": [
      "Where is he based?",
      "What city is he in?"
    ],
    "background.role-fit": [
      "What kind of roles is he strongest for?",
      "What role fit comes through from the portfolio?"
    ],
    "background.compensation-ask": [
      "What compensation is he targeting for a new role?",
      "What is his compensation ask?"
    ]
  };

  for (const fact of assistantCorpus.facts) {
    const prompts = factPromptsById[fact.id] ?? [];
    for (const prompt of prompts) {
      addCase({
        question: prompt,
        expectedDecision: "answer",
        requiredAny: tokenize(fact.value).filter((token) => token.length > 4).slice(0, 3),
        forbiddenAny: genericForbidden
      });
    }
  }

  for (const item of assistantCorpus.timeline) {
    addCase({
      question: `What did he do at ${item.company}?`,
      expectedDecision: "answer",
      requiredAny: tokenize(item.summary).filter((token) => token.length > 4).slice(0, 4),
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Summarize the ${item.company} chapter in one clean sentence.`,
      expectedDecision: "answer",
      requiredAny: [item.company.toLowerCase(), ...tokenize(item.summary).filter((token) => token.length > 5).slice(0, 3)],
      maxCharacters: 240,
      forbiddenAny: genericForbidden
    });
  }

  const projectBriefs = assistantCorpus.dossierSections.projectBriefs;
  for (const [index, project] of projectBriefs.entries()) {
    const other = projectBriefs[(index + 1) % projectBriefs.length];
    const signals = buildSignalTerms(project);

    addCase({
      question: `Tell me about ${project.title}.`,
      expectedDecision: "answer",
      currentPageContext: { projectSlug: project.slug },
      requiredAny: signals,
      requiredEvidenceAny: [`project:${project.slug}:overview`],
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `What problem does ${project.aliases[0]} solve?`,
      expectedDecision: "answer",
      requiredAny: signals,
      requiredEvidenceAny: [`project:${project.slug}:overview`],
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Why does ${project.aliases[0]} matter?`,
      expectedDecision: "answer",
      requiredAny: tokenize(project.whyItMatters).filter((token) => token.length > 5).slice(0, 4),
      requiredEvidenceAny: [`project:${project.slug}:overview`],
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Explain ${project.aliases[0]} in plain English.`,
      expectedDecision: "answer",
      requiredAny: signals,
      maxCharacters: 280,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `What about ${project.aliases[0]} would make a recruiter care?`,
      expectedDecision: "answer",
      requiredAny: tokenize(project.whyItMatters).filter((token) => token.length > 5).slice(0, 4),
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Compare ${project.aliases[0]} with ${other.aliases[0]}.`,
      expectedDecision: "answer",
      requiredAny: [normalizeForMatch(project.aliases[0]), normalizeForMatch(other.aliases[0])],
      forbiddenAny: genericForbidden
    });

    addCase({
      question: "Tell me about this project.",
      currentPageContext: { projectSlug: project.slug, pathname: `/projects/${project.slug}` },
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: "Why is that one interesting?",
      history: [{ role: "user", content: `Tell me about ${project.title}.` }],
      conversationState: starterConversationState(project.slug),
      expectedDecision: "answer",
      requiredAny: tokenize(project.whyItMatters).filter((token) => token.length > 5).slice(0, 3),
      forbiddenAny: genericForbidden
    });

    addCase({
      question: "Shorter. Not salesy.",
      history: [
        { role: "user", content: `Tell me about ${project.title}.` },
        { role: "assistant", content: `${project.summary} ${project.whyItMatters}` }
      ],
      conversationState: {
        ...starterConversationState(project.slug),
        lastUserQuestion: `Tell me about ${project.title}.`,
        lastAssistantAnswer: `${project.summary} ${project.whyItMatters}`,
        lastAnswerSummary: project.summary
      },
      expectedDecision: "answer",
      requiredAny: signals,
      maxCharacters: 220,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: "What is its limitation or tradeoff?",
      history: [
        { role: "user", content: `Tell me about ${project.title}.` },
        { role: "assistant", content: `${project.summary} ${project.whyItMatters}` }
      ],
      conversationState: {
        ...starterConversationState(project.slug),
        lastUserQuestion: `Tell me about ${project.title}.`,
        lastAssistantAnswer: `${project.summary} ${project.whyItMatters}`,
        lastAnswerSummary: project.summary
      },
      expectedDecision: ["answer", "clarify"],
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Show me a ${project.group === "Build for users" ? "research" : "user-facing"} project instead.`,
      history: [
        { role: "user", content: `Tell me about ${project.title}.` },
        { role: "assistant", content: `${project.summary} ${project.whyItMatters}` }
      ],
      conversationState: {
        ...starterConversationState(project.slug),
        lastUserQuestion: `Tell me about ${project.title}.`,
        lastAssistantAnswer: `${project.summary} ${project.whyItMatters}`,
        lastAnswerSummary: project.summary
      },
      expectedDecision: "answer",
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Which part of ${project.aliases[0]} feels most like product judgment?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Which part of ${project.aliases[0]} feels most like AI or research depth?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Give me the fastest possible summary of ${project.title}.`,
      expectedDecision: "answer",
      requiredAny: signals,
      maxCharacters: 180,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Why is ${project.aliases[0]} not just a toy?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `What does ${project.aliases[0]} reveal about his taste or judgment?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Who benefits from ${project.aliases[0]}?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `What is the one thing I should remember about ${project.aliases[0]}?`,
      expectedDecision: "answer",
      requiredAny: signals,
      maxCharacters: 220,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `Make the case for ${project.aliases[0]} in one clean sentence.`,
      expectedDecision: "answer",
      requiredAny: signals,
      maxCharacters: 220,
      forbiddenAny: genericForbidden
    });

    addCase({
      question: `If I am skeptical, what is the strongest reason to take ${project.aliases[0]} seriously?`,
      expectedDecision: "answer",
      requiredAny: signals,
      forbiddenAny: genericForbidden
    });
  }

  const recruiterPrompts = [
    "What kind of role is he a fit for?",
    "Write a recruiter note on him.",
    "He sounds more research than product. True or false?",
    "Which projects best show product judgment under pressure?",
    "Which projects best show serious AI depth?",
    "Give me the shortest convincing intro for a recruiter.",
    "What would separate him from generic AI PM candidates?",
    "If I only have 20 seconds, what should I know?",
    "Make the case for product and the case for research.",
    "What is the strongest evidence that he can ship, not just explore?",
    "What is the strongest evidence that he can reason about model behavior?",
    "Which work best shows taste plus execution?",
    "Which work best shows he can learn fast as the field changes?",
    "What would make a skeptical hiring manager take him seriously?",
    "Is he better framed as PM with AI depth or researcher with product instincts?",
    "Give me a balanced answer, not hype.",
    "What makes the portfolio coherent instead of random?",
    "What are the top three proof points on this site?",
    "If a recruiter asks why now, what is the answer?",
    "How should someone read the project mix on this site?",
    "What would you say to a recruiter who worries he is too broad?",
    "What would you say to a recruiter who worries he is too niche?"
  ];

  for (const prompt of recruiterPrompts) {
    addCase({
      question: prompt,
      expectedDecision: "answer",
      forbiddenAny: genericForbidden
    });
  }

  const clarificationPrompts = [
    "Tell me more.",
    "Go deeper.",
    "That sounds generic.",
    "Explain that in plain English.",
    "What do you mean by that?",
    "And the other one?"
  ];

  for (const prompt of clarificationPrompts) {
    addCase({
      question: prompt,
      expectedDecision: "clarify",
      forbiddenAny: genericForbidden
    });
  }

  return cases;
}

export function buildAssistantArtifacts(content, assistantSeed) {
  const seedAliases = assistantSeed.projectAliases ?? {};
  const profileEvidence = buildProfileEvidence(content, assistantSeed.facts, assistantSeed.timeline);
  const { evidenceChunks: projectEvidence, rawFallbackExcerpts, projectBriefs } = buildProjectEvidence(
    content,
    seedAliases
  );
  const dossier = buildGlobalDossier(content, assistantSeed.facts, assistantSeed.timeline, projectBriefs);

  const assistantCorpus = {
    generatedAt: new Date().toISOString(),
    globalDossier: dossier.text,
    dossierSections: {
      identity: dossier.identity,
      background: dossier.background,
      roleFit: dossier.roleFit,
      answerStyle: dossier.answerStyle,
      projectBriefs
    },
    facts: assistantSeed.facts,
    timeline: assistantSeed.timeline,
    projectAliases: Object.fromEntries(
      projectBriefs.map((project) => [project.slug, project.aliases])
    ),
    evidenceChunks: [...profileEvidence, ...projectEvidence],
    rawFallbackExcerpts
  };

  const assistantEvalCases = buildAssistantEvalCases(content, assistantCorpus);

  return {
    assistantCorpus,
    assistantEvalCases
  };
}
