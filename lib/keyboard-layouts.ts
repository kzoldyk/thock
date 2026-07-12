import type { LayoutDefinition, KeyDef } from "@/types"

interface RowSpec {
  keys: Array<{ code: string; label: string; width: number }>
}

function buildLayout(rows: RowSpec[], colsInRow: number): LayoutDefinition {
  const keys: KeyDef[] = []
  rows.forEach((row, rowIndex) => {
    let x = 0
    row.keys.forEach((key) => {
      keys.push({
        code: key.code,
        label: key.label,
        width: key.width,
        row: rowIndex,
        x,
      })
      x += key.width
    })
  })
  const maxRowLen = Math.max(...rows.map((r) => r.keys.reduce((s, k) => s + k.width, 0)))
  return {
    id: "",
    name: "",
    keys,
    totalColumns: maxRowLen,
    rows: rows.length,
  }
}

const layout60Rows: RowSpec[] = [
  {
    keys: [
      { code: "Escape", label: "esc", width: 1 },
      { code: "Backquote", label: "`", width: 1 },
      { code: "Digit1", label: "1", width: 1 },
      { code: "Digit2", label: "2", width: 1 },
      { code: "Digit3", label: "3", width: 1 },
      { code: "Digit4", label: "4", width: 1 },
      { code: "Digit5", label: "5", width: 1 },
      { code: "Digit6", label: "6", width: 1 },
      { code: "Digit7", label: "7", width: 1 },
      { code: "Digit8", label: "8", width: 1 },
      { code: "Digit9", label: "9", width: 1 },
      { code: "Digit0", label: "0", width: 1 },
      { code: "Minus", label: "-", width: 1 },
      { code: "Equal", label: "=", width: 1 },
      { code: "Backspace", label: "⌫", width: 2 },
    ],
  },
  {
    keys: [
      { code: "Tab", label: "tab", width: 1.5 },
      { code: "KeyQ", label: "Q", width: 1 },
      { code: "KeyW", label: "W", width: 1 },
      { code: "KeyE", label: "E", width: 1 },
      { code: "KeyR", label: "R", width: 1 },
      { code: "KeyT", label: "T", width: 1 },
      { code: "KeyY", label: "Y", width: 1 },
      { code: "KeyU", label: "U", width: 1 },
      { code: "KeyI", label: "I", width: 1 },
      { code: "KeyO", label: "O", width: 1 },
      { code: "KeyP", label: "P", width: 1 },
      { code: "BracketLeft", label: "[", width: 1 },
      { code: "BracketRight", label: "]", width: 1 },
      { code: "Backslash", label: "\\", width: 1.5 },
    ],
  },
  {
    keys: [
      { code: "CapsLock", label: "caps", width: 1.75 },
      { code: "KeyA", label: "A", width: 1 },
      { code: "KeyS", label: "S", width: 1 },
      { code: "KeyD", label: "D", width: 1 },
      { code: "KeyF", label: "F", width: 1 },
      { code: "KeyG", label: "G", width: 1 },
      { code: "KeyH", label: "H", width: 1 },
      { code: "KeyJ", label: "J", width: 1 },
      { code: "KeyK", label: "K", width: 1 },
      { code: "KeyL", label: "L", width: 1 },
      { code: "Semicolon", label: ";", width: 1 },
      { code: "Quote", label: "'", width: 1 },
      { code: "Enter", label: "⏎", width: 2.25 },
    ],
  },
  {
    keys: [
      { code: "ShiftLeft", label: "⇧", width: 2.25 },
      { code: "KeyZ", label: "Z", width: 1 },
      { code: "KeyX", label: "X", width: 1 },
      { code: "KeyC", label: "C", width: 1 },
      { code: "KeyV", label: "V", width: 1 },
      { code: "KeyB", label: "B", width: 1 },
      { code: "KeyN", label: "N", width: 1 },
      { code: "KeyM", label: "M", width: 1 },
      { code: "Comma", label: ",", width: 1 },
      { code: "Period", label: ".", width: 1 },
      { code: "Slash", label: "/", width: 1 },
      { code: "ShiftRight", label: "⇧", width: 2.75 },
    ],
  },
  {
    keys: [
      { code: "ControlLeft", label: "ctrl", width: 1.25 },
      { code: "MetaLeft", label: "⌘", width: 1.25 },
      { code: "AltLeft", label: "opt", width: 1.25 },
      { code: "Space", label: "", width: 6.25 },
      { code: "AltRight", label: "opt", width: 1.25 },
      { code: "MetaRight", label: "⌘", width: 1.25 },
      { code: "ControlRight", label: "ctrl", width: 1.25 },
      { code: "Fn", label: "fn", width: 1.25 },
    ],
  },
]

const layout75Rows: RowSpec[] = [
  {
    keys: [
      { code: "Escape", label: "esc", width: 1 },
      { code: "F1", label: "F1", width: 1 },
      { code: "F2", label: "F2", width: 1 },
      { code: "F3", label: "F3", width: 1 },
      { code: "F4", label: "F4", width: 1 },
      { code: "F5", label: "F5", width: 1 },
      { code: "F6", label: "F6", width: 1 },
      { code: "F7", label: "F7", width: 1 },
      { code: "F8", label: "F8", width: 1 },
      { code: "F9", label: "F9", width: 1 },
      { code: "F10", label: "F10", width: 1 },
      { code: "F11", label: "F11", width: 1 },
      { code: "F12", label: "F12", width: 1 },
      { code: "Delete", label: "del", width: 1 },
    ],
  },
  {
    keys: [
      { code: "Backquote", label: "`", width: 1 },
      { code: "Digit1", label: "1", width: 1 },
      { code: "Digit2", label: "2", width: 1 },
      { code: "Digit3", label: "3", width: 1 },
      { code: "Digit4", label: "4", width: 1 },
      { code: "Digit5", label: "5", width: 1 },
      { code: "Digit6", label: "6", width: 1 },
      { code: "Digit7", label: "7", width: 1 },
      { code: "Digit8", label: "8", width: 1 },
      { code: "Digit9", label: "9", width: 1 },
      { code: "Digit0", label: "0", width: 1 },
      { code: "Minus", label: "-", width: 1 },
      { code: "Equal", label: "=", width: 1 },
      { code: "Backspace", label: "⌫", width: 2 },
    ],
  },
  {
    keys: [
      { code: "Tab", label: "tab", width: 1.5 },
      { code: "KeyQ", label: "Q", width: 1 },
      { code: "KeyW", label: "W", width: 1 },
      { code: "KeyE", label: "E", width: 1 },
      { code: "KeyR", label: "R", width: 1 },
      { code: "KeyT", label: "T", width: 1 },
      { code: "KeyY", label: "Y", width: 1 },
      { code: "KeyU", label: "U", width: 1 },
      { code: "KeyI", label: "I", width: 1 },
      { code: "KeyO", label: "O", width: 1 },
      { code: "KeyP", label: "P", width: 1 },
      { code: "BracketLeft", label: "[", width: 1 },
      { code: "BracketRight", label: "]", width: 1 },
      { code: "Backslash", label: "\\", width: 1.5 },
      { code: "Home", label: "home", width: 1 },
    ],
  },
  {
    keys: [
      { code: "CapsLock", label: "caps", width: 1.75 },
      { code: "KeyA", label: "A", width: 1 },
      { code: "KeyS", label: "S", width: 1 },
      { code: "KeyD", label: "D", width: 1 },
      { code: "KeyF", label: "F", width: 1 },
      { code: "KeyG", label: "G", width: 1 },
      { code: "KeyH", label: "H", width: 1 },
      { code: "KeyJ", label: "J", width: 1 },
      { code: "KeyK", label: "K", width: 1 },
      { code: "KeyL", label: "L", width: 1 },
      { code: "Semicolon", label: ";", width: 1 },
      { code: "Quote", label: "'", width: 1 },
      { code: "Enter", label: "⏎", width: 2.25 },
      { code: "PageUp", label: "pgUp", width: 1 },
    ],
  },
  {
    keys: [
      { code: "ShiftLeft", label: "⇧", width: 2.25 },
      { code: "KeyZ", label: "Z", width: 1 },
      { code: "KeyX", label: "X", width: 1 },
      { code: "KeyC", label: "C", width: 1 },
      { code: "KeyV", label: "V", width: 1 },
      { code: "KeyB", label: "B", width: 1 },
      { code: "KeyN", label: "N", width: 1 },
      { code: "KeyM", label: "M", width: 1 },
      { code: "Comma", label: ",", width: 1 },
      { code: "Period", label: ".", width: 1 },
      { code: "Slash", label: "/", width: 1 },
      { code: "ShiftRight", label: "⇧", width: 1.75 },
      { code: "ArrowUp", label: "↑", width: 1 },
      { code: "End", label: "end", width: 1 },
    ],
  },
  {
    keys: [
      { code: "ControlLeft", label: "ctrl", width: 1.25 },
      { code: "MetaLeft", label: "⌘", width: 1.25 },
      { code: "AltLeft", label: "opt", width: 1.25 },
      { code: "Space", label: "", width: 6 },
      { code: "AltRight", label: "opt", width: 1.25 },
      { code: "MetaRight", label: "⌘", width: 1.25 },
      { code: "ControlRight", label: "ctrl", width: 1.25 },
      { code: "ArrowLeft", label: "←", width: 1 },
      { code: "ArrowDown", label: "↓", width: 1 },
      { code: "ArrowRight", label: "→", width: 1 },
    ],
  },
]

function makeLayout(id: string, name: string, rows: RowSpec[]): LayoutDefinition {
  const layout = buildLayout(rows, 0)
  layout.id = id
  layout.name = name
  return layout
}

export const layouts: Record<string, LayoutDefinition> = {
  "60": makeLayout("60", "60%", layout60Rows),
  "75": makeLayout("75", "75%", layout75Rows),
}

export function getLayout(id: string): LayoutDefinition {
  return layouts[id] || layouts["60"]
}
