'use client'

import { useEffect } from 'react'
import { ShieldAlert, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Captured critical root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050608] text-white flex items-center justify-center font-sans antialiased">
        <div className="relative max-w-md w-full p-8 text-center bg-[#0B0E13]/90 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.02)_0%,transparent_70%)] pointer-events-none filter blur-3xl" />

          <div className="space-y-6 relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">Fatal Layout Crash</h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                A critical root layout exception has disabled the global container. The database or server session keys might be temporarily unreachable.
              </p>
              {error.digest && (
                <p className="text-[10px] font-mono text-muted-foreground/60 select-all">
                  Digest: {error.digest}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-center">
              <Button
                onClick={() => reset()}
                className="rounded-full bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-red-900/40 hover:scale-[1.01] active:scale-[0.99]"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset Application
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
