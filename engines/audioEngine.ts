class AudioEngine {
  private ctx: AudioContext | null = null
  private downBuffers: AudioBuffer[] = []
  private upBuffers: AudioBuffer[] = []
  private lastDownIndex = -1
  private lastUpIndex = -1
  private masterGain: GainNode | null = null
  private initialized = false
  private loaded = false

  get isReady(): boolean {
    return this.initialized && this.loaded
  }

  async init() {
    if (this.initialized) return
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
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
      this.initialized = true
      console.warn("[audio] engine initialized, ctx state:", ctx.state)

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

  private async resumeContext(): Promise<void> {
    if (this.ctx?.state === "suspended") {
      try {
        await this.ctx.resume()
        console.warn("[audio] context resumed successfully")
      } catch {
        // resume can fail if called outside user gesture; ignore
      }
    }
  }

  private playClick(down: boolean) {
    console.warn("[audio] playClick fallback trigger, down =", down)
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
      console.warn("[audio] playClick fallback oscillator played successfully")
    } catch (e) {
      console.error("[audio] playClick fallback error:", e)
    }
  }

  async loadPack(packId: string) {
    if (!this.ctx) {
      console.warn("[audio] loadPack ignored: ctx not initialized")
      return
    }

    try {
      console.warn("[audio] loadPack starting for packId:", packId)
      console.warn("[audio] fetching manifest /sounds/sounds.json...")
      const res = await fetch("/sounds/sounds.json")
      if (!res.ok) {
        console.warn("[audio] manifest not found, status:", res.status)
        return
      }
      const manifest = await res.json()
      console.warn("[audio] manifest loaded:", manifest)
      
      const entry = manifest.find((e: any) => e.id === packId)
      if (!entry) {
        console.warn("[audio] pack not found in manifest:", packId)
        return
      }

      console.warn("[audio] fetching pack config from:", entry.path)
      const packRes = await fetch(entry.path)
      if (!packRes.ok) {
        console.warn("[audio] pack config fetch failed:", entry.path, "status:", packRes.status)
        return
      }
      const pack = await packRes.json()
      console.warn("[audio] pack config loaded:", pack)

      const downUrls: string[] = pack.down || []
      const upUrls: string[] = pack.up || []

      console.warn(`[audio] starting fetch/decode for ${downUrls.length} down, ${upUrls.length} up samples...`)
      const downPromises = downUrls.map((url: string) => this.loadBuffer(url))
      const upPromises = upUrls.map((url: string) => this.loadBuffer(url))

      this.downBuffers = (await Promise.all(downPromises)).filter(Boolean) as AudioBuffer[]
      this.upBuffers = (await Promise.all(upPromises)).filter(Boolean) as AudioBuffer[]

      console.warn(`[audio] load finished. Decoded buffers: ${this.downBuffers.length} down, ${this.upBuffers.length} up`)
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
      console.warn("[audio] loadBuffer fetching file:", fullUrl)
      const res = await fetch(fullUrl)
      if (!res.ok) {
        console.warn("[audio] loadBuffer fetch failed:", fullUrl, "status:", res.status)
        return null
      }
      const arrayBuffer = await res.arrayBuffer()
      console.warn("[audio] loadBuffer decoding arrayBuffer for:", fullUrl)
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
      console.warn("[audio] loadBuffer successfully decoded:", fullUrl)
      return audioBuffer
    } catch (err) {
      console.error("[audio] loadBuffer exception for:", url, err)
      return null
    }
  }

  async playDown(code: string, panValue: number) {
    console.warn("[audio] playDown: code =", code, "pan =", panValue, "ctx state =", this.ctx?.state, "loaded =", this.loaded, "buffers =", this.downBuffers.length)
    if (!this.ctx || !this.masterGain) {
      console.warn("[audio] playDown ignored: ctx or masterGain not initialized")
      return
    }
    await this.resumeContext()

    if (!this.loaded || this.downBuffers.length === 0) {
      console.warn("[audio] playDown: no buffers loaded, playing click fallback")
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
      
      source.playbackRate.value = baseRate + (Math.random() - 0.5) * 0.04

      const gain = this.ctx.createGain()
      // Adjust volume based on key
      let volume = 1.0;
      if (code === "Space") volume = 1.3;
      else if (code === "Enter") volume = 1.2;
      gain.gain.value = volume;

      // Stereo panning fallback check
      let panNode: StereoPannerNode | null = null
      if (typeof this.ctx.createStereoPanner === "function") {
        try {
          panNode = this.ctx.createStereoPanner()
          panNode.pan.value = panValue
        } catch (e) {
          console.warn("[audio] createStereoPanner failed, falling back to mono:", e)
        }
      }

      if (panNode) {
        source.connect(panNode)
        panNode.connect(gain)
      } else {
        source.connect(gain)
      }

      gain.connect(this.masterGain)
      source.start()
      console.warn("[audio] playDown trigger source.start() succeeded for buffer index:", idx)
    } catch (e) {
      console.error("[audio] playDown execution error:", e)
    }
  }

  async playUp(code: string, panValue: number) {
    console.warn("[audio] playUp: code =", code, "pan =", panValue, "ctx state =", this.ctx?.state, "loaded =", this.loaded, "buffers =", this.upBuffers.length)
    if (!this.ctx || !this.masterGain) {
      console.warn("[audio] playUp ignored: ctx or masterGain not initialized")
      return
    }
    await this.resumeContext()

    if (!this.loaded || this.upBuffers.length === 0) {
      console.warn("[audio] playUp: no buffers loaded, playing click fallback")
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
      
      source.playbackRate.value = baseRate + (Math.random() - 0.5) * 0.04

      const gain = this.ctx.createGain()
      // Adjust volume based on key
      let volume = 0.7;
      if (code === "Space") volume = 0.9;
      else if (code === "Enter") volume = 0.85;
      gain.gain.value = volume;

      // Stereo panning fallback check
      let panNode: StereoPannerNode | null = null
      if (typeof this.ctx.createStereoPanner === "function") {
        try {
          panNode = this.ctx.createStereoPanner()
          panNode.pan.value = panValue
        } catch (e) {
          console.warn("[audio] createStereoPanner failed, falling back to mono:", e)
        }
      }

      if (panNode) {
        source.connect(panNode)
        panNode.connect(gain)
      } else {
        source.connect(gain)
      }

      gain.connect(this.masterGain)
      source.start()
      console.warn("[audio] playUp trigger source.start() succeeded for buffer index:", idx)
    } catch (e) {
      console.error("[audio] playUp execution error:", e)
    }
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v
  }

  dispose() {
    if (this.ctx) this.ctx.close()
    this.ctx = null
    this.initialized = false
    this.loaded = false
  }
}

export const audioEngine = new AudioEngine()
