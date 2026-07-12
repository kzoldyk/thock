"use client"

import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

export function VortexKeyboardCase({ totalWidth }: { totalWidth: number }) {
  const { scene } = useGLTF("/models/vortexseries_mechanical_keyboard_gt-8__nj80.glb")

  const model = useMemo(() => {
    const root = scene.clone(true)

    // Traverse and hide all keys based on their material name
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matName = (child.material as THREE.Material)?.name || ""
        const isCaseOrKnobOrPlate = 
          /case/i.test(matName) || 
          /knob/i.test(matName) || 
          /plate/i.test(matName)

        child.visible = isCaseOrKnobOrPlate
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Compute bounding box of visible meshes (case, plate, knob)
    const box = new THREE.Box3()
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.visible) {
        box.expandByObject(child)
      }
    })

    const modelWidth = box.max.x - box.min.x
    const scale = totalWidth / modelWidth
    root.scale.set(scale, scale, scale)

    // Center at origin
    const cx = (box.max.x + box.min.x) / 2
    const cz = (box.max.z + box.min.z) / 2
    root.position.set(-cx * scale, (-box.max.y * scale) + 0.001, -cz * scale)

    return root
  }, [scene, totalWidth])

  return <primitive object={model} />
}
