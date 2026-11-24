import type { ProjectEvidence } from "@/lib/types";

/**
 * Results a newcomer can read: for each ability, what it means in plain words, how the
 * model did, and how a comparison did on the same test.
 */
export function EvidencePanel({ evidence }: { evidence: ProjectEvidence }) {
  return (
    <div>
      <h4 className="kicker text-bone-white">{evidence.title}</h4>
      <p className="mt-3 max-w-[34rem] text-sm leading-6 text-smoke-gray">{evidence.intro}</p>

      <ul className="mt-6 space-y-6">
        {evidence.rows.map((row) => (
          <li key={row.name}>
            <p className="text-base leading-6 text-bone-white">
              {row.meaning}
              <span className="text-smoke-gray"> ({row.name.toLowerCase()})</span>
            </p>

            <div className="mt-3 space-y-2">
              <Bar value={row.model} pct={row.modelPct} caption={row.modelCaption} tone="model" />
              <Bar
                value={row.baseline}
                pct={row.baselinePct}
                caption={row.baselineCaption}
                tone="baseline"
              />
            </div>
          </li>
        ))}
      </ul>

      {evidence.footnote ? (
        <p className="mt-6 max-w-[34rem] border-t border-line pt-4 text-sm leading-6 text-smoke-gray">
          {evidence.footnote}
        </p>
      ) : null}
    </div>
  );
}

function Bar({
  value,
  pct,
  caption,
  tone
}: {
  value: string;
  pct: number;
  caption: string;
  tone: "model" | "baseline";
}) {
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-x-3">
      <span
        className={`text-right text-base font-semibold tabular-nums leading-5 ${
          tone === "model" ? "text-bone-white" : "text-smoke-gray"
        }`}
      >
        {value}
      </span>
      <div>
        <div className="mt-1.5 h-2 w-full bg-white/[0.07]" aria-hidden="true">
          <div
            className={tone === "model" ? "h-full bg-ember-amber" : "h-full bg-smoke-gray-soft"}
            style={{ width: `${Math.max(pct, 1)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[0.8125rem] leading-5 text-smoke-gray">{caption}</p>
      </div>
    </div>
  );
}
