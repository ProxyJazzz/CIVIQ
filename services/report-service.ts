'use server'

import { revalidatePath } from 'next/cache'

import { analyzeReportImage } from '@/services/gemini-service'
import { createClient } from '@/lib/supabase/server'
import { reportFormSchema, type ReportActionState } from '@/types/report'

const imageConstraints = {
  maxSize: 8 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

function getRequiredFile(formData: FormData) {
  const image = formData.get('image')

  if (!(image instanceof File) || image.size === 0) {
    throw new Error('Please upload an issue image.')
  }

  if (!imageConstraints.acceptedTypes.includes(image.type)) {
    throw new Error('Upload a JPG, PNG, or WebP image.')
  }

  if (image.size > imageConstraints.maxSize) {
    throw new Error('Image must be smaller than 8 MB.')
  }

  return image
}

export async function createReportAction(
  _previousState: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: 'error',
        message: 'Your session expired. Please sign in again.',
      }
    }

    const values = reportFormSchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      address: formData.get('address'),
    })
    const image = getRequiredFile(formData)
    const analysis = await analyzeReportImage(image, values.description)
    const extension = image.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage.from('report-images').upload(imagePath, image, {
      cacheControl: '3600',
      contentType: image.type,
      upsert: false,
    })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = supabase.storage.from('report-images').getPublicUrl(imagePath)
    const imageUrl = publicUrlData.publicUrl

    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        title: values.title,
        description: values.description,
        image_url: imageUrl,
        category: analysis.category,
        severity: analysis.severity,
        confidence: analysis.confidence,
        summary: analysis.summary,
        latitude: values.latitude,
        longitude: values.longitude,
        address: values.address,
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath('/report')

    return {
      status: 'success',
      message: 'Report submitted and analyzed successfully.',
      reportId: report.id,
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to submit report. Please try again.',
    }
  }
}
