import { describe, expect, it } from "vitest"
import { calculateAverageWpm, calculateRawWpm, calculateRollingWpm } from "@/engines/metrics/wpm"
import { calculateAverageRawWpm } from "@/engines/metrics/rawWpm"
import { calculateAccuracy } from "@/engines/metrics/accuracy"
import { calculateConsistency, calculateConsistencyFromHistory } from "@/engines/metrics/consistency"
import { createStatsHistory } from "@/engines/metrics/history"

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
})
