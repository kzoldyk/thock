"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const COLORS = ["var(--accent)", "#fbbf24", "#34d399", "#38bdf8", "#f87171"]
const COUNT = 70

interface Particle {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  rotate: number
  drift: number
  color: string
  round: boolean
}

function generateParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.9 + Math.random() * 1.2,
    size: 5 + Math.random() * 7,
    rotate: (Math.random() - 0.5) * 720,
    drift: (Math.random() - 0.5) * 160,
    color: COLORS[i % COLORS.length],
    round: Math.random() > 0.6,
  }))
}

/**
 * F2 — Confetti burst for verified personal bests only.
 * Lightweight framer-motion particles, pointer-events-none, self-cleaning
 * (parent unmounts after ~3s). Particles generated post-mount to keep
 * render pure.
 */
export function ConfettiBurst() {
  const [particles, setParticles] = useState<Particle[] | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setParticles(generateParticles()), 0)
    return () => clearTimeout(t)
  }, [])

  if (!particles) return null

  return (
    <div className="fixed inset-0 z-[65] pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: "-4vh", opacity: 1, rotate: 0 }}
          animate={{ y: "108vh", x: `calc(${p.x}vw + ${p.drift}px)`, opacity: [1, 1, 0.7], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.4, 0.6, 1] }}
          className="absolute top-0"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : 1,
          }}
        />
      ))}
    </div>
  )
}
