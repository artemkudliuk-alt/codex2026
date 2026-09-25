import { useEffect, useRef } from 'react'
import { t } from './i18n.js'

// Phones: a thin line under a swipe carousel. The orange run shows which part of the row is in
// view; the arrows at its ends (the desktop carousel arrows) move the row by one card.
const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir > 0 ? <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></> : <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>}
  </svg>
)

export default function Swipe({ target }) {
  const run = useRef(null)

  useEffect(() => {
    const row = target.current
    const update = () => {
      const w = row.scrollWidth || 1
      run.current.style.left = `${(row.scrollLeft / w) * 100}%`
      run.current.style.width = `${(row.clientWidth / w) * 100}%`
    }
    update()
    row.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { row.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [target])

  const step = (d) => {
    const row = target.current
    const card = row.querySelector(':scope > * > :not([aria-hidden]), :scope > :not([aria-hidden])')
    row.scrollBy({ left: d * (card ? card.offsetWidth + 12 : row.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="swipe">
      <button className="swipe__btn" onClick={() => step(-1)} aria-label={t('Назад', 'Back')}><Chevron dir={-1} /></button>
      <span className="swipe__line"><i ref={run} /></span>
      <button className="swipe__btn" onClick={() => step(1)} aria-label={t('Далі', 'Next')}><Chevron dir={1} /></button>
    </div>
  )
}
