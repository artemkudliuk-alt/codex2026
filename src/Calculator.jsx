import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RATE_BASE, RATE_OPT, axis, eur as eurUk, profit, short as shortUk, years as yearsUk } from './calcMath.js'
import { lang, t } from './i18n.js'

// formats in the current language
const eur = (v) => eurUk(v, lang)
const years = (n) => yearsUk(n, lang)
const short = (v) => shortUk(v, lang)
import './calc.css'
import Arrow from './Arrow.jsx'

// Section 06 (Figma 73:2): contribution and term sliders drive four tiles and a two-scenario
// forecast chart. Plot area: 506 x 290 design px, under the selected year's two figures.
const W = 506
const H = 290
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n) => String(n).split('').map((d) => SUP[d]).join('')

// Long sums (e.g. "€1 297 956") shrink to stay inside a tile; ~7 characters fit at full size.
const fit = (text) => ({ '--fit': Math.min(1, 7.4 / text.length) })

// Values glide to their new target instead of jumping (figures count, the chart morphs).
function useTweened(value, duration = 0.5) {
  const [shown, setShown] = useState(value)
  const obj = useRef({ v: value })
  useEffect(() => {
    const tween = gsap.to(obj.current, { v: value, duration, ease: 'power3.out', onUpdate: () => setShown(obj.current.v) })
    return () => tween.kill()
  }, [value, duration])
  return shown
}

function Slider({ label, value, text, min, max, step, minText, maxText, onChange }) {
  return (
    <label className="calc__slider">
      <span className="calc__slider-label">{label}</span>
      <span className="calc__slider-value">{text}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        style={{ '--p': `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="calc__slider-min">{minText}</span>
      <span className="calc__slider-max">{maxText}</span>
    </label>
  )
}

export default function Calculator() {
  const [amount, setAmount] = useState(20000)
  const [term, setTerm] = useState(10)
  const root = useRef(null)

  const base = profit(amount, RATE_BASE, term)
  const opt = profit(amount, RATE_OPT, term)
  const shownBase = useTweened(base)
  const shownCapital = useTweened(amount + base)
  const shownOpt = useTweened(opt)

  // chart geometry from glided values, so curves, scale and grid morph as a slider moves
  const gAmount = useTweened(amount, 0.6)
  const gTerm = useTweened(term, 0.6)
  // the scale is chosen from the target values and its top glides, so curves never pass it
  const scale = axis(opt)
  const top = useTweened(scale.top, 0.6)
  const ticks = scale.ticks
  const x = (t) => (t / gTerm) * W
  const y = (v) => H - (v / top) * H
  const curve = (r) => {
    const pts = []
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * gTerm
      pts.push(`${x(t).toFixed(1)},${y(profit(gAmount, r, t)).toFixed(1)}`)
    }
    return `M${pts.join('L')}`
  }
  const optPath = curve(RATE_OPT)
  const year = term // the chart follows the sliders only (client): always the end of the term
  // the marker glides between years in the same frame as the curves, so it stays on them
  // the marker is the drawn curve's own end, so fast slider moves can't throw it off
  const gYear = gTerm
  const cx = x(gYear)
  const xTicks = Array.from({ length: term }, (_, i) => i + 1)
  const shownYBase = useTweened(profit(amount, RATE_BASE, year))
  const shownYOpt = useTweened(profit(amount, RATE_OPT, year))


  // Draw the curves in when the section first comes into view; scrolling pushes the ribbon colours.
  useLayoutEffect(() => {
    const st = ScrollTrigger.create({ trigger: root.current, start: 'top 70%', once: true, onEnter: () => root.current.classList.add('is-in') })
    const flows = root.current.querySelectorAll('.calc__flow')
    const scroll = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => flows.forEach((g, i) => g.setAttribute('gradientTransform', `translate(${(i ? -1 : 1) * self.progress * 1400} 0)`)),
    })
    return () => { st.kill(); scroll.kill() }
  }, [])

  return (
    <section className="calc" ref={root}>
      <svg className="calc__ribbons" viewBox="0 0 2020 1080" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* Brand colours only (no white): orange <-> blue <-> light blue flow along the ribbons, as the
              mark in section 05: a long reflected gradient
              (one colour run ~ 1.3 widths) slides forever, the lower ribbon the other way, plus a scroll
              offset (set on the base transform in JS; the SMIL slide is added on top). */}
          <linearGradient className="calc__flow" id="calc-r1" x1="0" x2="2600" y1="0" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
            <stop stopColor="#85B1DF" /><stop offset="0.45" stopColor="#3E69B1" /><stop offset="1" stopColor="#E7520F" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="5200 0" dur="26s" repeatCount="indefinite" additive="sum" />
          </linearGradient>
          <linearGradient className="calc__flow" id="calc-r2" x1="0" x2="2600" y1="0" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
            <stop stopColor="#E7520F" /><stop offset="0.55" stopColor="#3E69B1" /><stop offset="1" stopColor="#85B1DF" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-5200 0" dur="26s" repeatCount="indefinite" additive="sum" />
          </linearGradient>
        </defs>
        {/* the lower ribbon starts 4 units higher, under the upper one: no anti-aliased hairline at the seam */}
        <path d="M0 620C490 668 1063 654 2020 596V654C1063 700 490 787 0 768V620Z" fill="url(#calc-r2)" />
        <path d="M0 516C490 600 1063 624 2020 564V600C1063 658 490 672 0 624V516Z" fill="url(#calc-r1)" />
      </svg>

      <div className="calc__panel">
        <div className="calc__inputs">
          <p className="calc__eyebrow">{t('Розрахунок доходу', 'Income calculation')}</p>
          <h2 className="calc__h2">{t(<>Розрахуйте свій<br />потенційний дохід</>, <>Calculate your<br />potential income</>)}</h2>
          <Slider
            label={t('Пайовий внесок', 'Share contribution')} value={amount} text={eur(amount)}
            min={10000} max={250000} step={1000} minText={eur(10000)} maxText={eur(250000)} onChange={setAmount}
          />
          <Slider
            label={t('Строк участі', 'Participation term')} value={term} text={years(term)}
            min={1} max={10} step={1} minText={years(1)} maxText={years(10)} onChange={setTerm}
          />
        </div>

        <div className="calc__tiles" aria-live="polite">
          <div className="calc__tile">
            <p className="calc__tile-label">{t(<>Ставка<br />дохідності</>, <>Rate of<br />return</>)}</p>
            <p className="calc__tile-value">16–20%</p>
            <p className="calc__tile-note">{t('Орієнтовна річна дохідність паю в EUR', 'Estimated annual return on a share in EUR')}</p>
          </div>
          <div className="calc__tile">
            <p className="calc__tile-label">{t('Прибуток', 'Profit')}<br />{t('за', 'over')} {years(term)}</p>
            <p className="calc__tile-value" style={fit(eur(shownBase))}>{eur(shownBase)}</p>
            <p className="calc__tile-note">{t('Базовий сценарій, 16% річних', 'Base scenario, 16% per year')}</p>
          </div>
          <div className="calc__tile">
            <p className="calc__tile-label">{t('Капітал', 'Capital')}<br />{t('через', 'after')} {years(term)}</p>
            <p className="calc__tile-value" style={fit(eur(shownCapital))}>{eur(shownCapital)}</p>
            <p className="calc__tile-note">{t('Внесок разом із реінвестованим прибутком', 'Contribution plus reinvested profit')}</p>
          </div>
          <div className="calc__tile calc__tile--opt">
            <p className="calc__tile-label">{t('Оптимістичний', 'Optimistic')}<br />{t('за', 'over')} {years(term)}</p>
            <p className="calc__tile-value" style={fit(eur(shownOpt))}>{eur(shownOpt)}</p>
            <p className="calc__tile-note">{t('Прибуток при 20% річних', 'Profit at 20% per year')}</p>
          </div>
          <p className="calc__formula">
            <span>16%: {eur(amount)} × ({t('1,16', '1.16')}{sup(term)} − 1) = <b>{eur(base)}</b></span>
            <span>20%: {eur(amount)} × ({t('1,20', '1.20')}{sup(term)} − 1) = <b className="is-opt">{eur(opt)}</b></span>
          </p>
        </div>

        <div className="calc__chart">
          <p className="calc__eyebrow">{t('Прогноз', 'Forecast')}</p>
          <p className="calc__chart-title">{t('Прогноз прибутку', 'Profit forecast')}</p>
          <ul className="calc__legend">
            <li className="is-base">{t('Базовий', 'Base')} · 16%</li>
            <li className="is-opt">{t('Оптимістичний', 'Optimistic')} · 20%</li>
          </ul>

          {/* minimal: the two scenario figures for the selected year, counting to new values */}
          <div className="calc__big" aria-live="polite">
            <p className="is-base"><span>16% · {years(year)}</span>{eur(shownYBase)}</p>
            <p className="is-opt"><span>20% · {years(year)}</span>{eur(shownYOpt)}</p>
          </div>

          <div className="calc__plot">
            {ticks.map((v) => (
              <div key={v} className={`calc__grid${v === 0 ? ' is-zero' : ''}`} style={{ '--y': `${(y(v) / H) * 100}%` }}>
                <span>{short(v)}</span>
              </div>
            ))}
            {xTicks.map((t) => (
              <span key={t} className={`calc__xtick${t === year ? ' is-on' : ''}`} style={{ '--x': `${(x(t) / W) * 100}%` }}>{t}</span>
            ))}
            <span className="calc__xunit">{t('роки', 'years')}</span>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="calc-area" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#E7520F" stopOpacity="0.22" /><stop offset="1" stopColor="#E7520F" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="calc__area" d={`${optPath}L${x(gTerm)},${H}L0,${H}Z`} fill="url(#calc-area)" />
              <path className="calc__line calc__line--base" d={curve(RATE_BASE)} />
              <path className="calc__line calc__line--opt" d={optPath} />
            </svg>
            <div className="calc__cursor" style={{ '--x': `${(cx / W) * 100}%` }}>
              <i className="is-base" style={{ '--y': `${(y(profit(gAmount, RATE_BASE, gYear)) / H) * 100}%` }} />
              <i className="is-opt" style={{ '--y': `${(y(profit(gAmount, RATE_OPT, gYear)) / H) * 100}%` }} />
            </div>
          </div>
          <p className="calc__footnote">{t('*Розрахунок є орієнтовним та не гарантує фактичний дохід.', '*The calculation is indicative and does not guarantee actual income.')}</p>
        </div>

        <a className="btn btn--primary calc__cta" href="#">{t('Звʼязатись з менеджером', 'Contact a manager')}<Arrow /></a>
      </div>
    </section>
  )
}
