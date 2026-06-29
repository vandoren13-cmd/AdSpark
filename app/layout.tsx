import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://adspark.ai";
const TITLE = "AdSpark AI - AI ad creative in seconds";
const DESC = "Generate platform-native ad copy, captions, hashtags, CTAs and AI images for every campaign - or let us run your ads end-to-end. Flat price, no spend fees.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · AdSpark AI" },
  description: DESC,
  applicationName: "AdSpark AI",
  keywords: ["AI ads", "ad creative", "ad copy generator", "AI ad images", "Meta ads", "TikTok ads", "done-for-you ads", "ad management"],
  authors: [{ name: "AdSpark AI" }],
  openGraph: { type: "website", url: SITE, title: TITLE, description: DESC, siteName: "AdSpark AI" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07080f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
