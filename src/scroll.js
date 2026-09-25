import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Design grid: 1920x1080. --uw = 1 design px by width (page chrome),
// --u = 1 design px fitted into the viewport (pinned full-screen scenes),
// --c = 1 design px covering the viewport (video-locked layers, no empty bands).
export const units = { uw: 1, u: 1, c: 1, w: 0, h: 0 }

export function measure() {
  const w = document.documentElement.clientWidth
  const h = window.innerHeight
  if (w === units.w && h === units.h) return
  Object.assign(units, { w, h, uw: w / 1920, u: Math.min(w / 1920, h / 1080), c: Math.max(w / 1920, h / 1080) })
  const s = document.documentElement.style
  s.setProperty('--uw', `${units.uw}px`)
  s.setProperty('--u', `${units.u}px`)
  s.setProperty('--c', `${units.c}px`)
  s.setProperty('--sx', `${(w - 1920 * units.u) / 2}px`) // left edge of the fitted stage
  ScrollTrigger.refresh()
}
measure()
window.addEventListener('resize', measure)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Slow, heavy scroll: lower lerp = longer glide after the wheel stops.
export const lenis = new Lenis({ lerp: reduced ? 1 : 0.06, wheelMultiplier: 0.9 })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
