import Link from 'next/link'
import { ArrowLeft, Bot, Brain, CheckCircle2, Clock, Film, Lock, Mic, ShieldCheck, Sparkles } from 'lucide-react'

/**
 * MOTOR DE PRODUÇÃO — documentação VIVA de como o PULSO produz vídeo hoje
 * (fluxo autônomo). Substitui o antigo "Kit Higgsfield MVP" (manual, aposentado).
 */

const fluxo = [
  { icon: Sparkles, quem: 'Auto-funil (cron)', etapa: 'Roteiro', desc: 'Gera o roteiro só de ideias que VOCÊ aprovou, mirando o déficit da agenda. Custo: só GPT.', gate: false },
  { icon: Lock, quem: 'VOCÊ', etapa: 'Aprovar roteiro', desc: 'Revisa e manda o roteiro pro áudio. Esse clique é a aprovação de produção.', gate: true },
  { icon: Mic, quem: 'App', etapa: 'Áudio + cenas', desc: 'ElevenLabs gera a narração (voz PULSO) e o cérebro escreve ~10 cenas + a legenda.', gate: false },
  { icon: Film, quem: 'Worker', etapa: 'Render + QC', desc: 'Veo 3.1 Lite gera os clipes, ffmpeg monta com a CTA do mascote, QC completo aprova.', gate: false },
  { icon: Lock, quem: 'VOCÊ', etapa: 'Publicar', desc: 'Publicação nas 5 redes só com o seu OK (IG/TikTok via app, YT/FB pelo navegador/kit, Kwai manual no celular).', gate: true },
]

const padrao = [
  ['Modelo', 'Veo 3.1 Lite · 9:16 · 8s · áudio OFF'],
  ['Custo', '~8 créditos/clipe (~R$2,16) · teto 600cr/dia (guard)'],
  ['Aposentado', 'Seedance (era 5,6× mais caro)'],
  ['Voz', 'ElevenLabs — voz PULSO oficial'],
  ['Montagem', 'ffmpeg local + CTA do mascote sincronizada'],
]

const travas = [
  'SOCCER, nunca futebol americano (bola redonda; sem capacete/bola oval).',
  'Sem pessoas/crianças nas cenas (o Veo recusa "kids/children").',
  'Sem texto legível, logos ou marcas no vídeo gerado.',
  'Fluidez: nenhuma cena estica > 8s; ~9-10 cenas por vídeo.',
  'CTA do mascote grande, sincronizada no trecho "Segue o Pulso".',
  'QC obrigatório: transcrição × roteiro + duração = áudio + frames.',
]

export default function MotorProducaoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link href="/producao" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar para produção
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Produção autônoma</p>
              <h1 className="text-3xl font-black text-white sm:text-4xl">Motor de Produção</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Como o PULSO produz vídeo hoje. A máquina faz o trabalho mecânico de ponta a ponta;
            você só aprova ideia, aprova roteiro e publica. <b className="text-zinc-300">Render manual no Higgsfield foi aposentado.</b>
          </p>
        </div>

        {/* FLUXO */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Brain className="h-5 w-5 text-violet-300" /> O fluxo (ideia → pronto)</h2>
          <div className="space-y-2">
            {fluxo.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.etapa} className={`flex items-start gap-3 rounded-lg border p-4 ${f.gate ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950/60'}`}>
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-zinc-600">{i + 1}</span>
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${f.gate ? 'text-amber-300' : 'text-violet-300'}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{f.etapa}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.gate ? 'bg-amber-500/20 text-amber-300' : 'bg-violet-500/15 text-violet-300'}`}>{f.quem}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-zinc-500">🟡 = gate humano (só você faz) · 🟣 = automático.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PADRÃO TÉCNICO */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Film className="h-5 w-5 text-orange-300" /> Padrão técnico</h2>
            <div className="space-y-2">
              {padrao.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 rounded-lg bg-zinc-950/60 px-4 py-2.5 text-sm">
                  <span className="shrink-0 font-semibold text-zinc-400">{k}</span>
                  <span className="text-right text-zinc-200">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* TRAVAS */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><ShieldCheck className="h-5 w-5 text-emerald-300" /> Travas embutidas</h2>
            <div className="space-y-2">
              {travas.map((t) => (
                <div key={t} className="flex gap-3 rounded-lg bg-zinc-950/60 p-3 text-sm text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ONDE RODA */}
        <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white"><Clock className="h-5 w-5 text-violet-300" /> Onde roda + controles</h2>
          <p className="text-sm text-zinc-300">
            O <b>cérebro</b> (gerar-cenas/roteiro) roda no app (Vercel). O <b>worker de render</b> roda nesta máquina via
            Agendador do Windows, <b>3×/dia (08:00 · 16:00 · 23:00)</b>, pegando o próximo item cena-ready da fila.
            Custo travado pelo <b>guard (600cr/dia)</b> e qualidade pelo <b>QC</b> — vídeo ruim não vira PRONTO.
          </p>
          <p className="mt-2 text-[11px] text-zinc-500">
            Desligar: desabilitar a tarefa &quot;PULSO Worker Render&quot; no Agendador, ou baixar o teto em configurações (orcamento_travas).
          </p>
        </section>
      </div>
    </div>
  )
}
