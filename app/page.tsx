import type { Metadata } from "next";
import PageClient from "./page-client";
import { SEOContent } from "@/components/ui/SEOContent";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";

export const metadata: Metadata = {
  title: "Thock — Premium Mechanical Keyboard Typing Test & Experience",
  description: "Experience the ultimate mechanical keyboard typing test online. Track your WPM speed, accuracy, and enjoy realistic clacks, thocks, and linear switch sounds. Practice typing for free.",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Thock — Premium Mechanical Keyboard Typing Test",
    description: "Experience the ultimate mechanical keyboard typing test online. Track your WPM speed, accuracy, and enjoy realistic clacks, thocks, and linear switch sounds. Practice typing for free.",
    url: baseUrl,
    siteName: "Thock",
    images: [
      {
        url: `${baseUrl}/screenshot.png`,
        width: 1200,
        height: 630,
        alt: "Thock Typing Simulator Screenshot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thock — Premium Mechanical Keyboard Typing Test",
    description: "Experience the ultimate mechanical keyboard typing test online. Track your WPM speed, accuracy, and enjoy realistic clacks, thocks, and linear switch sounds.",
    images: [`${baseUrl}/screenshot.png`],
  },
  applicationName: "Thock",
  authors: [{ name: "kzoldyk" }],
};

export const viewport = {
  themeColor: "#09090b",
};

export default function Home() {
  return (
    <>
      <PageClient />
      <SEOContent page="home" />
    </>
  );
}
