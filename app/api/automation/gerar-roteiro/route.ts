import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { extrairAncora, acharColisao, type ColisaoAncora } from '@/lib/automation/ancora'
import { varrerDuplicidade } from '@/lib/automation/vigia-duplicidade'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptGerarRoteiro, buildPromptLegendas } from '@/lib/automation/prompts'
import { contarFormas, desempenhoPorForma, escolherForma, INSTRUCAO_POR_FORMA } from '@/lib/automation/forma-hook'
import { validarRoteiro } from '@/lib/automation/ai-clients'
import { avaliarHook } from '@/lib/automation/hook-score'

/**
 * POST /api/automation/gerar-roteiro
 *
 * Gera roteiro a partir de uma ideia aprovada via GPT-4o.
 * Payload: { ideia_id: string, canal_id?: string }
 */
export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const payload = await request.json()
  const { ideia_id } = payload

  if (!ideia_id) {
    return NextResponse.json({ error: 'ideia_id é obrigatório' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Buscar ideia completa
    const { data: ideia, error: ideiaError } = await supabase
      .schema('pulso_content')
      .from('ideias')
      .select('*')
      .eq('id', ideia_id)
      .single()

    if (ideiaError || !ideia) {
      return NextResponse.json({ error: 'Ideia não encontrada' }, { status: 404 })
    }

    // Verificar se já existe roteiro para esta ideia
    const { data: existing } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .select('id')
      .eq('ideia_id', ideia_id)
      .limit(1)

    if (existing?.length > 0) {
      return NextResponse.json({
        error: 'Roteiro já existe para esta ideia',
        roteiro_id: existing[0].id,
      }, { status: 409 })
    }

    // Buscar canal
    const canalId = payload.canal_id || ideia.canal_id
    let canal = null

    if (canalId) {
      const { data: canalData } = await supabase
        .from('vw_pulso_canais')
        .select('id, nome, descricao, idioma, slug')
        .eq('id', canalId)
        .single()
      canal = canalData
    }

    if (!canal) {
      // Fallback: canal genérico
      canal = { id: canalId, nome: 'PULSO', descricao: '', idioma: 'pt-BR', slug: 'pulso' }
    }

    // Preparar contexto da ideia
    const ideiaCtx = {
      id: ideia.id,
      titulo: ideia.titulo,
      descricao: ideia.descricao,
      tags: ideia.tags,
      gancho_sugerido: ideia.metadata?.gancho_sugerido,
      tipo_formato: ideia.metadata?.tipo_formato,
      emocao_ancora: ideia.metadata?.emocao_ancora,
      gatilho_psicologico: ideia.gatilho_psicologico || ideia.metadata?.gatilho_psicologico,
      duracao_estimada: parseInt(ideia.metadata?.duracao_estimada) || 55,
    }

    // Aprendizado da audiência (loop fechado): ganchos campeões + tema×rede
    let aprendizado: string | undefined
    try {
      const { data: ap } = await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'aprendizado_cerebro')
        .maybeSingle()
      if (ap?.valor) aprendizado = JSON.parse(ap.valor).texto
    } catch {
      /* aprendizado é opcional */
    }

    // PRÓXIMO TEMA DA FILA (pro CTA teaser).
    //
    // BUG CORRIGIDO EM 30/07/2026 — o dono notou o CTA repetido e o rastro levou aqui. A consulta
    // pegava "a APROVADA de maior prioridade" e NÃO excluía as já publicadas. Como prioridade
    // quase nunca muda, dava sempre a MESMA ideia: os 12 roteiros mais recentes prometiam todos
    // "a curiosa história do método de estudo que desafiou Harvard" — um vídeo que já tinha sido
    // publicado em 19/07. Uma dúzia de vídeos prometendo um "próximo" que já passou.
    //
    // Agora: só ideias que estão REALMENTE por vir (têm pipeline e não foram publicadas), e
    // sorteadas entre as candidatas — senão o teaser volta a congelar num título só.
    let proximoTema: string | undefined
    try {
      const [{ data: emProducao }, { data: jaPublicadas }] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .select('ideia_id')
          .neq('status', 'PUBLICADO'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id'),
      ])
      const publicadas = new Set((jaPublicadas || []).map((m: { ideia_id: string }) => m.ideia_id))
      const candidatasId = [
        ...new Set(
          (emProducao || [])
            .map((p: { ideia_id: string | null }) => p.ideia_id)
            .filter((id: string | null): id is string => !!id && id !== ideia.id && !publicadas.has(id))
        ),
      ]
      if (candidatasId.length) {
        const { data: tits } = await supabase
          .schema('pulso_content')
          .from('ideias')
          .select('titulo')
          .in('id', candidatasId.slice(0, 40))
          .eq('status', 'APROVADA')
        const nomes = (tits || [])
          .map((t: { titulo: string | null }) => t.titulo)
          .filter((t: string | null): t is string => !!t)
        if (nomes.length) proximoTema = nomes[Math.floor(Math.random() * nomes.length)]
      }
    } catch {
      /* teaser é opcional */
    }

    // FORMA DO GANCHO POR RODÍZIO — a variável do experimento, decidida aqui e não pelo modelo.
    // Quando ele escolhia, convergia: curiosity_gap 25 usos contra 1 de pergunta_identificadora.
    // Sempre a menos usada até agora, então os braços enchem parelhos e ficam comparáveis.
    const [usosForma, desempForma] = await Promise.all([
      contarFormas(supabase),
      desempenhoPorForma(supabase),
    ])
    const { forma, motivo: motivoForma } = escolherForma(usosForma, desempForma)

    // Gerar roteiro via GPT
    const prompt = buildPromptGerarRoteiro(canal, ideiaCtx, undefined, aprendizado, proximoTema, {
      forma,
      instrucao: INSTRUCAO_POR_FORMA[forma],
    })
    const { content: roteiro, usage } = await callOpenAI(prompt, {
      temperature: 0.7,
      max_tokens: 2048,
    })

    if (!roteiro || roteiro.length < 50) {
      return NextResponse.json(
        { error: 'GPT retornou roteiro muito curto ou vazio' },
        { status: 422 }
      )
    }

    // Validar qualidade
    const duracaoAlvo = ideiaCtx.duracao_estimada || 35
    const qualidade = validarRoteiro(roteiro, duracaoAlvo)

    // Buscar config de auto-approve
    const { data: autoApproveConfig } = await supabase
      .schema('pulso_automation')
      .from('ai_config')
      .select('valor')
      .eq('chave', 'auto_approve_roteiro')
      .single()

    // TRAVA DE HOOK (Kaizen): nota 1-5 da 1ª frase. Hook <=2 NUNCA auto-aprova.
    const hook = avaliarHook(roteiro)

    const autoApprove = autoApproveConfig?.valor === true || autoApproveConfig?.valor === 'true'
    const autoApproveThreshold = 80
    // tem_cta é bloqueante: sem "segue/siga o PULSO" no fecho, o render não tem âncora pra
    // janela do mascote (regra PULSO-CTA) — roteiro assim só sai com aprovação humana.
    // TRAVA DE ÂNCORA — o último portão antes do dinheiro.
    //
    // A duplicidade era checada só no NASCIMENTO da ideia, pelo título. Em 02/09/2026 uma
    // varredura no acervo achou dois vídeos JÁ RENDERIZADOS e agendados que repetiam histórias
    // publicadas — com 10% de similaridade de título, invisíveis para aquela trava:
    //   #175 e #156 abrem os dois com "Em 2134 a.C., ... dois astrônomos chineses"
    //   #165 e #86  citam os dois "a psicóloga Bluma Zeigarnik", 1927
    // O roteiro é o último ponto em que barrar ainda é barato: depois dele vêm o áudio e o render.
    //
    // Colisão NÃO joga o roteiro fora — ele fica gravado e vai para aprovação humana com o motivo.
    // O que ela impede é a auto-aprovação, que é o que empurra o item para a esteira paga sozinho.
    let ancora: string | null = null
    let colisaoAncora: ColisaoAncora | null = null
    try {
      ancora = await extrairAncora(roteiro, (pr) =>
        callOpenAI(pr, { json_mode: true, temperature: 0, max_tokens: 200 }).then((r) => r.content)
      )
      if (ancora) {
        const { data: outras } = await supabase
          .schema('pulso_content')
          .from('ideias')
          .select('id, titulo, metadata, status')
          .neq('id', ideia.id)
        colisaoAncora = acharColisao(
          ancora,
          ((outras || []) as Array<{ id: string; titulo: string | null; metadata: { ancora?: string } | null; status: string }>)
            .filter((o) => o.status !== 'DESCARTADA')
            .map((o) => ({ id: o.id, titulo: o.titulo, ancora: o.metadata?.ancora ?? null }))
        )
      }
    } catch (e) {
      // âncora indisponível NÃO é "não tem âncora": não auto-aprova, mas também não inventa colisão
      console.error('[gerar-roteiro] checagem de âncora indisponível:', e)
      ancora = null
    }

    // SEGUNDA REDE, e ela não custa nada: a varredura de termos raros compara o roteiro NOVO com
    // o corpo de todos os outros. Funciona sem âncora nenhuma no acervo — foi ela que achou, em
    // dados reais, os pares que a trava de título não via (#25×#26 com 8 termos em comum e 0% de
    // título; #8×#108 unidos por "sullivan"). Enquanto o acervo antigo não tem âncora gravada,
    // esta é a rede que segura; depois as duas somam.
    let gemeoNoAcervo: { titulo: string; termos: string[] } | null = null
    try {
      const { data: outrosRot } = await supabase
        .schema('pulso_content')
        .from('roteiros')
        .select('ideia_id, conteudo_md')
        .neq('ideia_id', ideia.id)
      const { data: outrasIdeias } = await supabase
        .schema('pulso_content')
        .from('ideias')
        .select('id, titulo, status, formato')

      const titulos = new Map(
        ((outrasIdeias || []) as Array<{ id: string; titulo: string | null; status: string; formato: string | null }>)
          .filter((i) => i.status !== 'DESCARTADA' && i.formato !== 'longo')
          .map((i) => [i.id, i.titulo])
      )
      const itens = [
        { id: ideia.id, titulo: ideia.titulo as string, corpo: roteiro, publicado: false, numero: null },
        ...((outrosRot || []) as Array<{ ideia_id: string; conteudo_md: string | null }>)
          .filter((r) => titulos.has(r.ideia_id))
          .map((r) => ({
            id: r.ideia_id,
            titulo: titulos.get(r.ideia_id) ?? null,
            corpo: r.conteudo_md,
            publicado: true,
            numero: null,
          })),
      ]
      const par = varrerDuplicidade(itens).find((x) => x.a.id === ideia.id || x.b.id === ideia.id)
      if (par) {
        const outro = par.a.id === ideia.id ? par.b : par.a
        gemeoNoAcervo = { titulo: outro.titulo, termos: par.termosComuns }
      }
    } catch (e) {
      console.error('[gerar-roteiro] varredura de duplicidade indisponível:', e)
    }

    const shouldAutoApprove =
      autoApprove && qualidade.score >= autoApproveThreshold && hook.nota >= 3 && qualidade.tem_cta &&
      !colisaoAncora && !gemeoNoAcervo

    // NUMERO AUTOMÁTICO: respeita o número já gravado na ideia; senão, próximo da sequência canônica.
    let numero: number | null =
      typeof ideia.metadata?.numero === 'number' ? ideia.metadata.numero : null
    if (numero == null) {
      try {
        // maxNumero de TODAS as fontes (roteiros + ideias + pipeline) — antes lia só roteiros,
        // e os números do lote de junho viviam em ideias/pipeline, então julho recomeçava baixo
        // e colidia (6 números duplicados até 17/07). Agora o próximo é sempre > o real máximo.
        const [rotN, ideiasN, pipeN] = await Promise.all([
          supabase.schema('pulso_content').from('roteiros').select('metadata').not('metadata->numero', 'is', null),
          supabase.schema('pulso_content').from('ideias').select('metadata').not('metadata->numero', 'is', null),
          supabase.schema('pulso_content').from('pipeline_producao').select('metadata').not('metadata->numero', 'is', null),
        ])
        let maxNumero = 0
        for (const src of [rotN.data, ideiasN.data, pipeN.data]) {
          for (const r of (src || [])) {
            const n = Number((r?.metadata as { numero?: unknown })?.numero)
            if (Number.isFinite(n) && n > maxNumero) maxNumero = n
          }
        }
        numero = maxNumero + 1
      } catch (e) {
        console.error('[gerar-roteiro] falha ao calcular numero automático:', e)
        numero = null
      }
    }

    // Salvar roteiro
    const { data: saved, error: saveError } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .insert({
        ideia_id: ideia.id,
        canal_id: canal.id,
        titulo: ideia.titulo,
        conteudo_md: roteiro,
        versao: 1,
        duracao_estimado_segundos: qualidade.duracao_estimada,
        status: shouldAutoApprove ? 'APROVADO' : 'RASCUNHO',
        linguagem: canal.idioma,
        nota_hook: hook.nota,
        metadata: {
          ...(numero != null ? { numero } : {}),
          hook_motivos: hook.motivos,
          // A forma fica NO ROTEIRO, não só na ideia: o roteiro é o texto que vira narração, e
          // era exatamente esse elo que faltava para cruzar gancho com retenção.
          forma_hook: forma,
          // rodizio (ainda medindo) | exploracao | melhor (ja aprendeu)
          forma_hook_motivo: motivoForma,
          ai_modelo: 'gpt-4o',
          gerado_em: new Date().toISOString(),
          gerado_via: 'automation',
          prompt_version: '5.0',
          quality_score: qualidade.score,
          validacoes: qualidade,
          auto_aprovado: shouldAutoApprove,
          palavras_total: qualidade.palavras,
          total_caracteres: roteiro.length,
          total_paragrafos: roteiro.split('\n\n').filter(Boolean).length,
          tokens_usados: usage,
        },
      })
      .select('id, titulo, status, metadata')
      .single()

    if (saveError) {
      return NextResponse.json(
        { error: `Erro ao salvar roteiro: ${saveError.message}` },
        { status: 500 }
      )
    }

    // NUMERO AUTOMÁTICO: denormaliza na ideia (sem sobrescrever se já existia)
    if (numero != null && typeof ideia.metadata?.numero !== 'number') {
      try {
        await supabase
          .schema('pulso_content')
          .from('ideias')
          .update({ metadata: { ...(ideia.metadata || {}), numero } })
          .eq('id', ideia.id)
      } catch (e) {
        console.error('[gerar-roteiro] falha ao gravar numero na ideia:', e)
      }
    }

    // LEGENDA AUTOMÁTICA (best-effort): gera legendas multi-rede e grava caption no pipeline.
    // Falha aqui NUNCA quebra a criação do roteiro.
    let legendas: {
      legenda_ig_fb?: string
      titulo_yt?: string
      descricao_yt?: string
      legenda_tiktok?: string
    } | null = null
    try {
      const promptLeg = buildPromptLegendas(canal, ideiaCtx, roteiro)
      const { content: legRaw } = await callOpenAI(promptLeg, {
        temperature: 0.8,
        max_tokens: 500,
        json_mode: true,
      })
      const jsonStr = legRaw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed === 'object') {
        legendas = {
          legenda_ig_fb: parsed.legenda_ig_fb || undefined,
          titulo_yt: parsed.titulo_yt || undefined,
          descricao_yt: parsed.descricao_yt || undefined,
          legenda_tiktok: parsed.legenda_tiktok || undefined,
        }
      }
    } catch (e) {
      console.error('[gerar-roteiro] geração de legenda falhou (segue sem quebrar):', e)
    }

    // Persiste legendas no roteiro (metadata.legendas)
    if (legendas) {
      try {
        await supabase
          .schema('pulso_content')
          .from('roteiros')
          .update({ metadata: { ...(saved?.metadata || {}), legendas } })
          .eq('id', saved.id)
      } catch (e) {
        console.error('[gerar-roteiro] falha ao salvar legendas no roteiro:', e)
      }
    }

    // A ÂNCORA FICA GUARDADA na ideia: daqui em diante a checagem é consulta, não chamada de IA.
    if (ancora) {
      try {
        await supabase
          .schema('pulso_content')
          .from('ideias')
          .update({ metadata: { ...(ideia.metadata || {}), ancora } })
          .eq('id', ideia.id)
      } catch (e) {
        console.error('[gerar-roteiro] falha ao gravar âncora na ideia:', e)
      }
    }

    // mantém o kanban: garante entrada no pipeline (AGUARDANDO_ROTEIRO até aprovação; ROTEIRO_PRONTO se auto-aprovado)
    // denormaliza numero + caption (lido pelo /publicar) no pipeline_producao.metadata
    {
      const { data: pipeExist } = await supabase
        .schema('pulso_content')
        .from('pipeline_producao')
        .select('id, metadata')
        .eq('ideia_id', ideia.id)
        .limit(1)
      const statusPipe = shouldAutoApprove ? 'ROTEIRO_PRONTO' : 'AGUARDANDO_ROTEIRO'
      const metaExtra: Record<string, unknown> = {}
      if (numero != null) metaExtra.numero = numero
      if (gemeoNoAcervo) {
        metaExtra.gemeo_no_acervo = {
          titulo: gemeoNoAcervo.titulo,
          termos: gemeoNoAcervo.termos,
          quando: new Date().toISOString(),
        }
      }
      if (colisaoAncora) {
        metaExtra.colisao_ancora = {
          ancora: colisaoAncora.ancora,
          colide_com: colisaoAncora.colideCom.titulo,
          quando: new Date().toISOString(),
        }
      }
      if (legendas?.legenda_ig_fb) metaExtra.caption = legendas.legenda_ig_fb
      if (pipeExist && pipeExist.length > 0) {
        await supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .update({
            roteiro_id: saved.id,
            status: statusPipe,
            metadata: { ...(pipeExist[0].metadata || {}), ...metaExtra },
          })
          .eq('id', pipeExist[0].id)
      } else {
        await supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .insert({ ideia_id: ideia.id, roteiro_id: saved.id, status: statusPipe, prioridade: 5,
            metadata: { criado_por: 'automation', ...metaExtra } })
      }
    }

    return NextResponse.json({
      success: true,
      roteiro_id: saved?.id,
      titulo: saved?.titulo,
      status: saved?.status,
      quality_score: qualidade.score,
      auto_aprovado: shouldAutoApprove,
      ancora,
      colisao_ancora: colisaoAncora
        ? { ancora: colisaoAncora.ancora, colide_com: colisaoAncora.colideCom.titulo }
        : null,
      gemeo_no_acervo: gemeoNoAcervo,
      aviso_ancora: colisaoAncora
        ? `Conta a mesma história de "${colisaoAncora.colideCom.titulo}" — foi para aprovação humana em vez de seguir para a esteira.`
        : gemeoNoAcervo
          ? `Divide ${gemeoNoAcervo.termos.length} termos raros com "${gemeoNoAcervo.titulo}" (${gemeoNoAcervo.termos.slice(0, 4).join(', ')}) — pode ser a mesma história. Foi para aprovação humana.`
          : ancora == null
            ? 'Não consegui extrair a âncora deste roteiro (checagem de IA indisponível).'
            : null,
      duracao_estimada: qualidade.duracao_estimada,
      palavras: qualidade.palavras,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
