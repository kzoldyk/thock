export type CharState = 'untyped' | 'correct' | 'incorrect' | 'extra' | 'current'

export interface Char {
  char: string
  state: CharState
}

export interface WordData {
  chars: Char[]
  isCurrent: boolean
  isCompleted: boolean
}

export type SessionState = 'idle' | 'typing' | 'finished'

export interface TypingStats {
  wpm: number
  raw: number
  accuracy: number
  consistency: number
  mistakes: number
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
  background: string
  foreground: string
  muted: string
  accent: string
  fontClass: string
}

export type LayoutId = '60' | '75'
