'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'loading'
  data?: any
  error?: any
  timing?: number
}

export default function TestePage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (name: string, result: Partial<TestResult>) => {
    setResults(prev => {
      const index = prev.findIndex(r => r.name === name)
      if (index >= 0) {
        const newResults = [...prev]
        newResults[index] = { ...newResults[index], ...result }
        return newResults
      }
      return [...prev, { name, status: 'loading', ...result } as TestResult]
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    console.clear()
    console.log('🧪 INICIANDO TESTES DE CONEXÃO SUPABASE')
    console.log('=======================================\n')

    // Teste 0: Fetch direto (HTTP puro)
    console.log('🌐 Teste 0: Fetch direto (HTTP puro) - canais')
    updateResult('fetch-direto', { status: 'loading' })
    const start0 = Date.now()
    try {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const response = await fetch(
        'https://nlcisbfdiokmipyihtuz.supabase.co/rest/v1/canais?select=*&limit=1',
        {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
          }
        }
      )
      
      const timing0 = Date.now() - start0
      const responseText = await response.text()
      
      console.log('📡 Status:', response.status)
      console.log('📋 Status Text:', response.statusText)
      console.log('📨 Headers:', [...response.headers.entries()])
      console.log('📦 Body:', responseText)
      console.log('⏱️ Tempo:', timing0, 'ms\n')
      
      let parsedData
      try {
        parsedData = JSON.parse(responseText)
      } catch {
        parsedData = responseText
      }
      
      if (response.ok) {
        updateResult('fetch-direto', { 
          status: 'success', 
          data: { 
            status: response.status, 
            headers: Object.fromEntries(response.headers.entries()),
            body: parsedData 
          }, 
          timing: timing0 
        })
      } else {
        updateResult('fetch-direto', { 
          status: 'error', 
          error: { 
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: parsedData 
          }, 
          timing: timing0 
        })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em fetch direto:', err)
      updateResult('fetch-direto', { status: 'error', error: err, timing: Date.now() - start0 })
    }

    // Teste 1: Canais
    console.log('📊 Teste 1: Buscar canais (view public.canais)')
    updateResult('canais', { status: 'loading' })
    const start1 = Date.now()
    try {
      const { data, error, status, statusText } = await supabase
        .from('canais')
        .select('*')
      
      const timing1 = Date.now() - start1
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText })
      console.log('⏱️ Tempo:', timing1, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em canais:', error)
        updateResult('canais', { status: 'error', error, timing: timing1 })
      } else {
        console.log(`✅ ${data?.length || 0} canais carregados`)
        updateResult('canais', { status: 'success', data, timing: timing1 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em canais:', err)
      updateResult('canais', { status: 'error', error: err, timing: Date.now() - start1 })
    }

    // Teste 2: Ideias
    console.log('\n📊 Teste 2: Buscar ideias (view public.ideias)')
    updateResult('ideias', { status: 'loading' })
    const start2 = Date.now()
    try {
      const { data, error, status, statusText, count } = await supabase
        .from('ideias')
        .select('*', { count: 'exact' })
        .limit(5)
      
      const timing2 = Date.now() - start2
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText, count })
      console.log('⏱️ Tempo:', timing2, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em ideias:', error)
        updateResult('ideias', { status: 'error', error, timing: timing2 })
      } else {
        console.log(`✅ ${data?.length || 0} ideias carregadas (total: ${count})`)
        updateResult('ideias', { status: 'success', data, timing: timing2 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em ideias:', err)
      updateResult('ideias', { status: 'error', error: err, timing: Date.now() - start2 })
    }

    // Teste 3: Series
    console.log('\n📊 Teste 3: Buscar series (view public.series)')
    updateResult('series', { status: 'loading' })
    const start3 = Date.now()
    try {
      const { data, error, status, statusText } = await supabase
        .from('series')
        .select('*')
      
      const timing3 = Date.now() - start3
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText })
      console.log('⏱️ Tempo:', timing3, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em series:', error)
        updateResult('series', { status: 'error', error, timing: timing3 })
      } else {
        console.log(`✅ ${data?.length || 0} series carregadas`)
        updateResult('series', { status: 'success', data, timing: timing3 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em series:', err)
      updateResult('series', { status: 'error', error: err, timing: Date.now() - start3 })
    }

    // Teste 4: Roteiros
    console.log('\n📊 Teste 4: Buscar roteiros (view public.roteiros)')
    updateResult('roteiros', { status: 'loading' })
    const start4 = Date.now()
    try {
      const { data, error, status, statusText } = await supabase
        .from('roteiros')
        .select('*')
        .limit(5)
      
      const timing4 = Date.now() - start4
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText })
      console.log('⏱️ Tempo:', timing4, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em roteiros:', error)
        updateResult('roteiros', { status: 'error', error, timing: timing4 })
      } else {
        console.log(`✅ ${data?.length || 0} roteiros carregados`)
        updateResult('roteiros', { status: 'success', data, timing: timing4 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em roteiros:', err)
      updateResult('roteiros', { status: 'error', error: err, timing: Date.now() - start4 })
    }

    // Teste 5: Pipeline
    console.log('\n📊 Teste 5: Buscar pipeline_producao (view public.pipeline_producao)')
    updateResult('pipeline', { status: 'loading' })
    const start5 = Date.now()
    try {
      const { data, error, status, statusText } = await supabase
        .from('pipeline_producao')
        .select('*')
        .limit(5)
      
      const timing5 = Date.now() - start5
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText })
      console.log('⏱️ Tempo:', timing5, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em pipeline:', error)
        updateResult('pipeline', { status: 'error', error, timing: timing5 })
      } else {
        console.log(`✅ ${data?.length || 0} itens no pipeline`)
        updateResult('pipeline', { status: 'success', data, timing: timing5 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em pipeline:', err)
      updateResult('pipeline', { status: 'error', error: err, timing: Date.now() - start5 })
    }

    // Teste 6: Calendário
    console.log('\n📊 Teste 6: Buscar vw_pulso_calendario_publicacao_v2')
    updateResult('calendario', { status: 'loading' })
    const start6 = Date.now()
    try {
      const { data, error, status, statusText } = await supabase
        .from('vw_pulso_calendario_publicacao_v2')
        .select('*')
        .limit(5)
      
      const timing6 = Date.now() - start6
      
      console.log('✅ Status HTTP:', status)
      console.log('📦 Resposta:', { data, error, statusText })
      console.log('⏱️ Tempo:', timing6, 'ms\n')
      
      if (error) {
        console.error('❌ ERRO em calendario:', error)
        updateResult('calendario', { status: 'error', error, timing: timing6 })
      } else {
        console.log(`✅ ${data?.length || 0} itens no calendário`)
        updateResult('calendario', { status: 'success', data, timing: timing6 })
      }
    } catch (err) {
      console.error('💥 EXCEÇÃO em calendario:', err)
      updateResult('calendario', { status: 'error', error: err, timing: Date.now() - start6 })
    }

    console.log('\n=======================================')
    console.log('🏁 TESTES FINALIZADOS')
    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 Página de Testes - Supabase</h1>
          <p className="text-gray-400">
            Abra o Console do navegador (F12) para ver logs detalhados
          </p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              <strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...
            </p>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          {isRunning ? '⏳ Rodando testes...' : '🔄 Rodar testes novamente'}
        </button>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                result.status === 'success'
                  ? 'bg-green-900/20 border-green-600'
                  : result.status === 'error'
                  ? 'bg-red-900/20 border-red-600'
                  : 'bg-yellow-900/20 border-yellow-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">
                  {result.status === 'success' && '✅'}
                  {result.status === 'error' && '❌'}
                  {result.status === 'loading' && '⏳'}
                  {' '}
                  {result.name}
                </h3>
                {result.timing && (
                  <span className="text-sm text-gray-400">{result.timing}ms</span>
                )}
              </div>

              {result.status === 'success' && result.data && (
                <div className="mt-2">
                  <p className="text-green-400 mb-2">
                    ✅ {Array.isArray(result.data) ? result.data.length : 1} registro(s) carregado(s)
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                      Ver dados
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-800 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {result.status === 'error' && result.error && (
                <div className="mt-2">
                  <p className="text-red-400 font-semibold mb-2">
                    ❌ ERRO: {result.error.message || 'Erro desconhecido'}
                  </p>
                  {result.error.code && (
                    <p className="text-sm text-gray-400">Código: {result.error.code}</p>
                  )}
                  {result.error.details && (
                    <p className="text-sm text-gray-400">Detalhes: {result.error.details}</p>
                  )}
                  {result.error.hint && (
                    <p className="text-sm text-gray-400">Dica: {result.error.hint}</p>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                      Ver erro completo
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-800 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {result.status === 'loading' && (
                <p className="text-yellow-400">Carregando...</p>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center text-gray-400 py-12">
            Clique no botão acima para iniciar os testes
          </div>
        )}
      </div>
    </div>
  )
}
