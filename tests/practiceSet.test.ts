import { describe, it, expect } from "vitest"
import { buildSequencePattern, generateAdaptiveSequence } from "@/lib/adaptive/sequence-generator"
import {
  buildPracticeSet,
  updatePracticeSetOnSession,
  PRACTICE_SET_TARGET,
} from "@/lib/adaptive/practice-set"
import type { UserTypingProfile, UserTypingState, WordAttempt, WordProfile } from "@/lib/adaptive/types"

function makeWordProfile(overrides: Partial<WordProfile>): WordProfile {
  return {
    word: overrides.word || "test",
    attempts: 10,
    avgWpm: 70,
    avgLatencyMs: 85,
    accuracy: 98,
    recentWpm: 70,
    recentAccuracy: 98,
    consistency: 90,
    confidence: 0.7,
    trend: 0,
    lastSeenAt: Date.now(),
    ...overrides,
  }
}

function makeProfile(wordOverrides: Record<string, Partial<WordProfile>>, testCount = 10): UserTypingProfile {
  const words: UserTypingProfile["words"] = {}
  for (const [word, o] of Object.entries(wordOverrides)) {
    words[word] = makeWordProfile({ ...o, word })
  }
  return {
    letters: {},
    words,
    ngrams: {},
    weaknesses: [],
    testCount,
    lastUpdatedAt: Date.now(),
  }
}

function makeAttempt(word: string, wpm: number, accuracy: number): WordAttempt {
  return {
    word,
    startedAt: 0,
    completedAt: 1000,
    durationMs: 1000,
    expectedCharacters: word.length,
    typedCharacters: word.length,
    errors: Math.round(((100 - accuracy) / 100) * word.length),
    correctedErrors: 0,
    accuracy,
    wpm,
    avgLatencyMs: 90,
  }
}

const STABLE_STATE: UserTypingState = {
  baselineWpm: 60, recentWpm: 60, baselineAccuracy: 95, recentAccuracy: 95,
  wpmTrend: 0, accuracyTrend: 0, consistency: 80, difficultyLevel: 0.45,
  confidence: 0.8, momentumScore: 0.6, state: "stable",
}

describe("Phase 2 — difficulty curve retuning", () => {
  it("calibrating users get near-zero challenge slots", () => {
    const pattern = buildSequencePattern(100, "calibrating", 42)
    const hard = pattern.filter((b) => b === "hard").length
    const medium = pattern.filter((b) => b === "medium").length
    expect(hard).toBe(0)
    expect(medium).toBeLessThanOrEqual(4)
  })

  it("stable users get a gentle mix dominated by easy words", () => {
    const pattern = buildSequencePattern(150, "stable", 42)
    const easy = pattern.filter((b) => b === "easy").length
    const medium = pattern.filter((b) => b === "medium").length
    const hard = pattern.filter((b) => b === "hard").length
    expect(easy / 150).toBeGreaterThan(0.8)
    expect(medium).toBeLessThanOrEqual(20)
    expect(hard).toBeLessThanOrEqual(6)
  })

  it("sandwich curve: every state starts AND ends on easy words", () => {
    for (const state of ["calibrating", "struggling", "stable", "flow", "mastering"] as const) {
      const pattern = buildSequencePattern(60, state, 7)
      expect(pattern[0]).toBe("easy")
      expect(pattern[pattern.length - 1]).toBe("easy")
      // First 6 slots easy even for advanced states
      if (state !== "calibrating" && state !== "struggling") {
        expect(pattern.slice(0, 6).every((b) => b === "easy")).toBe(true)
      }
      // Final 10% cool-down is fully easy
      const cooldownStart = Math.max(6, Math.floor(60 * 0.9))
      expect(pattern.slice(cooldownStart).every((b) => b === "easy")).toBe(true)
    }
  })
})

describe("Phase 3 — practice vocabulary loop", () => {
  it("bootstraps an empty set once enough telemetry exists", () => {
    const freshProfile = makeProfile({ the: {} }, 5)
    const built = buildPracticeSet(freshProfile)
    expect(built.length).toBe(PRACTICE_SET_TARGET)

    // Below calibration threshold: no bootstrap
    const result = updatePracticeSetOnSession([], [], makeProfile({}, 1))
    expect(result.practiceSet).toEqual([])
  })

  it("graduates mastered words and increments nothing silently", () => {
    // Baseline median driven by filler words at 60 wpm
    const fillerWords: Record<string, Partial<WordProfile>> = {
      a: { recentWpm: 60, recentAccuracy: 97, confidence: 0.7, attempts: 10 },
      b: { recentWpm: 60, recentAccuracy: 97, confidence: 0.7, attempts: 10 },
      c: { recentWpm: 60, recentAccuracy: 97, confidence: 0.7, attempts: 10 },
    }
    const profile = makeProfile({
      ...fillerWords,
      quick: { word: "quick", recentWpm: 75, recentAccuracy: 99, confidence: 0.8, attempts: 12 },
    })

    const currentSet = ["quick", "slow", "rest"]
    const attempts = [makeAttempt("quick", 78, 100)]

    const { practiceSet, newlyMastered } = updatePracticeSetOnSession(currentSet, attempts, profile, () => 0.5)
    expect(newlyMastered).toContain("quick")
    expect(practiceSet.includes("quick")).toBe(false)
    // Untouched members survive
    expect(practiceSet.includes("slow")).toBe(true)
    expect(practiceSet.includes("rest")).toBe(true)
    // Refilled back toward target size
    expect(practiceSet.length).toBeGreaterThanOrEqual(currentSet.length)
  })

  it("drops rehab words that keep failing", () => {
    const filler = { a: { recentWpm: 60 }, b: { recentWpm: 62 }, c: { recentWpm: 58 } }
    const profile = makeProfile({
      ...filler,
      awkward: { word: "awkward", recentWpm: 45, recentAccuracy: 82, confidence: 0.9, attempts: 9 },
    })

    const currentSet = ["awkward", "calm"]
    const attempts = [makeAttempt("awkward", 44, 78)]

    const { practiceSet, newlyMastered } = updatePracticeSetOnSession(currentSet, attempts, profile, () => 0.5)
    expect(newlyMastered).toEqual([])
    expect(practiceSet.includes("awkward")).toBe(false)
    expect(practiceSet.includes("calm")).toBe(true)
  })

  it("generator draws heavily from the practice set during sessions", () => {
    const practiceSet = ["the", "and", "for", "you", "can", "had"]
    let practiceHits = 0
    let total = 0
    for (let seed = 1; seed <= 5; seed++) {
      const seq = generateAdaptiveSequence(40, {
        count: 40,
        testCount: 20,
        seed,
        userState: STABLE_STATE,
        userProfile: null,
        practiceSet,
      })
      total += seq.length
      practiceHits += seq.filter((w) => practiceSet.includes(w)).length
    }
    // Expected coverage ≈ 43%; stay safely above natural-pool noise
    expect(practiceHits / total).toBeGreaterThan(0.25)
  })
})
