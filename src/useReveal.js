import { useLayoutEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Adds .is-in to the section once its top reaches 75% of the screen; CSS does the staggered entry.
export default function useReveal(ref) {
  useLayoutEffect(() => {
    const st = ScrollTrigger.create({ trigger: ref.current, start: 'top 75%', once: true, onEnter: () => ref.current.classList.add('is-in') })
    return () => st.kill()
  }, [ref])
}
