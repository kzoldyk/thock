"use client"

import { useRef, useMemo, forwardRef, useImperativeHandle } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { Keycap } from "./Keycap"
import { VortexKeyboardCase } from "./VortexKeyboardCase"
import { getLayout } from "@/lib/keyboard-layouts"
import { keyboardThemes } from "@/lib/themes"
import type { LayoutId } from "@/types"

useGLTF.preload("/models/vortexseries_mechanical_keyboard_gt-8__nj80.glb")

export interface KeyboardHandle {
  pressKey: (code: string) => void
  releaseKey: (code: string) => void
}

interface KeyboardSceneInnerProps {
  layoutId: LayoutId
  themeId: string
  pressedRef: React.MutableRefObject<Record<string, number>>
}

const UNIT = 0.06
const GAP = 0.003
const KEY_H = 0.018
const ROW_GAP = 0.07
const TRAVEL = 0.018
const ROW_ANGLES = [0.12, 0.06, 0, -0.06, -0.12, -0.08]

function getKeyType(code: string): "esc" | "modifier" | "number" | "alpha" {
  if (code === "Escape") return "esc"
  if (
    [
      "Tab", "CapsLock", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
      "AltLeft", "AltRight", "MetaLeft", "MetaRight", "Backspace", "Enter",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"
    ].includes(code)
  ) {
    return "modifier"
  }
  if (/^Digit\d/.test(code) || code === "Minus" || code === "Equal" || /^F\d/.test(code) || ["PageUp", "PageDown", "Home", "End", "Delete", "Insert"].includes(code)) {
    return "number"
  }
  return "alpha"
}

function KeyboardSceneInner({ layoutId, themeId, pressedRef }: KeyboardSceneInnerProps) {
  const { camera } = useThree()
  const shakeRef = useRef({ x: 0, y: 0, t: 0 })

  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const theme = useMemo(
    () => keyboardThemes.find((t) => t.id === themeId) || keyboardThemes[0],
    [themeId],
  )

  const totalCols = layout.totalColumns
  const totalRows = layout.rows
  const totalWidth = totalCols * UNIT
  const totalDepth = (totalRows - 1) * ROW_GAP + UNIT

  useFrame((_, delta) => {
    if (shakeRef.current.t > 0) {
      shakeRef.current.t -= delta * 2
      const i = Math.max(0, shakeRef.current.t)
      camera.position.x = shakeRef.current.x * i
      camera.position.y = 0.35 + shakeRef.current.y * i
    } else {
      camera.position.x = 0
      camera.position.y = 0.35
    }
  })

  return (
    <group>
      <ambientLight color={theme?.ambientColor || "#ffffff"} intensity={0.5} />
      <directionalLight
        position={[2, 4, 3]}
        intensity={theme?.lightIntensity || 0.7}
        color={theme?.lightColor || "#ffffff"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-2, 3, -1.5]}
        intensity={0.25}
        color={theme?.lightColor || "#ffffff"}
      />

      {/* Case from the Vortex model */}
      <VortexKeyboardCase totalWidth={totalWidth} />

      <ContactShadows
        position={[0, -0.025, 0]}
        opacity={0.4}
        scale={[totalWidth + 0.3, totalDepth + 0.3]}
        blur={3.5}
        far={0.15}
      />

      {/* Keys — assigned x from layout */}
      {layout.keys.map((def) => {
        const xPos = ((def.x + def.width / 2) - totalCols / 2) * UNIT
        const zPos = (-def.row + (totalRows - 1) / 2) * ROW_GAP

        const keyType = getKeyType(def.code)
        let keyColor = theme?.keycap || "#ffffff"
        let labelColor = theme?.label || "#2b2b2b"

        if (keyType === "esc" && theme?.escBg) {
          keyColor = theme.escBg
          labelColor = theme.escLabel || "#ffffff"
        } else if (keyType === "modifier" && theme?.modifierBg) {
          keyColor = theme.modifierBg
          labelColor = theme.modifierLabel || "#ffffff"
        } else if (keyType === "number" && theme?.numberBg) {
          keyColor = theme.numberBg
          labelColor = theme.numberLabel || "#2b2b2b"
        }

        return (
          <group key={def.code} position={[xPos, 0, zPos]}>
            <Keycap
              def={def}
              width={def.width * UNIT - GAP}
              depth={UNIT - GAP}
              height={KEY_H}
              rowAngle={ROW_ANGLES[def.row] || 0}
              pressedRef={pressedRef}
              keycapColor={keyColor}
              pressedColor={theme?.keycapPressed || "#ffdcd0"}
              activeColor={theme?.keycapActive || "#fff5f0"}
              labelColor={labelColor}
              labelActiveColor={theme?.labelActive || "#ff7a45"}
            />
          </group>
        )
      })}
    </group>
  )
}

export const KeyboardScene = forwardRef<KeyboardHandle, { layoutId: LayoutId; themeId: string }>(
  function KeyboardScene({ layoutId, themeId }, ref) {
    const pressedRef = useRef<Record<string, number>>({})

    useImperativeHandle(ref, () => ({
      pressKey(code: string) {
        pressedRef.current[code] = 1
      },
      releaseKey(code: string) {
        pressedRef.current[code] = 0
      },
    }))

    return (
      <div className="w-full h-[280px] sm:h-[360px]">
        <Canvas
          camera={{ position: [0, 0.35, 0.55], fov: 38, near: 0.01, far: 10 }}
          dpr={[1, 1.5]}
          shadows
          frameloop="always"
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        >
          <KeyboardSceneInner layoutId={layoutId} themeId={themeId} pressedRef={pressedRef} />
        </Canvas>
      </div>
    )
  },
)
