import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/typing-test`;

export const metadata: Metadata = {
  title: "Online Typing Test — Check Your Typing Speed (WPM) | Thock",
  description: "Test your typing speed and accuracy with our online typing test. Experience realistic mechanical keyboard sounds as you clack your way to a higher WPM.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Online Typing Test — Check Your Typing Speed (WPM) | Thock",
    description: "Test your typing speed and accuracy with our online typing test. Experience realistic mechanical keyboard sounds as you clack your way to a higher WPM.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Typing Test — Check Your Typing Speed (WPM) | Thock",
    description: "Test your typing speed and accuracy with our online typing test. Experience realistic mechanical keyboard sounds.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="typing-test" />
    </>
  );
}
