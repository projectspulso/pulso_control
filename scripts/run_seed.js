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

// IDs reais do banco
const CANAL_ID   = 'c89417ab-ceb0-4a07-9eaf-9293219330e8';
const ROTEIRO_1  = '02f89f7b-85be-4047-a78e-621b751fa978';
const ROTEIRO_2  = '9ef29e64-d3ad-4704-88c7-fd75b2654ac9';
const CP_YOUTUBE = '7fe7a78d-53ae-4a7a-b4a5-9e4d8c7f4692';
const CP_TIKTOK  = 'de71b711-1a9d-45d9-b8fb-23e1566b9bad';
const CP_INSTA   = '7e6647a0-b3de-4bf6-99c2-ebebbf8952d4';
const PL_YOUTUBE = '15b09439-1ce8-4952-89b6-9e94808c4900';
const PL_TIKTOK  = 'cf51935a-02ec-48a9-8822-cfd86bb6e902';
const PL_INSTA   = '02b97345-02c6-4e04-a654-1cbcb1a879f0';

(async () => {
  console.log('=== SEED PULSO - PIPELINE COMPLETO ===\n');

  // 1. Buscar IDs dos conteúdos já criados
  const c1r = await runSQL(
    `SELECT id FROM pulso_content.conteudos WHERE canal_id='${CANAL_ID}' AND roteiro_id='${ROTEIRO_1}' LIMIT 1;`,
    '1a. Conteudo R1'
  );
  const c2r = await runSQL(
    `SELECT id FROM pulso_content.conteudos WHERE canal_id='${CANAL_ID}' AND roteiro_id='${ROTEIRO_2}' LIMIT 1;`,
    '1b. Conteudo R2'
  );

  const C1 = Array.isArray(c1r) && c1r[0] ? c1r[0].id : null;
  const C2 = Array.isArray(c2r) && c2r[0] ? c2r[0].id : null;
  console.log('Conteudos:', C1, '/', C2);

  if (!C1) { console.log('ERRO: conteúdo não encontrado. Execute o seed de conteúdos primeiro.'); return; }

  // 2. Criar variantes para conteúdo 1 (Ansiedade Social) — 3 plataformas
  await runSQL(`
    INSERT INTO pulso_content.conteudo_variantes
      (conteudo_id, nome_variacao, plataforma_tipo, status, titulo_publico, descricao_publica, legenda, linguagem, metadata)
    VALUES
      ('${C1}', 'YT Shorts', 'YOUTUBE_SHORTS', 'PRONTO_PARA_PUBLICACAO',
       'Ansiedade Social: O Que Você Precisa Saber Agora',
       'Você sente que trava em situações sociais? Saiba o que é ansiedade social.',
       'Ansiedade social afeta 1 em 8 pessoas 👀 #shorts #psicologia #ansiedade #saúdemental',
       'pt-BR', '{"formato":"shorts","duracao":60}'::jsonb),
      ('${C1}', 'TikTok', 'TIKTOK', 'PRONTO_PARA_PUBLICACAO',
       'Ansiedade Social 😰 O que é e como superar',
       'Você sabia que ansiedade social é mais comum do que parece?',
       'Você não está sozinho nisso 💙 #fyp #psicologia #ansiedade #viral',
       'pt-BR', '{"formato":"shorts","duracao":60}'::jsonb),
      ('${C1}', 'IG Reels', 'INSTAGRAM_REELS', 'PRONTO_PARA_PUBLICACAO',
       'Ansiedade Social — Entenda em 60 Segundos',
       'Descubra o que é ansiedade social e como ela afeta sua vida.',
       'Você se reconhece nisso? ❤️ #reels #psicologia #saúdemental #autoconhecimento',
       'pt-BR', '{"formato":"reels","duracao":60}'::jsonb)
    ON CONFLICT DO NOTHING;
    SELECT COUNT(*) AS variantes FROM pulso_content.conteudo_variantes;
  `, '2. Variantes conteúdo 1');

  // 3. Variantes para conteúdo 2 (Ciclo de Erros)
  if (C2) {
    await runSQL(`
      INSERT INTO pulso_content.conteudo_variantes
        (conteudo_id, nome_variacao, plataforma_tipo, status, titulo_publico, descricao_publica, legenda, linguagem, metadata)
      VALUES
        ('${C2}', 'YT Shorts', 'YOUTUBE_SHORTS', 'PRONTO_PARA_PRODUCAO',
         'Por Que Você Está Preso em um Ciclo de Erros',
         'Você comete sempre os mesmos erros? Descubra por quê.',
         'O ciclo vai continuar até você entender isso 🔄 #shorts #psicologia #comportamento',
         'pt-BR', '{"formato":"shorts","duracao":60}'::jsonb),
        ('${C2}', 'TikTok', 'TIKTOK', 'PRONTO_PARA_PRODUCAO',
         'Por Que Você Repete os Mesmos Erros? 🔄',
         'Entenda o mecanismo por trás dos padrões repetitivos.',
         'Para de repetir o mesmo ciclo 🚫 #fyp #psicologia #comportamento #viral',
         'pt-BR', '{"formato":"shorts","duracao":60}'::jsonb)
      ON CONFLICT DO NOTHING;
      SELECT COUNT(*) AS variantes FROM pulso_content.conteudo_variantes;
    `, '3. Variantes conteúdo 2');
  }

  // 4. Posts publicados (YT e TikTok do conteúdo 1) e agendado (IG)
  const vars = await runSQL(`
    SELECT cv.id, cv.plataforma_tipo
    FROM pulso_content.conteudo_variantes cv
    WHERE cv.conteudo_id = '${C1}';
  `, '4a. Variantes C1');

  if (Array.isArray(vars)) {
    for (const v of vars) {
      const cpId = v.plataforma_tipo === 'YOUTUBE_SHORTS' ? CP_YOUTUBE
                 : v.plataforma_tipo === 'TIKTOK'         ? CP_TIKTOK
                 : CP_INSTA;
      const isPublished = v.plataforma_tipo !== 'INSTAGRAM_REELS';
      const status = isPublished ? 'PUBLICADO' : 'AGENDADO';
      const pubAt = isPublished ? `NOW() - INTERVAL '3 days'` : 'NULL';
      const agAt  = !isPublished ? `NOW() + INTERVAL '8 hours'` : 'NULL';
      const urlV  = v.plataforma_tipo === 'YOUTUBE_SHORTS' ? `'https://youtube.com/shorts/PulsoDark-Anx001'`
                  : v.plataforma_tipo === 'TIKTOK'         ? `'https://tiktok.com/@pulsodark/video/Anx001'`
                  : 'NULL';

      await runSQL(`
        INSERT INTO pulso_distribution.posts
          (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, publicado_em, agendado_para, url_post, metadata)
        VALUES (
          '${v.id}', '${cpId}',
          '${status}'::pulso_status_post,
          'Ansiedade Social: O Que Você Precisa Saber Agora',
          ${pubAt}, ${agAt}, ${urlV},
          '{"canal":"Pulso Dark PT","formato":"shorts"}'::jsonb
        ) ON CONFLICT DO NOTHING;
      `, `4b. Post ${v.plataforma_tipo.slice(0, 10)}`);
    }
  }

  // 5. Métricas diárias para os 7 dias
  await runSQL(`
    INSERT INTO pulso_analytics.metricas_diarias
      (post_id, plataforma_id, data_ref, views, likes, comentarios, compartilhamentos, watch_time_segundos, metadata)
    SELECT
      p.id,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS'  THEN '${PL_YOUTUBE}'::uuid
        WHEN 'TIKTOK'          THEN '${PL_TIKTOK}'::uuid
        ELSE                        '${PL_INSTA}'::uuid
      END,
      d.data::date,
      CASE cv.plataforma_tipo
        WHEN 'YOUTUBE_SHORTS'  THEN (2000 + (RANDOM() * 12000))::BIGINT
        WHEN 'TIKTOK'          THEN (5000 + (RANDOM() * 40000))::BIGINT
        ELSE (500 + (RANDOM() * 5000))::BIGINT
      END,
      (50 + (RANDOM() * 1000))::BIGINT,
      (10 + (RANDOM() * 200))::BIGINT,
      (20 + (RANDOM() * 500))::BIGINT,
      (35 + (RANDOM() * 25))::INT,
      '{"canal":"Pulso Dark PT"}'::jsonb
    FROM pulso_distribution.posts p
    JOIN pulso_content.conteudo_variantes cv ON cv.id = p.conteudo_variantes_id,
    generate_series(NOW()::DATE - 6, NOW()::DATE, '1 day'::interval) d(data)
    WHERE p.status = 'PUBLICADO'
    ON CONFLICT DO NOTHING;
    SELECT COUNT(*) AS metricas FROM pulso_analytics.metricas_diarias;
  `, '5. Métricas 7 dias');

  // 6. Resumo final
  const final = await runSQL(`
    SELECT
      (SELECT COUNT(*) FROM pulso_content.ideias)   AS ideias,
      (SELECT COUNT(*) FROM pulso_content.roteiros) AS roteiros,
      (SELECT COUNT(*) FROM pulso_content.conteudos) AS conteudos,
      (SELECT COUNT(*) FROM pulso_content.conteudo_variantes) AS variantes,
      (SELECT COUNT(*) FROM pulso_assets.assets)    AS assets,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status = 'PUBLICADO') AS publicados,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status = 'AGENDADO')  AS agendados,
      (SELECT SUM(views) FROM pulso_analytics.metricas_diarias) AS total_views,
      (SELECT COUNT(*) FROM pulso_analytics.metricas_diarias) AS linhas_metricas;
  `, '6. RESUMO FINAL');

  console.log('\n=== BANCO COMPLETO ===');
  if (Array.isArray(final)) console.log(JSON.stringify(final[0], null, 2));
})();
