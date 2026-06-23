'use client'

import { useRef, useState } from 'react'
import { SendHorizonal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CommentBoxProps {
  userId: string | null
  onSubmit: (content: string) => Promise<void>
}

export function CommentBox({ userId, onSubmit }: CommentBoxProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    await onSubmit(content.trim())
    setContent('')
    setSubmitting(false)
    textareaRef.current?.focus()
  }

  if (!userId) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center text-sm text-muted-foreground">
        Sign in to leave a comment.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        ref={textareaRef}
        id="comment-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts or additional context…"
        className="min-h-20 resize-none bg-white/5 text-sm"
        disabled={submitting}
        maxLength={2000}
        aria-label="Write a comment"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            void handleSubmit(e)
          }
        }}
      />
      <div className="flex items-center justify-between">
        <span className={cn('text-xs text-muted-foreground', content.length > 1900 && 'text-amber-400')}>
          {content.length}/2000
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !content.trim()}
          className="gap-1.5"
        >
          <SendHorizonal className="h-3.5 w-3.5" />
          {submitting ? 'Posting…' : 'Post Comment'}
        </Button>
      </div>
    </form>
  )
}
