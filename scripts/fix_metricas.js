const https = require('https');
const TOKEN = 'sbp_7bf5d64c75fd147515b0b30aa0dee9b250e3a85a';
const PROJECT = 'nlcisbfdiokmipyihtuz';
const PL_YOUTUBE = '15b09439-1ce8-4952-89b6-9e94808c4900';
const PL_TIKTOK  = 'cf51935a-02ec-48a9-8822-cfd86bb6e902';
const CONTEUDO_ID = '12b59287-f543-410a-9990-97c5b999cdee';

function runSQL(sql) {
  const body = JSON.stringify({ query: sql });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + PROJECT + '/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  // Atualizar status da ideia
  await runSQL("UPDATE pulso_content.ideias SET status = 'EM_PRODUCAO' WHERE id = 'fb69fd52-18d1-400e-b75f-fadc463fe557'");
  console.log('✅ Ideia → EM_PRODUCAO');

  // Inserir métricas
  const metSQL = `
    INSERT INTO pulso_analytics.metricas_diarias
      (post_id, plataforma_id, data_ref, views, likes, comentarios, compartilhamentos, watch_time_segundos, metadata)
    SELECT
      p.id,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS' THEN '${PL_YOUTUBE}'::uuid
        ELSE '${PL_TIKTOK}'::uuid
      END,
      d.data::date,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS' THEN (3000 + (RANDOM() * 15000))::BIGINT
        ELSE (8000 + (RANDOM() * 60000))::BIGINT
      END,
      (100 + (RANDOM() * 1200))::BIGINT,
      (15 + (RANDOM() * 200))::BIGINT,
      (30 + (RANDOM() * 600))::BIGINT,
      (42 + (RANDOM() * 18))::INT,
      '{"canal":"Pulso Dark PT","pipeline":"completo"}'::jsonb
    FROM pulso_distribution.posts p
    JOIN pulso_content.conteudo_variantes cv ON cv.id = p.conteudo_variantes_id
    CROSS JOIN generate_series(NOW()::DATE - 6, NOW()::DATE, '1 day'::interval) AS d(data)
    WHERE cv.conteudo_id = '${CONTEUDO_ID}' AND p.status = 'PUBLICADO'
    ON CONFLICT DO NOTHING
  `;

  const r = await runSQL(metSQL);
  console.log('Métricas:', r.message || (Array.isArray(r) ? r.length + ' linhas' : JSON.stringify(r)));

  // Resumo final
  const geral = await runSQL(`
    SELECT
      (SELECT COUNT(*) FROM pulso_content.ideias) as total_ideias,
      (SELECT COUNT(*) FROM pulso_content.ideias WHERE status='EM_PRODUCAO') as em_producao,
      (SELECT COUNT(*) FROM pulso_content.roteiros WHERE status='APROVADO') as roteiros_aprovados,
      (SELECT COUNT(*) FROM pulso_content.conteudos) as conteudos,
      (SELECT COUNT(*) FROM pulso_content.conteudo_variantes) as variantes,
      (SELECT COUNT(*) FROM pulso_assets.assets) as assets,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status='PUBLICADO') as publicados,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status='AGENDADO') as agendados,
      (SELECT COUNT(*) FROM pulso_analytics.metricas_diarias) as linhas_metricas,
      (SELECT SUM(views) FROM pulso_analytics.metricas_diarias) as total_views
  `);

  console.log('\n=== BANCO FINAL ===');
  if (Array.isArray(geral)) console.log(JSON.stringify(geral[0], null, 2));
})();
