'use server'

import { SchemaType } from '@google/generative-ai'
import { reportAnalysisSchema } from '@/schemas/report-schema'
import type { PipelineResult, ReportAnalysis } from '@/types/report'

import { getGeminiModel } from './gemini'

const fallbackAnalysis: ReportAnalysis = {
  category: 'Other',
  severity: 'Low',
  summary: 'Unable to confidently analyze the civic issue from the uploaded image.',
  confidence: 0,
  department: 'Other',
  tags: ['other'],
}

function buildPrompt(optionalDescription?: string) {
  return [
    'Analyze the uploaded image of a hyperlocal civic issue and determine:',
    '1. The most appropriate category.',
    '2. The severity of the issue.',
    '3. A concise, professional summary for operations teams.',
    '4. Your analysis confidence level (0.0 to 1.0).',
    '5. The municipal department best suited to handle this (e.g. Public Works, Sanitation, Water & Sewer, Traffic & Safety, Electricity).',
    '6. An array of relevant tags describing the issue (e.g. ["hazard", "pothole", "safety"]).',
    '',
    optionalDescription ? `User description context: ${optionalDescription}` : 'No user description context provided.',
  ].join('\n')
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

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildPrompt(optionalDescription) },
            {
              inlineData: {
                data: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            category: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['Pothole', 'Garbage', 'Water Leakage', 'Streetlight', 'Road Damage', 'Drainage', 'Other'],
            },
            severity: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['Low', 'Medium', 'High'],
            },
            confidence: {
              type: SchemaType.NUMBER,
              description: 'Confidence score from 0.0 to 1.0.',
            },
            summary: {
              type: SchemaType.STRING,
              description: 'Concise civic issue summary for operations teams.',
            },
            department: {
              type: SchemaType.STRING,
              description: 'Responsible municipal department.',
            },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: 'List of relevant keywords/tags.',
            },
          },
          required: ['category', 'severity', 'confidence', 'summary', 'department', 'tags'],
        },
      },
    })

    const text = response.response.text()
    if (!text) {
      return {
        success: true,
        data: fallbackAnalysis,
      }
    }

    const parsedJson: unknown = JSON.parse(text)
    const parsedAnalysis = reportAnalysisSchema.safeParse(parsedJson)

    if (!parsedAnalysis.success) {
      console.warn('Gemini response did not match Zod schema:', parsedAnalysis.error)
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
    console.error('AI analysis error:', error)
    return {
      success: false,
      error: {
        code: 'GEMINI_ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unable to analyze image with Gemini.',
      },
    }
  }
}
