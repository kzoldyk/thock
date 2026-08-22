import type {
  GenerationContext,
  DifficultyBand,
  CandidateScore,
  UserStateCategory,
} from "./types"
import { scoreCandidateWord } from "./candidate-scoring"
import { commonWords } from "../words"
import { pickEasterEggInjection } from "../easter-eggs"

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
   // Extended feel-fast set: more short common words for early familiarity
   "mist", "rim", "jaw", "week", "cry", "pod", "twin", "boot", "blink",
   "toast", "born", "pixel", "pack", "five", "chill", "score", "junk",
   "seat", "want", "sum", "nod", "had", "max", "four", "jog", "copy",
   "lot", "east", "chest", "both", "bonus", "echo", "suit", "soft",
   "mile", "lip", "sharp", "see", "vital", "fur", "plane", "item",
   "poem", "write", "good", "owl", "coin", "then", "topic", "width",
   "below", "use", "mouth", "self", "duck", "kiss", "front", "peek",
   "sun", "mouse", "habit", "reply", "chart", "man", "same", "length",
   "safe", "round", "bay", "room", "ring", "just", "tag", "lap", "nap",
   "cool", "bone", "floor", "park", "stem", "catch", "gray", "know",
   "food", "fork", "roof", "palm", "road", "order", "elbow", "did",
   "load", "cross", "weak", "check", "truth", "cake", "power", "age",
   "green", "tidy", "skin", "feet", "dove", "pop", "spy", "my", "sky",
   "dirt", "cup", "click", "human", "cream", "might", "spring", "bold",
   "point", "year", "top", "exit", "able", "log", "sip", "look", "sack",
   "blind", "tab", "animal", "tide", "swim", "alone", "kid", "ask",
   "base", "line", "fact", "black", "sleep", "sly", "buy", "odd",
   "fair", "rage", "buzz", "hope", "cab", "note", "son", "cloud",
   "scar", "egg", "miss", "ego", "wide", "way", "wave", "cable", "pick",
   "ice", "gum", "curl", "rub", "quick", "angle", "told", "jar", "tent",
   "lamp", "noun", "guest", "bean", "brave", "rag", "can", "mom", "add",
   "text", "scene", "snake", "bulk", "tin", "arm", "mask", "ball",
   "jury", "moon", "chain", "guide", "very", "curve", "row", "aim",
   "camp", "wit", "hold", "zone", "beach", "job", "alarm", "train",
   "task", "slight", "inner", "volt", "land", "blow", "phrase", "real",
   "tool", "accent", "shore", "access", "little", "spray", "gap",
   "gain", "letter", "wall", "also", "grain", "too", "chop", "gold",
   "wish", "body", "day", "since", "ski", "chief", "track", "issue",
   "deep", "tea", "right", "but", "grass", "joy", "help", "guess",
   "fist", "term", "two", "fox", "boss", "oil", "mark", "kit", "mother",
   "board", "thumb", "first", "milk", "rest", "mix", "press", "raid",
   "tip", "mean", "menu", "ram", "it", "voice", "icon", "piece",
   "magic", "lean", "wrist", "smile", "trade", "lemon", "index", "seek",
   "leg", "thick", "agree", "tank", "clue", "when", "read", "pan",
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

  const isNewUser = (context.testCount ?? 0) < 15
  const candidateWords = isNewUser
    ? commonWords.filter((w) => FLOW_WORDS.has(w.toLowerCase()))
    : commonWords

  for (const word of candidateWords.length > 0 ? candidateWords : commonWords) {
    // Two passes are intentional: pass 1 detects the band, pass 2 re-weights
    // scoring FOR that band so weakness-drilling concentrates in medium/hard
    // pools instead of flooding easy slots.
    const bandScore = scoreCandidateWord(word, context, [])
    const slotScore = scoreCandidateWord(word, context, [], bandScore.band)
    scoredPool[bandScore.band].push(slotScore)
  }

  // Sort each pool by finalScore descending
  for (const band of ["easy", "medium", "hard"] as DifficultyBand[]) {
    scoredPool[band].sort((a, b) => b.finalScore - a.finalScore)
  }

  // Practice vocabulary: score set members once so they can slot into
  // matching band positions at a high draw rate (muscle-memory loop).
  const PRACTICE_DRAW_RATE = 0.6
  const practiceByBand: Record<DifficultyBand, string[]> = { easy: [], medium: [], hard: [] }
  for (const word of context.practiceSet || []) {
    if (!word) continue
    practiceByBand[scoreCandidateWord(word, context, []).band].push(word)
  }
  const recentPractice: string[] = []

  // 3. Construct sequence with dynamic repetition avoidance and softmax-like top-k sampling
  const sequence: string[] = []
  const usedCounts: Record<string, number> = {}

  for (let i = 0; i < count; i++) {
    const targetBand = bandPattern[i] || "easy"

    // Practice draw: ~60% of slots come from the muscle-memory vocabulary,
    // matched to the slot's difficulty band, avoiding the last 4 picks.
    const practiceCandidates = (practiceByBand[targetBand] || []).filter(
      (w) => !recentPractice.includes(w)
    )
    if (practiceCandidates.length > 0 && rng() < PRACTICE_DRAW_RATE) {
      const pick = practiceCandidates[Math.floor(rng() * practiceCandidates.length)]
      sequence.push(pick)
      usedCounts[pick] = (usedCounts[pick] || 0) + 1
      recentPractice.push(pick)
      if (recentPractice.length > 4) recentPractice.shift()
      continue
    }

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
