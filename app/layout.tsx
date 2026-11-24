import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans } from "next/font/google";

import "@/app/globals.css";

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
  "Shailesh Rana is an independent AI researcher. Papers on how language models reach an answer, how they lose one they know, and which abilities appear from prediction alone.";

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
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
