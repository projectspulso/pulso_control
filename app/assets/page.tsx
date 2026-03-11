'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Film,
  Image as ImageIcon,
  Layers,
  Music,
} from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { useAssetsPorTipo, useAudiosGerados } from '@/lib/hooks/use-assets'

const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export default function AssetsPage() {
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const { data: assets, isLoading, isError, refetch } = useAssetsPorTipo(
    tipoFiltro || undefined,
  )
  const { data: audiosGerados } = useAudiosGerados()

  const tiposDisponiveis = [
    { valor: '', label: 'Todos', icon: Layers },
    { valor: 'audio', label: 'Audios', icon: Music },
    { valor: 'video', label: 'Videos', icon: Film },
    { valor: 'imagem', label: 'Imagens', icon: ImageIcon },
    { valor: 'thumbnail', label: 'Thumbnails', icon: ImageIcon },
    { valor: 'broll', label: 'B-rolls', icon: Film },
  ]

  const formatarTamanho = (bytes?: number) => {
    if (!bytes) {
      return '-'
    }

    const mb = bytes / (1024 * 1024)

    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${mb.toFixed(1)} MB`
  }

  const formatarDuracao = (segundos?: number) => {
    if (!segundos) {
      return '-'
    }

    const minutos = Math.floor(segundos / 60)
    const segundosRestantes = Math.floor(segundos % 60)

    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`
  }

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'audio':
        return <Music className="h-5 w-5 text-purple-400" />
      case 'video':
        return <Film className="h-5 w-5 text-blue-400" />
      case 'broll':
        return <Film className="h-5 w-5 text-orange-400" />
      case 'thumbnail':
        return <ImageIcon className="h-5 w-5 text-yellow-400" />
      case 'imagem':
        return <ImageIcon className="h-5 w-5 text-green-400" />
      default:
        return <Layers className="h-5 w-5 text-zinc-400" />
    }
  }

  const getAssetHref = (caminhoStorage?: string, publicUrl?: string) => {
    if (publicUrl) {
      return publicUrl
    }

    if (!caminhoStorage || !STORAGE_BASE_URL) {
      return null
    }

    return `${STORAGE_BASE_URL}/storage/v1/object/public/${caminhoStorage}`
  }

  const totalAssets = assets?.length ?? 0
  const duracaoTotal = Math.round(
    (assets ?? []).reduce((soma, asset) => soma + (asset.duracao_segundos || 0), 0),
  )
  const audiosTotal = audiosGerados?.length ?? 0

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 animate-fade-in lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-4xl font-black text-transparent">
              <Layers className="h-9 w-9 text-pink-400" />
              Biblioteca de Assets
            </h1>
            <p className="mt-2 flex items-center gap-2 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              Audios, videos, thumbs e material de apoio do pipeline
            </p>
          </div>

          <div className="glass flex items-center gap-2 rounded-xl px-6 py-3 text-sm text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Biblioteca ligada aos workflows do n8n
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in">
          {tiposDisponiveis.map((tipo, idx) => {
            const Icon = tipo.icon
            const ativo = tipoFiltro === tipo.valor

            return (
              <button
                key={tipo.valor}
                type="button"
                onClick={() => setTipoFiltro(tipo.valor)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${
                  ativo
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

        {isLoading ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <div className="skeleton mx-auto mb-4 h-8 w-32" />
            <div className="skeleton mx-auto h-4 w-48" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Erro ao carregar assets"
            message="Nao foi possivel carregar a biblioteca de midia. Tente novamente."
            onRetry={() => refetch()}
          />
        ) : !assets || assets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <div className="mb-4 text-6xl">[]</div>
            <p className="mb-2 text-lg font-semibold text-zinc-400">
              Nenhum asset encontrado
            </p>
            <p className="text-sm text-zinc-600">
              {tipoFiltro
                ? `Nao ha assets do tipo "${tipoFiltro}".`
                : 'Quando o pipeline gerar ou receber midia, ela aparece aqui.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset, idx) => {
              const assetHref = getAssetHref(asset.caminho_storage, asset.public_url)

              return (
                <div
                  key={asset.id}
                  className="glass glass-hover group relative overflow-hidden rounded-2xl animate-fade-in"
                  style={{ animationDelay: `${200 + idx * 30}ms` }}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-600/20 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100" />

                  <div className="relative aspect-video overflow-hidden bg-zinc-950">
                    {asset.tipo === 'audio' && asset.public_url ? (
                      <div className="flex h-full flex-col items-center justify-center p-4">
                        <Music className="mb-3 h-12 w-12 text-purple-400" />
                        <audio controls className="w-full" preload="metadata">
                          <source src={asset.public_url} type="audio/mpeg" />
                          Seu navegador nao suporta audio.
                        </audio>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {getIconeTipo(asset.tipo)}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 flex-1 font-medium text-white">
                        {asset.nome}
                      </h3>
                      {assetHref && (
                        <a
                          href={assetHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 opacity-0 transition-opacity hover:text-blue-300 group-hover:opacity-100"
                          aria-label={`Abrir asset ${asset.nome}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {asset.descricao && (
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                        {asset.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span className="rounded bg-zinc-800 px-2 py-1">{asset.tipo}</span>

                      {asset.tamanho_bytes && (
                        <span className="rounded bg-zinc-800 px-2 py-1">
                          {formatarTamanho(asset.tamanho_bytes)}
                        </span>
                      )}

                      {asset.duracao_segundos && (
                        <span className="rounded bg-zinc-800 px-2 py-1">
                          {formatarDuracao(asset.duracao_segundos)}
                        </span>
                      )}

                      {asset.largura_px && asset.altura_px && (
                        <span className="rounded bg-zinc-800 px-2 py-1">
                          {asset.largura_px}x{asset.altura_px}
                        </span>
                      )}
                    </div>

                    {asset.provedor && (
                      <div className="mt-3 border-t border-zinc-800 pt-3">
                        <p className="text-xs text-zinc-500">
                          Provedor:{' '}
                          <span className="text-zinc-400">{asset.provedor}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {assets && assets.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-white">{totalAssets}</p>
                <p className="text-sm text-zinc-400">Assets listados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{duracaoTotal}s</p>
                <p className="text-sm text-zinc-400">Duracao total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{audiosTotal}</p>
                <p className="text-sm text-zinc-400">Audios gerados</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
