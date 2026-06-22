'use client'

import Image from 'next/image'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircledIcon, Cross2Icon, ImageIcon, ReloadIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { createReportAction } from '@/services/report-service'
import type { ReportActionState } from '@/types/report'

const initialState: ReportActionState = {
  status: 'idle',
}

const steps = ['Upload', 'Analyze', 'Submit']

export function ReportForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState(createReportAction, initialState)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const progress = useMemo(() => {
    if (pending) {
      return 68
    }

    if (state.status === 'success') {
      return 100
    }

    if (previewUrl) {
      return 28
    }

    return 0
  }, [pending, previewUrl, state.status])

  useEffect(() => {
    if (state.status === 'success') {
      toast.success('Report submitted', {
        description: state.message,
      })
      formRef.current?.reset()
      setPreviewUrl(null)
      setFileName(null)
    }

    if (state.status === 'error') {
      toast.error('Report failed', {
        description: state.message,
      })
    }
  }, [state])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      setPreviewUrl(null)
      setFileName(null)
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setFileName(file.name)
  }

  function clearImage() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileName(null)
  }

  return (
    <motion.form
      ref={formRef}
      action={formAction}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="grid gap-6 rounded-2xl border bg-card/90 p-5 shadow-xl shadow-black/5 backdrop-blur md:p-8"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Report an issue</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a photo and CIVIQ will classify the civic issue before submission.
            </p>
          </div>
          {state.status === 'success' ? <CheckCircledIcon className="h-7 w-7 text-emerald-500" /> : null}
        </div>

        <Progress value={progress} aria-label="Report submission progress" />
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          {steps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Large pothole near main gate" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what happened, nearby landmarks, and urgency."
              className="min-h-32 resize-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="latitude">Location latitude</Label>
              <Input id="latitude" name="latitude" type="number" step="any" placeholder="28.6139" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">Location longitude</Label>
              <Input id="longitude" name="longitude" type="number" step="any" placeholder="77.2090" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Block, street, area, city" required />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="image">Image upload</Label>
            <Input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              required
            />
          </div>

          <div className="relative overflow-hidden rounded-xl border bg-muted/40">
            {previewUrl ? (
              <>
                <div className="relative aspect-[4/3]">
                  <Image src={previewUrl} alt="Uploaded issue preview" fill className="object-cover" unoptimized />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-3"
                  onClick={clearImage}
                  aria-label="Remove image"
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </>
            ) : pending ? (
              <div className="space-y-3 p-4">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
                <p className="text-sm">Preview appears after image upload.</p>
              </div>
            )}
          </div>

          {fileName ? <p className="truncate text-xs text-muted-foreground">{fileName}</p> : null}
        </div>
      </div>

      {state.status === 'error' ? (
        <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="font-medium">Submission needs attention</div>
          <p className="mt-1">{state.message}</p>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <div className="font-medium">AI analysis complete</div>
          <p className="mt-1">Report ID: {state.reportId}</p>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {state.status === 'error' ? (
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
            Retry
          </Button>
        ) : null}
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
          {pending ? 'Analyzing...' : 'Submit report'}
        </Button>
      </div>
    </motion.form>
  )
}
