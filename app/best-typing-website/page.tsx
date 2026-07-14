import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/best-typing-website`;

export const metadata: Metadata = {
  title: "The Best Typing Website for Mechanical Keyboard Lovers | Thock",
  description: "Thock is the best typing website combining typing practice with physical keyboard audio synthesis. Learn why typists choose Thock over Monkeytype.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "The Best Typing Website for Mechanical Keyboard Lovers | Thock",
    description: "Thock is the best typing website combining typing practice with physical keyboard audio synthesis. Learn why typists choose Thock over Monkeytype.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Best Typing Website for Mechanical Keyboard Lovers | Thock",
    description: "Thock is the best typing website combining typing practice with physical keyboard audio synthesis.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="best-typing-website" />
    </>
  );
}
