import Image from "next/image";

import { AboutSection } from "@/components/about-section";
import { AssistantOpenButton } from "@/components/assistant-open-button";
import { AssistantPanel } from "@/components/assistant-panel";
import { ContactSection } from "@/components/contact-section";
import { LeadProject } from "@/components/lead-project";
import { ProjectRow, ProjectTile } from "@/components/project-row";
import { SiteNav } from "@/components/site-nav";
import { getPortfolioContent, getProjectsByGroup } from "@/lib/content";

export default function Home() {
  const { profile } = getPortfolioContent();
  const [leadProject, ...research] = getProjectsByGroup("research");
  const builds = getProjectsByGroup("builds");
  const sideQuests = getProjectsByGroup("side-quests");

  return (
    <main className="relative overflow-x-clip pb-24 md:pb-32">
      <section className="relative min-h-[100svh] overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          <Image
            src="/hero-machine-final.png"
            alt="A lone figure facing a machine city beneath a red moon."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[72%_center] brightness-[1.16] contrast-[1.03] saturate-[1.05] md:object-[75%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,1,2,0.98)_0%,rgba(8,2,3,0.84)_28%,rgba(10,3,4,0.58)_48%,rgba(7,2,3,0.74)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,1,2,0.55)_0%,rgba(7,2,3,0.14)_28%,rgba(7,2,3,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_26%,rgba(255,67,35,0.16),transparent_28%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(7,2,3,0.96))]" />
        </div>

        <SiteNav variant="overlay" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[96rem] items-end px-6 pb-12 pt-32 md:px-10 md:pb-16 md:pt-36 xl:px-14">
          <div className="max-w-[48rem] space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <p className="kicker tracking-[0.34em]">{profile.role}</p>
              <div className="space-y-1 md:space-y-2" aria-hidden="true">
                <p className="hero-outline text-[clamp(2.8rem,9vw,6.8rem)] leading-[0.84] tracking-[-0.05em]">
                  ME AGAINST
                </p>
                <p className="text-[clamp(3.1rem,10vw,7.9rem)] font-semibold uppercase leading-[0.82] tracking-[-0.06em] text-bone-white">
                  THE MACHINE
                </p>
              </div>
            </div>

            <div className="max-w-[30rem] space-y-4 md:space-y-5">
              <h1 className="font-display text-[2.3rem] leading-[0.92] tracking-[-0.04em] text-bone-white sm:text-[2.8rem] md:text-[3.6rem]">
                {profile.name}
              </h1>
              <p className="text-base leading-7 text-bone-white/85 md:text-[1.0625rem] md:leading-8">
                {profile.tagline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#research" className="btn btn-primary">
                See the research
                <span aria-hidden="true">/</span>
              </a>
              <a href={profile.links.cv} target="_blank" rel="noreferrer" className="btn">
                Open CV
                <span aria-hidden="true">↗</span>
              </a>
              <AssistantOpenButton source="hero" className="btn">
                Ask the voice agent
                <span aria-hidden="true">/</span>
              </AssistantOpenButton>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="At a glance"
        className="border-b border-line bg-[linear-gradient(180deg,rgba(255,67,35,0.05),transparent)]"
      >
        <dl className="mx-auto grid max-w-[96rem] gap-6 px-6 py-8 md:grid-cols-3 md:gap-10 md:px-10 md:py-10 xl:px-14">
          {profile.strip.map((item) => (
            <div key={item.label} className="border-t border-line pt-4">
              <dt className="kicker">{item.label}</dt>
              <dd className="mt-3 max-w-sm text-base leading-7 text-bone-white/88">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto max-w-[96rem] space-y-24 px-6 py-16 md:space-y-28 md:px-10 md:py-20 xl:px-14">
        <section id="research" className="space-y-8">
          <div className="section-head">
            <h2 className="kicker">Research</h2>
            <p className="kicker normal-case tracking-[0.04em]">
              {research.length + 1} papers and studies
            </p>
          </div>

          {leadProject ? <LeadProject project={leadProject} /> : null}

          <div>
            {research.map((project) => (
              <ProjectRow key={project.slug} project={project} size="large" />
            ))}
          </div>
        </section>

        <section id="builds" className="space-y-8">
          <div className="section-head">
            <h2 className="kicker">Builds</h2>
            <p className="kicker normal-case tracking-[0.04em]">
              Demos and prototypes from my product years
            </p>
          </div>

          <div>
            {builds.map((project) => (
              <ProjectRow key={project.slug} project={project} size="medium" />
            ))}
          </div>
        </section>

        <section id="side-quests" className="space-y-8">
          <div className="section-head">
            <h2 className="kicker">Side quests</h2>
            <p className="kicker normal-case tracking-[0.04em]">Small things built for fun</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {sideQuests.map((project) => (
              <ProjectTile key={project.slug} project={project} />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="voice-agent-heading"
          className="grid gap-6 border-y border-line py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
        >
          <div className="space-y-3">
            <h2 id="voice-agent-heading" className="kicker">
              Voice agent
            </h2>
            <p className="max-w-[40rem] font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-bone-white md:text-[2.1rem]">
              Ask it anything about the work, aloud or in text.
            </p>
            <p className="max-w-[40rem] text-base leading-7 text-smoke-gray">
              It has read every project on this site and answers with the actual results, their
              limits, and how they compare.
            </p>
          </div>

          <AssistantOpenButton source="external" className="btn">
            Open the voice agent
            <span aria-hidden="true">/</span>
          </AssistantOpenButton>
        </section>

        <AboutSection profile={profile} />

        <ContactSection profile={profile} />
      </div>

      <AssistantPanel variant="floating" showClosedTrigger={false} />
    </main>
  );
}
