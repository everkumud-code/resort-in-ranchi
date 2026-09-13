import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_POSITIONING, SITE_URL } from "@/lib/public/site";

// Body/UI/navigation — highly readable humanist sans, stays legible at small
// sizes on mobile.
const bodySans = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

// Editorial display face for major headings only — a warm, soft-curved
// serif that pairs with the logo's nature-inspired mark without competing
// with it. Deliberately just these two families (see brand guidelines).
const displaySerif = Fraunces({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_POSITIONING}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodySans.variable} ${displaySerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
