import Link from "next/link";

import type { ProjectEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Charts from the papers have white backgrounds. This turns them dark so they sit in the page. */
const chartOnDark = "invert-[0.93] hue-rotate-180 saturate-[1.15] contrast-[0.95]";

/**
 * Research card. "wide" lays the picture beside the text; otherwise the picture sits on
 * top. A card with no picture shows its main number instead.
 */
export { chartOnDark };

export function ResearchCard({
  project,
  layout = "stacked",
  className
}: {
  project: ProjectEntry;
  layout?: "stacked" | "wide";
  className?: string;
}) {
  const keyStat = project.stats[0];

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group flex border border-line bg-[rgba(12,5,6,0.6)] transition-colors hover:border-line-strong",
        layout === "wide" ? "flex-col lg:flex-row" : "flex-col",
        className
      )}
    >
      {project.cover ? (
        <div
          className={cn(
            "flex items-center overflow-hidden border-line bg-[#121010]",
            layout === "wide"
              ? "border-b lg:w-[46%] lg:shrink-0 lg:border-b-0 lg:border-r"
              : "border-b"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.cover.src}
            alt={project.cover.alt}
            loading="lazy"
            className={cn(
              "w-full object-contain p-3 opacity-90 transition-opacity group-hover:opacity-100",
              layout === "wide" ? "h-64 lg:h-full lg:max-h-[21rem]" : "h-64 md:h-80",
              chartOnDark
            )}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 px-6 py-6 md:px-7 md:py-7">
        <p className="kicker">
          {project.kind} · {project.year}
        </p>
        <h3 className="font-display text-[1.85rem] leading-[1.02] tracking-[-0.03em] text-bone-white transition-colors group-hover:text-ember-amber-bright md:text-[2.25rem]">
          {project.title}
        </h3>
        <p className="max-w-[40rem] text-base leading-7 text-bone-white/85">{project.summary}</p>

        {!project.cover && keyStat ? (
          <div className="mt-2 border-t border-line pt-5">
            <p className="font-display text-[3rem] leading-none tracking-[-0.03em] text-ember-amber-bright">
              {keyStat.value}
            </p>
            <p className="mt-2 max-w-[26rem] text-sm leading-6 text-smoke-gray">{keyStat.label}</p>
          </div>
        ) : null}

        <p className="mt-auto pt-2 text-sm leading-6 text-smoke-gray">{project.status}</p>
      </div>
    </Link>
  );
}

/** Build card: three to a row. */
export function BuildCard({ project }: { project: ProjectEntry }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-3 border border-line px-6 py-6 transition-colors hover:border-line-strong hover:bg-[linear-gradient(180deg,rgba(255,67,35,0.06),transparent_60%)]"
    >
      <p className="kicker">
        {project.kind} · {project.year}
      </p>
      <h3 className="font-display text-[1.6rem] leading-[1.05] tracking-[-0.02em] text-bone-white transition-colors group-hover:text-ember-amber-bright">
        {project.title}
      </h3>
      <p className="text-[0.9375rem] leading-7 text-bone-white/80">{project.summary}</p>
      <p className="mt-auto border-t border-line pt-3 text-sm leading-6 text-smoke-gray">
        {project.status}
      </p>
    </Link>
  );
}

/** Side quest: one compact line with a short description. */
export function SideQuestRow({ project }: { project: ProjectEntry }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group grid gap-x-8 gap-y-1 border-b border-line py-5 transition-colors hover:border-line-strong md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_auto] md:items-baseline"
    >
      <h3 className="font-display text-[1.35rem] leading-[1.1] text-bone-white transition-colors group-hover:text-ember-amber-bright">
        {project.title}
      </h3>
      <p className="text-[0.9375rem] leading-7 text-bone-white/75">{project.summary}</p>
      <span
        aria-hidden="true"
        className="hidden text-smoke-gray transition-colors group-hover:text-ember-amber-bright md:block"
      >
        →
      </span>
    </Link>
  );
}
