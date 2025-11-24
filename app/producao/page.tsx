'use client'

import { useState } from 'react'
import { useConteudosProducao, useAtualizarStatusProducao, useEstatisticasProducao, type StatusProducao } from '@/lib/hooks/use-producao'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, DragOverEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Clock, User } from 'lucide-react'
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
}

function CardConteudo({ conteudo }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: conteudo.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 cursor-move hover:border-zinc-700 transition-colors"
    >
      <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">
        {conteudo.ideia?.titulo || 'Sem título'}
      </h4>
      
      <div className="space-y-1 text-xs text-zinc-400">
        {conteudo.canal?.nome && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">📺</span>
            <span>{conteudo.canal.nome}</span>
          </div>
        )}
        
        {conteudo.data_prevista && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(conteudo.data_prevista).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        
        {conteudo.responsavel && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{conteudo.responsavel}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 mt-2">
          <span className={`px-2 py-0.5 rounded text-xs ${
            conteudo.prioridade >= 8 ? 'bg-red-600/20 text-red-400' :
            conteudo.prioridade >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
            'bg-zinc-700/20 text-zinc-400'
          }`}>
            P{conteudo.prioridade}
          </span>
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
}

function ColunaKanban({ status, titulo, cor, conteudos }: ColunaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-zinc-900/50 border ${isOver ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800'} rounded-lg p-4 transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{titulo}</h3>
        <span className={`${cor} text-white text-xs px-2 py-1 rounded`}>
          {conteudos.length}
        </span>
      </div>

      <SortableContext
        items={conteudos.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[200px]">
          {conteudos.map(conteudo => (
            <CardConteudo key={conteudo.id} conteudo={conteudo} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProducaoPage() {
  const { data: conteudos, isLoading } = useConteudosProducao()
  const { data: stats } = useEstatisticasProducao()
  const atualizarStatus = useAtualizarStatusProducao()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeConteudo, setActiveConteudo] = useState<any>(null)

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
    const conteudo = conteudos?.find(c => c.id === id)
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
    const conteudo = conteudos?.find(c => c.id === conteudoId)
    if (conteudo && conteudo.status !== novoStatus) {
      console.log('Atualizando status:', { conteudoId, novoStatus })
      atualizarStatus.mutate({ id: conteudoId, novoStatus })
    }
    
    setActiveId(null)
    setActiveConteudo(null)
  }

  const conteudoPorStatus = (status: StatusProducao) => {
    return conteudos?.filter(c => c.status === status) || []
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="text-zinc-400">Carregando pipeline...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">🎬 Pipeline de Produção</h1>
            <Link
              href="/calendario"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Ver Calendário
            </Link>
          </div>
          
          <div className="grid grid-cols-6 gap-4">
            {COLUNAS.map(coluna => {
              const count = conteudoPorStatus(coluna.id).length
              return (
                <div key={coluna.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="text-sm text-zinc-400 mb-1">{coluna.titulo}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-6 gap-4">
            {COLUNAS.map(coluna => (
              <ColunaKanban
                key={coluna.id}
                status={coluna.id}
                titulo={coluna.titulo}
                cor={coluna.cor}
                conteudos={conteudoPorStatus(coluna.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && activeConteudo ? (
              <div className="bg-zinc-900 border-2 border-violet-500 rounded-lg p-4 opacity-90 rotate-3">
                <h4 className="text-sm font-medium text-white mb-2">
                  {activeConteudo.ideia?.titulo || 'Sem título'}
                </h4>
                <div className="text-xs text-zinc-400">
                  Arrastando...
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-white mb-3">Como usar:</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• Arraste os cards entre as colunas para atualizar o status</li>
            <li>• P8-10 = Prioridade Alta (vermelho) | P5-7 = Média (amarelo) | P1-4 = Baixa (cinza)</li>
            <li>• Use o Calendário para visualizar datas de publicação</li>
          </ul>
        </div>
      </div>
    </div>
  )
}