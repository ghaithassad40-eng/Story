import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import styles from './Story.module.css'
import config from '../config.json'

const { voiceId: DEFAULT_VOICE_ID, modelId: EL_MODEL, voiceSettings: VOICE_SETTINGS } = config.elevenlabs

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: '🎀 Rachel — Soft & Warm' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: '🌟 Domi — Energetic' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: '🧚 Bella — Gentle' },
  { id: 'ErXwobaYiN019PkySvjV', name: '🧙 Antoni — Storyteller' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: '🦁 Adam — Bold' },
]

const REACTIONS = [
  { emoji: '❤️', label: 'Love it' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🌟', label: 'Amazing' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '😢', label: 'Touching' },
]

function getStoredReactions(title) {
  try { return JSON.parse(localStorage.getItem(`reactions_${title}`) || '{}') }
  catch { return {} }
}
function saveReactions(title, reactions) {
  localStorage.setItem(`reactions_${title}`, JSON.stringify(reactions))
}
function getLibrary() {
  try { return JSON.parse(localStorage.getItem('storyLibrary') || '[]') }
  catch { return [] }
}
function saveToLibrary(entry) {
  const lib = getLibrary()
  const exists = lib.findIndex(s => s.title === entry.title)
  if (exists !== -1) lib[exists] = entry
  else lib.unshift(entry)
  localStorage.setItem('storyLibrary', JSON.stringify(lib))
}

export default function Story() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const printRef = useRef()
  const audioRef = useRef(null)

  const [ttsState, setTtsState] = useState('idle')
  const [ttsError, setTtsError] = useState('')
  const [reactions, setReactions] = useState({})
  const [myReaction, setMyReaction] = useState(null)
  const [reactionBurst, setReactionBurst] = useState(null)

  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState(
    () => localStorage.getItem('preferredVoice') || DEFAULT_VOICE_ID
  )
  const [showVoicePanel, setShowVoicePanel] = useState(false)

  // Auto-read preference
  const [autoRead, setAutoRead] = useState(
    () => localStorage.getItem('autoRead') === 'true'
  )
  const [toast, setToast] = useState('')
  const autoReadFired = useRef(false)

  // Library save state
  const [savedToLib, setSavedToLib] = useState(false)

  // Storytelling ambient mode active when playing
  const isStorytelling = ttsState === 'playing'

  useEffect(() => {
    if (!state?.story) navigate('/')
  }, [state, navigate])

  useEffect(() => {
    if (state?.story) {
      const paragraphs = state.story.split('\n').map(p => p.trim()).filter(Boolean)
      setReactions(getStoredReactions(paragraphs[0]))
    }
  }, [state])

  // Auto-read trigger (fires once after mount)
  useEffect(() => {
    if (autoRead && state?.story && !autoReadFired.current) {
      autoReadFired.current = true
      setToast('🔊 Starting story narration…')
      const t = setTimeout(() => {
        setToast('')
      }, 2000)
      const t2 = setTimeout(() => {
        handleListenInternal()
      }, 2200)
      return () => { clearTimeout(t); clearTimeout(t2) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
  }, [])

  if (!state?.story) return null

  const { story, idea, age, genre, length, imageUrl, sceneImages = [] } = state
  const paragraphs = story.split('\n').map(p => p.trim()).filter(Boolean)
  const title = paragraphs[0]
  const body = paragraphs.slice(1)

  // Split body into groups for inline scene images
  const groupSize = Math.max(1, Math.ceil(body.length / 3))
  const groups = [
    body.slice(0, groupSize),
    body.slice(groupSize, groupSize * 2),
    body.slice(groupSize * 2),
  ].filter(g => g.length > 0)

  function showToast(msg, duration = 2500) {
    setToast(msg)
    setTimeout(() => setToast(''), duration)
  }

  function handleReact(emoji) {
    setReactions(prev => {
      const updated = { ...prev }
      if (myReaction === emoji) {
        updated[emoji] = Math.max(0, (updated[emoji] || 1) - 1)
        setMyReaction(null)
      } else {
        if (myReaction) updated[myReaction] = Math.max(0, (updated[myReaction] || 1) - 1)
        updated[emoji] = (updated[emoji] || 0) + 1
        setMyReaction(emoji)
        setReactionBurst(emoji)
        setTimeout(() => setReactionBurst(null), 600)
      }
      saveReactions(title, updated)
      return updated
    })
  }

  function handlePrint() { window.print() }
  function handleCopy() {
    navigator.clipboard.writeText(story)
    showToast('📋 Copied to clipboard!')
  }

  function handleSaveJSON() {
    const payload = {
      title, idea, age, genre, length,
      imageUrl: imageUrl || null,
      sceneImages,
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

  async function handleSavePDF() {
    showToast('📚 Generating PDF book…', 6000)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.height / canvas.width
      const imgH = pageW * ratio
      let yPos = 0
      let remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -yPos, pageW, imgH)
        remaining -= pageH
        yPos += pageH
        if (remaining > 0) pdf.addPage()
      }
      pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_book.pdf`)
      showToast('✅ PDF book saved!')
    } catch {
      showToast('⚠️ PDF export failed — try Print instead')
    }
  }

  function handleSaveLibrary() {
    saveToLibrary({
      title, idea, age, genre, length,
      imageUrl: imageUrl || null,
      sceneImages,
      story,
      savedAt: new Date().toISOString(),
    })
    setSavedToLib(true)
    showToast('💾 Saved to My Library!')
  }

  async function handleListenInternal() {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey || apiKey.startsWith('your_')) {
      setTtsError('ElevenLabs key not configured. Add your key to enable narration.')
      return
    }
    setTtsState('loading')
    setTtsError('')
    try {
      const voiceId = localStorage.getItem('preferredVoice') || DEFAULT_VOICE_ID
      const res = await fetch(`${config.elevenlabs.baseUrl}/${voiceId}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: story, model_id: EL_MODEL, voice_settings: VOICE_SETTINGS }),
      })
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
  }

  const handleListen = useCallback(async () => {
    if (ttsState === 'playing' && audioRef.current) {
      audioRef.current.pause(); setTtsState('paused'); return
    }
    if (ttsState === 'paused' && audioRef.current) {
      audioRef.current.play(); setTtsState('playing'); return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    await handleListenInternal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsState, story, selectedVoice])

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

  function handleVoiceChange(voiceId) {
    setSelectedVoice(voiceId)
    localStorage.setItem('preferredVoice', voiceId)
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
      setTtsState('idle')
    }
  }

  function toggleAutoRead() {
    const next = !autoRead
    setAutoRead(next)
    localStorage.setItem('autoRead', String(next))
  }

  const listenLabel =
    ttsState === 'loading' ? '⏳ Loading…' :
    ttsState === 'playing' ? '⏸ Pause' :
    ttsState === 'paused'  ? '▶️ Resume' : '🔊 Listen'

  return (
    <main className={`${styles.page} ${isStorytelling ? styles.storytellingMode : ''}`}>

      {/* Interactive ambient particles during storytelling */}
      {isStorytelling && (
        <div className={styles.ambientParticles} aria-hidden="true">
          {['🎵', '✨', '⭐', '🎶', '💫', '🌟', '🎵', '✨'].map((s, i) => (
            <span
              key={i}
              className={styles.ambientParticle}
              style={{
                left: `${8 + i * 11}%`,
                animationDelay: `${i * 0.65}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            >{s}</span>
          ))}
        </div>
      )}

      {/* Toast notification */}
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.container}>

        {/* Top bar: badges + auto-read toggle */}
        <div className={styles.topBar}>
          <div className={styles.meta}>
            {age && <span className={styles.badge}>🎂 {age}</span>}
            {genre && <span className={styles.badge}>{genre}</span>}
            {length && <span className={styles.badge}>📏 {length}</span>}
          </div>
          <label className={styles.autoReadToggle} title="Auto-read when story opens">
            <input type="checkbox" checked={autoRead} onChange={toggleAutoRead} />
            <span className={styles.toggleSlider} />
            <span className={styles.toggleLabel}>🔊 Auto-read</span>
          </label>
        </div>

        {/* Cover Hero Image */}
        {imageUrl && (
          <div className={styles.coverHero}>
            <img src={imageUrl} alt={title} className={styles.coverHeroImg} />
            <div className={styles.coverOverlay}>
              <h1 className={styles.coverTitle}>{title}</h1>
            </div>
          </div>
        )}

        {/* Story Card */}
        <div className={styles.storyCard} ref={printRef}>
          {!imageUrl && <div className={styles.decoration}>✨ 🌟 ✨</div>}
          {!imageUrl && <h1 className={styles.storyTitle}>{title}</h1>}
          <div className={styles.divider} />

          <div className={styles.storyBody}>
            {groups.map((group, gi) => (
              <div key={gi} className={styles.storyGroup}>
                {group.map((para, i) => (
                  <p
                    key={i}
                    className={`${styles.para} ${gi === 0 && i === 0 ? styles.paraFirst : ''}`}
                  >
                    {para}
                  </p>
                ))}
                {/* Scene illustration between groups */}
                {gi < groups.length - 1 && sceneImages[gi] && (
                  <div className={`${styles.sceneImageWrap} ${gi % 2 === 1 ? styles.sceneRight : styles.sceneLeft}`}>
                    <img
                      src={sceneImages[gi]}
                      alt={`Story scene ${gi + 1}`}
                      className={styles.sceneImage}
                      crossOrigin="anonymous"
                    />
                    <div className={styles.sceneCaption}>✨ Scene {gi + 1}</div>
                  </div>
                )}
                {/* Placeholder shimmer if scene was requested but failed */}
                {gi < groups.length - 1 && sceneImages[gi] === null && (
                  <div className={styles.sceneSkeleton} />
                )}
              </div>
            ))}
          </div>

          <div className={styles.decoration}>🎉 The End 🎉</div>
        </div>

        {/* Reactions */}
        <div className={styles.reactionsWrap}>
          <p className={styles.reactionsLabel}>How did you feel? 😊</p>
          <div className={styles.reactions}>
            {REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                className={`${styles.reactionBtn}
                  ${myReaction === emoji ? styles.reactionActive : ''}
                  ${reactionBurst === emoji ? styles.reactionBurst : ''}`}
                onClick={() => handleReact(emoji)}
                title={label}
              >
                <span className={styles.reactionEmoji}>{emoji}</span>
                {reactions[emoji] > 0 && (
                  <span className={styles.reactionCount}>{reactions[emoji]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Settings Panel */}
        <div className={styles.voicePanel}>
          <button
            className={styles.voicePanelToggle}
            onClick={() => setShowVoicePanel(v => !v)}
          >
            🎙️ Voice Settings {showVoicePanel ? '▲' : '▼'}
          </button>
          {showVoicePanel && (
            <div className={styles.voiceOptions}>
              <p className={styles.voiceLabel}>Choose narrator voice:</p>
              <div className={styles.voiceGrid}>
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    className={`${styles.voiceBtn} ${selectedVoice === v.id ? styles.voiceBtnActive : ''}`}
                    onClick={() => handleVoiceChange(v.id)}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {ttsError && <p className={styles.ttsError}>⚠️ {ttsError}</p>}

        {/* Sound wave visualiser when playing */}
        {isStorytelling && (
          <div className={styles.soundWave} aria-hidden="true">
            {[0, 1, 2, 3, 4, 3, 2, 1].map((_, i) => (
              <span key={i} className={styles.soundBar} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* Actions */}
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
          <button
            onClick={handleSaveLibrary}
            className={`${styles.btnSecondary} ${savedToLib ? styles.btnSaved : ''}`}
          >
            {savedToLib ? '✅ Saved!' : '💾 Save to Library'}
          </button>
          <button onClick={handleSavePDF} className={styles.btnBook}>📚 Save as PDF</button>
          <button onClick={handleSaveJSON} className={styles.btnSecondary}>📥 Save JSON</button>
          <button onClick={handleCopy} className={styles.btnSecondary}>📋 Copy</button>
          <button onClick={handlePrint} className={styles.btnSecondary}>🖨️ Print Book</button>
          <Link to="/create" className={styles.btnPrimary}>✨ New Story</Link>
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
