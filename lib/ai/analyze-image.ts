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
  console.log(`[Gemini Vision] Fetching image from url: "${imageUrl}"`);
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Unable to fetch uploaded image for analysis. Server returned HTTP ${response.status}.`)
  }

  const mimeType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())

  console.log(`[Gemini Vision] Image fetched. Content-type="${mimeType}", size=${buffer.length} bytes`);

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
  console.log('[Gemini Vision] Server Action triggered.');
  console.log(`[Gemini Vision] Gemini started: imageUrl="${imageUrl}", context="${optionalDescription ?? ''}"`);

  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.error('[Gemini Vision] Error: Missing GOOGLE_API_KEY environment variable.');
      return {
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'Google Gemini API key is not configured in environment variables.',
        },
      }
    }

    const model = getGeminiModel()
    const imagePart = await imageUrlToInlineData(imageUrl)

    console.log('[Gemini Vision] Requesting content generation from Gemini Flash model...');
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
    console.log(`[Gemini Vision] Gemini finished. Raw response text: "${text || ''}"`);

    if (!text) {
      console.warn('[Gemini Vision] Warning: Empty text response received from model. Returning fallback analysis.');
      return {
        success: true,
        data: fallbackAnalysis,
      }
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(text)
    } catch (jsonErr) {
      console.error('[Gemini Vision] JSON Parse error on raw model output:', jsonErr);
      return {
        success: false,
        error: {
          code: 'JSON_PARSE_FAILED',
          message: 'Gemini returned invalid JSON content.',
        },
      }
    }

    const parsedAnalysis = reportAnalysisSchema.safeParse(parsedJson)
    if (!parsedAnalysis.success) {
      console.warn('[Gemini Vision] Warning: Parsed JSON did not match Zod schema rules:', parsedAnalysis.error.format());
      console.warn('[Gemini Vision] Returning fallback analysis.');
      return {
        success: true,
        data: fallbackAnalysis,
      }
    }

    console.log('[Gemini Vision] Response returned successfully. Structuring analysis.');
    return {
      success: true,
      data: parsedAnalysis.data,
    }
  } catch (error) {
    console.error('[Gemini Vision] Uncaught Exception occurred in AI analysis pipeline:', error);
    return {
      success: false,
      error: {
        code: 'GEMINI_ANALYSIS_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected exception occurred during AI image analysis.',
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
