import type { Metadata } from "next";
import PageClient from "@/app/page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
const pageUrl = `${baseUrl}/wpm-test`;

export const metadata: Metadata = {
  title: "WPM Test — Calculate Words Per Minute Speed | Thock",
  description: "Take the WPM test to measure your typing speed in words per minute. Practice with premium sound profiles and track your accuracy and consistency.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "WPM Test — Calculate Words Per Minute Speed | Thock",
    description: "Take the WPM test to measure your typing speed in words per minute. Practice with premium sound profiles and track your accuracy and consistency.",
    url: pageUrl,
    images: [`${baseUrl}/screenshot.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "WPM Test — Calculate Words Per Minute Speed | Thock",
    description: "Take the WPM test to measure your typing speed in words per minute. Practice with premium sound profiles.",
    images: [`${baseUrl}/screenshot.png`],
  },
};

export default function Page() {
  return (
    <>
      <PageClient />
      <SEOContent page="wpm-test" />
    </>
  );
}
