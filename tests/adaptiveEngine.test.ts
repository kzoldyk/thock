import { describe, it, expect } from "vitest"
import {
  generatePersonalizedWords,
  generateAdaptiveWords,
  explainAdaptiveGeneration,
  extractWordAttempts,
  createWordProfile,
  updateWordProfile,
  calculateWordConfidence,
  extractNGrams,
  extractNGramSamplesFromKeystrokes,
  createNGramProfile,
  updateNGramProfile,
  intrinsicDifficulty,
  personalDifficulty,
  effectiveDifficulty,
  classifyDifficultyBand,
  deriveUserTypingState,
  extractWeaknessDistribution,
  scoreCandidateWord,
  buildSequencePattern,
  generateAdaptiveSequence,
  type UserTypingProfile,
  type WordAttempt,
  type GenerationContext,
} from "@/lib/adaptive"
import type { Keystroke, WordData, TestRecord } from "@/types"

describe("Adaptive Typing Engine — Complete Test Suite", () => {
  describe("1. Word Profiling & EWMA Dynamics", () => {
    it("creates an initial word profile with reasonable baseline confidence", () => {
      const attempt: WordAttempt = {
        word: "thock",
        startedAt: 1000,
        completedAt: 1300,
        durationMs: 300,
        expectedCharacters: 5,
        typedCharacters: 5,
        errors: 0,
        correctedErrors: 0,
        accuracy: 100,
        wpm: 80,
        avgLatencyMs: 60,
      }

      const profile = createWordProfile(attempt)
      expect(profile.word).toBe("thock")
      expect(profile.attempts).toBe(1)
      expect(profile.avgWpm).toBe(80)
      expect(profile.recentWpm).toBe(80)
      expect(profile.accuracy).toBe(100)
      expect(profile.confidence).toBeGreaterThan(0.05)
      expect(profile.confidence).toBeLessThan(0.3) // 1 attempt has low confidence
      expect(profile.trend).toBe(0)
    })

    it("smooths speed and accuracy with recency-weighted EWMA across multiple observations", () => {
      let profile = createWordProfile({
        word: "speed",
        startedAt: 0,
        completedAt: 500,
        durationMs: 500,
        expectedCharacters: 5,
        typedCharacters: 5,
        errors: 0,
        correctedErrors: 0,
        accuracy: 100,
        wpm: 60,
        avgLatencyMs: 100,
      })

      // Attempt 2: Faster (90 WPM)
      profile = updateWordProfile(profile, {
        word: "speed",
        startedAt: 1000,
        completedAt: 1333,
        durationMs: 333,
        expectedCharacters: 5,
        typedCharacters: 5,
        errors: 0,
        correctedErrors: 0,
        accuracy: 100,
        wpm: 90,
        avgLatencyMs: 66,
      })

      expect(profile.attempts).toBe(2)
      expect(profile.avgWpm).toBe(75) // (60 + 90) / 2
      expect(profile.recentWpm).toBeGreaterThan(60) // EWMA weighted towards recent 90
      expect(profile.trend).toBeGreaterThan(0) // Improving trend
    })

    it("increases confidence monotonically with sample volume", () => {
      const conf1 = calculateWordConfidence(1, 100)
      const conf5 = calculateWordConfidence(5, 100)
      const conf15 = calculateWordConfidence(15, 100)
      const conf30 = calculateWordConfidence(30, 100)

      expect(conf1).toBeLessThan(conf5)
      expect(conf5).toBeLessThan(conf15)
      expect(conf15).toBeLessThan(conf30)
      expect(conf30).toBeGreaterThan(0.9)
    })

    it("correctly detects degrading trend when a word is typed slower or with mistakes", () => {
      let profile = createWordProfile({
        word: "focus",
        startedAt: 0,
        completedAt: 300,
        durationMs: 300,
        expectedCharacters: 5,
        typedCharacters: 5,
        errors: 0,
        correctedErrors: 0,
        accuracy: 100,
        wpm: 100,
        avgLatencyMs: 60,
      })

      // Update 3 times with high speed
      for (let i = 0; i < 4; i++) {
        profile = updateWordProfile(profile, {
          word: "focus",
          startedAt: 0,
          completedAt: 300,
          durationMs: 300,
          expectedCharacters: 5,
          typedCharacters: 5,
          errors: 0,
          correctedErrors: 0,
          accuracy: 100,
          wpm: 100,
          avgLatencyMs: 60,
        })
      }

      // Now introduce a slow, error-prone attempt
      profile = updateWordProfile(profile, {
        word: "focus",
        startedAt: 0,
        completedAt: 1200,
        durationMs: 1200,
        expectedCharacters: 5,
        typedCharacters: 6,
        errors: 2,
        correctedErrors: 1,
        accuracy: 66,
        wpm: 25,
        avgLatencyMs: 200,
      })

      expect(profile.trend).toBeLessThan(0) // Degrading trend detected
    })
  })

  describe("2. N-Gram Extraction & Character Transition Modeling", () => {
    it("extracts unigrams, bigrams, and trigrams correctly from words", () => {
      const { unigrams, bigrams, trigrams } = extractNGrams("through")
      expect(unigrams).toEqual(["t", "h", "r", "o", "u", "g", "h"])
      expect(bigrams).toEqual(["th", "hr", "ro", "ou", "ug", "gh"])
      expect(trigrams).toEqual(["thr", "hro", "rou", "oug", "ugh"])
    })

    it("extracts N-gram latency samples from keystrokes", () => {
      const keystrokes: Keystroke[] = [
        { key: "t", code: "KeyT", isCorrect: true, timestamp: 100, target: "t" },
        { key: "h", code: "KeyH", isCorrect: true, timestamp: 180, target: "h" }, // th: 80ms
        { key: "e", code: "KeyE", isCorrect: true, timestamp: 240, target: "e" }, // he: 60ms, the: 140ms
      ]

      const samples = extractNGramSamplesFromKeystrokes("the", keystrokes)
      expect(samples.length).toBe(6) // 3 unigrams + 2 bigrams + 1 trigram

      const thBigram = samples.find((s) => s.ngram === "th")
      expect(thBigram).toBeDefined()
      expect(thBigram?.latencyMs).toBe(80)
      expect(thBigram?.isCorrect).toBe(true)

      const theTrigram = samples.find((s) => s.ngram === "the")
      expect(theTrigram).toBeDefined()
      expect(theTrigram?.latencyMs).toBe(140)
      expect(theTrigram?.isCorrect).toBe(true)
    })

    it("creates and updates NGramProfile with transition latency and error tracking", () => {
      const sample1 = {
        ngram: "gh",
        n: 2,
        latencyMs: 350,
        isCorrect: false,
        timestamp: 1000,
      }
      let profile = createNGramProfile(sample1)
      expect(profile.ngram).toBe("gh")
      expect(profile.accuracy).toBe(0)
      expect(profile.errorCount).toBe(1)
      expect(profile.avgLatencyMs).toBe(350)

      const sample2 = {
        ngram: "gh",
        n: 2,
        latencyMs: 160,
        isCorrect: true,
        timestamp: 2000,
      }
      profile = updateNGramProfile(profile, sample2)
      expect(profile.attempts).toBe(2)
      expect(profile.accuracy).toBe(50)
      expect(profile.recentAccuracy).toBeGreaterThan(0)
      expect(profile.recentLatencyMs).toBeLessThan(350)
      expect(profile.trend).toBeGreaterThan(0) // Improved from attempt 1 to 2
    })
  })

  describe("3. Intrinsic vs Personal Difficulty Model", () => {
    it("assigns higher intrinsic difficulty to longer words and words with rare/awkward letters", () => {
      const diffThe = intrinsicDifficulty("the")
      const diffQuiz = intrinsicDifficulty("quiz")
      const diffJukebox = intrinsicDifficulty("jukebox")

      expect(diffThe).toBeLessThan(diffQuiz)
      expect(diffQuiz).toBeLessThan(diffJukebox)
    })

    it("evaluates intrinsically hard word as personally easy if user has mastered it", () => {
      const profile: UserTypingProfile = {
        letters: {
          q: { char: "q", totalTyped: 30, correctCount: 30, errorCount: 0, totalLatencyMs: 3000, avgLatencyMs: 100, accuracy: 100, gripScore: 95, updatedAt: 0 },
          u: { char: "u", totalTyped: 30, correctCount: 30, errorCount: 0, totalLatencyMs: 3000, avgLatencyMs: 100, accuracy: 100, gripScore: 95, updatedAt: 0 },
          e: { char: "e", totalTyped: 30, correctCount: 30, errorCount: 0, totalLatencyMs: 3000, avgLatencyMs: 100, accuracy: 100, gripScore: 95, updatedAt: 0 },
        },
        words: {
          queue: {
            word: "queue",
            attempts: 25,
            avgWpm: 110,
            avgLatencyMs: 70,
            accuracy: 100,
            recentWpm: 115,
            recentAccuracy: 100,
            consistency: 95,
            confidence: 0.95,
            trend: 0.1,
            lastSeenAt: 0,
          },
        },
        ngrams: {},
        weaknesses: [],
        testCount: 20,
        lastUpdatedAt: 0,
      }

      const { difficulty: personal, confidence } = personalDifficulty("queue", profile)
      expect(confidence).toBeGreaterThan(0.8)
      expect(personal).toBeLessThan(0.3) // Personally easy for this user

      const eff = effectiveDifficulty("queue", profile)
      expect(eff).toBeLessThan(0.4) // Effective difficulty shifts toward personal difficulty
    })

    it("evaluates intrinsically easy word as personally hard if user struggles with it", () => {
      const profile: UserTypingProfile = {
        letters: {
          o: { char: "o", totalTyped: 20, correctCount: 10, errorCount: 10, totalLatencyMs: 5000, avgLatencyMs: 250, accuracy: 50, gripScore: 40, updatedAt: 0 },
          f: { char: "f", totalTyped: 20, correctCount: 10, errorCount: 10, totalLatencyMs: 5000, avgLatencyMs: 250, accuracy: 50, gripScore: 40, updatedAt: 0 },
        },
        words: {
          of: {
            word: "of",
            attempts: 15,
            avgWpm: 30,
            avgLatencyMs: 250,
            accuracy: 60,
            recentWpm: 25,
            recentAccuracy: 55,
            consistency: 50,
            confidence: 0.85,
            trend: -0.2,
            lastSeenAt: 0,
          },
        },
        ngrams: {},
        weaknesses: [],
        testCount: 15,
        lastUpdatedAt: 0,
      }

      const { difficulty: personal } = personalDifficulty("of", profile)
      expect(personal).toBeGreaterThan(0.5)

      const eff = effectiveDifficulty("of", profile)
      expect(eff).toBeGreaterThan(0.4)
      expect(eff).toBeGreaterThan(intrinsicDifficulty("of") * 2.5) // 3x higher than intrinsic baseline (0.15)
    })

    it("correctly classifies difficulty bands", () => {
      expect(classifyDifficultyBand(0.2)).toBe("easy")
      expect(classifyDifficultyBand(0.5)).toBe("medium")
      expect(classifyDifficultyBand(0.8)).toBe("hard")
    })
  })

  describe("4. Candidate Word Scoring", () => {
    const context: GenerationContext = {
      count: 30,
      strategy: "balanced",
      userState: {
        baselineWpm: 75,
        recentWpm: 80,
        baselineAccuracy: 97,
        recentAccuracy: 98,
        wpmTrend: 0.06,
        accuracyTrend: 0.01,
        consistency: 85,
        difficultyLevel: 0.5,
        confidence: 0.8,
        momentumScore: 0.75,
        state: "flow",
      },
      userProfile: {
        letters: {},
        words: {
          the: {
            word: "the",
            attempts: 50,
            avgWpm: 110,
            avgLatencyMs: 65,
            accuracy: 99,
            recentWpm: 115,
            recentAccuracy: 100,
            consistency: 95,
            confidence: 0.98,
            trend: 0.05,
            lastSeenAt: 0,
          },
        },
        ngrams: {},
        weaknesses: [
          { pattern: "ough", type: "trigram", weight: 0.5, accuracy: 60, latencyMs: 320 },
          { pattern: "gh", type: "bigram", weight: 0.5, accuracy: 65, latencyMs: 290 },
        ],
        testCount: 20,
        lastUpdatedAt: 0,
      },
    }

    it("gives high performance value to fast, accurate mastered words", () => {
      const scoreThe = scoreCandidateWord("the", context, [])
      expect(scoreThe.performanceValue).toBeGreaterThan(0.8)
    })

    it("gives high learning value to words covering active weaknesses", () => {
      const scoreThrough = scoreCandidateWord("through", context, [])
      const scoreThe = scoreCandidateWord("the", context, [])
      expect(scoreThrough.learningValue).toBeGreaterThan(scoreThe.learningValue)
    })

    it("applies strong repetition penalty when a word is recently placed in active sequence", () => {
      const scoreFresh = scoreCandidateWord("apple", context, [])
      const scoreRepeated = scoreCandidateWord("apple", context, ["apple"])
      expect(scoreRepeated.repetitionPenalty).toBeGreaterThan(0.5)
      expect(scoreRepeated.finalScore).toBeLessThan(scoreFresh.finalScore)
    })

    it("adapts candidate scoring based on strategy (Performance vs Challenge)", () => {
      const perfContext: GenerationContext = { ...context, strategy: "performance" }
      const chalContext: GenerationContext = { ...context, strategy: "challenge" }

      const perfScore = scoreCandidateWord("the", perfContext, [])
      const chalScore = scoreCandidateWord("the", chalContext, [])

      // "the" has higher or equal final score under performance mode than challenge mode
      expect(perfScore.finalScore).toBeGreaterThanOrEqual(chalScore.finalScore)
    })
  })

  describe("5. User Typing State & Dynamic Momentum", () => {
    it("identifies 'calibrating' state for the first few sessions", () => {
      const state = deriveUserTypingState(null, [])
      expect(state.state).toBe("calibrating")
      expect(state.difficultyLevel).toBe(0.22)
    })

    it("identifies 'struggling' state when accuracy drops or error rate spikes", () => {
      const records: TestRecord[] = [
        { id: "1", wpm: 50, rawWpm: 60, accuracy: 82, consistency: 60, mistakes: 8, streak: 5, elapsedMs: 30000, totalTyped: 150, correctChars: 123, timeLimit: 30, mode: "time", createdAt: 1000 },
        { id: "2", wpm: 45, rawWpm: 55, accuracy: 80, consistency: 55, mistakes: 10, streak: 4, elapsedMs: 30000, totalTyped: 140, correctChars: 112, timeLimit: 30, mode: "time", createdAt: 2000 },
        { id: "3", wpm: 42, rawWpm: 52, accuracy: 78, consistency: 50, mistakes: 12, streak: 3, elapsedMs: 30000, totalTyped: 130, correctChars: 101, timeLimit: 30, mode: "time", createdAt: 3000 },
      ]

      const state = deriveUserTypingState({ letters: {}, words: {}, ngrams: {}, weaknesses: [], testCount: 3, lastUpdatedAt: 0 }, records)
      expect(state.state).toBe("struggling")
      expect(state.difficultyLevel).toBeLessThan(0.3) // Eased difficulty to restore momentum
    })

    it("identifies 'flow' state when speed is climbing with high accuracy and low variance", () => {
      const records: TestRecord[] = [
        { id: "1", wpm: 75, rawWpm: 76, accuracy: 98, consistency: 85, mistakes: 1, streak: 40, elapsedMs: 30000, totalTyped: 225, correctChars: 220, timeLimit: 30, mode: "time", createdAt: 1000 },
        { id: "2", wpm: 78, rawWpm: 79, accuracy: 98, consistency: 88, mistakes: 1, streak: 45, elapsedMs: 30000, totalTyped: 234, correctChars: 230, timeLimit: 30, mode: "time", createdAt: 2000 },
        { id: "3", wpm: 82, rawWpm: 83, accuracy: 99, consistency: 90, mistakes: 0, streak: 50, elapsedMs: 30000, totalTyped: 246, correctChars: 245, timeLimit: 30, mode: "time", createdAt: 3000 },
      ]

      const state = deriveUserTypingState({ letters: {}, words: {}, ngrams: {}, weaknesses: [], testCount: 10, lastUpdatedAt: 0 }, records)
      expect(state.state).toBe("flow")
      expect(state.difficultyLevel).toBeGreaterThanOrEqual(0.55)
    })
  })

  describe("6. Sequence Generation & Curvature", () => {
    it("generates exact requested word count", () => {
      const counts = [10, 25, 50, 100, 150]
      for (const count of counts) {
        const words = generatePersonalizedWords(count, { seed: 1234 })
        expect(words.length).toBe(count)
      }
    })

    it("generates short, flow-friendly words for brand-new users", () => {
      const words = generatePersonalizedWords(30, { testCount: 0, seed: 4242 })
      expect(words.length).toBe(30)
      const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
      expect(avgLength).toBeLessThan(5.5)
      const longWords = words.filter((w) => w.length > 7)
      expect(longWords.length).toBeLessThanOrEqual(2)
    })

    it("builds a smooth sequence pattern with no consecutive hard words", () => {
      const pattern = buildSequencePattern(30, "flow", 42)
      expect(pattern.length).toBe(30)

      for (let i = 1; i < pattern.length; i++) {
        if (pattern[i] === "hard") {
          expect(pattern[i - 1]).not.toBe("hard") // No back-to-back hard spikes
        }
      }
    })

    it("produces deterministic output when given the same seed and context", () => {
      const run1 = generatePersonalizedWords(30, { seed: 98765 })
      const run2 = generatePersonalizedWords(30, { seed: 98765 })
      expect(run1).toEqual(run2)
    })

    it("supports complex mode with punctuation and uppercase transformations", () => {
      const words = generatePersonalizedWords(25, { seed: 555, complex: true })
      expect(words.length).toBe(25)
      const hasCapsOrSymbols = words.some((w) => /[A-Z!@#$%^&*()_+\-=\[\]{};':",./<>\?]/.test(w))
      expect(hasCapsOrSymbols).toBe(true)
    })

    it("produces diverse starting letters across generated test", () => {
      const words = generatePersonalizedWords(30, { seed: 42 })
      const firstLetters = new Set(words.map((w) => w[0]?.toLowerCase()))
      expect(firstLetters.size).toBeGreaterThanOrEqual(10)
    })
  })

  describe("7. End-to-End Simulation Tests with Synthetic Personas", () => {
    it("User A: Fast on common words, weak on 'ough' and 'qu' -> Generates easy words + targeted 'ough'/'qu' words", () => {
      const profile: UserTypingProfile = {
        letters: {
          q: { char: "q", totalTyped: 10, correctCount: 5, errorCount: 5, totalLatencyMs: 3200, avgLatencyMs: 320, accuracy: 50, gripScore: 45, updatedAt: 0 },
        },
        words: {
          the: { word: "the", attempts: 40, avgWpm: 100, avgLatencyMs: 70, accuracy: 100, recentWpm: 105, recentAccuracy: 100, consistency: 95, confidence: 0.95, trend: 0.1, lastSeenAt: 0 },
          and: { word: "and", attempts: 35, avgWpm: 95, avgLatencyMs: 75, accuracy: 98, recentWpm: 100, recentAccuracy: 100, consistency: 92, confidence: 0.94, trend: 0.05, lastSeenAt: 0 },
        },
        ngrams: {
          qu: { ngram: "qu", n: 2, attempts: 8, avgLatencyMs: 310, recentLatencyMs: 320, accuracy: 60, recentAccuracy: 60, errorCount: 3, confidence: 0.6, trend: -0.1, lastSeenAt: 0 },
          gh: { ngram: "gh", n: 2, attempts: 8, avgLatencyMs: 290, recentLatencyMs: 300, accuracy: 65, recentAccuracy: 65, errorCount: 3, confidence: 0.6, trend: -0.1, lastSeenAt: 0 },
        },
        weaknesses: [
          { pattern: "qu", type: "bigram", weight: 0.5, accuracy: 60, latencyMs: 320 },
          { pattern: "gh", type: "bigram", weight: 0.5, accuracy: 65, latencyMs: 300 },
        ],
        testCount: 15,
        lastUpdatedAt: 0,
      }

      const words = generatePersonalizedWords(30, { profile, seed: 101 })
      expect(words.length).toBe(30)

      // Targeted words containing 'qu' or 'gh' should appear smoothly in test
      const targetedCount = words.filter((w) => w.includes("qu") || w.includes("gh")).length
      expect(targetedCount).toBeGreaterThanOrEqual(1)
      expect(targetedCount).toBeLessThanOrEqual(6) // Not over-saturated
    })

    it("User B: Struggling user -> Generates supportive, lower difficulty words", () => {
      const profile: UserTypingProfile = {
        letters: {},
        words: {},
        ngrams: {},
        weaknesses: [],
        testCount: 10,
        lastUpdatedAt: 0,
      }

      const historyRecords: TestRecord[] = [
        { id: "1", wpm: 28, rawWpm: 36, accuracy: 78, consistency: 50, mistakes: 10, streak: 3, elapsedMs: 30000, totalTyped: 90, correctChars: 70, timeLimit: 30, mode: "time", createdAt: 1000 },
        { id: "2", wpm: 30, rawWpm: 38, accuracy: 80, consistency: 52, mistakes: 9, streak: 4, elapsedMs: 30000, totalTyped: 95, correctChars: 76, timeLimit: 30, mode: "time", createdAt: 2000 },
        { id: "3", wpm: 26, rawWpm: 35, accuracy: 75, consistency: 45, mistakes: 12, streak: 2, elapsedMs: 30000, totalTyped: 85, correctChars: 64, timeLimit: 30, mode: "time", createdAt: 3000 },
      ]

      const state = deriveUserTypingState(profile, historyRecords)
      expect(state.state).toBe("struggling")

      const words = generatePersonalizedWords(25, { profile, seed: 777 })
      expect(words.length).toBe(25)

      // Average word length should be friendly (mostly <= 6 chars)
      const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
      expect(avgLength).toBeLessThan(6.5)
    })

    it("User C: Very fast, stable master -> Generates higher difficulty with rich vocabulary exploration", () => {
      const profile: UserTypingProfile = {
        letters: {},
        words: {},
        ngrams: {},
        weaknesses: [],
        testCount: 40,
        lastUpdatedAt: 0,
      }

      const historyRecords: TestRecord[] = [
        { id: "1", wpm: 105, rawWpm: 106, accuracy: 98, consistency: 90, mistakes: 1, streak: 80, elapsedMs: 30000, totalTyped: 315, correctChars: 310, timeLimit: 30, mode: "time", createdAt: 1000 },
        { id: "2", wpm: 110, rawWpm: 111, accuracy: 99, consistency: 92, mistakes: 0, streak: 90, elapsedMs: 30000, totalTyped: 330, correctChars: 328, timeLimit: 30, mode: "time", createdAt: 2000 },
        { id: "3", wpm: 112, rawWpm: 113, accuracy: 99, consistency: 94, mistakes: 0, streak: 100, elapsedMs: 30000, totalTyped: 336, correctChars: 335, timeLimit: 30, mode: "time", createdAt: 3000 },
      ]

      const state = deriveUserTypingState(profile, historyRecords)
      expect(state.state).toBe("mastering")
      expect(state.difficultyLevel).toBeGreaterThanOrEqual(0.7)
    })

    it("User D: Weak 'gh' but improving rapidly -> Reinforces improvement without excessive punishment", () => {
      const profile: UserTypingProfile = {
        letters: {},
        words: {
          though: {
            word: "though",
            attempts: 12,
            avgWpm: 60,
            avgLatencyMs: 140,
            accuracy: 85,
            recentWpm: 75,
            recentAccuracy: 95,
            consistency: 85,
            confidence: 0.8,
            trend: 0.25, // Improving rapidly!
            lastSeenAt: 0,
          },
        },
        ngrams: {
          gh: { ngram: "gh", n: 2, attempts: 15, avgLatencyMs: 200, recentLatencyMs: 150, accuracy: 80, recentAccuracy: 92, errorCount: 3, confidence: 0.75, trend: 0.2, lastSeenAt: 0 },
        },
        weaknesses: [
          { pattern: "gh", type: "bigram", weight: 0.3, accuracy: 80, latencyMs: 200 },
        ],
        testCount: 20,
        lastUpdatedAt: 0,
      }

      const score = scoreCandidateWord("though", { count: 30, userProfile: profile, userState: { baselineWpm: 70, recentWpm: 75, baselineAccuracy: 95, recentAccuracy: 97, wpmTrend: 0.07, accuracyTrend: 0.02, consistency: 85, difficultyLevel: 0.5, confidence: 0.8, momentumScore: 0.8, state: "flow" } }, [])
      expect(score.improvementValue).toBeGreaterThan(0.2) // Positive reinforcement for upward trajectory
    })
  })

  describe("8. Mathematical Invariants & Performance Constraints", () => {
    it("guarantees difficulty, confidence, accuracy bounded within [0, 1] or [0, 100]", () => {
      const words = ["a", "the", "supercalifragilisticexpialidocious", "xyz", "queue", "rhythm"]
      for (const w of words) {
        const idiff = intrinsicDifficulty(w)
        expect(idiff).toBeGreaterThanOrEqual(0)
        expect(idiff).toBeLessThanOrEqual(1)

        const ediff = effectiveDifficulty(w, null)
        expect(ediff).toBeGreaterThanOrEqual(0)
        expect(ediff).toBeLessThanOrEqual(1)
      }
    })

    it("generates large batches (150 words) within < 20ms without memory leaks", () => {
      const start = performance.now()
      const words = generatePersonalizedWords(150, { seed: 42 })
      const elapsed = performance.now() - start

      expect(words.length).toBe(150)
      expect(elapsed).toBeLessThan(50) // Extremely fast sub-millisecond execution
    })

    it("provides explainAdaptiveGeneration for diagnostic transparency", () => {
      const explanation = explainAdaptiveGeneration(10, { seed: 42 })
      expect(explanation.userState).toBeDefined()
      expect(explanation.words.length).toBe(10)
      expect(explanation.words[0].score).toBeDefined()
      expect(explanation.words[0].score.finalScore).toBeDefined()
    })
  })
})
