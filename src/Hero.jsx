import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis, measure, units } from './scroll.js'
import './hero.css'
import Preloader from './Preloader.jsx'
import Arrow from './Arrow.jsx'
import { intro as introState, locale, t } from './i18n.js'

// Figma 4:51 collage: card centre and size in design px, rotation,
// mouse-parallax speed (values from virya-energy.com hero.js).
const CARDS = [
  { cx: 949.8, cy: 255.3, w: 323, h: 210, rot: 3, speed: 0.08 },
  { cx: 527.3, cy: 337.9, w: 358, h: 236, rot: 7, speed: 0.12 },
  { cx: 1356.2, cy: 283.3, w: 384, h: 251, rot: -5, speed: 0.1 },
  { cx: 613.6, cy: 576.7, w: 338, h: 220, rot: -6, speed: 0.15 },
  { cx: 1361.3, cy: 606.1, w: 369, h: 241, rot: 5, speed: 0.11 },
]
const VIDEO_SPEED = 0.13

// Video card in phase 02 (Figma 4:34) and phase 03 (4:51), design px.
const SHRINK = { x: 380, y: 250, w: 1160, h: 738, r: 36 }
const COLLAGE = { x: 703, y: 298, w: 568, h: 364, r: 22 }

// Phones: the same three phases on a 390 x 844 stage (units.mu), portrait card and collage.
const M_CARDS = [ // portrait cards tucked around a portrait video card, as the desktop collage
  { cx: 195, cy: 196, w: 124, h: 170, rot: 3 },
  { cx: 86, cy: 292, w: 128, h: 178, rot: 7 },
  { cx: 304, cy: 282, w: 128, h: 178, rot: -5 },
  { cx: 92, cy: 478, w: 124, h: 170, rot: -6 },
  { cx: 298, cy: 484, w: 128, h: 174, rot: 5 },
]
const M_SHRINK = { x: 20, y: 130, w: 350, h: 560, r: 24 }
const M_COLLAGE = { x: 107, y: 236, w: 176, h: 264, r: 18 }

const PIN_LENGTH = 900 // scroll px the hero stays pinned: collage settles in ~7-8 wheel notches (client)
const PARALLAX_FROM = 0.9 // timeline progress where the collage has settled

// Design rect -> px inside the pinned viewport (1920x1080 stage, or 390x844 on phones, fitted and centred).
const stage = () => (units.mobile ? { w: 390, h: 844, u: units.mu } : { w: 1920, h: 1080, u: units.u })
const rectVars = ({ x, y, w, h }) => ({
  left: () => (units.w - stage().w * stage().u) / 2 + x * stage().u,
  top: () => (units.h - stage().h * stage().u) / 2 + y * stage().u,
  width: () => w * stage().u,
  height: () => h * stage().u,
})

export default function Hero() {
  const root = useRef(null)
  const intro = useRef({}) // reveal / done, called by the preloader

  useLayoutEffect(() => {
    measure() // page is taller now: the scrollbar may have narrowed the viewport
    const el = root.current
    const q = gsap.utils.selector(el)
    const video = q('.hero__video')[0]
    const mobile = units.mobile
    const cards = mobile ? M_CARDS : CARDS
    const SHR = mobile ? M_SHRINK : SHRINK
    const COL = mobile ? M_COLLAGE : COLLAGE
    const colCx = COL.x + COL.w / 2
    const colCy = COL.y + COL.h / 2
    const su = () => stage().u
    const header = document.querySelector('.header') // fixed, outside the hero

    // Mouse parallax on the settled collage (virya: tilt + drift, lerp 0.1).
    const tilt = [...q('.hero__card-img'), video]
    const speeds = [...CARDS.map((c) => c.speed), VIDEO_SPEED]
    let active = false, mx = 0, my = 0, px = 0, py = 0
    const onMove = (e) => {
      mx = gsap.utils.clamp(-1, 1, (e.clientX / units.w) * 2 - 1)
      my = gsap.utils.clamp(-1, 1, (e.clientY / units.h) * 2 - 1)
    }
    const onLeave = () => { mx = my = 0 }
    const tick = () => {
      if (!active) return
      px += (mx - px) * 0.1
      py += (my - py) * 0.1
      tilt.forEach((node, i) => {
        const s = speeds[i]
        gsap.set(node, {
          x: px * s * 100 * units.u,
          y: py * s * 100 * units.u,
          rotationX: -py * s * 150,
          rotationY: px * s * 150,
          rotationZ: px * s * 20,
          transformPerspective: 1000,
        })
      })
    }
    const setParallax = (on) => {
      if (on === active) return
      active = on
      if (!on) {
        px = py = 0
        gsap.to(tilt, { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, duration: 0.3, ease: 'power2.out' })
      }
    }
    const canTilt = !mobile && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (canTilt) {
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      gsap.ticker.add(tick)
    }

    const copy = q('.hero__copy, .hero__badge')
    // Collage cards wait stacked behind the video (virya: z-index -1, centred).
    const stacked = {
      x: (i) => (colCx - cards[i].cx) * su(),
      y: (i) => (colCy - cards[i].cy) * su(),
      rotation: 0,
    }

    // One scrubbed timeline for all three phases: 01 full-bleed -> 02 card -> 03 collage.
    // Built after the intro, so it records the settled full-bleed state as its start.
    const buildScroll = () => gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: `+=${PIN_LENGTH}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (st) => canTilt && setParallax(st.progress >= PARALLAX_FROM),
      },
    })
      // 01 -> 02: corners round almost at once, the size follows the scroll
      .to(video, { borderRadius: () => SHR.r * su(), duration: 0.08, ease: 'power1.out' }, 0)
      .to(video, { ...rectVars(SHR), duration: 1, ease: 'power1.out' }, 0)
      .to(copy, { autoAlpha: 0, duration: 0.35 }, 0)
      .to(q('.hero__scrim'), { opacity: 0, duration: 0.6 }, 0)
      // Header (as before, client): slides up and fades with the very first scroll, no plate.
      // CSS variables, not transform: the fixed header keeps its own translate for its zones.
      .to(header, { '--away': 1, duration: 0.08, ease: 'power1.in' }, 0)
      .to(header, { '--fade': 1, duration: 0.045 }, 0)
      // 02 -> 03
      .to(video, {
        ...rectVars(COL),
        borderRadius: () => COL.r * su(),
        boxShadow: () => `0px ${22 * su()}px ${48 * su()}px rgba(5, 13, 31, 0.3)`,
        duration: 1,
        ease: 'power1.inOut',
      }, 1.15)
      .fromTo(q('.hero__card'), stacked, {
        x: 0,
        y: 0,
        rotation: (i) => cards[i].rot,
        duration: 0.7,
        stagger: 0.05,
        ease: 'power1.out',
      }, 1.35)
      .fromTo(q('.hero__statement'),
        { y: () => 80 * su(), autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 1.55)
      .to({}, { duration: 0.2 }) // short hold on the final composition before unpinning

    const ctx = gsap.context(() => {
      // The page waits hidden under the preloader (Preloader.jsx, the Renuvion mechanic). When its
      // letters open into windows the hero comes in: the scene settles from 1.14 (the camera
      // arriving), the headline writes itself in letter by letter, the figure counts, the header
      // drops in. Scroll unlocks once the flight is over.
      if (!introState.played) {
        window.scrollTo(0, 0)
        lenis.stop()
      }
      const chars = new SplitText(q('.hero__copy h1'), { type: 'words,chars' }).chars
      const rest = q('.hero__copy p, .hero__ctas, .hero__badge-label')
      const value = q('.hero__badge-value')[0]
      gsap.set(chars, { autoAlpha: 0, y: () => 30 * su(), filter: 'blur(8px)' })
      gsap.set([rest, value], { autoAlpha: 0, y: () => 24 * su() })
      gsap.set(header, { autoAlpha: 0, y: -20 })
      gsap.set(q('.hero__card'), stacked)

      const counter = { v: 0 }
      intro.current.reveal = () => gsap.timeline()
        .fromTo(q('.hero__inner'), { scale: 1.14 }, { scale: 1, duration: 1.7, ease: 'expo.out' }, 0)
        .to(chars, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out', stagger: 0.018 }, 0.6)
        .to(rest, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, 1.05)
        .to(value, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.15)
        .to(counter, { v: 20000, duration: 1.4, ease: 'power2.out', onUpdate: () => {
          value.textContent = `${t('від', 'from')} €${Math.round(counter.v).toLocaleString(locale())}`
        } }, 1.15)
        // clearProps: GSAP leaves translate:none inline, which would pin the smart header in place
        .to(header, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out', clearProps: 'transform,translate,opacity,visibility' }, 1.25)
      intro.current.done = () => {
        ctx.add(buildScroll)
        // The pin is created after sections below already measured themselves:
        // sort by page position so the spacer is counted, then re-measure (virya does the same).
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
        lenis.start()
        introState.played = true
      }
    }, el)
    // a language switch remounts the page: no preloader, the hero lands in its settled state
    if (introState.played) {
      ctx.add(() => intro.current.reveal().progress(1))
      intro.current.done()
    }

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      lenis.start()
    }
  }, [])

  return (
    <section className="hero" ref={root}>
      {!introState.played && <Preloader onReveal={() => intro.current.reveal?.()} onDone={() => intro.current.done?.()} />}
      <div className="hero__inner">
        <div className="stage hero__stage--back" aria-hidden="true">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="hero__card"
              style={{
                '--x': c.cx - c.w / 2, '--y': c.cy - c.h / 2, '--w': c.w, '--h': c.h,
                '--mx': M_CARDS[i].cx - M_CARDS[i].w / 2, '--my': M_CARDS[i].cy - M_CARDS[i].h / 2, '--mw': M_CARDS[i].w, '--mh': M_CARDS[i].h,
              }}
            >
              <img className="hero__card-img" src={`/hero/c${i}.webp`} alt="" />
            </div>
          ))}
        </div>

        <div className="hero__video">
          {/* AV1 where the browser plays it (about half the bytes), H.264 otherwise */}
          {/* phones: the centre 720 x 1080 (every phone phase is portrait), about a third of the bytes */}
          <video poster={units.mobile ? '/video/hero-m-poster.webp' : '/video/hero-poster.webp'} autoPlay muted loop playsInline preload="auto">
            <source src={units.mobile ? '/video/hero-m.av1.mp4' : '/video/hero.av1.mp4'} type='video/mp4; codecs="av01.0.08M.10"' />
            <source src={units.mobile ? '/video/hero-m.mp4' : '/video/hero.mp4'} type="video/mp4" />
          </video>
          <div className="hero__scrim hero__scrim--v" />
          <div className="hero__scrim hero__scrim--l" />
        </div>

        <div className="stage hero__stage--front">
          <div className="hero__copy">
            <h1>{t(<>Світло - це не<br />розкішний максимум,<br />а базовий мінімум</>, <>Light is not<br />a luxury maximum,<br />but a basic minimum</>)}</h1>
            <p>{t('Будуємо незалежні енергопарки для сильної України та створюємо можливість отримувати пасивний дохід.', 'We build independent energy parks for a stronger Ukraine and create an opportunity to earn passive income.')}</p>
            <div className="hero__ctas">
              <a className="btn btn--primary hero__btn" href="#">{t('ДОЛУЧИТИСЯ ДО ПРОЄКТУ', 'JOIN THE PROJECT')}<Arrow /></a>
              <a className="btn btn--ghost hero__btn" href="#">{t('Отримати презентацію', 'Get the presentation')}</a>
            </div>
          </div>
          <div className="hero__badge">
            <p className="hero__badge-label">{t('Мінімальний пайовий внесок', 'Minimum share contribution')}</p>
            <p className="hero__badge-value">{t('від €20 000', 'from €20,000')}</p>
          </div>
          <h2 className="hero__statement">
            {t('Ми будуємо, керуємо і забезпечуємо', 'We build, manage and secure')}<br />
            <span>{t('генерацію доходу в межах кооперативу', 'income generation within the cooperative')}</span>
          </h2>
        </div>
      </div>
    </section>
  )
}
