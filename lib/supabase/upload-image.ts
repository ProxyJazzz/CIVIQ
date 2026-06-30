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
        message: 'Please upload a non-empty issue image.',
      },
    }
  }

  if (!acceptedImageTypes.includes(file.type)) {
    return {
      success: false,
      error: {
        code: 'INVALID_IMAGE_TYPE',
        message: `Upload a JPG, PNG, or WebP image. Received type: ${file.type}`,
      },
    }
  }

  if (file.size > maxImageSize) {
    return {
      success: false,
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: `Image must be smaller than 8 MB. Received size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      },
    }
  }

  return null
}

export async function uploadImage(formData: FormData): Promise<PipelineResult<string>> {
  console.log('[Upload Image] Server Action triggered.');

  try {
    const file = formData.get('file') as File | null
    if (!file) {
      console.error('[Upload Image] Error: No file parameter in FormData payload.');
      return {
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No file received in upload request.',
        },
      }
    }

    console.log(`[Upload Image] Image received: name="${file.name}", type="${file.type}", size=${file.size} bytes`);

    const validationError = validateImage(file)
    if (validationError) {
      console.warn(`[Upload Image] Validation failed: code="${validationError.error.code}", message="${validationError.error.message}"`);
      return validationError
    }

    const supabase = await createClient()
    console.log('[Upload Image] Fetching user session details...');
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Upload Image] Auth failed or session missing:', authError);
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED_UPLOAD',
          message: 'You must be signed in to upload issue images.',
        },
      }
    }

    const filename = `${crypto.randomUUID()}.${getFileExtension(file)}`
    const path = `${user.id}/${filename}`

    console.log(`[Upload Image] Upload started to bucket="${bucketName}", path="${path}"`);
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error('[Upload Image] Supabase storage upload failed:', uploadError);
      return {
        success: false,
        error: {
          code: 'STORAGE_UPLOAD_ERROR',
          message: `Storage service rejected upload: ${uploadError.message}`,
        },
      }
    }

    console.log('[Upload Image] Upload finished. Resolving public URL path...');
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)

    if (!data?.publicUrl) {
      console.error('[Upload Image] Error: publicUrl could not be retrieved from Supabase.');
      return {
        success: false,
        error: {
          code: 'PUBLIC_URL_RESOLVE_FAILED',
          message: 'Failed to retrieve public access URL for the uploaded image.',
        },
      }
    }

    console.log(`[Upload Image] Response returned: publicUrl="${data.publicUrl}"`);
    return {
      success: true,
      data: data.publicUrl,
    }
  } catch (error) {
    console.error('[Upload Image] Uncaught Exception occurred:', error);
    return {
      success: false,
      error: {
        code: 'UNCAUGHT_UPLOAD_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected exception occurred during file upload.',
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
