'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCanais, useSeriesPorCanal } from '@/lib/hooks/use-core'
import { useCriarIdeia } from '@/lib/hooks/use-ideias'
import Link from 'next/link'

export default function NovaIdeiaPage() {
  const router = useRouter()
  const { data: canais } = useCanais()
  const [canalSelecionado, setCanalSelecionado] = useState<string>('')
  const { data: series } = useSeriesPorCanal(canalSelecionado || null)
  
  const criarIdeia = useCriarIdeia()

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    canal_id: '',
    serie_id: '',
    prioridade: 5,
    origem: 'MANUAL',
    status: 'RASCUNHO',
    tags: [] as string[],
    linguagem: 'pt-BR'
  })

  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent, status: 'RASCUNHO' | 'APROVADA') => {
    e.preventDefault()

    try {
      await criarIdeia.mutateAsync({
        ...formData,
        canal_id: formData.canal_id || null,
        serie_id: formData.serie_id || null,
        status: status as any,
        metadata: {
          tipo_formato: 'curiosidade_rapida',
          duracao_alvo: 30
        }
      } as any)

      router.push('/ideias')
    } catch (error) {
      console.error('Erro ao criar ideia:', error)
      alert('Erro ao criar ideia. Verifique o console.')
    }
  }

  const adicionarTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removerTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/ideias"
            className="text-violet-400 hover:text-violet-300 text-sm mb-4 inline-block"
          >
            ← Voltar para ideias
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">💡 Nova Ideia</h1>
          <p className="text-zinc-400">
            Crie uma nova ideia de conteúdo para os canais PULSO
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Título da Ideia *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: O Mistério do Triângulo das Bermudas"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a ideia com detalhes. O que será abordado? Qual o gancho? Quais fatos interessantes?"
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Quanto mais detalhada, melhor será o roteiro gerado pela IA
            </p>
          </div>

          {/* Canal e Série */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Canal
              </label>
              <select
                value={formData.canal_id}
                onChange={(e) => {
                  setFormData({ ...formData, canal_id: e.target.value, serie_id: '' })
                  setCanalSelecionado(e.target.value)
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Selecione um canal</option>
                {canais?.map(canal => (
                  <option key={canal.id} value={canal.id}>
                    {canal.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Série
              </label>
              <select
                value={formData.serie_id}
                onChange={(e) => setFormData({ ...formData, serie_id: e.target.value })}
                disabled={!canalSelecionado}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione uma série</option>
                {series?.map(serie => (
                  <option key={serie.id} value={serie.id}>
                    {serie.nome}
                  </option>
                ))}
              </select>
              {!canalSelecionado && (
                <p className="text-xs text-zinc-500 mt-1">
                  Selecione um canal primeiro
                </p>
              )}
            </div>
          </div>

          {/* Prioridade e Origem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Prioridade (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                1 = baixa, 10 = urgente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Origem
              </label>
              <select
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="MANUAL">Manual</option>
                <option value="IA">IA/Automática</option>
                <option value="FEEDBACK">Feedback de Métricas</option>
                <option value="TRENDING">Trending Topics</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    adicionarTag()
                  }
                }}
                placeholder="Digite uma tag e pressione Enter"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={adicionarTag}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-violet-600/20 text-violet-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removerTag(tag)}
                      className="hover:text-violet-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'RASCUNHO')}
              disabled={criarIdeia.isPending}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {criarIdeia.isPending ? 'Salvando...' : 'Salvar como Rascunho'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'APROVADA')}
              disabled={criarIdeia.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {criarIdeia.isPending ? 'Salvando...' : 'Salvar e Aprovar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
