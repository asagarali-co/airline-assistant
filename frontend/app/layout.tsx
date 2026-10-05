import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const description = "Plan your next trip with FlightAI, a free AI travel planner offering live weather, destination insights, packing tips, and free travel advice.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://localhost:3000"),
  title: { default: "FlightAI - Free AI Travel Planner", template: "%s | FlightAI" },
  description,
  applicationName: "FlightAI",
  ...(siteUrl ? { alternates: { canonical: "/" } } : {}),
  openGraph: {
    type: "website",
    siteName: "FlightAI",
    title: "FlightAI - Free AI Travel Planner",
    description,
    ...(siteUrl ? { url: "/" } : {}),
    images: [{ url: "/brand/social-preview.png", width: 1200, height: 630, alt: "FlightAI - Your AI travel companion. Your next chapter, beautifully planned." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlightAI - Free AI Travel Planner",
    description,
    images: ["/brand/social-preview.png"],
  },
  icons: { icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" }, { url: "/brand/flightai-mark.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#244c3e", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9847799502456875"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
