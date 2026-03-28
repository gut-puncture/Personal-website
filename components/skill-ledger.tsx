import type { SkillEntry } from "@/lib/types";

import { SkillGlyph } from "@/components/skill-icons";

export function SkillLedger({
  items
}: {
  items: SkillEntry[];
}) {
  return (
    <section className="space-y-5">
      <div className="border-b border-line pb-4">
        <p className="section-kicker">Skills</p>
      </div>

      <div className="grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((skill) => (
          <div
            key={skill.name}
            className="group flex items-center gap-4 border-t border-white/7 pt-4"
          >
            <SkillGlyph
              id={skill.iconId}
              className="h-[1.15rem] w-[1.15rem] shrink-0 text-bone-white transition-colors group-hover:text-ember-amber"
            />
            <p className="text-sm font-medium text-bone-white transition-transform group-hover:translate-x-1">
              {skill.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
