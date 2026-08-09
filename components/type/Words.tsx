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

export const WordsDisplay = memo(function WordsDisplay({
  words,
  currentWordIndex,
  currentCharIndex,
  sessionState = "idle",
}: WordsDisplayProps) {
  const fontFamily = useAppStore((s) => s.fontFamily)
  const paragraphMode = useAppStore((s) => s.paragraphMode)
  const showKeyboard = useAppStore((s) => s.showKeyboard)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)
  const activeCharRef = useRef<HTMLSpanElement>(null)
  const scrollingRowRef = useRef<HTMLDivElement>(null)

  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 36 })

  const fontClass = useMemo(() => getFontClass(fontFamily), [fontFamily])

  // Horizontal or vertical translation math on active word shift
  useEffect(() => {
    if (paragraphMode) {
      setTranslateX(0)
      if (activeWordRef.current && containerRef.current && scrollingRowRef.current) {
        const activeWord = activeWordRef.current
        const rowEl = scrollingRowRef.current

        const wordRect = activeWord.getBoundingClientRect()
        const rowRect = rowEl.getBoundingClientRect()

        const relativeTop = wordRect.top - rowRect.top

        // Keep active line centered in the paragraph viewport
        if (relativeTop > 50) {
          setTranslateY(-relativeTop + 40)
        } else {
          setTranslateY(0)
        }
      }
      return
    }

    setTranslateY(0)
    if (activeWordRef.current && containerRef.current) {
      const activeEl = activeWordRef.current
      const containerEl = containerRef.current

      const activeLeft = activeEl.offsetLeft
      const containerWidth = containerEl.offsetWidth

      // Align active word at 25% of container width for typewriter scrolling
      const targetX = -activeLeft + containerWidth * 0.25
      setTranslateX(targetX)
    }
  }, [currentWordIndex, paragraphMode])

  // Precise measurement of active character relative to scrollingRowRef using getBoundingClientRect
  useEffect(() => {
    const updateCaret = () => {
      if (activeCharRef.current && scrollingRowRef.current) {
        const charRect = activeCharRef.current.getBoundingClientRect()
        const rowRect = scrollingRowRef.current.getBoundingClientRect()

        if (charRect.height > 0) {
          setCaretPos({
            left: charRect.left - rowRect.left,
            top: charRect.top - rowRect.top,
            height: charRect.height || 36,
          })
        }
      }
    }

    updateCaret()
    window.addEventListener("resize", updateCaret)
    return () => window.removeEventListener("resize", updateCaret)
  }, [currentWordIndex, currentCharIndex, words, paragraphMode])

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
                "transition-colors duration-75",
                state === "untyped" &&
                  (isCurrentWord
                    ? "text-[var(--foreground)] opacity-90"
                    : "text-[var(--foreground)] opacity-100"),
                state === "correct" && "text-[var(--foreground)] opacity-35",
                state === "incorrect" &&
                  "text-rose-500 opacity-100 border-b-2 border-rose-500/60",
                state === "extra" &&
                  "text-rose-500 opacity-100 border-b-2 border-rose-500/60"
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
          <span
            key={`sparkle-${wi}`}
            className="absolute top-[-10px] right-[-10px] pointer-events-none z-20 text-[var(--accent)] animate-sparkle"
          >
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
            "inline-flex tracking-tight transition-opacity duration-150 relative py-1",
            paragraphMode ? "mr-4 sm:mr-5" : "mr-6 whitespace-nowrap shrink-0",
            paragraphMode
              ? wi < currentWordIndex
                ? "opacity-35 font-normal"
                : wi === currentWordIndex
                ? "opacity-100 font-semibold"
                : "opacity-60 font-normal"
              : wi < currentWordIndex
              ? "opacity-25 font-normal"
              : wi === currentWordIndex
              ? "opacity-100 font-semibold"
              : "opacity-15 font-normal"
          )}
        >
          {chars}
        </span>
      )
    })
    return result
  }, [words, currentWordIndex, currentCharIndex, paragraphMode])

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full max-w-[900px] mx-auto px-3 sm:px-12 select-none overflow-hidden relative transition-all duration-300",
        showKeyboard ? "my-1 sm:my-3" : "my-2 sm:my-6",
        paragraphMode ? "h-[130px] sm:h-[190px]" : "h-auto py-1 sm:py-2"
      )}
      style={
        paragraphMode
          ? {
              maskImage:
                "linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)",
            }
          : {
              maskImage:
                "linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%)",
            }
      }
    >
      <div
        ref={scrollingRowRef}
        className={cn(
          "text-2xl xs:text-3xl sm:text-4xl leading-relaxed tracking-tight text-[var(--foreground)] transition-transform duration-200 ease-out relative",
          paragraphMode
            ? "flex flex-wrap justify-start items-baseline gap-y-1.5 sm:gap-y-2"
            : "flex flex-nowrap items-center whitespace-nowrap",
          fontClass
        )}
        style={{
          transform: paragraphMode
            ? `translateY(${translateY}px)`
            : `translateX(${translateX}px)`,
        }}
      >
        {/* Floating Spring Caret */}
        <motion.div
          animate={{
            x: caretPos.left - 1,
            y: caretPos.top + 3,
            height: caretPos.height - 6,
          }}
          transition={{
            type: "spring",
            stiffness: 600,
            damping: 36,
            mass: 0.4,
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

