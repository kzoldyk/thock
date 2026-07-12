import type { SoundPack } from "@/types"

let cachedManifest: SoundPack[] | null = null
const loadedPacks = new Map<string, SoundPack>()

export async function fetchSoundManifest(): Promise<SoundPack[]> {
  if (cachedManifest) return cachedManifest
  try {
    const res = await fetch("/sounds/sounds.json")
    if (!res.ok) throw new Error("No sound manifest")
    const manifest: SoundPack[] = await res.json()
    cachedManifest = manifest

    for (const entry of manifest) {
      try {
        const packRes = await fetch(entry.path!)
        if (packRes.ok) {
          const pack: SoundPack = await packRes.json()
          pack.id = entry.id
          loadedPacks.set(entry.id, pack)
        }
      } catch {}
    }

    return manifest
  } catch {
    cachedManifest = []
    return []
  }
}

export function getLoadedPack(id: string): SoundPack | undefined {
  return loadedPacks.get(id)
}
