import { Fragment, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis } from './scroll.js'
import { lang, onLang } from './i18n.js'
import Header from './Header.jsx'
import Hero from './Hero.jsx'
import System from './System.jsx'
import Flow from './Flow.jsx'
import Services from './Services.jsx'
import Why from './Why.jsx'
import Calculator from './Calculator.jsx'
import Projects from './Projects.jsx'
import Reviews from './Reviews.jsx'
import Media from './Media.jsx'
import Finale from './Finale.jsx'

// A language switch remounts the whole page under key={lang} (every t() re-reads the language),
// then puts the reader back where they were and lifts the curtain the toggle closed.
export default function App() {
  const [current, setCurrent] = useState(lang)
  const restore = useRef(null)

  useEffect(() => onLang((next) => {
    restore.current = window.scrollY
    setCurrent(next)
  }), [])

  useEffect(() => {
    if (restore.current === null) return
    // kept (not cleared): dev StrictMode runs this twice, after the hero's own setup.
    // ScrollTrigger remembers the position it set while the old pin was removed and would put it
    // back on its next refresh: forget it, let the refreshes settle, then jump.
    const y = restore.current
    ScrollTrigger.clearScrollMemory()
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      lenis.resize() // its limit was measured while the page was short (before the hero pin)
      lenis.scrollTo(y, { immediate: true, force: true })
      document.documentElement.classList.remove('lang-switch')
    })
    return () => cancelAnimationFrame(raf)
  }, [current])

  return (
    <Fragment key={current}>
      <Header />
      <main>
        <Hero />
        <System />
        <Flow />
        <Services />
        <Why />
        <Calculator />
        <Projects />
        <Reviews />
        <Media />
        <Finale />
      </main>
    </Fragment>
  )
}
