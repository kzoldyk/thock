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
import { generateAdaptiveSequence } from "./sequence-generator"
import { scoreCandidateWord } from "./candidate-scoring"
import { getLocalHistory } from "../user-stats"
import { applyComplexity } from "../words"

export interface AdaptiveWordOptions {
  profile?: UserTypingProfile | null
  testCount?: number
  seed?: number
  complex?: boolean
  strategy?: "balanced" | "performance" | "training" | "challenge"
  recentWords?: string[]
}

/**
 * Main entry point for generating personalized adaptive words.
 */
export function generatePersonalizedWords(
  count: number = 30,
  options: AdaptiveWordOptions = {}
): string[] {
  const profile = options.profile !== undefined ? options.profile : getLocalAdaptiveProfile()
  const history = getLocalHistory()
  const userState = deriveUserTypingState(profile, history)

  const context: GenerationContext = {
    count,
    strategy: options.strategy || "balanced",
    seed: options.seed ?? Date.now(),
    recentWords: options.recentWords || [],
    userState,
    userProfile: profile,
    testCount: options.testCount ?? profile?.testCount ?? history.length,
    complex: options.complex ?? false,
  }

  const generated = generateAdaptiveSequence(count, context)

  if (!options.complex) {
    return generated
  }

  return applyComplexity(generated, context.seed ?? 42)
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
