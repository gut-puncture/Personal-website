import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantOpenButton } from "@/components/assistant-open-button";
import { AssistantPanel } from "@/components/assistant-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { getProjectBySlug, getProjects } from "@/lib/content";
import { slugifyHeading } from "@/lib/utils";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: `${project.title} | Shailesh Rana`,
    description: project.summary
  };
}

export default async function ProjectPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([getProjectBySlug(slug), getProjects()]);

  if (!project) notFound();

  const currentIndex = projects.findIndex((item) => item.slug === project.slug);
  const previous = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const next = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;
  const backHref = "/#projects";

  return (
    <main className="mx-auto max-w-[88rem] px-6 py-8 pb-32 md:px-10 md:py-10 md:pb-40">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-8">
          <div className="min-w-0 space-y-8 overflow-hidden rounded-[1.5rem] border border-line bg-charcoal-steel/70 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
              <Link
                href={backHref}
                className="text-xs uppercase tracking-[0.28em] text-smoke-gray transition-colors hover:text-bone-white"
              >
                Back to projects
              </Link>
              <div className="text-xs uppercase tracking-[0.24em] text-smoke-gray">
                {project.group}
              </div>
            </div>

            {project.actions.length ? (
              <div className="flex flex-wrap gap-3 border-b border-line pb-6">
                {project.actions.map((action) => (
                  <a
                    key={`${action.label}-${action.href}`}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-structure inline-flex items-center gap-2 border border-line px-4 py-3 text-sm uppercase tracking-[0.1em] text-bone-white transition-colors hover:border-line-strong hover:text-ember-amber"
                  >
                    {action.label}
                    <span aria-hidden="true">/</span>
                  </a>
                ))}
              </div>
            ) : null}

            <article className="min-w-0 space-y-8">
              <MarkdownRenderer markdown={project.markdown} />
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {previous ? (
              <Link
                href={`/projects/${previous.slug}`}
                className="rounded-[1.25rem] border border-line bg-charcoal-steel/70 p-6 transition-colors hover:border-line-strong"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-smoke-gray">
                  Previous
                </p>
                <p className="mt-3 text-xl text-bone-white">{previous.title}</p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/projects/${next.slug}`}
                className="rounded-[1.25rem] border border-line bg-charcoal-steel/70 p-6 text-right transition-colors hover:border-line-strong"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-smoke-gray">
                  Next
                </p>
                <p className="mt-3 text-xl text-bone-white">{next.title}</p>
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-8 lg:self-start">
          {project.headings.some((heading) => heading.depth >= 2) ? (
            <section className="rounded-[1.25rem] border border-line bg-charcoal-steel/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-smoke-gray">
                Jump points
              </p>
              <div className="mt-4 space-y-3">
                {project.headings
                  .filter((heading) => heading.depth >= 2)
                  .map((heading) => (
                    <a
                      key={`${heading.depth}-${heading.text}`}
                      href={`#${slugifyHeading(heading.text)}`}
                      className="block text-sm leading-6 text-smoke-gray transition-colors hover:text-bone-white"
                    >
                      {heading.text}
                    </a>
                  ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.25rem] border border-line bg-charcoal-steel/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-smoke-gray">
              Voice agent
            </p>
            <p className="mt-3 text-sm leading-7 text-smoke-gray">
              Get the fast version, role relevance, or the context behind the write-up.
            </p>
            <AssistantOpenButton
              prompt={`Tell me about the ${project.title} project and why it matters.`}
              contextProjectSlug={project.slug}
              source="project"
              className="font-structure mt-4 inline-flex items-center gap-2 border border-line px-4 py-3 text-sm uppercase tracking-[0.1em] text-bone-white transition-colors hover:border-line-strong hover:text-ember-amber"
            >
              Talk about this project
              <span aria-hidden="true">/</span>
            </AssistantOpenButton>
          </section>
        </aside>
      </div>

      <AssistantPanel variant="floating" contextProjectSlug={project.slug} />
    </main>
  );
}
