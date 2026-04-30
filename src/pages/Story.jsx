import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import styles from './Story.module.css'

export default function Story() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()

  useEffect(() => {
    if (!state?.story) navigate('/')
  }, [state, navigate])

  if (!state?.story) return null

  const { story, idea, age, genre, length } = state

  const paragraphs = story
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean)

  const title = paragraphs[0]
  const body = paragraphs.slice(1)

  function handlePrint() {
    window.print()
  }

  function handleCopy() {
    navigator.clipboard.writeText(story)
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.meta}>
          {age && <span className={styles.badge}>🎂 {age}</span>}
          {genre && <span className={styles.badge}>{genre}</span>}
          {length && <span className={styles.badge}>📏 {length}</span>}
        </div>

        <div className={styles.storyCard} ref={printRef}>
          <div className={styles.decoration}>✨ 🌟 ✨</div>
          <h1 className={styles.storyTitle}>{title}</h1>
          <div className={styles.divider} />
          <div className={styles.storyBody}>
            {body.map((para, i) => (
              <p key={i} className={styles.para}>{para}</p>
            ))}
          </div>
          <div className={styles.decoration}>🎉 The End 🎉</div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleCopy} className={styles.btnSecondary}>
            📋 Copy Story
          </button>
          <button onClick={handlePrint} className={styles.btnSecondary}>
            🖨️ Print
          </button>
          <Link to="/create" className={styles.btnPrimary}>
            ✨ New Story
          </Link>
        </div>

        {idea && (
          <p className={styles.ideaNote}>
            💡 Based on your idea: <em>"{idea}"</em>
          </p>
        )}
      </div>
    </main>
  )
}
