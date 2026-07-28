"use client"

import { useMemo, useRef, useEffect, useState, memo } from "react"
import { motion } from "framer-motion"
import type { WordData, SessionState } from "@/types"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"
import { getFontClass } from "@/lib/fonts"

interface WordsDisplayProps {
  words: WordData[]
  currentWordIndex: number
  currentCharIndex: number
  sessionState?: SessionState
}

export const WordsDisplay = memo(function WordsDisplay({ words, currentWordIndex, currentCharIndex, sessionState = "idle" }: WordsDisplayProps) {
  const fontFamily = useAppStore((s) => s.fontFamily)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)
  const activeCharRef = useRef<HTMLSpanElement>(null)
  const scrollingRowRef = useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = useState(0)

  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 36 })

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

  // Measure active character coordinates relative to the scrolling row
  useEffect(() => {
    if (activeCharRef.current && activeWordRef.current) {
      const charEl = activeCharRef.current
      const wordEl = activeWordRef.current
      setCaretPos({
        left: charEl.offsetLeft + wordEl.offsetLeft,
        top: charEl.offsetTop + wordEl.offsetTop,
        height: charEl.offsetHeight || 36,
      })
    }
  }, [currentWordIndex, currentCharIndex, words])

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
            ref={isCurrentChar ? activeCharRef : undefined}
            className="relative inline-block"
          >
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

      // Perfect word sparkle
      if (word.isPerfect && wi === currentWordIndex - 1) {
        chars.push(
          <span key={`sparkle-${wi}`} className="absolute top-[-10px] right-[-10px] pointer-events-none z-20 text-[var(--accent)] animate-sparkle">
            ✨
          </span>
        )
      }

      // Caret spacer when at end of current word
      if (isCurrentWord && currentCharIndex >= word.chars.length) {
        chars.push(
          <span
            key={`c-end-wrapper-${wi}`}
            ref={activeCharRef}
            className="relative inline-block w-[2px] h-[1.2em]"
          />
        )
      }

      result.push(
        <span
          key={wi}
          ref={isCurrentWord ? activeWordRef : undefined}
          className={cn(
            "inline-flex tracking-tight transition-all duration-300 mr-6 py-1.5 whitespace-nowrap shrink-0 relative",
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
      className="w-full max-w-[900px] mx-auto px-12 select-none my-6 overflow-hidden relative"
      style={{
        maskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
      }}
    >
      <div 
        ref={scrollingRowRef}
        className={cn(
          "flex flex-row flex-nowrap items-center text-3xl sm:text-4xl leading-relaxed tracking-tight text-[var(--foreground)] transition-transform duration-300 ease-out whitespace-nowrap relative",
          fontClass
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        {/* Floating Spring Caret */}
        <motion.div
          animate={{
            x: caretPos.left - 1.5,
            y: caretPos.top + 5,
            height: caretPos.height - 10,
          }}
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 32,
            mass: 0.7,
          }}
          className={cn(
            "absolute left-0 w-[2.5px] bg-[var(--accent)] rounded-full pointer-events-none z-30 shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]",
            sessionState === "typing" ? "opacity-100" : "animate-smooth-blink"
          )}
        />
        {elements}
      </div>
    </div>
  )
})
