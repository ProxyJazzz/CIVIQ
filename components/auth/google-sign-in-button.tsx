'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setLoading(false)
        toast.error('Google sign-in failed', {
          description: error.message,
        })
      }
    } catch (error) {
      setLoading(false)
      toast.error('Google sign-in failed', {
        description: error instanceof Error ? error.message : 'Unable to start Google sign-in.',
      })
    }
  }

  return (
    <Button 
      className="h-11 w-full rounded-xl bg-white text-black hover:bg-neutral-100 font-bold text-xs tracking-wide transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] shrink-0" 
      size="lg" 
      onClick={handleSignIn} 
      disabled={loading}
    >
      {loading ? (
        <ReloadIcon className="mr-2 h-3.5 w-3.5 animate-spin text-black" />
      ) : (
        <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85-.82-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  )
}
