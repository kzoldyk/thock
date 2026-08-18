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
    it("generates 100% comfortable words for the first 10 typings without tricky letters", () => {
      // Test across multiple runs
      for (let session = 0; session < 10; session++) {
        const words = generateAdaptiveWords(25, {
          testCount: session,
          seed: 1000 + session,
        })

        expect(words.length).toBe(25)

        const trickySet = new Set(DEFAULT_TRICKY_LETTERS)
        for (const word of words) {
          for (const char of word.toLowerCase().split("")) {
            expect(trickySet.has(char)).toBe(false)
          }
        }
      }
    })

    it("introduces exactly ONE targeted uncomfortable letter after 10 typings", () => {
      const words = generateAdaptiveWords(25, {
        testCount: 10,
        seed: 42,
      })

      expect(words.length).toBe(25)

      // DEFAULT_TRICKY_LETTERS[0] is k
      const targetLetter = "k"
      const otherTrickyLetters = new Set(["v", "j", "x", "z", "q"])

      // None of the other tricky letters should appear
      for (const word of words) {
        for (const char of word.toLowerCase().split("")) {
          expect(otherTrickyLetters.has(char)).toBe(false)
        }
      }

      // The target letter k should appear in the generated test
      const hasTargetLetter = words.some((w) => w.toLowerCase().includes(targetLetter))
      expect(hasTargetLetter).toBe(true)

      // Target drill words count should be gentle (1-2 words out of 25)
      const targetWordsCount = words.filter((w) => w.toLowerCase().includes(targetLetter)).length
      expect(targetWordsCount).toBeGreaterThanOrEqual(1)
      expect(targetWordsCount).toBeLessThanOrEqual(3)
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

    it("has abundant drill word combinations for every tricky letter (q, z, x, j, v, k)", () => {
      const trickyLetters = ["k", "v", "j", "x", "z", "q"]

      for (const letter of trickyLetters) {
        // Create a profile where `letter` is the isolated target weakness
        const map: Record<string, LetterStat> = {}
        for (const ch of "abcdefghijklmnopqrstuvwxyz".split("")) {
          map[ch] = createDefaultLetterStat(ch)
        }
        map[letter] = {
          char: letter,
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
        const targetWords = words.filter((w) => w.toLowerCase().includes(letter))
        expect(targetWords.length).toBeGreaterThanOrEqual(1)
      }
    })
  })
})
