import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import { Navbar } from '@/components/layout/navbar'
import { AuthProvider } from '@/providers/auth-provider'
import { ThemeProvider } from '@/providers/theme-provider'
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />

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
        </ThemeProvider>
      </body>
    </html>
  )
}
