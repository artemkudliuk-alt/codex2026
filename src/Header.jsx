import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis } from './scroll.js'
import { lang, setLang, t } from './i18n.js'
import './header.css'

const NAV = () => [t('Послуги', 'Services'), t('Проекти', 'Projects'), t('Про нас', 'About us'), t('Блог', 'Blog'), t('Контакти', 'Contacts')]

// Flags drawn square (they sit in a round knob): the Union Jack's centre, Ukraine's two halves.
const FlagUK = () => (
  <svg viewBox="15 0 30 30" aria-hidden="true">
    <clipPath id="uk-diag"><path d="M30 15h30v15zv15H0zH0V0zV0h30z" /></clipPath>
    <path d="M0 0h60v30H0z" fill="#012169" />
    <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
    <path d="M0 0l60 30M60 0L0 30" clipPath="url(#uk-diag)" stroke="#c8102e" strokeWidth="4" />
    <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
    <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
  </svg>
)
const FlagUA = () => (
  <svg viewBox="0 0 30 30" aria-hidden="true">
    <path d="M0 0h30v15H0z" fill="#0057b7" />
    <path d="M0 15h30v15H0z" fill="#ffd700" />
  </svg>
)

// Language switch (layout): the flag is the knob. UA site: British knob on the left, "EN" beside
// it; click or drag it right - it rolls over, turns Ukrainian, the label becomes "UA" and the site
// switches to English. Back the same way. --p (0..1) drives the whole morph in CSS.
function LangToggle() {
  const [p, setP] = useState(lang === 'en' ? 1 : 0)
  const [drag, setDrag] = useState(false)
  const btn = useRef(null)
  const g = useRef(null) // gesture: start x, start p, travel px, moved

  const commit = (next) => {
    setDrag(false)
    setP(next)
    if ((next === 1) === (lang === 'en')) return
    // let the knob land, close a short navy curtain, then remount the page in the other language
    window.setTimeout(() => {
      document.documentElement.classList.add('lang-switch')
      window.setTimeout(() => setLang(next === 1 ? 'en' : 'uk'), 380)
    }, 420)
  }

  const down = (e) => {
    const knob = btn.current.querySelector('.lang__knob')
    const travel = btn.current.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft
    g.current = { x: e.clientX, p, travel, moved: false }
    btn.current.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    const s = g.current
    if (!s) return
    const dx = e.clientX - s.x
    if (!s.moved && Math.abs(dx) < 4) return
    s.moved = true
    setDrag(true)
    setP(Math.min(1, Math.max(0, s.p + dx / s.travel)))
  }
  const up = () => {
    const s = g.current
    g.current = null
    if (!s) return
    if (!s.moved) commit(s.p > 0.5 ? 0 : 1) // a click flips it
    else commit(p > 0.5 ? 1 : 0) // a drag lands on the nearer side
  }

  const en = lang === 'en'
  return (
    <button
      ref={btn}
      className={`lang${drag ? ' is-drag' : ''}`}
      style={{ '--p': p }}
      role="switch"
      aria-checked={en}
      aria-label={en ? 'Українська версія' : 'English version'}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { g.current = null; commit(en ? 1 : 0) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(en ? 0 : 1) } }}
    >
      <span className="lang__label lang__label--en" aria-hidden="true">EN</span>
      <span className="lang__label lang__label--ua" aria-hidden="true">UA</span>
      <span className="lang__knob" aria-hidden="true">
        <span className="lang__flag lang__flag--uk"><FlagUK /></span>
        <span className="lang__flag lang__flag--ua"><FlagUA /></span>
      </span>
    </button>
  )
}

// Header (fixed), two zones (client):
// 1. hero: transparent, no plate; the hero scrub slides and fades it out with the first scroll
//    (--away / --fade in Hero.jsx) and brings it back at the very top;
// 2. from the scrub video (section 02, the moment it fills the screen) to the end of the site:
//    drops in softly on a transparent glass plate and stays (client).
// Over the white sections the glass gets dense, so the white menu stays readable.
export default function Header() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    const video = ScrollTrigger.create({ trigger: '.system', start: 'top top', end: 'bottom top' })
    const light = []
    const over = new Set() // light sections under the plate now
    document.querySelectorAll('main > section:not(.hero)').forEach((s) => {
      if (getComputedStyle(s).backgroundColor !== 'rgb(255, 255, 255)') return
      light.push(ScrollTrigger.create({
        trigger: s,
        start: 'top top+=40', // the plate's middle is over it
        end: 'bottom top+=40',
        onToggle: (self) => {
          if (self.isActive) over.add(self); else over.delete(self)
          el.classList.toggle('is-light', over.size > 0)
        },
      }))
    })
    const bar = el.querySelector('.header__progress')
    let last = window.scrollY
    let leave = 0
    const onScroll = ({ scroll, progress }) => {
      bar.style.transform = `scaleX(${progress})` // the whole page, top to footer
      const d = scroll - last
      if (Math.abs(d) < 6) return // ignore the glide's last pixels
      last = scroll
      const hero = scroll < video.start
      // back into the hero: the plate leaves at the same pace it came in (client)
      if (hero && el.classList.contains('is-plate')) {
        el.classList.add('is-leaving')
        clearTimeout(leave)
        leave = setTimeout(() => el.classList.remove('is-leaving'), 900)
      }
      el.classList.toggle('is-plate', !hero)
    }
    lenis.on('scroll', onScroll)
    return () => {
      lenis.off('scroll', onScroll)
      clearTimeout(leave)
      video.kill()
      light.forEach((st) => st.kill())
    }
  }, [])

  return (
    <header className="header" ref={root}>
      <span className="header__progress" aria-hidden="true" />
      {/* the mark turns a quarter clockwise on hover; a click glides to the top, no reload */}
      <a className="header__logo" href="/" aria-label="Codex Energy" onClick={(e) => { e.preventDefault(); lenis.scrollTo(0, { duration: 2.2 }) }}>
        <img src="/hero/logo-word.svg" alt="" />
        <img className="header__mark" src="/hero/logo-mark.svg" alt="" />
      </a>
      <nav className="header__nav">
        {NAV().map((item) => <a key={item} href="#">{item}</a>)}
      </nav>
      <div className="header__actions">
        <LangToggle />
        <a className="header__account" href="#">
          <img src="/hero/login-light.svg" alt="" />
          {t('Кабінет', 'Account')}
        </a>
        <a className="btn btn--primary header__cta" href="#">{t('Залишити заявку', 'Apply now')}</a>
      </div>
    </header>
  )
}
