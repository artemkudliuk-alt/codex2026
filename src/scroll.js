import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Design grid: 1920x1080. --uw = 1 design px by width (page chrome),
// --u = 1 design px fitted into the viewport (pinned full-screen scenes),
// --c = 1 design px covering the viewport (video-locked layers, no empty bands).
// Phones (<768): their own layout on a 390 x 844 grid, --m = 1 layout px by width.
const phone = window.matchMedia('(max-width: 767px)')
export const units = { uw: 1, u: 1, c: 1, m: 1, w: 0, h: 0, mu: 1, mobile: phone.matches }
// the two layouts build different scenes (pins, timelines): crossing the breakpoint reloads
phone.addEventListener('change', () => window.location.reload())

export function measure() {
  const w = document.documentElement.clientWidth
  const h = window.innerHeight
  if (w === units.w && h === units.h) return
  // phones: the address bar showing / hiding changes only the height - no re-layout mid-scroll
  if (units.mobile && w === units.w) return
  Object.assign(units, { w, h, uw: w / 1920, u: Math.min(w / 1920, h / 1080), c: Math.max(w / 1920, h / 1080), m: w / 390, mu: Math.min(w / 390, h / 844) })
  const s = document.documentElement.style
  s.setProperty('--uw', `${units.uw}px`)
  s.setProperty('--u', `${units.u}px`)
  s.setProperty('--c', `${units.c}px`)
  s.setProperty('--m', `${units.m}px`)
  s.setProperty('--mu', `${units.mu}px`) // 390 x 844 fitted into the screen (pinned phone scenes)
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
