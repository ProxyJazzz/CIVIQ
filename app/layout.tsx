import type { Metadata } from 'next'
import { Toaster } from 'sonner'

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
          <div className="flex min-h-screen flex-col">
            <header className="border-b bg-background">
              <div className="container flex h-16 items-center justify-between">
                <div className="text-lg font-semibold tracking-tight">CIVIQ</div>
                <nav aria-label="Primary navigation" className="text-sm text-muted-foreground">
                  Foundation
                </nav>
              </div>
            </header>

            <main className="flex-1">
              <div className="container py-10">{children}</div>
            </main>

            <footer className="border-t bg-background">
              <div className="container flex h-16 items-center justify-between text-sm text-muted-foreground">
                <span>CIVIQ</span>
                <span>Phase 1 foundation</span>
              </div>
            </footer>
          </div>

          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
