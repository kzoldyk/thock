"use client"

import { memo, useMemo } from "react"
import { Hand as HandIcon, Sparkles } from "lucide-react"
import { FINGER_ASSIGNMENTS, getFingerForChar, type FingerAssignment } from "@/lib/finger-mapping"
import { cn } from "@/lib/utils"

interface HandPlacementGuideProps {
  targetLetter?: string | null
  currentChar?: string | null
}

interface HandSvgProps {
  hand: "left" | "right"
  activeFinger: FingerAssignment | null
  targetChar?: string | null
}

// Finger specs for realistic geometry
interface FingerSpec {
  assignment: FingerAssignment
  cx: number
  topY: number
  width: number
  height: number
  knuckleY: number
  isThumb?: boolean
  thumbAngle?: number
  thumbBaseX?: number
  thumbBaseY?: number
}

const LEFT_FINGER_SPECS: FingerSpec[] = [
  {
    assignment: FINGER_ASSIGNMENTS["left-pinky"],
    cx: 32,
    topY: 54,
    width: 22,
    height: 74,
    knuckleY: 130,
  },
  {
    assignment: FINGER_ASSIGNMENTS["left-ring"],
    cx: 70,
    topY: 28,
    width: 24,
    height: 98,
    knuckleY: 126,
  },
  {
    assignment: FINGER_ASSIGNMENTS["left-middle"],
    cx: 112,
    topY: 14,
    width: 25,
    height: 110,
    knuckleY: 122,
  },
  {
    assignment: FINGER_ASSIGNMENTS["left-index"],
    cx: 154,
    topY: 26,
    width: 25,
    height: 100,
    knuckleY: 126,
  },
  {
    assignment: FINGER_ASSIGNMENTS["left-thumb"],
    cx: 0,
    topY: 0,
    width: 24,
    height: 56,
    knuckleY: 0,
    isThumb: true,
    thumbAngle: 28,
    thumbBaseX: 166,
    thumbBaseY: 138,
  },
]

const RIGHT_FINGER_SPECS: FingerSpec[] = [
  {
    assignment: FINGER_ASSIGNMENTS["right-thumb"],
    cx: 0,
    topY: 0,
    width: 24,
    height: 56,
    knuckleY: 0,
    isThumb: true,
    thumbAngle: -28,
    thumbBaseX: 84,
    thumbBaseY: 138,
  },
  {
    assignment: FINGER_ASSIGNMENTS["right-index"],
    cx: 96,
    topY: 26,
    width: 25,
    height: 100,
    knuckleY: 126,
  },
  {
    assignment: FINGER_ASSIGNMENTS["right-middle"],
    cx: 138,
    topY: 14,
    width: 25,
    height: 110,
    knuckleY: 122,
  },
  {
    assignment: FINGER_ASSIGNMENTS["right-ring"],
    cx: 180,
    topY: 28,
    width: 24,
    height: 98,
    knuckleY: 126,
  },
  {
    assignment: FINGER_ASSIGNMENTS["right-pinky"],
    cx: 218,
    topY: 54,
    width: 22,
    height: 74,
    knuckleY: 130,
  },
]

const RealisticHand = memo(function RealisticHand({
  hand,
  activeFinger,
  targetChar,
}: HandSvgProps) {
  const isLeft = hand === "left"
  const specs = isLeft ? LEFT_FINGER_SPECS : RIGHT_FINGER_SPECS

  return (
    <div className="flex flex-col items-center w-full max-w-[340px]">
      {/* Hand title */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
        {isLeft ? "Left Hand (Home: A S D F)" : "Right Hand (Home: J K L ;)"}
      </div>

      <svg
        viewBox="0 0 250 215"
        className="w-full h-auto max-h-[190px] drop-shadow-sm select-none overflow-visible"
        aria-label={`${hand} hand touch typing guide`}
      >
        <defs>
          {specs.map(({ assignment }) => (
            <linearGradient
              key={assignment.id}
              id={`grad-${assignment.id}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={assignment.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={assignment.color} stopOpacity="0.3" />
            </linearGradient>
          ))}
          {/* Subtle palm gradient */}
          <linearGradient id={`palm-grad-${hand}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Anatomical Palm & Wrist silhouette */}
        {isLeft ? (
          <path
            d="M 52 205 C 44 195 24 165 20 142 C 16 122 28 126 38 128 C 54 130 62 124 72 124 C 82 124 102 120 114 120 C 126 120 144 124 154 124 C 164 124 166 130 166 138 C 174 150 196 168 186 186 C 176 198 165 205 152 205 Z"
            fill="url(#palm-grad-left)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
            className="text-[var(--foreground)]"
          />
        ) : (
          <path
            d="M 198 205 C 206 195 226 165 230 142 C 234 122 222 126 212 128 C 196 130 188 124 178 124 C 168 124 148 120 136 120 C 124 120 106 124 96 124 C 86 124 84 130 84 138 C 76 150 54 168 64 186 C 74 198 85 205 98 205 Z"
            fill="url(#palm-grad-right)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
            className="text-[var(--foreground)]"
          />
        )}

        {/* Wrist guideline */}
        <line
          x1={isLeft ? 52 : 90}
          y1="205"
          x2={isLeft ? 160 : 198}
          y2="205"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="4,4"
          className="text-[var(--muted)]"
        />

        {/* 5 Realistic Fingers */}
        {specs.map((spec) => {
          const { assignment, cx, topY, width, height, knuckleY, isThumb, thumbAngle, thumbBaseX, thumbBaseY } = spec
          const isActive = activeFinger?.id === assignment.id
          const charToShow = isActive && targetChar
            ? (targetChar === " " ? "␣" : targetChar.toUpperCase())
            : (assignment.homeKey === "Space" ? "␣" : assignment.homeKey)

          // Thumb angled rendering (pure SVG transform with local origin)
          if (isThumb && thumbBaseX !== undefined && thumbBaseY !== undefined && thumbAngle !== undefined) {
            const thumbLength = height
            const rx = width / 2
            const tipCenterY = -thumbLength + rx
            return (
              <g
                key={assignment.id}
                transform={`translate(${thumbBaseX}, ${thumbBaseY}) rotate(${thumbAngle})`}
                className="transition-transform duration-200"
              >
                {/* Active glow beacon on thumb tip */}
                {isActive && (
                  <circle
                    cx={0}
                    cy={tipCenterY}
                    r={rx + 5}
                    fill="none"
                    stroke={assignment.color}
                    strokeWidth="1.8"
                    strokeDasharray="3,3"
                    className="animate-spin"
                    style={{ transformOrigin: `0px ${tipCenterY}px`, animationDuration: "6s" }}
                  />
                )}

                {/* Thumb shaft */}
                <rect
                  x={-rx}
                  y={-thumbLength}
                  width={width}
                  height={thumbLength}
                  rx={rx}
                  fill={isActive ? `url(#grad-${assignment.id})` : "currentColor"}
                  fillOpacity={isActive ? 1 : 0.08}
                  stroke={isActive ? assignment.color : "currentColor"}
                  strokeOpacity={isActive ? 1 : 0.25}
                  strokeWidth={isActive ? 2.5 : 1}
                  className="text-[var(--foreground)]"
                />

                {/* Knuckle joint line */}
                <line
                  x1={-rx + 4}
                  y1={-thumbLength * 0.45}
                  x2={rx - 4}
                  y2={-thumbLength * 0.45}
                  stroke={isActive ? assignment.color : "currentColor"}
                  strokeOpacity={isActive ? 0.8 : 0.25}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="text-[var(--muted)]"
                />

                {/* Fingertip target / home disk */}
                <circle
                  cx={0}
                  cy={tipCenterY}
                  r={rx - 2}
                  fill={isActive ? assignment.color : "currentColor"}
                  fillOpacity={isActive ? 1 : 0.2}
                  stroke={isActive ? "#ffffff" : "currentColor"}
                  strokeOpacity={isActive ? 0.9 : 0.3}
                  strokeWidth={isActive ? 2 : 1}
                  className="text-[var(--foreground)]"
                />
                <text
                  x={0}
                  y={tipCenterY + 3.5}
                  transform={`rotate(${-thumbAngle}, 0, ${tipCenterY})`}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="900"
                  fill={isActive ? "#ffffff" : "currentColor"}
                  className="text-[var(--foreground)] select-none font-sans"
                >
                  {charToShow}
                </text>

                {/* Finger number badge at base */}
                <circle
                  cx={0}
                  cy={-8}
                  r="7.5"
                  fill={isActive ? assignment.color : "currentColor"}
                  fillOpacity={isActive ? 1 : 0.15}
                  stroke={isActive ? "#ffffff" : "currentColor"}
                  strokeOpacity={isActive ? 0.9 : 0.3}
                  strokeWidth="1"
                  className="text-[var(--foreground)]"
                />
                <text
                  x={0}
                  y={-5}
                  transform={`rotate(${-thumbAngle}, 0, -8)`}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="900"
                  fill={isActive ? "#ffffff" : "currentColor"}
                  className="text-[var(--foreground)] select-none font-mono"
                >
                  {assignment.fingerNumber}
                </text>
              </g>
            )
          }

          // 4 Main fingers (Pinky, Ring, Middle, Index)
          const rx = width / 2
          const tipY = topY + rx

          return (
            <g
              key={assignment.id}
              className="transition-transform duration-200"
              style={{
                transform: isActive ? "translateY(-5px)" : undefined,
              }}
            >
              {/* Active glow beacon */}
              {isActive && (
                <circle
                  cx={cx}
                  cy={tipY}
                  r={rx + 5}
                  fill="none"
                  stroke={assignment.color}
                  strokeWidth="1.8"
                  strokeDasharray="3,3"
                  className="animate-spin"
                  style={{ transformOrigin: `${cx}px ${tipY}px`, animationDuration: "6s" }}
                />
              )}

              {/* Finger digit cylinder */}
              <rect
                x={cx - rx}
                y={topY}
                width={width}
                height={height}
                rx={rx}
                fill={isActive ? `url(#grad-${assignment.id})` : "currentColor"}
                fillOpacity={isActive ? 1 : 0.08}
                stroke={isActive ? assignment.color : "currentColor"}
                strokeOpacity={isActive ? 1 : 0.25}
                strokeWidth={isActive ? 2.5 : 1}
                className="text-[var(--foreground)]"
              />

              {/* Knuckle crease joints (2 horizontal lines like real fingers) */}
              <line
                x1={cx - rx + 4}
                y1={topY + height * 0.42}
                x2={cx + rx - 4}
                y2={topY + height * 0.42}
                stroke={isActive ? assignment.color : "currentColor"}
                strokeOpacity={isActive ? 0.9 : 0.25}
                strokeWidth="1.2"
                strokeLinecap="round"
                className="text-[var(--muted)]"
              />
              <line
                x1={cx - rx + 5}
                y1={topY + height * 0.68}
                x2={cx + rx - 5}
                y2={topY + height * 0.68}
                stroke={isActive ? assignment.color : "currentColor"}
                strokeOpacity={isActive ? 0.9 : 0.25}
                strokeWidth="1.2"
                strokeLinecap="round"
                className="text-[var(--muted)]"
              />

              {/* Fingertip target / home row disk */}
              <circle
                cx={cx}
                cy={tipY}
                r={rx - 2}
                fill={isActive ? assignment.color : "currentColor"}
                fillOpacity={isActive ? 1 : 0.2}
                stroke={isActive ? "#ffffff" : "currentColor"}
                strokeOpacity={isActive ? 0.9 : 0.3}
                strokeWidth={isActive ? 2 : 1}
                className="text-[var(--foreground)]"
              />
              <text
                x={cx}
                y={tipY + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                fill={isActive ? "#ffffff" : "currentColor"}
                className="text-[var(--foreground)] select-none font-sans"
              >
                {charToShow}
              </text>

              {/* Finger number badge at knuckle base (1 to 5) */}
              <circle
                cx={cx}
                cy={knuckleY}
                r="8"
                fill={isActive ? assignment.color : "currentColor"}
                fillOpacity={isActive ? 1 : 0.15}
                stroke={isActive ? "#ffffff" : "currentColor"}
                strokeOpacity={isActive ? 0.9 : 0.3}
                strokeWidth="1"
                className="text-[var(--foreground)]"
              />
              <text
                x={cx}
                y={knuckleY + 3}
                textAnchor="middle"
                fontSize="9"
                fontWeight="900"
                fill={isActive ? "#ffffff" : "currentColor"}
                className="text-[var(--foreground)] select-none font-mono"
              >
                {assignment.fingerNumber}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Keys assigned to this hand's fingers */}
      <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap px-1">
        {specs.map(({ assignment }) => {
          const isFActive = activeFinger?.id === assignment.id
          return (
            <div
              key={assignment.id}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] border transition-all duration-150 select-none",
                isFActive
                  ? "border-current font-bold scale-105 shadow-sm"
                  : "border-[var(--chrome-border)]/50 opacity-75 hover:opacity-100"
              )}
              style={{
                color: assignment.color,
                backgroundColor: isFActive ? `${assignment.color}22` : undefined,
              }}
              title={`${assignment.fingerName} (${assignment.fingerOrdinal})`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: assignment.color }}
              />
              <span className="font-mono font-bold">{assignment.shortCode}</span>
              <span className="text-[8px] uppercase opacity-80">
                {assignment.keys.filter((k) => k !== " ").slice(0, 3).join("")}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export const HandPlacementGuide = memo(function HandPlacementGuide({
  targetLetter,
  currentChar,
}: HandPlacementGuideProps) {
  const activeChar = currentChar || targetLetter
  const activeFinger = useMemo(() => getFingerForChar(activeChar), [activeChar])

  return (
    <div className="w-full max-w-[760px] mx-auto px-1 sm:px-3 mt-2 sm:mt-3 select-none">
      <div className="rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] backdrop-blur-md p-3 sm:p-4 shadow-sm">
        {/* Header Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[var(--chrome-border)]/60 text-xs">
          <div className="flex items-center gap-2">
            <HandIcon className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-bold text-[var(--foreground)] tracking-tight text-xs sm:text-[13px]">
              Finger Placement Guide
            </span>
          </div>

          {/* Active Finger Spotlight Banner */}
          {activeFinger ? (
            <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-xs text-[var(--foreground)] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
              <span>Strike</span>
              <strong
                className="uppercase px-1.5 py-0.5 rounded shadow-sm text-white font-mono text-[11px]"
                style={{ backgroundColor: activeFinger.color }}
              >
                {activeChar === " " ? "Space" : activeChar}
              </strong>
              <span>with</span>
              <strong
                className="font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${activeFinger.color}18`,
                  color: activeFinger.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: activeFinger.color }}
                />
                {activeFinger.hand === "left" ? "Left Hand" : "Right Hand"} · {activeFinger.fingerOrdinal}
              </strong>
              <span className="text-[10px] text-[var(--muted)]">
                (Home: <strong>{activeFinger.homeKey}</strong>)
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--muted)]">
              Rest hands on Home Row:{" "}
              <strong className="text-[var(--foreground)] font-mono">
                A S D F — J K L ;
              </strong>
            </div>
          )}
        </div>

        {/* Realistic Hands Container (Left & Right Hands Side-by-Side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-items-center">
          <RealisticHand
            hand="left"
            activeFinger={activeFinger}
            targetChar={activeChar}
          />
          <RealisticHand
            hand="right"
            activeFinger={activeFinger}
            targetChar={activeChar}
          />
        </div>
      </div>
    </div>
  )
})
