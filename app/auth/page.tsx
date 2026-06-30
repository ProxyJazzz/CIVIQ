import { AuthCard } from '@/components/auth/auth-card'
import { Sparkles, Map, ShieldAlert } from 'lucide-react'

interface AuthPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams

  return (
    <section className="relative min-h-[calc(100vh-10rem)] w-full flex items-center justify-center p-0 md:p-6 overflow-hidden my-4">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.03)_0%,transparent_70%)] pointer-events-none filter blur-3xl" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-12 glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/8 min-h-[500px]">
        {/* Left Column - Product Branding */}
        <div className="hidden md:flex md:col-span-6 bg-[#0B0E13] p-10 flex-col justify-between relative border-r border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.03)_0%,transparent_80%)] pointer-events-none filter blur-2xl" />
          
          <div className="space-y-6 relative z-10">
            <div className="text-lg font-black text-white tracking-tighter">
              CIVIQ<span className="text-accent">.</span>
            </div>
            
            <div className="space-y-2 pt-8">
              <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                Empower your neighborhood. <br />
                Route city dispatches instantly.
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect directly with local municipal services. Report road damage, garbage hazards, electrical outages, and track solutions in real-time.
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {[
              { icon: <Sparkles className="h-4 w-4 text-accent" />, text: "AI categorization and image analysis reports" },
              { icon: <Map className="h-4 w-4 text-blue-400" />, text: "Local clustering and incident density mapping" },
              { icon: <ShieldAlert className="h-4 w-4 text-emerald-400" />, text: "Decentralized verification and scoring analytics" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-muted-foreground relative z-10">
            Secure enterprise civic operations console.
          </div>
        </div>

        {/* Right Column - Auth Card Container */}
        <div className="col-span-12 md:col-span-6 flex flex-col justify-center items-center p-8 md:p-10 bg-[#050608]/40 relative">
          <div className="w-full max-w-xs">
            <AuthCard error={params.error} />
          </div>
        </div>
      </div>
    </section>
  )
}
