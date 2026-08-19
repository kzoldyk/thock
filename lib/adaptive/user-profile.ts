import type {
  UserTypingProfile,
  UserTypingState,
  UserStateCategory,
  WeaknessItem,
  WordProfile,
  NGramProfile,
} from "./types"
import type { LetterStat, UserGripProfile } from "../letter-grip"
import type { TestRecord } from "@/types"

export const DEFAULT_BASELINE_WPM = 60
export const DEFAULT_BASELINE_ACCURACY = 95

/**
 * Derives a dynamic UserTypingState from historical records and current profile metrics.
 */
export function deriveUserTypingState(
  profile: UserTypingProfile | null | undefined,
  records: TestRecord[] = []
): UserTypingState {
  const testCount = profile?.testCount ?? records.length

  if (!profile || testCount < 3 || records.length === 0) {
    return {
      baselineWpm: DEFAULT_BASELINE_WPM,
      recentWpm: DEFAULT_BASELINE_WPM,
      baselineAccuracy: DEFAULT_BASELINE_ACCURACY,
      recentAccuracy: DEFAULT_BASELINE_ACCURACY,
      wpmTrend: 0,
      accuracyTrend: 0,
      consistency: 80,
      difficultyLevel: 0.35, // Balanced baseline difficulty during calibration
      confidence: Math.min(0.3, testCount * 0.1),
      momentumScore: 0.5,
      state: "calibrating",
    }
  }

  // Calculate baseline (all-time average) and recent (last 3-5 tests)
  const sortedRecords = [...records].sort((a, b) => a.createdAt - b.createdAt)
  const recentSlice = sortedRecords.slice(-5)

  const baselineWpm = Math.round(
    sortedRecords.reduce((sum, r) => sum + r.wpm, 0) / sortedRecords.length
  )
  const recentWpm = Math.round(
    recentSlice.reduce((sum, r) => sum + r.wpm, 0) / recentSlice.length
  )

  const baselineAccuracy = Math.round(
    sortedRecords.reduce((sum, r) => sum + r.accuracy, 0) / sortedRecords.length
  )
  const recentAccuracy = Math.round(
    recentSlice.reduce((sum, r) => sum + r.accuracy, 0) / recentSlice.length
  )

  const consistency = Math.round(
    recentSlice.reduce((sum, r) => sum + (r.consistency || 80), 0) / recentSlice.length
  )

  // Trends
  const wpmTrend = (recentWpm - baselineWpm) / Math.max(20, baselineWpm)
  const accuracyTrend = (recentAccuracy - baselineAccuracy) / 100

  // Confidence grows with test volume and sample consistency
  const volumeConfidence = 1 - Math.exp(-testCount / 15)
  const consistencyFactor = Math.max(0.6, consistency / 100)
  const overallConfidence = Math.max(0.1, Math.min(1.0, volumeConfidence * consistencyFactor))

  // Momentum score: composite coupling of recent accuracy, speed ratio, and consistency
  const speedRatio = Math.min(1.5, Math.max(0.5, recentWpm / Math.max(20, baselineWpm)))
  const accScore = Math.max(0, (recentAccuracy - 70) / 30) // 0 to 1 between 70% and 100%
  const momentumScore = Math.max(
    0,
    Math.min(1, (accScore * 0.5 + (speedRatio / 1.5) * 0.3 + (consistency / 100) * 0.2))
  )

  // Determine state category
  let state: UserStateCategory = "stable"

  if (testCount < 3) {
    state = "calibrating"
  } else if (recentAccuracy < 90 || wpmTrend < -0.15 || (recentAccuracy < 93 && wpmTrend < -0.08)) {
    state = "struggling"
  } else if (
    baselineWpm >= 80 &&
    baselineAccuracy >= 97 &&
    overallConfidence >= 0.65 &&
    recentAccuracy >= 97
  ) {
    state = "mastering"
  } else if (
    recentAccuracy >= 96 &&
    consistency >= 75 &&
    (wpmTrend >= 0.04 || recentWpm >= baselineWpm)
  ) {
    state = "flow"
  }

  // Dynamic target difficulty level based on state and momentum
  let targetDifficulty = 0.45
  switch (state) {
    case "calibrating":
      targetDifficulty = 0.35
      break
    case "struggling":
      targetDifficulty = Math.max(0.15, 0.3 - (100 - recentAccuracy) * 0.01)
      break
    case "stable":
      targetDifficulty = 0.45 + wpmTrend * 0.1
      break
    case "flow":
      targetDifficulty = Math.min(0.7, 0.55 + momentumScore * 0.15)
      break
    case "mastering":
      targetDifficulty = Math.min(0.85, 0.7 + momentumScore * 0.15)
      break
  }
  targetDifficulty = Math.max(0.1, Math.min(0.95, targetDifficulty))

  return {
    baselineWpm,
    recentWpm,
    baselineAccuracy,
    recentAccuracy,
    wpmTrend: Math.round(wpmTrend * 100) / 100,
    accuracyTrend: Math.round(accuracyTrend * 100) / 100,
    consistency,
    difficultyLevel: Math.round(targetDifficulty * 100) / 100,
    confidence: Math.round(overallConfidence * 100) / 100,
    momentumScore: Math.round(momentumScore * 100) / 100,
    state,
  }
}

/**
 * Extracts a weighted weakness distribution from letter, bigram, trigram, and word statistics.
 */
export function extractWeaknessDistribution(
  profile: UserTypingProfile | null | undefined
): WeaknessItem[] {
  if (!profile) return []

  const weaknesses: WeaknessItem[] = []

  // 1. Weak letters from letter stats
  for (const [char, stat] of Object.entries(profile.letters || {})) {
    if (stat.totalTyped >= 3) {
      if (stat.accuracy < 90 || stat.gripScore < 75 || stat.errorCount > 0) {
        const severity = (100 - stat.accuracy) / 100 + (100 - stat.gripScore) / 200 + stat.errorCount * 0.1
        weaknesses.push({
          pattern: char,
          type: "letter",
          weight: Math.min(1.0, severity),
          accuracy: stat.accuracy,
          latencyMs: stat.avgLatencyMs,
        })
      }
    }
  }

  // 2. Weak N-grams (bigrams & trigrams)
  for (const [ngram, nstat] of Object.entries(profile.ngrams || {})) {
    if (nstat.attempts >= 2) {
      if (nstat.recentAccuracy < 90 || nstat.errorCount > 0 || nstat.recentLatencyMs > 280) {
        const latencyPenalty = Math.max(0, (nstat.recentLatencyMs - 220) / 300)
        const accPenalty = (100 - nstat.recentAccuracy) / 100
        const severity = accPenalty * 0.6 + latencyPenalty * 0.4 + nstat.errorCount * 0.05
        weaknesses.push({
          pattern: ngram,
          type: nstat.n === 2 ? "bigram" : "trigram",
          weight: Math.min(1.0, severity),
          accuracy: nstat.recentAccuracy,
          latencyMs: nstat.recentLatencyMs,
        })
      }
    }
  }

  // 3. Weak words
  for (const [word, wstat] of Object.entries(profile.words || {})) {
    if (wstat.attempts >= 2) {
      if (wstat.recentAccuracy < 92 || wstat.trend < -0.15) {
        const severity = (100 - wstat.recentAccuracy) / 100 + Math.max(0, -wstat.trend) * 0.3
        weaknesses.push({
          pattern: word,
          type: "word",
          weight: Math.min(1.0, severity),
          accuracy: wstat.recentAccuracy,
          latencyMs: wstat.avgLatencyMs,
        })
      }
    }
  }

  // Sort weaknesses by highest weight first
  weaknesses.sort((a, b) => b.weight - a.weight)

  // Normalize weights so sum is 1 if non-empty
  const totalWeight = weaknesses.reduce((sum, w) => sum + w.weight, 0)
  if (totalWeight > 0) {
    for (const w of weaknesses) {
      w.weight = Math.round((w.weight / totalWeight) * 1000) / 1000
    }
  }

  return weaknesses
}

/**
 * Creates an empty default UserTypingProfile.
 */
export function createEmptyUserProfile(): UserTypingProfile {
  return {
    letters: {},
    words: {},
    ngrams: {},
    weaknesses: [],
    testCount: 0,
    lastUpdatedAt: Date.now(),
  }
}
