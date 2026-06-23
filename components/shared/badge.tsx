import { cn } from '@/lib/utils'

type Variant = 'default' | 'severity-low' | 'severity-medium' | 'severity-high' | 'status-pending' | 'status-in_progress' | 'status-resolved' | 'category'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-white/10 text-foreground/70',
  'severity-low': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  'severity-medium': 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  'severity-high': 'bg-red-500/15 text-red-300 border border-red-500/25',
  'status-pending': 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  'status-in_progress': 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  'status-resolved': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  category: 'bg-white/8 text-foreground/60 border border-white/10',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
