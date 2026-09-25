import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Arrow from './Arrow.jsx'
import './projects.css'
import { NAMES } from './projectNames.js'
import { lang, t } from './i18n.js'

// Section 07 (Figma 87:2 / 87:11): two outlined park names. Hovering one fills it orange from
// left to right, dims the other, writes its facts in on the left row by row and brings its photo
// forward (soft shadow, drifts a little after the pointer). Facts: Bolhrad from section 02 of the
// layout (official site) + TZ p.13 for location / launch / cost; Chernivtsi from the layout.
const PROJECTS = () => [
  {
    name: t('Болград', 'Bolhrad'),
    key: 'bolhrad',
    photo: '/projects/bolhrad.webp',
    link: 'codex.energy',
    href: 'https://codex.energy',
    facts: [
      [t('Локація', 'Location'), t('Одеська область', 'Odesa region')],
      [t('Запуск проєкту', 'Project launch'), t('IV квартал 2026 р.', 'Q4 2026')],
      [t('Фотоелектрична потужність', 'PV capacity'), t('4,5 МВт', '4.5 MW')],
      [t('Інверторне обладнання', 'Inverter equipment'), t('6,3 МВт', '6.3 MW')],
      [t('Зберігання енергії (УЗЕ)', 'Energy storage (BESS)'), t('20 МВт·год', '20 MWh')],
      [t('Архітектура', 'Architecture'), t('800-вольтова · модулі Схід-Захід', '800 V · East-West modules')],
      [t('Вартість проєкту', 'Project cost'), t('€6,3 млн', '€6.3M')],
    ],
  },
  {
    name: t('Чернівці', 'Chernivtsi'),
    key: 'chernivtsi',
    photo: '/projects/chernivtsi.webp',
    link: 'chernovtsy.codexenergy.com.ua',
    href: 'https://chernovtsy.codexenergy.com.ua',
    facts: [
      [t('Локація', 'Location'), t('Чернівецька область', 'Chernivtsi region')],
      [t('Запуск проєкту', 'Project launch'), t('2 квартал 2027 р.', 'Q2 2027')],
      [t('Фотоелектрична потужність', 'PV capacity'), t('6,8 МВт', '6.8 MW')],
      [t('Інверторне обладнання', 'Inverter equipment'), t('4,8 МВт', '4.8 MW')],
      [t('Зберігання енергії (УЗЕ)', 'Energy storage (BESS)'), t('15 МВт·год', '15 MWh')],
      [t('Архітектура', 'Architecture'), t('800-вольтова · модулі Схід-Захід', '800 V · East-West modules')],
      [t('Вартість проєкту', 'Project cost'), t('€7,3 млн', '€7.3M')],
    ],
  },
]

// EN names: the Figma outlines are Cyrillic, so English is set as SVG text in the same box
// (Montserrat 800, centred on the exported glyphs' line; widths measured in the browser)
const EN_W = { bolhrad: 626, chernivtsi: 742 }

export default function Projects() {
  const [active, setActive] = useState(-1)
  const root = useRef(null)
  const drift = useRef(null)

  // Photos drift a little after the pointer (smoothed), anywhere over the stage.
  useLayoutEffect(() => {
    const el = root.current
    const photos = el.querySelector('.proj__photos')
    const toX = gsap.quickTo(photos, 'x', { duration: 1.2, ease: 'power3.out' })
    const toY = gsap.quickTo(photos, 'y', { duration: 1.2, ease: 'power3.out' })
    const toR = gsap.quickTo(photos, 'rotation', { duration: 1.4, ease: 'power3.out' })
    drift.current = (e) => {
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      toX(nx * 60); toY(ny * 40); toR(nx * 2.5)
    }
    // partner logos appear one by one when they scroll into view
    const partners = el.querySelector('.proj__partners')
    const st = ScrollTrigger.create({ trigger: partners, start: 'top 88%', once: true, onEnter: () => partners.classList.add('is-in') })
    return () => { gsap.killTweensOf(photos); st.kill() }
  }, [])

  const projects = PROJECTS()
  const current = projects[active]

  return (
    <section className={`proj${active >= 0 ? ' is-open' : ''}`} ref={root} onMouseMove={(e) => drift.current?.(e)}>
      <p className="proj__eyebrow">{t('Два проєкти', 'Two projects')}</p>
      <h2 className="proj__h2">{t('Два енергопарки в реалізації', 'Two energy parks under way')}</h2>

      <div className="proj__stage" onMouseLeave={() => setActive(-1)}>
        <div className="proj__rule" />
        {projects.map((p, i) => (
          <button
            key={p.key}
            className={`proj__name proj__name--${p.key}${i === active ? ' is-active' : ''}${active >= 0 && i !== active ? ' is-dim' : ''}`}
            style={{ '--row': i }}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-pressed={i === active}
          >
            <span className="proj__label">{t('Енергопарк', 'Energy park')}</span>
            {lang === 'en' ? (
              <span className="proj__word proj__word--text" style={{ '--w': EN_W[p.key] }}>
                <span className="sr-only">{p.name}</span>
                {/* outside stroke only, as in Figma: the letters mask their own inside (and the font's overlaps) */}
                <svg className="proj__stroke" viewBox={`0 0 ${EN_W[p.key]} 129`} aria-hidden="true">
                  <mask id={`proj-out-${p.key}`} maskUnits="userSpaceOnUse" x="-10" y="-10" width={EN_W[p.key] + 20} height="149">
                    <rect x="-10" y="-10" width={EN_W[p.key] + 20} height="149" fill="#fff" />
                    <text x="0" y="97" fill="#000">{p.name.toUpperCase()}</text>
                  </mask>
                  <text x="0" y="97" mask={`url(#proj-out-${p.key})`}>{p.name.toUpperCase()}</text>
                </svg>
                <svg className="proj__fill" viewBox={`0 0 ${EN_W[p.key]} 129`} aria-hidden="true"><text x="0" y="97">{p.name.toUpperCase()}</text></svg>
              </span>
            ) : (
              <span className="proj__word" style={{ '--w': NAMES[p.key].viewBox.split(' ')[2] }}>
                <span className="sr-only">{p.name}</span>
                {/* outline exactly as Figma renders it: its outside-stroke geometry, masked by the letters */}
                <svg className="proj__stroke" viewBox={NAMES[p.key].viewBox} aria-hidden="true">
                  <mask id={`proj-out-${p.key}`} maskUnits="userSpaceOnUse" x={NAMES[p.key].mask[0]} y={NAMES[p.key].mask[1]} width={NAMES[p.key].mask[2]} height={NAMES[p.key].mask[3]}>
                    <rect x={NAMES[p.key].mask[0]} y={NAMES[p.key].mask[1]} width={NAMES[p.key].mask[2]} height={NAMES[p.key].mask[3]} fill="#fff" />
                    <path d={NAMES[p.key].d} fill="#000" />
                  </mask>
                  <path d={NAMES[p.key].ring} mask={`url(#proj-out-${p.key})`} />
                </svg>
                <svg className="proj__fill" viewBox={NAMES[p.key].viewBox} aria-hidden="true"><path d={NAMES[p.key].d} /></svg>
              </span>
            )}
          </button>
        ))}

        <div className="proj__photos" aria-hidden="true">
          {projects.map((p, i) => (
            <img key={p.key} className={i === active ? 'is-active' : ''} src={p.photo} alt="" />
          ))}
        </div>

        {/* key: the rows write in again for each project */}
        <div className="proj__info" key={active} aria-live="polite">
          {current && (
            <>
              <dl>
                {current.facts.map(([k, v], i) => (
                  <div key={k} className={`proj__row${i === current.facts.length - 1 ? ' is-cost' : ''}`} style={{ '--i': i }}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <a className="proj__link" href={current.href} target="_blank" rel="noreferrer" style={{ '--i': current.facts.length }}>
                {current.link}<Arrow />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="proj__partners">
        <img src="/projects/ribas.svg" alt="RIBAS Hotels Group" />
        <img src="/projects/kness.svg" alt="KNESS" />
        <img src="/projects/unisolar.svg" alt="Unisolar" />
      </div>
    </section>
  )
}
