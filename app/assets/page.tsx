'use client'

import { useAssetsPorTipo, useCriarAsset, useDeletarAsset } from '@/lib/hooks/use-assets'
import { useState } from 'react'
import { Upload, Trash2, Film, Music, Image, Layers } from 'lucide-react'

export default function AssetsPage() {
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const { data: assets, isLoading } = useAssetsPorTipo(tipoFiltro || undefined)
  const deletarAsset = useDeletarAsset()

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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📁 Biblioteca de Assets</h1>
            <p className="text-zinc-400">Gerenciamento de áudios, vídeos, thumbnails e B-rolls</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
            <Upload className="h-4 w-4" />
            Upload Asset
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tiposDisponiveis.map((tipo) => {
            const Icon = tipo.icon
            const isActive = tipoFiltro === tipo.valor
            
            return (
              <button
                key={tipo.valor}
                onClick={() => setTipoFiltro(tipo.valor)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tipo.label}
              </button>
            )
          })}
        </div>

        {/* Grid de Assets */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Carregando assets...</p>
          </div>
        ) : !assets || assets.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <p className="text-zinc-400 text-lg mb-2">Nenhum asset encontrado</p>
            <p className="text-sm text-zinc-500">
              {tipoFiltro ? `Não há assets do tipo "${tipoFiltro}"` : 'Faça upload do seu primeiro asset'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors group"
              >
                {/* Preview */}
                <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                  {getIconeTipo(asset.tipo)}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-medium line-clamp-1 flex-1">
                      {asset.nome}
                    </h3>
                    <button
                      onClick={() => {
                        if (confirm('Deletar este asset?')) {
                          deletarAsset.mutate(asset.id)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
          <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{assets.length}</p>
                <p className="text-sm text-zinc-400">Total de Assets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatarTamanho(assets.reduce((sum, a) => sum + (a.tamanho_bytes || 0), 0))}
                </p>
                <p className="text-sm text-zinc-400">Tamanho Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {assets.filter(a => a.tipo === 'video' || a.tipo === 'broll').length}
                </p>
                <p className="text-sm text-zinc-400">Vídeos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {assets.filter(a => a.tipo === 'audio').length}
                </p>
                <p className="text-sm text-zinc-400">Áudios</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
