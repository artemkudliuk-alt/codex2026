// Run: node src/calcMath.check.mjs  (the layout figures must come out of the formula)
import assert from 'node:assert/strict'
import { profit, eur, years, axis, short, RATE_BASE, RATE_OPT } from './calcMath.js'
const n = (s) => s.replace(/\s/g, ' ')
// layout figures: €20 000, 10 years
assert.equal(n(eur(profit(20000, RATE_BASE, 10))), '€68 229')
assert.equal(n(eur(20000 + profit(20000, RATE_BASE, 10))), '€88 229')
assert.equal(n(eur(profit(20000, RATE_OPT, 10))), '€103 835')
assert.equal(n(eur(profit(20000, RATE_BASE, 7))), '€36 524')
assert.equal(n(eur(profit(20000, RATE_OPT, 7))), '€51 664')
// plurals
assert.deepEqual([1, 2, 4, 5, 10, 11, 21, 22].map(years), ['1 рік', '2 роки', '4 роки', '5 років', '10 років', '11 років', '21 рік', '22 роки'])
// axis: the top tick always covers the largest value (€1 297 934 -> up to €1,5M in 0,5M steps)
const a = axis(1297934)
assert.deepEqual(a.ticks, [0, 500000, 1000000, 1500000])
for (const m of [103835, 36400, 8000, 1297934, 250000]) assert.ok(axis(m).top >= m, `top >= ${m}`)
assert.equal(short(25000), '€25k')
// English formats
assert.equal(eur(20000, 'en'), '€20,000')
assert.deepEqual([1, 2, 10].map((n) => years(n, 'en')), ['1 year', '2 years', '10 years'])
console.log('calcMath: all checks pass')
