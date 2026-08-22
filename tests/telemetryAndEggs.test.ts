import { describe, it, expect, beforeEach } from "vitest"
import {
  recordSessionTelemetry,
  extractWordAttempts,
} from "@/lib/adaptive/telemetry"
import { generateAdaptiveSequence } from "@/lib/adaptive/sequence-generator"
import { applyComplexity } from "@/lib/words"
import {
  EASTER_EGGS,
  findEasterEgg,
  getDiscoveredEggs,
  recordEggDiscovery,
  getSecretsProgress,
  pickUndiscoveredHint,
  pickEasterEggInjection,
} from "@/lib/easter-eggs"
import type { Keystroke, WordData } from "@/types"

// Minimal localStorage stub for discovery tracking tests
class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

function makeKeystroke(
  target: string | undefined,
  code: string,
  timestamp: number,
  isCorrect = true,
  key?: string
): Keystroke {
  return { key: key ?? (code === "Space" ? " " : code.replace("Key", "").toLowerCase()), code, isCorrect, timestamp, target }
}

describe("Telemetry signal fixes", () => {
  const mkWords = (n: number): WordData[] =>
    Array.from({ length: n }, (_, i) => ({
      target: `w${i}`,
      chars: [],
      isCurrent: false,
    })) as unknown as WordData[]

  it("ingests each bigram exactly once per occurrence (no N× duplication)", () => {
    // Two words: "ab cde" — bigram counts must reflect single ingestion
    const targetText = ["ab", "cde"]
    const keystrokes: Keystroke[] = [
      makeKeystroke("a", "KeyA", 1000),
      makeKeystroke("b", "KeyB", 1100),
      makeKeystroke(" ", "Space", 1150),
      makeKeystroke("c", "KeyC", 1300),
      makeKeystroke("d", "KeyD", 1400),
      makeKeystroke("e", "KeyE", 1500),
      makeKeystroke(" ", "Space", 1550),
    ]

    const profile = recordSessionTelemetry(keystrokes, mkWords(2), targetText)

    // Bigram "cd" appears once in the session → attempts must be 1 (was 2 before the fix)
    expect(profile.ngrams["cd"]).toBeDefined()
    expect(profile.ngrams["cd"].attempts).toBe(1)
    // Cross-word bigrams like "bc" must never exist
    expect(profile.ngrams["bc"]).toBeUndefined()
    // Unigram 'b' appears once
    expect(profile.ngrams["b"].attempts).toBe(1)
    expect(profile.ngrams["e"].attempts).toBe(1)
  })

  it("does not inflate WPM when a word is only partially typed", () => {
    const targetText = ["computer"]
    // Only 4 of 8 characters typed quickly — old code assumed full length
    const keystrokes: Keystroke[] = [
      makeKeystroke("c", "KeyC", 1000),
      makeKeystroke("o", "KeyO", 1100),
      makeKeystroke("m", "KeyM", 1200),
      makeKeystroke("p", "KeyP", 1300),
    ]

    const attempts = extractWordAttempts(mkWords(1), targetText, keystrokes)
    expect(attempts).toHaveLength(1)
    // 4 chars over 300ms → honest ~160 WPM, not inflated by untyped chars
    expect(attempts[0].wpm).toBeLessThan(200)
  })

  it("keeps completed-word WPM equivalent to previous behavior", () => {
    const targetText = ["test"]
    const keystrokes: Keystroke[] = [
      makeKeystroke("t", "KeyT", 1000),
      makeKeystroke("e", "KeyE", 1100),
      makeKeystroke("s", "KeyS", 1200),
      makeKeystroke("t", "KeyT", 1300),
      makeKeystroke(" ", "Space", 1400),
    ]
    const attempts = extractWordAttempts(mkWords(1), targetText, keystrokes)
    // (4+1)/5 chars over 400ms → 150 WPM
    expect(attempts[0].wpm).toBe(150)
  })
})

describe("Easter egg registry & discovery", () => {
  beforeEach(() => {
    ;(globalThis as unknown as { window: unknown }).window = { localStorage: new MemoryStorage() }
  })

  it("matches egg words case/punctuation-insensitively", () => {
    expect(findEasterEgg("THOCK")?.effect).toBe("thock-ripple")
    expect(findEasterEgg("(thock)")?.word).toBe("thock")
    expect(findEasterEgg("banana")).toBeNull()
  })

  it("records first-time discovery exactly once", () => {
    expect(Object.keys(getDiscoveredEggs())).toHaveLength(0)
    expect(recordEggDiscovery("love")).toBe(true)
    expect(recordEggDiscovery("LOVE")).toBe(false)
    expect(getSecretsProgress()).toEqual({ found: 1, total: EASTER_EGGS.length })
  })

  it("returns hints only for undiscovered eggs and null when all found", () => {
    const hint = pickUndiscoveredHint(() => 0)
    expect(hint).toBe(EASTER_EGGS[0].hint)
    for (const egg of EASTER_EGGS) recordEggDiscovery(egg.word)
    expect(pickUndiscoveredHint()).toBeNull()
  })

  it("picks injection candidates excluding already-present words", () => {
    const discovered = EASTER_EGGS[0].word
    recordEggDiscovery(discovered)
    const picked = pickEasterEggInjection(() => 0.5, ["flow"])
    expect(picked).not.toBe(discovered)
    expect(picked).not.toBe("flow")
    expect(picked).not.toBeNull()
  })
})

describe("Easter egg seeding in adaptive sequences", () => {
  beforeEach(() => {
    ;(globalThis as unknown as { window: unknown }).window = { localStorage: new MemoryStorage() }
  })

  it("can inject an undiscovered egg mid-sequence for non-calibrating users", () => {
    // "thock" never occurs in the base vocabulary — finding it proves injection
    let injected = false
    for (let seed = 1; seed <= 300 && !injected; seed++) {
      const seq = generateAdaptiveSequence(30, {
        count: 30,
        testCount: 20,
        seed,
        userState: {
          baselineWpm: 60, recentWpm: 60, baselineAccuracy: 95, recentAccuracy: 95,
          wpmTrend: 0, accuracyTrend: 0, consistency: 80, difficultyLevel: 0.45,
          confidence: 0.8, momentumScore: 0.6, state: "stable",
        },
        userProfile: null,
      })
      injected = seq.includes("thock")
    }
    expect(injected).toBe(true)

    // Calibrating users never receive injected eggs
    for (let seed = 1; seed <= 300; seed++) {
      const seq = generateAdaptiveSequence(30, {
        count: 30,
        testCount: 1,
        seed,
        userState: {
          baselineWpm: 60, recentWpm: 60, baselineAccuracy: 95, recentAccuracy: 95,
          wpmTrend: 0, accuracyTrend: 0, consistency: 80, difficultyLevel: 0.22,
          confidence: 0.1, momentumScore: 0.5, state: "calibrating",
        },
        userProfile: null,
      })
      expect(seq.includes("thock")).toBe(false)
    }
  })

  it("applyComplexity leaves protected egg words untouched", () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(applyComplexity(["hello"], seed, ["hello"])[0]).toBe("hello")
    }
    // Sanity: unprotected words DO get transformed for some seeds
    const variants = Array.from({ length: 30 }, (_, i) => applyComplexity(["hello"], i + 1)[0])
    expect(variants.some((w) => w !== "hello")).toBe(true)
  })
})
