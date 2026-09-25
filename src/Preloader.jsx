import { useLayoutEffect, useRef, useState } from 'react'
import { MARK_PATHS } from './logoPaths.js'
import { critical, startQueue } from './load.js'
import './preloader.css'

// Preloader - the Renuvion mechanic (C:\nextweb\renuvion\site\src\components\preloader.tsx):
// 1. the logo outline draws itself;
// 2. the letters fill bottom-up as the page really loads (fonts, window load, the hero video),
//    never faster than the drawing (MIN_MS) and never held longer than MAX_MS;
// 3. fly-through: the shapes turn into windows cut in the navy (a mask), the page shows through
//    them, and the mark rushes into its own centre - the solid middle of the cross - until it
//    covers the screen: the camera passes straight through the centre.
// Client: the mark alone (no wordmark), centred.
// onReveal fires as the windows open (the hero starts its entrance), onDone when it is gone.
// the mark's true bounds are 57.846 x 55.382 (the source file's 56x56 frame cut the right arcs)
const VB = { x: -0.4, y: -0.4, w: 58.646, h: 56.182 }
const FOCUS = { x: 28.9, y: 27.7, r: 8.6 } // the mark's centre is solid (measured radius 8.6)
const MIN_MS = 1900
const MAX_MS = 9000
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

// the hero plus the page's critical set (load.js); once they are in, the rest starts loading
function trackAssets(onProgress) {
  const tasks = [
    ...critical,
    document.fonts?.ready ?? Promise.resolve(),
    document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true })),
  ]
  document.querySelectorAll('video[autoplay]').forEach((v) => {
    tasks.push(v.readyState >= 3 ? Promise.resolve() : new Promise((r) => {
      v.addEventListener('canplaythrough', r, { once: true })
      v.addEventListener('error', r, { once: true })
    }))
  })
  let done = 0
  onProgress(0)
  tasks.forEach((t) => t.then(() => onProgress(++done / tasks.length)))
  Promise.all(tasks).then(startQueue)
}

export default function Preloader({ onReveal, onDone }) {
  const [gone, setGone] = useState(false)
  const logo = useRef(null)
  const hole = useRef(null)
  const zoom = useRef(null)
  const fillRect = useRef(null)
  const fillGroup = useRef(null)
  const holeGroup = useRef(null)

  useLayoutEffect(() => {
    const finish = () => {
      window.scrollTo(0, 0)
      setGone(true)
      onDone?.()
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startQueue()
      onReveal?.()
      finish()
      return undefined
    }

    // the mark, centred and large
    const place = () => {
      if (!logo.current) return undefined // gone (renders null, the effect is still mounted)
      const w = window.innerWidth
      const h = window.innerHeight
      const width = Math.min(w, h) * (w < 768 ? 0.62 : 0.46)
      const height = (width * VB.h) / VB.w
      for (const svg of [logo.current, hole.current]) {
        svg.setAttribute('x', String((w - width) / 2))
        svg.setAttribute('y', String((h - height) / 2))
        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))
      }
      return { w, h, scale: width / VB.w }
    }
    place()
    window.addEventListener('resize', place)

    // 1. draw the outline
    logo.current.querySelectorAll('[data-stroke] path').forEach((p, i) => {
      p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 1500, delay: i * 45, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both',
      })
    })

    // 2. the fill follows the loading, but never runs ahead of the drawing
    const start = performance.now()
    let loaded = 0
    let shown = 0
    let last = start
    let raf = 0
    let exiting = false
    // after this commit's layout effects: the sections below register their critical assets
    queueMicrotask(() => trackAssets((p) => { loaded = p }))

    const exit = () => {
      const { w, h, scale } = place()
      const ctm = logo.current.getCTM()
      const focus = ctm ? new DOMPoint(FOCUS.x, FOCUS.y).matrixTransform(ctm) : new DOMPoint(w / 2, h / 2)
      // the shape around the focus must cover the whole screen
      const S = (Math.hypot(w, h) / (FOCUS.r * scale)) * 1.6
      const g = zoom.current
      g.style.transformOrigin = `${focus.x}px ${focus.y}px`

      // the letters become windows: the white fill fades while holes open in the mask
      fillGroup.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 120, easing: EASE, fill: 'forwards' })
      logo.current.querySelector('[data-stroke]').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
      holeGroup.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 120, easing: EASE, fill: 'forwards' })

      // the focus point drifts to the screen centre while it grows: the flight goes dead centre
      const fly = g.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${w / 2 - focus.x}px, ${h / 2 - focus.y}px) scale(${S})` },
      ], { duration: 1300, delay: 380, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' })
      fly.onfinish = finish
      window.setTimeout(() => onReveal?.(), 420)
    }

    const tick = (now) => {
      const t = now - start
      const cap = Math.min(1, Math.max(0, (t - 500) / (MIN_MS - 500)))
      const target = t > MAX_MS ? 1 : Math.min(loaded, cap)
      // catch up by time, not by frames: a dropped frame rate does not slow the fill
      shown += (target - shown) * (1 - Math.exp(-(now - last) / 180))
      last = now
      if (target === 1 && 1 - shown < 0.004) shown = 1
      fillRect.current.setAttribute('y', String(VB.y + VB.h * (1 - shown)))
      if (shown === 1 && !exiting) {
        exiting = true
        exit()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; the callbacks read refs at call time
  }, [])

  if (gone) return null

  const letters = MARK_PATHS.map((d) => <path key={d} d={d} />)
  const vb = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`

  return (
    <div className="preloader" aria-hidden="true">
      <svg className="preloader__svg">
        <defs>
          <mask id="preloader-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <g ref={zoom}>
              <svg ref={hole} viewBox={vb} overflow="visible">
                <g ref={holeGroup} fill="#000" opacity="0">{letters}</g>
              </svg>
            </g>
          </mask>
          <clipPath id="preloader-fill">
            <rect ref={fillRect} x={VB.x} y={VB.y + VB.h} width={VB.w} height={VB.h} />
          </clipPath>
        </defs>

        <rect width="100%" height="100%" fill="var(--navy-900)" mask="url(#preloader-mask)" />

        <svg ref={logo} viewBox={vb} overflow="visible">
          <g ref={fillGroup} fill="#fff" clipPath="url(#preloader-fill)">{letters}</g>
          {/* pathLength=1: the stroke is hidden in the markup, so nothing flashes before it draws */}
          <g data-stroke fill="none" stroke="rgb(255 255 255 / 0.85)" strokeWidth="0.12" strokeLinejoin="round">
            {MARK_PATHS.map((d) => <path key={d} d={d} pathLength={1} strokeDasharray="1" strokeDashoffset="1" />)}
          </g>
        </svg>
      </svg>
    </div>
  )
}
