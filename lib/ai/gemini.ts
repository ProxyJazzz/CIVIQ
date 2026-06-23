import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGeminiModel() {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY environment variable.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  })
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY environment variable.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'text-embedding-004',
  })

  const result = await model.embedContent(text)
  const embedding = result.embedding?.values

  if (!embedding || embedding.length === 0) {
    throw new Error('Failed to generate embedding: empty values returned')
  }

  return embedding
}
