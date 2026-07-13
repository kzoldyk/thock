"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"

interface Props {
  value: number
  className?: string
  format?: (v: number) => string
}

export function AnimatedNumber({ value, className, format }: Props) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => format ? format(latest) : Math.round(latest).toString())

  useEffect(() => {
    const controls = animate(motionValue, value, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 1,
    })
    return controls.stop
  }, [value, motionValue])

  const yOffset = useTransform(motionValue, (latest) => {
    // If the value is increasing, lift slightly (negative y). 
    // We approximate this by looking at the difference from the current target value.
    const diff = value - latest;
    if (Math.abs(diff) < 0.1) return 0;
    // Cap the lift
    const lift = Math.max(-4, Math.min(4, diff * -0.5));
    return lift;
  });

  return (
    <motion.span 
      className={className}
      style={{ display: "inline-block", y: yOffset }}
    >
      {rounded}
    </motion.span>
  )
}
