import { useRef, useState } from 'react'
import useReveal from './useReveal.js'
import Swipe from './Swipe.jsx'
import { t } from './i18n.js'
import './reviews.css'

// Section 07b (Figma 167:2). PLACEHOLDER people and quotes from the layout - replace with real
// client reviews before launch. Endless carousel: the track holds the cards three times and
// jumps back to the middle copy (without animation) after each slide.
const REVIEWS = () => [
  { quote: t('«Шукав актив, що працює без мене. На консультації показали фінансову модель по кожному етапу, без гучних обіцянок.»', '“I was looking for an asset that works without me. At the consultation they showed me the financial model for every stage, with no big promises.”'), name: t('Олександр Коваленко', 'Oleksandr Kovalenko'), role: t('Підприємець, Одеса', 'Entrepreneur, Odesa'), photo: '/reviews/r1.webp' },
  { quote: t('«Мені важливо бачити, куди йдуть кошти. Слідкую за будівництвом у Болграді і завжди маю з ким поговорити.»', '“It matters to me to see where the money goes. I follow the construction in Bolhrad and always have someone to talk to.”'), name: t('Ірина Мельник', 'Iryna Melnyk'), role: t('Власниця мережі кавʼярень, Київ', 'Coffee shop chain owner, Kyiv'), photo: '/reviews/r2.webp' },
  { quote: t('«Зайшов із мінімальним внеском. Документи пояснили простою мовою, оформлення пройшло без зайвої бюрократії.»', '“I joined with the minimum contribution. The documents were explained in plain language and the paperwork went through without extra red tape.”'), name: t('Андрій Савчук', 'Andrii Savchuk'), role: t('IT-архітектор, Львів', 'IT architect, Lviv'), photo: '/reviews/r3.webp' },
]
const N = REVIEWS().length

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir > 0 ? <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></> : <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>}
  </svg>
)

export default function Reviews() {
  const root = useRef(null)
  const row = useRef(null)
  const [pos, setPos] = useState(N) // index into the tripled track, starts on the middle copy
  const [instant, setInstant] = useState(false)
  useReveal(root)

  const go = (d) => { setInstant(false); setPos((p) => p + d) }
  const onEnd = () => {
    if (pos >= 2 * N || pos < N) { setInstant(true); setPos(((pos % N) + N) % N + N) }
  }

  return (
    <section className="reviews" ref={root} aria-roledescription="carousel">
      <p className="reviews__eyebrow">{t('Відгуки', 'Reviews')}</p>
      <h2 className="reviews__h2">{t('Що кажуть співвласники', 'What co-owners say')}</h2>

      <div className="reviews__controls">
        <span className="reviews__count">{String((pos % N) + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</span>
        <button className="reviews__btn reviews__btn--prev" onClick={() => go(-1)} aria-label={t('Попередній відгук', 'Previous review')}><Chevron dir={-1} /></button>
        <button className="reviews__btn reviews__btn--next" onClick={() => go(1)} aria-label={t('Наступний відгук', 'Next review')}><Chevron dir={1} /></button>
      </div>

      <div className="reviews__viewport" ref={row}>
        <div className={`reviews__track${instant ? ' is-instant' : ''}`} style={{ '--pos': pos }} onTransitionEnd={onEnd}>
          {[0, 1, 2].flatMap((copy) => REVIEWS().map((r, i) => (
            <article key={`${copy}-${i}`} className="review" style={{ '--i': i }} aria-hidden={copy !== 1 || undefined}>
              <img className="review__photo" src={r.photo} alt="" loading="lazy" decoding="async" />
              <blockquote className="review__quote">{r.quote}</blockquote>
              <div className="review__who">
                <p className="review__name">{r.name}</p>
                <p className="review__role">{r.role}</p>
              </div>
            </article>
          )))}
        </div>
      </div>
      <Swipe target={row} />
    </section>
  )
}
