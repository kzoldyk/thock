"use client"

import { useMemo, useRef, useEffect, useState, useCallback, memo } from "react"
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

  // Recalculate horizontal or vertical translation
  const updateScroll = useCallback(() => {
    if (paragraphMode) {
      setTranslateX(0)
      if (activeWordRef.current && scrollingRowRef.current) {
        const activeWord = activeWordRef.current
        const rowEl = scrollingRowRef.current

        const wordTop = activeWord.offsetTop

        // Find the offsetTop of the second line to detect line height & boundary
        const children = rowEl.children
        let line0Top = -1
        let line1Top = -1

        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement
          if (!child || child.nodeName !== "SPAN") continue
          if (line0Top === -1) {
            line0Top = child.offsetTop
          } else if (child.offsetTop > line0Top + 8) {
            line1Top = child.offsetTop
            break
          }
        }

        // Keep lines 0 & 1 stationary at top (translateY = 0)
        // From line 2 onward, scroll up so active line is always positioned at line 1 (the middle line)
        if (line1Top > line0Top && wordTop > line1Top) {
          setTranslateY(-(wordTop - line1Top))
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
  }, [paragraphMode])

  useEffect(() => {
    updateScroll()
    window.addEventListener("resize", updateScroll)
    return () => window.removeEventListener("resize", updateScroll)
  }, [currentWordIndex, updateScroll])

  // Precise measurement of active character relative to scrollingRowRef
  useEffect(() => {
    const updateCaret = () => {
      if (activeCharRef.current && scrollingRowRef.current && activeWordRef.current) {
        const charRect = activeCharRef.current.getBoundingClientRect()
        const rowRect = scrollingRowRef.current.getBoundingClientRect()
        const wordEl = activeWordRef.current

        // Calculate steady line-based top & height from the word container to prevent vertical jitter
        const wordTop = wordEl.offsetTop
        const wordHeight = wordEl.offsetHeight || 48
        const caretHeight = Math.round(wordHeight * 0.68)
        const caretTop = wordTop + Math.round((wordHeight - caretHeight) / 2)

        setCaretPos({
          left: charRect.left - rowRect.left,
          top: caretTop,
          height: caretHeight,
        })
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
            className="inline-block w-0 overflow-visible"
          >
            &#8203;
          </span>
        )
      }

      result.push(
        <span
          key={wi}
          ref={isCurrentWord ? activeWordRef : undefined}
          className={cn(
            "inline-flex transition-opacity duration-150 relative select-none",
            paragraphMode
              ? "mr-3 sm:mr-3.5 md:mr-4"
              : "mr-6 whitespace-nowrap shrink-0",
            paragraphMode
              ? wi < currentWordIndex
                ? "opacity-35 font-normal"
                : wi === currentWordIndex
                ? "opacity-100 font-normal"
                : "opacity-55 font-normal"
              : wi < currentWordIndex
              ? "opacity-25 font-normal"
              : wi === currentWordIndex
              ? "opacity-100 font-normal"
              : "opacity-25 font-normal"
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
        "w-full max-w-[950px] mx-auto px-4 sm:px-8 select-none overflow-hidden relative transition-all duration-300",
        showKeyboard ? "my-2 sm:my-3" : "my-4 sm:my-6",
        paragraphMode
          ? "h-[7.5rem] sm:h-[9rem] md:h-[10.5rem]"
          : "h-auto py-1 sm:py-2"
      )}
      style={
        paragraphMode
          ? undefined
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
          "text-[var(--foreground)] transition-transform duration-200 ease-out relative",
          paragraphMode
            ? "text-xl sm:text-2xl md:text-[1.75rem] leading-[2.5rem] sm:leading-[3rem] md:leading-[3.5rem] tracking-normal flex flex-wrap justify-start items-baseline content-start"
            : "text-2xl xs:text-3xl sm:text-4xl leading-relaxed flex flex-nowrap items-center whitespace-nowrap tracking-tight",
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
            y: caretPos.top,
            height: caretPos.height,
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

