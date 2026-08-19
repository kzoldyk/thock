import type { WordAttempt, WordProfile } from "./types"

/**
 * Calculates a confidence value [0, 1] based on number of observations,
 * accuracy stability, and variance.
 */
export function calculateWordConfidence(attempts: number, accuracy: number): number {
  if (attempts <= 0) return 0
  // Exponential growth curve reaching ~0.85 at 15 attempts and ~0.98 at 30 attempts
  const baseConfidence = 1 - Math.exp(-attempts / 8)
  const accuracyFactor = Math.max(0.5, Math.min(1.0, accuracy / 100))
  return Math.max(0, Math.min(1, baseConfidence * accuracyFactor))
}

/**
 * Creates an initial WordProfile from a single WordAttempt.
 */
export function createWordProfile(attempt: WordAttempt): WordProfile {
  const confidence = calculateWordConfidence(1, attempt.accuracy)
  return {
    word: attempt.word.toLowerCase(),
    attempts: 1,
    avgWpm: Math.round(attempt.wpm),
    avgLatencyMs: Math.round(attempt.avgLatencyMs),
    accuracy: Math.round(attempt.accuracy),
    recentWpm: Math.round(attempt.wpm),
    recentAccuracy: Math.round(attempt.accuracy),
    consistency: 100,
    confidence,
    trend: 0,
    lastSeenAt: attempt.completedAt || Date.now(),
  }
}

/**
 * Updates an existing WordProfile with a new WordAttempt using recency-weighted EWMA.
 */
export function updateWordProfile(
  existing: WordProfile,
  attempt: WordAttempt
): WordProfile {
  const newAttempts = existing.attempts + 1

  // Adaptive alpha: newer words adapt faster, high-confidence words are more stable
  const alpha = Math.max(0.15, Math.min(0.45, 0.4 - 0.25 * existing.confidence))

  const newRecentWpm = Math.round(alpha * attempt.wpm + (1 - alpha) * existing.recentWpm)
  const newRecentAccuracy = Math.round(
    alpha * attempt.accuracy + (1 - alpha) * existing.recentAccuracy
  )

  // Cumulative all-time arithmetic means
  const newAvgWpm = Math.round(
    (existing.avgWpm * existing.attempts + attempt.wpm) / newAttempts
  )
  const newAvgLatency = Math.round(
    (existing.avgLatencyMs * existing.attempts + attempt.avgLatencyMs) / newAttempts
  )
  const newAccuracy = Math.round(
    (existing.accuracy * existing.attempts + attempt.accuracy) / newAttempts
  )

  // Speed variance for consistency
  const varianceRatio = Math.abs(attempt.wpm - newRecentWpm) / Math.max(15, newRecentWpm)
  const sampleConsistency = Math.max(0, Math.min(100, Math.round(100 * (1 - varianceRatio))))
  const newConsistency = Math.round(0.3 * sampleConsistency + 0.7 * existing.consistency)

  // Trend calculation: positive means improving relative to previous observations
  const speedDelta = (attempt.wpm - existing.avgWpm) / Math.max(20, existing.avgWpm)
  const accDelta = (attempt.accuracy - existing.accuracy) / 100
  const rawTrend = speedDelta * 0.7 + accDelta * 0.3
  const newTrend = Math.max(-1, Math.min(1, Math.round(rawTrend * 100) / 100))

  const newConfidence = calculateWordConfidence(newAttempts, newRecentAccuracy)

  return {
    word: existing.word,
    attempts: newAttempts,
    avgWpm: newAvgWpm,
    avgLatencyMs: newAvgLatency,
    accuracy: newAccuracy,
    recentWpm: newRecentWpm,
    recentAccuracy: newRecentAccuracy,
    consistency: newConsistency,
    confidence: newConfidence,
    trend: newTrend,
    lastSeenAt: attempt.completedAt || Date.now(),
  }
}
