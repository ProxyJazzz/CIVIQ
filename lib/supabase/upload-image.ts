'use server'

import { createClient } from '@/lib/supabase/server'
import type { PipelineResult } from '@/types/report'

const bucketName = 'report-images'
const maxImageSize = 8 * 1024 * 1024
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

function getFileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension) {
    return extension
  }

  return file.type.split('/')[1] ?? 'jpg'
}

function validateImage(file: File): Extract<PipelineResult<never>, { success: false }> | null {
  if (file.size === 0) {
    return {
      success: false,
      error: {
        code: 'EMPTY_IMAGE',
        message: 'Please upload an issue image.',
      },
    }
  }

  if (!acceptedImageTypes.includes(file.type)) {
    return {
      success: false,
      error: {
        code: 'INVALID_IMAGE_TYPE',
        message: 'Upload a JPG, PNG, or WebP image.',
      },
    }
  }

  if (file.size > maxImageSize) {
    return {
      success: false,
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: 'Image must be smaller than 8 MB.',
      },
    }
  }

  return null
}

export async function uploadImage(file: File): Promise<PipelineResult<string>> {
  const validationError = validateImage(file)

  if (validationError) {
    return validationError
  }

  try {
    const supabase = await createClient()
    const filename = `${crypto.randomUUID()}.${getFileExtension(file)}`
    const path = `${crypto.randomUUID()}/${filename}`

    const { error } = await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      return {
        success: false,
        error: {
          code: 'IMAGE_UPLOAD_FAILED',
          message: error.message,
        },
      }
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)

    return {
      success: true,
      data: data.publicUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'IMAGE_UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Unable to upload image.',
      },
    }
  }
}
