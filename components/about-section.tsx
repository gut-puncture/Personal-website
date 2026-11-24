import { SkillGlyph } from "@/components/skill-icons";
import type { Profile } from "@/lib/types";

export function AboutSection({ profile }: { profile: Profile }) {
  return (
    <section id="about" className="space-y-8">
      <div className="section-head">
        <h2 className="kicker">About</h2>
        <p className="kicker normal-case tracking-[0.04em]">{profile.location}</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-8">
          <div className="max-w-[40rem] space-y-4 text-base leading-7 text-bone-white/88">
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div>
            <h3 className="kicker">Works with</h3>
            <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill.name}
                  className="flex items-center gap-3 border-t border-line py-3 text-sm text-bone-white"
                >
                  <SkillGlyph id={skill.iconId} className="h-[1.1rem] w-[1.1rem] shrink-0 text-ember-amber" />
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="kicker">Experience</h3>
            <ol className="mt-4">
              {profile.experience.map((role) => (
                <li key={role.id} className="border-t border-line py-4">
                  <p className="text-base font-medium text-bone-white">{role.title}</p>
                  <p className="mt-1 text-sm text-smoke-gray">
                    {role.company} · {role.start} to {role.end}
                  </p>
                  <p className="mt-2 max-w-[38rem] text-sm leading-6 text-bone-white/80">{role.summary}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="kicker">Education</h3>
            <ol className="mt-4">
              {profile.education.map((item) => (
                <li key={item.id} className="border-t border-line py-4">
                  <p className="text-base font-medium text-bone-white">{item.degree}</p>
                  <p className="mt-1 text-sm text-smoke-gray">
                    {item.school} · {item.years}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
