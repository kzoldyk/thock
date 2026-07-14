import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/how-to-improve-typing-speed`;

export const metadata: Metadata = {
  title: "How to Improve Typing Speed — Pro Typing Tips & Guides | Thock",
  description: "Learn how to improve typing speed. Read our tips on proper posture, muscle memory, mechanical switches, and regular typing practice.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "How to Improve Typing Speed — Pro Typing Tips & Guides | Thock",
    description: "Learn how to improve typing speed. Read our tips on proper posture, muscle memory, mechanical switches, and regular typing practice.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Improve Typing Speed — Pro Typing Tips & Guides | Thock",
    description: "Learn how to improve typing speed. Read our tips on proper posture, muscle memory, mechanical switches.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="how-to-improve-typing-speed" />
    </>
  );
}
