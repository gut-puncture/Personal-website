import { InlineMarkdown } from "@/components/inline-markdown";
import type { Profile } from "@/lib/types";

export function ContactSection({ profile }: { profile: Profile }) {
  const links = [
    { label: "LinkedIn", href: profile.links.linkedin },
    { label: "CV", href: profile.links.cv },
    { label: "Email", href: `mailto:${profile.links.email}` },
    { label: "GitHub", href: profile.links.github },
    { label: "Medium", href: profile.links.medium }
  ];

  return (
    <section id="contact" className="space-y-8">
      <div className="section-head">
        <h2 className="kicker">Contact</h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="max-w-[40rem] space-y-4 text-base leading-7 text-bone-white/88">
          {profile.contactParagraphs.map((paragraph) => (
            <InlineMarkdown key={paragraph} content={paragraph} />
          ))}
        </div>

        <ul>
          {links.map((link) => {
            const external = !link.href.startsWith("mailto:");
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="group flex items-center justify-between border-t border-line py-3.5 text-base text-bone-white transition-colors hover:border-ember-amber/50 hover:text-ember-amber-bright"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="text-smoke-gray transition-colors group-hover:text-ember-amber-bright">
                    ↗
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
