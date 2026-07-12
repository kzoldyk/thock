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

  return <motion.span className={className}>{rounded}</motion.span>
}
