"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import type { WordData } from "@/types"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"
import { getFontClass } from "@/lib/fonts"

interface WordsDisplayProps {
  words: WordData[]
  currentWordIndex: number
  currentCharIndex: number
}

export function WordsDisplay({ words, currentWordIndex, currentCharIndex }: WordsDisplayProps) {
  const fontFamily = useAppStore((s) => s.fontFamily)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)
  const [translateX, setTranslateX] = useState(0)

  const fontClass = useMemo(() => getFontClass(fontFamily), [fontFamily])

  // Horizontal translation math on active word shift
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const activeEl = activeWordRef.current
      const containerEl = containerRef.current
      
      const activeLeft = activeEl.offsetLeft
      const containerWidth = containerEl.offsetWidth
      
      // Align the active word at 25% width from the left side of the window
      const targetX = -activeLeft + (containerWidth * 0.25)
      setTranslateX(targetX)
    }
  }, [currentWordIndex])

  const elements = useMemo(() => {
    const result: React.ReactNode[] = []
    
    words.forEach((word, wi) => {
      const isCurrentWord = wi === currentWordIndex
      const chars: React.ReactNode[] = []

      word.chars.forEach((char, ci) => {
        const isCurrentChar = isCurrentWord && ci === currentCharIndex
        const state = char.state

        chars.push(
          <span
            key={`${wi}-${ci}`}
            className="relative inline-block"
          >
            {isCurrentChar && <Caret />}
            <span
              className={cn(
                "transition-all duration-150",
                state === "untyped" && (isCurrentWord ? "text-[var(--foreground)] opacity-[0.9]" : "text-[var(--foreground)] opacity-100"),
                state === "correct" && "text-[var(--foreground)] opacity-40",
                state === "incorrect" && "text-red-500 opacity-95 border-b-[2px] border-red-500/40",
                state === "extra" && "text-red-500 opacity-95 border-b-[2px] border-red-500/40",
              )}
            >
              {char.char}
            </span>
          </span>
        )
      })

      // Caret after last char when at end of current word
      if (isCurrentWord && currentCharIndex >= word.chars.length) {
        chars.push(
          <span key={`c-end-wrapper-${wi}`} className="relative inline-block w-0">
            <Caret />
          </span>
        )
      }

      result.push(
        <span
          key={wi}
          ref={isCurrentWord ? activeWordRef : undefined}
          className={cn(
            "inline-flex tracking-tight transition-all duration-300 mr-6 py-1.5 whitespace-nowrap shrink-0",
            wi < currentWordIndex && "opacity-25",
            wi === currentWordIndex && "opacity-100 font-semibold scale-[1.01] origin-left",
            wi > currentWordIndex && "opacity-[0.12]",
          )}
        >
          {chars}
        </span>,
      )
    })
    return result
  }, [words, currentWordIndex, currentCharIndex])

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[900px] mx-auto px-12 select-none my-12 overflow-hidden relative"
      style={{
        maskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
      }}
    >
      <div 
        className={cn(
          "flex flex-row flex-nowrap items-center text-3xl sm:text-4xl leading-relaxed tracking-tight text-[var(--foreground)] transition-transform duration-300 ease-out whitespace-nowrap",
          fontClass
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        {elements}
      </div>
    </div>
  )
}

function Caret() {
  return (
    <span className="absolute left-[-1.5px] top-[0.15em] bottom-[0.1em] w-[2.5px] bg-[var(--accent)] animate-smooth-blink rounded-full pointer-events-none z-10" />
  )
}
