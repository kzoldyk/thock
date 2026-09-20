import type { DifficultyBand } from "@/lib/adaptive/types"
import frequencyData from "./en-frequency.json"

/**
 * Frequency-ranked English vocabulary.
 * Index 0 == rank 1 == most common word in the language.
 */
export const FREQUENCY_WORDS: string[] = frequencyData.words

const RANK_INDEX: Map<string, number> = new Map()
for (let i = 0; i < FREQUENCY_WORDS.length; i++) {
  RANK_INDEX.set(FREQUENCY_WORDS[i], i + 1)
}

/** 1-based corpus rank of a word, or null when unknown to the list. */
export function getWordRank(word: string): number | null {
  return RANK_INDEX.get(word.toLowerCase()) ?? null
}

export function isKnownFrequencyWord(word: string): boolean {
  return RANK_INDEX.has(word.toLowerCase())
}

/**
 * Rank ceilings per band. A word's primary difficulty comes from how common
 * it is in real language — muscle memory only exists for words people
 * actually type. Personal telemetry escalates from this baseline.
 */
export const BAND_RANK_THRESHOLDS = {
  easyMaxRank: 300,
  mediumMaxRank: 1500,
} as const

export function frequencyBand(word: string): DifficultyBand {
  const rank = getWordRank(word)
  if (rank === null) return "hard"
  if (rank <= BAND_RANK_THRESHOLDS.easyMaxRank) return "easy"
  if (rank <= BAND_RANK_THRESHOLDS.mediumMaxRank) return "medium"
  return "hard"
}

// ---------------------------------------------------------------------------
// Language pools
// ---------------------------------------------------------------------------

export type LanguageId = "en" | "en1k" | "en5k"

export interface LanguageOption {
  id: LanguageId
  label: string
  ceiling: number
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "en", label: "english", ceiling: 300 },
  { id: "en1k", label: "english 1k", ceiling: 1200 },
  { id: "en5k", label: "english 5k", ceiling: 5000 },
]

const LANGUAGE_CEILINGS: Record<LanguageId, number> = {
  en: 300,
  en1k: 1200,
  en5k: 5000,
}

export function getLanguageCeiling(language: LanguageId): number {
  return LANGUAGE_CEILINGS[language] ?? LANGUAGE_CEILINGS.en
}

const poolCache = new Map<LanguageId, string[]>()

/** Rank-ordered pool slice for a language, memoized. */
export function getLanguagePool(language: LanguageId): string[] {
  let pool = poolCache.get(language)
  if (!pool) {
    pool = FREQUENCY_WORDS.slice(0, getLanguageCeiling(language))
    poolCache.set(language, pool)
  }
  return pool
}

/** Fallback pool when no language is specified — the default english pool. */
export function getDefaultPool(): string[] {
  return getLanguagePool("en")
}

// ---------------------------------------------------------------------------
// Rank-based sampling utilities
//
// NOTE: monkeytype's default test samples UNIFORMLY over its top-200 list —
// its Zipf mode is opt-in per funbox. Uniform-over-top-N is the empirically
// smooth baseline, so thock's generators sample uniformly too. These helpers
// stay exported (and tested) for future opt-in weighted modes.
// ---------------------------------------------------------------------------

const EULER_GAMMA = 0.5772156649015329

/**
 * Maps a uniform random draw to a Zipf-distributed index over [0, length).
 * PMF of rank n is (1/n)/H_N — mimics natural language where common words
 * dominate. Deterministic given a seeded rng, unlike Math.random versions.
 */
export function zipfIndex(rng: () => number, length: number): number {
  if (length <= 1) return 0
  const H_N = Math.log(length + 0.5) + EULER_GAMMA
  const inverseCDF = Math.exp(rng() * H_N - EULER_GAMMA) - 0.5
  return Math.min(length - 1, Math.max(0, Math.floor(inverseCDF)))
}

/** Relative Zipf prior weight of a 1-based rank (unnormalized 1/rank). */
export function zipfWeight(rank: number): number {
  return 1 / Math.max(1, rank)
}
