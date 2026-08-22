import { describe, expect, it } from "vitest"
import { calculateAverageWpm, calculateRawWpm, calculateRollingWpm } from "@/engines/metrics/wpm"
import { calculateAverageRawWpm } from "@/engines/metrics/rawWpm"
import { calculateAccuracy } from "@/engines/metrics/accuracy"
import { calculateConsistency, calculateConsistencyFromHistory } from "@/engines/metrics/consistency"
import { createStatsHistory } from "@/engines/metrics/history"
import { computeStats } from "@/engines/typingEngine"

describe("typing metrics", () => {
  it("calculates average WPM from correct characters and elapsed time", () => {
    expect(calculateAverageWpm(25, 60000)).toBe(5)
    expect(calculateAverageWpm(0, 60000)).toBe(0)
  })

  it("calculates raw WPM from total typed characters", () => {
    expect(calculateRawWpm(50, 30000)).toBe(20)
    expect(calculateAverageRawWpm(50, 30000)).toBe(20)
  })

  it("calculates accuracy without backspace noise", () => {
    expect(calculateAccuracy(90, 10)).toBe(90)
    expect(calculateAccuracy(0, 0)).toBe(100)
  })

  it("calculates consistency from speed stability", () => {
    expect(calculateConsistency([90, 91, 92, 90, 89])).toBeGreaterThanOrEqual(95)
    expect(calculateConsistency([40, 140, 60, 120, 70])).toBeLessThan(75)
  })

  it("calculates rolling WPM from recent history samples", () => {
    const history = createStatsHistory(8)
    history.push({ timestamp: 0, liveWpm: 90, rawWpm: 92, accuracy: 99, correctChars: 0, incorrectChars: 0 })
    history.push({ timestamp: 1000, liveWpm: 91, rawWpm: 93, accuracy: 99, correctChars: 7, incorrectChars: 0 })
    history.push({ timestamp: 2000, liveWpm: 92, rawWpm: 94, accuracy: 99, correctChars: 15, incorrectChars: 0 })

    expect(calculateRollingWpm(history.toArray(), 2000)).toBe(90)
    expect(calculateConsistencyFromHistory(history.toArray())).toBeGreaterThanOrEqual(98)
  })

  it("returns 0 instead of echoing a spiked first sample (4000-WPM bug)", () => {
    const history = createStatsHistory(8)
    // Session-start spike: tiny window extrapolated to an absurd value
    history.push({ timestamp: 100, liveWpm: 2400, rawWpm: 2400, accuracy: 99, correctChars: 2, incorrectChars: 0 })

    expect(calculateRollingWpm(history.toArray(), 2000)).toBe(0)

    // Two samples but only 150ms apart — too short to trust
    history.push({ timestamp: 250, liveWpm: 2400, rawWpm: 2400, accuracy: 99, correctChars: 3, incorrectChars: 0 })
    expect(calculateRollingWpm(history.toArray(), 2000)).toBe(0)
  })

  it("computeStats clamps impossible WPM values", () => {
    const stats = computeStats(
      [],
      ["test"],
      50, // 50ms — absurdly short window
      [
        { key: "t", code: "KeyT", isCorrect: true, timestamp: 1 },
        { key: "e", code: "KeyE", isCorrect: true, timestamp: 20 },
        { key: "s", code: "KeyS", isCorrect: true, timestamp: 40 },
      ],
      [],
      0,
      3,
    )
    expect(stats.wpm).toBeLessThanOrEqual(400)
    expect(stats.raw).toBeLessThanOrEqual(400)
    expect(Number.isFinite(stats.liveWpm)).toBe(true)
  })
})
