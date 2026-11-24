import Link from "next/link";

import { SiteNav } from "@/components/site-nav";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[96rem] px-6 py-24 md:px-10 xl:px-14">
        <p className="kicker">Page not found</p>
        <h1 className="mt-4 font-display text-[2.5rem] leading-none text-bone-white md:text-[4rem]">
          There is nothing at this address.
        </h1>
        <p className="mt-6 max-w-[36rem] text-base leading-7 text-smoke-gray">
          The page may have moved. Every project is listed on the home page.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          Go to the home page
          <span aria-hidden="true">→</span>
        </Link>
      </main>
    </>
  );
}
