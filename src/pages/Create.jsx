import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Create.module.css'

const AGES = ['4-6 years', '7-9 years', '10-12 years']
const GENRES = ['Adventure 🗺️', 'Fantasy 🧙', 'Space 🚀', 'Animals 🦁', 'Friendship 💛', 'Mystery 🔍']
const LENGTHS = ['Short (1 min)', 'Medium (3 min)', 'Long (5 min)']

async function generateStoryImage(idea, genre) {
  const lumenKey = import.meta.env.VITE_LUMEN_API_KEY
  if (!lumenKey) return null

  const genreText = genre ? genre.replace(/[^\w\s]/g, '').trim() + ' style, ' : ''
  const imagePrompt = `Colorful children's book illustration, ${genreText}${idea}. Cute friendly characters, vibrant colors, soft lighting, whimsical digital art for kids`

  try {
    const res = await fetch('https://app.lumenpro.io/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lumenKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'generate_image',
          arguments: {
            model_id: 19,
            prompt: imagePrompt,
            aspect_ratio: '1:1',
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
    // image generation is best-effort; story still shows
  }
  return null
}

export default function Create() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || ''
  const [idea, setIdea] = useState(prefill)
  const [age, setAge] = useState(AGES[1])
  const [genre, setGenre] = useState('')
  const [length, setLength] = useState(LENGTHS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    const wordCount = length === LENGTHS[0] ? 150 : length === LENGTHS[1] ? 350 : 600
    const prompt = `Write a fun, imaginative children's story for kids aged ${age}.
Genre: ${genre || 'any fun genre'}
Idea: ${idea}
Length: approximately ${wordCount} words.

Rules:
- Use simple, joyful language kids will love
- Add fun sound effects and expressions
- Give characters fun names
- End with a positive, happy message
- Format with a title, then paragraphs (no markdown headers, just plain paragraphs)`

    try {
      const [storyRes, imageUrl] = await Promise.all([
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'StoryMagic Kids',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: wordCount * 2,
            temperature: 0.85,
          }),
        }),
        generateStoryImage(idea, genre),
      ])

      if (!storyRes.ok) {
        const data = await storyRes.json().catch(() => ({}))
        throw new Error(data?.error?.message || `API error ${storyRes.status}`)
      }

      const data = await storyRes.json()
      const story = data.choices?.[0]?.message?.content || ''

      navigate('/story', {
        state: { story, idea, age, genre, length, imageUrl },
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
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
                    key={l}
                    type="button"
                    className={`${styles.chip} ${length === l ? styles.chipActive : ''}`}
                    onClick={() => setLength(l)}
                  >
                    {l}
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
            {loading ? (
              <span className={styles.loadingInner}>
                <span className={styles.spinner} /> Writing your story...
              </span>
            ) : '🚀 Create My Story!'}
          </button>
        </form>
      </div>
    </main>
  )
}
