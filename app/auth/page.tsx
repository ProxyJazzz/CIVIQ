import { AuthCard } from '@/components/auth/auth-card'

interface AuthPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams

  return (
    <section className="relative -mx-8 -my-10 flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-8 py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-secondary" />
      <div className="absolute inset-0 bg-background/45" />
      <div className="relative z-10 w-full">
        <AuthCard error={params.error} />
      </div>
    </section>
  )
}
