"use client"

import { useMemo, useRef, useEffect, useState, useCallback, memo } from "react"
import { motion } from "framer-motion"
import type { WordData, SessionState } from "@/types"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/useAppStore"
import { getFontClass, isMonoFont } from "@/lib/fonts"

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
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 32 })

  const fontClass = useMemo(() => getFontClass(fontFamily), [fontFamily])
  const mono = useMemo(() => isMonoFont(fontFamily), [fontFamily])

  const updateScroll = useCallback(() => {
    if (paragraphMode) {
      setTranslateX(0)
      if (activeWordRef.current && scrollingRowRef.current) {
        const activeWord = activeWordRef.current
        const rowEl = scrollingRowRef.current

        const wordTop = activeWord.offsetTop

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

      const targetX = -activeLeft + containerWidth * 0.22
      setTranslateX(targetX)
    }
  }, [paragraphMode])

  useEffect(() => {
    updateScroll()
    window.addEventListener("resize", updateScroll)
    return () => window.removeEventListener("resize", updateScroll)
  }, [currentWordIndex, updateScroll])

  useEffect(() => {
    const updateCaret = () => {
      if (activeCharRef.current && scrollingRowRef.current && activeWordRef.current) {
        const charRect = activeCharRef.current.getBoundingClientRect()
        const rowRect = scrollingRowRef.current.getBoundingClientRect()
        const wordEl = activeWordRef.current

        const wordTop = wordEl.offsetTop
        const wordHeight = wordEl.offsetHeight || 40
        const caretHeight = Math.round(wordHeight * 0.72)
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
  }, [currentWordIndex, currentCharIndex, words, paragraphMode, fontFamily])

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
            className={cn("typing-char", mono && "typing-char-mono")}
          >
            <span
              className={cn(
                "transition-colors duration-75",
                state === "untyped" &&
                  (isCurrentWord
                    ? "text-[var(--foreground)] opacity-95"
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

      if (isCurrentWord && currentCharIndex >= word.chars.length) {
        chars.push(
          <span
            key={`c-end-wrapper-${wi}`}
            ref={activeCharRef}
            className="inline w-0 overflow-visible"
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
            "inline-flex items-baseline transition-opacity duration-150 relative select-none shrink-0",
            paragraphMode
              ? wi < currentWordIndex
                ? "opacity-35"
                : wi === currentWordIndex
                ? "opacity-100"
                : "opacity-55"
              : wi < currentWordIndex
              ? "opacity-30"
              : wi === currentWordIndex
              ? "opacity-100"
              : "opacity-30"
          )}
        >
          {chars}
        </span>
      )
    })
    return result
  }, [words, currentWordIndex, currentCharIndex, paragraphMode, mono])

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full max-w-[min(950px,100vw-1rem)] mx-auto px-3 sm:px-6 md:px-8 select-none overflow-hidden relative transition-all duration-300",
        showKeyboard ? "my-2 sm:my-3" : "my-3 sm:my-5",
        paragraphMode
          ? "h-[6.5rem] xs:h-[7.5rem] sm:h-[9rem] md:h-[10rem]"
          : "h-auto min-h-[2.75rem] sm:min-h-[3.5rem] py-1 sm:py-2"
      )}
      style={
        paragraphMode
          ? undefined
          : {
              maskImage:
                "linear-gradient(to right, transparent 0%, white 10%, white 90%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, white 10%, white 90%, transparent 100%)",
            }
      }
    >
      <div
        ref={scrollingRowRef}
        className={cn(
          "typing-words text-[var(--foreground)] transition-transform duration-200 ease-out relative",
          mono ? "typing-words-mono font-medium" : "typing-words-sans font-normal",
          paragraphMode
            ? "flex flex-wrap justify-start items-baseline content-start gap-x-[0.35em] gap-y-0 leading-[1.65] text-[clamp(1.125rem,4.2vw,1.75rem)]"
            : "flex flex-nowrap items-baseline whitespace-nowrap gap-x-[0.45em] leading-[1.5] text-[clamp(1.25rem,5vw,2.25rem)]",
          fontClass
        )}
        style={{
          transform: paragraphMode
            ? `translateY(${translateY}px)`
            : `translateX(${translateX}px)`,
        }}
      >
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
            "absolute left-0 w-[2px] sm:w-[2.5px] bg-[var(--accent)] rounded-full pointer-events-none z-30 shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]",
            sessionState === "typing" ? "opacity-100" : "animate-smooth-blink"
          )}
        />
        {elements}
      </div>
    </div>
  )
})
