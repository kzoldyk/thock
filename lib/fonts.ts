import type { FontFamily } from "@/types"

export function getFontClass(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case "inter":
      return "font-inter"
    case "geist":
    case "sf-pro":
      return "font-sans"
    case "jetbrains-mono":
      return "font-jetbrains-mono"
    case "ibm-plex-mono":
      return "font-ibm-plex-mono"
    case "source-code-pro":
      return "font-source-code-pro"
    default:
      return "font-sans"
  }
}
