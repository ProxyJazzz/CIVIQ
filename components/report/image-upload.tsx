'use client'

import Image from 'next/image'
import { useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageIcon, X, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  previewUrl: string | null
  disabled?: boolean
  error?: string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

export function ImageUpload({ value, onChange, previewUrl, disabled, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return

      if (!ACCEPTED.includes(file.type)) return
      if (file.size > MAX_BYTES) return

      onChange(file)
    },
    [onChange],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (disabled) return
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleClear() {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id="image-upload-input"
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
        aria-label="Upload issue image"
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-white/10"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={previewUrl}
                alt="Issue preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* File info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="truncate text-xs text-white/80">{value?.name}</p>
            </div>

            {/* Remove button */}
            {!disabled && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                onClick={handleClear}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !disabled && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                inputRef.current?.click()
              }
            }}
            className={cn(
              'group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200',
              error
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200',
                error ? 'bg-red-500/10' : 'bg-blue-500/10 group-hover:bg-blue-500/20',
              )}
            >
              {error ? (
                <ImageIcon className="h-6 w-6 text-red-400" />
              ) : (
                <UploadCloud className="h-6 w-6 text-blue-400" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                {error ? 'Image required' : 'Drop your image here'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error ?? 'PNG, JPG or WebP · max 8 MB'}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-500/10 group-hover:text-blue-300">
              Browse files
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
