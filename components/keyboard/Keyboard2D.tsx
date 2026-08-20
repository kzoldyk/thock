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
  fontClass?: string
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

export const Keyboard2D = memo(function Keyboard2D({ layoutId, themeId, activeKeys, fontClass, onKeyPress, onKeyRelease }: Props) {
  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const theme = useMemo(
    () => keyboardThemes.find((t) => t.id === themeId) || keyboardThemes[0],
    [themeId],
  )

  return (
    <div className="w-full max-w-[740px] mx-auto py-0.5 sm:py-1.5 px-1 sm:px-2 select-none touch-manipulation" suppressHydrationWarning>
      <div 
        className="w-full p-1 xs:p-1.5 sm:p-2.5 md:p-3 rounded-xl sm:rounded-[18px] md:rounded-[22px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-300 border-2 sm:border-[3px]"
        style={{
          backgroundColor: theme.case,
          borderColor: theme.plate,
        }}
        suppressHydrationWarning
      >
        <div className="w-full grid gap-0.5 xs:gap-1 sm:gap-[3.5px] md:gap-[4px]">
          {Array.from({ length: layout.rows }, (_, rowIndex) => {
            const rowKeys = layout.keys.filter((k) => k.row === rowIndex)
            rowKeys.sort((a, b) => a.x - b.x)
            return (
              <div key={rowIndex} className="flex gap-0.5 xs:gap-1 sm:gap-[3.5px] md:gap-[4px] w-full justify-between">
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
                        "relative flex items-center justify-center rounded-md xs:rounded-lg sm:rounded-xl text-[7px] xs:text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-bold uppercase transition-all duration-75 select-none cursor-pointer focus:outline-none min-w-0 tracking-tight",
                        "h-6 xs:h-7 sm:h-8.5 md:h-9.5",
                        fontClass || "font-sans",
                        isPressed
                          ? "scale-[0.94] translate-y-[2px] border-b-0 shadow-none brightness-110"
                          : "border-b-[2px] sm:border-b-[2.5px] border-black/25 shadow-sm hover:brightness-105 active:scale-[0.94] active:translate-y-[2px]"
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

