// Loading order. The preloader waits for `critical` (plus fonts, window load and the hero video);
// everything else waits in `later`, in page order (components register during mount, top to
// bottom), and starts only once the critical set is in - so nothing competes with the hero.
export const critical = []
const queue = []
let started = false
let running = false

async function run() {
  if (running) return
  running = true
  while (queue.length) await queue.shift()().catch(() => {})
  running = false
}

export function later(task) {
  queue.push(task)
  if (started) run()
}

export function startQueue() {
  started = true
  run()
}

export const loadImage = (img, src) => new Promise((resolve) => {
  img.onload = () => img.decode().catch(() => {}).then(resolve) // decoded now, not on first draw
  img.onerror = resolve
  img.src = src
})

// A deferred <video preload="none">: buffer it now and resolve once it can play through.
export const loadVideo = (video) => new Promise((resolve) => {
  if (video.readyState >= 4) return resolve()
  const done = () => resolve()
  video.addEventListener('canplaythrough', done, { once: true })
  video.addEventListener('error', done, { once: true })
  setTimeout(done, 15000) // a slow network must not stall the rest of the queue
  video.preload = 'auto'
  if (video.readyState === 0 && video.paused) video.load() // never restart one already playing
})
