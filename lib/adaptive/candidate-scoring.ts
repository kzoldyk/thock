import type {
  CandidateScore,
  GenerationContext,
  UserTypingProfile,
  UserTypingState,
  AdaptiveStrategy,
  DifficultyBand,
} from "./types"
import { effectiveDifficulty, classifyDifficultyBand } from "./difficulty"
import { extractNGrams } from "./ngram-profile"

interface StrategyWeights {
  perf: number
  learn: number
  imp: number
  exp: number
  div: number
}

const STRATEGY_WEIGHTS: Record<AdaptiveStrategy, StrategyWeights> = {
  balanced: { perf: 0.5, learn: 0.28, imp: 0.1, exp: 0.07, div: 0.05 },
  performance: { perf: 0.75, learn: 0.12, imp: 0.06, exp: 0.04, div: 0.03 },
  training: { perf: 0.35, learn: 0.42, imp: 0.12, exp: 0.06, div: 0.05 },
  challenge: { perf: 0.2, learn: 0.52, imp: 0.12, exp: 0.1, div: 0.06 },
}

/**
 * Scores a single candidate word across multi-objective dimensions.
 */
export function scoreCandidateWord(
  word: string,
  context: GenerationContext,
  activeSequence: string[] = [],
  slotBand?: DifficultyBand
): CandidateScore {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "")
  const strategy = context.strategy || "balanced"
  const userProfile = context.userProfile
  const userState = context.userState
  let weights = { ...(STRATEGY_WEIGHTS[strategy] || STRATEGY_WEIGHTS.balanced) }

  // If scoring specifically for an easy slot, focus on performance/flow over weakness drilling
  if (slotBand === "easy") {
    weights = { perf: 0.75, learn: 0.05, imp: 0.05, exp: 0.05, div: 0.1 }
  } else if (slotBand === "medium" || slotBand === "hard") {
    weights = { perf: 0.25, learn: 0.5, imp: 0.12, exp: 0.08, div: 0.05 }
  }

  const effDiff = effectiveDifficulty(clean, userProfile)
  const band = classifyDifficultyBand(effDiff)

  const wProfile = userProfile?.words[clean]
  const targetDiff = userState?.difficultyLevel ?? 0.45
  const baselineWpm = userState?.baselineWpm ?? 60

  // 1. Performance Value: ability to maintain high speed and precision
  let performanceValue = 0.5
  if (wProfile && wProfile.attempts > 0) {
    const speedRatio = Math.min(1.2, wProfile.recentWpm / Math.max(30, baselineWpm))
    const accScore = Math.pow(wProfile.recentAccuracy / 100, 2)
    performanceValue = Math.min(1.0, speedRatio * 0.55 + accScore * 0.45)
  } else {
    // Unobserved words: inversely proportional to difficulty
    performanceValue = Math.max(0.1, 1.0 - effDiff * 0.9)
  }

  // 2. Learning Value: coverage of known user weaknesses
  let learningValue = 0.05
  const weaknesses = userProfile?.weaknesses || []
  if (weaknesses.length > 0) {
    const { unigrams, bigrams, trigrams } = extractNGrams(clean)
    const patternsInWord = new Set([...unigrams, ...bigrams, ...trigrams, clean])

    let matchedWeightSum = 0
    for (const w of weaknesses) {
      if (patternsInWord.has(w.pattern)) {
        matchedWeightSum += w.weight
      }
    }
    learningValue = Math.min(1.0, matchedWeightSum * 1.8)
  }

  // 3. Improvement Value: positive reinforcement for words/ngrams trending upward
  let improvementValue = 0.0
  if (wProfile && wProfile.trend > 0) {
    improvementValue = Math.min(1.0, wProfile.trend * 1.5)
  } else {
    const { bigrams } = extractNGrams(clean)
    let trendingCount = 0
    for (const bg of bigrams) {
      const stat = userProfile?.ngrams[bg]
      if (stat && stat.trend > 0.1) {
        trendingCount++
      }
    }
    if (bigrams.length > 0) {
      improvementValue = Math.min(0.8, (trendingCount / bigrams.length) * 0.8)
    }
  }

  // 4. Exploration Value: discovering unobserved or low-confidence words
  let explorationValue = 0.1
  if (!wProfile || wProfile.attempts === 0) {
    explorationValue = 0.85
  } else {
    explorationValue = Math.max(0.05, 1.0 - wProfile.confidence)
  }

  // 5. Diversity Value: varying length and letter starts
  let diversityValue = 0.5
  if (activeSequence.length > 0) {
    const lastWord = activeSequence[activeSequence.length - 1]
    const lengthDiff = Math.abs(clean.length - lastWord.length)
    const startsDifferent = clean[0] !== lastWord[0]
    diversityValue = (startsDifferent ? 0.6 : 0.2) + Math.min(0.4, lengthDiff * 0.1)
  }

  // 6. Repetition Penalty: exponentially decaying penalty for recently typed or placed words
  let repetitionPenalty = 0.0
  const recentList = context.recentWords || []

  // Penalty within current active sequence
  for (let i = 0; i < activeSequence.length; i++) {
    if (activeSequence[i].toLowerCase() === clean) {
      const distance = activeSequence.length - i
      // Heavy penalty for words typed 1-3 slots ago, gently decaying up to 10 slots
      if (distance <= 3) repetitionPenalty += 0.8
      else if (distance <= 6) repetitionPenalty += 0.45
      else if (distance <= 12) repetitionPenalty += 0.2
    }
  }

  // Penalty from previous session's recent words
  const prevSessionIdx = recentList.lastIndexOf(clean)
  if (prevSessionIdx !== -1) {
    const recencyDistance = recentList.length - prevSessionIdx
    if (recencyDistance <= 5) repetitionPenalty += 0.25
  }
  repetitionPenalty = Math.min(1.2, repetitionPenalty)

  // 7. Excessive Difficulty Penalty: prevent throwing words way beyond tolerance
  let excessiveDifficultyPenalty = 0.0
  const diffDelta = effDiff - targetDiff
  if (diffDelta > 0.25) {
    // If word is much harder than user target difficulty, penalize strongly
    excessiveDifficultyPenalty = Math.min(1.0, Math.pow(diffDelta - 0.25, 1.5) * 3)
  }

  // Composite final score
  const finalScore =
    weights.perf * performanceValue +
    weights.learn * learningValue +
    weights.imp * improvementValue +
    weights.exp * explorationValue +
    weights.div * diversityValue -
    repetitionPenalty -
    excessiveDifficultyPenalty

  return {
    word: clean,
    performanceValue: Math.round(performanceValue * 100) / 100,
    learningValue: Math.round(learningValue * 100) / 100,
    improvementValue: Math.round(improvementValue * 100) / 100,
    diversityValue: Math.round(diversityValue * 100) / 100,
    explorationValue: Math.round(explorationValue * 100) / 100,
    repetitionPenalty: Math.round(repetitionPenalty * 100) / 100,
    excessiveDifficultyPenalty: Math.round(excessiveDifficultyPenalty * 100) / 100,
    finalScore: Math.round(finalScore * 1000) / 1000,
    effectiveDifficulty: effDiff,
    band,
  }
}
