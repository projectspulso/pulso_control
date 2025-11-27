'use client'

import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-zinc-400">Métricas e performance de conteúdo</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-zinc-400">Visualizações</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="text-sm text-zinc-400">Engajamento</span>
          </div>
          <p className="text-3xl font-bold text-white">0%</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-zinc-400">Crescimento</span>
          </div>
          <p className="text-3xl font-bold text-white">+0%</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-zinc-400">ROI</span>
          </div>
          <p className="text-3xl font-bold text-white">--</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
        <BarChart3 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Em breve</h3>
        <p className="text-zinc-500">Métricas e analytics em desenvolvimento</p>
      </div>
      </div>
    </div>
  )
}
