import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './Story.module.css'
import config from '../config.json'

const { voiceId: VOICE_ID, modelId: EL_MODEL, voiceSettings: VOICE_SETTINGS } = config.elevenlabs

export default function Story() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()
  const audioRef = useRef(null)
  const [ttsState, setTtsState] = useState('idle') // idle | loading | playing | paused
  const [ttsError, setTtsError] = useState('')

  useEffect(() => {
    if (!state?.story) navigate('/')
  }, [state, navigate])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
  }, [])

  if (!state?.story) return null

  const { story, idea, age, genre, length, imageUrl } = state

  const paragraphs = story.split('\n').map(p => p.trim()).filter(Boolean)
  const title = paragraphs[0]
  const body = paragraphs.slice(1)

  function handlePrint() { window.print() }
  function handleCopy() { navigator.clipboard.writeText(story) }

  function handleSaveJSON() {
    const payload = {
      title,
      idea,
      age,
      genre,
      length,
      imageUrl: imageUrl || null,
      story,
      createdAt: new Date().toISOString(),
      generatedBy: config.app.name,
      model: config.openrouter.model,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleListen = useCallback(async () => {
    if (ttsState === 'playing' && audioRef.current) {
      audioRef.current.pause()
      setTtsState('paused')
      return
    }
    if (ttsState === 'paused' && audioRef.current) {
      audioRef.current.play()
      setTtsState('playing')
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }

    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey || apiKey.startsWith('your_')) {
      setTtsError('ElevenLabs key not configured. Add your key to enable narration.')
      return
    }

    setTtsState('loading')
    setTtsError('')

    try {
      const res = await fetch(
        `${config.elevenlabs.baseUrl}/${VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: story,
            model_id: EL_MODEL,
            voice_settings: VOICE_SETTINGS,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail?.message || `ElevenLabs error ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => setTtsState('idle')
      audio.onerror = () => { setTtsState('idle'); setTtsError('Playback error.') }

      await audio.play()
      setTtsState('playing')
    } catch (err) {
      setTtsState('idle')
      setTtsError(err.message || 'Could not load audio.')
    }
  }, [ttsState, story])

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    setTtsState('idle')
    setTtsError('')
  }

  const listenLabel =
    ttsState === 'loading' ? '⏳ Loading...' :
    ttsState === 'playing' ? '⏸ Pause' :
    ttsState === 'paused'  ? '▶️ Resume' :
    '🔊 Listen'

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.meta}>
          {age && <span className={styles.badge}>🎂 {age}</span>}
          {genre && <span className={styles.badge}>{genre}</span>}
          {length && <span className={styles.badge}>📏 {length}</span>}
        </div>

        <div className={styles.storyCard} ref={printRef}>
          {imageUrl && (
            <div className={styles.coverWrap}>
              <img src={imageUrl} alt={title} className={styles.coverImg} />
            </div>
          )}
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

        {ttsError && <p className={styles.ttsError}>⚠️ {ttsError}</p>}

        <div className={styles.actions}>
          <button
            onClick={handleListen}
            className={`${styles.btnListen} ${ttsState === 'playing' ? styles.btnListenActive : ''}`}
            disabled={ttsState === 'loading'}
          >
            {listenLabel}
          </button>
          {(ttsState === 'playing' || ttsState === 'paused') && (
            <button onClick={handleStop} className={styles.btnSecondary}>⏹ Stop</button>
          )}
          <button onClick={handleSaveJSON} className={styles.btnSecondary}>
            📥 Save JSON
          </button>
          <button onClick={handleCopy} className={styles.btnSecondary}>
            📋 Copy
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
