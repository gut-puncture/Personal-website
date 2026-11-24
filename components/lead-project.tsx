import Link from "next/link";

import { chartOnDark } from "@/components/project-cards";
import type { ProjectEntry } from "@/lib/types";

/** The project the site puts first: full width, text on one side and its figure on the other. */
export function LeadProject({ project }: { project: ProjectEntry }) {
  return (
    <article className="relative overflow-hidden border border-line-strong bg-[linear-gradient(180deg,rgba(255,67,35,0.1),rgba(10,4,5,0.96)_32%,rgba(7,2,3,0.98)_100%)]">
      <div className="grid items-center gap-10 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="space-y-6">
          <p className="kicker text-ember-amber-bright">
            Main project · {project.kind} · {project.year}
          </p>
          <h3 className="font-display text-[2.5rem] leading-[0.95] tracking-[-0.04em] text-bone-white md:text-[3.5rem]">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-ember-amber-bright"
            >
              {project.title}
            </Link>
          </h3>
          <p className="max-w-[36rem] text-lg leading-8 text-bone-white/90">{project.summary}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/projects/${project.slug}`} className="btn btn-primary">
              Read more
              <span aria-hidden="true">→</span>
            </Link>
            {project.links.slice(0, 2).map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="btn">
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>

        {project.cover ? (
          <Link href={`/projects/${project.slug}`} className="block" tabIndex={-1} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.cover.src}
              alt={project.cover.alt}
              className={`w-full border border-line ${chartOnDark}`}
            />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
