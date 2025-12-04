'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoteiro, useAtualizarRoteiro, useDeletarRoteiro } from '@/lib/hooks/use-roteiros'
import { useCanais } from '@/lib/hooks/use-core'
import { useAudioDoRoteiro } from '@/lib/hooks/use-assets'
import { ErrorState } from '@/components/ui/error-state'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function RoteiroDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: roteiro, isLoading, isError, refetch } = useRoteiro(resolvedParams.id)
  const { data: canais } = useCanais()
  const { data: audio } = useAudioDoRoteiro(resolvedParams.id)
  
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

              {/* Status de Áudio */}
              {audio ? (
                <div className="mt-4 glass rounded-xl p-4 border border-green-500/20">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-xl">🎵</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-green-400">Áudio Gerado</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            audio.status === 'OK' 
                              ? 'bg-green-500/20 text-green-400' 
                              : audio.status === 'AGUARDANDO_MERGE'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {audio.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {audio.duracao_segundos}s • {audio.linguagem} • {audio.metadata?.voice || 'alloy'}
                        </p>
                      </div>
                      {audio.public_url && (
                        <a
                          href={audio.public_url}
                          download
                          className="glass glass-hover rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-zinc-300 transition-all"
                        >
                          ⬇️ Baixar
                        </a>
                      )}
                    </div>
                    
                    {/* Player de Áudio Integrado */}
                    {audio.public_url && (
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <audio 
                          controls 
                          className="w-full"
                          preload="metadata"
                        >
                          <source src={audio.public_url} type="audio/mpeg" />
                          Seu navegador não suporta reprodução de áudio.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ) : roteiro.status === 'APROVADO' ? (
                <div className="mt-4 glass rounded-xl p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-xl">⏳</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-400">Aguardando Geração de Áudio</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        WF02 verificará a cada 10 minutos
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
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
                {editando ? '✏️ Editando Roteiro' : '📄 Roteiro Completo'}
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
                <article className="
                  prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-zinc-700 prose-h1:pb-2
                  prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
                  prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                  prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-white prose-strong:font-semibold
                  prose-em:text-zinc-300 prose-em:italic
                  prose-ul:list-disc prose-ul:ml-6 prose-ul:text-zinc-300
                  prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-zinc-300
                  prose-li:mb-1
                  prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-400
                  prose-code:text-violet-400 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                  prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300 hover:prose-a:underline
                  prose-hr:border-zinc-700 prose-hr:my-6
                  prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-zinc-700
                  prose-thead:bg-zinc-800
                  prose-th:border prose-th:border-zinc-700 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium
                  prose-td:border prose-td:border-zinc-700 prose-td:px-3 prose-td:py-2
                  prose-img:rounded-lg prose-img:border prose-img:border-zinc-700
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {roteiro.conteudo_md || '*Sem conteúdo*'}
                  </ReactMarkdown>
                </article>
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Aprovação</h3>
                
                {roteiro.status === 'APROVADO' ? (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <div className="text-green-400 font-medium text-sm mb-1">Roteiro Aprovado</div>
                          <p className="text-xs text-zinc-400">
                            O workflow WF02 gerará automaticamente o áudio TTS deste roteiro a cada 10 minutos.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRejeitar}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      ✗ Reverter Aprovação
                    </button>
                  </div>
                ) : roteiro.status === 'REJEITADO' ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">❌</span>
                      <div>
                        <div className="text-red-400 font-medium text-sm mb-1">Roteiro Rejeitado</div>
                        {roteiro.metadata?.motivo_rejeicao && (
                          <p className="text-xs text-zinc-400 mt-1">
                            Motivo: {roteiro.metadata.motivo_rejeicao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          await atualizarRoteiro.mutateAsync({
                            id: resolvedParams.id,
                            updates: { status: 'APROVADO' } as any
                          })
                          refetch()
                        } catch (error) {
                          console.error('Erro ao aprovar roteiro:', error)
                        }
                      }}
                      disabled={atualizarRoteiro.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 font-medium"
                    >
                      {atualizarRoteiro.isPending ? '⏳ Aprovando...' : '✓ Aprovar Roteiro'}
                    </button>
                    <button
                      onClick={handleRejeitar}
                      className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      ✗ Rejeitar Roteiro
                    </button>
                  </div>
                )}
              </div>
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
