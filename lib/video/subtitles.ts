import type { SubtitleWord } from '@/remotion/PulsoVideo'

/**
 * Converte texto do roteiro em array de SubtitleWord com timing automático.
 * Distribui as palavras uniformemente pela duração total do áudio.
 */
export function buildSubtitles(
  texto: string,
  duracaoSegundos: number,
  fps = 30
): SubtitleWord[] {
  const palavras = texto
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  const totalFrames = duracaoSegundos * fps
  const framePorPalavra = totalFrames / palavras.length

  return palavras.map((word, i) => ({
    word,
    startFrame: Math.round(i * framePorPalavra),
    endFrame: Math.round((i + 1) * framePorPalavra),
  }))
}

/**
 * Seleciona pose do mascote baseado no tom/canal do conteúdo.
 */
export function selectPose(canal?: string, tone?: string): 1 | 2 | 3 | 4 | 5 {
  const s = (canal || tone || '').toLowerCase()
  if (s.includes('dark') || s.includes('mister') || s.includes('hist'))  return 5 // sério
  if (s.includes('kids') || s.includes('crianc') || s.includes('infan')) return 3 // animado
  if (s.includes('cool') || s.includes('tech') || s.includes('trend'))   return 4 // cool
  if (s.includes('calm') || s.includes('medit') || s.includes('relax'))  return 2 // relaxado
  return 1 // surpreso (default — gera curiosidade)
}

/**
 * Seleciona background baseado no canal.
 */
export function selectBackground(canal?: string): 1 | 2 | 3 | 4 | 5 {
  const s = (canal || '').toLowerCase()
  if (s.includes('dark'))    return 2
  if (s.includes('mister'))  return 3
  if (s.includes('hist'))    return 4
  if (s.includes('tech'))    return 5
  return 1
}
