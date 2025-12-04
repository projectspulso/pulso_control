'use client'

import { useAssetsPorTipo, useAudiosGerados } from '@/lib/hooks/use-assets'
import { useState } from 'react'
import { Film, Music, Image, Layers, ExternalLink } from 'lucide-react'
import { ErrorState } from '@/components/ui/error-state'

export default function AssetsPage() {
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const { data: assets, isLoading, isError, refetch } = useAssetsPorTipo(tipoFiltro || undefined)
  const { data: audiosGerados } = useAudiosGerados()

  const tiposDisponiveis = [
    { valor: '', label: 'Todos', icon: Layers, color: 'zinc' },
    { valor: 'audio', label: 'Áudios', icon: Music, color: 'purple' },
    { valor: 'video', label: 'Vídeos', icon: Film, color: 'blue' },
    { valor: 'imagem', label: 'Imagens', icon: Image, color: 'green' },
    { valor: 'thumbnail', label: 'Thumbnails', icon: Image, color: 'yellow' },
    { valor: 'broll', label: 'B-Rolls', icon: Film, color: 'orange' },
  ]

  const formatarTamanho = (bytes?: number) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    return `${mb.toFixed(1)} MB`
  }

  const formatarDuracao = (segundos?: number) => {
    if (!segundos) return '-'
    const min = Math.floor(segundos / 60)
    const sec = Math.floor(segundos % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const getIconeTipo = (tipo: string) => {
    switch(tipo) {
      case 'audio': return <Music className="h-5 w-5 text-purple-400" />
      case 'video': return <Film className="h-5 w-5 text-blue-400" />
      case 'broll': return <Film className="h-5 w-5 text-orange-400" />
      case 'thumbnail': return <Image className="h-5 w-5 text-yellow-400" />
      case 'imagem': return <Image className="h-5 w-5 text-green-400" />
      default: return <Layers className="h-5 w-5 text-zinc-400" />
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              📁 Biblioteca de Assets
            </h1>
            <p className="text-zinc-400 mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              Áudios, vídeos, thumbnails e B-rolls
            </p>
          </div>
          
          <div className="glass rounded-xl px-6 py-3 text-sm text-zinc-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Assets gerados via n8n workflows
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {tiposDisponiveis.map((tipo, idx) => {
            const Icon = tipo.icon
            const isActive = tipoFiltro === tipo.valor
            
            return (
              <button
                key={tipo.valor}
                onClick={() => setTipoFiltro(tipo.valor)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap animate-fade-in ${
                  isActive 
                    ? 'glass bg-linear-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20' 
                    : 'glass text-zinc-400 hover:text-white'
                }`}
                style={{ animationDelay: `${100 + idx * 50}ms` }}
              >
                <Icon className="h-4 w-4" />
                {tipo.label}
              </button>
            )
          })}
        </div>

        {/* Grid de Assets */}
        {isLoading ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="skeleton h-8 w-32 mx-auto mb-4" />
            <div className="skeleton h-4 w-48 mx-auto" />
          </div>
        ) : isError ? (
          <ErrorState 
            title="Erro ao carregar assets" 
            message="Não foi possível carregar a biblioteca de mídia. Tente novamente."
            onRetry={() => refetch()}
          />
        ) : !assets || assets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-6xl mb-4">📁</div>
            <p className="text-zinc-400 text-lg mb-2 font-semibold">Nenhum asset encontrado</p>
            <p className="text-sm text-zinc-600">
              {tipoFiltro ? `Não há assets do tipo "${tipoFiltro}"` : 'Faça upload do seu primeiro asset'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset, idx) => (
              <div
                key={asset.id}
                className="glass glass-hover rounded-2xl overflow-hidden group relative animate-fade-in"
                style={{ animationDelay: `${200 + idx * 30}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* Preview com Player */}
                <div className="aspect-video bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                  {asset.tipo === 'audio' && asset.public_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <Music className="h-12 w-12 text-purple-400 mb-3" />
                      <audio 
                        controls 
                        className="w-full"
                        preload="metadata"
                      >
                        <source src={asset.public_url} type="audio/mpeg" />
                        Seu navegador não suporta áudio.
                      </audio>
                    </div>
                  ) : (
                    getIconeTipo(asset.tipo)
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-medium line-clamp-1 flex-1">
                      {asset.nome}
                    </h3>
                    {(asset.public_url || asset.caminho_storage) && (
                      <a
                        href={asset.public_url || `https://nlcisbfdiokmipyihtuz.supabase.co/storage/v1/object/public/${asset.caminho_storage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {asset.descricao && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                      {asset.descricao}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="px-2 py-1 bg-zinc-800 rounded">
                      {asset.tipo}
                    </span>
                    
                    {asset.tamanho_bytes && (
                      <span className="px-2 py-1 bg-zinc-800 rounded">
                        {formatarTamanho(asset.tamanho_bytes)}
                      </span>
                    )}
                    
                    {asset.duracao_segundos && (
                      <span className="px-2 py-1 bg-zinc-800 rounded">
                        {formatarDuracao(asset.duracao_segundos)}
                      </span>
                    )}
                    
                    {asset.largura_px && asset.altura_px && (
                      <span className="px-2 py-1 bg-zinc-800 rounded">
                        {asset.largura_px}×{asset.altura_px}
                      </span>
                    )}
                  </div>

                  {asset.provedor && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500">
                        Provedor: <span className="text-zinc-400">{asset.provedor}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {assets && assets.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{assets.length}</p>
                <p className="text-sm text-zinc-400">Total de Áudios</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(assets.reduce((sum, a) => sum + (a.duracao_segundos || 0), 0))}s
                </p>
                <p className="text-sm text-zinc-400">Duração Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Set(assets.map(a => a.metadata?.voice || 'alloy')).size}
                </p>
                <p className="text-sm text-zinc-400">Vozes Diferentes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
