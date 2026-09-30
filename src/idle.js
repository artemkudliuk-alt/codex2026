// Off-screen sections do no work: their endless CSS animations and SMIL gradients pause
// (.is-idle, index.css) and the hero video stops decoding, until they come back into view.
// Visible sections look exactly as before - nothing on screen is paused.
export function pauseOffscreen() {
  const sections = document.querySelectorAll('main section, main > .finale') // not 'main >': the pinned hero sits in a pin-spacer
  const io = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.classList.toggle('is-idle', !isIntersecting)
      target.querySelectorAll('svg').forEach((svg) => {
        if (!svg.querySelector('animate, animateTransform')) return
        if (isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations()
      })
      if (target.classList.contains('hero')) {
        const video = target.querySelector('video')
        if (isIntersecting) video?.play().catch(() => {}); else video?.pause()
      }
    }
  }, { rootMargin: '200px 0px' }) // wake a little before the section scrolls in
  sections.forEach((s) => io.observe(s))
  return () => io.disconnect()
}
