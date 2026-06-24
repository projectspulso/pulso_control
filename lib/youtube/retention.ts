/**
 * Curva de retenção de um vídeo via YouTube Analytics API.
 *
 * Retorna o mesmo formato do retention_graph do Facebook que o app já consome
 * (objeto {"0":num,...,"40":num}, 41 pontos, escala FRAÇÃO 0..1 — o BI multiplica
 * por 100 ao exibir). audienceWatchRatio da API já vem nessa escala (0..1).
 */
export async function fetchYoutubeRetention(
  videoId: string,
  accessToken: string
): Promise<Record<string, number> | null> {
  const hoje = new Date().toISOString().slice(0, 10)
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
  url.searchParams.set('ids', 'channel==MINE')
  url.searchParams.set('startDate', '2024-01-01')
  url.searchParams.set('endDate', hoje)
  url.searchParams.set('metrics', 'audienceWatchRatio')
  url.searchParams.set('dimensions', 'elapsedVideoTimeRatio')
  url.searchParams.set('filters', `video==${videoId}`)

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!resp.ok) return null

  const data = await resp.json()
  const rows = (data?.rows || []) as Array<[number, number]>
  if (rows.length === 0) return null

  // re-amostra para 41 pontos (t = 0..40), casando elapsedVideoTimeRatio ~ t/40
  const graph: Record<string, number> = {}
  for (let t = 0; t <= 40; t++) {
    const alvo = t / 40
    let melhor = rows[0]
    let melhorDist = Math.abs(rows[0][0] - alvo)
    for (const row of rows) {
      const dist = Math.abs(row[0] - alvo)
      if (dist < melhorDist) {
        melhorDist = dist
        melhor = row
      }
    }
    graph[String(t)] = melhor[1]
  }

  // audienceWatchRatio é RELATIVO (1.0 = média; passa de 1 com rewatches no início).
  // Normaliza pelo ponto inicial pra virar "fração da audiência inicial que continua"
  // (começa em 1.0 e decai), igual à curva absoluta do Facebook — assim as duas redes
  // ficam comparáveis no mesmo gráfico do BI.
  const base = graph['0']
  if (base && base > 0) {
    for (let t = 0; t <= 40; t++) graph[String(t)] = graph[String(t)] / base
  }

  return graph
}
