import { useAppStore } from "@/stores/useAppStore"

class AudioEngine {
  private ctx: AudioContext | null = null
  private downBuffers: AudioBuffer[] = []
  private upBuffers: AudioBuffer[] = []
  private lastDownIndex = -1
  private lastUpIndex = -1
  private masterGain: GainNode | null = null
  private convolver: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private dampenerFilter: BiquadFilterNode | null = null
  private initialized = false
  private loaded = false

  get isReady(): boolean {
    return this.initialized && this.loaded
  }

  private createReverbImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error("No AudioContext initialized")
    const sampleRate = this.ctx.sampleRate
    const length = sampleRate * duration
    const impulse = this.ctx.createBuffer(2, length, sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)
    
    for (let i = 0; i < length; i++) {
      const percent = i / length
      const decayFactor = Math.exp(-percent * decay)
      left[i] = (Math.random() * 2 - 1) * decayFactor
      right[i] = (Math.random() * 2 - 1) * decayFactor
    }
    return impulse
  }

  async init() {
    if (this.initialized) return
    try {
      const AudioCtx = (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || 
                       (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) {
        console.error("[audio] Web Audio API is not supported in this browser")
        return
      }
      const ctx = new AudioCtx()
      this.ctx = ctx
      
      const masterGain = ctx.createGain()
      this.masterGain = masterGain
      masterGain.gain.value = 0.8
      masterGain.connect(ctx.destination)

      const dampenerFilter = ctx.createBiquadFilter()
      this.dampenerFilter = dampenerFilter
      dampenerFilter.connect(masterGain)

      // Parallel Reverb setup
      try {
        const convolver = ctx.createConvolver()
        convolver.buffer = this.createReverbImpulseResponse(1.5, 4.0)
        this.convolver = convolver

        const reverbGain = ctx.createGain()
        reverbGain.gain.value = useAppStore.getState().reverb
        this.reverbGain = reverbGain

        convolver.connect(reverbGain)
        reverbGain.connect(masterGain)
        
        // Route filtered signal to reverb path
        dampenerFilter.connect(convolver)
      } catch (err) {
        console.error("[audio] reverb setup failed", err)
      }

      // Sync dampener presets
      useAppStore.subscribe((state) => {
        this.updateDampenerFilter(state.dampenerId)
      })
      this.updateDampenerFilter(useAppStore.getState().dampenerId)

      this.initialized = true

      if (typeof window !== "undefined") {
        const resume = () => {
          this.resumeContext()
          window.removeEventListener("click", resume)
          window.removeEventListener("keydown", resume)
        }
        window.addEventListener("click", resume)
        window.addEventListener("keydown", resume)
      }
    } catch (e) {
      console.error("[audio] init failed", e)
    }
  }

  updateDampenerFilter(id: string) {
    if (!this.ctx || !this.dampenerFilter) return
    const now = this.ctx.currentTime

    if (id === "tape") {
      // Tape mod: creamy mids, peaked at 800Hz with high focus, slight high roll off
      this.dampenerFilter.type = "peaking"
      this.dampenerFilter.frequency.setValueAtTime(800, now)
      this.dampenerFilter.Q.setValueAtTime(1.8, now)
      this.dampenerFilter.gain.setValueAtTime(5, now)
    } else if (id === "foam") {
      // Foam mod: deep low thock, cuts off high-pitched plastic frequencies (clacks)
      this.dampenerFilter.type = "lowpass"
      this.dampenerFilter.frequency.setValueAtTime(950, now)
      this.dampenerFilter.Q.setValueAtTime(0.8, now)
    } else if (id === "gasket") {
      // Gasket mount: cushioned, soft roll off
      this.dampenerFilter.type = "lowpass"
      this.dampenerFilter.frequency.setValueAtTime(1800, now)
      this.dampenerFilter.Q.setValueAtTime(0.65, now)
    } else {
      // "none" -> bypass (lowpass at Nyquist limit)
      this.dampenerFilter.type = "lowpass"
      this.dampenerFilter.frequency.setValueAtTime(20000, now)
    }
  }

  async playThockSpecial() {
    if (!this.ctx || !this.masterGain) return
    await this.resumeContext()
    try {
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(95, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.16)
      
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(130, this.ctx.currentTime)
      
      gain.gain.setValueAtTime(0.65, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start()
      osc.stop(this.ctx.currentTime + 0.2)
    } catch (e) {
      console.error("[audio] special thock failed", e)
    }
  }

  private async resumeContext(): Promise<void> {
    if (this.ctx?.state === "suspended") {
      try {
        await this.ctx.resume()
      } catch {
        // resume can fail if called outside user gesture; ignore
      }
    }
  }

  private playClick(down: boolean) {
    if (!this.ctx || !this.masterGain) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "triangle"
      osc.frequency.value = down ? 800 : 600
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (down ? 0.04 : 0.03))
      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start()
      osc.stop(this.ctx.currentTime + (down ? 0.04 : 0.03))
    } catch (e) {
      console.error("[audio] playClick fallback error:", e)
    }
  }

  async loadPack(packId: string) {
    if (!this.ctx) {
      return
    }

    try {
      const res = await fetch("/sounds/sounds.json")
      if (!res.ok) {
        return
      }
      const manifest = (await res.json()) as { id: string; path: string }[]
      
      const entry = manifest.find((e) => e.id === packId)
      if (!entry) {
        return
      }

      const packRes = await fetch(entry.path)
      if (!packRes.ok) {
        return
      }
      const pack = await packRes.json()

      const downUrls: string[] = pack.down || []
      const upUrls: string[] = pack.up || []

      const downPromises = downUrls.map((url: string) => this.loadBuffer(url))
      const upPromises = upUrls.map((url: string) => this.loadBuffer(url))

      this.downBuffers = (await Promise.all(downPromises)).filter(Boolean) as AudioBuffer[]
      this.upBuffers = (await Promise.all(upPromises)).filter(Boolean) as AudioBuffer[]

      this.loaded = this.downBuffers.length > 0
    } catch (e) {
      console.error("[audio] loadPack error:", e)
      this.loaded = false
    }
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null
    try {
      const fullUrl = url.startsWith("/") ? url : `/${url}`
      const res = await fetch(fullUrl)
      if (!res.ok) {
        return null
      }
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
      return audioBuffer
    } catch (err) {
      console.error("[audio] loadBuffer exception for:", url, err)
      return null
    }
  }

  async playDown(code: string, panValue: number) {
    if (!this.ctx || !this.masterGain) {
      return
    }
    await this.resumeContext()

    if (!this.loaded || this.downBuffers.length === 0) {
      this.playClick(true)
      return
    }

    try {
      let idx: number
      do {
        idx = Math.floor(Math.random() * this.downBuffers.length)
      } while (idx === this.lastDownIndex && this.downBuffers.length > 1)
      this.lastDownIndex = idx

      const buffer = this.downBuffers[idx]
      const source = this.ctx.createBufferSource()
      source.buffer = buffer

      // Pitch variation based on key type and randomness
      let baseRate = 1.0;
      if (code === "Space") baseRate = 0.8; // Deeper
      else if (code === "Enter") baseRate = 0.85;
      else if (code === "Backspace") baseRate = 1.1; // Sharper
      
      const userPitch = useAppStore.getState().pitch
      source.playbackRate.value = (baseRate + (Math.random() - 0.5) * 0.04) * userPitch

      const gain = this.ctx.createGain()
      // Adjust volume based on key and keyVolume setting
      let volume = 1.0;
      if (code === "Space") volume = 1.3;
      else if (code === "Enter") volume = 1.2;
      
      const keyVolume = useAppStore.getState().keyVolume
      gain.gain.value = volume * keyVolume

      // Stereo panning fallback check
      let panNode: StereoPannerNode | null = null
      const stereoWidth = useAppStore.getState().stereoWidth
      if (typeof this.ctx.createStereoPanner === "function") {
        try {
          panNode = this.ctx.createStereoPanner()
          panNode.pan.value = panValue * stereoWidth
        } catch {
          // fallback to mono
        }
      }

      if (panNode) {
        source.connect(panNode)
        panNode.connect(gain)
      } else {
        source.connect(gain)
      }

      if (this.dampenerFilter) {
        gain.connect(this.dampenerFilter)
      } else {
        gain.connect(this.masterGain)
        if (this.convolver) {
          gain.connect(this.convolver)
        }
      }
      
      source.start()
    } catch (e) {
      console.error("[audio] playDown execution error:", e)
    }
  }

  async playUp(code: string, panValue: number) {
    if (!this.ctx || !this.masterGain) {
      return
    }
    await this.resumeContext()

    if (!this.loaded || this.upBuffers.length === 0) {
      this.playClick(false)
      return
    }

    try {
      let idx: number
      do {
        idx = Math.floor(Math.random() * this.upBuffers.length)
      } while (idx === this.lastUpIndex && this.upBuffers.length > 1)
      this.lastUpIndex = idx

      const buffer = this.upBuffers[idx]
      const source = this.ctx.createBufferSource()
      source.buffer = buffer

      // Pitch variation based on key type and randomness
      let baseRate = 1.0;
      if (code === "Space") baseRate = 0.8; // Deeper
      else if (code === "Enter") baseRate = 0.85;
      else if (code === "Backspace") baseRate = 1.1; // Sharper
      
      const userPitch = useAppStore.getState().pitch
      source.playbackRate.value = (baseRate + (Math.random() - 0.5) * 0.04) * userPitch

      const gain = this.ctx.createGain()
      // Adjust volume based on key and keyVolume setting
      let volume = 0.7;
      if (code === "Space") volume = 0.9;
      else if (code === "Enter") volume = 0.85;
      
      const keyVolume = useAppStore.getState().keyVolume
      gain.gain.value = volume * keyVolume

      // Stereo panning fallback check
      let panNode: StereoPannerNode | null = null
      const stereoWidth = useAppStore.getState().stereoWidth
      if (typeof this.ctx.createStereoPanner === "function") {
        try {
          panNode = this.ctx.createStereoPanner()
          panNode.pan.value = panValue * stereoWidth
        } catch {
          // fallback to mono
        }
      }

      if (panNode) {
        source.connect(panNode)
        panNode.connect(gain)
      } else {
        source.connect(gain)
      }

      if (this.dampenerFilter) {
        gain.connect(this.dampenerFilter)
      } else {
        gain.connect(this.masterGain)
        if (this.convolver) {
          gain.connect(this.convolver)
        }
      }

      source.start()
    } catch (e) {
      console.error("[audio] playUp execution error:", e)
    }
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v
  }

  setReverb(v: number) {
    if (this.reverbGain) this.reverbGain.gain.value = v
  }

  dispose() {
    if (this.ctx) this.ctx.close()
    this.ctx = null
    this.initialized = false
    this.loaded = false
  }
}

export const audioEngine = new AudioEngine()
