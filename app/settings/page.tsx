'use client'

import { useState } from 'react'
import { usePlataformasConectadas, useConfiguracoes, useAtualizarConfiguracao, useDesconectarPlataforma } from '@/lib/hooks/use-plataformas'
import { Settings as SettingsIcon, Database, Key, Bell, Save, Check, X, Loader2, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { data: plataformas, isLoading: loadingPlataformas } = usePlataformasConectadas()
  const { data: configsN8n } = useConfiguracoes('n8n')
  const atualizarConfig = useAtualizarConfiguracao()
  const desconectar = useDesconectarPlataforma()
  
  const [editandoN8n, setEditandoN8n] = useState(false)
  const [n8nUrl, setN8nUrl] = useState('')
  const [n8nApiKey, setN8nApiKey] = useState('')

  const handleSalvarN8n = async () => {
    try {
      if (n8nUrl) {
        await atualizarConfig.mutateAsync({ chave: 'n8n_url', valor: n8nUrl })
      }
      if (n8nApiKey) {
        await atualizarConfig.mutateAsync({ chave: 'n8n_api_key', valor: n8nApiKey })
      }
      setEditandoN8n(false)
      setN8nUrl('')
      setN8nApiKey('')
    } catch (error) {
      console.error('Erro ao salvar n8n:', error)
    }
  }

  const plataformasConectadas = plataformas?.filter(p => p.tem_credenciais) || []
  const plataformasNaoConectadas = plataformas?.filter(p => !p.tem_credenciais) || []

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-zinc-400">Gerencie integrações e preferências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-bold text-white">Supabase</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Conexão com banco de dados</p>
          <span className="inline-flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>
            Conectado
          </span>
        </div>

        {/* N8N */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-bold text-white">N8N</h3>
            </div>
            {!editandoN8n && (
              <button
                onClick={() => setEditandoN8n(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Configurar
              </button>
            )}
          </div>
          
          {editandoN8n ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">URL do n8n</label>
                <input
                  type="text"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  placeholder={configsN8n?.find(c => c.chave === 'n8n_url')?.valor || 'http://localhost:5678'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">API Key</label>
                <input
                  type="password"
                  value={n8nApiKey}
                  onChange={(e) => setN8nApiKey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSalvarN8n}
                  disabled={atualizarConfig.isPending}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {atualizarConfig.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Salvar</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditandoN8n(false)
                    setN8nUrl('')
                    setN8nApiKey('')
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-400 mb-4">Workflows e automações</p>
              <div className="text-xs text-zinc-500">
                URL: {configsN8n?.find(c => c.chave === 'n8n_url')?.valor || 'Não configurado'}
              </div>
            </>
          )}
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
