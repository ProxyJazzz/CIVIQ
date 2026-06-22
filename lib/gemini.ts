import { GoogleGenAI } from '@google/genai'

export function createGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY environment variable.')
  }

  return new GoogleGenAI({ apiKey })
}
