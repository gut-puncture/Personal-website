import { InlineMarkdown } from "@/components/inline-markdown";
import type { Profile } from "@/lib/types";

export function ContactSection({ profile }: { profile: Profile }) {
  const links = [
    { label: "LinkedIn", href: profile.links.linkedin, primary: true },
    { label: "CV", href: profile.links.cv, primary: true },
    { label: "Email", href: `mailto:${profile.links.email}`, primary: false },
    { label: "GitHub", href: profile.links.github, primary: false },
    { label: "Medium", href: profile.links.medium, primary: false }
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
                  className={`flex items-center justify-between border-t border-line py-3.5 text-base transition-colors hover:border-ember-amber/50 hover:text-ember-amber-bright ${
                    link.primary ? "text-bone-white" : "text-smoke-gray"
                  }`}
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">{external ? "↗" : "→"}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
