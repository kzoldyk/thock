"use client"

import { useMemo, memo } from "react"
import { getLayout } from "@/lib/keyboard-layouts"
import { keyboardThemes } from "@/lib/themes"
import { getFingerForKey, getFingerForChar } from "@/lib/finger-mapping"
import type { LayoutId } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  layoutId: LayoutId
  themeId: string
  activeKeys: Set<string>
  fontClass?: string
  onKeyPress?: (code: string, label?: string) => void
  onKeyRelease?: (code: string) => void
  targetChar?: string | null
  showFingerGuide?: boolean
}

function MiniHandIcon({ hand, fingerNumber, color }: { hand: "left" | "right"; fingerNumber: number; color: string }) {
  const isLeft = hand === "left"
  const fingerOrder = isLeft ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]

  return (
    <svg width="11" height="11" viewBox="0 0 16 16" className="overflow-visible" aria-hidden="true">
      {/* Palm base */}
      <rect x="2" y="8" width="12" height="7" rx="2" fill="currentColor" fillOpacity="0.3" />
      {/* Fingers */}
      {fingerOrder.map((fn, idx) => {
        const isActive = fn === fingerNumber
        const heights: Record<number, number> = { 5: 5, 4: 7, 3: 8, 2: 7, 1: 4 }
        const h = heights[fn]
        const x = 2 + idx * 2.5
        const y = 8 - h
        return (
          <rect
            key={fn}
            x={x}
            y={y}
            width="2"
            height={h + 2}
            rx="1"
            fill={isActive ? color : "currentColor"}
            fillOpacity={isActive ? 1 : 0.35}
          />
        )
      })}
    </svg>
  )
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

export const Keyboard2D = memo(function Keyboard2D({
  layoutId,
  themeId,
  activeKeys,
  fontClass,
  onKeyPress,
  onKeyRelease,
  targetChar,
  showFingerGuide,
}: Props) {
  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const theme = useMemo(
    () => keyboardThemes.find((t) => t.id === themeId) || keyboardThemes[0],
    [themeId],
  )

  const activeTargetFinger = useMemo(
    () => (showFingerGuide && targetChar ? getFingerForChar(targetChar) : null),
    [showFingerGuide, targetChar]
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

                  const finger = showFingerGuide ? getFingerForKey(def.code, def.label) : null
                  const isTarget = Boolean(
                    showFingerGuide &&
                    targetChar &&
                    (targetChar === " "
                      ? def.code === "Space"
                      : def.label && def.label.toLowerCase() === targetChar.toLowerCase())
                  )
                  const isSameFinger = Boolean(
                    showFingerGuide && activeTargetFinger && finger && activeTargetFinger.id === finger.id
                  )

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

                  // Target key override
                  if (isTarget && finger) {
                    bg = finger.color
                    fg = "#ffffff"
                  } else if (isPressed) {
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
                        "relative flex items-center justify-center rounded-md xs:rounded-lg sm:rounded-xl text-[7px] xs:text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-bold uppercase transition-all duration-150 select-none cursor-pointer focus:outline-none min-w-0 tracking-tight",
                        "h-6 xs:h-7 sm:h-8.5 md:h-9.5",
                        fontClass || "font-sans",
                        isTarget && "scale-[1.04] sm:scale-105 z-10 shadow-lg font-black animate-pulse",
                        isPressed
                          ? "scale-[0.94] translate-y-[2px] border-b-0 shadow-none brightness-110"
                          : "border-b-[2px] sm:border-b-[2.5px] border-black/25 shadow-sm hover:brightness-105 active:scale-[0.94] active:translate-y-[2px]"
                      )}
                      style={{
                        flex: `${def.width} ${def.width} 0%`,
                        backgroundColor: bg,
                        color: fg,
                        borderBottomColor:
                          showFingerGuide && finger && !isPressed
                            ? finger.color
                            : undefined,
                        borderBottomWidth:
                          showFingerGuide && finger && !isPressed ? "2.5px" : undefined,
                        boxShadow:
                          isTarget && finger
                            ? `0 0 14px ${finger.color}, inset 0 0 6px rgba(255,255,255,0.4)`
                            : undefined,
                      }}
                      aria-label={def.label || def.code}
                    >
                      {/* Finger-color wash overlay for non-target keys when guide is on */}
                      {showFingerGuide && finger && !isTarget && (
                        <span
                          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
                          style={{
                            backgroundColor: finger.color,
                            opacity: isSameFinger ? 0.22 : 0.1,
                          }}
                        />
                      )}

                      {/* Key label */}
                      <span className="truncate px-0.5 pointer-events-none relative z-[1] drop-shadow-sm">
                        {def.label}
                      </span>

                      {/* Active Target Key: Mini Hand & Finger Badge */}
                      {isTarget && finger && (
                        <span
                          className="absolute -top-1.5 -right-1 sm:-top-2 sm:-right-1.5 pointer-events-none flex items-center gap-0.5 px-1 py-0.2 rounded-full shadow-md z-20"
                          style={{ backgroundColor: finger.color, color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)" }}
                        >
                          <MiniHandIcon hand={finger.hand} fingerNumber={finger.fingerNumber} color="#ffffff" />
                          <span className="text-[6.5px] sm:text-[8px] font-black leading-none">
                            {finger.shortCode}
                          </span>
                        </span>
                      )}
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

