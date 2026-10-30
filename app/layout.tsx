import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Hanken_Grotesk, Montserrat, Mulish } from "next/font/google";
import PullToRefresh from "@/components/PullToRefresh";
import PageTransition from "@/components/PageTransition";
import PostHogAnalytics from "@/components/PostHogAnalytics";
import HashAnchorScroll from "@/components/HashAnchorScroll";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alinkinscodex.vercel.app";

export const metadata: Metadata = {
  title: "by.alinkins | Workout programs",
  description: "Build your dream body with focused training programs.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "by.alinkins",
    title: "by.alinkins | Workout programs",
    description: "Build your dream body with focused training programs.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "by.alinkins workout programs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "by.alinkins | Workout programs",
    description: "Build your dream body with focused training programs.",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: [{ url: "/apple-icon", sizes: "1024x1024", type: "image/png" }] },
  appleWebApp: { capable: true, title: "by.alinkins", statusBarStyle: "default" },
};
// Android Chrome can retain a landscape fullscreen zoom after native video exits.
// Keeping one fixed page scale makes it reliably return to the lesson layout.
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#f4ebe3" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${hankenGrotesk.className} ${hankenGrotesk.variable} ${montserrat.variable} ${mulish.variable}`}><PageTransition /><PullToRefresh /><PostHogAnalytics /><HashAnchorScroll /><div className="app-page-content">{children}</div><Analytics /><SpeedInsights /></body></html>; }
