import type { StatsSample } from "./history"

export function calculateAverageWpm(correctCharacters: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return (correctCharacters / 5) / (elapsedMs / 60000)
}

export function calculateRawWpm(totalCharacters: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return (totalCharacters / 5) / (elapsedMs / 60000)
}

export function calculateRollingWpm(samples: StatsSample[], windowMs = 2000): number {
  if (samples.length === 0) return 0
  const latest = samples[samples.length - 1]!
  const windowStart = latest.timestamp - windowMs
  const windowSamples = samples.filter((sample) => sample.timestamp >= windowStart)
  if (windowSamples.length < 2) return latest.liveWpm

  const first = windowSamples[0]!
  const last = windowSamples[windowSamples.length - 1]!
  const elapsedMs = last.timestamp - first.timestamp
  if (elapsedMs <= 0) return last.liveWpm

  const correctDelta = Math.max(0, last.correctChars - first.correctChars)
  return calculateAverageWpm(correctDelta, elapsedMs)
}

export function smoothMetric(previous: number | null, current: number, alpha = 0.25): number {
  if (previous === null || Number.isNaN(previous)) return current
  return previous + (current - previous) * alpha
}
