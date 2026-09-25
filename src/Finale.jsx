import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Arrow from './Arrow.jsx'
import { lenis, units } from './scroll.js'
import { createFlames, createSparks } from './sparks.js'
import { later, loadVideo } from './load.js'
import { t } from './i18n.js'
import './finale.css'

// Sections 09 (CTA, Figma 106:2) and 10 (footer, 109:2 / hover 109:38) share one sun: the looping
// video runs across the seam, with a light travelling along its rim, a soft pulse in the centre
// and energy sparks rising into the empty sky. Sun rim in video px (1920x1080): measured.
const RIM = { cx: 951, cy: 1563, r: 980 }
const SUN_TOP = 200 // design px from the CTA top

const NAV = () => [t('Послуги', 'Services'), t('Проекти', 'Projects'), t('Про нас', 'About us'), t('Блог', 'Blog'), t('Контакти', 'Contacts')]
const SOCIALS = ['instagram', 'facebook', 'telegram', 'youtube', 'linkedin']

export default function Finale() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    const video = el.querySelector('.finale__video')
    const canvas = el.querySelector('.finale__sparks')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    later(() => loadVideo(video))
    // the canvas covers the CTA; the sun box starts SUN_TOP down and is 1920 wide in design px
    const sparks = calm ? null : createSparks(canvas, () => ({
      cx: RIM.cx * units.uw,
      cy: (SUN_TOP + RIM.cy) * units.uw,
      r: RIM.r * units.uw,
    }))
    const flames = calm ? null : createFlames(el.querySelector('.finale__flames'), () => ({
      cx: RIM.cx * units.uw, cy: RIM.cy * units.uw, r: RIM.r * units.uw,
    }))
    const tick = () => { sparks?.frame(); flames?.frame() }
    const onResize = () => { sparks?.resize(); flames?.resize() }
    window.addEventListener('resize', onResize)

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) {
          video.playbackRate = 0.5 // the sun moves twice slower (client)
          video.play().catch(() => {})
          sparks?.reset()
          gsap.ticker.add(tick)
        } else {
          video.pause()
          gsap.ticker.remove(tick)
        }
      },
    })
    const reveal = ScrollTrigger.create({ trigger: el, start: 'top 70%', once: true, onEnter: () => el.classList.add('is-in') })

    return () => {
      st.kill()
      reveal.kill()
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="finale" ref={root}>
      <div className="finale__sun" aria-hidden="true">
        {/* 1280x720: it is shown blurred, a larger frame would only add bytes; loads last in the queue */}
        <video className="finale__video" poster="/video/sun-poster.webp" muted loop playsInline preload="none">
          <source src="/video/sun.av1.mp4" type='video/mp4; codecs="av01.0.08M.10"' />
          <source src="/video/sun.mp4" type="video/mp4" />
        </video>
        <div className="finale__warm" />
        <canvas className="finale__flames" />
        <div className="finale__pulse" />
        <svg className="finale__rim" viewBox="0 0 1920 1080">
          <path d="M200 933A980 980 0 0 1 1700 931" pathLength="1" className="finale__rim-glow" />
          <path d="M200 933A980 980 0 0 1 1700 931" pathLength="1" className="finale__rim-core" />
        </svg>
      </div>
      <canvas className="finale__sparks" aria-hidden="true" />

      <section className="cta">
        <h2 className="cta__h2 rise">{t(<>Отримайте частку в енергетичному<br />інфраструктурному активі</>, <>Get a share in an energy<br />infrastructure asset</>)}</h2>
        <p className="cta__sub rise">{t(<>Орієнтовна дохідність 16-20% річних*<br />Перші дивіденди - І квартал 2027</>, <>Estimated return 16-20% per year*<br />First dividends - Q1 2027</>)}</p>
        <p className="cta__note rise">{t('*Розрахунок є орієнтовним та не гарантує фактичний дохід.', '*The estimate is indicative and does not guarantee actual income.')}</p>
        <div className="cta__row rise">
          <a className="cta__btn cta__btn--primary" href="#">{t('Стати співвласником', 'Become a co-owner')}<span className="cta__circ"><Arrow /></span></a>
          <a className="cta__btn cta__btn--ghost" href="#">{t('Отримати презентацію', 'Get the presentation')}<span className="cta__circ"><Arrow /></span></a>
        </div>
      </section>

      <footer className="footer">
        <nav className="footer__nav">
          <span className="footer__home">{t('Головна', 'Home')}</span>
          {NAV().map((n) => (
            <a key={n} className="footer__card" href="#">
              <span>{n}</span>
              <img className="footer__nav-arrow" src="/footer/nav-arrow.svg" alt="" />
            </a>
          ))}
        </nav>

        <div className="footer__contacts">
          <a href="mailto:sales@codex.energy">sales@codex.energy</a>
          <a href="tel:+380676463422">+38 (067) 646-34-22</a>
          <span>{t('м. Одеса, проспект Лесі Українки, 25', '25 Lesi Ukrainky Ave, Odesa')}</span>
        </div>
        <div className="footer__socials">
          {SOCIALS.map((s) => (
            <a key={s} className="footer__social" href="#" aria-label={s} style={{ '--icon': `url(/footer/${s}.svg)` }}><i /></a>
          ))}
        </div>
        <p className="footer__disclaimer">
          {t('Діяльність Енергетичного кооперативу не є діяльністю інституту спільного інвестування, діяльністю з управління активами, діяльністю на ринку капіталу чи організованих товарних ринках, а також не є професійною діяльністю на ринках фінансових послуг. Кооператив не здійснює публічного залучення коштів і не гарантує отримання доходу.', 'The Energy Cooperative is not a collective investment institution and does not manage assets, operate on the capital market or organised commodity markets, or provide professional financial services. The cooperative does not raise funds publicly and does not guarantee income.')}
        </p>
        <p className="footer__copy">© 2026. Codex Energy</p>
        <div className="footer__legal">
          <a href="#">{t('Юридичні умови', 'Legal terms')}</a>
          <a href="#">{t('Політика конфіденційності', 'Privacy policy')}</a>
          <span className="footer__credit">{t('Розроблено NextWeb', 'Developed by NextWeb')}</span>
        </div>
        <img className="footer__mark" src="/footer/mark.svg" alt="" aria-hidden="true" />
        <button className="footer__top" onClick={() => lenis.scrollTo(0, { duration: 2.2 })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5" /><path d="m6 11 6-6 6 6" />
          </svg>
          <span>{t('Вгору', 'Top')}</span>
        </button>
      </footer>
    </div>
  )
}
