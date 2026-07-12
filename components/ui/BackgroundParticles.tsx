"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/stores/useAppStore"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  targetAlpha: number
}

export function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const appThemeId = useAppStore((s) => s.appThemeId)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      const particleCount = Math.min(35, Math.floor((canvas.width * canvas.height) / 45000))
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -Math.random() * 0.2 - 0.05, // slowly float upwards
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.12,
          targetAlpha: Math.random() * 0.12 + 0.03,
        })
      }
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set particle color based on light/dark theme
      const isDarkTheme = document.documentElement.classList.contains("dark") || 
                          ["dark", "oled", "coffee", "rain", "night-studio"].includes(appThemeId)
      
      const rgb = isDarkTheme ? "255, 255, 255" : "0, 0, 0"

      particles.forEach((p) => {
        // Slowly update alpha for a twinkling breathing effect
        p.alpha += (p.targetAlpha - p.alpha) * 0.02
        if (Math.abs(p.alpha - p.targetAlpha) < 0.01) {
          p.targetAlpha = Math.random() * 0.12 + 0.03
        }

        ctx.beginPath()
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, `rgba(${rgb}, ${p.alpha})`)
        gradient.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.fillStyle = gradient
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Only update position if reduced motion is disabled
        if (!reducedMotion) {
          p.x += p.vx
          p.y += p.vy

          // Wrap around edges
          if (p.x < 0) p.x = canvas.width
          if (p.x > canvas.width) p.x = 0
          if (p.y < 0) {
            p.y = canvas.height
            p.x = Math.random() * canvas.width
          }
        }
      })

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(drawParticles)
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    if (reducedMotion) {
      // Just render one frame statically
      drawParticles()
    } else {
      drawParticles()
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [reducedMotion, appThemeId])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-[0.55]"
    />
  )
}
