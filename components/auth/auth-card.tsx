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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full max-w-md rounded-2xl border border-white/20 bg-background/75 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-background/60"
    >
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">CIVIQ Identity</p>
        <h1 className="text-4xl font-semibold tracking-tight">Welcome to CIVIQ</h1>
        <p className="text-balance text-sm text-muted-foreground">
          AI-powered Hyperlocal Community Intelligence
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Authentication error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8">
        <GoogleSignInButton />
      </div>
    </motion.div>
  )
}
