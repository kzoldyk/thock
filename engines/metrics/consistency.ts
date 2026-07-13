import type { StatsSample } from "./history"

export function calculateConsistency(samples: number[]): number {
  if (samples.length < 2) return 100
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean === 0) return 100
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  const stdDev = Math.sqrt(variance)
  const cv = stdDev / mean
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))
}

export function calculateConsistencyFromHistory(history: StatsSample[], sampleCount = 12): number {
  const samples = history.slice(-sampleCount).map((sample) => sample.liveWpm)
  return calculateConsistency(samples)
}
