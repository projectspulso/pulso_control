'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoteiro, useAtualizarRoteiro, useDeletarRoteiro } from '@/lib/hooks/use-roteiros'
import { useCanais } from '@/lib/hooks/use-core'
import { ErrorState } from '@/components/ui/error-state'
import { ApproveRoteiroButton } from '@/components/ui/approve-buttons'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function RoteiroDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: roteiro, isLoading, isError, refetch } = useRoteiro(resolvedParams.id)
  const { data: canais } = useCanais()
  
  const atualizarRoteiro = useAtualizarRoteiro()
  const deletarRoteiro = useDeletarRoteiro()

  const [editando, setEditando] = useState(false)
  const [conteudoEditado, setConteudoEditado] = useState('')

  useState(() => {
    if (roteiro?.conteudo_md) {
      setConteudoEditado(roteiro.conteudo_md)
    }
  })

  const handleSalvar = async () => {
    try {
      await atualizarRoteiro.mutateAsync({
        id: resolvedParams.id,
        updates: {
          conteudo_md: conteudoEditado
        }
      })
      setEditando(false)
    } catch (error) {
      console.error('Erro ao atualizar roteiro:', error)
      alert('Erro ao atualizar roteiro')
    }
  }

  const handleRejeitar = async () => {
    const motivo = prompt('Motivo da rejeição (opcional):')
    
    try {
      await atualizarRoteiro.mutateAsync({
        id: resolvedParams.id,
        updates: {
          status: 'REJEITADO' as any,
          metadata: {
            ...roteiro?.metadata,
            motivo_rejeicao: motivo || 'Não especificado'
          }
        } as any
      })
    } catch (error) {
      console.error('Erro ao rejeitar roteiro:', error)
    }
  }

  const handleDeletar = async () => {
    if (!confirm('Tem certeza que deseja deletar este roteiro?')) return

    try {
      await deletarRoteiro.mutateAsync(resolvedParams.id)
      router.push('/roteiros')
    } catch (error) {
      console.error('Erro ao deletar roteiro:', error)
      alert('Erro ao deletar roteiro')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto text-zinc-400">
          Carregando roteiro...
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto">
          <ErrorState
            title="Erro ao carregar roteiro"
            message="Não foi possível carregar os detalhes do roteiro. Tente novamente."
            onRetry={() => refetch()}
          />
          <div className="mt-4">
            <Link href="/roteiros" className="text-violet-400 hover:text-violet-300">
              ← Voltar para roteiros
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!roteiro) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-400">Roteiro não encontrado</p>
          <Link href="/roteiros" className="text-violet-400 hover:text-violet-300">
            ← Voltar para roteiros
          </Link>
        </div>
      </div>
    )
  }

  const canal = canais?.find(c => c.id === roteiro.canal_id)
  const metadata = roteiro.metadata as any || {}
  const secoes = metadata.secoes || {}
  const validacoes = metadata.validacoes || {}
  const hashtags = metadata.hashtags_sugeridas || []
  const palavrasTotal = metadata.palavras_total || 0
  const qualityScore = metadata.quality_score || 0

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/roteiros"
            className="text-violet-400 hover:text-violet-300 text-sm mb-4 inline-block"
          >
            ← Voltar para roteiros
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={roteiro.status} />
                <span className="text-zinc-500 text-sm">
                  {canal?.nome || 'Sem canal'}
                </span>
                <span className="text-zinc-600 text-sm">
                  v{roteiro.versao || 1}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {roteiro.titulo || 'Sem título'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                {roteiro.duracao_segundos && (
                  <span>⏱️ {roteiro.duracao_segundos}s</span>
                )}
                {palavrasTotal > 0 && (
                  <span>📝 {palavrasTotal} palavras</span>
                )}
                {roteiro.created_at && (
                  <span>
                    📅 {new Date(roteiro.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {roteiro.ideia_id && (
                  <Link
                    href={`/ideias/${roteiro.ideia_id}`}
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    🔗 Ver Ideia
                  </Link>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!editando && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roteiro */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Estruturado */}
            {Object.keys(secoes).length > 0 && !editando && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">📋 Estrutura do Roteiro</h2>
                <div className="space-y-4">
                  {secoes.gancho && (
                    <div>
                      <div className="text-xs font-medium text-violet-400 uppercase tracking-wide mb-2">
                        🎣 Gancho (0-5s)
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed pl-3 border-l-2 border-violet-600/50">
                        {secoes.gancho}
                      </div>
                    </div>
                  )}
                  {secoes.desenvolvimento && (
                    <div>
                      <div className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-2">
                        📖 Desenvolvimento (5-40s)
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed pl-3 border-l-2 border-blue-600/50 whitespace-pre-wrap">
                        {secoes.desenvolvimento}
                      </div>
                    </div>
                  )}
                  {secoes.climax && (
                    <div>
                      <div className="text-xs font-medium text-yellow-400 uppercase tracking-wide mb-2">
                        🎆 Clímax (40-50s)
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed pl-3 border-l-2 border-yellow-600/50">
                        {secoes.climax}
                      </div>
                    </div>
                  )}
                  {secoes.cta && (
                    <div>
                      <div className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2">
                        📢 CTA (50-55s)
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed pl-3 border-l-2 border-green-600/50">
                        {secoes.cta}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Roteiro Completo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {editando ? '✏️ Editando Roteiro' : '📄 Roteiro Completo (Markdown)'}
              </h2>
              
              {editando ? (
                <textarea
                  value={conteudoEditado}
                  onChange={(e) => setConteudoEditado(e.target.value)}
                  rows={20}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-sm resize-none focus:outline-none focus:border-violet-500"
                  placeholder="Conteúdo do roteiro em Markdown..."
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {roteiro.conteudo_md || '*Sem conteúdo*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ações */}
            {editando ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Ações</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleSalvar}
                    disabled={atualizarRoteiro.isPending}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {atualizarRoteiro.isPending ? 'Salvando...' : '💾 Salvar Alterações'}
                  </button>
                  <button
                    onClick={() => {
                      setEditando(false)
                      setConteudoEditado(roteiro.conteudo_md || '')
                    }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ✖️ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {roteiro.status !== 'APROVADO' && roteiro.status !== 'EM_PRODUCAO' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Aprovação</h3>
                    <div className="space-y-2">
                      <ApproveRoteiroButton
                        roteiroId={roteiro.id}
                        onSuccess={() => refetch()}
                      />
                      <button
                        onClick={handleRejeitar}
                        className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        ✗ Rejeitar Roteiro
                      </button>
                    </div>
                  </div>
                )}

                {roteiro.status === 'APROVADO' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">✅ Aprovado</h3>
                    <p className="text-xs text-zinc-500">
                      O workflow WF02 gerará automaticamente o áudio TTS deste roteiro.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Metadados */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-zinc-500 mb-1">Idioma</div>
                  <div className="text-white">{roteiro.linguagem || 'pt-BR'}</div>
                </div>
                {roteiro.palavras_chave && roteiro.palavras_chave.length > 0 && (
                  <div>
                    <div className="text-zinc-500 mb-1">Palavras-chave</div>
                    <div className="flex flex-wrap gap-1">
                      {roteiro.palavras_chave.map((palavra: string) => (
                        <span
                          key={palavra}
                          className="bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded text-xs"
                        >
                          {palavra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-zinc-500 mb-1">Criado por</div>
                  <div className="text-white">
                    {roteiro.gerado_por === 'IA' ? '🤖 IA (Workflow 1)' : '👤 Manual'}
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas da IA */}
            {Object.keys(metadata).length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Análise da IA</h3>
                <div className="space-y-3 text-sm">
                  {qualityScore > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-1">Quality Score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              qualityScore >= 75 ? 'bg-green-500' :
                              qualityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${qualityScore}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{qualityScore}%</span>
                      </div>
                    </div>
                  )}

                  {metadata.tom_narrativo && (
                    <div>
                      <div className="text-zinc-500 mb-1">Tom Narrativo</div>
                      <div className="text-white capitalize">{metadata.tom_narrativo}</div>
                    </div>
                  )}

                  {hashtags.length > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-1">Hashtags Sugeridas</div>
                      <div className="flex flex-wrap gap-1">
                        {hashtags.slice(0, 5).map((tag: string) => (
                          <span
                            key={tag}
                            className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(validacoes).length > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-2">Validações</div>
                      <div className="space-y-1">
                        {validacoes.tem_gancho !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={validacoes.tem_gancho ? 'text-green-400' : 'text-red-400'}>
                              {validacoes.tem_gancho ? '✓' : '✗'}
                            </span>
                            <span className="text-zinc-300">Gancho</span>
                          </div>
                        )}
                        {validacoes.tem_desenvolvimento !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={validacoes.tem_desenvolvimento ? 'text-green-400' : 'text-red-400'}>
                              {validacoes.tem_desenvolvimento ? '✓' : '✗'}
                            </span>
                            <span className="text-zinc-300">Desenvolvimento</span>
                          </div>
                        )}
                        {validacoes.tem_climax !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={validacoes.tem_climax ? 'text-green-400' : 'text-red-400'}>
                              {validacoes.tem_climax ? '✓' : '✗'}
                            </span>
                            <span className="text-zinc-300">Clímax</span>
                          </div>
                        )}
                        {validacoes.tem_cta !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={validacoes.tem_cta ? 'text-green-400' : 'text-red-400'}>
                              {validacoes.tem_cta ? '✓' : '✗'}
                            </span>
                            <span className="text-zinc-300">CTA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    EM_REVISAO: { label: 'Em Revisão', color: 'bg-yellow-600' },
    APROVADO: { label: 'Aprovado', color: 'bg-green-600' },
    REJEITADO: { label: 'Rejeitado', color: 'bg-red-600' },
    EM_PRODUCAO: { label: 'Em Produção', color: 'bg-purple-600' },
  }

  const config = status ? statusConfig[status] : { label: 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}
