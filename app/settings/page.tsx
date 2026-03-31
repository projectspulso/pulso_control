'use client'

import { useState } from 'react'
import { usePlataformasConectadas, useAtualizarConfiguracao, useDesconectarPlataforma } from '@/lib/hooks/use-plataformas'
import { ErrorState } from '@/components/ui/error-state'
import { Settings as SettingsIcon, Database, Key, Bell, Save, Check, X, Loader2, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { data: plataformas, isLoading: loadingPlataformas, isError, refetch } = usePlataformasConectadas()
  const atualizarConfig = useAtualizarConfiguracao()
  const desconectar = useDesconectarPlataforma()

  const plataformasConectadas = plataformas?.filter(p => p.tem_credenciais) || []
  const plataformasNaoConectadas = plataformas?.filter(p => !p.tem_credenciais) || []

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar configurações"
            message="Não foi possível carregar as configurações do sistema. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-linear-to-r from-zinc-400 via-gray-400 to-zinc-400 bg-clip-text text-transparent">
              ⚙️ Configurações
            </h1>
          </div>
          <p className="text-zinc-400">Gerencie integrações e preferências</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supabase */}
          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-purple-500/30 transition-all animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Supabase</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Conexão com banco de dados</p>
            <span className="inline-flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow"></span>
              Conectado
            </span>
          </div>

          {/* Automação AI-Native */}
          <div className="glass border border-zinc-800/50 rounded-xl p-6 hover:border-purple-500/30 transition-all animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Automação AI</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Pipeline nativo via banco + Edge Functions</p>
            <span className="inline-flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse-glow"></span>
              Ativo — sem dependência externa
            </span>
          </div>

        {/* Plataformas Conectadas */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-bold text-white">Plataformas Conectadas</h3>
          </div>
          
          {loadingPlataformas ? (
            <div className="text-center py-8 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : plataformasConectadas.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">Nenhuma plataforma conectada</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plataformasConectadas.map((plat) => (
                <div key={plat.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{plat.nome_exibicao}</h4>
                      <p className="text-xs text-zinc-500">{plat.tipo}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  {plat.usuario_conectado && (
                    <p className="text-xs text-zinc-400 mb-2">{plat.usuario_conectado}</p>
                  )}
                  {plat.token_valido === false && (
                    <p className="text-xs text-yellow-400 mb-2">⚠️ Token expirado</p>
                  )}
                  <button
                    onClick={() => desconectar.mutate(plat.id)}
                    disabled={desconectar.isPending}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plataformas Disponíveis */}
        {plataformasNaoConectadas.length > 0 && (
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="h-6 w-6 text-zinc-500" />
              <h3 className="text-lg font-bold text-white">Plataformas Disponíveis</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plataformasNaoConectadas.map((plat) => (
                <div key={plat.id} className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-sm mb-1">{plat.nome_exibicao}</h4>
                  <p className="text-xs text-zinc-500 mb-3">{plat.descricao || plat.tipo}</p>
                  <button
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Conectar (em breve)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notificações */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Notificações</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Alertas e avisos do sistema</p>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
            Em breve
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}
