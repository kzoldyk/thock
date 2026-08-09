"use client"

import { useMemo, memo } from "react"
import { getLayout } from "@/lib/keyboard-layouts"
import { keyboardThemes } from "@/lib/themes"
import type { LayoutId } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  layoutId: LayoutId
  themeId: string
  activeKeys: Set<string>
  onKeyPress?: (code: string, label?: string) => void
  onKeyRelease?: (code: string) => void
}

function getKeyType(code: string): "esc" | "modifier" | "number" | "alpha" {
  if (code === "Escape") return "esc"
  if (
    [
      "Tab", "CapsLock", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
      "AltLeft", "AltRight", "MetaLeft", "MetaRight", "Backspace", "Enter",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"
    ].includes(code)
  ) {
    return "modifier"
  }
  if (/^Digit\d/.test(code) || code === "Minus" || code === "Equal" || /^F\d/.test(code) || ["PageUp", "PageDown", "Home", "End", "Delete", "Insert"].includes(code)) {
    return "number"
  }
  return "alpha"
}

export const Keyboard2D = memo(function Keyboard2D({ layoutId, themeId, activeKeys, onKeyPress, onKeyRelease }: Props) {
  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const theme = useMemo(
    () => keyboardThemes.find((t) => t.id === themeId) || keyboardThemes[0],
    [themeId],
  )

  return (
    <div className="w-full max-w-[860px] mx-auto py-1 sm:py-2.5 px-1 sm:px-2 select-none touch-manipulation" suppressHydrationWarning>
      <div 
        className="w-full p-1.5 xs:p-2 sm:p-3.5 md:p-4 rounded-xl sm:rounded-[22px] md:rounded-[26px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 border-2 sm:border-[4px]"
        style={{
          backgroundColor: theme.case,
          borderColor: theme.plate,
        }}
        suppressHydrationWarning
      >
        <div className="w-full grid gap-1 xs:gap-1.5 sm:gap-[4px] md:gap-[5px]">
          {Array.from({ length: layout.rows }, (_, rowIndex) => {
            const rowKeys = layout.keys.filter((k) => k.row === rowIndex)
            rowKeys.sort((a, b) => a.x - b.x)
            return (
              <div key={rowIndex} className="flex gap-1 xs:gap-1.5 sm:gap-[4px] md:gap-[5px] w-full justify-between">
                {rowKeys.map((def) => {
                  const isPressed = activeKeys.has(def.code)
                  const keyType = getKeyType(def.code)

                  let bg = theme.keycap
                  let fg = theme.label

                  if (keyType === "esc" && theme.escBg) {
                    bg = theme.escBg
                    fg = theme.escLabel || "#ffffff"
                  } else if (keyType === "modifier" && theme.modifierBg) {
                    bg = theme.modifierBg
                    fg = theme.modifierLabel || "#ffffff"
                  } else if (keyType === "number" && theme.numberBg) {
                    bg = theme.numberBg
                    fg = theme.numberLabel || "#1f1f1f"
                  }

                  // Keystroke override
                  if (isPressed) {
                    bg = theme.keycapActive
                    fg = theme.labelActive
                  }

                  return (
                    <button
                      key={def.code}
                      type="button"
                      suppressHydrationWarning
                      onPointerDown={(e) => {
                        e.preventDefault()
                        onKeyPress?.(def.code, def.label)
                      }}
                      onPointerUp={(e) => {
                        e.preventDefault()
                        onKeyRelease?.(def.code)
                      }}
                      onPointerLeave={() => onKeyRelease?.(def.code)}
                      onPointerCancel={() => onKeyRelease?.(def.code)}
                      className={cn(
                        "relative flex items-center justify-center rounded-md xs:rounded-lg sm:rounded-xl text-[7.5px] xs:text-[9px] sm:text-[10.5px] md:text-xs font-sans font-bold uppercase transition-all duration-75 select-none cursor-pointer focus:outline-none min-w-0",
                        "h-7 xs:h-8 sm:h-10 md:h-11.5",
                        isPressed
                          ? "scale-[0.94] translate-y-[2px] border-b-0 shadow-none brightness-110"
                          : "border-b-[2px] sm:border-b-[3px] border-black/25 shadow-sm hover:brightness-105 active:scale-[0.94] active:translate-y-[2px]"
                      )}
                      style={{
                        flex: `${def.width} ${def.width} 0%`,
                        backgroundColor: bg,
                        color: fg,
                      }}
                      aria-label={def.label || def.code}
                    >
                      <span className="truncate px-0.5 pointer-events-none">{def.label}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

