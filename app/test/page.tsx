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
        <h1 className="text-2xl font-bold mb-4">Testando Conexão Supabase...</h1>
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-zinc-950 text-white">
        <h1 className="text-2xl font-bold mb-4 text-red-500">❌ Erro na Conexão</h1>
        <pre className="bg-zinc-900 p-4 rounded text-red-400">{error}</pre>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-950 text-white">
      <h1 className="text-2xl font-bold mb-6">✅ Teste de Conexão Supabase</h1>
      
      <div className="space-y-6">
        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-green-400 mb-2">
            Ideias: {data?.ideias_count}
          </h2>
          {data?.ideias_count === 0 && (
            <p className="text-yellow-400">⚠️ Nenhuma ideia encontrada! Execute o SQL no Supabase.</p>
          )}
          {data?.ideias_count > 0 && (
            <div className="mt-4">
              <p className="text-sm text-zinc-400 mb-2">Primeiras 5 ideias:</p>
              <pre className="bg-zinc-800 p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(data.ideias, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-blue-400 mb-2">
            Canais: {data?.canais?.length || 0}
          </h2>
          <pre className="bg-zinc-800 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(data.canais, null, 2)}
          </pre>
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-purple-400 mb-2">
            Séries: {data?.series?.length || 0}
          </h2>
          <pre className="bg-zinc-800 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(data.series, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <a 
          href="/"
          className="inline-block bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded text-white"
        >
          ← Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
