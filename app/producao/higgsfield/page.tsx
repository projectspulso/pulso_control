import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Film, ImagePlus, ListChecks, Upload } from 'lucide-react'

import { ModoFocoBanner } from '@/components/modo-foco-banner'
import { MODO_FOCO, PULSO_MASCOTE } from '@/lib/config/modo-foco'

const blocos = [
  {
    titulo: 'Bloco 1 - Hook',
    duracao: '5 a 7s',
    objetivo: 'Abrir curiosidade sem entregar a resposta.',
    camera: 'slow push-in, subtle handheld tension, cinematic vertical frame',
  },
  {
    titulo: 'Bloco 2 - Contexto',
    duracao: '5 a 7s',
    objetivo: 'Mostrar o lugar, objeto ou pista principal.',
    camera: 'parallax movement, shallow depth of field, controlled reveal',
  },
  {
    titulo: 'Bloco 3 - Virada',
    duracao: '5 a 7s',
    objetivo: 'Criar surpresa, contradicao ou detalhe estranho.',
    camera: 'slow lateral tracking, dramatic light shift, focused subject',
  },
  {
    titulo: 'Bloco 4 - Fecho',
    duracao: '5 a 8s',
    objetivo: 'Fechar com pergunta, tensao ou convite para comentario.',
    camera: 'slow pull-back, atmospheric ending, clean negative space for captions',
  },
]

const checklist = [
  'Usar sempre 9:16 vertical.',
  'Manter a mesma imagem de referencia do Pulso ou do estilo do canal.',
  'Gerar 3 ou 4 blocos curtos, nao um take longo unico.',
  'Evitar texto dentro do video gerado; legenda entra na edicao.',
  'Evitar boca/lip sync do mascote no MVP.',
  'Exportar cada bloco com nome padronizado.',
  'Montar video final com audio, cortes e legenda fora do Higgsfield.',
  'Video final precisa ter mais de 15s e idealmente 20 a 35s no MVP.',
]

export default function HiggsfieldManualPage() {
  const promptBase = `Vertical 9:16 cinematic mystery short for ${MODO_FOCO.canalNome}. Use the uploaded reference image as visual identity guidance. ${PULSO_MASCOTE.papel}: unseen narrator presence, curious and slightly mysterious tone. Realistic atmosphere, strong subject clarity, no distorted faces, no readable text, no logos, no gore, no comedy style.`

  const negativePrompt = 'Avoid: low quality, blurry subject, warped hands, distorted face, extra limbs, text artifacts, subtitles, watermarks, logos, cartoon style, overexposed image, fast chaotic camera, lip sync, talking mascot.'

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/producao"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para producao
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                <Film className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Producao manual
                </p>
                <h1 className="text-4xl font-black text-white">Kit Higgsfield MVP</h1>
              </div>
            </div>
          </div>
        </div>

        <ModoFocoBanner detail="Use este kit somente para o canal foco. O objetivo e produzir o lote minimo sem esperar automacao de video." />

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Upload}
            title="Referencia"
            text="Suba imagem do Pulso, frame guia ou imagem de estilo. A mesma referencia deve atravessar todos os blocos."
          />
          <InfoCard
            icon={ImagePlus}
            title="Duracao"
            text="Para mais de 15s, gere blocos curtos e monte em edicao. Um take unico longo aumenta risco de deformacao."
          />
          <InfoCard
            icon={ListChecks}
            title="Aceite"
            text="So avanca para PRONTO_PUBLICACAO quando audio, imagem, legenda e ritmo estiverem revisados."
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Trava visual do video</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <TextBlock title="Prompt base" text={promptBase} />
            <TextBlock title="Negative prompt" text={negativePrompt} />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Estrutura para video acima de 15s</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {blocos.map((bloco, index) => (
              <div key={bloco.titulo} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                      Clip {index + 1} | {bloco.duracao}
                    </p>
                    <h3 className="mt-1 font-semibold text-white">{bloco.titulo}</h3>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">{bloco.objetivo}</p>
                <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-3 font-mono text-xs leading-relaxed text-zinc-300">
                  {promptBase} Scene goal: {bloco.objetivo} Camera: {bloco.camera}.
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Checklist manual antes de mover o card</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-yellow-100">
          <h2 className="text-lg font-semibold">Regra fria</h2>
          <p className="mt-2 text-sm opacity-90">
            O Pulso nao precisa aparecer animado em todos os takes. No MVP, ele pode existir como voz,
            assinatura visual e guia editorial. Se a animacao complexa atrasar o lote, ela esta errada para agora.
          </p>
        </section>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Upload
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <Icon className="mb-4 h-5 w-5 text-orange-300" />
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{text}</p>
    </div>
  )
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-200">{title}</h3>
      <div className="rounded-lg border border-zinc-800 bg-black/30 p-4 font-mono text-xs leading-relaxed text-zinc-300">
        {text}
      </div>
    </div>
  )
}
