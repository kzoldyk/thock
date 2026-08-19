import type {
  GenerationContext,
  DifficultyBand,
  CandidateScore,
  UserStateCategory,
} from "./types"
import { scoreCandidateWord } from "./candidate-scoring"
import { commonWords } from "../words"

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
  calibrating: { easy: 0.7, medium: 0.2, hard: 0.1 },
  struggling: { easy: 0.85, medium: 0.12, hard: 0.03 },
  stable: { easy: 0.7, medium: 0.22, hard: 0.08 },
  flow: { easy: 0.58, medium: 0.27, hard: 0.15 },
  mastering: { easy: 0.45, medium: 0.35, hard: 0.2 },
}

/**
 * Builds a smooth sequence curve pattern of difficulty bands for the session.
 */
export function buildSequencePattern(
  count: number,
  state: UserStateCategory = "stable",
  seed: number = 42
): DifficultyBand[] {
  const rng = mulberry32(seed)
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

  for (let i = 0; i < count; i++) {
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

  // 1. Generate the difficulty band sequence curve
  const bandPattern = buildSequencePattern(count, stateCategory, seed)

  // 2. Pre-score candidates into pool buckets
  const scoredPool: Record<DifficultyBand, CandidateScore[]> = {
    easy: [],
    medium: [],
    hard: [],
  }

  for (const word of commonWords) {
    const defaultScore = scoreCandidateWord(word, context, [])
    const band = defaultScore.band
    const slotScore = scoreCandidateWord(word, context, [], band)
    scoredPool[band].push(slotScore)
  }

  // Sort each pool by finalScore descending
  for (const band of ["easy", "medium", "hard"] as DifficultyBand[]) {
    scoredPool[band].sort((a, b) => b.finalScore - a.finalScore)
  }

  // 3. Construct sequence with dynamic repetition avoidance and softmax-like top-k sampling
  const sequence: string[] = []
  const usedCounts: Record<string, number> = {}

  for (let i = 0; i < count; i++) {
    const targetBand = bandPattern[i] || "easy"
    let pool = scoredPool[targetBand]

    // Fallback if pool is too small
    if (!pool || pool.length === 0) {
      pool = scoredPool.easy.length > 0 ? scoredPool.easy : scoredPool.medium
    }

    // Filter candidate list with dynamic penalty against current sequence
    // Top-k selection (take top 15-25% scorers to provide variety without sacrificing quality)
    const topKSize = Math.max(5, Math.min(25, Math.floor(pool.length * 0.25)))
    const candidates = pool.slice(0, topKSize)

    // Calculate weights with repetition penalty applied to current sequence position
    const weightedCandidates = candidates.map((cand) => {
      let weight = Math.max(0.01, cand.finalScore + 1.0) // Shift to positive

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

      return { word: cand.word, weight }
    })

    // Weighted random selection
    const totalWeight = weightedCandidates.reduce((sum, c) => sum + c.weight, 0)
    let choice = pool[0]?.word || commonWords[i % commonWords.length]

    if (totalWeight > 0) {
      let r = rng() * totalWeight
      for (const item of weightedCandidates) {
        r -= item.weight
        if (r <= 0) {
          choice = item.word
          break
        }
      }
    }

    sequence.push(choice)
    usedCounts[choice] = (usedCounts[choice] || 0) + 1
  }

  return sequence
}
