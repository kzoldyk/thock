import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/how-to-type-faster`;

export const metadata: Metadata = {
  title: "How to Type Faster — Master Keyboard Layouts & Workflows | Thock",
  description: "Step-by-step guide on how to type faster. Master key positioning, learn proper hand placement, and boost your WPM with regular exercises.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "How to Type Faster — Master Keyboard Layouts & Workflows | Thock",
    description: "Step-by-step guide on how to type faster. Master key positioning, learn proper hand placement, and boost your WPM with regular exercises.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Type Faster — Master Keyboard Layouts & Workflows | Thock",
    description: "Step-by-step guide on how to type faster. Master key positioning, learn proper hand placement.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="how-to-type-faster" />
    </>
  );
}
