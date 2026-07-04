'use client'

// Tiny WebAudio synth — no audio assets, works offline, PWA-friendly.
// Every effect is a short envelope of oscillator notes.

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // iOS suspends the context until a user gesture — sounds are always
  // triggered by taps, so resuming here is allowed.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface Note {
  freq: number
  start: number
  duration: number
  type?: OscillatorType
  volume?: number
}

function play(notes: Note[]) {
  if (!enabled) return
  const ac = audioContext()
  if (!ac) return
  const now = ac.currentTime
  for (const note of notes) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = note.type ?? 'triangle'
    osc.frequency.value = note.freq
    const t0 = now + note.start
    const vol = note.volume ?? 0.12
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + note.duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + note.duration + 0.05)
  }
}

export const sfx = {
  diceRoll() {
    play(Array.from({ length: 5 }, (_, i) => ({
      freq: 300 + Math.random() * 500,
      start: i * 0.07,
      duration: 0.06,
      type: 'square' as OscillatorType,
      volume: 0.05,
    })))
  },
  success() {
    play([
      { freq: 523, start: 0, duration: 0.15 },
      { freq: 659, start: 0.12, duration: 0.15 },
      { freq: 784, start: 0.24, duration: 0.3 },
    ])
  },
  failure() {
    play([
      { freq: 220, start: 0, duration: 0.2, type: 'sawtooth', volume: 0.07 },
      { freq: 185, start: 0.18, duration: 0.35, type: 'sawtooth', volume: 0.07 },
    ])
  },
  hit() {
    play([{ freq: 120, start: 0, duration: 0.2, type: 'sawtooth', volume: 0.15 }])
  },
  chestOpen() {
    play([
      { freq: 392, start: 0, duration: 0.12 },
      { freq: 523, start: 0.1, duration: 0.12 },
      { freq: 659, start: 0.2, duration: 0.12 },
      { freq: 1047, start: 0.32, duration: 0.4, volume: 0.15 },
    ])
  },
  fanfare() {
    play([
      { freq: 523, start: 0, duration: 0.18 },
      { freq: 523, start: 0.15, duration: 0.18 },
      { freq: 659, start: 0.3, duration: 0.18 },
      { freq: 784, start: 0.45, duration: 0.5, volume: 0.16 },
      { freq: 1047, start: 0.6, duration: 0.6, volume: 0.16 },
    ])
  },
  bossAppear() {
    play([
      { freq: 98, start: 0, duration: 0.5, type: 'sawtooth', volume: 0.12 },
      { freq: 104, start: 0.4, duration: 0.5, type: 'sawtooth', volume: 0.12 },
      { freq: 98, start: 0.8, duration: 0.8, type: 'sawtooth', volume: 0.14 },
    ])
  },
  victory() {
    play([
      { freq: 523, start: 0, duration: 0.15 },
      { freq: 659, start: 0.13, duration: 0.15 },
      { freq: 784, start: 0.26, duration: 0.15 },
      { freq: 1047, start: 0.39, duration: 0.3, volume: 0.15 },
      { freq: 784, start: 0.65, duration: 0.15 },
      { freq: 1047, start: 0.78, duration: 0.7, volume: 0.16 },
    ])
  },
}
