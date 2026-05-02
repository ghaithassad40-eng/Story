import styles from './StarField.module.css'

const PARTICLES = [
  { symbol: '✨', size: '1.1rem' },
  { symbol: '⭐', size: '0.9rem' },
  { symbol: '🌟', size: '1rem' },
  { symbol: '💫', size: '0.85rem' },
  { symbol: '✦',  size: '0.8rem' },
  { symbol: '★',  size: '0.75rem' },
]

const STARS = Array.from({ length: 18 }, (_, i) => {
  const p = PARTICLES[i % PARTICLES.length]
  return {
    id: i,
    symbol: p.symbol,
    size: p.size,
    left: `${(i * 5.5 + 3) % 100}%`,
    duration: `${8 + (i % 7) * 2.5}s`,
    delay: `${(i * 1.1) % 12}s`,
    opacity: 0.35 + (i % 4) * 0.1,
  }
})

export default function StarField() {
  return (
    <div className={styles.field} aria-hidden="true">
      {STARS.map(s => (
        <span
          key={s.id}
          className={styles.star}
          style={{
            left: s.left,
            fontSize: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay,
            opacity: s.opacity,
          }}
        >
          {s.symbol}
        </span>
      ))}
    </div>
  )
}
