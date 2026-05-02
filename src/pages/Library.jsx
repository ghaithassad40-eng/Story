import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Library.module.css'

function getLibrary() {
  try { return JSON.parse(localStorage.getItem('storyLibrary') || '[]') }
  catch { return [] }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return '' }
}

export default function Library() {
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    setStories(getLibrary())
  }, [])

  function handleReread(s) {
    navigate('/story', {
      state: {
        story: s.story,
        idea: s.idea,
        age: s.age,
        genre: s.genre,
        length: s.length,
        imageUrl: s.imageUrl || null,
        sceneImages: s.sceneImages || [],
      },
    })
  }

  function handleDelete(title) {
    const updated = stories.filter(s => s.title !== title)
    localStorage.setItem('storyLibrary', JSON.stringify(updated))
    setStories(updated)
    setDeleteConfirm(null)
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerEmoji}>🗂️</div>
          <h1 className={styles.headerTitle}>My Story Library</h1>
          <p className={styles.headerSub}>Your saved magical stories</p>
        </div>

        {stories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>📚</div>
            <h2>No stories saved yet!</h2>
            <p>Create a story and tap "Save to Library" to keep it here.</p>
            <Link to="/create" className={styles.btnCreate}>✨ Create a Story</Link>
          </div>
        ) : (
          <>
            <p className={styles.count}>{stories.length} {stories.length === 1 ? 'story' : 'stories'} saved</p>
            <div className={styles.grid}>
              {stories.map(s => (
                <div key={s.title} className={styles.card}>
                  {/* Thumbnail */}
                  <div className={styles.thumbnail}>
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.title} className={styles.thumbImg} />
                      : <div className={styles.thumbPlaceholder}>📖</div>
                    }
                  </div>

                  {/* Content */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                    <div className={styles.cardBadges}>
                      {s.age && <span className={styles.badge}>{s.age}</span>}
                      {s.genre && <span className={styles.badge}>{s.genre}</span>}
                      {s.length && <span className={styles.badge}>{s.length}</span>}
                    </div>
                    {s.idea && (
                      <p className={styles.cardIdea}>💡 {s.idea.slice(0, 80)}{s.idea.length > 80 ? '…' : ''}</p>
                    )}
                    <p className={styles.cardDate}>💾 Saved {formatDate(s.savedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className={styles.cardActions}>
                    <button className={styles.btnRead} onClick={() => handleReread(s)}>
                      📖 Re-read
                    </button>
                    {deleteConfirm === s.title ? (
                      <div className={styles.confirmRow}>
                        <span className={styles.confirmMsg}>Remove?</span>
                        <button className={styles.btnConfirm} onClick={() => handleDelete(s.title)}>Yes</button>
                        <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    ) : (
                      <button className={styles.btnDelete} onClick={() => setDeleteConfirm(s.title)}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
