'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testConnection() {
      try {
        // Teste 1: Contar ideias
        const { data: ideias, error: ideiasError } = await supabase
          .from('ideias')
          .select('*', { count: 'exact' })
        
        if (ideiasError) throw ideiasError

        // Teste 2: Buscar canais
        const { data: canais, error: canaisError } = await supabase
          .from('canais')
          .select('*')
        
        if (canaisError) throw canaisError

        // Teste 3: Buscar séries
        const { data: series, error: seriesError } = await supabase
          .from('series')
          .select('*')
        
        if (seriesError) throw seriesError

        setData({
          ideias_count: ideias?.length || 0,
          ideias: ideias?.slice(0, 5),
          canais,
          series
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse-glow" />
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Testando Conexão Supabase...
            </h1>
          </div>
          <div className="glass rounded-2xl p-8 text-center">
            <div className="animate-pulse">Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-red-500">❌ Erro na Conexão</h1>
          <pre className="glass rounded-2xl p-6 text-red-400 overflow-auto">{error}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
          <h1 className="text-3xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
            ✅ Teste de Conexão Supabase
          </h1>
        </div>
        
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative">
              <h2 className="text-xl font-bold text-green-400 mb-2">
                Ideias: {data?.ideias_count}
              </h2>
              {data?.ideias_count === 0 && (
                <p className="text-yellow-400">⚠️ Nenhuma ideia encontrada! Execute o SQL no Supabase.</p>
              )}
              {data?.ideias_count > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-400 mb-2">Primeiras 5 ideias:</p>
                  <pre className="glass rounded-lg p-3 text-xs overflow-auto max-h-64">
                    {JSON.stringify(data.ideias, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative">
              <h2 className="text-xl font-bold text-blue-400 mb-2">
                Canais: {data?.canais?.length || 0}
              </h2>
              <pre className="glass rounded-lg p-3 text-xs overflow-auto">
                {JSON.stringify(data.canais, null, 2)}
              </pre>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative">
              <h2 className="text-xl font-bold text-purple-400 mb-2">
                Séries: {data?.series?.length || 0}
              </h2>
              <pre className="glass rounded-lg p-3 text-xs overflow-auto">
                {JSON.stringify(data.series, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/"
            className="inline-flex items-center gap-2 glass-hover px-6 py-3 rounded-lg text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-100 group-hover:opacity-80 transition-opacity" />
            <span className="relative">← Voltar ao Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  )
}
