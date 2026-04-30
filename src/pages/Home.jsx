import { Link } from 'react-router-dom'
import styles from './Home.module.css'

const features = [
  { icon: '🎨', title: 'Your Idea', desc: 'Type any story idea you imagine' },
  { icon: '🤖', title: 'AI Magic', desc: 'Our AI writes a fun story just for you' },
  { icon: '📖', title: 'Read & Enjoy', desc: 'Read your unique adventure story' },
  { icon: '♾️', title: 'Unlimited', desc: 'Create as many stories as you want' },
]

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.bubbles}>
          <span>🦄</span><span>🐉</span><span>🚀</span><span>🧙</span><span>🌈</span>
        </div>
        <h1 className={styles.title}>
          Create Your Own<br />
          <span className={styles.gradient}>Magic Story!</span>
        </h1>
        <p className={styles.subtitle}>
          Type your idea and let our magical AI write an amazing adventure story just for you.
          Free for everyone, no sign-up needed! 🎉
        </p>
        <div className={styles.ctas}>
          <Link to="/create" className={styles.btnPrimary}>
            ✨ Start Creating
          </Link>
          <Link to="/examples" className={styles.btnSecondary}>
            📚 See Examples
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>How It Works 🪄</h2>
        <div className={styles.grid}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} className={styles.card}>
              <div className={styles.cardIcon}>{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaBox}>
          <h2>Ready for an Adventure? 🌟</h2>
          <p>Every great story starts with one idea. What's yours?</p>
          <Link to="/create" className={styles.btnPrimary}>
            🚀 Create My Story
          </Link>
        </div>
      </section>
    </main>
  )
}
