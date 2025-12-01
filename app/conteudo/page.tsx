'use client'

import { useIdeias } from '@/lib/hooks/use-ideias'
import { useRoteiros } from '@/lib/hooks/use-roteiros'
import { useConteudosProducao } from '@/lib/hooks/use-producao'
import { useAssetsPorTipo } from '@/lib/hooks/use-assets'
import { FileText, Video, Image as ImageIcon, Calendar, Lightbulb, FileEdit, TrendingUp, Layers } from 'lucide-react'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/error-state'

export default function ConteudoPage() {
  const { data: ideias, isError: errorIdeias, refetch: refetchIdeias } = useIdeias()
  const { data: roteiros, isError: errorRoteiros, refetch: refetchRoteiros } = useRoteiros()
  const { data: pipeline, isError: errorPipeline, refetch: refetchPipeline } = useConteudosProducao()
  const { data: videos } = useAssetsPorTipo('video')
  const { data: imagens } = useAssetsPorTipo('imagem')
  const { data: audios } = useAssetsPorTipo('audio')

  const isError = errorIdeias || errorRoteiros || errorPipeline
  const refetchAll = () => {
    refetchIdeias()
    refetchRoteiros()
    refetchPipeline()
  }

  // Estatísticas
  const totalIdeias = ideias?.length || 0
  const totalRoteiros = roteiros?.length || 0
  const totalPipeline = pipeline?.length || 0
  const agendados = pipeline?.filter(p => p.data_publicacao_planejada).length || 0
  const prontos = pipeline?.filter(p => p.pipeline_status === 'PRONTO_PUBLICACAO').length || 0
  const emProducao = pipeline?.filter(p => 
    p.pipeline_status === 'EM_EDICAO' || 
    p.pipeline_status === 'AUDIO_GERADO'
  ).length || 0

  const cards = [
    {
      title: 'Ideias',
      value: totalIdeias,
      icon: Lightbulb,
      color: 'purple',
      description: 'Ideias cadastradas',
      link: '/ideias'
    },
    {
      title: 'Roteiros',
      value: totalRoteiros,
      icon: FileEdit,
      color: 'blue',
      description: 'Roteiros criados',
      link: '/roteiros'
    },
    {
      title: 'Em Produção',
      value: emProducao,
      icon: TrendingUp,
      color: 'yellow',
      description: 'Conteúdos sendo produzidos',
      link: '/producao'
    },
    {
      title: 'Prontos',
      value: prontos,
      icon: FileText,
      color: 'green',
      description: 'Prontos para publicar',
      link: '/publicar'
    },
    {
      title: 'Agendados',
      value: agendados,
      icon: Calendar,
      color: 'cyan',
      description: 'Publicações agendadas',
      link: '/calendario'
    },
    {
      title: 'Vídeos',
      value: videos?.length || 0,
      icon: Video,
      color: 'red',
      description: 'Assets de vídeo',
      link: '/assets'
    },
    {
      title: 'Imagens',
      value: imagens?.length || 0,
      icon: ImageIcon,
      color: 'pink',
      description: 'Thumbnails e imagens',
      link: '/assets'
    },
    {
      title: 'Total Assets',
      value: (videos?.length || 0) + (imagens?.length || 0) + (audios?.length || 0),
      icon: Layers,
      color: 'violet',
      description: 'Total de mídia',
      link: '/assets'
    }
  ]

  const colorConfig: Record<string, { bg: string; text: string; icon: string }> = {
    purple: { bg: 'bg-purple-600/10', text: 'text-purple-400', icon: 'text-purple-500' },
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-400', icon: 'text-blue-500' },
    yellow: { bg: 'bg-yellow-600/10', text: 'text-yellow-400', icon: 'text-yellow-500' },
    green: { bg: 'bg-green-600/10', text: 'text-green-400', icon: 'text-green-500' },
    cyan: { bg: 'bg-cyan-600/10', text: 'text-cyan-400', icon: 'text-cyan-500' },
    red: { bg: 'bg-red-600/10', text: 'text-red-400', icon: 'text-red-500' },
    pink: { bg: 'bg-pink-600/10', text: 'text-pink-400', icon: 'text-pink-500' },
    violet: { bg: 'bg-violet-600/10', text: 'text-violet-400', icon: 'text-violet-500' }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-linear-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              📚 Biblioteca de Conteúdo
            </h1>
          </div>
          <p className="text-zinc-400">Visão geral de todo o conteúdo do sistema</p>
        </div>

        {isError && (
          <div className="mb-8">
            <ErrorState 
              title="Atenção: Alguns dados não carregaram" 
              message="Houve um problema ao buscar parte das estatísticas. Os dados exibidos podem estar incompletos."
              onRetry={refetchAll}
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => {
            const Icon = card.icon
            const colors = colorConfig[card.color]

            return (
              <Link
                key={card.title}
                href={card.link}
                className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Ver todos →
                  </span>
                </div>
                
                <div>
                  <p className={`text-4xl font-bold mb-1 ${colors.text}`}>
                    {card.value}
                  </p>
                  <p className="text-sm font-semibold text-white mb-1">
                    {card.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {card.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Resumo do Funil */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Funil de Produção
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{totalIdeias}</div>
              <div className="text-sm text-zinc-400">Ideias</div>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{totalRoteiros}</div>
              <div className="text-sm text-zinc-400">Roteiros</div>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: totalIdeias > 0 ? `${(totalRoteiros / totalIdeias) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{emProducao}</div>
              <div className="text-sm text-zinc-400">Em Produção</div>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500" 
                  style={{ width: totalRoteiros > 0 ? `${(emProducao / totalRoteiros) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{prontos}</div>
              <div className="text-sm text-zinc-400">Prontos</div>
              <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: emProducao > 0 ? `${(prontos / emProducao) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Taxa de conversão: Ideias → Roteiros{' '}
              <span className="text-white font-semibold">
                {totalIdeias > 0 ? Math.round((totalRoteiros / totalIdeias) * 100) : 0}%
              </span>
              {' • '}
              Roteiros → Prontos{' '}
              <span className="text-white font-semibold">
                {totalRoteiros > 0 ? Math.round((prontos / totalRoteiros) * 100) : 0}%
              </span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/ideias/nova"
            className="bg-linear-to-br from-purple-600/20 to-purple-600/5 border border-purple-600/30 rounded-lg p-6 hover:border-purple-600/50 transition-all group"
          >
            <Lightbulb className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-1">Nova Ideia</h3>
            <p className="text-sm text-zinc-400">Cadastrar nova ideia de conteúdo</p>
          </Link>

          <Link
            href="/producao"
            className="bg-linear-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/30 rounded-lg p-6 hover:border-blue-600/50 transition-all group"
          >
            <TrendingUp className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-1">Pipeline</h3>
            <p className="text-sm text-zinc-400">Gerenciar produção no Kanban</p>
          </Link>

          <Link
            href="/calendario"
            className="bg-linear-to-br from-green-600/20 to-green-600/5 border border-green-600/30 rounded-lg p-6 hover:border-green-600/50 transition-all group"
          >
            <Calendar className="h-8 w-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-1">Calendário</h3>
            <p className="text-sm text-zinc-400">Ver agenda de publicações</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
