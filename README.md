# thock. ⌨️

A premium, luxury typing experience for mechanical keyboard enthusiasts who care way too much about how their keystrokes sound. No boring typing tests allowed.

---

## 🌟 What is this?

- **Typewriter Horizontal Scroll**: Because standard paragraph wrapping is so 1999.
- **Acoustic Clacks & Thocks**: Low-latency, spatialized stereo click sounds that pan depending on where you press on the keyboard. We are that extra.
- **2D & 3D Visualizers**: Watch a digital keyboard depress keys in real-time. Supports a photorealistic 3D mechanical keyboard model that reacts with physical spring equations.
- **Locked Stats**: WPM, Accuracy, Consistency, and Streak metrics that lock the millisecond you finish. No post-test stats drift allowed.
- **Workspace Customizer**: Press `Esc` to toggle the settings modal and customize themes, fonts, switches pack, acoustic dampeners, time limits, complexity modes, and more.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Audio Manifest Slicing
Make sure you have `ffmpeg` installed (e.g. `brew install ffmpeg`), then slice the raw Cherry Blue WAV file into individual keycap sounds:
```bash
npm run prepare-sounds
```

### 3. Spin it up
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) and type like you mean it.

---

## 🛠️ Tech Stack

- **AI Architect**: Antigravity (Gemini) — did 99% of the heavy lifting while the developer drank coffee.
- **Framework**: Next.js 16 (React 19)
- **3D Engine**: React Three Fiber + Three.js
- **State Management**: Zustand
- **Audio Graph**: Web Audio API (stereo panners, reverb convolvers, gain nodes)
- **Styling**: Tailwind CSS + Glassmorphism
