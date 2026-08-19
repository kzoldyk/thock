import type { LetterStat, UserGripProfile } from "../letter-grip"

export type AdaptiveStrategy = "balanced" | "performance" | "training" | "challenge"

export type UserStateCategory =
  | "calibrating"
  | "struggling"
  | "stable"
  | "flow"
  | "mastering"

export type DifficultyBand = "easy" | "medium" | "hard"

export interface WordAttempt {
  word: string
  startedAt: number
  completedAt: number
  durationMs: number
  expectedCharacters: number
  typedCharacters: number
  errors: number
  correctedErrors: number
  accuracy: number // 0 to 100
  wpm: number
  avgLatencyMs: number
  sessionId?: string
}

export interface WordProfile {
  word: string
  attempts: number
  avgWpm: number
  avgLatencyMs: number
  accuracy: number // 0 to 100
  recentWpm: number
  recentAccuracy: number
  consistency: number // 0 to 100
  confidence: number // 0 to 1
  trend: number // -1 to 1 (>0 improving, <0 degrading)
  lastSeenAt: number
}

export interface NGramProfile {
  ngram: string
  n: number // 1, 2, 3
  attempts: number
  avgLatencyMs: number
  recentLatencyMs: number
  accuracy: number // 0 to 100
  recentAccuracy: number
  errorCount: number
  confidence: number // 0 to 1
  trend: number // -1 to 1 (>0 improving, <0 degrading)
  lastSeenAt: number
}

export interface WeaknessItem {
  pattern: string
  type: "letter" | "bigram" | "trigram" | "word"
  weight: number // 0 to 1
  accuracy: number
  latencyMs: number
}

export interface UserTypingState {
  baselineWpm: number
  recentWpm: number
  baselineAccuracy: number
  recentAccuracy: number
  wpmTrend: number
  accuracyTrend: number
  consistency: number
  difficultyLevel: number // 0 to 1 (current target difficulty)
  confidence: number // 0 to 1
  momentumScore: number // 0 to 1
  state: UserStateCategory
}

export interface UserTypingProfile {
  letters: Record<string, LetterStat>
  words: Record<string, WordProfile>
  ngrams: Record<string, NGramProfile>
  weaknesses: WeaknessItem[]
  testCount: number
  lastUpdatedAt: number
}

export interface CandidateScore {
  word: string
  performanceValue: number // 0 to 1
  learningValue: number // 0 to 1
  improvementValue: number // 0 to 1
  diversityValue: number // 0 to 1
  explorationValue: number // 0 to 1
  repetitionPenalty: number // 0 to 1
  excessiveDifficultyPenalty: number // 0 to 1
  finalScore: number
  effectiveDifficulty: number // 0 to 1
  band: DifficultyBand
}

export interface GenerationContext {
  count: number
  mode?: "time" | "words" | "quotes" | "code"
  strategy?: AdaptiveStrategy
  seed?: number
  recentWords?: string[]
  userState?: UserTypingState
  userProfile?: UserTypingProfile | null
  gripProfile?: UserGripProfile | null
  testCount?: number
  complex?: boolean
}
