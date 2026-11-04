'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ImagePlus, Loader2, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Assunto } from '@/lib/hooks/use-bastidores'

const CAMPO = 'w-full rounded-lg border border-(--pulso-border) bg-(--pulso-surface-raised) px-3 py-2 text-sm text-(--pulso-text) placeholder:text-(--pulso-text-subtle) focus:border-(--pulso-action) focus:outline-none'
const BOTAO = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50'

/** Aprovar, editar o texto e anexar imagens. O dono e o Limelight completam o que o app rascunhou. */
export function BastidoresEditor({ assunto }: { assunto: Assunto }) {
  const qc = useQueryClient()
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState({ titulo: assunto.titulo, resumo: assunto.resumo, corpo_md: assunto.corpo_md, episodio: assunto.episodio || '' })
  const [legenda, setLegenda] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function gravar(campos: Partial<Assunto>, rotulo: string) {
    setOcupado(rotulo); setErro(null)
    const { error } = await supabase.schema('pulso_content').from('bastidores_assuntos')
      .update({ ...campos, atualizado_em: new Date().toISOString() }).eq('id', assunto.id)
    setOcupado(null)
    if (error) { setErro(error.message); return false }
    await qc.invalidateQueries({ queryKey: ['bastidores'] })
    return true
  }

  async function anexar(arquivo: File) {
    setOcupado('imagem'); setErro(null)
    const ext = (arquivo.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    const caminho = `${assunto.slug}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('bastidores').upload(caminho, arquivo, { contentType: arquivo.type })
    if (error) { setOcupado(null); setErro(`envio da imagem: ${error.message}`); return }
    const ok = await gravar({ imagens: [...assunto.imagens, { caminho, legenda: legenda.trim() || undefined }] }, 'imagem')
    if (ok) setLegenda('')
  }

  // tira da página, não apaga o arquivo: fica no bucket se alguém precisar dele depois
  const tirarImagem = (caminho: string) => gravar({ imagens: assunto.imagens.filter((i) => i.caminho !== caminho) }, 'imagem')

  return (
    <section className="rounded-2xl border border-dashed border-(--pulso-border) bg-(--pulso-surface) p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-semibold text-(--pulso-text)">Editar assunto</h2>
        {assunto.status === 'rascunho' ? (
          <button type="button" disabled={!!ocupado} onClick={() => gravar({ status: 'aprovado' }, 'status')}
            className={`${BOTAO} bg-(--pulso-ok) text-(--pulso-on-action)`}>
            {ocupado === 'status' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprovar
          </button>
        ) : (
          <button type="button" disabled={!!ocupado} onClick={() => gravar({ status: 'rascunho' }, 'status')}
            className={`${BOTAO} border border-(--pulso-border) text-(--pulso-text-muted)`}>
            Voltar para rascunho
          </button>
        )}
        <button type="button" onClick={() => setEditando((e) => !e)} className={`${BOTAO} border border-(--pulso-border) text-(--pulso-text-muted)`}>
          {editando ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />} {editando ? 'Fechar' : 'Editar texto'}
        </button>
      </div>

      {editando && (
        <div className="mt-3 space-y-2">
          <input className={CAMPO} value={rascunho.titulo} onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))} aria-label="Título" />
          <textarea className={CAMPO} rows={2} value={rascunho.resumo} onChange={(e) => setRascunho((r) => ({ ...r, resumo: e.target.value }))} aria-label="Resumo do card" />
          <textarea className={`${CAMPO} font-mono text-xs`} rows={14} value={rascunho.corpo_md} placeholder="## O que aconteceu&#10;..."
            onChange={(e) => setRascunho((r) => ({ ...r, corpo_md: e.target.value }))} aria-label="Texto do assunto em Markdown" />
          <input className={CAMPO} value={rascunho.episodio} placeholder="Ficha de episódio (ex.: T01E11)"
            onChange={(e) => setRascunho((r) => ({ ...r, episodio: e.target.value }))} aria-label="Ficha de episódio" />
          <button type="button" disabled={!!ocupado || !rascunho.titulo.trim() || !rascunho.resumo.trim()}
            onClick={async () => { if (await gravar({ ...rascunho, episodio: rascunho.episodio.trim() || null }, 'texto')) setEditando(false) }}
            className={`${BOTAO} bg-(--pulso-action) text-(--pulso-on-action)`}>
            {ocupado === 'texto' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar texto
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input className={`${CAMPO} max-w-xs`} value={legenda} placeholder="Legenda da imagem (opcional)" onChange={(e) => setLegenda(e.target.value)} aria-label="Legenda da imagem" />
        <label className={`${BOTAO} cursor-pointer border border-(--pulso-border) text-(--pulso-text-muted) hover:text-(--pulso-text)`}>
          {ocupado === 'imagem' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Anexar imagem
          <input type="file" accept="image/*" className="sr-only" disabled={!!ocupado}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) anexar(f) }} />
        </label>
      </div>
      {assunto.imagens.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-(--pulso-text-subtle)">
          {assunto.imagens.map((i) => (
            <li key={i.caminho} className="flex items-center gap-2">
              <span className="truncate">{i.legenda || i.caminho}</span>
              <button type="button" onClick={() => tirarImagem(i.caminho)} disabled={!!ocupado} className="text-(--pulso-danger) hover:underline">tirar da página</button>
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="mt-2 text-xs text-(--pulso-danger)">Não salvou: {erro}</p>}
    </section>
  )
}
