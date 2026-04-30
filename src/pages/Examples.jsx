import { Link } from 'react-router-dom'
import styles from './Examples.module.css'
import examples from '../data/examples.json'

export default function Examples() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.emoji}>📚</div>
        <h1>Story Examples</h1>
        <p>Get inspired! Here are some stories kids have created. Use any idea as a starting point!</p>
      </div>

      <div className={styles.grid}>
        {examples.map(({ emoji, title, age, genre, idea, preview }) => (
          <div key={title} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardEmoji}>{emoji}</span>
              <div className={styles.cardMeta}>
                <span className={styles.badge}>{age}</span>
                <span className={styles.badge}>{genre}</span>
              </div>
            </div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardPreview}>{preview}</p>
            <div className={styles.cardIdea}>
              💡 <strong>Idea:</strong> {idea}
            </div>
            <Link
              to="/create"
              state={{ prefill: idea }}
              className={styles.tryBtn}
            >
              Use This Idea ✨
            </Link>
          </div>
        ))}
      </div>

      <div className={styles.cta}>
        <h2>Ready to write your own? 🌟</h2>
        <Link to="/create" className={styles.btnPrimary}>
          ✨ Create My Story
        </Link>
      </div>
    </main>
  )
}
