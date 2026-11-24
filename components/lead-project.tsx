import Link from "next/link";

import type { ProjectEntry } from "@/lib/types";

/** The project the site puts first: full width, with its headline numbers. */
export function LeadProject({ project }: { project: ProjectEntry }) {
  return (
    <article className="relative overflow-hidden border border-line-strong bg-[linear-gradient(180deg,rgba(255,67,35,0.1),rgba(10,4,5,0.96)_32%,rgba(7,2,3,0.98)_100%)]">
      <div className="grid gap-10 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
        <div className="space-y-6">
          <p className="kicker text-ember-amber-bright">
            Lead project · {project.kind} · {project.year}
          </p>
          <h3 className="font-display text-[2.5rem] leading-[0.95] tracking-[-0.04em] text-bone-white md:text-[3.75rem]">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-ember-amber-bright"
            >
              {project.title}
            </Link>
          </h3>
          <p className="max-w-[40rem] text-lg leading-8 text-bone-white/90">{project.summary}</p>
          <p className="max-w-[40rem] border-l border-ember-amber/50 pl-4 text-sm leading-6 text-smoke-gray">
            {project.status}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`/projects/${project.slug}`} className="btn btn-primary">
              Read the summary
              <span aria-hidden="true">/</span>
            </Link>
            {project.links.slice(0, 2).map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>

        {project.stats.length ? (
          <dl className="grid content-center gap-0 border-t border-line lg:border-l lg:border-t-0 lg:pl-12">
            {project.stats.map((stat) => (
              <div key={stat.label} className="border-b border-line py-5 last:border-b-0">
                <dt className="font-display text-[2.6rem] leading-none tracking-[-0.03em] text-bone-white md:text-[3.25rem]">
                  {stat.value}
                </dt>
                <dd className="mt-2 max-w-[26rem] text-sm leading-6 text-smoke-gray">{stat.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
