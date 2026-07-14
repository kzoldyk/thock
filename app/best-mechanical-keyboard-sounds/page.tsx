import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/best-mechanical-keyboard-sounds`;

export const metadata: Metadata = {
  title: "Best Mechanical Keyboard Sounds — Clicky, Tactile & Linear | Thock",
  description: "Enjoy the best mechanical keyboard sounds. Simulates Cherry MX Blue switches, tape mods, foam mods, and spatial audio in your browser.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Best Mechanical Keyboard Sounds — Clicky, Tactile & Linear | Thock",
    description: "Enjoy the best mechanical keyboard sounds. Simulates Cherry MX Blue switches, tape mods, foam mods, and spatial audio in your browser.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Mechanical Keyboard Sounds — Clicky, Tactile & Linear | Thock",
    description: "Enjoy the best mechanical keyboard sounds. Simulates Cherry MX Blue switches, tape mods, foam mods.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="best-mechanical-keyboard-sounds" />
    </>
  );
}
