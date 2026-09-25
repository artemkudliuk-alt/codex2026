import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { units } from './scroll.js'
import { critical, later, loadImage } from './load.js'
import './system.css'
import { locale, t } from './i18n.js'

gsap.registerPlugin(SplitText)

// Section 02 (Figma 26:2 -> 26:10). Scroll-scrubbed fly-around, rebuilt from on.energy
// (ImageSequence + StickySection): frames drawn on a canvas, sticky scene, text revealed
// by time once a progress threshold is crossed, so it keeps up with any scroll speed.
const FRAMES = 142 // Scrub_video.mp4, every 2nd frame, 1920x1080 WebP (+ a 1440 set)
const FIRST = 10 // loaded under the preloader; the rest right after it, in order
// screens that draw the canvas at most ~1500 device px wide get the 1440 frames (half the bytes)
// phones get their own portrait set: the centre 540 x 1080 of each frame (what a phone shows anyway)
const frameSrc = (i, set) => `/seq/system/${set}${String(i + 1).padStart(3, '0')}.webp`
const SCRUB_LENGTH = 800 // px the scene stays stuck; the video plays only here (client)

// The centred copy types itself in, letter by letter, while the section slides in (its top
// passes 40% of the screen) and stays for the whole scrub; the figures join near the end.
const METRICS_FROM = 0.7 // on the stuck progress 0..1

// Figures from the client (2026-09-25)
const METRICS = [
  { to: 10700, plus: '+', unit: ['МВт·год', 'MWh'], label: ['Запланована генерація СЕС', 'Planned solar generation'] },
  { to: 25500, plus: '+', unit: ['МВт·год', 'MWh'], label: ['Запланована віддача УЗЕ', 'Planned storage output'] },
  { to: 98000, unit: ['м²', 'm²'], label: ['Площа енергопарків', 'Energy park area'] },
  { to: 35, unit: ['МВт·год', 'MWh'], label: ['Ємність систем зберігання', 'Storage capacity'] },
  { to: 13.6, decimals: 1, prefix: '€', unit: ['млн+', 'M+'], label: ['Сукупний бюджет поточних проєктів', 'Total budget of current projects'] },
]
const format = ({ prefix = '', plus = '', decimals = 0 }, v) =>
  prefix + v.toLocaleString(locale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + plus

// Draw like CSS object-fit: cover.
function drawCover(ctx, img, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

export default function System() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    const q = gsap.utils.selector(el)
    const canvas = q('canvas')[0]
    const ctx = canvas.getContext('2d', { alpha: false })

    // Frames: load in order, draw the nearest loaded one at or below the target.
    const small = canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2) <= 1500
    const frameSet = units.mobile ? 'm/' : small ? '1440/' : ''
    const imgs = Array.from({ length: FRAMES }, () => new Image())
    const loadList = (list) => Promise.all(list.map((i) => loadImage(imgs[i], frameSrc(i, frameSet)).then(() => draw(current))))
    const load = (from, to) => loadList(Array.from({ length: Math.min(to, FRAMES) - from }, (_, k) => from + k))
    critical.push(load(0, FIRST))
    // Every 2nd frame first: the scrub already plays through (draw() takes the nearest loaded
    // frame below), then the in-between frames go to the end of the queue, after section 03's video.
    const byEight = async (list) => { for (let i = 0; i < list.length; i += 8) await loadList(list.slice(i, i + 8)) }
    const rest = Array.from({ length: FRAMES - FIRST }, (_, k) => FIRST + k)
    later(async () => {
      await byEight(rest.filter((i) => i % 2 === 0))
      later(() => byEight(rest.filter((i) => i % 2 === 1)))
    })
    let current = 0
    let drawn = -1
    const draw = (i) => {
      let f = i
      const ready = (img) => img.complete && img.naturalWidth > 0 // an Image without src is "complete" too
      while (f > 0 && !ready(imgs[f])) f--
      if (!ready(imgs[f]) || f === drawn) return
      drawCover(ctx, imgs[f], canvas.width, canvas.height)
      drawn = f
    }
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      drawn = -1
      draw(current)
    }
    resize()
    window.addEventListener('resize', resize)

    // Time-based reveal: in from below when scrolling down (from above when scrolling up),
    // out the opposite way. Lines 40px, 1s power3.out, stagger .08 (on.energy CopyReveal).
    const reveal = (targets, on, dir) => on
      ? gsap.fromTo(targets, { autoAlpha: 0, y: 40 * dir * units.u },
        { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true })
      : gsap.to(targets, { autoAlpha: 0, y: -30 * dir * units.u, duration: 0.5, ease: 'power2.in', stagger: 0.04, overwrite: true })

    const values = q('.system__num')
    const countUp = () => values.forEach((node, i) => {
      const m = METRICS[i]
      const o = { v: 0 }
      gsap.to(o, {
        v: m.to, duration: 1.2, delay: 0.15 + i * 0.08, ease: 'power2.out', overwrite: true,
        onUpdate: () => { node.textContent = format(m, o.v) },
      })
    })

    const state = { intro: false, metrics: false }
    const set = (key, on, dir, fn) => {
      if (state[key] === on) return
      state[key] = on
      fn(on, dir)
    }

    const ctxGsap = gsap.context(() => {
      const eyebrow = q('.system__intro .system__eyebrow')
      const titleChars = new SplitText(q('.system__h2 span'), { type: 'words,chars' }).chars
      const noteChars = new SplitText(q('.system__note'), { type: 'words,chars' }).chars
      gsap.set([eyebrow, titleChars, noteChars, q('.system__label, .system__value')], { autoAlpha: 0 })

      // Soft letter-by-letter: each letter drifts up out of a blur, in a wave.
      const letter = { autoAlpha: 0, y: () => 14 * units.u, filter: 'blur(8px)' }
      const settled = { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }
      let introTl
      const showIntro = (on) => {
        introTl?.kill()
        introTl = on
          ? gsap.timeline()
            .fromTo(eyebrow, { autoAlpha: 0, y: () => 10 * units.u }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0)
            .fromTo(titleChars, letter, { ...settled, stagger: 0.018 }, 0.15) // ~2.2s for the whole block
            .fromTo(noteChars, letter, { ...settled, stagger: 0.008 }, '-=0.7')
          : gsap.to([eyebrow, titleChars, noteChars], { autoAlpha: 0, duration: 0.3, overwrite: true })
      }
      gsap.set(q('.system__tick'), { scaleX: 0 })

      // Soft entry: the scene emerges from white while it slides in (on.energy background fade).
      gsap.fromTo(q('.system__veil'), { opacity: 1 }, {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 60%', scrub: true },
      })

      const fill = q('.system__fill')
      const wide = q('.system__scrim--wide')
      const update = (st) => {
        const entered = st.progress > 0
        const stuckAt = st.start + 0.4 * units.h // section top reaches the top edge
        const p = gsap.utils.clamp(0, 1, (st.scroll() - stuckAt) / SCRUB_LENGTH)
        const dir = st.direction
        current = Math.round(p * (FRAMES - 1))
        draw(current)
        gsap.set(fill, { scaleX: 0.05 + 0.95 * p })
        gsap.set(wide, { opacity: p })
        set('intro', entered, dir, showIntro)
        set('metrics', p >= METRICS_FROM, dir, (on) => {
          gsap.to(q('.system__tick'), { scaleX: on ? 1 : 0, duration: on ? 0.6 : 0.3, ease: 'power2.out', stagger: 0.08, overwrite: true })
          reveal(q('.system__label, .system__value'), on, dir)
          if (on) countUp()
        })
      }
      ScrollTrigger.create({ trigger: el, start: 'top 40%', end: 'bottom bottom', onUpdate: update, onRefresh: update })
    }, el)

    return () => {
      ctxGsap.revert()
      window.removeEventListener('resize', resize)
      // image handlers stay: they resolve the load queue's promises (a late draw is harmless)
    }
  }, [])

  return (
    <section className="system" ref={root} style={{ '--scrub': `${SCRUB_LENGTH}px` }}>
      <div className="system__sticky">
        <canvas className="system__canvas" aria-hidden="true" />
        <div className="system__scrim system__scrim--close" />
        <div className="system__scrim system__scrim--wide" />
        <div className="system__track"><div className="system__fill" /></div>

        <div className="stage">
          <div className="system__intro">
            <p className="system__eyebrow">{t('Енергопарк Болград', 'Bolhrad energy park')}</p>
            <h2 className="system__h2">
              <span>{t('Два незалежних джерела доходу', 'Two independent income streams')}</span>
              <span>{t('в єдиній керованій системі', 'in one managed system')}</span>
            </h2>
            <p className="system__note">{t('СЕС генерує електроенергію. УЗЕ віддає її в мережу в години пікового попиту.', 'The solar plant generates electricity. The storage system releases it to the grid at peak demand hours.')}</p>
          </div>

          <dl className="system__metrics">
            {METRICS.map((m) => (
              <div className="system__metric" key={m.label[0]}>
                <span className="system__tick" />
                <dt className="system__label">{t(...m.label)}</dt>
                <dd className="system__value">
                  <span className="system__num">{format(m, m.to)}</span> <span className="system__unit">{t(...m.unit)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="system__shade" />
        <div className="system__veil" />
      </div>
    </section>
  )
}
