'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FileWarning, Loader2, ArrowRight } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiPreviewCard } from '@/components/report/ai-preview-card'
import { ImageUpload } from '@/components/report/image-upload'
import { LocationPicker } from '@/components/report/location-picker'
import { SubmitButton } from '@/components/report/submit-button'
import { useReport } from '@/hooks/use-report'
import { detectDuplicateReports, type DuplicateMatch } from '@/lib/reports/detect-duplicates'
import { reportFormInputSchema, reportCategories, reportSeverities } from '@/schemas/report-schema'
import { cn } from '@/lib/utils'
import type { ReportAnalysis, ReportFormInputValues } from '@/types/report'

interface ReportFormProps {
  userId: string
}

const STEPS = ['Upload Image', 'Fill Details', 'AI Analysis', 'Submit']

export function ReportForm({ userId }: ReportFormProps) {
  const router = useRouter()
  const {
    loading,
    uploading,
    analyzing,
    error,
    success,
    report,
    uploadAndAnalyze,
    submitReport,
    reset,
  } = useReport()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null)
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null)
  const [localConfidence, setLocalConfidence] = useState<number>(1.0)
  const prevPreviewUrl = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<ReportFormInputValues>({
    resolver: zodResolver(reportFormInputSchema),
    defaultValues: {
      title: '',
      description: '',
      latitude: '',
      longitude: '',
      address: '',
      category: 'Other',
      severity: 'Low',
      department: '',
      summary: '',
      tags: '',
    },
  })

  const locationValue = {
    latitude: watch('latitude') ?? '',
    longitude: watch('longitude') ?? '',
    address: watch('address') ?? '',
  }

  const titleValue = watch('title')
  const descriptionValue = watch('description')

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)

  useEffect(() => {
    const lat = parseFloat(locationValue.latitude)
    const lng = parseFloat(locationValue.longitude)
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      !titleValue ||
      titleValue.length < 5 ||
      !descriptionValue ||
      descriptionValue.length < 15
    ) {
      setDuplicates([])
      return
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true)
      try {
        const matches = await detectDuplicateReports(
          titleValue,
          descriptionValue,
          lat,
          lng,
          0.7,
          150
        )
        setDuplicates(matches)
      } catch (err) {
        console.error('Error matching duplicates:', err)
      } finally {
        setCheckingDuplicates(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [titleValue, descriptionValue, locationValue.latitude, locationValue.longitude])

  // Step progress indicator
  const currentStep = (() => {
    if (success) return 3
    if (loading) return 2
    if (imageFile) return 1
    return 0
  })()

  // Revoke preview URL memory leaks
  useEffect(() => {
    const prev = prevPreviewUrl.current
    return () => {
      if (prev) URL.revokeObjectURL(prev)
    }
  }, [previewUrl])

  // Handles redirects and submission alerts
  useEffect(() => {
    if (success && report) {
      toast.success('Report submitted!', {
        description: `Report #${report.id.slice(0, 8)} is now pending review. Redirecting...`,
      })
      const timer = setTimeout(() => {
        router.push(`/report/${report.id}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [success, report, router])

  useEffect(() => {
    if (error) {
      toast.error('Pipeline error', { description: error })
    }
  }, [error])

  // Handle immediate image uploads & AI trigger on file selection
  const handleImageChange = useCallback(
    async (file: File | null) => {
      if (prevPreviewUrl.current) {
        URL.revokeObjectURL(prevPreviewUrl.current)
      }

      setImageFile(file)
      setImageError(null)
      setLocalImageUrl(null)
      setAnalysis(null)

      if (file) {
        const url = URL.createObjectURL(file)
        prevPreviewUrl.current = url
        setPreviewUrl(url)

        const analysisLoaderToast = toast.loading('Uploading and analyzing issue image...')

        try {
          const res = await uploadAndAnalyze(file)
          toast.dismiss(analysisLoaderToast)

          if (res) {
            setLocalImageUrl(res.imageUrl)
            setLocalConfidence(res.analysis.confidence)
            setAnalysis(res.analysis)

            // Populate form values dynamically for user editing
            setValue('category', res.analysis.category)
            setValue('severity', res.analysis.severity)
            setValue('department', res.analysis.department)
            setValue('summary', res.analysis.summary)
            setValue('tags', res.analysis.tags.join(', '))
            toast.success('AI classification complete!')
          }
        } catch (err) {
          toast.dismiss(analysisLoaderToast)
          toast.error('AI pipeline failed to analyze image.')
        }
      } else {
        prevPreviewUrl.current = null
        setPreviewUrl(null)
      }
    },
    [uploadAndAnalyze, setValue],
  )

  const handleLocationChange = useCallback(
    (loc: { latitude: string; longitude: string; address: string }) => {
      setValue('latitude', loc.latitude, { shouldValidate: true })
      setValue('longitude', loc.longitude, { shouldValidate: true })
      setValue('address', loc.address, { shouldValidate: true })
    },
    [setValue],
  )

  const onSubmit = useCallback(
    async (values: ReportFormInputValues): Promise<void> => {
      if (!localImageUrl) {
        setImageError('Please upload and wait for the image to be processed.')
        return
      }

      const tagsArray = values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      await submitReport({
        title: values.title,
        description: values.description,
        imageUrl: localImageUrl,
        category: (values.category as any) || 'Other',
        severity: (values.severity as any) || 'Low',
        summary: values.summary || '',
        confidence: localConfidence,
        department: values.department || 'Other',
        tags: tagsArray,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
        address: values.address,
        userId,
      })
    },
    [localImageUrl, localConfidence, submitReport, userId],
  )

  function handleReset() {
    reset()
    resetForm()
    setImageFile(null)
    setPreviewUrl(null)
    setImageError(null)
    setAnalysis(null)
    setLocalImageUrl(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Report Community Issue</h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo — Gemini Vision will classify, summary, and route the issue.
        </p>
      </div>

      {/* ─── Progress Steps ─────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  i <= currentStep
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-white/10 text-muted-foreground',
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-[10px] transition-colors sm:block',
                  i <= currentStep ? 'text-blue-400' : 'text-muted-foreground/50',
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-4 h-px flex-1 transition-colors duration-500',
                  i < currentStep ? 'bg-blue-600/60' : 'bg-white/10',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ─── Main Form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-5">
            {/* Image Upload Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Issue Photo
              </p>
              <ImageUpload
                value={imageFile}
                onChange={handleImageChange}
                previewUrl={previewUrl}
                disabled={loading || uploading || analyzing || success}
                error={imageError ?? undefined}
              />
              {uploading && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading image to Supabase Storage...
                </div>
              )}
              {analyzing && (
                <div className="mt-3 flex items-center gap-2 text-xs text-accent">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing image with Gemini Vision AI...
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Issue Details
              </p>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className={cn('text-sm', errors.title && 'text-red-400')}>
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Large pothole near main gate"
                    disabled={loading || success}
                    aria-invalid={!!errors.title}
                    className={cn(
                      'bg-white/5',
                      errors.title && 'border-red-500/50 focus-visible:ring-red-500/30',
                    )}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="flex items-center gap-1 text-xs text-red-400">
                      <FileWarning className="h-3 w-3" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="description"
                    className={cn('text-sm', errors.description && 'text-red-400')}
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened, nearby landmarks, and urgency."
                    className={cn(
                      'min-h-28 resize-none bg-white/5',
                      errors.description && 'border-red-500/50 focus-visible:ring-red-500/30',
                    )}
                    disabled={loading || success}
                    aria-invalid={!!errors.description}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="flex items-center gap-1 text-xs text-red-400">
                      <FileWarning className="h-3 w-3" />
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Editable Classifications (Only displays when analysis is present) */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                  AI Classification Review & Corrections
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs text-muted-foreground font-semibold">
                      Category
                    </Label>
                    <select
                      id="category"
                      disabled={loading || success}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      {...register('category')}
                    >
                      {reportCategories.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#0B0E13]">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-1.5">
                    <Label htmlFor="severity" className="text-xs text-muted-foreground font-semibold">
                      Severity
                    </Label>
                    <select
                      id="severity"
                      disabled={loading || success}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      {...register('severity')}
                    >
                      {reportSeverities.map((sev) => (
                        <option key={sev} value={sev} className="bg-[#0B0E13]">
                          {sev}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-xs text-muted-foreground font-semibold">
                    Responsible Department
                  </Label>
                  <Input
                    id="department"
                    placeholder="e.g. Public Works"
                    disabled={loading || success}
                    className="bg-white/5"
                    {...register('department')}
                  />
                </div>

                {/* AI Summary */}
                <div className="space-y-1.5">
                  <Label htmlFor="summary" className="text-xs text-muted-foreground font-semibold">
                    Operations Summary
                  </Label>
                  <Textarea
                    id="summary"
                    placeholder="Concise summary of the issue."
                    disabled={loading || success}
                    className="min-h-16 bg-white/5 resize-none"
                    {...register('summary')}
                  />
                </div>

                {/* Keywords / Tags */}
                <div className="space-y-1.5">
                  <Label htmlFor="tags" className="text-xs text-muted-foreground font-semibold">
                    Keywords (comma-separated)
                  </Label>
                  <Input
                    id="tags"
                    placeholder="pothole, hazard, safety"
                    disabled={loading || success}
                    className="bg-white/5"
                    {...register('tags')}
                  />
                </div>
              </motion.div>
            )}

            {/* Location Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <LocationPicker
                value={locationValue}
                onChange={handleLocationChange}
                errors={{
                  latitude: errors.latitude?.message,
                  longitude: errors.longitude?.message,
                  address: errors.address?.message,
                }}
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <AiPreviewCard analysis={analysis} loading={analyzing} />

            {/* Duplicates scan loader */}
            {checkingDuplicates && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                Scanning for duplicate reports nearby...
              </div>
            )}

            {/* Duplicates warning panel */}
            {!checkingDuplicates && duplicates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                  <FileWarning className="h-4 w-4 shrink-0" />
                  Potential Duplicates Detected
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Our system detected {duplicates.length} similar issue(s) reported within 150m of your coordinates. Please review them:
                </p>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto space-y-2">
                  {duplicates.map((dup) => (
                    <div key={dup.id} className="pt-2 text-xs">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {dup.title}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold shrink-0">
                          {Math.round(dup.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{dup.address}</p>
                      <a
                        href={`/report/${dup.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline mt-1.5 inline-flex items-center gap-0.5"
                      >
                        View Report <ArrowRight className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Success card */}
            {success && report && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
              >
                <p className="text-sm font-semibold text-emerald-400">Report submitted!</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ID:{' '}
                  <span className="font-mono text-emerald-300/80">{report.id.slice(0, 16)}…</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Status: pending review</p>
              </motion.div>
            )}

            {/* Error card */}
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
              >
                <p className="text-sm font-semibold text-red-400">Submission failed</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Submit Row ─────────────────────────────────────── */}
        <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          {success && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Submit another report
            </button>
          )}

          <SubmitButton
            loading={loading}
            success={success}
            disabled={loading || uploading || analyzing || success}
          />
        </div>
      </form>
    </motion.div>
  )
}
