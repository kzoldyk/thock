import type {
  GenerationContext,
  DifficultyBand,
  CandidateScore,
  UserStateCategory,
} from "./types"
import { scoreCandidateWord } from "./candidate-scoring"
import { classifyDifficultyBand } from "./difficulty"
import { pickEasterEggInjection } from "../easter-eggs"
import {
  FREQUENCY_WORDS,
  getLanguagePool,
  getLanguageCeiling,
  getWordRank,
  BAND_RANK_THRESHOLDS,
  type LanguageId,
} from "../data/frequency"

// Deterministic 32-bit PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface BandDistribution {
  easy: number
  medium: number
  hard: number
}

const STATE_DISTRIBUTIONS: Record<UserStateCategory, BandDistribution> = {
  calibrating: { easy: 0.96, medium: 0.04, hard: 0 },
  struggling: { easy: 0.92, medium: 0.08, hard: 0 },
  stable: { easy: 0.84, medium: 0.13, hard: 0.03 },
  flow: { easy: 0.72, medium: 0.21, hard: 0.07 },
  mastering: { easy: 0.62, medium: 0.27, hard: 0.11 },
}

/** New users get a pure Zipf walk over the most common words — instant flow */
const COLD_START_TEST_THRESHOLD = 15
const COLD_START_POOL_SIZE = 200

/**
 * Natural word pairs built exclusively from ultra-frequent vocabulary.
 * Injected mid-sequence so tests read like prose instead of a word salad.
 */
const COLLOCATION_PAIRS: Array<[string, string]> = [
  ["of", "the"], ["in", "the"], ["to", "the"], ["on", "the"], ["at", "the"],
  ["for", "the"], ["with", "the"], ["from", "the"], ["by", "the"], ["and", "the"],
  ["it", "is"], ["there", "are"], ["he", "was"], ["she", "was"], ["they", "have"],
  ["we", "will"], ["you", "can"], ["one", "of"], ["out", "of"], ["as", "well"],
  ["so", "that"], ["part", "of"], ["use", "the"], ["time", "to"], ["want", "to"],
]
const COLLOCATION_RATE = 0.14

/** Rhythm guardrails */
const MAX_LENGTH_JUMP = 4 // adjacent words differ by more chars than this → dampen
const SAME_BOUNDARY_CHAR_FACTOR = 0.5 // "that tree" — repeated boundary letter
const AWKWARD_BOUNDARY_FACTOR = 0.7 // awkward-letter meeting at word boundary

const AWKWARD_LETTERS = new Set(["q", "z", "x", "j", "v", "k"])

/**
 * Primary difficulty comes from corpus frequency; physical difficulty
 * (intrinsic + personal telemetry) can escalate a word one or two bands so
 * weakness drilling concentrates in medium/hard slots — but a word can never
 * be banded harder than its frequency tier + escalation allows.
 */
function resolveBand(word: string, effDiff: number): DifficultyBand {
  const base = frequencyBandForWord(word)
  const physBand = classifyDifficultyBand(effDiff)

  if (base === "easy") {
    if (physBand === "hard") return "hard"
    if (physBand === "medium") return "medium"
    return "easy"
  }
  if (base === "medium") {
    return physBand === "hard" ? "hard" : "medium"
  }
  return "hard"
}

function frequencyBandForWord(word: string): DifficultyBand {
  const rank = getWordRank(word)
  if (rank === null) return "hard"
  if (rank <= BAND_RANK_THRESHOLDS.easyMaxRank) return "easy"
  if (rank <= BAND_RANK_THRESHOLDS.mediumMaxRank) return "medium"
  return "hard"
}

// ---------------------------------------------------------------------------
// Scored pool cache — scoring the full vocabulary is expensive and only
// changes when the user profile does, so memoize across generations.
// ---------------------------------------------------------------------------

interface PoolCacheEntry {
  key: string
  pools: Record<DifficultyBand, CandidateScore[]>
  /** Same candidates filtered to weakness-matching words, ranked by learning value */
  drillPools: Record<DifficultyBand, CandidateScore[]>
}

let scoredPoolCache: PoolCacheEntry | null = null

function buildPoolCacheKey(context: GenerationContext): string {
  const p = context.userProfile
  return JSON.stringify([
    context.language ?? "en",
    p?.lastUpdatedAt ?? 0,
    p ? Object.keys(p.words).length : 0,
    p?.weaknesses.map((w) => w.pattern + w.weight.toFixed(2)).join("|") ?? "",
    context.testCount ?? 0,
    context.userState?.state ?? "calibrating",
    context.userState?.difficultyLevel ?? 0.45,
    context.userState?.baselineWpm ?? 60,
  ])
}

const DRILL_MIN_LEARNING_VALUE = 0.12

/**
 * Weakness-matching words are additionally scanned beyond the language
 * ceiling (up to this rank) so every weakness stays drillable even when the
 * user picked a small vocabulary. Only drill pools import these — the normal
 * flow strictly respects the chosen ceiling.
 */
const DRILL_SCAN_MAX_RANK = 1200

function getScoredPools(context: GenerationContext): PoolCacheEntry {
  const key = buildPoolCacheKey(context)
  if (scoredPoolCache && scoredPoolCache.key === key) {
    return scoredPoolCache
  }

  const language = context.language ?? "en"
  const pool = getLanguagePool(language)
  const pools: Record<DifficultyBand, CandidateScore[]> = { easy: [], medium: [], hard: [] }

  for (const word of pool) {
    // Two passes are intentional: pass 1 detects the band, pass 2 re-weights
    // scoring FOR that band so weakness-drilling concentrates in medium/hard
    // pools instead of flooding easy slots.
    const probe = scoreCandidateWord(word, context, [])
    const band = resolveBand(word, probe.effectiveDifficulty)
    const slotScore = scoreCandidateWord(word, context, [], band)
    slotScore.band = band
    pools[band].push(slotScore)
  }

  // Extended scan for drillable vocabulary beyond the ceiling
  const ceiling = getLanguageCeiling(language)
  const extendedDrillWords =
    ceiling < DRILL_SCAN_MAX_RANK ? FREQUENCY_WORDS.slice(ceiling, DRILL_SCAN_MAX_RANK) : []

  const drillPools: Record<DifficultyBand, CandidateScore[]> = { easy: [], medium: [], hard: [] }
  for (const band of ["easy", "medium", "hard"] as DifficultyBand[]) {
    pools[band].sort((a, b) => b.finalScore - a.finalScore)
    drillPools[band] = pools[band]
      .filter((c) => c.learningValue >= DRILL_MIN_LEARNING_VALUE)
      .sort((a, b) => b.learningValue - a.learningValue || b.finalScore - a.finalScore)
  }

  for (const word of extendedDrillWords) {
    const probe = scoreCandidateWord(word, context, [])
    if (probe.learningValue < DRILL_MIN_LEARNING_VALUE) continue
    const band = resolveBand(word, probe.effectiveDifficulty)
    const slotScore = scoreCandidateWord(word, context, [], band)
    slotScore.band = band
    drillPools[band].push(slotScore)
  }
  for (const band of ["easy", "medium", "hard"] as DifficultyBand[]) {
    drillPools[band].sort(
      (a, b) => b.learningValue - a.learningValue || b.finalScore - a.finalScore
    )
  }

  scoredPoolCache = { key, pools, drillPools }
  return scoredPoolCache
}

/**
 * Builds a smooth sequence curve pattern of difficulty bands for the session.
 */
export function buildSequencePattern(
  count: number,
  state: UserStateCategory = "stable",
  seed: number = 42
): DifficultyBand[] {
  void seed // reserved for future pattern jitter; kept for API stability
  const dist = STATE_DISTRIBUTIONS[state] || STATE_DISTRIBUTIONS.stable

  const hardCount = Math.round(count * dist.hard)
  const mediumCount = Math.round(count * dist.medium)
  const easyCount = Math.max(1, count - hardCount - mediumCount)

  const pattern: DifficultyBand[] = []
  let placedHard = 0
  let placedMed = 0
  let placedEasy = 0

  // Interval spacing to prevent bunching of hard words
  const hardInterval = hardCount > 0 ? Math.max(3, Math.floor(count / hardCount)) : count + 1
  const medInterval = mediumCount > 0 ? Math.max(2, Math.floor(count / (mediumCount + 1))) : count + 1

  // Sandwich curve: easy warm-up ramp for every state, forced easy cool-down
  // in the final stretch. Sessions start and end on a win (peak-end rule).
  const warmupCount =
    state === "calibrating"
      ? Math.min(12, count)
      : state === "struggling"
      ? Math.min(8, count)
      : Math.min(6, count)
  const cooldownCount = Math.max(1, Math.floor(count * 0.1))
  const cooldownStart = Math.max(warmupCount, count - cooldownCount)

  for (let i = 0; i < count; i++) {
    if (i < warmupCount || i >= cooldownStart) {
      pattern.push("easy")
      placedEasy++
      continue
    }

    // Check if hard slot
    const isHardSlot =
      (i + 1) % hardInterval === 0 && placedHard < hardCount && i > 0 && pattern[i - 1] !== "hard"

    // Check if medium slot
    const isMedSlot =
      (i + 1) % medInterval === 0 &&
      placedMed < mediumCount &&
      (!pattern[i - 1] || pattern[i - 1] === "easy")

    if (isHardSlot) {
      pattern.push("hard")
      placedHard++
    } else if (isMedSlot) {
      pattern.push("medium")
      placedMed++
    } else if (placedEasy < easyCount) {
      pattern.push("easy")
      placedEasy++
    } else if (placedMed < mediumCount) {
      pattern.push("medium")
      placedMed++
    } else {
      pattern.push("easy")
    }
  }

  return pattern
}

/**
 * Uniform-random walk over the most frequent words with strict no-repeat
 * enforcement. Used for brand-new users and when the adaptive engine is
 * disabled — this mirrors monkeytype's default (uniform over top-200), the
 * empirically smoothest baseline, which everything else builds on.
 */
export function generateFrequencySequence(
  count: number,
  seed: number = 42,
  language: LanguageId = "en",
  poolSize?: number
): string[] {
  if (count <= 0) return []
  const rng = mulberry32(seed)
  const ceiling = poolSize ?? COLD_START_POOL_SIZE
  const fullPool = getLanguagePool(language)
  const limit = Math.min(ceiling, fullPool.length)
  const pool = limit < fullPool.length ? fullPool.slice(0, limit) : fullPool

  const sequence: string[] = []
  while (sequence.length < count) {
    let choice = pool[Math.floor(rng() * pool.length)] || FREQUENCY_WORDS[0]
    // No immediate repeats — redraw up to 6 times, then accept
    for (let attempt = 0; attempt < 6; attempt++) {
      const prev1 = sequence[sequence.length - 1]
      const prev2 = sequence[sequence.length - 2]
      if (choice !== prev1 && choice !== prev2) break
      choice = pool[Math.floor(rng() * pool.length)] || choice
    }
    sequence.push(choice)
  }
  return sequence
}

/**
 * Generates an optimized, personalized sequence of words according to the user profile and context.
 */
export function generateAdaptiveSequence(
  count: number = 30,
  context: GenerationContext = { count: 30 }
): string[] {
  if (count <= 0) return []
  const seed = context.seed ?? 42
  const rng = mulberry32(seed)
  const userState = context.userState
  const stateCategory = userState?.state ?? "calibrating"

  // Cold start: pure Zipf walk over the top-200 — no telemetry yet to adapt with
  if ((context.testCount ?? 0) < COLD_START_TEST_THRESHOLD) {
    return generateFrequencySequence(count, seed, context.language ?? "en")
  }

  // 1. Generate the difficulty band sequence curve
  const bandPattern = buildSequencePattern(count, stateCategory, seed)

  // 2. Scored band pools (cached across generations per profile version)
  const poolEntry = getScoredPools(context)
  const scoredPool = poolEntry.pools

  /**
   * Gentle rank nudge — a tie-breaker toward common words, NOT a dominant
   * prior. Frequency preference primarily lives in performanceValue; sampling
   * stays close to uniform so tests keep monkeytype-like word variety.
   */
  const rankWeightCache = new Map<string, number>()
  const rankNudgeOf = (word: string): number => {
    const cached = rankWeightCache.get(word)
    if (cached !== undefined) return cached
    const rank = getWordRank(word) ?? Number.MAX_SAFE_INTEGER
    const nudge = Math.max(0.75, 1.08 - rank / 2500)
    rankWeightCache.set(word, nudge)
    return nudge
  }

  // Practice vocabulary: score set members once so they can slot into
  // matching band positions at a high draw rate (muscle-memory loop).
  const PRACTICE_DRAW_RATE = 0.6
  const practiceByBand: Record<DifficultyBand, string[]> = { easy: [], medium: [], hard: [] }
  for (const word of context.practiceSet || []) {
    if (!word) continue
    const probe = scoreCandidateWord(word, context, [])
    practiceByBand[resolveBand(word, probe.effectiveDifficulty)].push(word)
  }
  const recentPractice: string[] = []

  // Collocation injection points: mid-section only, spaced out, never at edges.
  // Keyed off cold-start (not calibration state) — pairs are built from
  // ultra-frequent words and benefit every user equally.
  const pastColdStart = (context.testCount ?? 0) >= COLD_START_TEST_THRESHOLD
  const injectionSlots = new Set<number>()
  if (pastColdStart && count >= 12) {
    let cursor = Math.max(2, Math.floor(count * 0.2))
    const end = Math.floor(count * 0.85)
    while (cursor < end - 1) {
      if (rng() < COLLOCATION_RATE) {
        injectionSlots.add(cursor)
        cursor += 3
      } else {
        cursor++
      }
    }
  }

  // Weakness drill slots: a fixed ~15% dosage of mid-sequence slots reserved
  // for targeted practice. Independent of band structure so drilling works
  // even when the whole vocabulary is frequency-easy. Skipped entirely for
  // calibrating users and users with no matching weaknesses.
  const DRILL_RATE = 0.15
  const drillSlots = new Set<number>()
  const hasDrillableWeaknesses = (["easy", "medium", "hard"] as DifficultyBand[]).some(
    (b) => poolEntry.drillPools[b].length > 0
  )
  if (hasDrillableWeaknesses && count >= 8) {
    let cursor = Math.max(2, Math.floor(count * 0.2))
    const end = Math.floor(count * 0.85)
    let drillsPlaced = 0
    const maxDrills = Math.max(1, Math.round(count * DRILL_RATE))
    while (cursor < end && drillsPlaced < maxDrills) {
      if (!injectionSlots.has(cursor)) {
        drillSlots.add(cursor)
        drillsPlaced++
        cursor += 3
      } else {
        cursor++
      }
    }
  }

  // 3. Construct sequence with dynamic repetition avoidance and weighted sampling
  const sequence: string[] = []
  const usedCounts: Record<string, number> = {}

  for (let i = 0; sequence.length < count && i < count; i++) {
    const targetBand = bandPattern[i] || "easy"

    // Practice draw: ~60% of slots come from the muscle-memory vocabulary,
    // matched to the slot's difficulty band, avoiding the last 4 picks.
    const practiceCandidates = (practiceByBand[targetBand] || []).filter(
      (w) => !recentPractice.includes(w)
    )
    if (
      practiceCandidates.length > 0 &&
      !injectionSlots.has(i) &&
      rng() < PRACTICE_DRAW_RATE
    ) {
      const pick = practiceCandidates[Math.floor(rng() * practiceCandidates.length)]
      sequence.push(pick)
      usedCounts[pick] = (usedCounts[pick] || 0) + 1
      recentPractice.push(pick)
      if (recentPractice.length > 4) recentPractice.shift()
      continue
    }

    // Collocation injection: two natural words filling consecutive slots
    if (injectionSlots.has(i) && sequence.length + 2 <= count) {
      const prevForPair = sequence[sequence.length - 1]
      const secondPrev = sequence[sequence.length - 2]
      const eligiblePairs = COLLOCATION_PAIRS.filter(
        (p) => p[0] !== prevForPair && p[1] !== prevForPair && p[1] !== secondPrev
      )
      const pairPool = eligiblePairs.length > 0 ? eligiblePairs : COLLOCATION_PAIRS
      const pair = pairPool[Math.floor(rng() * pairPool.length)]
      sequence.push(pair[0], pair[1])
      usedCounts[pair[0]] = (usedCounts[pair[0]] || 0) + 1
      usedCounts[pair[1]] = (usedCounts[pair[1]] || 0) + 1
      continue
    }

    // Weakness drill draw: pick from learning-ranked candidates
    if (drillSlots.has(i)) {
      let drillSource = poolEntry.drillPools[targetBand]
      if (!drillSource || drillSource.length === 0) {
        drillSource =
          poolEntry.drillPools.easy.length > 0
            ? poolEntry.drillPools.easy
            : poolEntry.drillPools.medium.length > 0
            ? poolEntry.drillPools.medium
            : poolEntry.drillPools.hard
      }
      if (drillSource && drillSource.length > 0) {
        const drillCandidates = drillSource.slice(0, Math.min(10, drillSource.length))
        const prevWordD = sequence[sequence.length - 1]
        const weighted = drillCandidates.map((cand) => {
          let weight = cand.learningValue * 2 + cand.finalScore + 1.0
          weight *= rankNudgeOf(cand.word)
          const used = usedCounts[cand.word] || 0
          if (used > 0) weight /= Math.pow(4, used)
          if (prevWordD) {
            const lastIdxD = sequence.lastIndexOf(cand.word)
            if (lastIdxD !== -1 && sequence.length - lastIdxD <= 6) weight *= 0.02
            if (cand.word[0] === prevWordD[prevWordD.length - 1]) weight *= SAME_BOUNDARY_CHAR_FACTOR
          }
          return { word: cand.word, weight }
        })
        const totalW = weighted.reduce((s, c) => s + c.weight, 0)
        let drillChoice = weighted[0]?.word
        if (totalW > 0) {
          let rD = rng() * totalW
          for (const item of weighted) {
            rD -= item.weight
            if (rD <= 0) {
              drillChoice = item.word
              break
            }
          }
        }
        if (drillChoice) {
          sequence.push(drillChoice)
          usedCounts[drillChoice] = (usedCounts[drillChoice] || 0) + 1
          continue
        }
      }
    }

    let pool = scoredPool[targetBand]

    // Fallback if pool is too small
    if (!pool || pool.length === 0) {
      pool =
        scoredPool.easy.length > 0
          ? scoredPool.easy
          : scoredPool.medium.length > 0
          ? scoredPool.medium
          : scoredPool.hard
    }
    if (!pool || pool.length === 0) break

    // Top-k selection: wide window so tests rotate through real vocabulary
    // variety instead of collapsing onto a handful of top-scored words
    const topKFraction = 0.4
    const topKSize = Math.max(8, Math.min(60, Math.floor(pool.length * topKFraction)))
    const candidates = pool.slice(0, topKSize)

    const prevWord = sequence[sequence.length - 1]
    const prevLen = prevWord ? prevWord.length : 0
    const prevLastChar = prevWord ? prevWord[prevWord.length - 1] : ""

    // Calculate weights: final score × zipf prior × rhythm penalties
    const weightedCandidates = candidates.map((cand) => {
      let weight = Math.max(0.01, cand.finalScore + 1.0) // Shift to positive

      // Zipf prior — frequent words dominate exactly like real language
      weight *= rankNudgeOf(cand.word)

      // Repetition dampening in active test
      const used = usedCounts[cand.word] || 0
      if (used > 0) {
        weight /= Math.pow(4, used)
      }

      // Proximity penalty (distance from last occurrence)
      const lastIdx = sequence.lastIndexOf(cand.word)
      if (lastIdx !== -1) {
        const dist = sequence.length - lastIdx
        if (dist <= 4) weight *= 0.05
        else if (dist <= 8) weight *= 0.25
        else if (dist <= 15) weight *= 0.6
      }

      // Length-variance cap: keep rhythm unless the slot wants a challenge
      if (prevWord && targetBand !== "hard") {
        const jump = Math.abs(cand.word.length - prevLen)
        if (jump > MAX_LENGTH_JUMP) weight *= 0.3
      }

      // Boundary smoothing between consecutive words
      if (prevWord) {
        const firstChar = cand.word[0]
        if (firstChar === prevLastChar) weight *= SAME_BOUNDARY_CHAR_FACTOR
        else if (AWKWARD_LETTERS.has(firstChar) && AWKWARD_LETTERS.has(prevLastChar)) {
          weight *= AWKWARD_BOUNDARY_FACTOR
        }
      }

      return { word: cand.word, weight }
    })

    // Weighted random selection with strict no-immediate-repeat enforcement
    const totalWeight = weightedCandidates.reduce((sum, c) => sum + c.weight, 0)
    let choice = pool[0]?.word || FREQUENCY_WORDS[i % FREQUENCY_WORDS.length]

    const banned = new Set<string>()
    if (sequence.length >= 1) banned.add(sequence[sequence.length - 1])
    if (sequence.length >= 2) banned.add(sequence[sequence.length - 2])

    if (totalWeight > 0) {
      for (let attempt = 0; attempt < 6; attempt++) {
        let r = rng() * totalWeight
        let picked = choice
        for (const item of weightedCandidates) {
          r -= item.weight
          if (r <= 0) {
            picked = item.word
            break
          }
        }
        choice = picked
        if (!banned.has(choice)) break
      }
    }

    sequence.push(choice)
    usedCounts[choice] = (usedCounts[choice] || 0) + 1
  }

  // 4. Easter egg seeding: occasionally hide one undiscovered secret word
  // mid-sequence so users stumble onto effects naturally while practicing.
  // Never touches warm-up slots or the final word; skipped entirely for
  // calibrating users to keep their first sessions clean.
  if (stateCategory !== "calibrating" && count >= 12 && rng() < 0.4) {
    const slotStart = Math.max(2, Math.floor(count * 0.25))
    const slotEnd = Math.max(slotStart, Math.floor(count * 0.75))
    const slotIdx = slotStart + Math.floor(rng() * (slotEnd - slotStart))
    const eggWord = pickEasterEggInjection(rng, sequence)
    if (eggWord && !sequence.includes(eggWord)) {
      sequence[slotIdx] = eggWord
    }
  }

  return sequence
}
