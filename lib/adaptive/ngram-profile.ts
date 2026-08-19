import type { NGramProfile } from "./types"
import type { Keystroke } from "@/types"

export interface NGramSample {
  ngram: string
  n: number
  latencyMs: number
  isCorrect: boolean
  timestamp: number
}

/**
 * Extracts unigrams, bigrams, and trigrams from a string.
 */
export function extractNGrams(text: string): { unigrams: string[]; bigrams: string[]; trigrams: string[] } {
  const clean = text.toLowerCase().replace(/[^a-z]/g, "")
  const unigrams: string[] = []
  const bigrams: string[] = []
  const trigrams: string[] = []

  for (let i = 0; i < clean.length; i++) {
    unigrams.push(clean[i])
    if (i + 1 < clean.length) {
      bigrams.push(clean.slice(i, i + 2))
    }
    if (i + 2 < clean.length) {
      trigrams.push(clean.slice(i, i + 3))
    }
  }

  return { unigrams, bigrams, trigrams }
}

/**
 * Extracts N-gram performance samples (latencies, errors) from a sequence of keystrokes for a typed word.
 */
export function extractNGramSamplesFromKeystrokes(
  word: string,
  keystrokes: Keystroke[]
): NGramSample[] {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "")
  if (cleanWord.length === 0 || keystrokes.length === 0) return []

  // Match target characters to keystrokes
  const charKeystrokes = keystrokes.filter(
    (k) => k.target && /^[a-z]$/i.test(k.target) && k.code !== "Backspace"
  )

  const samples: NGramSample[] = []

  // Extract Unigrams
  for (let i = 0; i < charKeystrokes.length; i++) {
    const k = charKeystrokes[i]
    const ch = k.target!.toLowerCase()
    let latency = 180
    if (i > 0) {
      const diff = k.timestamp - charKeystrokes[i - 1].timestamp
      if (diff > 20 && diff < 1500) latency = diff
    }
    samples.push({
      ngram: ch,
      n: 1,
      latencyMs: latency,
      isCorrect: Boolean(k.isCorrect),
      timestamp: k.timestamp,
    })
  }

  // Extract Bigrams
  for (let i = 0; i < charKeystrokes.length - 1; i++) {
    const k1 = charKeystrokes[i]
    const k2 = charKeystrokes[i + 1]
    const bg = (k1.target! + k2.target!).toLowerCase()
    let latency = 180
    const diff = k2.timestamp - k1.timestamp
    if (diff > 20 && diff < 1500) latency = diff

    const isCorrect = Boolean(k1.isCorrect && k2.isCorrect)
    samples.push({
      ngram: bg,
      n: 2,
      latencyMs: latency,
      isCorrect,
      timestamp: k2.timestamp,
    })
  }

  // Extract Trigrams
  for (let i = 0; i < charKeystrokes.length - 2; i++) {
    const k1 = charKeystrokes[i]
    const k3 = charKeystrokes[i + 2]
    const tg = (k1.target! + charKeystrokes[i + 1].target! + k3.target!).toLowerCase()
    let latency = 360
    const diff = k3.timestamp - k1.timestamp
    if (diff > 40 && diff < 3000) latency = diff

    const isCorrect = Boolean(k1.isCorrect && charKeystrokes[i + 1].isCorrect && k3.isCorrect)
    samples.push({
      ngram: tg,
      n: 3,
      latencyMs: latency,
      isCorrect,
      timestamp: k3.timestamp,
    })
  }

  return samples
}

/**
 * Calculates confidence for an N-gram profile [0, 1].
 */
export function calculateNGramConfidence(attempts: number, accuracy: number): number {
  if (attempts <= 0) return 0
  const baseConfidence = 1 - Math.exp(-attempts / 12)
  const accuracyFactor = Math.max(0.5, Math.min(1.0, accuracy / 100))
  return Math.max(0, Math.min(1, baseConfidence * accuracyFactor))
}

/**
 * Creates a new NGramProfile from an initial sample.
 */
export function createNGramProfile(sample: NGramSample): NGramProfile {
  const accuracy = sample.isCorrect ? 100 : 0
  const confidence = calculateNGramConfidence(1, accuracy)
  return {
    ngram: sample.ngram,
    n: sample.n,
    attempts: 1,
    avgLatencyMs: Math.round(sample.latencyMs),
    recentLatencyMs: Math.round(sample.latencyMs),
    accuracy,
    recentAccuracy: accuracy,
    errorCount: sample.isCorrect ? 0 : 1,
    confidence,
    trend: 0,
    lastSeenAt: sample.timestamp || Date.now(),
  }
}

/**
 * Updates an NGramProfile with a new sample using EWMA.
 */
export function updateNGramProfile(
  existing: NGramProfile,
  sample: NGramSample
): NGramProfile {
  const newAttempts = existing.attempts + 1
  const isCorrect = sample.isCorrect
  const sampleAcc = isCorrect ? 100 : 0
  const newErrorCount = existing.errorCount + (isCorrect ? 0 : 1)

  const alpha = Math.max(0.15, Math.min(0.4, 0.35 - 0.2 * existing.confidence))

  const newRecentLatency = Math.round(
    alpha * sample.latencyMs + (1 - alpha) * existing.recentLatencyMs
  )
  const newRecentAccuracy = Math.round(
    alpha * sampleAcc + (1 - alpha) * existing.recentAccuracy
  )

  const newAvgLatency = Math.round(
    (existing.avgLatencyMs * existing.attempts + sample.latencyMs) / newAttempts
  )
  const newAccuracy = Math.round(
    (existing.accuracy * existing.attempts + sampleAcc) / newAttempts
  )

  // Trend: positive means faster (lower latency) and higher accuracy
  const speedDelta = (existing.avgLatencyMs - newRecentLatency) / Math.max(50, existing.avgLatencyMs)
  const accDelta = (newRecentAccuracy - newAccuracy) / 100
  const rawTrend = speedDelta * 0.6 + accDelta * 0.4
  const newTrend = Math.max(-1, Math.min(1, Math.round(rawTrend * 100) / 100))

  const newConfidence = calculateNGramConfidence(newAttempts, newRecentAccuracy)

  return {
    ngram: existing.ngram,
    n: existing.n,
    attempts: newAttempts,
    avgLatencyMs: newAvgLatency,
    recentLatencyMs: newRecentLatency,
    accuracy: newAccuracy,
    recentAccuracy: newRecentAccuracy,
    errorCount: newErrorCount,
    confidence: newConfidence,
    trend: newTrend,
    lastSeenAt: sample.timestamp || Date.now(),
  }
}
