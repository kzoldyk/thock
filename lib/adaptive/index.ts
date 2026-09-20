export * from "./types"
export * from "./word-profile"
export * from "./ngram-profile"
export * from "./user-profile"
export * from "./difficulty"
export * from "./candidate-scoring"
export * from "./sequence-generator"
export * from "./telemetry"
export { generateAdaptiveWords } from "../words"

import type {
  GenerationContext,
  UserTypingProfile,
  CandidateScore,
  UserTypingState,
  DifficultyBand,
} from "./types"
import { getLocalAdaptiveProfile } from "./telemetry"
import { deriveUserTypingState } from "./user-profile"
import { generateAdaptiveSequence, generateFrequencySequence } from "./sequence-generator"
import { scoreCandidateWord } from "./candidate-scoring"
import { getLocalHistory } from "../user-stats"
import { applyComplexity } from "../words"
import { findEasterEgg } from "../easter-eggs"
import { getLanguageCeiling, type LanguageId } from "../data/frequency"

export interface AdaptiveWordOptions {
  profile?: UserTypingProfile | null
  testCount?: number
  seed?: number
  complex?: boolean
  strategy?: "balanced" | "performance" | "training" | "challenge"
  recentWords?: string[]
  /** Frequency pool selection — defaults to the top-300 "english" pool */
  language?: LanguageId
  /** When false, skips all personalization and generates a pure Zipf sequence */
  adaptive?: boolean
}

/**
 * Main entry point for generating personalized adaptive words.
 */
export function generatePersonalizedWords(
  count: number = 30,
  options: AdaptiveWordOptions = {}
): string[] {
  const seed = options.seed ?? Date.now()
  const language = options.language ?? "en"

  // Adaptive engine off: pure flow over the chosen vocabulary
  if (options.adaptive === false) {
    const generated = generateFrequencySequence(
      count,
      seed,
      language,
      getLanguageCeiling(language)
    )
    return finishGeneration(generated, seed, options.complex ?? false, count)
  }

  const profile = options.profile !== undefined ? options.profile : getLocalAdaptiveProfile()
  const history = getLocalHistory()
  const userState = deriveUserTypingState(profile, history)

  const context: GenerationContext = {
    count,
    strategy:
      options.strategy ||
      (userState.state === "calibrating" || (options.testCount ?? history.length) < 5
        ? "performance"
        : "balanced"),
    seed,
    recentWords: options.recentWords || [],
    userState,
    userProfile: profile,
    testCount: options.testCount ?? profile?.testCount ?? history.length,
    complex: options.complex ?? false,
    practiceSet: profile?.practiceSet || [],
    language,
  }

  const generated = generateAdaptiveSequence(count, context)
  return finishGeneration(generated, seed, context.complex ?? false, count)
}

/**
 * Shared post-processing: easter-egg-safe complexity transforms.
 */
function finishGeneration(
  generated: string[],
  seed: number,
  complex: boolean,
  count: number
): string[] {
  if (!complex || count <= 0) {
    return generated.slice(0, Math.max(0, count))
  }

  // Keep easter egg words pristine through complexity transforms so their
  // triggers still match when typed.
  const eggWords = new Set(
    generated
      .map((w) => findEasterEgg(w)?.word)
      .filter((w): w is string => Boolean(w))
  )
  return applyComplexity(generated, seed, eggWords)
}

/**
 * Diagnostic explanation helper for testing and development transparency.
 */
export function explainAdaptiveGeneration(
  count: number = 10,
  options: AdaptiveWordOptions = {}
): {
  userState: UserTypingState
  distribution: Record<DifficultyBand, number>
  words: Array<{ word: string; score: CandidateScore }>
} {
  const profile = options.profile !== undefined ? options.profile : getLocalAdaptiveProfile()
  const history = getLocalHistory()
  const userState = deriveUserTypingState(profile, history)

  const context: GenerationContext = {
    count,
    strategy: options.strategy || "balanced",
    seed: options.seed ?? 42,
    recentWords: options.recentWords || [],
    userState,
    userProfile: profile,
    testCount: options.testCount ?? profile?.testCount ?? history.length,
  }

  const sequence = generateAdaptiveSequence(count, context)
  const breakdown = sequence.map((word) => ({
    word,
    score: scoreCandidateWord(word, context, []),
  }))

  const distribution: Record<DifficultyBand, number> = { easy: 0, medium: 0, hard: 0 }
  for (const item of breakdown) {
    distribution[item.score.band]++
  }

  return {
    userState,
    distribution,
    words: breakdown,
  }
}
