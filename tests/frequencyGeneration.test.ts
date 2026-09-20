import { describe, it, expect } from "vitest"
import {
  FREQUENCY_WORDS,
  getWordRank,
  frequencyBand,
  getLanguagePool,
  zipfIndex,
  LANGUAGE_OPTIONS,
} from "@/lib/data/frequency"
import { generateAdaptiveWords } from "@/lib/words"
import { generateFrequencySequence } from "@/lib/adaptive/sequence-generator"
import { computeTestQualityMetrics } from "@/lib/test-quality"
import { buildPracticeSet } from "@/lib/adaptive/practice-set"
import type { UserTypingProfile } from "@/lib/adaptive/types"

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe("Frequency-ranked vocabulary", () => {
  it("loads a ranked pool with the most common English words first", () => {
    expect(FREQUENCY_WORDS.length).toBeGreaterThan(5000)
    expect(FREQUENCY_WORDS[0]).toBe("the")
    for (const w of ["of", "and", "to", "in", "for"]) {
      expect(FREQUENCY_WORDS.slice(0, 10)).toContain(w)
    }
  })

  it("contains only lowercase alphabetic unique words of sane length", () => {
    const seen = new Set<string>()
    for (const w of FREQUENCY_WORDS) {
      expect(w).toMatch(/^[a-z]+$/)
      expect(w.length).toBeGreaterThanOrEqual(2)
      expect(w.length).toBeLessThanOrEqual(12)
      expect(seen.has(w)).toBe(false)
      seen.add(w)
    }
  })

  it("resolves ranks and bands", () => {
    expect(getWordRank("the")).toBe(1)
    expect(getWordRank("zzzqqq")).toBeNull()
    expect(frequencyBand("the")).toBe("easy")
    expect(frequencyBand("zzzqqq")).toBe("hard")
    // rank just past the easy threshold is medium
    expect(frequencyBand(FREQUENCY_WORDS[350])).toBe("medium")
  })

  it("slices language pools by ceiling", () => {
    for (const opt of LANGUAGE_OPTIONS) {
      const pool = getLanguagePool(opt.id)
      expect(pool.length).toBe(Math.min(opt.ceiling, FREQUENCY_WORDS.length))
      expect(pool[0]).toBe("the")
    }
  })

  it("zipf sampler stays in bounds and favors low ranks (utility for future modes)", () => {
    const rng = mulberry32(7)
    const length = 1200
    let low = 0
    let high = 0
    const N = 6000
    for (let i = 0; i < N; i++) {
      const idx = zipfIndex(rng, length)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(length)
      if (idx < 50) low++
      if (idx > 900) high++
    }
    // Zipf's law: the top-4% of ranks should dominate the tail massively
    expect(low).toBeGreaterThan(high * 5)
  })
})

describe("Frequency-first generation (adaptive off)", () => {
  it("is deterministic under a seed", () => {
    const a = generateAdaptiveWords(30, { seed: 555, adaptive: false, testCount: 20 })
    const b = generateAdaptiveWords(30, { seed: 555, adaptive: false, testCount: 20 })
    expect(a).toEqual(b)
  })

  it("never repeats a word within the last two positions", () => {
    for (const seed of [1, 42, 999]) {
      const words = generateFrequencySequence(200, seed)
      for (let i = 2; i < words.length; i++) {
        expect(words[i]).not.toBe(words[i - 1])
        expect(words[i]).not.toBe(words[i - 2])
      }
    }
  })

  it("respects language ceilings", () => {
    const words = generateAdaptiveWords(50, { seed: 314, adaptive: false, language: "en1k" })
    for (const w of words) {
      const rank = getWordRank(w)
      expect(rank).not.toBeNull()
      expect(rank!).toBeLessThanOrEqual(1200)
    }
  })

  it("spreads uniformly across the chosen pool — no short-word obsession", () => {
    const words = generateAdaptiveWords(3000, { seed: 2024, adaptive: false, language: "en1k" })
    // Every draw stays inside the ceiling
    for (const w of words) {
      expect(getWordRank(w)!).toBeLessThanOrEqual(1200)
    }
    // Uniform over ~1180 words → 3000 draws should cover most of the pool
    const distinct = new Set(words).size
    expect(distinct).toBeGreaterThan(900)
    // No single word should dominate (uniform, not degenerate)
    const counts = new Map<string, number>()
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1)
    const maxCount = Math.max(...counts.values())
    expect(maxCount / words.length).toBeLessThan(0.02)
  })

  it("caps the no-profile default at monkeytype-grade top-200", () => {
    const words = generateFrequencySequence(1000, 8)
    const distinct = new Set(words).size
    expect(distinct).toBeLessThanOrEqual(200)
    for (const w of words) {
      expect(getWordRank(w)!).toBeLessThanOrEqual(200)
    }
  })

  it("cold-start sessions stay inside the smooth top-200", () => {
    const words = generateAdaptiveWords(30, { seed: 88, testCount: 0 })
    for (const w of words) {
      expect(getWordRank(w)!).toBeLessThanOrEqual(200)
    }
  })
})

describe("Rhythm engineering", () => {
  it("keeps word-length variance capped in easy stretches (no whiplash)", () => {
    const words = generateAdaptiveWords(150, { seed: 12345, testCount: 40, language: "en" })
    let bigJumps = 0
    for (let i = 1; i < words.length; i++) {
      if (Math.abs(words[i].length - words[i - 1].length) > 4) bigJumps++
    }
    // soft penalty should keep violent jumps rare — not impossible (hard slots exempt)
    expect(bigJumps / words.length).toBeLessThan(0.1)
  })

  it("injects natural collocation pairs mid-sequence across seeds", () => {
    const pairs = [
      "of the", "in the", "to the", "on the", "at the", "for the", "with the",
      "it is", "there are", "he was", "one of", "out of", "as well",
    ]
    let hits = 0
    for (let seed = 1; seed <= 60; seed++) {
      const text = generateAdaptiveWords(40, { seed, testCount: 30 }).join(" ")
      if (pairs.some((p) => text.includes(` ${p} `))) hits++
    }
    // collocation rate 0.14 over ~26 eligible slots/test → most tests contain one
    expect(hits).toBeGreaterThan(22)
  })

  it("reports quality metrics computed from generated output", () => {
    const words = generateAdaptiveWords(100, { seed: 77, testCount: 25 })
    const q = computeTestQualityMetrics(words)
    expect(q.pctTop200).toBeGreaterThan(50)
    // Zipf sampling is dominated by short function words — that IS real English
    expect(q.avgWordLength).toBeGreaterThan(2.4)
    expect(q.avgWordLength).toBeLessThan(7)
    expect(q.minRepeatDistance).toBeGreaterThanOrEqual(3)
  })

  it("computes metrics exactly on a known input", () => {
    const m = computeTestQualityMetrics(["the", "of", "the", "grizzly"])
    expect(m.pctTop200).toBe(75)
    expect(m.avgWordLength).toBe(3.8) // (3+2+3+7)/4
    expect(m.minRepeatDistance).toBe(2)
    expect(computeTestQualityMetrics([]).minRepeatDistance).toBe(Infinity)
  })
})

describe("Personalization on the ranked pool", () => {
  it("drills weaknesses using common vocabulary within dosage bounds", () => {
    const profile: UserTypingProfile = {
      letters: {},
      words: {},
      ngrams: {},
      weaknesses: [{ pattern: "qu", type: "bigram", weight: 1, accuracy: 50, latencyMs: 320 }],
      practiceSet: [],
      testCount: 30,
      lastUpdatedAt: 99,
    }

    for (const seed of [101, 202, 303, 404, 505]) {
      const words = generateAdaptiveWords(30, { profile, seed })
      expect(words.length).toBe(30)
      const drilled = words.filter((w) => w.includes("qu"))
      expect(drilled.length).toBeGreaterThanOrEqual(1)
      expect(drilled.length).toBeLessThanOrEqual(6)
      // drilling must use REAL words people type, not exotic ones
      for (const w of drilled) {
        expect(getWordRank(w.replace(/[^a-z]/g, ""))).not.toBeNull()
      }
    }
  })

  it("practice set fresh filler comes from the frequent zone only", () => {
    // Empty telemetry → entire set is fresh filler from the ranked pool
    const set = buildPracticeSet(null, mulberry32(11))
    expect(set.length).toBeGreaterThan(0)
    for (const w of set) {
      const rank = getWordRank(w)
      expect(rank).not.toBeNull()
      expect(rank!).toBeLessThanOrEqual(600)
    }
  })

  it("keeps full determinism with profiles in play", () => {
    const profile: UserTypingProfile = {
      letters: {},
      words: {
        know: {
          word: "know", attempts: 6, avgWpm: 70, avgLatencyMs: 160, accuracy: 88,
          recentWpm: 72, recentAccuracy: 85, consistency: 80, confidence: 0.7,
          trend: 0.05, lastSeenAt: 0,
        },
      },
      ngrams: {},
      weaknesses: [{ pattern: "kn", type: "bigram", weight: 0.9, accuracy: 70, latencyMs: 250 }],
      practiceSet: ["know"],
      testCount: 40,
      lastUpdatedAt: 1234,
    }
    const a = generateAdaptiveWords(30, { profile, seed: 424242 })
    const b = generateAdaptiveWords(30, { profile, seed: 424242 })
    expect(a).toEqual(b)
  })
})
