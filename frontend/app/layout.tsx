import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const description = "Plan your next adventure with FlightAI, your AI travel companion for live weather, destination insights, packing advice, and practical trip planning.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://localhost:3000"),
  title: { default: "FlightAI - Your AI Travel Companion", template: "%s | FlightAI" },
  description,
  applicationName: "FlightAI",
  ...(siteUrl ? { alternates: { canonical: "/" } } : {}),
  openGraph: {
    type: "website",
    siteName: "FlightAI",
    title: "FlightAI - Your next chapter. Beautifully planned.",
    description,
    ...(siteUrl ? { url: "/" } : {}),
    images: [{ url: "/brand/social-preview.png", width: 1200, height: 630, alt: "FlightAI - Your AI travel companion. Your next chapter, beautifully planned." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlightAI - Your AI Travel Companion",
    description,
    images: ["/brand/social-preview.png"],
  },
  icons: { icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" }, { url: "/brand/flightai-mark.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#244c3e", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
