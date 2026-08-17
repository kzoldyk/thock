import { describe, expect, it } from "vitest"
import {
  calculateDailyStreak,
  countTestsToday,
  calculateSpeedBuckets,
  calculateModeBreakdowns,
  computeUserStatsSummary,
  generateDiagnosticInsights,
  mergeTestRecords,
  formatPracticeTime,
  exportHistoryAsCsv,
  exportHistoryAsJson,
} from "@/lib/user-stats"
import type { TestRecord } from "@/types"

describe("user stats calculation engine", () => {
  const createMockRecord = (overrides: Partial<TestRecord> = {}): TestRecord => ({
    id: `test_${Math.random()}`,
    wpm: 85,
    rawWpm: 90,
    accuracy: 98,
    consistency: 85,
    mistakes: 2,
    streak: 45,
    elapsedMs: 30000,
    totalTyped: 225,
    correctChars: 220,
    timeLimit: 30,
    mode: "time",
    createdAt: Date.now(),
    ...overrides,
  })

  it("calculates accurate summary metrics across multiple tests", () => {
    const records: TestRecord[] = [
      createMockRecord({ wpm: 80, rawWpm: 85, accuracy: 96, consistency: 80 }),
      createMockRecord({ wpm: 100, rawWpm: 105, accuracy: 98, consistency: 90 }),
      createMockRecord({ wpm: 90, rawWpm: 95, accuracy: 100, consistency: 85 }),
    ]

    const summary = computeUserStatsSummary(records, "all", "all")

    expect(summary.totalTests).toBe(3)
    expect(summary.avgWpm).toBe(90)
    expect(summary.bestWpm).toBe(100)
    expect(summary.avgRawWpm).toBe(95)
    expect(summary.bestRawWpm).toBe(105)
    expect(summary.avgAccuracy).toBe(98)
    expect(summary.bestAccuracy).toBe(100)
    expect(summary.avgConsistency).toBe(85)
  })

  it("calculates daily practice streak correctly", () => {
    const now = Date.now()
    const oneDay = 86400000

    const consecutiveDays: TestRecord[] = [
      createMockRecord({ createdAt: now }),
      createMockRecord({ createdAt: now - oneDay }),
      createMockRecord({ createdAt: now - 2 * oneDay }),
    ]

    expect(calculateDailyStreak(consecutiveDays)).toBe(3)

    const brokenStreak: TestRecord[] = [
      createMockRecord({ createdAt: now - 4 * oneDay }),
      createMockRecord({ createdAt: now - 5 * oneDay }),
    ]

    expect(calculateDailyStreak(brokenStreak)).toBe(0)
  })

  it("counts tests completed today", () => {
    const today = Date.now()
    const yesterday = today - 86400000

    const records: TestRecord[] = [
      createMockRecord({ createdAt: today }),
      createMockRecord({ createdAt: today - 1000 }),
      createMockRecord({ createdAt: yesterday }),
    ]

    expect(countTestsToday(records)).toBe(2)
  })

  it("distributes scores into speed histogram buckets correctly", () => {
    const records: TestRecord[] = [
      createMockRecord({ wpm: 35 }), // <40
      createMockRecord({ wpm: 55 }), // 40-59
      createMockRecord({ wpm: 75 }), // 60-79
      createMockRecord({ wpm: 85 }), // 80-99
      createMockRecord({ wpm: 110 }), // 100-119
      createMockRecord({ wpm: 125 }), // 120-139
      createMockRecord({ wpm: 155 }), // 140+
    ]

    const buckets = calculateSpeedBuckets(records)
    expect(buckets.find((b) => b.label === "<40")?.count).toBe(1)
    expect(buckets.find((b) => b.label === "80-99")?.count).toBe(1)
    expect(buckets.find((b) => b.label === "140+")?.count).toBe(1)
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(7)
  })

  it("computes mode breakdowns for time durations and content modes", () => {
    const records: TestRecord[] = [
      createMockRecord({ mode: "time", timeLimit: 15, wpm: 110 }),
      createMockRecord({ mode: "time", timeLimit: 15, wpm: 120 }),
      createMockRecord({ mode: "time", timeLimit: 30, wpm: 95 }),
      createMockRecord({ mode: "words", wpm: 88 }),
      createMockRecord({ mode: "quotes", wpm: 78 }),
      createMockRecord({ mode: "code", wpm: 65 }),
    ]

    const breakdowns = calculateModeBreakdowns(records)
    const time15 = breakdowns.find((b) => b.mode === "time-15")
    const time30 = breakdowns.find((b) => b.mode === "time-30")
    const code = breakdowns.find((b) => b.mode === "code")

    expect(time15?.testsCount).toBe(2)
    expect(time15?.bestWpm).toBe(120)
    expect(time15?.avgWpm).toBe(115)

    expect(time30?.testsCount).toBe(1)
    expect(time30?.bestWpm).toBe(95)

    expect(code?.testsCount).toBe(1)
    expect(code?.bestWpm).toBe(65)
  })

  it("generates actionable diagnostic insights", () => {
    const highErrorRecords = [
      createMockRecord({ wpm: 70, rawWpm: 90, accuracy: 91 }),
      createMockRecord({ wpm: 72, rawWpm: 92, accuracy: 92 }),
      createMockRecord({ wpm: 68, rawWpm: 88, accuracy: 90 }),
    ]

    const insights = generateDiagnosticInsights(highErrorRecords, {
      avgWpm: 70,
      avgRawWpm: 90,
      avgAccuracy: 91,
      avgConsistency: 75,
    })

    expect(insights.some((i) => i.id === "error_penalty")).toBe(true)
  })

  it("formats practice time cleanly", () => {
    expect(formatPracticeTime(45)).toBe("45s")
    expect(formatPracticeTime(125)).toBe("2m")
    expect(formatPracticeTime(3750)).toBe("1h 2m")
  })

  it("merges remote and local records without duplicates", () => {
    const now = Date.now()
    const local = [createMockRecord({ id: "loc1", wpm: 80, createdAt: now })]
    const remote = [
      createMockRecord({ id: "rem1", wpm: 90, createdAt: now - 5000 }),
      createMockRecord({ id: "loc1", wpm: 80, createdAt: now }), // duplicate id
    ]

    const merged = mergeTestRecords(local, remote)
    expect(merged.length).toBe(2)
  })

  it("exports records to valid CSV and JSON strings", () => {
    const records = [createMockRecord({ id: "test_1", wpm: 100 })]
    const csv = exportHistoryAsCsv(records)
    const json = exportHistoryAsJson(records)

    expect(csv).toContain("NetWPM")
    expect(csv).toContain("100")
    expect(JSON.parse(json)).toHaveLength(1)
  })
})
