"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { RoundedBox, Text } from "@react-three/drei"
import * as THREE from "three"
import type { KeyDef } from "@/types"

interface KeycapProps {
  def: KeyDef
  width: number
  depth: number
  height: number
  rowAngle: number
  pressedRef: React.MutableRefObject<Record<string, number>>
  keycapColor: string
  pressedColor: string
  activeColor: string
  labelColor: string
  labelActiveColor: string
  onKeyPress?: (code: string, label?: string) => void
  onKeyRelease?: (code: string) => void
}

const TRAVEL = 0.018
const SPRING_STIFFNESS = 0.35
const SPRING_DAMPING = 0.22

export function Keycap({
  def,
  width,
  depth,
  height,
  rowAngle,
  pressedRef,
  keycapColor,
  pressedColor,
  activeColor,
  labelColor,
  labelActiveColor,
  onKeyPress,
  onKeyRelease,
}: KeycapProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)
  const y = useRef(0)
  const target = useRef(0)
  const v = useRef(0)

  const color = useMemo(() => new THREE.Color(keycapColor), [keycapColor])
  const active = useMemo(() => new THREE.Color(activeColor), [activeColor])

  useFrame(() => {
    const isDown = pressedRef.current[def.code] === 1
    target.current = isDown ? -TRAVEL : 0

    v.current += (target.current - y.current) * SPRING_STIFFNESS
    v.current *= 1 - SPRING_DAMPING
    y.current += v.current

    if (groupRef.current) {
      groupRef.current.position.y = y.current
    }

    if (matRef.current) {
      const t = isDown ? 1 : Math.max(0, 1 - (0 - y.current) / TRAVEL)
      if (t > 0.01) {
        matRef.current.color.lerp(active, 0.12)
        matRef.current.emissiveIntensity = t * 0.3
      } else {
        matRef.current.color.lerp(color, 0.08)
        matRef.current.emissiveIntensity = 0
      }
    }

    if (textRef.current) {
      textRef.current.color = isDown ? labelActiveColor : labelColor
    }
  })

  return (
    <group rotation-x={rowAngle}>
      <group
        ref={groupRef}
        onPointerDown={(e) => {
          e.stopPropagation()
          onKeyPress?.(def.code, def.label)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          onKeyRelease?.(def.code)
        }}
        onPointerOut={() => {
          onKeyRelease?.(def.code)
        }}
      >
        <RoundedBox
          args={[width, height, depth]}
          radius={0.007}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            ref={matRef}
            color={color}
            metalness={0.02}
            roughness={0.82}
            envMapIntensity={0.3}
            emissive={active}
            emissiveIntensity={0}
          />
        </RoundedBox>
        <Text
          ref={textRef}
          position={[0, height / 2 + 0.0015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.013}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
        >
          {def.label}
        </Text>
      </group>
    </group>
  )
}

