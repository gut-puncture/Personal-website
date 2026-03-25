import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans, Roboto_Condensed } from "next/font/google";

import "@/app/globals.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"]
});

const structure = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-structure",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "Shailesh Rana",
  description: "Portfolio of Shailesh Rana"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} ${structure.variable}`}>
        {children}
      </body>
    </html>
  );
}
