import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/mechanical-keyboard-typing-test`;

export const metadata: Metadata = {
  title: "Mechanical Keyboard Typing Test — Realistic Switch Sounds | Thock",
  description: "Love mechanical keyboards? Try our specialized typing test with customizable sound profiles like Cherry Blue, tape mods, and foam mods.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Mechanical Keyboard Typing Test — Realistic Switch Sounds | Thock",
    description: "Love mechanical keyboards? Try our specialized typing test with customizable sound profiles like Cherry Blue, tape mods, and foam mods.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mechanical Keyboard Typing Test — Realistic Switch Sounds | Thock",
    description: "Love mechanical keyboards? Try our specialized typing test with customizable sound profiles.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="mechanical-keyboard-typing-test" />
    </>
  );
}
