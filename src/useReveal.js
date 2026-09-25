import { useLayoutEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { units } from './scroll.js'

// Adds .is-in to the section once its top reaches 75% of the screen (phones: as it enters); CSS does the staggered entry.
export default function useReveal(ref) {
  useLayoutEffect(() => {
    const st = ScrollTrigger.create({ trigger: ref.current, start: units.mobile ? 'top 92%' : 'top 75%', once: true, onEnter: () => ref.current.classList.add('is-in') })
    return () => st.kill()
  }, [ref])
}
