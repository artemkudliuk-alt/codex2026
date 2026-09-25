import { useRef } from 'react'
import Arrow from './Arrow.jsx'
import useReveal from './useReveal.js'
import Swipe from './Swipe.jsx'
import { t } from './i18n.js'
import './media.css'

// Section 08 (Figma 102:2): three press articles (titles and links from the TZ, p.17).
const POSTS = () => [
  { source: 'Forbes', title: t('Хто зароблятиме на новій енергетиці України: модель Codex Energy', 'Who will profit from Ukraine’s new energy: the Codex Energy model'), photo: '/media/m1.webp', href: 'https://forbes.ua/company/khto-zaroblyatime-na-noviy-energetitsi-ukraini-model-codex-energy-31082026-41482' },
  { source: 'Rayon.in.ua', title: t('У Болграді будують гібридну сонячну електростанцію на 6,3 мільйона євро', 'A €6.3 million hybrid solar power plant is being built in Bolhrad'), photo: '/media/m2.webp', href: 'https://bolgrad.rayon.in.ua/news/1091244-u-bolgradi-buduiut-gibridnu-soniacnu-elektrostanciiu-na-63-miliona-jevro-investoriv-zaprosuiut-z-pajem-vid-20-tisiac-jevro' },
  { source: t('Бессарабія INFORM', 'Bessarabia INFORM'), title: t('У Болграді створюють перший гібридний обʼєкт відновлюваної енергетики', 'Bolhrad is building its first hybrid renewable energy facility'), photo: '/media/m3.webp', href: 'https://bessarabiainform.com/2026/07/u-bolgradi-stvoryuyut-pershyj-gibrydnyj-ob-yekt-vidnovlyuvanoyi-energetyky/' },
]

export default function Media() {
  const root = useRef(null)
  const row = useRef(null)
  useReveal(root)

  return (
    <section className="media" ref={root}>
      <p className="media__eyebrow">{t('Про нас пишуть', 'In the press')}</p>
      <h2 className="media__h2">{t('Медіа про Codex Energy', 'Codex Energy in the media')}</h2>
      <a className="media__all" href="#">{t('Усі публікації', 'All publications')}<Arrow /></a>

      <div className="media__grid" ref={row}>
        {POSTS().map((p, i) => (
          <a key={p.source} className="post" href={p.href} target="_blank" rel="noreferrer" style={{ '--i': i }}>
            <span className="post__photo"><img src={p.photo} alt="" loading="lazy" decoding="async" /></span>
            <span className="post__source">{p.source}</span>
            <span className="post__title">{p.title}</span>
          </a>
        ))}
      </div>
      <Swipe target={row} />
    </section>
  )
}
