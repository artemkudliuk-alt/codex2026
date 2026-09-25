// Two languages, UA (default) and EN. The choice comes from ?lang=, then from localStorage.
// Texts sit next to their markup as t('укр', 'eng'); the app remounts under key={lang}, so every
// t() call re-reads the current language.
const KEY = 'codex-lang'

function initial() {
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'en' || q === 'uk') return q
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'uk' } catch { return 'uk' }
}

export let lang = initial()
document.documentElement.lang = lang === 'en' ? 'en' : 'uk'

export const t = (uk, en) => (lang === 'en' ? en : uk)
export const locale = () => (lang === 'en' ? 'en-GB' : 'uk-UA')

const listeners = new Set()
export const onLang = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

export function setLang(next) {
  if (next === lang) return
  lang = next
  document.documentElement.lang = next === 'en' ? 'en' : 'uk'
  try { localStorage.setItem(KEY, next) } catch { /* private mode: the URL still carries it */ }
  const url = new URL(window.location.href)
  url.searchParams.set('lang', next)
  window.history.replaceState(null, '', url)
  listeners.forEach((fn) => fn(next))
}

// the preloader plays once per visit; a language switch remounts the page without it
export const intro = { played: false }
