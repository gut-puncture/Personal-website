import Link from "next/link";

import type { ProjectEntry } from "@/lib/types";

export function ProjectBrowser({ projects }: { projects: ProjectEntry[] }) {
  const orderedProjects = [...projects].sort((a, b) => a.priority - b.priority);

  return (
    <div className="border-t border-line">
      {orderedProjects.map((project) => (
        <Link
          key={project.slug}
          href={`/projects/${project.slug}`}
          className="group relative block border-b border-line px-0 py-6 transition-colors hover:border-line-strong focus:outline-none focus-visible:border-line-strong"
        >
          <span className="absolute left-0 top-6 h-14 w-px bg-ember-amber/85 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          <div className="grid gap-4 pl-5 md:grid-cols-[minmax(0,1fr)_3rem]">
            <div className="space-y-3">
              <p className="font-structure text-[10px] uppercase tracking-[0.34em] text-smoke-gray">
                {project.group}
              </p>

              <div className="space-y-2">
                <p className="font-structure text-[1.9rem] font-medium uppercase leading-[0.96] tracking-[0.03em] text-bone-white transition-colors group-hover:text-ember-amber group-focus-visible:text-ember-amber md:text-[2.35rem]">
                  {project.title}
                </p>
                <p className="max-w-3xl text-base leading-8 text-bone-white/90">
                  {project.summary}
                </p>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-smoke-gray">
                {project.previewExcerpt}
              </p>
            </div>

            <div className="flex items-start justify-between md:justify-end">
              <span className="font-structure text-xs uppercase tracking-[0.28em] text-smoke-gray">
                {String(project.priority).padStart(2, "0")}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
