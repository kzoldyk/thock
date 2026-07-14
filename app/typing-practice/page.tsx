import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/typing-practice`;

export const metadata: Metadata = {
  title: "Typing Practice — Improve Your Speed and Accuracy | Thock",
  description: "Practice typing with Thock's flow-focused trainer. Improve accuracy, track consistency, and listen to satisfying mechanical switch sounds.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Typing Practice — Improve Your Speed and Accuracy | Thock",
    description: "Practice typing with Thock's flow-focused trainer. Improve accuracy, track consistency, and listen to satisfying mechanical switch sounds.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Practice — Improve Your Speed and Accuracy | Thock",
    description: "Practice typing with Thock's flow-focused trainer. Improve accuracy, track consistency.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="typing-practice" />
    </>
  );
}
