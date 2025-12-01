'use client'

import { useConteudosProntos } from '@/lib/hooks/use-calendario'
import { usePublicarAgora, useAgendarPublicacao } from '@/lib/hooks/use-n8n'
import { useState } from 'react'
import { Calendar, Clock, CheckCircle2, Sparkles, ExternalLink, Youtube, Instagram, Music2 } from 'lucide-react'
import { ErrorState } from '@/components/ui/error-state'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default function PublicarPage() {
  const { data: conteudos, isLoading, isError, refetch } = useConteudosProntos()
  const publicarAgora = usePublicarAgora()
  const agendarPublicacao = useAgendarPublicacao()
  
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horaAgendamento, setHoraAgendamento] = useState('')

  const toggleSelecao = (id: string) => {
    const novos = new Set(selecionados)
    if (novos.has(id)) {
      novos.delete(id)
    } else {
      novos.add(id)
    }
    setSelecionados(novos)
  }

  const selecionarTodos = () => {
    if (selecionados.size === conteudos?.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(conteudos?.map(c => c.pipeline_id) || []))
    }
  }

  const handlePublicarAgora = async () => {
    if (selecionados.size === 0) return
    
    if (!confirm(`Publicar ${selecionados.size} conteúdo(s) agora em todas as plataformas?`)) return

    try {
      await publicarAgora.mutateAsync({
        pipelineIds: Array.from(selecionados),
        plataformas: ['tiktok', 'youtube', 'instagram']
      })
      
      alert(`✅ ${selecionados.size} conteúdo(s) enviados para publicação!`)
      setSelecionados(new Set())
    } catch (error) {
      console.error('Erro ao publicar:', error)
      alert('❌ Erro ao publicar conteúdos. Verifique o console.')
    }
  }

  const handleAgendar = () => {
    if (selecionados.size === 0) return
    setMostrarModalAgendar(true)
  }

  const confirmarAgendamento = async () => {
    if (!dataAgendamento || !horaAgendamento) {
      alert('Preencha data e hora!')
      return
    }

    const dataHora = `${dataAgendamento}T${horaAgendamento}:00`

    try {
      // Agendar cada um individualmente (ou você pode criar um endpoint para batch)
      for (const pipelineId of Array.from(selecionados)) {
        await agendarPublicacao.mutateAsync({
          pipelineId,
          dataHora,
          plataformas: ['tiktok', 'youtube', 'instagram']
        })
      }
      
      alert(`✅ ${selecionados.size} conteúdo(s) agendados para ${format(new Date(dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`)
      setSelecionados(new Set())
      setMostrarModalAgendar(false)
      setDataAgendamento('')
      setHoraAgendamento('')
    } catch (error) {
      console.error('Erro ao agendar:', error)
      alert('❌ Erro ao agendar publicações. Verifique o console.')
    }
  }

  const getIconePlataforma = (canal: string) => {
    const nome = canal.toLowerCase()
    if (nome.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />
    if (nome.includes('instagram') || nome.includes('reels')) return <Instagram className="h-4 w-4 text-pink-500" />
    if (nome.includes('tiktok')) return <Music2 className="h-4 w-4 text-cyan-500" />
    return <Sparkles className="h-4 w-4 text-violet-500" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="skeleton h-8 w-32 mx-auto" />
            <div className="skeleton h-4 w-48 mx-auto" />
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
            title="Erro ao carregar conteúdos"
            message="Não foi possível carregar os conteúdos prontos para publicação. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent flex items-center gap-3">
              🚀 Publicar Conteúdo
            </h1>
            <p className="text-zinc-400 mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {conteudos?.length || 0} conteúdos prontos para publicação
            </p>
          </div>
          
          {selecionados.size > 0 && (
            <div className="flex gap-3 animate-slide-in-right">
              <button 
                onClick={handleAgendar}
                disabled={agendarPublicacao.isPending}
                className="glass glass-hover rounded-xl px-6 py-3 font-semibold bg-linear-to-r from-violet-600 to-purple-600 text-white border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="h-4 w-4" />
                {agendarPublicacao.isPending ? 'Agendando...' : `Agendar ${selecionados.size}`}
              </button>
              <button 
                onClick={handlePublicarAgora}
                disabled={publicarAgora.isPending}
                className="glass glass-hover rounded-xl px-6 py-3 font-semibold bg-linear-to-r from-green-600 to-emerald-600 text-white border-green-500/50 hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {publicarAgora.isPending ? 'Publicando...' : 'Publicar Agora'}
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="glass glass-hover rounded-2xl p-6 group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-zinc-400">Prontos</span>
            </div>
            <p className="text-3xl font-bold text-white">{conteudos?.length || 0}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-zinc-400">Agendados</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {conteudos?.filter(c => c.data_publicacao_planejada).length || 0}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <span className="text-sm text-zinc-400">Selecionados</span>
            </div>
            <p className="text-3xl font-bold text-white">{selecionados.size}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-zinc-400">Hoje</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {conteudos?.filter(c => {
                if (!c.data_publicacao_planejada) return false
                const hoje = new Date().toDateString()
                const dataConteudo = new Date(c.data_publicacao_planejada).toDateString()
                return hoje === dataConteudo
              }).length || 0}
            </p>
          </div>
        </div>

        {/* Lista de Conteúdos */}
        {!conteudos || conteudos.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum conteúdo pronto</h3>
            <p className="text-zinc-500 mb-4">
              Ainda não há conteúdos marcados como "Pronto para Publicação"
            </p>
            <Link
              href="/producao"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              Ir para Pipeline
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            {/* Header da tabela */}
            <div className="border-b border-zinc-800 bg-zinc-900/50">
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-zinc-400">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selecionados.size === conteudos.length}
                    onChange={selecionarTodos}
                    className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-violet-500"
                  />
                </div>
                <div className="col-span-5">Título</div>
                <div className="col-span-2">Canal</div>
                <div className="col-span-2">Data/Hora</div>
                <div className="col-span-1">Prioridade</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-zinc-800">
              {conteudos.map((conteudo) => {
                const selecionado = selecionados.has(conteudo.pipeline_id)
                
                return (
                  <div
                    key={conteudo.pipeline_id}
                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-zinc-800/50 transition-colors ${
                      selecionado ? 'bg-violet-600/10' : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => toggleSelecao(conteudo.pipeline_id)}
                        className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-violet-500"
                      />
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium line-clamp-1">
                          {conteudo.ideia}
                        </h3>
                        {conteudo.serie && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Série: {conteudo.serie}
                          </p>
                        )}
                      </div>
                      {conteudo.is_piloto && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                          ⭐ Piloto
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {getIconePlataforma(conteudo.canal)}
                      <span className="text-sm text-zinc-300 line-clamp-1">
                        {conteudo.canal}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-400">
                      {conteudo.data_publicacao_planejada ? (
                        <>
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <div>
                            <div className="text-white">
                              {format(new Date(conteudo.data_publicacao_planejada), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            {conteudo.hora_publicacao && (
                              <div className="text-xs text-zinc-500">
                                {conteudo.hora_publicacao.substring(0, 5)}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-500">Sem data</span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        (conteudo.prioridade || 5) >= 8 ? 'bg-red-600/20 text-red-400' :
                        (conteudo.prioridade || 5) >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-zinc-700/20 text-zinc-400'
                      }`}>
                        P{conteudo.prioridade || 5}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button className="p-2 text-violet-400 hover:bg-violet-600/10 rounded-lg transition-colors">
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-green-400 hover:bg-green-600/10 rounded-lg transition-colors">
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Footer */}
        {conteudos && conteudos.length > 0 && (
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-1">
                  Publicação Automatizada
                </h4>
                <p className="text-sm text-zinc-400">
                  Os conteúdos agendados serão publicados automaticamente via n8n nos horários planejados.
                  Para publicar manualmente, selecione os itens e clique em "Publicar Agora".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Agendamento */}
        {mostrarModalAgendar && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-4">
                📅 Agendar Publicação
              </h3>
              
              <p className="text-zinc-400 text-sm mb-6">
                Agendando {selecionados.size} conteúdo(s) para publicação automática
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Data</label>
                  <input
                    type="date"
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Hora</label>
                  <input
                    type="time"
                    value={horaAgendamento}
                    onChange={(e) => setHoraAgendamento(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-violet-600/10 border border-violet-600/20 rounded-lg p-3">
                  <p className="text-xs text-violet-400">
                    ℹ️ O n8n publicará automaticamente no horário agendado em todas as plataformas configuradas
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalAgendar(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAgendamento}
                  disabled={!dataAgendamento || !horaAgendamento || agendarPublicacao.isPending}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {agendarPublicacao.isPending ? 'Agendando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
