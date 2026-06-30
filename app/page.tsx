'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { ArrowRight, Zap, Cpu, MapPin, CheckCircle, Users } from "lucide-react"
import { getLandingStats, type LandingStats } from "@/lib/analytics/landing-stats"

export default function Home() {
  const [stats, setStats] = useState<LandingStats | null>(null)

  useEffect(() => {
    getLandingStats().then(setStats)
  }, [])
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <div className="relative min-h-screen bg-[#050608] text-white overflow-hidden pb-16">
      {/* ── Background Aesthetics ── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.08)_0%,transparent_70%)] pointer-events-none filter blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none filter blur-3xl" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10 pt-20 md:pt-32">
        {/* ── HERO SECTION ── */}
        <motion.div 
          className="text-center max-w-3xl mx-auto space-y-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold uppercase tracking-wider">
            <Zap className="h-3 w-3 fill-accent" />
            V2 PRODUCTION RELEASE
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Hyperlocal intelligence <br />
            <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
              powered by community.
            </span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            CIVIQ matches citizen reports with multi-modal AI categorization and live GIS mapping to solve community infrastructure needs in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/feed"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 transition-all duration-200 shadow-lg shadow-accent/25 hover:scale-[1.02]"
            >
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-semibold px-6 py-3 transition-all duration-200"
            >
              Interactive Map
            </Link>
          </div>
        </motion.div>

        {/* ── STATS METRICS SECTION ── */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20 md:mt-28"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { value: stats ? `${stats.totalReports} Reports` : "…", label: "Total Reports", desc: "Submitted by community" },
            { value: stats ? stats.accuracyRate : "…", label: "Accuracy Rate", desc: "Gemini AI visual parsing" },
            { value: stats ? stats.avgResolutionTime : "…", label: "Avg Resolution", desc: "Municipal ops pipeline" },
            { value: stats ? `${stats.activeCitizens} Citizens` : "…", label: "Active Citizens", desc: "Registered community profiles" }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors"
              variants={itemVariants}
            >
              <div className="text-2xl md:text-3xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-accent mt-1">{stat.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{stat.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── KEY CAPABILITIES (Interactive Features) ── */}
        <div className="mt-32 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Core Engine Features</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Startup-grade GIS & AI Infrastructure</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Cpu className="h-6 w-6 text-accent" />,
                title: "Computer Vision Tagging",
                desc: "Upload reports to prompt Gemini AI multi-modal models. CIVIQ instantly yields categorizations, severity weights, and tags."
              },
              {
                icon: <MapPin className="h-6 w-6 text-blue-500" />,
                title: "GIS Cluster Hotspots",
                desc: "Uses DBSCAN algorithms on Mapbox. Identifies localized clusters of reports to generate real-time pulsing alerts."
              },
              {
                icon: <Users className="h-6 w-6 text-emerald-400" />,
                title: "Decentralized Verification",
                desc: "Citizens verify details in real-time. Leaderboard ranks gamify user trust metrics for municipalities."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/8 hover:border-white/15 transition-all hover:translate-y-[-4px] duration-300">
                <div className="p-3 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ARCHITECTURE SYSTEM FLOW ── */}
        <div className="mt-32 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">System Architecture</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How Hyperlocal Incidents Are Resolved</p>
          </div>

          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative overflow-hidden">
            {[
              { step: "01", title: "Incident File", desc: "Citizen uploads photos & coordinates" },
              { step: "02", title: "AI Extraction", desc: "Gemini visual analyzer populates categories" },
              { step: "03", title: "Realtime PubSub", desc: "Updates push instantly across map layers" },
              { step: "04", title: "Resolution Portal", desc: "Admin logs dispatches and solutions" }
            ].map((item, i, arr) => (
              <div key={i} className="flex flex-col md:flex-1 text-center md:text-left space-y-2 relative z-10">
                <div className="text-2xl font-black text-accent">{item.step}</div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground max-w-44 leading-normal">{item.desc}</p>
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute right-4 top-4 text-white/10 text-lg font-black">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── ROADMAP SECTION ── */}
        <div className="mt-32 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Project Roadmap</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform Milestones</p>
          </div>

          <div className="max-w-xl mx-auto relative border-l-2 border-white/10 pl-6 space-y-8">
            {[
              { phase: "Phase 1: Real-time Core", desc: "Implement user authentication, verification triggers, and notifications.", done: true },
              { phase: "Phase 2: AI Classification", desc: "Multi-modal model analysis to verify categories and department mapping.", done: true },
              { phase: "Phase 3: Hotspot Map", desc: "Implement DBSCAN algorithm for automatic incident clustering.", done: true },
              { phase: "Phase 4: Municipal Control Desk", desc: "Develop advanced dashboard queues for routing dispatches.", done: true }
            ].map((node, i) => (
              <div key={i} className="relative">
                <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ${node.done ? 'bg-accent' : 'bg-neutral-800'} border-2 border-background`}>
                  {node.done && <CheckCircle className="h-3 w-3 text-accent-foreground" />}
                </span>
                <h4 className="text-sm font-bold text-white">{node.phase}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MINIMAL FOOTER ── */}
        <div className="border-t border-white/5 mt-32 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} CIVIQ. Intelligent City Operations.</div>
          <div className="flex gap-4">
            <Link href="/feed" className="hover:text-white transition-colors">Launch</Link>
            <Link href="/map" className="hover:text-white transition-colors">Map</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Trust Board</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
