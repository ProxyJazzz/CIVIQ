'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

export function LogoutButton() {
  const router = useRouter()
  const { signOut, loading } = useAuth()

  async function handleLogout() {
    await signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      Logout
    </Button>
  )
}
