/**
 * F2 — Share card generator.
 * Renders the session score into a 1200x630 canvas using the user's
 * active theme colors and returns a PNG blob for Web Share / download.
 */

export interface ShareCardData {
  wpm: number
  accuracy: number
  consistency: number
  modeLabel: string
  rankTitle: string
  theme: {
    background: string
    foreground: string
    muted: string
    accent: string
  }
}

const W = 1200
const H = 630

export async function buildScoreShareCard(data: ShareCardData): Promise<Blob | null> {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const { background, foreground, muted, accent } = data.theme
  const sans = "'Geist', 'Inter', system-ui, -apple-system, sans-serif"
  const mono = "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace"

  // Background
  ctx.fillStyle = background
  ctx.fillRect(0, 0, W, H)

  // Ambient accent glow top-center
  const glow = ctx.createRadialGradient(W / 2, -100, 50, W / 2, -100, 700)
  glow.addColorStop(0, hexWithAlpha(accent, 0.22))
  glow.addColorStop(1, hexWithAlpha(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Accent baseline bar
  ctx.fillStyle = accent
  ctx.fillRect(80, H - 96, 120, 6)

  // Wordmark
  ctx.fillStyle = foreground
  ctx.font = `600 34px ${sans}`
  ctx.textBaseline = "alphabetic"
  ctx.fillText("thock", 80, 92)
  ctx.fillStyle = accent
  ctx.fillText(".", 158, 92)

  // Rank title
  ctx.fillStyle = muted
  ctx.font = `500 26px ${sans}`
  ctx.textAlign = "right"
  ctx.fillText(data.rankTitle, W - 80, 90)
  ctx.textAlign = "left"

  // Hero WPM
  ctx.fillStyle = foreground
  ctx.font = `700 240px ${sans}`
  ctx.fillText(String(Math.round(data.wpm)), 72, 360)
  ctx.fillStyle = muted
  ctx.font = `600 30px ${sans}`
  ctx.fillText("WPM", 76, 410)

  // Secondary stats row
  ctx.font = `500 30px ${mono}`
  const statsY = 496
  let x = 80
  const pairs: Array<[string, string]> = [
    ["ACC", `${Math.round(data.accuracy)}%`],
    ["CONS", `${Math.round(data.consistency)}%`],
    ["MODE", data.modeLabel],
  ]
  for (const [label, value] of pairs) {
    ctx.fillStyle = muted
    ctx.fillText(label, x, statsY)
    const labelW = ctx.measureText(label).width
    ctx.fillStyle = foreground
    ctx.fillText(value, x + labelW + 14, statsY)
    x += labelW + measureWidth(ctx, value) + 64
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png")
  })
}

function measureWidth(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Shares via Web Share API when file sharing is supported,
 * otherwise falls back to a PNG download.
 */
export async function shareOrDownload(blob: Blob): Promise<"shared" | "downloaded"> {
  const file = new File([blob], "thock-score.png", { type: "image/png" })
  const nav = typeof navigator !== "undefined" ? navigator : undefined
  if (nav && "canShare" in nav && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "thock — typing score" })
      return "shared"
    } catch {
      // User cancelled or share failed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "thock-score.png"
  a.click()
  URL.revokeObjectURL(url)
  return "downloaded"
}
