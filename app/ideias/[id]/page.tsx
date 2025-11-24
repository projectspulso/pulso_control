'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdeia, useAtualizarIdeia, useDeletarIdeia } from '@/lib/hooks/use-ideias'
import { useCanais, useSeriesPorCanal } from '@/lib/hooks/use-core'
import { useGerarRoteiro } from '@/lib/hooks/use-n8n'
import Link from 'next/link'

export default function IdeiaDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: ideia, isLoading } = useIdeia(resolvedParams.id)
  const { data: canais } = useCanais()
  const [canalSelecionado, setCanalSelecionado] = useState<string>('')
  const { data: series } = useSeriesPorCanal(canalSelecionado || ideia?.canal_id || null)
  
  const atualizarIdeia = useAtualizarIdeia()
  const deletarIdeia = useDeletarIdeia()
  const gerarRoteiro = useGerarRoteiro()

  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    canal_id: '',
    serie_id: '',
    prioridade: 5,
    status: 'RASCUNHO',
    tags: [] as string[]
  })

  // Inicializar formData quando ideia carregar
  useState(() => {
    if (ideia) {
      setFormData({
        titulo: ideia.titulo || '',
        descricao: ideia.descricao || '',
        canal_id: ideia.canal_id || '',
        serie_id: ideia.serie_id || '',
        prioridade: ideia.prioridade || 5,
        status: ideia.status || 'RASCUNHO',
        tags: ideia.tags || []
      })
      setCanalSelecionado(ideia.canal_id || '')
    }
  })

  const handleSalvar = async () => {
    try {
      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates: {
          ...formData,
          canal_id: formData.canal_id || null,
          serie_id: formData.serie_id || null
        } as any
      })
      setEditando(false)
    } catch (error) {
      console.error('Erro ao atualizar ideia:', error)
      alert('Erro ao atualizar ideia')
    }
  }

  const handleDeletar = async () => {
    if (!confirm('Tem certeza que deseja deletar esta ideia?')) return

    try {
      await deletarIdeia.mutateAsync(resolvedParams.id)
      router.push('/ideias')
    } catch (error) {
      console.error('Erro ao deletar ideia:', error)
      alert('Erro ao deletar ideia')
    }
  }

  const handleAprovar = async () => {
    try {
      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates: { status: 'APROVADA' as any }
      })
      alert('Ideia aprovada com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar ideia:', error)
      alert(`Erro ao aprovar ideia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleRejeitar = async () => {
    const motivo = prompt('Motivo da rejeição (opcional):')
    
    try {
      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates: {
          status: 'REJEITADA' as any,
          metadata: {
            ...ideia?.metadata,
            motivo_rejeicao: motivo || 'Não especificado'
          }
        } as any
      })
    } catch (error) {
      console.error('Erro ao rejeitar ideia:', error)
    }
  }

  const handleGerarRoteiro = async () => {
    if (!ideia) return
    
    try {
      await gerarRoteiro.mutateAsync({
        ideiaId: ideia.id,
        prompt: `Título: ${ideia.titulo}\nDescrição: ${ideia.descricao || ''}\nCanal: ${ideia.canal_id}\nLinguagem: ${ideia.linguagem || 'pt-BR'}`
      })
      alert('Roteiro sendo gerado! Acompanhe na aba Roteiros.')
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error)
      alert('Erro ao gerar roteiro. Verifique a configuração do n8n.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto text-zinc-400">
          Carregando ideia...
        </div>
      </div>
    )
  }

  if (!ideia) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-400">Ideia não encontrada</p>
          <Link href="/ideias" className="text-violet-400 hover:text-violet-300">
            ← Voltar para ideias
          </Link>
        </div>
      </div>
    )
  }

  const canal = canais?.find(c => c.id === ideia.canal_id)

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/ideias"
            className="text-violet-400 hover:text-violet-300 text-sm mb-4 inline-block"
          >
            ← Voltar para ideias
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {editando ? (
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                  />
                ) : (
                  ideia.titulo
                )}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={editando ? formData.status : ideia.status} />
                <span className="text-zinc-500 text-sm">
                  {canal?.nome || 'Sem canal'}
                </span>
              </div>
            </div>

            {!editando && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditando(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={handleDeletar}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🗑️ Deletar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          {/* Descrição */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrição</h3>
            {editando ? (
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white resize-none"
              />
            ) : (
              <p className="text-white whitespace-pre-wrap">{ideia.descricao}</p>
            )}
          </div>

          {/* Metadados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Prioridade</div>
              {editando ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.prioridade}
                  onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                />
              ) : (
                <div className="text-white font-medium">{ideia.prioridade}/10</div>
              )}
            </div>

            <div>
              <div className="text-xs text-zinc-500 mb-1">Origem</div>
              <div className="text-white font-medium">{ideia.origem || 'Manual'}</div>
            </div>

            <div>
              <div className="text-xs text-zinc-500 mb-1">Criado em</div>
              <div className="text-white font-medium">
                {ideia.created_at 
                  ? new Date(ideia.created_at).toLocaleDateString('pt-BR')
                  : '-'
                }
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500 mb-1">Atualizado em</div>
              <div className="text-white font-medium">
                {ideia.updated_at 
                  ? new Date(ideia.updated_at).toLocaleDateString('pt-BR')
                  : '-'
                }
              </div>
            </div>
          </div>

          {/* Tags */}
          {ideia.tags && ideia.tags.length > 0 && (
            <div className="pt-6 border-t border-zinc-800 mt-6">
              <div className="text-xs text-zinc-500 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {ideia.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-violet-600/20 text-violet-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        {editando ? (
          <div className="flex gap-4">
            <button
              onClick={handleSalvar}
              disabled={atualizarIdeia.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {atualizarIdeia.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            {ideia.status === 'RASCUNHO' && (
              <button
                onClick={handleAprovar}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ✓ Aprovar Ideia
              </button>
            )}
            {ideia.status === 'APROVADA' && (
              <button
                onClick={handleGerarRoteiro}
                disabled={gerarRoteiro.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {gerarRoteiro.isPending ? '⏳ Gerando...' : '✨ Gerar Roteiro (IA)'}
              </button>
            )}
            {ideia.status !== 'REJEITADA' && ideia.status !== 'ARQUIVADA' && (
              <button
                onClick={handleRejeitar}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                ✗ Rejeitar Ideia
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    NOVA: { label: 'Nova', color: 'bg-blue-600' },
    EM_ANALISE: { label: 'Em Análise', color: 'bg-yellow-600' },
    APROVADA: { label: 'Aprovada', color: 'bg-green-600' },
    REJEITADA: { label: 'Rejeitada', color: 'bg-red-600' },
    EM_PRODUCAO: { label: 'Em Produção', color: 'bg-purple-600' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-600' },
  }

  const config = status ? statusConfig[status] : { label: 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}
