import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thock — Premium Typing Experience",
    short_name: "Thock",
    description: "A premium mechanical keyboard typing experience and WPM test inspired by clack clack sound profiles.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#fafafa",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
