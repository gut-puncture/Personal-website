import type { PortfolioContent } from "@/lib/types";
import { InlineMarkdown } from "@/components/inline-markdown";

export function ContactSection({
  home
}: {
  home: PortfolioContent["home"];
}) {
  const primaryLinks = [
    { label: "LinkedIn", href: home.contactLinks.linkedin },
    { label: "CV", href: home.contactLinks.cv }
  ];

  const secondaryLinks = [
    { label: "Email", href: `mailto:${home.contactLinks.email}` },
    { label: "GitHub", href: home.contactLinks.github },
    { label: "Medium", href: home.contactLinks.medium }
  ];

  return (
    <section
      id="contact"
      className="rounded-[1.5rem] border border-line bg-charcoal-steel/80 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-smoke-gray">
            Contact
          </p>
          <div className="max-w-3xl space-y-4 text-base leading-8 text-smoke-gray">
            {home.contactParagraphs.map((paragraph) => (
              <InlineMarkdown key={paragraph} content={paragraph} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-smoke-gray">
              Primary
            </p>
            <div className="space-y-2">
              {primaryLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between border-b border-line py-3 text-sm text-bone-white transition-colors hover:text-ember-amber"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">/</span>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-smoke-gray">
              Secondary
            </p>
            <div className="space-y-2">
              {secondaryLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                  className="flex items-center justify-between border-b border-line py-3 text-sm text-smoke-gray transition-colors hover:text-bone-white"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">/</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
