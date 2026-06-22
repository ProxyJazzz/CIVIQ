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
    <Button className="h-11 w-full" size="lg" onClick={handleSignIn} disabled={loading}>
      {loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
      Continue with Google
    </Button>
  )
}
