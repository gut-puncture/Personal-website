import type { SkillEntry } from "@/lib/types";

import { SkillGlyph } from "@/components/skill-icons";

const groupOrder: SkillEntry["type"][] = ["Expertise", "Software", "Language"];

export function SkillLedger({
  groups
}: {
  groups: Record<SkillEntry["type"], SkillEntry[]>;
}) {
  return (
    <div className="space-y-10">
      {groupOrder
        .map((group) => [group, groups[group] ?? []] as const)
        .filter(([, items]) => items.length > 0)
        .map(([group, items]) => (
          <section key={group} className="space-y-4">
            <div className="border-b border-line pb-3">
              <p className="font-structure text-[10px] uppercase tracking-[0.34em] text-smoke-gray">
                {group}
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((skill) => (
                <div
                  key={skill.name}
                  className="group flex items-center gap-4 border-b border-line/70 py-4"
                >
                  <SkillGlyph
                    id={skill.iconId}
                    className="h-5 w-5 shrink-0 text-bone-white transition-colors group-hover:text-ember-amber"
                  />
                  <p className="text-sm font-medium text-bone-white transition-transform group-hover:translate-x-1">
                    {skill.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
