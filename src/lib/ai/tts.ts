import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const ttsModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const audioCache = new Map<string, string>()

export async function generateNarration(text: string): Promise<string | null> {
  const cacheKey = text.slice(0, 100)
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!

  try {
    const result = await ttsModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Read this aloud as a narrator: ${text}` }] }],
    })
    const response = result.response

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
    )

    if (audioPart?.inlineData) {
      const dataUrl = `data:${audioPart.inlineData.mimeType};base64,${audioPart.inlineData.data}`
      audioCache.set(cacheKey, dataUrl)
      return dataUrl
    }
    return null
  } catch (error) {
    console.error('TTS generation error:', error)
    return null
  }
}
