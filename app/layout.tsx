import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans } from "next/font/google";

import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

const description =
  "Shailesh Rana is an AI researcher. This site has his papers on what happens inside AI language models, and the things he built before as a product manager.";

export const metadata: Metadata = {
  metadataBase: new URL("https://shaileshrana.vercel.app"),
  title: {
    default: "Shailesh Rana, AI researcher",
    template: "%s | Shailesh Rana"
  },
  description,
  openGraph: {
    title: "Shailesh Rana, AI researcher",
    description,
    type: "website",
    images: ["/hero-machine-final.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable}`}>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
