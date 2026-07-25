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

export const Keyboard2D = memo(function Keyboard2D({ layoutId, themeId, activeKeys }: Props) {
  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const theme = useMemo(
    () => keyboardThemes.find((t) => t.id === themeId) || keyboardThemes[0],
    [themeId],
  )

  return (
    <div className="w-full overflow-x-auto py-4 px-2 select-none">
      <div 
        className="mx-auto p-4 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 border-[4.5px]"
        style={{
          maxWidth: (layout.totalColumns * 53 + 32) + "px",
          backgroundColor: theme.case,
          borderColor: theme.plate,
        }}
      >
        <div className="mx-auto grid gap-[4.5px]">
          {Array.from({ length: layout.rows }, (_, rowIndex) => {
            const rowKeys = layout.keys.filter((k) => k.row === rowIndex)
            rowKeys.sort((a, b) => a.x - b.x)
            return (
              <div key={rowIndex} className="flex gap-[4.5px] justify-center">
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
                    <div
                      key={def.code}
                      className={cn(
                        "flex items-center justify-center rounded-xl text-[10.5px] font-sans font-bold uppercase transition-all duration-75 shadow-sm border-b-[2.5px] border-black/15",
                        isPressed && "scale-[0.96] border-b-0 translate-y-[2px]"
                      )}
                      style={{
                        width: (def.width * 50) + "px",
                        height: "46px",
                        backgroundColor: bg,
                        color: fg,
                      }}
                    >
                      {def.label}
                    </div>
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
