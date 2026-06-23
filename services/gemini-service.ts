import { createGeminiClient } from '@/lib/gemini'
import { reportAnalysisSchema, type ReportAnalysis } from '@/types/report'

const responseSchema = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: ['Pothole', 'Garbage', 'Water Leakage', 'Streetlight', 'Road Damage', 'Drainage', 'Other'],
    },
    severity: {
      type: 'string',
      enum: ['Low', 'Medium', 'High'],
    },
    confidence: {
      type: 'number',
      description: 'Confidence score from 0 to 1.',
    },
    summary: {
      type: 'string',
      description: 'Concise civic issue summary for operations teams.',
    },
  },
  required: ['category', 'severity', 'confidence', 'summary'],
} as const

export async function analyzeReportImage(image: File, description: string): Promise<ReportAnalysis> {
  const client = createGeminiClient()
  const imageBuffer = Buffer.from(await image.arrayBuffer())

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Analyze this hyperlocal civic issue report image.',
              'Classify only one category and one severity.',
              'Use the provided description as context, but prioritize visible evidence in the image.',
              `Description: ${description}`,
            ].join('\n'),
          },
          {
            inlineData: {
              mimeType: image.type,
              data: imageBuffer.toString('base64'),
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  })

  const text = response.text

  if (!text) {
    throw new Error('Gemini returned an empty analysis response.')
  }

  return reportAnalysisSchema.parse(JSON.parse(text))
}
