import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
  const routes = [
    "",
    "/typing-test",
    "/wpm-test",
    "/mechanical-keyboard-typing-test",
    "/typing-practice",
    "/typing-speed-test",
    "/typing-accuracy-test",
    "/best-typing-website",
    "/best-mechanical-keyboard-sounds",
    "/how-to-improve-typing-speed",
    "/how-to-type-faster",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
