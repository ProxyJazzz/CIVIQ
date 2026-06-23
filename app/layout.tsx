import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import { Navbar } from '@/components/layout/navbar'
import { AuthProvider } from '@/providers/auth-provider'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { RealtimeListener } from '@/components/notifications/realtime-listener'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CIVIQ',
    template: '%s | CIVIQ',
  },
  description: 'AI-powered Hyperlocal Community Intelligence Platform',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <AnnouncementBanner />
                <RealtimeListener userId={userId} />

                <main className="flex-1">
                  <div className="container py-10">{children}</div>
                </main>

                <footer className="border-t bg-background">
                  <div className="container flex h-16 items-center justify-between text-sm text-muted-foreground">
                    <span>CIVIQ</span>
                    <span>Identity layer</span>
                  </div>
                </footer>
              </div>

              <Toaster richColors position="bottom-right" />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}