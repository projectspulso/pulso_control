'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Clock, Loader2, AlertCircle, Play, Sparkles, Volume2, Video, Upload } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface PipelineItem {
  id: string
  ideia_id: string
  roteiro_id: string | null
  audio_id: string | null
  video_id: string | null
  status: string
  prioridade: number
  created_at: string
  ideia_titulo: string
  canal_nome: string
}

const STATUS_ICONS = {
  'AGUARDANDO_ROTEIRO': { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'ROTEIRO_PRONTO': { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  'AUDIO_GERADO': { icon: Volume2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'PRONTO_PUBLICACAO': { icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'PUBLICADO': { icon: Upload, color: 'text-green-400', bg: 'bg-green-500/10' },
  'ERRO': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
}

async function getPipeline(): Promise<PipelineItem[]> {
  const { data, error } = await supabase
    .from('pipeline_producao')
    .select(`
      *,
      ideias!inner(titulo),
      canais!inner(nome)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return data.map((item: any) => ({
    id: item.id,
    ideia_id: item.ideia_id,
    roteiro_id: item.roteiro_id,
    audio_id: item.audio_id,
    video_id: item.video_id,
    status: item.status,
    prioridade: item.prioridade,
    created_at: item.created_at,
    ideia_titulo: item.ideias.titulo,
    canal_nome: item.canais.nome
  }))
}

export default function PipelineMonitor() {
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: getPipeline,
    refetchInterval: 10000 // Atualiza a cada 10s
  })

  // Agrupar por status
  const grouped = pipeline?.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_ICONS).map(([status, config]) => {
          const Icon = config.icon
          const count = grouped[status] || 0
          
          return (
            <div
              key={status}
              className={`${config.bg} border border-zinc-800 rounded-lg p-4 hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Lista do Pipeline */}
      <div className="glass rounded-xl border border-zinc-800">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-purple-500" />
            Pipeline de Produção
            <span className="text-xs text-zinc-500 font-normal ml-auto">
              {pipeline?.length} itens
            </span>
          </h3>
        </div>
        
        <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
          {pipeline?.map((item) => {
            const statusConfig = STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] || STATUS_ICONS['AGUARDANDO_ROTEIRO']
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={item.id}
                className="p-4 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`${statusConfig.bg} p-2 rounded-lg`}>
                    <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/ideias/${item.ideia_id}`}
                      className="font-semibold text-white hover:text-purple-400 transition-colors line-clamp-1 block"
                    >
                      {item.ideia_titulo}
                    </Link>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{item.canal_nome}</span>
                      <span>•</span>
                      <span>{formatDateTime(item.created_at)}</span>
                      {item.prioridade > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-500">Prioridade {item.prioridade}</span>
                        </>
                      )}
                    </div>

                    {/* Progresso Visual */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`h-2 w-2 rounded-full ${item.ideia_id ? 'bg-green-500' : 'bg-zinc-700'}`} title="Ideia" />
                      <div className="h-px w-4 bg-zinc-700" />
                      <div className={`h-2 w-2 rounded-full ${item.roteiro_id ? 'bg-green-500' : 'bg-zinc-700'}`} title="Roteiro" />
                      <div className="h-px w-4 bg-zinc-700" />
                      <div className={`h-2 w-2 rounded-full ${item.audio_id ? 'bg-green-500' : 'bg-zinc-700'}`} title="Áudio" />
                      <div className="h-px w-4 bg-zinc-700" />
                      <div className={`h-2 w-2 rounded-full ${item.video_id ? 'bg-green-500' : 'bg-zinc-700'}`} title="Vídeo" />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`${statusConfig.bg} ${statusConfig.color} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )
          })}

          {(!pipeline || pipeline.length === 0) && (
            <div className="p-12 text-center text-zinc-500">
              <Play className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum item no pipeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
