import { describe, it, expect } from "vitest"
import {
  generateAdaptiveWords,
  wordToBitmask,
  charsToBitmask,
} from "@/lib/words"
import {
  getLetterMasteryStatus,
  buildGripProfile,
  createDefaultLetterStat,
  DEFAULT_TRICKY_LETTERS,
  type LetterStat,
} from "@/lib/letter-grip"

describe("Letter Mastery & Adaptive Word Generation", () => {
  describe("Bitmask Evaluation", () => {
    it("correctly converts characters to bitmasks", () => {
      const mask = charsToBitmask(["a", "b", "c"])
      expect(mask).toBe((1 << 0) | (1 << 1) | (1 << 2))
    })

    it("correctly evaluates word subsets", () => {
      const allowed = ["t", "h", "e", "a", "t"]
      const allowedMask = charsToBitmask(allowed)

      const word1Mask = wordToBitmask("that")
      const word2Mask = wordToBitmask("zoo")

      expect((word1Mask & ~allowedMask) === 0).toBe(true)
      expect((word2Mask & ~allowedMask) === 0).toBe(false)
    })
  })

  describe("getLetterMasteryStatus", () => {
    it("provides 100% comfortable mode for the first 10 typings (cold start)", () => {
      const status = getLetterMasteryStatus(null, 0)
      expect(status.isInitialComfortPhase).toBe(true)
      expect(status.targetLetter).toBeNull()
      expect(status.comfortableLetters.length).toBeGreaterThanOrEqual(20)
    })

    it("keeps targetLetter as null when testCount is 5 (< 10)", () => {
      const status = getLetterMasteryStatus(null, 5)
      expect(status.isInitialComfortPhase).toBe(true)
      expect(status.targetLetter).toBeNull()
    })

    it("activates single target letter when testCount is 10 (>= 10)", () => {
      const status = getLetterMasteryStatus(null, 10)
      expect(status.isInitialComfortPhase).toBe(false)
      expect(status.targetLetter).toBe(DEFAULT_TRICKY_LETTERS[0]) // k
    })

    it("prioritizes weak letters with errors as the target letter after 10 typings", () => {
      const map: Record<string, LetterStat> = {}
      for (const ch of "abcdefghijklmnopqrstuvwxyz".split("")) {
        map[ch] = createDefaultLetterStat(ch)
      }
      // Simulate user struggling with p (60% accuracy, 4 errors)
      map["p"] = {
        char: "p",
        totalTyped: 10,
        correctCount: 6,
        errorCount: 4,
        totalLatencyMs: 2500,
        avgLatencyMs: 250,
        accuracy: 60,
        gripScore: 55,
        updatedAt: Date.now(),
      }

      const profile = buildGripProfile(map)
      const status = getLetterMasteryStatus(profile, 12)

      expect(status.isInitialComfortPhase).toBe(false)
      expect(status.targetLetter).toBe("p")
    })

    it("graduates mastered letter and advances to the next uncomfortable letter", () => {
      const map: Record<string, LetterStat> = {}
      for (const ch of "abcdefghijklmnopqrstuvwxyz".split("")) {
        map[ch] = createDefaultLetterStat(ch)
      }

      // Master k (95% accuracy, 0 errors, 90 grip score)
      map["k"] = {
        char: "k",
        totalTyped: 20,
        correctCount: 19,
        errorCount: 0,
        totalLatencyMs: 3600,
        avgLatencyMs: 180,
        accuracy: 95,
        gripScore: 90,
        updatedAt: Date.now(),
      }

      const profile = buildGripProfile(map)
      const status = getLetterMasteryStatus(profile, 15)

      expect(status.comfortableLetters).toContain("k")
      expect(status.targetLetter).toBe("v") // next tricky letter after k
    })
  })

  describe("generateAdaptiveWords", () => {
    it("generates exact requested word count", () => {
      const words = generateAdaptiveWords(25, { testCount: 0, seed: 1000 })
      expect(words.length).toBe(25)
    })

    it("produces deterministic output when seed is provided", () => {
      const run1 = generateAdaptiveWords(30, { testCount: 5, seed: 12345 })
      const run2 = generateAdaptiveWords(30, { testCount: 5, seed: 12345 })
      expect(run1).toEqual(run2)
    })

    it("supports complex mode with symbols and uppercase formatting", () => {
      const words = generateAdaptiveWords(20, { testCount: 0, seed: 999, complex: true })
      expect(words.length).toBe(20)
      const hasCapsOrSymbols = words.some((w) => /[A-Z!@#$%^&*()_+\-=\[\]{};':",./<>\?]/.test(w))
      expect(hasCapsOrSymbols).toBe(true)
    })

    it("drills weak letters smoothly when letter weaknesses exist in profile", () => {
      const map: Record<string, LetterStat> = {}
      for (const ch of "abcdefghijklmnopqrstuvwxyz".split("")) {
        map[ch] = createDefaultLetterStat(ch)
      }
      map["k"] = {
        char: "k",
        totalTyped: 10,
        correctCount: 4,
        errorCount: 6,
        totalLatencyMs: 3000,
        avgLatencyMs: 300,
        accuracy: 40,
        gripScore: 35,
        updatedAt: Date.now(),
      }

      const profile = buildGripProfile(map)
      const words = generateAdaptiveWords(30, {
        gripProfile: profile,
        testCount: 15,
        seed: 777,
      })

      expect(words.length).toBe(30)
      const targetWords = words.filter((w) => w.toLowerCase().includes("k"))
      expect(targetWords.length).toBeGreaterThanOrEqual(1)
    })

    it("generates words starting with a diverse mix of letters", () => {
      const words = generateAdaptiveWords(25, { testCount: 0, seed: 42 })
      const firstLetters = new Set(words.map((w) => w[0].toLowerCase()))
      // In 25 words, we should have words starting with at least 10 different letters
      expect(firstLetters.size).toBeGreaterThanOrEqual(10)
    })

    it("prevents rapid immediate repetition while allowing spaced reinforcement", () => {
      const words = generateAdaptiveWords(30, { testCount: 0, seed: 100 })
      expect(words.length).toBe(30)
      // Check that no consecutive duplicate words exist
      for (let i = 1; i < words.length; i++) {
        expect(words[i]).not.toBe(words[i - 1])
      }
    })
  })
})
