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
          className="group relative block border-b border-line px-0 py-7 transition-colors hover:border-line-strong hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.05),rgba(255,67,35,0.02)_38%,transparent_70%)] focus:outline-none focus-visible:border-line-strong md:py-9"
        >
          <span className="absolute left-0 top-7 h-20 w-px bg-ember-amber/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:top-9" />
          <div className="grid gap-4 pl-5 md:grid-cols-[minmax(0,1fr)_3rem] md:pl-7">
            <div className="space-y-3">
              <p className="font-structure text-[10px] uppercase tracking-[0.34em] text-smoke-gray">
                {project.group}
              </p>

              <div className="space-y-2">
                <p className="font-display text-[2.1rem] leading-[0.94] tracking-[-0.03em] text-bone-white transition-[color,transform] group-hover:translate-x-1 group-hover:text-ember-amber group-focus-visible:translate-x-1 group-focus-visible:text-ember-amber md:text-[2.85rem]">
                  {project.title}
                </p>
                <p className="max-w-3xl text-base leading-8 text-bone-white/92 md:text-[1.05rem]">
                  {project.summary}
                </p>
              </div>

              <p className="max-w-3xl border-l border-white/8 pl-4 text-sm leading-7 text-smoke-gray transition-colors group-hover:border-ember-amber/40 group-focus-visible:border-ember-amber/40 md:text-[0.95rem]">
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
