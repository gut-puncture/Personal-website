import Link from "next/link";

import type { ProjectEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One project in a list. The same row is used for every group; "size" sets how much
 * room a group gets, so research reads as more prominent than side quests.
 */
export function ProjectRow({
  project,
  size = "large"
}: {
  project: ProjectEntry;
  size?: "large" | "medium";
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group relative block border-b border-line first:-mt-8 transition-colors hover:border-line-strong hover:bg-[linear-gradient(90deg,rgba(255,67,35,0.06),rgba(255,67,35,0.02)_38%,transparent_70%)]",
        size === "large" ? "py-8 md:py-9" : "py-6 md:py-7"
      )}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-px bg-ember-amber opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <div className="grid gap-x-10 gap-y-3 pl-5 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:pl-7">
        <div className="space-y-3">
          <p className="kicker">
            {project.kind} · {project.year}
          </p>
          <h3
            className={cn(
              "font-display leading-[1] tracking-[-0.03em] text-bone-white transition-colors group-hover:text-ember-amber-bright",
              size === "large" ? "text-[2rem] md:text-[2.6rem]" : "text-[1.65rem] md:text-[2rem]"
            )}
          >
            {project.title}
          </h3>
          <p className="max-w-[44rem] text-base leading-7 text-bone-white/85">{project.summary}</p>
        </div>
        <p className="border-l border-line pl-4 text-sm leading-6 text-smoke-gray md:self-end">
          {project.status}
        </p>
      </div>
    </Link>
  );
}

/** Compact entry for the smallest projects, shown two to a row. */
export function ProjectTile({ project }: { project: ProjectEntry }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block border border-line px-5 py-5 transition-colors hover:border-line-strong md:px-6 md:py-6"
    >
      <p className="kicker">
        {project.kind} · {project.year}
      </p>
      <h3 className="mt-3 font-display text-[1.5rem] leading-[1.05] tracking-[-0.02em] text-bone-white transition-colors group-hover:text-ember-amber-bright">
        {project.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-bone-white/80">{project.summary}</p>
    </Link>
  );
}
