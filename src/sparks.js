// Energy sparks rising off the sun's rim into the empty sky above it: a plain 2D canvas,
// ~90 particles (40 on touch devices). The caller starts/stops it with visibility.
const COLORS = ['133,177,223', '133,177,223', '255,255,255', '231,82,15']

// rim: circle in canvas CSS px { cx, cy, r }
export function createSparks(canvas, getRim) {
  const ctx = canvas.getContext('2d')
  const count = window.matchMedia('(pointer: coarse)').matches ? 40 : 90
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  let w = 0, h = 0

  const spawn = (p, fresh) => {
    const { cx, cy, r } = getRim()
    // a point on the upper rim, mostly within the visible width
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5
    p.x = cx + Math.cos(a) * r
    p.y = cy + Math.sin(a) * r
    p.vx = Math.cos(a) * (3 + Math.random() * 5)   // half speed (client)
    p.vy = -(5 + Math.random() * 11)
    p.life = 8 + Math.random() * 10
    p.age = fresh ? Math.random() * p.life : 0
    p.size = 0.6 + Math.random() * 1.8
    p.color = COLORS[(Math.random() * COLORS.length) | 0]
    p.phase = Math.random() * Math.PI * 2
    return p
  }
  const parts = Array.from({ length: count }, () => spawn({}, true))

  const resize = () => {
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  let last = performance.now()
  const frame = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (const p of parts) {
      p.age += dt
      if (p.age > p.life) spawn(p, false)
      p.x += (p.vx + Math.sin(now / 1800 + p.phase) * 3) * dt
      p.y += p.vy * dt
      const t = p.age / p.life
      const alpha = Math.sin(Math.PI * t) * 0.8 // fade in and out
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return { frame, resize, reset: () => { last = performance.now() } }
}

// Soft flame tongues licking off the rim (drawn sharp, blurred by CSS): ~46 stretched glows along
// the upper arc whose lengths flicker with two slow sines each.
export function createFlames(canvas, getRim) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
  const N = 46
  const seeds = Array.from({ length: N }, () => [Math.random() * 6.28, 0.6 + Math.random() * 0.9, Math.random()])
  // sun rays: radial streaks off the rim (they fan out slightly), each its own length and breath
  const RAYS = 30
  const rays = Array.from({ length: RAYS }, (_, i) => ({
    a: -Math.PI / 2 + ((i + Math.random() * 0.6) / RAYS - 0.5) * 1.6,
    len: 0.12 + Math.random() * 0.38, // of the radius: some long, some short
    ph: Math.random() * 6.28,
    sp: 0.25 + Math.random() * 0.35,
  }))
  let w = 0, h = 0
  const resize = () => {
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  const frame = () => {
    const t = performance.now() / 2000 // half speed (client)
    const { cx, cy, r } = getRim()
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (const ray of rays) {
      const breath = 0.6 + 0.4 * Math.sin(t * ray.sp + ray.ph)
      const len = r * ray.len * (0.8 + 0.2 * breath)
      const x0 = cx + Math.cos(ray.a) * r * 0.985
      const y0 = cy + Math.sin(ray.a) * r * 0.985
      const x1 = cx + Math.cos(ray.a) * (r + len)
      const y1 = cy + Math.sin(ray.a) * (r + len)
      const g = ctx.createLinearGradient(x0, y0, x1, y1)
      g.addColorStop(0, `rgba(255,255,255,${(0.32 * breath).toFixed(3)})`)
      g.addColorStop(0.35, `rgba(133,177,223,${(0.16 * breath).toFixed(3)})`)
      g.addColorStop(1, 'rgba(133,177,223,0)')
      ctx.strokeStyle = g
      ctx.lineWidth = r * (0.012 + 0.018 * breath)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
    for (let i = 0; i < N; i++) {
      const [ph, sp, tint] = seeds[i]
      const a = -Math.PI / 2 + ((i + 0.5) / N - 0.5) * 1.55
      const flick = 0.55 + 0.45 * Math.sin(t * sp * 1.7 + ph) * Math.sin(t * sp * 0.9 + ph * 2)
      const len = r * (0.06 + 0.1 * flick)
      const wid = r * 0.045
      ctx.save()
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      ctx.rotate(a + Math.PI / 2)
      ctx.scale(1, len / wid)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, wid)
      const core = tint > 0.7 ? '133,177,223' : '231,82,15' // brand blue-300 / orange
      g.addColorStop(0, `rgba(${core},${(0.55 * flick).toFixed(3)})`)
      g.addColorStop(1, `rgba(${core},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, -wid * 0.55, wid, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  return { frame, resize }
}
