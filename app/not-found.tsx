'use client'

import Link from 'next/link'
import { MapPinOff, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center text-center p-6 bg-[#050608] text-white rounded-3xl border border-white/8 overflow-hidden my-4 shadow-2xl">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.03)_0%,transparent_70%)] pointer-events-none filter blur-3xl" />

      <div className="max-w-md space-y-6 relative z-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5 animate-pulse">
          <MapPinOff className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">404 — Out of Bounds</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            The coordinates you requested do not map to any active civic dispatch quadrant. The page may have been moved or resolved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 py-2.5 text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
        </div>
      </div>
    </div>
  )
}
