import type { Metadata } from "next";
import AnalyticsDashboard from "@/components/ui/AnalyticsDashboard";
import { SEOContent } from "@/components/ui/SEOContent";

export const metadata: Metadata = {
  title: "Device Analytics",
  description: "View real-time device configurations, traffic trends, and browser statistics for Thock typing simulator.",
};

export const viewport = {
  themeColor: "#09090b",
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <AnalyticsDashboard />
      <SEOContent page="home" />
    </main>
  );
}
