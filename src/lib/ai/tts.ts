import { genai } from './gemini'

const audioCache = new Map<string, string>()

export async function generateNarration(text: string): Promise<string | null> {
  const cacheKey = text.slice(0, 100)
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!

  try {
    const response = await genai().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Read this aloud as a narrator: ${text}` }] }],
    })

    const audio = response.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData?.mimeType?.startsWith('audio/')
    )?.inlineData

    if (audio?.data) {
      const dataUrl = `data:${audio.mimeType};base64,${audio.data}`
      audioCache.set(cacheKey, dataUrl)
      return dataUrl
    }
    return null
  } catch (error) {
    console.error('TTS generation error:', error)
    return null
  }
}
