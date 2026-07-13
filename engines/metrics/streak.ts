import type { WordData } from "@/types"

export function calculateBestStreak(words: WordData[]): number {
  let best = 0
  let current = 0

  for (const word of words) {
    for (const char of word.chars) {
      if (char.state === "correct") {
        current++
        best = Math.max(best, current)
      } else if (char.state === "incorrect" || char.state === "extra") {
        current = 0
      }
    }
  }

  return best
}
