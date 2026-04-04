import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const jsonModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})

export async function generateText(prompt: string): Promise<string> {
  const result = await textModel.generateContent(prompt)
  const response = result.response
  return response.text()
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await jsonModel.generateContent(prompt)
  const response = result.response
  return JSON.parse(response.text())
}
