import Link from "next/link";

const links = [
  { label: "Research", href: "/#research" },
  { label: "Builds", href: "/#builds" },
  { label: "Contact", href: "/#contact" }
];

/** The one navigation bar. "overlay" sits on top of the hero image; "bar" is a normal page header. */
export function SiteNav({ variant = "bar" }: { variant?: "overlay" | "bar" }) {
  return (
    <header
      className={
        variant === "overlay"
          ? "absolute inset-x-0 top-0 z-20"
          : "border-b border-line bg-obsidian/80 backdrop-blur"
      }
    >
      <div className="mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5 md:px-10 xl:px-14">
        <Link href="/" className="kicker tracking-[0.38em] transition-colors hover:text-bone-white">
          Shailesh Rana
        </Link>
        <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="kicker py-1 transition-colors hover:text-bone-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
