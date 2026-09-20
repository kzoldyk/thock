import { describe, it, expect, beforeEach } from "vitest"
import {
  KEYBR_PROGRESSION,
  INITIAL_UNLOCKED_COUNT,
  TARGET_CLEAN_STREAK,
  getLearnProgression,
  saveLearnProgression,
  resetLearnProgression,
  evaluateLearnSession,
  generateLearnWords,
  type LearnState,
} from "@/lib/learn-progression"
import type { Keystroke, TypingStats } from "@/types"

describe("Keybr-Style Learn Progression Engine", () => {
  beforeEach(() => {
    // Reset simulated browser localStorage
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  })

  it("defines the 26-letter Keybr frequency progression starting with 6 keys", () => {
    expect(KEYBR_PROGRESSION.length).toBe(26)
    expect(INITIAL_UNLOCKED_COUNT).toBe(6)
    expect(KEYBR_PROGRESSION.slice(0, 6)).toEqual(["e", "n", "i", "t", "r", "l"])
  })

  it("initializes with default 6 unlocked keys and target 'l'", () => {
    const state = getLearnProgression()
    expect(state.unlockedCount).toBe(6)
    expect(state.targetLetter).toBe("l")
    expect(state.cleanStreak).toBe(0)
  })

  it("generates words containing ONLY characters from the unlocked alphabet", () => {
    const state: LearnState = {
      unlockedCount: 6,
      targetLetter: "l",
      cleanStreak: 0,
      totalCompletedLessons: 0,
      lastUpdated: Date.now(),
    }

    const words = generateLearnWords(30, state)
    expect(words.length).toBe(30)

    const allowed = new Set(["e", "n", "i", "t", "r", "l"])
    for (const word of words) {
      for (const ch of word.toLowerCase()) {
        expect(allowed.has(ch)).toBe(true)
      }
    }
  })

  it("frequently biases generated words with the current target letter", () => {
    const state: LearnState = {
      unlockedCount: 6,
      targetLetter: "l",
      cleanStreak: 0,
      totalCompletedLessons: 0,
      lastUpdated: Date.now(),
    }

    const words = generateLearnWords(50, state)
    const containingTarget = words.filter((w) => w.toLowerCase().includes("l"))
    // At least 40% of words should feature the target letter
    expect(containingTarget.length).toBeGreaterThanOrEqual(20)
  })

  it("accumulates clean streak when session criteria are met", () => {
    const state: LearnState = {
      unlockedCount: 6,
      targetLetter: "l",
      cleanStreak: 0,
      totalCompletedLessons: 0,
      lastUpdated: Date.now(),
    }

    const stats: TypingStats = {
      wpm: 30,
      averageWpm: 30,
      liveWpm: 30,
      raw: 32,
      accuracy: 96,
      consistency: 90,
      mistakes: 1,
      wordMistakes: 1,
      streak: 10,
      elapsedMs: 15000,
      totalTyped: 50,
      correctChars: 48,
    }

    const keystrokes: Keystroke[] = [
      { key: "l", code: "KeyL", timestamp: 100, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 200, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 300, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 400, isCorrect: true, target: "l" },
    ]

    const result = evaluateLearnSession(stats, ["line", "letter"], keystrokes, state)
    expect(result.unlocked).toBe(false)
    expect(result.targetMet).toBe(true)
    expect(result.cleanStreak).toBe(1)
  })

  it("unlocks the next letter when reaching the target clean streak", () => {
    const state: LearnState = {
      unlockedCount: 6, // 'e', 'n', 'i', 't', 'r', 'l'
      targetLetter: "l",
      cleanStreak: TARGET_CLEAN_STREAK - 1, // 2 reps done, 3rd rep should unlock
      totalCompletedLessons: 2,
      lastUpdated: Date.now(),
    }

    const stats: TypingStats = {
      wpm: 28,
      averageWpm: 28,
      liveWpm: 28,
      raw: 30,
      accuracy: 95,
      consistency: 85,
      mistakes: 1,
      wordMistakes: 1,
      streak: 15,
      elapsedMs: 12000,
      totalTyped: 40,
      correctChars: 38,
    }

    const keystrokes: Keystroke[] = [
      { key: "l", code: "KeyL", timestamp: 100, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 200, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 300, isCorrect: true, target: "l" },
      { key: "l", code: "KeyL", timestamp: 400, isCorrect: true, target: "l" },
    ]

    const result = evaluateLearnSession(stats, ["tell", "rent"], keystrokes, state)
    expect(result.unlocked).toBe(true)
    expect(result.newlyUnlockedLetter).toBe("s") // 7th letter in KEYBR_PROGRESSION is 's'
    expect(result.state.unlockedCount).toBe(7)
    expect(result.state.targetLetter).toBe("s")
    expect(result.state.cleanStreak).toBe(0)
  })

  it("resets progression back to initial 6 keys", () => {
    const advanced: LearnState = {
      unlockedCount: 15,
      targetLetter: "p",
      cleanStreak: 2,
      totalCompletedLessons: 20,
      lastUpdated: Date.now(),
    }
    saveLearnProgression(advanced)
    expect(getLearnProgression().unlockedCount).toBe(15)

    const reset = resetLearnProgression()
    expect(reset.unlockedCount).toBe(6)
    expect(reset.targetLetter).toBe("l")
    expect(reset.cleanStreak).toBe(0)
  })
})
