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
  calibrating: { easy: 0.92, medium: 0.07, hard: 0.01 },
  struggling: { easy: 0.88, medium: 0.1, hard: 0.02 },
  stable: { easy: 0.72, medium: 0.2, hard: 0.08 },
  flow: { easy: 0.58, medium: 0.27, hard: 0.15 },
  mastering: { easy: 0.45, medium: 0.35, hard: 0.2 },
}

/** Words that feel fast to type — short, common, home-row friendly */
const FLOW_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy",
  "did", "its", "let", "may", "put", "say", "she", "too", "use", "run",
  "eat", "far", "hot", "lot", "low", "mix", "net", "red", "set", "sun",
  "top", "win", "yes", "yet", "big", "car", "cat", "dog", "fun", "go",
  "hi", "job", "key", "law", "map", "men", "pay", "pop", "raw", "sea",
  "sit", "sky", "try", "war", "web", "add", "age", "air", "arm", "art",
  "bad", "bag", "bed", "bee", "box", "bus", "buy", "cap", "cup", "cut",
  "dry", "due", "egg", "end", "eye", "fit", "fix", "fly", "gap", "gas",
  "god", "guy", "hit", "ice", "ink", "joy", "kid", "lay", "leg", "lie",
  "lip", "log", "mad", "met", "mid", "mix", "mud", "nod", "oak", "oil",
  "pad", "pan", "pat", "pen", "pet", "pie", "pin", "pot", "rap", "ray",
  "row", "rub", "sad", "sap", "saw", "sea", "sin", "sip", "six", "ski",
  "so", "sob", "sod", "son", "sop", "sow", "soy", "spa", "spy", "sum",
  "tab", "tag", "tan", "tap", "tax", "tea", "ten", "tie", "tin", "tip",
  "to", "toe", "ton", "tow", "toy", "van", "vat", "vet", "via", "wet",
  "why", "wig", "wit", "woe", "wow", "yak", "yam", "yap", "yew", "yip",
  "zip", "zap", "zen", "time", "like", "make", "take", "come", "give",
  "look", "work", "know", "want", "good", "best", "fast", "easy", "love",
  "help", "keep", "feel", "play", "open", "read", "call", "hand", "high",
  "long", "last", "next", "left", "real", "sure", "safe", "calm", "warm",
  "cool", "soft", "hard", "deep", "wide", "free", "live", "move", "talk",
  "walk", "wait", "stop", "start", "flow", "type", "word", "test", "game",
  "team", "home", "food", "book", "room", "door", "wall", "tree", "rain",
  "snow", "wind", "fire", "gold", "blue", "pink", "gray", "dark", "light",
  "clean", "quick", "happy", "great", "small", "large", "short", "sweet",
  "fresh", "clear", "smart", "lucky", "early", "later", "today", "night",
])

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
    // Warm-up ramp: first words are always easy for new/calibrating users
    const warmupCount = state === "calibrating" ? Math.min(12, count) : state === "struggling" ? Math.min(8, count) : 0
    if (i < warmupCount) {
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

  const isNewUser = (context.testCount ?? 0) < 8
  const candidateWords = isNewUser
    ? commonWords.filter((w) => FLOW_WORDS.has(w.toLowerCase()))
    : commonWords

  for (const word of candidateWords.length > 0 ? candidateWords : commonWords) {
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
    // Top-k selection — tighter pool for new users keeps words familiar and fast
    const topKFraction = isNewUser ? 0.15 : 0.25
    const topKSize = Math.max(5, Math.min(25, Math.floor(pool.length * topKFraction)))
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
