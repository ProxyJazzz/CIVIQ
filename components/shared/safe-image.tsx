'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, useEffect } from 'react'

export interface SafeImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string | null | undefined | any
  fallbackSrc?: string
}

const ALLOWED_HOSTS = [
  'images.unsplash.com',
  'localhost',
  '127.0.0.1',
]

function getSrcString(source: any): string {
  if (!source) return ''
  if (typeof source === 'string') return source
  if (typeof source === 'object' && source.src) return source.src
  return ''
}

function isHostAllowed(url: string): boolean {
  if (!url) return false
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return true
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    
    // Check exact allowed hosts list
    if (ALLOWED_HOSTS.includes(host)) return true
    
    // Check Supabase wildcard match (*.supabase.co / **.supabase.co)
    if (host.endsWith('.supabase.co')) return true

    return false
  } catch {
    // If it fails to parse but doesn't start with a slash, treat it as unconfigured to be safe
    return false
  }
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = '/placeholders/default-incident.svg',
  className,
  ...props
}: SafeImageProps) {
  const srcString = getSrcString(src)
  const isAllowed = isHostAllowed(srcString)
  const initialSrc = isAllowed && srcString ? srcString : fallbackSrc

  const [imgSrc, setImgSrc] = useState<string>(initialSrc)
  const [hasError, setHasError] = useState(!isAllowed || !srcString)

  // Synchronize state hook if src parameter changes
  useEffect(() => {
    const freshSrc = getSrcString(src)
    if (isHostAllowed(freshSrc) && freshSrc) {
      setImgSrc(freshSrc)
      setHasError(false)
    } else {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
  }, [src, fallbackSrc])

  function handleError() {
    if (!hasError) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Incident Image'}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}
