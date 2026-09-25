import { useId, useState } from 'react'
import './why.css'
import { t } from './i18n.js'

// Section 05 (Figma 68:2 / 68:35): the giant Codex mark with a flowing brand gradient, and an
// accordion - one item open at a time, the first one open by default. Texts: TZ p.1-2 verbatim (the
// layout's first body belongs to item 2, so it is not used).
const ITEMS = () => [
  [t('Повний цикл', "Full cycle"), t('Беремо проєкт від ділянки та технічної підготовки до запуску, генерації та операційного управління.', "We take a project from the land plot and technical preparation to launch, generation and operational management.")],
  [t('Зрозуміла модель участі', "A clear participation model"), t('Структуруємо проєкт так, щоб учасник розумів, у який актив він входить, як формується дохід і що відбувається з проєктом на кожному етапі.', "We structure each project so that participants understand which asset they are joining, how income is generated and what happens to the project at every stage.")],
  [t('Професійне управління', "Professional management"), t('Після запуску Codex Energy продовжує управляти активом: контролює його роботу, операційні процеси та реалізацію виробленої електроенергії.', "After launch Codex Energy keeps managing the asset: it controls its operation, operational processes and the sale of the electricity produced.")],
  [t('Прозорість', "Transparency"), t('Регулярна звітність і доступ до ключових показників дозволяють учасникам бачити, як працює актив і формується його дохід.', "Regular reporting and access to key indicators let participants see how the asset performs and how its income is formed.")],
  [t('Орієнтовно 16–20% річних у євро', "Estimated 16–20% per year in euros"), t('Прогнозна дохідність проєктів формується на основі роботи енергопарку та реалізації виробленої електроенергії.', "Projected returns are based on the energy park's operation and the sale of the electricity it produces.")],
  [t('Сильна партнерська екосистема', "A strong partner ecosystem"), t('Працюємо з профільними партнерами у сфері обладнання, будівництва, енерготрейдингу та технічної реалізації.', "We work with specialist partners in equipment, construction, energy trading and technical delivery.")],
]

export default function Why() {
  const [open, setOpen] = useState(0) // the first item open by default (client)
  const id = useId()

  return (
    <section className="why">
      <div className="why__mark" aria-hidden="true" />

      <div className="why__intro">
        <p className="why__eyebrow">{t('Чому ми', 'Why us')}</p>
        <h2 className="why__h2">{t(<>Керуємо енергією.<br />Контролюємо результат.</>, <>We manage energy.<br />We control the result.</>)}</h2>
      </div>

      <div className="why__list">
        {ITEMS().map(([title, body], i) => {
          const isOpen = i === open
          return (
            <div key={title} className={`why__item${isOpen ? ' is-open' : ''}${i >= 4 ? ' is-long' : ''}`}>
              <button
                className="why__head"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span className="why__title">{title}</span>
                <img className="why__toggle" src="/why/toggle.svg" alt="" />
              </button>
              <div className="why__body" id={`${id}-${i}`} role="region" aria-label={title}>
                <div><p>{body}</p></div>
              </div>
            </div>
          )
        })}
        <a className="btn btn--primary why__cta" href="#">{t('Звʼязатись з нами', 'Contact us')}</a>
      </div>
    </section>
  )
}
