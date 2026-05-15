const https = require('https');
const TOKEN = 'sbp_7bf5d64c75fd147515b0b30aa0dee9b250e3a85a';
const PROJECT = 'nlcisbfdiokmipyihtuz';

function runSQL(sql, label) {
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
      res.on('end', () => {
        const p = JSON.parse(d);
        if (p.message) console.log((label || '') + ' ERRO:', p.message.slice(0, 200));
        else console.log((label || '') + ' OK:', JSON.stringify(p).slice(0, 150));
        resolve(p);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const CP_YOUTUBE = '7fe7a78d-53ae-4a7a-b4a5-9e4d8c7f4692';
const CP_TIKTOK  = 'de71b711-1a9d-45d9-b8fb-23e1566b9bad';
const CP_INSTA   = '7e6647a0-b3de-4bf6-99c2-ebebbf8952d4';
const PL_YOUTUBE = '15b09439-1ce8-4952-89b6-9e94808c4900';
const PL_TIKTOK  = 'cf51935a-02ec-48a9-8822-cfd86bb6e902';
const PL_INSTA   = '02b97345-02c6-4e04-a654-1cbcb1a879f0';
const ROTEIRO_1  = '02f89f7b-85be-4047-a78e-621b751fa978';

(async () => {
  console.log('=== SEED PARTE 2: POSTS + METRICAS ===\n');

  // Buscar IDs das variantes
  const vars = await runSQL(`
    SELECT cv.id, cv.plataforma_tipo
    FROM pulso_content.conteudo_variantes cv
    JOIN pulso_content.conteudos c ON c.id = cv.conteudo_id
    WHERE c.roteiro_id = '${ROTEIRO_1}';
  `, 'Variantes R1');

  if (!Array.isArray(vars) || vars.length === 0) {
    console.log('Nenhuma variante encontrada');
    return;
  }

  const ytVar    = vars.find(v => v.plataforma_tipo === 'YOUTUBE_SHORTS');
  const ttVar    = vars.find(v => v.plataforma_tipo === 'TIKTOK');
  const igVar    = vars.find(v => v.plataforma_tipo === 'INSTAGRAM_REELS');

  // Post YouTube (PUBLICADO)
  if (ytVar) {
    await runSQL(`
      INSERT INTO pulso_distribution.posts
        (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, data_publicacao, url_publicacao, metadata)
      VALUES (
        '${ytVar.id}', '${CP_YOUTUBE}',
        'PUBLICADO'::pulso_status_post,
        'Ansiedade Social - O Que Voce Precisa Saber Agora',
        NOW() - INTERVAL '3 days',
        'https://youtube.com/shorts/PulsoDark-Anx001',
        '{"canal": "Pulso Dark PT", "formato": "shorts"}'::jsonb
      ) ON CONFLICT DO NOTHING RETURNING id;
    `, 'Post YouTube PUBLICADO');
  }

  // Post TikTok (PUBLICADO)
  if (ttVar) {
    await runSQL(`
      INSERT INTO pulso_distribution.posts
        (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, data_publicacao, url_publicacao, metadata)
      VALUES (
        '${ttVar.id}', '${CP_TIKTOK}',
        'PUBLICADO'::pulso_status_post,
        'Ansiedade Social - O Que Voce Precisa Saber Agora',
        NOW() - INTERVAL '3 days',
        'https://tiktok.com/@pulsodark/video/Anx001',
        '{"canal": "Pulso Dark PT", "formato": "shorts"}'::jsonb
      ) ON CONFLICT DO NOTHING RETURNING id;
    `, 'Post TikTok PUBLICADO');
  }

  // Post Instagram (AGENDADO)
  if (igVar) {
    await runSQL(`
      INSERT INTO pulso_distribution.posts
        (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, data_agendada, metadata)
      VALUES (
        '${igVar.id}', '${CP_INSTA}',
        'AGENDADO'::pulso_status_post,
        'Ansiedade Social - Entenda em 60 Segundos',
        NOW() + INTERVAL '8 hours',
        '{"canal": "Pulso Dark PT", "formato": "reels"}'::jsonb
      ) ON CONFLICT DO NOTHING RETURNING id;
    `, 'Post Instagram AGENDADO');
  }

  // Métricas diárias (7 dias) para posts publicados
  await runSQL(`
    INSERT INTO pulso_analytics.metricas_diarias
      (post_id, plataforma_id, data_ref, views, likes, comentarios, compartilhamentos, watch_time_segundos, metadata)
    SELECT
      p.id,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS' THEN '${PL_YOUTUBE}'::uuid
        WHEN 'TIKTOK'         THEN '${PL_TIKTOK}'::uuid
        ELSE                       '${PL_INSTA}'::uuid
      END,
      d.data::date,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS' THEN (2000 + (RANDOM() * 12000))::BIGINT
        WHEN 'TIKTOK'         THEN (5000 + (RANDOM() * 40000))::BIGINT
        ELSE (500 + (RANDOM() * 5000))::BIGINT
      END,
      (50 + (RANDOM() * 800))::BIGINT,
      (10 + (RANDOM() * 150))::BIGINT,
      (20 + (RANDOM() * 400))::BIGINT,
      (38 + (RANDOM() * 22))::INT,
      '{"canal": "Pulso Dark PT"}'::jsonb
    FROM pulso_distribution.posts p
    JOIN pulso_content.conteudo_variantes cv ON cv.id = p.conteudo_variantes_id,
    generate_series(NOW()::DATE - 6, NOW()::DATE, '1 day'::interval) d(data)
    WHERE p.status = 'PUBLICADO'
    ON CONFLICT DO NOTHING;
    SELECT COUNT(*) AS metricas, SUM(views) AS total_views FROM pulso_analytics.metricas_diarias;
  `, 'Metricas 7 dias');

  // Resumo final completo
  const r = await runSQL(`
    SELECT
      (SELECT COUNT(*) FROM pulso_content.ideias) AS ideias,
      (SELECT COUNT(*) FROM pulso_content.ideias WHERE status = 'APROVADA') AS ideias_aprovadas,
      (SELECT COUNT(*) FROM pulso_content.roteiros WHERE status = 'APROVADO') AS roteiros_aprovados,
      (SELECT COUNT(*) FROM pulso_content.conteudos) AS conteudos,
      (SELECT COUNT(*) FROM pulso_content.conteudo_variantes) AS variantes,
      (SELECT COUNT(*) FROM pulso_assets.assets) AS assets,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status = 'PUBLICADO') AS publicados,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status = 'AGENDADO') AS agendados,
      (SELECT COUNT(*) FROM pulso_analytics.metricas_diarias) AS linhas_metricas,
      (SELECT SUM(views) FROM pulso_analytics.metricas_diarias) AS total_views,
      (SELECT COUNT(*) FROM pulso_automation.automation_queue WHERE status = 'PENDENTE') AS fila_pendente;
  `, 'RESUMO FINAL');

  console.log('\n=== BANCO COMPLETO ===');
  if (Array.isArray(r)) console.log(JSON.stringify(r[0], null, 2));
})();
