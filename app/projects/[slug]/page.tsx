import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantOpenButton } from "@/components/assistant-open-button";
import { AssistantPanel } from "@/components/assistant-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { SiteNav } from "@/components/site-nav";
import { getProjectBySlug, getProjects } from "@/lib/content";
import { slugifyHeading } from "@/lib/utils";

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, type: "article" }
  };
}

export default async function ProjectPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const projects = getProjects();
  const currentIndex = projects.findIndex((item) => item.slug === project.slug);
  const previous = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const next = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;
  const sections = project.headings.filter((heading) => heading.depth === 2);

  return (
    <>
      <SiteNav />

      <main className="mx-auto max-w-[96rem] px-6 pb-24 pt-10 md:px-10 md:pb-28 md:pt-14 xl:px-14">
        <header className="space-y-6 border-b border-line pb-10">
          <Link href={`/#${project.group}`} className="btn btn-quiet">
            <span aria-hidden="true">←</span>
            All {project.groupLabel.toLowerCase()}
          </Link>

          <p className="kicker pt-2">
            {project.groupLabel} · {project.kind} · {project.year}
          </p>

          <h1 className="max-w-[60rem] font-display text-[2.5rem] leading-[0.98] tracking-[-0.035em] text-bone-white md:text-[4rem]">
            {project.title}
          </h1>

          <p className="max-w-[46rem] text-lg leading-8 text-bone-white/90 md:text-xl md:leading-9">
            {project.summary}
          </p>

          <p className="max-w-[46rem] border-l border-ember-amber/50 pl-4 text-sm leading-6 text-smoke-gray">
            {project.status}
          </p>

          {project.links.length ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {project.links.map((link, index) => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={index === 0 ? "btn btn-primary" : "btn"}
                >
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : null}
        </header>

        {project.stats.length ? (
          <dl
            className={`grid border-b border-line ${
              project.stats.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {project.stats.map((stat) => (
              <div
                key={stat.label}
                className="border-b border-line py-7 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
              >
                <dt className="font-display text-[2.6rem] leading-none tracking-[-0.03em] text-bone-white md:text-[3.1rem]">
                  {stat.value}
                </dt>
                <dd className="mt-3 max-w-[26rem] text-sm leading-6 text-smoke-gray">{stat.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          <article className="min-w-0">
            <MarkdownRenderer markdown={project.markdown} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-8">
              {sections.length > 1 ? (
                <nav aria-label="On this page">
                  <p className="kicker">On this page</p>
                  <ul className="mt-4 space-y-3 border-l border-line pl-4">
                    {sections.map((heading) => (
                      <li key={heading.text}>
                        <a
                          href={`#${slugifyHeading(heading.text)}`}
                          className="block text-sm leading-6 text-bone-white/85 underline decoration-transparent underline-offset-4 transition-colors hover:text-ember-amber-bright hover:decoration-current"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}

              <div>
                <p className="kicker">Voice agent</p>
                <p className="mt-3 text-sm leading-6 text-smoke-gray">
                  Ask about the method, the limits, or how this compares with the other work.
                </p>
                <AssistantOpenButton
                  contextProjectSlug={project.slug}
                  source="project"
                  className="btn mt-4 w-full"
                >
                  Ask about this
                  <span aria-hidden="true">→</span>
                </AssistantOpenButton>
              </div>
            </div>
          </aside>
        </div>

        <nav aria-label="More projects" className="mt-20 grid gap-5 border-t border-line pt-8 md:grid-cols-2">
          {previous ? (
            <Link
              href={`/projects/${previous.slug}`}
              className="group border border-line px-6 py-5 transition-colors hover:border-line-strong"
            >
              <p className="kicker">← Previous</p>
              <p className="mt-3 font-display text-[1.5rem] leading-[1.1] text-bone-white transition-colors group-hover:text-ember-amber-bright">
                {previous.title}
              </p>
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="group border border-line px-6 py-5 text-right transition-colors hover:border-line-strong"
            >
              <p className="kicker">Next →</p>
              <p className="mt-3 font-display text-[1.5rem] leading-[1.1] text-bone-white transition-colors group-hover:text-ember-amber-bright">
                {next.title}
              </p>
            </Link>
          ) : null}
        </nav>
      </main>

      <AssistantPanel
        variant="floating"
        contextProjectSlug={project.slug}
        triggerClassName="lg:hidden"
      />
    </>
  );
}
