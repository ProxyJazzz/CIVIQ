'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExitIcon, PersonIcon } from '@radix-ui/react-icons'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/providers/auth-provider'

function getInitials(name?: string | null, email?: string | null) {
  const label = name || email || 'CIVIQ'
  return label
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Navbar() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const fullName = user?.user_metadata.full_name as string | undefined
  const avatarUrl = user?.user_metadata.avatar_url as string | undefined

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          CIVIQ
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={fullName || user.email || 'CIVIQ user'} />
                    <AvatarFallback>{getInitials(fullName, user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm md:inline">
                    {fullName || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <PersonIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <ExitIcon className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
