import { REDES_API } from './redes-api'

/**
 * Redes com envio automático PAUSADO pelo dono — `pulso_core.configuracoes`, chave `linha_producao`,
 * campo `redes_pausadas` (ex.: ["youtube"]). Liga e desliga pelo banco, sem deploy.
 *
 * Nasceu em 17/09/2026: a partir de 15/09 os Shorts enviados por API pararam de ser distribuídos no
 * YouTube (2 a 9 views contra ~500 esperadas, sem aviso no Studio). O teste é subir à mão pelo Studio;
 * enquanto isso a API não pode continuar enviando — nem pelo cron, nem pelo remendo de rede faltante,
 * nem pelo botão.
 *
 * Falha FECHADA: se a leitura der erro, uma rede pausada voltaria a sair sem ninguém ver. Então erro de
 * leitura pausa todas as redes de API nesta chamada — o cron tenta de novo na hora seguinte.
 */
const PADRAO_SE_ERRO = [...REDES_API]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lerRedesPausadas(supabase: any): Promise<string[]> {
  const { data, error } = await supabase
    .schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle()
  if (error) return PADRAO_SE_ERRO
  try {
    const cfg = typeof data?.valor === 'string' ? JSON.parse(data.valor) : data?.valor
    return Array.isArray(cfg?.redes_pausadas) ? cfg.redes_pausadas.map(String) : []
  } catch {
    return PADRAO_SE_ERRO
  }
}
