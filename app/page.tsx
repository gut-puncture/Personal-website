import { AssistantPanel } from "@/components/assistant-panel";
import { ContactSection } from "@/components/contact-section";
import { InlineMarkdown } from "@/components/inline-markdown";
import { ProjectBrowser } from "@/components/project-browser";
import { SkillLedger } from "@/components/skill-ledger";
import { getPortfolioContent, getSkillsByType } from "@/lib/content";

export default async function Home() {
  const [content, skillGroups] = await Promise.all([getPortfolioContent(), getSkillsByType()]);
  const heroImageUrl = "/hero-red.png";

  return (
    <main className="relative overflow-x-clip pb-32 md:pb-40">
      <section className="relative min-h-[100svh] border-b border-line before:pointer-events-none before:absolute before:inset-0 before:bg-[repeating-linear-gradient(115deg,transparent,transparent_0.9rem,rgba(255,67,35,0.05)_0.9rem,rgba(255,67,35,0.05)_0.96rem)] before:opacity-70">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt={content.home.heroImage.alt}
            className="h-full w-full object-cover object-center scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,2,3,0.97)_0%,rgba(7,2,3,0.85)_34%,rgba(7,2,3,0.54)_60%,rgba(7,2,3,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,2,3,0.28),rgba(7,2,3,0.66)_42%,rgba(7,2,3,0.96)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_28%,rgba(255,67,35,0.32),transparent_34%)]" />
          <div className="absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-white/12 to-transparent lg:block" />
          <div className="absolute inset-x-0 top-[8.5rem] h-px bg-white/12" />
          <div className="absolute left-[61%] top-0 hidden h-full w-px bg-white/10 xl:block" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-[90rem] flex-col px-6 pb-10 pt-6 md:px-10">
          <header className="flex items-center justify-between border-b border-white/10 py-5">
            <p className="font-structure text-[11px] uppercase tracking-[0.42em] text-smoke-gray">
              Shailesh Rana
            </p>
            <nav className="font-structure flex items-center gap-5 text-xs uppercase tracking-[0.24em] text-smoke-gray">
              <a href="#projects" className="transition-colors hover:text-bone-white">
                Projects
              </a>
              <a href="#contact" className="transition-colors hover:text-bone-white">
                Contact
              </a>
            </nav>
          </header>

          <div className="grid flex-1 gap-12 py-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,30rem)] lg:items-center xl:gap-16 xl:py-14">
            <div className="flex max-w-[44rem] flex-col justify-between gap-8 xl:pb-4 xl:pt-6">
              <div className="space-y-8">
              <div className="space-y-5">
                <p className="font-structure text-[11px] uppercase tracking-[0.38em] text-smoke-gray">
                  Product management / AI
                </p>
                <h1 className="font-display text-[4.3rem] leading-[0.92] tracking-tight text-bone-white drop-shadow-[0_0_32px_rgba(255,67,35,0.16)] sm:text-[5.2rem] md:text-[6.2rem] xl:text-[7.3rem]">
                    Shailesh
                    <span className="block">Rana</span>
                  </h1>
                  <p className="max-w-lg border-l border-ember-amber/40 pl-4 text-lg leading-8 text-bone-white/78">
                    {content.home.introHeading}
                  </p>
                </div>

                <div className="max-w-2xl space-y-4 text-base leading-8 text-bone-white/88 md:text-[1.05rem]">
                  {content.home.introParagraphs.slice(0, 3).map((paragraph) => (
                    <InlineMarkdown key={paragraph} content={paragraph} />
                  ))}
                </div>
              </div>

              <div className="space-y-5 border-t border-white/12 pt-5">
                <div className="font-structure flex flex-wrap gap-x-8 gap-y-3 text-sm uppercase tracking-[0.14em]">
                  <a
                    href={content.home.contactLinks.cv}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-bone-white transition-colors hover:text-ember-amber"
                  >
                    Open CV
                    <span aria-hidden="true">/</span>
                  </a>
                  <a
                    href={content.home.contactLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-bone-white transition-colors hover:text-ember-amber"
                  >
                    LinkedIn
                    <span aria-hidden="true">/</span>
                  </a>
                  <a
                    href="#projects"
                    className="inline-flex items-center gap-2 text-smoke-gray transition-colors hover:text-bone-white"
                  >
                    Browse projects
                    <span aria-hidden="true">/</span>
                  </a>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4">
                  {content.home.introParagraphs.slice(3).map((paragraph) => (
                    <div
                      key={paragraph}
                      className="max-w-2xl border-l-2 border-ember-amber/70 pl-4 text-[1.05rem] font-medium leading-8 text-bone-white md:text-[1.14rem]"
                    >
                      <InlineMarkdown content={paragraph} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:pb-4">
              <AssistantPanel variant="hero" />
            </div>
          </div>

          <div className="relative mt-auto border-t border-white/10 pt-5">
            <a
              href="#projects"
              className="font-structure inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-smoke-gray transition-colors hover:text-bone-white"
            >
              Enter the work
              <span aria-hidden="true">/</span>
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] space-y-24 px-6 py-16 md:px-10 md:py-24">
        <section id="projects" className="space-y-8">
          <div className="border-b border-line pb-4">
            <p className="font-structure text-[11px] uppercase tracking-[0.32em] text-smoke-gray">
              Projects
            </p>
          </div>

          <ProjectBrowser projects={content.projects} />
        </section>

        <section id="skills">
          <SkillLedger groups={skillGroups} />
        </section>

        <ContactSection home={content.home} />
      </div>
    </main>
  );
}
