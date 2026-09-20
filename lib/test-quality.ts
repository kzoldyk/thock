import { getWordRank } from "./data/frequency"

export interface TestQualityMetrics {
  /** Share of words drawn from the 200 most common English words [0-100] */
  pctTop200: number
  /** Mean word length in characters */
  avgWordLength: number
  /** Smallest gap between two occurrences of the same word (Infinity if unique) */
  minRepeatDistance: number
}

/**
 * Measures how "natural" a generated test feels: real-language frequency
 * share, rhythm-friendly word lengths, and repetition hygiene.
 */
export function computeTestQualityMetrics(words: string[]): TestQualityMetrics {
  if (words.length === 0) {
    return { pctTop200: 0, avgWordLength: 0, minRepeatDistance: Infinity }
  }

  let top200 = 0
  let totalLength = 0
  const lastSeen = new Map<string, number>()
  let minRepeatDistance = Infinity

  for (let i = 0; i < words.length; i++) {
    const clean = words[i].toLowerCase().replace(/[^a-z]/g, "")
    totalLength += clean.length

    const rank = getWordRank(clean)
    if (rank !== null && rank <= 200) top200++

    const prevIdx = lastSeen.get(clean)
    if (prevIdx !== undefined) {
      minRepeatDistance = Math.min(minRepeatDistance, i - prevIdx)
    }
    lastSeen.set(clean, i)
  }

  return {
    pctTop200: Math.round((top200 / words.length) * 100),
    avgWordLength: Math.round((totalLength / words.length) * 10) / 10,
    minRepeatDistance,
  }
}
