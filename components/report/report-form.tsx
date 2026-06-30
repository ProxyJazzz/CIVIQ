'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { FileWarning, Loader2, ArrowRight, ArrowLeft, Image as ImageIcon, Sparkles, CheckCircle2, Clipboard } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AiPreviewCard } from '@/components/report/ai-preview-card'
import { ImageUpload } from '@/components/report/image-upload'
import { SubmitButton } from '@/components/report/submit-button'
import { useReport } from '@/hooks/use-report'
import { detectDuplicateReports, type DuplicateMatch } from '@/lib/reports/detect-duplicates'
import { reportFormInputSchema, reportCategories, reportSeverities } from '@/schemas/report-schema'
import { cn } from '@/lib/utils'
import type { ReportAnalysis, ReportFormInputValues } from '@/types/report'

// Dynamically import LocationPicker to prevent SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import('@/components/report/location-picker').then((mod) => mod.LocationPicker),
  { ssr: false }
)

interface ReportFormProps {
  userId: string
}

const WIZARD_STEPS = [
  { id: 1, label: 'Upload Photo' },
  { id: 2, label: 'AI Classification' },
  { id: 3, label: 'Fill Details' },
  { id: 4, label: 'Pin Location' },
  { id: 5, label: 'Final Review' },
]

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

  const [wizardStep, setWizardStep] = useState(1)
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
    trigger,
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

  const formValues = watch()

  const locationValue = {
    latitude: formValues.latitude ?? '',
    longitude: formValues.longitude ?? '',
    address: formValues.address ?? '',
  }

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)

  // Scan duplicates when coords or details change
  useEffect(() => {
    const lat = parseFloat(formValues.latitude)
    const lng = parseFloat(formValues.longitude)
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      !formValues.title ||
      formValues.title.length < 5 ||
      !formValues.description ||
      formValues.description.length < 15
    ) {
      setDuplicates([])
      return
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true)
      try {
        const matches = await detectDuplicateReports(
          formValues.title,
          formValues.description,
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
  }, [formValues.title, formValues.description, formValues.latitude, formValues.longitude])

  // Cleanup preview URL memory leaks
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
            
            // Advance to AI view step
            setWizardStep(2)
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

  // Step boundary transitions
  const handleNextStep = async () => {
    if (wizardStep === 1) {
      if (!localImageUrl) {
        setImageError('Please select a photo and wait for processing.')
        return
      }
      setWizardStep(2)
    } else if (wizardStep === 2) {
      setWizardStep(3)
    } else if (wizardStep === 3) {
      const isTitleValid = await trigger('title')
      const isDescValid = await trigger('description')
      if (isTitleValid && isDescValid) {
        setWizardStep(4)
      }
    } else if (wizardStep === 4) {
      const isLatValid = await trigger('latitude')
      const isLngValid = await trigger('longitude')
      const isAddrValid = await trigger('address')
      if (isLatValid && isLngValid && isAddrValid) {
        setWizardStep(5)
      }
    }
  }

  const handleBackStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1)
    }
  }

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
    setWizardStep(1)
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
        <h1 className="text-3xl font-black tracking-tight text-white">Report Civic Incident</h1>
        <p className="text-sm text-muted-foreground">
          Guided community reporting powered by Gemini Vision intelligence.
        </p>
      </div>

      {/* ─── Wizard Step Progress ─── */}
      <div className="flex items-center gap-1.5 p-1 glass-panel rounded-full overflow-x-auto scrollbar-none border border-white/5">
        {WIZARD_STEPS.map((step) => {
          const isActive = wizardStep === step.id
          const isCompleted = wizardStep > step.id
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300',
                isActive
                  ? 'bg-accent text-accent-foreground font-black shadow-lg shadow-accent/20'
                  : isCompleted
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-muted-foreground/40 hover:text-muted-foreground/75'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-white' : isCompleted ? 'bg-emerald-400' : 'bg-white/20')} />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
          )
        })}
      </div>

      {/* ─── Main Wizard Form ───────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main step container */}
          <div className="space-y-5">
            <AnimatePresence mode="wait">
              {/* STEP 1: UPLOAD PHOTO */}
              {wizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-accent" />
                    <h2 className="text-md font-extrabold uppercase tracking-wider text-white">Upload Incident Image</h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Provide a clear snapshot of the civic concern. CIVIQ AI works best with localized, high-resolution media.
                  </p>

                  <ImageUpload
                    value={imageFile}
                    onChange={handleImageChange}
                    previewUrl={previewUrl}
                    disabled={loading || uploading || analyzing || success}
                    error={imageError ?? undefined}
                  />

                  {uploading && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading image to secure storage...
                    </div>
                  )}
                  {analyzing && (
                    <div className="flex items-center gap-2 text-xs text-accent font-semibold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing content with Gemini Vision AI...
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: AI ANALYSIS PREVIEW */}
              {wizardStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                    <h2 className="text-md font-extrabold uppercase tracking-wider text-white">AI Classification Checkpoints</h2>
                  </div>

                  {/* Checklist style loader indicators */}
                  <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Image Uploaded Successfully
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Gemini Vision API Executed
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Category & Severity Resolved
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Operations Summary Formulated
                    </div>
                  </div>

                  {/* Editable AI Fields Block */}
                  <div className="space-y-4 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                      AI Generated Details (Confirm or Modify)
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="category" className="text-xs text-muted-foreground font-semibold">Category</Label>
                        <select
                          id="category"
                          disabled={loading || success}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                          {...register('category')}
                        >
                          {reportCategories.map((cat) => (
                            <option key={cat} value={cat} className="bg-[#0B0E13]">
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="severity" className="text-xs text-muted-foreground font-semibold">Severity</Label>
                        <select
                          id="severity"
                          disabled={loading || success}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
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

                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-xs text-muted-foreground font-semibold">Responsible Department</Label>
                      <Input id="department" disabled={loading || success} className="bg-white/5 rounded-xl" {...register('department')} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="summary" className="text-xs text-muted-foreground font-semibold">Operations Summary</Label>
                      <Textarea id="summary" disabled={loading || success} className="min-h-16 bg-white/5 rounded-xl resize-none" {...register('summary')} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tags" className="text-xs text-muted-foreground font-semibold">Keywords / Tags (comma-separated)</Label>
                      <Input id="tags" disabled={loading || success} className="bg-white/5 rounded-xl" {...register('tags')} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: INCIDENT DETAILS */}
              {wizardStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-accent" />
                    <h2 className="text-md font-extrabold uppercase tracking-wider text-white">Fill Incident Details</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className={cn('text-xs font-semibold', errors.title && 'text-red-400')}>Title</Label>
                      <Input
                        id="title"
                        placeholder="Large pothole near main gate"
                        disabled={loading || success}
                        className={cn('bg-white/5 rounded-xl', errors.title && 'border-red-500/50')}
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
                      <Label htmlFor="description" className={cn('text-xs font-semibold', errors.description && 'text-red-400')}>Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide details about the issue size, context, and immediate impact..."
                        disabled={loading || success}
                        className={cn('min-h-32 bg-white/5 rounded-2xl resize-none', errors.description && 'border-red-500/50')}
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
                </motion.div>
              )}

              {/* STEP 4: GEOLOCATION PIN LOCATION */}
              {wizardStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur space-y-4"
                >
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
                </motion.div>
              )}

              {/* STEP 5: FINAL REVIEW */}
              {wizardStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <h2 className="text-md font-extrabold uppercase tracking-wider text-white">Final Review & Confirmation</h2>
                  </div>

                  <div className="space-y-4 divide-y divide-white/5 text-sm">
                    {/* Image Preview inside review */}
                    {previewUrl && (
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 mb-2">
                        <Image src={previewUrl} alt="Review incident" fill className="object-cover" unoptimized />
                      </div>
                    )}

                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Title</p>
                      <p className="text-white font-bold mt-0.5">{formValues.title}</p>
                    </div>

                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Description</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed text-xs">{formValues.description}</p>
                    </div>

                    <div className="pt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Category</p>
                        <p className="text-white font-semibold mt-0.5">{formValues.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Severity</p>
                        <p className="text-white font-semibold mt-0.5">{formValues.severity}</p>
                      </div>
                    </div>

                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Assigned Department</p>
                      <p className="text-white font-semibold mt-0.5">{formValues.department || 'Other'}</p>
                    </div>

                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">AI Summary</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{formValues.summary}</p>
                    </div>

                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Pin Location</p>
                      <p className="text-white mt-0.5 text-xs">{formValues.address}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wizard Navigation Footer Button Panel */}
            <div className="flex justify-between items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackStep}
                disabled={wizardStep === 1 || loading || success}
                className="rounded-full text-xs gap-1.5 hover:bg-white/5 text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>

              {wizardStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading || success}
                  className="rounded-full text-xs gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <SubmitButton
                  loading={loading}
                  success={success}
                  disabled={loading || success}
                />
              )}
            </div>
          </div>

          {/* Right column sidebar */}
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

            {/* Submit helper links */}
            {success && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground self-start"
              >
                Submit another report
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  )
}
