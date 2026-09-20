export type Hand = "left" | "right"
export type Finger = "pinky" | "ring" | "middle" | "index" | "thumb"

export interface FingerAssignment {
  id: string
  hand: Hand
  finger: Finger
  fingerName: string
  fingerNumber: number // 1: Thumb, 2: Index, 3: Middle, 4: Ring, 5: Pinky
  fingerOrdinal: string // "1st (Thumb)", "2nd (Index)", "3rd (Middle)", etc.
  shortCode: string // "L1" - "L5", "R1" - "R5"
  homeKey: string
  keys: string[]
  keyCodes: string[]
  color: string
}

export const FINGER_ASSIGNMENTS: Record<string, FingerAssignment> = {
  // Left Hand
  "left-pinky": {
    id: "left-pinky",
    hand: "left",
    finger: "pinky",
    fingerName: "Left Pinky",
    fingerNumber: 5,
    fingerOrdinal: "5th (Pinky)",
    shortCode: "L5",
    homeKey: "A",
    keys: ["`", "~", "1", "!", "q", "a", "z"],
    keyCodes: ["Backquote", "Digit1", "KeyQ", "KeyA", "KeyZ", "Tab", "CapsLock", "ShiftLeft"],
    color: "#f43f5e", // rose
  },
  "left-ring": {
    id: "left-ring",
    hand: "left",
    finger: "ring",
    fingerName: "Left Ring",
    fingerNumber: 4,
    fingerOrdinal: "4th (Ring)",
    shortCode: "L4",
    homeKey: "S",
    keys: ["2", "@", "w", "s", "x"],
    keyCodes: ["Digit2", "KeyW", "KeyS", "KeyX"],
    color: "#f97316", // orange
  },
  "left-middle": {
    id: "left-middle",
    hand: "left",
    finger: "middle",
    fingerName: "Left Middle",
    fingerNumber: 3,
    fingerOrdinal: "3rd (Middle)",
    shortCode: "L3",
    homeKey: "D",
    keys: ["3", "#", "e", "d", "c"],
    keyCodes: ["Digit3", "KeyE", "KeyD", "KeyC"],
    color: "#eab308", // amber
  },
  "left-index": {
    id: "left-index",
    hand: "left",
    finger: "index",
    fingerName: "Left Index",
    fingerNumber: 2,
    fingerOrdinal: "2nd (Index)",
    shortCode: "L2",
    homeKey: "F",
    keys: ["4", "$", "5", "%", "r", "t", "f", "g", "v", "b"],
    keyCodes: ["Digit4", "Digit5", "KeyR", "KeyT", "KeyF", "KeyG", "KeyV", "KeyB"],
    color: "#10b981", // emerald
  },
  "left-thumb": {
    id: "left-thumb",
    hand: "left",
    finger: "thumb",
    fingerName: "Left Thumb",
    fingerNumber: 1,
    fingerOrdinal: "1st (Thumb)",
    shortCode: "L1",
    homeKey: "Space",
    keys: [" "],
    keyCodes: ["Space"],
    color: "#64748b", // slate
  },

  // Right Hand
  "right-thumb": {
    id: "right-thumb",
    hand: "right",
    finger: "thumb",
    fingerName: "Right Thumb",
    fingerNumber: 1,
    fingerOrdinal: "1st (Thumb)",
    shortCode: "R1",
    homeKey: "Space",
    keys: [" "],
    keyCodes: ["Space"],
    color: "#64748b", // slate
  },
  "right-index": {
    id: "right-index",
    hand: "right",
    finger: "index",
    fingerName: "Right Index",
    fingerNumber: 2,
    fingerOrdinal: "2nd (Index)",
    shortCode: "R2",
    homeKey: "J",
    keys: ["6", "^", "7", "&", "y", "u", "h", "j", "n", "m"],
    keyCodes: ["Digit6", "Digit7", "KeyY", "KeyU", "KeyH", "KeyJ", "KeyN", "KeyM"],
    color: "#06b6d4", // cyan
  },
  "right-middle": {
    id: "right-middle",
    hand: "right",
    finger: "middle",
    fingerName: "Right Middle",
    fingerNumber: 3,
    fingerOrdinal: "3rd (Middle)",
    shortCode: "R3",
    homeKey: "K",
    keys: ["8", "*", "i", "k", ",", "<"],
    keyCodes: ["Digit8", "KeyI", "KeyK", "Comma"],
    color: "#3b82f6", // blue
  },
  "right-ring": {
    id: "right-ring",
    hand: "right",
    finger: "ring",
    fingerName: "Right Ring",
    fingerNumber: 4,
    fingerOrdinal: "4th (Ring)",
    shortCode: "R4",
    homeKey: "L",
    keys: ["9", "(", "o", "l", ".", ">"],
    keyCodes: ["Digit9", "KeyO", "KeyL", "Period"],
    color: "#8b5cf6", // indigo
  },
  "right-pinky": {
    id: "right-pinky",
    hand: "right",
    finger: "pinky",
    fingerName: "Right Pinky",
    fingerNumber: 5,
    fingerOrdinal: "5th (Pinky)",
    shortCode: "R5",
    homeKey: ";",
    keys: ["0", ")", "-", "_", "=", "+", "p", "[", "{", "]", "}", "\\", "|", ";", ":", "'", "\"", "/", "?"],
    keyCodes: [
      "Digit0", "Minus", "Equal", "KeyP", "BracketLeft", "BracketRight",
      "Backslash", "Semicolon", "Quote", "Slash", "Enter", "Backspace", "ShiftRight"
    ],
    color: "#ec4899", // pink
  },
}

// Pre-computed lookup tables for zero-lag rendering
const CHAR_TO_FINGER_MAP: Record<string, FingerAssignment> = {}
const CODE_TO_FINGER_MAP: Record<string, FingerAssignment> = {}

for (const assignment of Object.values(FINGER_ASSIGNMENTS)) {
  for (const k of assignment.keys) {
    CHAR_TO_FINGER_MAP[k.toLowerCase()] = assignment
  }
  for (const c of assignment.keyCodes) {
    CODE_TO_FINGER_MAP[c] = assignment
  }
}

export function getFingerForChar(char: string | null | undefined): FingerAssignment | null {
  if (!char) return null
  const lower = char.toLowerCase()
  return CHAR_TO_FINGER_MAP[lower] || null
}

export function getFingerForKeyCode(code: string | null | undefined): FingerAssignment | null {
  if (!code) return null
  return CODE_TO_FINGER_MAP[code] || null
}

export function getFingerForKey(code?: string, label?: string): FingerAssignment | null {
  if (code && CODE_TO_FINGER_MAP[code]) {
    return CODE_TO_FINGER_MAP[code]
  }
  if (label && CHAR_TO_FINGER_MAP[label.toLowerCase()]) {
    return CHAR_TO_FINGER_MAP[label.toLowerCase()]
  }
  return null
}
