import { useState } from 'react'
import './services.css'
import Arrow from './Arrow.jsx'
import { t } from './i18n.js'

// Section 04 (Figma 60:2 / 60:28 / 199:5): three cards, the one under the pointer (or focus)
// widens into a photo card, the others shrink to a glass icon. All motion is CSS transitions;
// the glass icons and the active card's border shimmer in the brand colours.
const CARDS = () => [
  {
    title: t(['Розробка та реалізація', 'енергетичних обʼєктів'], ['Development and delivery', 'of energy facilities']),
    sub: t('Від ділянки - до працюючого активу', 'From a land plot to an operating asset'),
    cta: t('Обговорити свій проєкт', 'Discuss your project'),
  },
  {
    title: t(['Управління', 'енергетичними активами'], ['Management', 'of energy assets']),
    sub: t('Актив має працювати не лише на папері', 'An asset has to work, not just on paper'),
    cta: t('Дізнатися більше', 'Learn more'),
  },
  {
    title: t(['Консалтинг'], ['Consulting']),
    sub: t('Експертиза для рішень, які мають працювати', 'Expertise for decisions that have to work'),
    cta: t('Замовити консалтинг', 'Order consulting'),
  },
]

export default function Services() {
  const [active, setActive] = useState(0)

  return (
    <section className="services">
      <p className="services__eyebrow">{t('Напрями роботи', 'Areas of work')}</p>
      <h2 className="services__h2">{t(<>Від окремої експертизи -<br />до повного енергетичного активу</>, <>From stand-alone expertise -<br />to a complete energy asset</>)}</h2>

      <div className="services__row">
        {CARDS().map((c, i) => {
          const n = String(i + 1).padStart(2, '0')
          return (
            <article
              key={n}
              className={`service${i === active ? ' is-active' : ''}`}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)} // phones: iOS does not focus a tapped card
            >
              {/* collapsed: glass icon on grey */}
              <div className="service__rest" aria-hidden={i === active}>
                <span className="service__num">{n}</span>
                <div className="service__icon" style={{ '--mask': `url(/services/i${i + 1}-mask.webp)` }}>
                  <img src={`/services/i${i + 1}.webp`} alt="" />
                  <span className="service__flow"><i /><i /><i /></span>
                </div>
                <p className="service__sub">{c.sub}</p>
                <h3 className="service__title">{c.title.join(' ')}</h3>
              </div>

              {/* expanded: photo card, fixed 810 wide so the text never reflows while it opens */}
              <div className="service__open" aria-hidden={i !== active}>
                <img className="service__photo" src={`/services/p${i + 1}.webp`} alt="" />
                <span className="service__num">{n}</span>
                <h3 className="service__open-title">{c.title.map((l) => <span key={l}>{l}</span>)}</h3>
                <p className="service__open-sub">{c.sub}</p>
                <a className="btn btn--primary service__cta" href="#" tabIndex={i === active ? 0 : -1}>{c.cta}<Arrow /></a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
