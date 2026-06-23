'use server'

import { reportAnalysisSchema } from '@/schemas/report-schema'
import type { PipelineResult, ReportAnalysis } from '@/types/report'

import { getGeminiModel } from './gemini'

const fallbackAnalysis: ReportAnalysis = {
  category: 'Other',
  severity: 'Low',
  summary: 'Unable to confidently analyze the civic issue from the uploaded image.',
  confidence: 0,
}

function buildPrompt(optionalDescription?: string) {
  return [
    'Analyze the uploaded image and determine:',
    '',
    '1. category',
    '',
    'Allowed values:',
    'Pothole',
    'Garbage',
    'Water Leakage',
    'Streetlight',
    'Road Damage',
    'Drainage',
    'Other',
    '',
    '2. severity',
    '',
    'Low',
    'Medium',
    'High',
    '',
    '3. summary',
    '',
    'Short professional description.',
    '',
    '4. confidence',
    '',
    '0 to 1.',
    '',
    optionalDescription ? `User description: ${optionalDescription}` : 'No user description provided.',
    '',
    'Return STRICT JSON ONLY.',
    'No markdown.',
    'No explanations.',
  ].join('\n')
}

function extractJson(text: string) {
  const trimmed = text.trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fencedMatch?.[1] ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return candidate.slice(start, end + 1)
}

async function imageUrlToInlineData(imageUrl: string) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Unable to fetch uploaded image for analysis (${response.status}).`)
  }

  const mimeType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  }
}

export async function analyzeImage(
  imageUrl: string,
  optionalDescription?: string
): Promise<PipelineResult<ReportAnalysis>> {
  try {
    const model = getGeminiModel()
    const imagePart = await imageUrlToInlineData(imageUrl)
    const response = await model.generateContent([buildPrompt(optionalDescription), imagePart])
    const text = response.response.text()
    const json = extractJson(text)

    if (!json) {
      return {
        success: true,
        data: fallbackAnalysis,
      }
    }

    const parsedJson: unknown = JSON.parse(json)
    const parsedAnalysis = reportAnalysisSchema.safeParse(parsedJson)

    if (!parsedAnalysis.success) {
      return {
        success: true,
        data: fallbackAnalysis,
      }
    }

    return {
      success: true,
      data: parsedAnalysis.data,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GEMINI_ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unable to analyze image with Gemini.',
      },
    }
  }
}
