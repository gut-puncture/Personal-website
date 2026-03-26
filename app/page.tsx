import Link from "next/link";

import { AssistantOpenButton } from "@/components/assistant-open-button";
import { AssistantPanel } from "@/components/assistant-panel";
import { ContactSection } from "@/components/contact-section";
import { ProjectBrowser } from "@/components/project-browser";
import { SkillLedger } from "@/components/skill-ledger";
import { getPortfolioContent, getSkillsByType } from "@/lib/content";

export default async function Home() {
  const [content, skillGroups] = await Promise.all([getPortfolioContent(), getSkillsByType()]);
  const heroImageUrl = "/hero-machine-final.png";
  const heroImageAlt = "A lone figure facing a machine city beneath a red moon.";
  const orderedProjects = [...content.projects].sort((a, b) => a.priority - b.priority);
  const selectedWorkSlugs = [
    "research-paper-semantic-gravity",
    "q-commerce-demo-list-to-cart",
    "how-a-7-billion-parameter-ai-cannot-add"
  ];
  const selectedProjects = selectedWorkSlugs
    .map((slug) => orderedProjects.find((project) => project.slug === slug))
    .filter((project): project is (typeof orderedProjects)[number] => Boolean(project));
  const archiveProjects = orderedProjects.filter((project) => !selectedWorkSlugs.includes(project.slug));
  const [featuredProject, ...supportingProjects] = selectedProjects;

  const supportItems = [
    {
      label: "Current role",
      value: "Product Manager / Member of Technical Staff at",
      href: content.home.contactLinks.company,
      linkLabel: "Data Sutram"
    },
    {
      label: "Focus",
      value: "AI product strategy, interface direction, testing, and shipping with small high-output teams."
    },
    {
      label: "Research",
      value: "Agents, mechanistic interpretability, and continual learning."
    }
  ];

  return (
    <main className="relative overflow-x-clip bg-obsidian pb-24 md:pb-32">
      <section className="relative min-h-[100svh] overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt={heroImageAlt}
            className="h-full w-full object-cover object-[72%_center] md:object-[75%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,1,2,0.98)_0%,rgba(8,2,3,0.84)_28%,rgba(10,3,4,0.58)_48%,rgba(7,2,3,0.74)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,1,2,0.55)_0%,rgba(7,2,3,0.14)_28%,rgba(7,2,3,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_26%,rgba(255,67,35,0.16),transparent_28%)]" />
          <div className="absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgba(6,1,2,0.68),rgba(6,1,2,0.38)_54%,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(7,2,3,0.96))]" />
        </div>

        <div className="relative flex min-h-[100svh] flex-col">
          <header className="absolute inset-x-0 top-0 z-20">
            <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between px-6 py-6 md:px-10 xl:px-14">
              <p className="font-structure text-[11px] uppercase tracking-[0.42em] text-smoke-gray">
                Shailesh Rana
              </p>
              <nav className="font-structure flex items-center gap-5 text-[11px] uppercase tracking-[0.26em] text-smoke-gray">
                <a href="#selected-work" className="transition-colors hover:text-bone-white">
                  Work
                </a>
                <a href="#contact" className="transition-colors hover:text-bone-white">
                  Contact
                </a>
              </nav>
            </div>
          </header>

          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[96rem] items-end px-6 pb-12 pt-28 md:px-10 md:pb-16 md:pt-36 xl:px-14">
            <div className="max-w-[48rem] space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <p className="hero-kicker">Product management / AI systems</p>
                <div className="space-y-1 md:space-y-2">
                  <p className="hero-outline font-structure text-[clamp(2.8rem,9vw,6.8rem)] leading-[0.84] tracking-[-0.05em]">
                    ME AGAINST
                  </p>
                  <h1 className="font-structure text-[clamp(3.1rem,10vw,7.9rem)] font-semibold uppercase leading-[0.82] tracking-[-0.06em] text-bone-white">
                    THE MACHINE
                  </h1>
                </div>
              </div>

              <div className="max-w-[29rem] space-y-4 md:space-y-5">
                <p className="font-display text-[2.3rem] leading-[0.92] tracking-[-0.04em] text-bone-white sm:text-[2.8rem] md:text-[3.6rem]">
                  Shailesh Rana
                </p>
                <p className="max-w-[30rem] text-base leading-7 text-bone-white/84 md:text-[1.06rem] md:leading-8">
                  Learning in real time as the machine gets stronger, still betting on human
                  taste, judgment, and nerve.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 md:gap-4">
                <a
                  href="#selected-work"
                  className="font-structure inline-flex items-center gap-2 border border-ember-amber bg-ember-amber px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-bone-white transition-colors hover:bg-ember-amber-bright"
                >
                  View work
                  <span aria-hidden="true">/</span>
                </a>
                <a
                  href={content.home.contactLinks.cv}
                  target="_blank"
                  rel="noreferrer"
                  className="font-structure inline-flex items-center gap-2 border border-line-strong bg-black/18 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-bone-white transition-colors hover:border-ember-amber/55 hover:text-ember-amber"
                >
                  Open CV
                  <span aria-hidden="true">/</span>
                </a>
                <AssistantOpenButton
                  source="hero"
                  className="font-structure inline-flex items-center gap-2 border border-line bg-black/12 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-smoke-gray transition-colors hover:border-line-strong hover:text-bone-white"
                >
                  Ask the voice agent
                  <span aria-hidden="true">/</span>
                </AssistantOpenButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line/70 bg-[linear-gradient(180deg,rgba(255,67,35,0.05),transparent)]">
        <div className="mx-auto max-w-[96rem] px-6 py-8 md:px-10 md:py-10 xl:px-14">
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {supportItems.map((item) => (
              <div key={item.label} className="border-t border-line pt-4">
                <p className="font-structure text-[10px] uppercase tracking-[0.32em] text-smoke-gray">
                  {item.label}
                </p>
                <p className="mt-3 max-w-sm text-[0.98rem] leading-7 text-bone-white/88">
                  {item.value}{" "}
                  {item.href && item.linkLabel ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-bone-white underline decoration-white/35 underline-offset-4 transition-colors hover:text-ember-amber"
                    >
                      {item.linkLabel}
                    </a>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[96rem] space-y-24 px-6 py-14 md:px-10 md:py-20 xl:px-14">
        <section id="selected-work" className="space-y-8">
          <div className="border-b border-line pb-4">
            <div className="space-y-2">
              <p className="section-kicker">Selected work</p>
              <p className="max-w-2xl text-base leading-7 text-smoke-gray md:text-[1.02rem]">
                A few projects that best show product judgment, AI systems thinking, and applied
                execution.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)]">
            {featuredProject ? (
              <Link
                href={`/projects/${featuredProject.slug}`}
                className="group relative overflow-hidden border border-line bg-[linear-gradient(180deg,rgba(255,67,35,0.08),rgba(10,4,5,0.96)_24%,rgba(7,2,3,0.98)_100%)] px-6 py-7 transition-colors hover:border-line-strong md:px-8 md:py-8"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-structure text-[10px] uppercase tracking-[0.32em] text-smoke-gray">
                      {featuredProject.group}
                    </p>
                    <p className="font-structure text-xs uppercase tracking-[0.28em] text-smoke-gray">
                      {String(featuredProject.priority).padStart(2, "0")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="font-display max-w-[12ch] text-[2.75rem] leading-[0.9] tracking-[-0.04em] text-bone-white transition-colors group-hover:text-ember-amber md:text-[4.2rem]">
                      {featuredProject.title}
                    </p>
                    <p className="max-w-2xl text-lg leading-8 text-bone-white/88">
                      {featuredProject.summary}
                    </p>
                  </div>

                  <p className="max-w-2xl border-l border-ember-amber/35 pl-4 text-sm leading-7 text-smoke-gray md:text-[0.96rem]">
                    {featuredProject.previewExcerpt}
                  </p>
                </div>
              </Link>
            ) : null}

            <div className="grid gap-6">
              {supportingProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group border border-line bg-[linear-gradient(180deg,rgba(15,6,8,0.92),rgba(7,2,3,0.98))] px-5 py-6 transition-colors hover:border-line-strong md:px-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-structure text-[10px] uppercase tracking-[0.32em] text-smoke-gray">
                        {project.group}
                      </p>
                      <p className="font-structure text-xs uppercase tracking-[0.28em] text-smoke-gray">
                        {String(project.priority).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="font-display text-[2.15rem] leading-[0.92] tracking-[-0.04em] text-bone-white transition-colors group-hover:text-ember-amber">
                        {project.title}
                      </p>
                      <p className="text-sm leading-7 text-bone-white/86 md:text-[0.96rem]">
                        {project.summary}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="space-y-8">
          <div className="border-b border-line pb-4">
            <p className="section-kicker">Archive</p>
          </div>

          <ProjectBrowser projects={archiveProjects} />
        </section>

        <section className="border-y border-line py-8 md:py-10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-2">
              <p className="section-kicker">Voice agent</p>
              <p className="max-w-2xl text-base leading-7 text-smoke-gray md:text-[1.02rem]">
                Need the fast version? Ask for project context, background, or role fit without
                leaving the page.
              </p>
            </div>

            <AssistantOpenButton
              source="external"
              className="font-structure inline-flex items-center gap-2 border border-line bg-black/10 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-bone-white transition-colors hover:border-ember-amber/55 hover:text-ember-amber"
            >
              Open voice agent
              <span aria-hidden="true">/</span>
            </AssistantOpenButton>
          </div>
        </section>

        <section id="skills" className="space-y-8">
          <div className="border-b border-line pb-4">
            <p className="section-kicker">Skills</p>
          </div>

          <SkillLedger groups={skillGroups} />
        </section>

        <ContactSection home={content.home} />
      </div>

      <AssistantPanel variant="floating" showClosedTrigger={false} />
    </main>
  );
}
