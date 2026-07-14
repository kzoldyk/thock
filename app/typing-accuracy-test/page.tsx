import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/typing-accuracy-test`;

export const metadata: Metadata = {
  title: "Typing Accuracy Test — Track Precision and Consistency | Thock",
  description: "Test and improve your typing accuracy. Track precise character mistakes and key consistency with detailed post-test statistics.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Typing Accuracy Test — Track Precision and Consistency | Thock",
    description: "Test and improve your typing accuracy. Track precise character mistakes and key consistency with detailed post-test statistics.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Accuracy Test — Track Precision and Consistency | Thock",
    description: "Test and improve your typing accuracy. Track precise character mistakes.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="typing-accuracy-test" />
    </>
  );
}
