"use client"

import { create } from "zustand"
import type { FontFamily, LayoutId } from "@/types"

interface AppStore {
  layoutId: LayoutId
  setLayoutId: (id: LayoutId) => void
  keyboardThemeId: string
  setKeyboardThemeId: (id: string) => void
  appThemeId: string
  setAppThemeId: (id: string) => void
  switchPackId: string
  setSwitchPackId: (id: string) => void
  volume: number
  setVolume: (v: number) => void
  keyVolume: number
  setKeyVolume: (v: number) => void
  reducedMotion: boolean
  setReducedMotion: (v: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  stereoWidth: number
  setStereoWidth: (v: number) => void
  reverb: number
  setReverb: (v: number) => void
  pitch: number
  setPitch: (v: number) => void
  fontFamily: FontFamily
  setFontFamily: (font: FontFamily) => void
  typingMode: "time" | "words" | "quotes"
  setTypingMode: (mode: "time" | "words" | "quotes") => void
  showKeyboard: boolean
  setShowKeyboard: (v: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  keyboardType: "2d" | "3d"
  setKeyboardType: (v: "2d" | "3d") => void
  flowMode: boolean
  setFlowMode: (v: boolean) => void
  activeEffect: string | null
  setActiveEffect: (v: string | null) => void
  explosions: { id: string; x: number; y: number }[]
  addExplosion: () => void
  removeExplosion: (id: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  layoutId: "75",
  setLayoutId: (id) => set({ layoutId: id }),
  keyboardThemeId: "keeby-retro",
  setKeyboardThemeId: (id) => set({ keyboardThemeId: id }),
  appThemeId: "keeby-light",
  setAppThemeId: (id) => set({ appThemeId: id }),
  switchPackId: "default",
  setSwitchPackId: (id) => set({ switchPackId: id }),
  volume: 0.8,
  setVolume: (v) => set({ volume: v }),
  keyVolume: 1.0,
  setKeyVolume: (v) => set({ keyVolume: v }),
  reducedMotion: false,
  setReducedMotion: (v) => set({ reducedMotion: v }),
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  stereoWidth: 0.8,
  setStereoWidth: (v) => set({ stereoWidth: v }),
  reverb: 0.2,
  setReverb: (v) => set({ reverb: v }),
  pitch: 1.0,
  setPitch: (v) => set({ pitch: v }),
  fontFamily: "inter",
  setFontFamily: (font) => set({ fontFamily: font }),
  typingMode: "time",
  setTypingMode: (mode) => set({ typingMode: mode }),
  showKeyboard: true,
  setShowKeyboard: (v) => set({ showKeyboard: v }),
  soundEnabled: true,
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  keyboardType: "2d",
  setKeyboardType: (v) => set({ keyboardType: v }),
  flowMode: false,
  setFlowMode: (v) => set({ flowMode: v }),
  activeEffect: null,
  setActiveEffect: (v) => set({ activeEffect: v }),
  explosions: [],
  addExplosion: () => set((state) => {
    // Generate random x, y between 10% and 90% of screen to keep them visible
    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 80;
    return { 
      explosions: [...state.explosions, { id: Math.random().toString(36).substring(2, 9), x, y }] 
    };
  }),
  removeExplosion: (id) => set((state) => ({
    explosions: state.explosions.filter(e => e.id !== id)
  })),
}))
