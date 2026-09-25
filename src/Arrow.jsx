import './arrow.css'

// Line arrow for buttons and links (replaces the "→" glyph). Two copies: on hover of the parent
// link/button the first flies out right while the second slides in from the left; at rest it
// gives a small nudge every few seconds.
const Path = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h15" />
    <path d="M13.5 6.5 19 12l-5.5 5.5" />
  </svg>
)

export default function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      <Path />
      <Path />
    </span>
  )
}
