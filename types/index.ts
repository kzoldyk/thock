export type CharState = 'untyped' | 'correct' | 'incorrect' | 'extra' | 'current'

export interface Char {
  char: string
  state: CharState
}

export interface WordData {
  chars: Char[]
  isCurrent: boolean
  isCompleted: boolean
  isPerfect?: boolean
}

export type SessionState = 'idle' | 'typing' | 'finished'

export type FontFamily =
  | "geist"
  | "inter"
  | "sf-pro"
  | "jetbrains-mono"
  | "ibm-plex-mono"
  | "source-code-pro"

export interface TypingStats {
  wpm: number
  averageWpm: number
  liveWpm: number
  raw: number
  accuracy: number
  consistency: number
  mistakes: number
  wordMistakes: number
  streak: number
  elapsedMs: number
  totalTyped: number
  correctChars: number
}

export interface TypingSession {
  words: WordData[]
  targetText: string[]
  currentWordIndex: number
  currentCharIndex: number
  state: SessionState
  stats: TypingStats
  startTime: number | null
  keystrokes: Keystroke[]
  errors: number
  extraChars: number
}

export interface Keystroke {
  key: string
  code: string
  isCorrect: boolean
  timestamp: number
  target?: string
}

export interface KeyDef {
  code: string
  label: string
  width: number
  row: number
  x: number
}

export interface LayoutDefinition {
  id: string
  name: string
  keys: KeyDef[]
  totalColumns: number
  rows: number
}

export interface SoundPack {
  id: string
  name: string
  description: string
  path?: string
  switchType?: string
  down?: string[]
  up?: string[]
}

export interface SwitchProfile {
  id: string
  name: string
  packId: string
}

export interface KeyboardTheme {
  id: string
  name: string
  keycap: string
  keycapActive: string
  keycapPressed: string
  case: string
  plate: string
  label: string
  labelActive: string
  lightColor: string
  lightIntensity: number
  ambientColor: string
  modifierBg?: string
  modifierLabel?: string
  numberBg?: string
  numberLabel?: string
  escBg?: string
  escLabel?: string
}

export interface AppTheme {
  id: string
  name: string
  mode: "light" | "dark"
  background: string
  foreground: string
  muted: string
  accent: string
  accentRgb: string
  fontClass: string
}

export type LayoutId = '60' | '75'

export interface TestRecord {
  id: string
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  mistakes: number
  streak: number
  elapsedMs: number
  totalTyped: number
  correctChars: number
  timeLimit: number
  mode: "time" | "words" | "quotes" | "code"
  createdAt: number
}

export interface ModeStatBreakdown {
  mode: string
  label: string
  testsCount: number
  bestWpm: number
  avgWpm: number
  avgAccuracy: number
  avgConsistency: number
  totalTimeSeconds: number
}

export interface SpeedBucket {
  label: string
  min: number
  max: number
  count: number
  percentage: number
}

export interface DiagnosticInsight {
  id: string
  type: "positive" | "warning" | "tip"
  title: string
  description: string
  metric?: string
}

export interface UserStatsSummary {
  totalTests: number
  totalTimeSeconds: number
  totalTypedChars: number
  totalWords: number
  totalMistakes: number
  avgWpm: number
  bestWpm: number
  avgRawWpm: number
  bestRawWpm: number
  avgAccuracy: number
  bestAccuracy: number
  avgConsistency: number
  currentDailyStreak: number
  testsToday: number
  highAccuracyRatio: number // % of tests with >=98% accuracy
  speedImprovementRate: number // % improvement over first 5 tests
  speedBuckets: SpeedBucket[]
  modeBreakdowns: ModeStatBreakdown[]
  insights: DiagnosticInsight[]
  recentTests: TestRecord[]
}

