import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/typing-speed-test`;

export const metadata: Metadata = {
  title: "Typing Speed Test — Measure Words Per Minute (WPM) | Thock",
  description: "Measure your words per minute speed. A modern typing speed test featuring responsive animations and customizable keyboard finishes.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Typing Speed Test — Measure Words Per Minute (WPM) | Thock",
    description: "Measure your words per minute speed. A modern typing speed test featuring responsive animations and customizable keyboard finishes.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Speed Test — Measure Words Per Minute (WPM) | Thock",
    description: "Measure your words per minute speed. A modern typing speed test featuring responsive animations.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="typing-speed-test" />
    </>
  );
}
