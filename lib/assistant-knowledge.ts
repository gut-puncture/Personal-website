export const assistantProfile = {
  name: "Shailesh Rana",
  guideName: "Quick answers",
  currentRole:
    "Shailesh is currently a Product Manager / Member of Technical Staff at Data Sutram, working on the company's only B2B SaaS application.",
  currentRoleHighlights: [
    "He manages UX and design, product management, development, and testing steps of the product lifecycle for Data Sutram's only B2B SaaS app.",
    "He built v2.0 for the B2B SaaS application from scratch as a proof of concept using Codex App.",
    "He developed an AI-based income estimation model that became the fastest-growing single product in the company.",
    "He led the demo presented during Global Fintech Festival 2025, which doubled year-over-year leads compared with 2024."
  ],
  priorExperience: [
    "At CaaStle Technologies from October 2022 to April 2025, he led the creation of an AI data platform, built AI assistants, shipped natural-language data querying with Gemini and Slack, and won a company hackathon with a GPT-4 customer-service chatbot.",
    "At Bajaj Finserv Health from May 2022 to September 2022, he worked on organic growth and built systems that linked healthcare entities for diagnosis, test recommendations, and doctor discovery."
  ],
  education: [
    "He completed an MBA in Finance from University Business School, Panjab University, from 2020 to 2022.",
    "He completed a B.E. in Metallurgical Engineering from PEC University of Technology, Chandigarh, from 2013 to 2017."
  ],
  location: "He is based in Bengaluru.",
  roleTargets:
    "The portfolio explicitly says recruiters should reach out if they think he is a fit for a Product role or an AI Researcher role.",
  interests:
    "Outside shipping products, he works on AI research focused on agents, mechanistic interpretability, and continual learning.",
  contactCta:
    "If the fit looks strong, the cleanest next step is LinkedIn or the CV button on the site."
} as const;

export const flagshipProjectKnowledge = [
  {
    slug: "research-paper-semantic-gravity",
    title: "Research Paper : Semantic Gravity",
    aliases: [
      "semantic gravity",
      "semantic gravity wells",
      "research paper",
      "paper",
      "negative constraints",
      "semantic pressure"
    ],
    recruiterSummary:
      "Semantic Gravity is Shailesh's strongest research signal: a mechanistic interpretability paper that explains why language models fail negative constraints, and introduces semantic pressure as a predictor of those failures.",
    whyItMatters:
      "It shows original AI research, careful experimentation, and the ability to turn a model-behavior problem into a publishable explanatory framework.",
    pmAiAngle:
      "It matters for both AI research and product judgment because it connects model behavior to practical failure modes that can affect user trust and system design."
  },
  {
    slug: "q-commerce-demo-list-to-cart",
    title: "Q-Commerce Demo: List to Cart",
    aliases: [
      "list to cart",
      "list-to-cart",
      "grocery cart",
      "q-commerce demo",
      "q commerce demo"
    ],
    recruiterSummary:
      "List to Cart is the clearest product-management proof point: a demo that generates a full grocery cart from a simple list of items.",
    whyItMatters:
      "It shows product thinking, UX judgment, and the ability to turn an AI capability into a concrete workflow people can understand quickly.",
    pmAiAngle:
      "It is especially useful for recruiters because it demonstrates user-facing AI product design rather than only research depth."
  },
  {
    slug: "how-a-7-billion-parameter-ai-cannot-add",
    title: "How a 7-Billion-Parameter AI Cannot Add",
    aliases: [
      "7 billion parameter ai cannot add",
      "cannot add",
      "7 billion model",
      "length bias",
      "addition paper"
    ],
    recruiterSummary:
      "How a 7-Billion-Parameter AI Cannot Add is an interpretability project that uncovered a systematic length bias in large-number addition.",
    whyItMatters:
      "It shows the ability to inspect model behavior closely, spot a non-obvious failure pattern, and explain why the model sometimes appears to do better on harder examples.",
    pmAiAngle:
      "Together with Semantic Gravity, it proves serious model-behavior analysis rather than surface-level AI experimentation."
  }
] as const;

export const projectAliasMap: Record<string, string[]> = {
  "research-paper-semantic-gravity": [
    "semantic gravity",
    "semantic gravity wells",
    "research paper",
    "negative constraints",
    "semantic pressure"
  ],
  "q-commerce-demo-list-to-cart": [
    "list to cart",
    "list-to-cart",
    "grocery cart",
    "grocery items",
    "q commerce demo",
    "q-commerce demo"
  ],
  "how-a-7-billion-parameter-ai-cannot-add": [
    "7 billion",
    "cannot add",
    "length bias",
    "addition"
  ],
  "continuous-learning-llm": [
    "continuous learning",
    "continual learning",
    "continuous learning llm"
  ],
  "ai-agent-communication-protocol": [
    "communication protocol",
    "agent communication protocol",
    "data analyst agent"
  ],
  "smart-medical-search": ["smart medical search", "medical search"],
  "q-commerce-demo-grocery-crate-analysis-wrt-customer-profile": [
    "grocery crate",
    "crate analysis",
    "customer profile"
  ],
  "ai-shoe-design": ["shoe design", "ai shoe"],
  "the-medium-ai-articles": ["medium articles", "medium ai articles", "articles"],
  "garden-watering-system": ["garden watering", "watering system"],
  "claude-3-5-sonnet-twitter-account": ["claude twitter", "twitter account"],
  "parker-square-search": ["parker square", "square search"]
};

export const flagshipProjectOrder = flagshipProjectKnowledge.map((project) => project.slug);
