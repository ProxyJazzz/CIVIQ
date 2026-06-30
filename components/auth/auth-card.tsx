'use client'

import { motion } from 'framer-motion'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AuthCardProps {
  error?: string
}

export function AuthCard({ error }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 w-full"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-black tracking-tight text-white">Sign in to your account</h1>
        <p className="text-[11px] text-muted-foreground leading-normal">
          Identify yourself to report civic issues and verify community reports.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400 p-3.5 rounded-xl">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold ml-1">Authentication Failed</AlertTitle>
          <AlertDescription className="text-[10px] leading-relaxed mt-1 ml-1">{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-5">
        <GoogleSignInButton />
        
        <div className="relative flex items-center justify-center py-1">
          <span className="absolute inset-x-0 h-[1px] bg-white/5" />
          <span className="relative bg-[#050608] px-3 text-[9px] uppercase font-bold text-muted-foreground tracking-widest z-10">
            Secure Verification
          </span>
        </div>

        <p className="text-[9px] text-center text-muted-foreground leading-normal max-w-[240px] mx-auto">
          By signing in, you agree to submit valid reports. Spam or falsified information may reduce your community trust score.
        </p>
      </div>
    </motion.div>
  )
}
