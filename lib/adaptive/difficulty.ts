import type { UserTypingProfile, DifficultyBand } from "./types"
import { extractNGrams } from "./ngram-profile"

// Same-finger key transitions on standard QWERTY that introduce physical awkwardness
const AWKWARD_SAME_FINGER_BIGRAMS = new Set([
  "ed", "de", "ce", "ec", "un", "nu", "my", "ym", "br", "rb", "fr", "rf", "gt", "tg",
  "hy", "yh", "ju", "uj", "ki", "ik", "lo", "ol", "ws", "sw", "za", "az", "xs", "sx",
  "cd", "dc", "vf", "fv", "bg", "gb", "nh", "hn", "mj", "jm"
])

// Difficult/pinky/reach letters
const AWKWARD_LETTERS = new Set(["q", "z", "x", "j", "v", "k", "p", "b"])

/**
 * Computes the intrinsic physical and morphological typing difficulty of a word [0, 1].
 */
export function intrinsicDifficulty(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "")
  if (clean.length === 0) return 0.2

  // 1. Length factor: 2-3 chars ~ 0.15-0.25, 4-6 chars ~ 0.35-0.5, 7-10 chars ~ 0.65-0.85
  const lengthFactor = Math.min(1.0, Math.max(0.1, (clean.length - 1) / 10))

  // 2. Awkward/rare letter factor
  let awkwardLetterCount = 0
  for (let i = 0; i < clean.length; i++) {
    if (AWKWARD_LETTERS.has(clean[i])) {
      awkwardLetterCount++
    }
  }
  const letterDifficulty = Math.min(1.0, (awkwardLetterCount / clean.length) * 1.5)

  // 3. Awkward same-finger bigram transitions
  let awkwardBigramCount = 0
  for (let i = 0; i < clean.length - 1; i++) {
    const bg = clean.slice(i, i + 2)
    if (AWKWARD_SAME_FINGER_BIGRAMS.has(bg)) {
      awkwardBigramCount++
    }
  }
  const bigramDifficulty = Math.min(1.0, (awkwardBigramCount / Math.max(1, clean.length - 1)) * 1.8)

  const raw = lengthFactor * 0.4 + letterDifficulty * 0.35 + bigramDifficulty * 0.25
  return Math.max(0.05, Math.min(0.98, Math.round(raw * 100) / 100))
}

/**
 * Computes the user's personal typing difficulty for a word [0, 1] based on their historical telemetry.
 */
export function personalDifficulty(
  word: string,
  profile?: UserTypingProfile | null
): { difficulty: number; confidence: number } {
  if (!profile) {
    return { difficulty: intrinsicDifficulty(word), confidence: 0 }
  }

  const clean = word.toLowerCase().replace(/[^a-z]/g, "")
  const wProfile = profile.words[clean]

  // 1. Word-level difficulty
  let wordScore = 0.5
  let wordConf = 0
  if (wProfile && wProfile.attempts > 0) {
    const accDiff = (100 - wProfile.recentAccuracy) / 100
    const speedDiff = Math.max(0, 1 - wProfile.recentWpm / 100)
    wordScore = accDiff * 0.65 + speedDiff * 0.35
    wordConf = wProfile.confidence
  }

  // 2. Letter-level difficulty (from letter-grip)
  const letters = clean.split("")
  let letterDiffSum = 0
  let letterConfSum = 0
  for (const ch of letters) {
    const stat = profile.letters[ch]
    if (stat && stat.totalTyped > 0) {
      const gripDiff = (100 - stat.gripScore) / 100
      const accDiff = (100 - stat.accuracy) / 100
      letterDiffSum += gripDiff * 0.6 + accDiff * 0.4
      letterConfSum += Math.min(1.0, stat.totalTyped / 10)
    } else {
      letterDiffSum += AWKWARD_LETTERS.has(ch) ? 0.6 : 0.25
      letterConfSum += 0
    }
  }
  const avgLetterDiff = letters.length > 0 ? letterDiffSum / letters.length : 0.5
  const avgLetterConf = letters.length > 0 ? letterConfSum / letters.length : 0

  // 3. N-gram level difficulty
  const { bigrams, trigrams } = extractNGrams(clean)
  let ngramDiffSum = 0
  let ngramCount = 0
  let ngramConfSum = 0

  for (const bg of bigrams) {
    const stat = profile.ngrams[bg]
    if (stat && stat.attempts > 0) {
      const accDiff = (100 - stat.recentAccuracy) / 100
      const latDiff = Math.max(0, Math.min(1.0, (stat.recentLatencyMs - 120) / 250))
      ngramDiffSum += accDiff * 0.6 + latDiff * 0.4
      ngramConfSum += stat.confidence
      ngramCount++
    }
  }

  for (const tg of trigrams) {
    const stat = profile.ngrams[tg]
    if (stat && stat.attempts > 0) {
      const accDiff = (100 - stat.recentAccuracy) / 100
      const latDiff = Math.max(0, Math.min(1.0, (stat.recentLatencyMs - 240) / 450))
      ngramDiffSum += accDiff * 0.6 + latDiff * 0.4
      ngramConfSum += stat.confidence
      ngramCount++
    }
  }

  const avgNgramDiff = ngramCount > 0 ? ngramDiffSum / ngramCount : avgLetterDiff
  const avgNgramConf = ngramCount > 0 ? ngramConfSum / ngramCount : avgLetterConf

  // Composite personal difficulty
  let combinedDiff = 0.5
  let combinedConf = 0

  if (wordConf > 0.4) {
    // Word profile has high confidence: rely predominantly on word observation
    combinedDiff = wordScore * 0.75 + avgNgramDiff * 0.15 + avgLetterDiff * 0.1
    combinedConf = wordConf * 0.85 + avgNgramConf * 0.1 + avgLetterConf * 0.05
  } else {
    // Sub-word n-gram and letter patterns guide difficulty
    combinedDiff = wordScore * 0.25 + avgNgramDiff * 0.45 + avgLetterDiff * 0.3
    combinedConf = wordConf * 0.25 + avgNgramConf * 0.45 + avgLetterConf * 0.3
  }

  combinedDiff = Math.max(0, Math.min(1.0, Math.round(combinedDiff * 100) / 100))
  combinedConf = Math.max(0, Math.min(1.0, Math.round(combinedConf * 100) / 100))

  return { difficulty: combinedDiff, confidence: combinedConf }
}

/**
 * Computes effective difficulty by combining intrinsic and personal difficulty.
 * Personal difficulty's weight increases proportionally to observation confidence.
 */
export function effectiveDifficulty(
  word: string,
  profile?: UserTypingProfile | null
): number {
  const intrinsic = intrinsicDifficulty(word)
  const { difficulty: personal, confidence } = personalDifficulty(word, profile)

  // Weight of personal profile grows with confidence (up to 92% weight when confident)
  const personalWeight = Math.min(0.92, 0.15 + 0.8 * confidence)
  const effective = (1 - personalWeight) * intrinsic + personalWeight * personal

  return Math.max(0.01, Math.min(0.99, Math.round(effective * 100) / 100))
}

/**
 * Maps a difficulty value [0, 1] to a DifficultyBand.
 */
export function classifyDifficultyBand(diff: number): DifficultyBand {
  if (diff < 0.38) return "easy"
  if (diff < 0.68) return "medium"
  return "hard"
}
