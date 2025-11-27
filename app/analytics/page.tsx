'use client'

import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              📊 Analytics
            </h1>
          </div>
          <p className="text-zinc-400">Métricas e performance de conteúdo</p>
        </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-blue-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <Eye className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-zinc-400">Visualizações</span>
          </div>
          <p className="text-3xl font-bold text-white relative z-10 tabular-nums">0</p>
        </div>

        <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-green-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="absolute inset-0 bg-green-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <Users className="h-5 w-5 text-green-400" />
            <span className="text-sm text-zinc-400">Engajamento</span>
          </div>
          <p className="text-3xl font-bold text-white relative z-10 tabular-nums">0%</p>
        </div>

        <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-purple-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="absolute inset-0 bg-purple-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-zinc-400">Crescimento</span>
          </div>
          <p className="text-3xl font-bold text-white relative z-10 tabular-nums">+0%</p>
        </div>

        <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all group relative overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="absolute inset-0 bg-yellow-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <BarChart3 className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-zinc-400">ROI</span>
          </div>
          <p className="text-3xl font-bold text-white relative z-10 tabular-nums">--</p>
        </div>
      </div>

      <div className="glass border border-zinc-800/50 rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: "400ms" }}>
        <BarChart3 className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Em breve</h3>
        <p className="text-zinc-500">Métricas e analytics em desenvolvimento</p>
      </div>
      </div>
    </div>
  )
}
