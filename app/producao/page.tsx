'use client'

import { useState, useEffect } from 'react'
import { useConteudosProducao, useAtualizarStatusProducao, useEstatisticasProducao, type StatusProducao } from '@/lib/hooks/use-producao'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, DragOverEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ErrorState } from '@/components/ui/error-state'
import { ModoFocoBanner } from '@/components/modo-foco-banner'
import { PageHeader } from '@/components/layout/page-header'
import { EstoqueBanner } from '@/components/estoque-banner'
import { FilaProducao } from '@/components/fila-producao'
import { MODO_FOCO, MODO_FOCO_ATIVO } from '@/lib/config/modo-foco'
import { Calendar, Clock, Film, User } from 'lucide-react'
import Link from 'next/link'

const COLUNAS: { id: StatusProducao; titulo: string; cor: string }[] = [
  { id: 'AGUARDANDO_ROTEIRO', titulo: 'Aguardando Roteiro', cor: 'bg-zinc-700' },
  { id: 'ROTEIRO_PRONTO', titulo: 'Roteiro Pronto', cor: 'bg-blue-600' },
  { id: 'AUDIO_GERADO', titulo: 'Áudio Gerado', cor: 'bg-purple-600' },
  { id: 'EM_EDICAO', titulo: 'Em Edição', cor: 'bg-yellow-600' },
  { id: 'PRONTO_PUBLICACAO', titulo: 'Pronto p/ Publicar', cor: 'bg-green-600' },
  { id: 'PUBLICADO', titulo: 'Publicado', cor: 'bg-emerald-700' },
]

interface CardProps {
  conteudo: any
  destacado?: boolean
}

function CardConteudo({ conteudo, destacado }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: conteudo.pipeline_id,
  })

  useEffect(() => {
    if (destacado) document.getElementById(`kbcard-${conteudo.pipeline_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [destacado, conteudo.pipeline_id])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      id={`kbcard-${conteudo.pipeline_id}`}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass rounded-xl p-4 cursor-move hover:shadow-lg hover:shadow-violet-500/10 transition-all group relative overflow-hidden border ${destacado ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20' : 'border-zinc-800/50 hover:border-violet-500/50'}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-violet-600/0 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <h4 className="text-sm font-medium text-white mb-2 line-clamp-2 relative z-10">
        {conteudo.metadata?.numero != null && (
          <span className="inline-block bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded px-1.5 py-0.5 text-[10px] font-bold mr-1.5 align-middle">
            #{String(conteudo.metadata.numero).padStart(3, '0')}
          </span>
        )}
        {conteudo.ideia || 'Sem título'}
      </h4>
      
      <div className="space-y-1 text-xs text-zinc-400 relative z-10">
        {conteudo.canal && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">📺</span>
            <span>{conteudo.canal}</span>
          </div>
        )}
        
        {conteudo.serie && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">📚</span>
            <span>{conteudo.serie}</span>
          </div>
        )}
        
        {conteudo.data_publicacao_planejada && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(conteudo.data_publicacao_planejada).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        
        
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-0.5 rounded text-xs ${
            conteudo.prioridade >= 8 ? 'bg-red-600/20 text-red-400' :
            conteudo.prioridade >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
            'bg-zinc-700/20 text-zinc-400'
          }`}>
            P{conteudo.prioridade}
          </span>
          
          {conteudo.roteiro_status && (
            <span className="px-2 py-0.5 rounded text-xs bg-blue-600/20 text-blue-400">📝 {conteudo.roteiro_status}</span>
          )}
          
          {conteudo.is_piloto && (
            <span className="px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-400">⭐ Piloto</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ColunaProps {
  status: StatusProducao
  titulo: string
  cor: string
  conteudos: any[]
  destaque?: string | null
}

function ColunaKanban({ status, titulo, cor, conteudos, destaque }: ColunaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`glass border rounded-2xl p-4 transition-all ${isOver ? 'border-violet-500 bg-violet-500/10 shadow-xl shadow-violet-500/20' : 'border-zinc-800/50'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{titulo}</h3>
        <span className={`${cor} text-white text-xs px-2.5 py-1 rounded-full font-bold`}>
          {conteudos.length}
        </span>
      </div>

      <SortableContext
        items={conteudos.map(c => c.pipeline_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[200px]">
          {conteudos.map(conteudo => (
            <CardConteudo key={conteudo.pipeline_id} conteudo={conteudo} destacado={destaque === conteudo.pipeline_id} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProducaoPage() {
  const { data: conteudos, isLoading, isError, refetch } = useConteudosProducao()
  const { data: stats } = useEstatisticasProducao()
  const atualizarStatus = useAtualizarStatusProducao()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeConteudo, setActiveConteudo] = useState<any>(null)
  const [destaque, setDestaque] = useState<string | null>(null)
  const conteudosModoFoco = (MODO_FOCO_ATIVO ? conteudos?.filter((item) => item.canal === MODO_FOCO.canalNomeDb) : conteudos) ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)
    const conteudo = conteudosModoFoco.find(c => c.pipeline_id === id)
    setActiveConteudo(conteudo)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      setActiveConteudo(null)
      return
    }
    
    const conteudoId = active.id as string
    const novoStatus = over.id as StatusProducao
    
    // Só atualiza se mudou de coluna
    const conteudo = conteudosModoFoco.find(c => c.pipeline_id === conteudoId)
    if (conteudo && conteudo.pipeline_status !== novoStatus) {
      atualizarStatus.mutate({ id: conteudoId, novoStatus })

      // kanban operacional: arrastar TAMBÉM dispara a geração correspondente
      const disparar = async (endpoint: string, payload: Record<string, unknown>, oQue: string) => {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const data = await res.json()
          if (!res.ok && res.status !== 409) {
            alert(`Falha ao gerar ${oQue}: ${data.error || res.status}`)
          }
          refetch()
        } catch {
          alert(`Falha ao gerar ${oQue} — tente pelo botão da tela.`)
        }
      }
      if (novoStatus === 'ROTEIRO_PRONTO' && !conteudo.roteiro_id) {
        disparar('/api/automation/gerar-roteiro', { ideia_id: conteudo.ideia_id }, 'roteiro')
      } else if (novoStatus === 'AUDIO_GERADO' && conteudo.roteiro_id) {
        disparar('/api/automation/gerar-audio', { roteiro_id: conteudo.roteiro_id }, 'áudio (voz PULSO)')
      } else if (novoStatus === 'EM_EDICAO') {
        // GATE DE RENDER: arrastar pra "Em Edição" autoriza o vídeo (passo caro/Veo).
        // O render roda no worker LOCAL (08/16/23h), não na hora.
        alert('✅ Enviado pra renderizar!\n\nO render é o passo caro (Veo) — o worker local gera o vídeo na próxima rodada (08/16/23h). Os cards em "Áudio Gerado" ficam esperando até você arrastá-los pra cá.')
      }
    }
    
    setActiveId(null)
    setActiveConteudo(null)
  }

  const conteudoPorStatus = (status: StatusProducao) => {
    return conteudosModoFoco.filter(c => c.pipeline_status === status)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-zinc-400 animate-pulse">Carregando pipeline...</div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            title="Erro ao carregar pipeline"
            message="Não foi possível carregar o pipeline de produção. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="mb-4">
            <PageHeader
              titulo="Pipeline de Produção"
              acoes={
                <>
                  <Link
                    href="/producao/higgsfield"
                    className="glass-hover px-5 py-3 text-white rounded-lg transition-all flex items-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-orange-600 to-amber-600 opacity-100 group-hover:opacity-80 transition-opacity" />
                    <Film className="h-4 w-4 relative" />
                    <span className="relative">Motor de Produção</span>
                  </Link>
                  <Link
                    href="/agenda"
                    className="glass-hover px-5 py-3 text-white rounded-lg transition-all flex items-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-teal-600 to-blue-600 opacity-100 group-hover:opacity-80 transition-opacity" />
                    <Calendar className="h-4 w-4 relative" />
                    <span className="relative">Ver Agenda</span>
                  </Link>
                </>
              }
            />
          </div>

          <div className="mb-6">
            <ModoFocoBanner detail="Pipeline filtrado para o canal foco. Os demais canais ficam fora da execucao do MVP." />
            <div className="mt-3"><EstoqueBanner /></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COLUNAS.map((coluna, idx) => {
              const count = conteudoPorStatus(coluna.id).length
              return (
                <div 
                  key={coluna.id} 
                  className="glass border border-zinc-800/50 rounded-xl p-4 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-orange-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  <div className="text-sm text-zinc-400 mb-1 relative z-10">{coluna.titulo}</div>
                  <div className="text-2xl font-bold text-white relative z-10 tabular-nums">{count}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <FilaProducao onSelecionar={setDestaque} selecionado={destaque} />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COLUNAS.map(coluna => (
              <ColunaKanban
                key={coluna.id}
                status={coluna.id}
                titulo={coluna.titulo}
                cor={coluna.cor}
                conteudos={conteudoPorStatus(coluna.id)}
                destaque={destaque}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && activeConteudo ? (
              <div className="glass border-2 border-violet-500 rounded-xl p-4 opacity-90 rotate-3 shadow-2xl shadow-violet-500/50">
                <h4 className="text-sm font-medium text-white mb-2">
                  {activeConteudo.ideia || 'Sem título'}
                </h4>
                <div className="text-xs text-violet-400 font-medium">
                  Arrastando...
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-8 glass border border-zinc-800/50 rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="text-orange-400">💡</span> Como usar:
          </h3>
          <ul className="text-sm text-zinc-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Arraste <b className="text-zinc-300">→ Áudio Gerado</b> = gera a voz PULSO. Arraste <b className="text-yellow-300">→ Em Edição</b> = autoriza o vídeo (render).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><b className="text-zinc-300">Render é o passo caro (Veo)</b>: roda no worker local (08/16/23h). Áudio Gerado fica esperando até você mandar pra Em Edição.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>P8-10 = Prioridade Alta (vermelho) | P5-7 = Média (amarelo) | P1-4 = Baixa (cinza)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Use o Calendário para visualizar datas de publicação</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
