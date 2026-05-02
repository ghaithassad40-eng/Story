import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Create.module.css'
import config from '../config.json'

const { ages: AGES, genres: GENRES, lengths: LENGTHS } = config.story

const LOADING_STAGES = [
  { emoji: '🧚', msg: 'Waking up the story fairies…' },
  { emoji: '✨', msg: 'Sprinkling magic dust…' },
  { emoji: '📖', msg: 'Writing your adventure…' },
  { emoji: '🎨', msg: 'Painting magical scenes…' },
  { emoji: '🌈', msg: 'Adding a rainbow ending…' },
  { emoji: '🌟', msg: 'Almost ready, hold tight!' },
]

async function generateImage(prompt, aspectRatio = config.lumen.aspectRatio) {
  const lumenKey = import.meta.env.VITE_LUMEN_API_KEY
  if (!lumenKey) return null

  try {
    const res = await fetch(config.lumen.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lumenKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now() + Math.random(),
        method: 'tools/call',
        params: {
          name: 'generate_image',
          arguments: {
            model_id: config.lumen.modelId,
            prompt,
            aspect_ratio: aspectRatio,
          },
        },
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const content = data?.result?.content
    if (!content?.length) return null

    const imgItem = content.find(c => c.type === 'image')
    if (imgItem?.url) return imgItem.url
    if (imgItem?.data) return `data:image/png;base64,${imgItem.data}`

    const textItem = content.find(c => c.type === 'text')
    if (textItem?.text) {
      const match = textItem.text.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp)(?:\?\S*)?/i)
        || textItem.text.match(/https?:\/\/\S+/i)
      if (match) return match[0]
    }
  } catch {
    // image generation is best-effort
  }
  return null
}

function extractSceneSummaries(storyText) {
  const paras = storyText.split('\n').map(p => p.trim()).filter(Boolean)
  const body = paras.slice(1) // skip title
  if (!body.length) return []

  // Pick 2 evenly spaced paragraphs for scene illustrations
  const scenes = []
  if (body.length >= 2) {
    const mid = Math.floor(body.length / 2)
    scenes.push(body[Math.min(1, body.length - 1)])    // early scene
    scenes.push(body[Math.min(mid + 1, body.length - 1)]) // mid scene
  } else if (body.length === 1) {
    scenes.push(body[0])
  }
  // Truncate each scene to first 120 chars for the prompt
  return scenes.map(s => s.slice(0, 120))
}

export default function Create() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || ''
  const [idea, setIdea] = useState(prefill)
  const [age, setAge] = useState(AGES[1])
  const [genre, setGenre] = useState('')
  const [length, setLength] = useState(LENGTHS[0].label)
  const [loading, setLoading] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  // Cycle loading messages while generating
  useEffect(() => {
    if (loading) {
      setStageIdx(0)
      intervalRef.current = setInterval(() => {
        setStageIdx(prev => (prev + 1) % LOADING_STAGES.length)
      }, 1900)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [loading])

  async function handleCreate(e) {
    e.preventDefault()
    if (!idea.trim()) return

    setLoading(true)
    setError('')

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) {
      setError('OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.')
      setLoading(false)
      return
    }

    const wordCount = LENGTHS.find(l => l.label === length)?.words ?? 150
    const prompt = `Write a fun, imaginative children's story for kids aged ${age}.
Genre: ${genre || 'any fun genre'}
Idea: ${idea}
Length: approximately ${wordCount} words.

Rules:
- Use simple, joyful language kids will love
- Add fun sound effects and expressions
- Give characters fun names
- End with a positive, happy message
- Format with a title on the first line, then paragraphs (no markdown headers, just plain paragraphs)`

    const genreText = genre ? genre.replace(/[^\w\s]/g, '').trim() + ' style, ' : ''
    const coverPrompt = `Colorful children's book cover illustration, ${genreText}${idea}. Cute friendly characters, vibrant colors, soft lighting, whimsical digital art for kids`

    try {
      // Generate story + cover image in parallel
      const [storyRes, coverUrl] = await Promise.all([
        fetch(config.openrouter.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': config.app.name,
          },
          body: JSON.stringify({
            model: config.openrouter.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: wordCount * 2,
            temperature: config.openrouter.temperature,
          }),
        }),
        generateImage(coverPrompt, '16:9'),
      ])

      if (!storyRes.ok) {
        const data = await storyRes.json().catch(() => ({}))
        throw new Error(data?.error?.message || `API error ${storyRes.status}`)
      }

      const data = await storyRes.json()
      const story = data.choices?.[0]?.message?.content || ''

      // Generate 2 scene illustrations based on story content
      const scenes = extractSceneSummaries(story)
      const sceneImages = await Promise.all(
        scenes.map(scene => {
          const scenePrompt = `Colorful children's book watercolor illustration, ${genreText}${scene}. Soft pastel colors, friendly cute characters, magical atmosphere, no text`
          return generateImage(scenePrompt, '4:3')
        })
      )

      navigate('/story', {
        state: { story, idea, age, genre, length, imageUrl: coverUrl, sceneImages },
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stage = LOADING_STAGES[stageIdx]

  return (
    <main className={styles.page}>
      {/* Fun Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingEmojis}>
              <span style={{ animationDelay: '0s' }}>✨</span>
              <span style={{ animationDelay: '0.25s' }}>📚</span>
              <span style={{ animationDelay: '0.5s' }}>🌟</span>
            </div>
            <div className={styles.loadingBigEmoji}>{stage.emoji}</div>
            <h2 className={styles.loadingTitle}>Creating Your Story</h2>
            <p className={styles.loadingMsg}>{stage.msg}</p>
            <div className={styles.progressDots}>
              {LOADING_STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === stageIdx ? styles.dotActive : i < stageIdx ? styles.dotDone : ''}`}
                />
              ))}
            </div>
            <p className={styles.loadingHint}>This may take 10–20 seconds ☕</p>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.emoji}>✨</div>
          <h1>Create Your Story</h1>
          <p>Tell us your idea and we'll write a magical story for you!</p>
        </div>

        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.field}>
            <label>🌟 Your Story Idea</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. A brave little dragon who is afraid of fire makes a new friend..."
              value={idea}
              onChange={e => setIdea(e.target.value)}
              rows={4}
              maxLength={300}
              required
            />
            <span className={styles.count}>{idea.length}/300</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>🎂 Age Group</label>
              <div className={styles.chips}>
                {AGES.map(a => (
                  <button
                    key={a}
                    type="button"
                    className={`${styles.chip} ${age === a ? styles.chipActive : ''}`}
                    onClick={() => setAge(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>📏 Story Length</label>
              <div className={styles.chips}>
                {LENGTHS.map(l => (
                  <button
                    key={l.label}
                    type="button"
                    className={`${styles.chip} ${length === l.label ? styles.chipActive : ''}`}
                    onClick={() => setLength(l.label)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label>🎭 Story Genre <span className={styles.optional}>(optional)</span></label>
            <div className={styles.chips}>
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.chip} ${genre === g ? styles.chipActive : ''}`}
                  onClick={() => setGenre(prev => prev === g ? '' : g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className={styles.submit} disabled={loading || !idea.trim()}>
            🚀 Create My Story!
          </button>
        </form>
      </div>
    </main>
  )
}
