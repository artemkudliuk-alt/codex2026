// Calculator maths (the layout's figures match annual compounding with full reinvestment):
// profit after t years = P * ((1 + r)^t - 1).
export const RATE_BASE = 0.16
export const RATE_OPT = 0.2

export const profit = (p, r, t) => p * ((1 + r) ** t - 1)

// lang: 'uk' (default) or 'en' - kept as a parameter so this file stays pure (node check)
const LOC = { uk: 'uk-UA', en: 'en-GB' }
export const eur = (v, lang = 'uk') => '€' + Math.round(v).toLocaleString(LOC[lang])

// 1 рік, 2-4 роки, 5+ років (11-14 -> років)
export function years(n, lang = 'uk') {
  if (lang === 'en') return n === 1 ? '1 year' : `${n} years`
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return `${n} рік`
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} роки`
  return `${n} років`
}

// Chart axis: ~4 "nice" steps (1, 2, 2.5, 5 x 10^n); the top tick is always at or above the
// largest value, so a curve never runs past the scale.
export function axis(maxValue) {
  const max = Math.max(maxValue, 1)
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)
  const top = Math.ceil(max / step - 1e-9) * step
  const ticks = []
  for (let v = 0; v <= top + 1e-6; v += step) ticks.push(v)
  return { top, step, ticks }
}

export const short = (v, lang = 'uk') =>
  v >= 1e6 ? `€${(v / 1e6).toLocaleString(LOC[lang], { maximumFractionDigits: 1 })}M` : v === 0 ? '€0' : `€${Math.round(v / 1000)}k`
