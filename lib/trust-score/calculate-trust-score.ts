import type { TrustScore } from '@/types/community'

interface TrustScoreInput {
  verifications: number
  votes: number
  createdAt: string
}

/**
 * Trust Score = 0.5 × Verifications + 0.3 × Votes + 0.2 × Age Factor
 *
 * Age Factor: a report gains credibility over the first 30 days,
 * capped at 10 points (normalized to 0-10 range for consistent weighting).
 */
export function calculateTrustScore({ verifications, votes, createdAt }: TrustScoreInput): TrustScore {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  // Saturate after 30 days → max age factor = 10
  const ageFactor = Math.min(ageDays, 30) / 3

  const raw = 0.5 * verifications + 0.3 * votes + 0.2 * ageFactor
  const score = Math.round(raw * 10) / 10

  let label: TrustScore['label']

  if (score >= 10) {
    label = 'High Trust'
  } else if (score >= 3) {
    label = 'Medium Trust'
  } else {
    label = 'Low Trust'
  }

  return { score, label }
}
