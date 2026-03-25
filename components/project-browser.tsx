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
          className="group relative block border-b border-line px-0 py-6 transition-colors hover:border-line-strong hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.06),transparent_28%)] focus:outline-none focus-visible:border-line-strong"
        >
          <span className="absolute left-0 top-6 h-14 w-px bg-ember-amber/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-ember-amber/0 transition-colors group-hover:border-ember-amber/70 group-focus-visible:border-ember-amber/70" />
          <div className="grid gap-4 pl-5 md:grid-cols-[minmax(0,1fr)_3rem]">
            <div className="space-y-3">
              <p className="font-structure text-[10px] uppercase tracking-[0.34em] text-smoke-gray">
                {project.group}
              </p>

              <div className="space-y-2">
                <p className="font-structure text-[1.9rem] font-medium uppercase leading-[0.96] tracking-[0.02em] text-bone-white transition-[color,transform] group-hover:translate-x-1 group-hover:text-ember-amber group-focus-visible:translate-x-1 group-focus-visible:text-ember-amber md:text-[2.35rem]">
                  {project.title}
                </p>
                <p className="max-w-3xl text-base leading-8 text-bone-white/90">
                  {project.summary}
                </p>
              </div>

              <p className="max-w-3xl border-l border-white/8 pl-4 text-sm leading-7 text-smoke-gray transition-colors group-hover:border-ember-amber/40 group-focus-visible:border-ember-amber/40">
                {project.previewExcerpt}
              </p>
            </div>

            <div className="flex items-start justify-between md:justify-end">
              <span className="font-structure text-xs uppercase tracking-[0.28em] text-smoke-gray transition-colors group-hover:text-bone-white group-focus-visible:text-bone-white">
                {String(project.priority).padStart(2, "0")}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
