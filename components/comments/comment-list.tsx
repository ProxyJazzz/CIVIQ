'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CommentWithAuthor } from '@/types/community'

interface CommentItemProps {
  comment: CommentWithAuthor
  currentUserId: string | null
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

function AvatarFallback({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[11px] font-bold text-white">
      {initials}
    </div>
  )
}

function CommentItem({ comment, currentUserId, onEdit, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwner = currentUserId === comment.user_id

  async function handleSave() {
    if (!editValue.trim() || editValue.trim() === comment.content) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onEdit(comment.id, editValue.trim())
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(comment.id)
    setDeleting(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex gap-3"
    >
      <AvatarFallback name={comment.author.full_name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author.full_name ?? 'User'}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-16 resize-none bg-white/5 text-sm"
              disabled={saving}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="h-7 gap-1 px-3 text-xs"
              >
                <Check className="h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditing(false); setEditValue(comment.content) }}
                className="h-7 gap-1 px-3 text-xs"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="group/comment relative">
            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
            {isOwner && (
              <div className="mt-1.5 flex gap-2 opacity-0 transition-opacity group-hover/comment:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={cn(
                    'flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-400',
                    deleting && 'opacity-50',
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface CommentListProps {
  comments: CommentWithAuthor[]
  currentUserId: string | null
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  isLoading?: boolean
}

export function CommentList({ comments, currentUserId, onEdit, onDelete, isLoading }: CommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No comments yet. Be the first to comment.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <AnimatePresence initial={false}>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
