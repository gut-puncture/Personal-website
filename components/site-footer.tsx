import { getPortfolioContent } from "@/lib/content";

export function SiteFooter() {
  const { profile } = getPortfolioContent();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-baseline justify-between gap-x-10 gap-y-2 px-6 py-8 md:px-10 xl:px-14">
        <p className="text-sm leading-6 text-smoke-gray">{profile.aiNote}</p>
        <p className="kicker">{profile.name}</p>
      </div>
    </footer>
  );
}
