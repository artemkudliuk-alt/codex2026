import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { units } from './scroll.js'
import { createFlowGL } from './flowGL.js'
import { later, loadVideo } from './load.js'
import './flow.css'
import icon1 from './icons/step1.svg?raw'
import icon2 from './icons/step2.svg?raw'
import icon3 from './icons/step3.svg?raw'
import icon4 from './icons/step4.svg?raw'
import icon5 from './icons/step5.svg?raw'
import { t } from './i18n.js'

// Step icons: our own set in the Solar line style (drawn from scratch), one orange accent each
const ICONS = [icon1, icon2, icon3, icon4, icon5]

// Section 03 (Figma 38:2): the looping energy stream (WebGL pointer effect on desktop) with
// five steps. Nothing is tied to scroll position: once the section is half in view the steps
// play in by time, one after another; the heading comes in before the section leaves.
const STICK = 500 // px the section stays stuck
const HEADING_AFTER = 40 // px into the stuck part when the heading appears (right after it sticks)
const STEP_GAP = 0.3 // s between steps

// Nodes are locked to the video (1920x1080 covering the screen) on the measured middle of the
// stream in energy.mp4. Texts form a flatter stair from the top of the screen (51 + 32*i);
// each line runs from its text down to its node, so the lengths differ as in the layout.
const STEPS = [
  { title: ['Заявка і консультація', 'Application and consultation'], nodeY: 369 },
  { title: ['Оформлення участі', 'Joining the project'], nodeY: 514 },
  { title: ['Будівництво СЕС і УЗЕ', 'Solar and storage construction'], nodeY: 654 },
  { title: ['Операційне управління', 'Operational management'], nodeY: 753 },
  { title: ['Щоквартальні дивіденди', 'Quarterly dividends'], nodeY: 809 },
].map((s, i) => ({ ...s, i, cx: 270 + 345 * i }))

export default function Flow() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    const q = gsap.utils.selector(el)
    const sticky = q('.flow__sticky')[0]
    const canvas = q('canvas')[0]
    const video = q('video')[0]
    const steps = q('.flow__step')

    // --- pointer effect: desktop with a mouse only; runs only while it is visible ----------
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = fine && !calm ? createFlowGL(canvas, video) : null
    // the shader draws at most the video's own 1920 px: more pixels would add cost, not detail
    const sizeGL = () => {
      const w = Math.min(1920, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)))
      canvas.width = w
      canvas.height = Math.round((w * canvas.clientHeight) / canvas.clientWidth)
    }
    if (gl) {
      sizeGL()
      window.addEventListener('resize', sizeGL)
    }
    // buffer the stream ahead of time, then draw it once: the GPU compiles and uploads now,
    // not on the first mouse move over the section
    let alive = true
    later(() => loadVideo(video).then(() => alive && gl?.render()))
    let looping = false
    const loop = () => {
      gl.render()
      if (!gl.visible) {
        gsap.ticker.remove(loop)
        looping = false
        el.classList.remove('is-gl')
      }
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      gl.move((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
      if (!looping) {
        looping = true
        el.classList.add('is-gl')
        gsap.ticker.add(loop)
      }
    }
    const onLeave = () => gl.leave()
    if (gl) {
      sticky.addEventListener('mousemove', onMove)
      sticky.addEventListener('mouseleave', onLeave)
    }

    // --- arrows: centred in the free space between a title's last letter and the next title --
    const titles = q('.flow__title')
    const placeArrows = () => {
      const left0 = sticky.getBoundingClientRect().left
      q('.flow__arrow').forEach((arrow, i) => {
        const range = document.createRange()
        range.selectNodeContents(titles[i])
        const textRight = Math.max(...[...range.getClientRects()].map((r) => r.right))
        const nextLeft = titles[i + 1].getBoundingClientRect().left
        arrow.style.left = `${(textRight + nextLeft) / 2 - arrow.offsetWidth / 2 - left0}px`
      })
    }
    document.fonts.ready.then(placeArrows)
    window.addEventListener('resize', placeArrows)

    // --- reveals (time-based) ---------------------------------------------------------------
    const showSteps = (on) => {
      const parts = q('.flow__node, .flow__line, .flow__num, .flow__title, .flow__arrow')
      gsap.killTweensOf(parts)
      steps.forEach((s) => s.classList.remove('is-lit'))
      if (!on) {
        gsap.to(parts, { autoAlpha: 0, duration: 0.3 })
        return
      }
      const tl = gsap.timeline()
      steps.forEach((s, i) => {
        const t = i * STEP_GAP
        const part = (sel) => s.querySelectorAll(sel)
        // node lights up -> icon draws itself (white, then the orange accent) -> line grows up
        // to the text -> number and title rise -> arrow
        tl.fromTo(part('.flow__node'), { autoAlpha: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', onStart: () => s.classList.add('is-lit') }, t)
          .fromTo(part('.flow__node path:not(.acc)'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', autoRound: false }, t + 0.15) // dash is 0..1: no px rounding
          .fromTo(part('.flow__node path.acc'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out', autoRound: false }, t + 0.6)
          .fromTo(part('.flow__line'), { autoAlpha: 1, scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.inOut' }, t + 0.1)
          .fromTo(part('.flow__num, .flow__title'), { autoAlpha: 0, y: () => 20 * units.c },
            { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, t + 0.35)
        if (i < STEPS.length - 1) {
          tl.fromTo(part('.flow__arrow'), { autoAlpha: 0, x: () => -12 * units.c },
            { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out' }, t + 0.55)
        }
      })
    }
    const showHeading = (on) => {
      const parts = q('.flow__heading > *')
      gsap.killTweensOf(parts)
      if (on) gsap.fromTo(parts, { autoAlpha: 0, y: () => 24 * units.uw }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 })
      else gsap.to(parts, { autoAlpha: 0, duration: 0.3 })
    }

    const ctx = gsap.context(() => {
      gsap.set(q('.flow__node, .flow__line, .flow__num, .flow__title, .flow__arrow, .flow__heading > *'), { autoAlpha: 0 })

      // Enter through the shadow: the stream emerges from the navy section 02 fades into.
      gsap.fromTo(q('.flow__veil'), { opacity: 1 }, {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 30%', scrub: true },
      })

      // Play the video only while the section is on screen.
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (st) => (st.isActive ? video.play().catch(() => {}) : video.pause()),
      })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        onEnter: () => showSteps(true),
        onLeaveBack: () => showSteps(false),
      })
      ScrollTrigger.create({
        trigger: el,
        start: units.mobile ? 'top 60%' : `top+=${HEADING_AFTER} top`, // phones: the heading leads, before the steps
        onEnter: () => showHeading(true),
        onLeaveBack: () => showHeading(false),
      })
    }, el)

    return () => {
      alive = false
      ctx.revert()
      gsap.ticker.remove(loop)
      window.removeEventListener('resize', placeArrows)
      window.removeEventListener('resize', sizeGL)
      sticky.removeEventListener('mousemove', onMove)
      sticky.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section className="flow" ref={root} style={{ '--stick': `${STICK}px` }}>
      <div className="flow__sticky">
        <div className="flow__cover">
          {/* preload none: it buffers in the load queue (load.js), after the hero and section 02 */}
          <video className="flow__video" muted loop playsInline preload="none" aria-hidden="true">
            {/* phones: the centre 760 x 1080, the part of the stream a phone shows */}
            <source src={units.mobile ? '/video/energy-m.av1.mp4' : '/video/energy.av1.mp4'} type='video/mp4; codecs="av01.0.08M.10"' />
            <source src={units.mobile ? '/video/energy-m.mp4' : '/video/energy.mp4'} type="video/mp4" />
          </video>
          <canvas className="flow__canvas" aria-hidden="true" />
        </div>
        <div className="flow__scrim flow__scrim--top" />
        <div className="flow__scrim flow__scrim--left" />

        <div className="flow__fade-top" />

        <ol className="flow__steps">
          {STEPS.map((s, i) => (
            <li
              key={s.title[0]}
              className="flow__step"
              style={{ '--i': s.i, '--cx': s.cx, '--node-y': s.nodeY }}
            >
              <span className="flow__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="flow__title">{t(...s.title)}</span>
              <span className="flow__line" />
              <span className="flow__node" dangerouslySetInnerHTML={{ __html: ICONS[i] }} />
              {i < STEPS.length - 1 && <img className="flow__arrow" src="/flow/arrow.svg" alt="" />}
            </li>
          ))}
        </ol>

        <div className="flow__heading">
          <p className="flow__eyebrow">{t('Як це працює', 'How it works')}</p>
          <h2 className="flow__h2">{t(<>Пʼять кроків від заявки<br />до перших дивідендів</>, <>Five steps from application<br />to your first dividends</>)}</h2>
          <p className="flow__note">{t('Два кроки робите ви. Все інше - будівництво, запуск і управління активом - бере на себе Codex Energy.', 'You take two steps. Everything else - construction, launch and asset management - is handled by Codex Energy.')}</p>
        </div>

        <div className="flow__veil" />
      </div>
    </section>
  )
}
