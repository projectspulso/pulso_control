/**
 * Pipeline Completo: Ideia → Roteiro (GPT-4o) → Áudio (TTS) → Posts → Métricas
 * Usa as credenciais do .env.local para testar end-to-end
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  const m = trimmed.match(/^([^=]+)=(.+)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const OPENAI_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = 'https://nlcisbfdiokmipyihtuz.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT_TOKEN = 'sbp_7bf5d64c75fd147515b0b30aa0dee9b250e3a85a';
const PROJECT = 'nlcisbfdiokmipyihtuz';

// IDs do seed anterior
const CP_YOUTUBE = '7fe7a78d-53ae-4a7a-b4a5-9e4d8c7f4692';
const CP_TIKTOK  = 'de71b711-1a9d-45d9-b8fb-23e1566b9bad';
const CP_INSTA   = '7e6647a0-b3de-4bf6-99c2-ebebbf8952d4';
const PL_YOUTUBE = '15b09439-1ce8-4952-89b6-9e94808c4900';
const PL_TIKTOK  = 'cf51935a-02ec-48a9-8822-cfd86bb6e902';
const PL_INSTA   = '02b97345-02c6-4e04-a654-1cbcb1a879f0';

// Ideia escolhida
const IDEIA_ID   = 'fb69fd52-18d1-400e-b75f-fadc463fe557';
const CANAL_ID   = 'c89417ab-ceb0-4a07-9eaf-9293219330e8';
const CANAL_NOME = 'Pulso Dark PT';

function runSQL(sql) {
  const body = JSON.stringify({ query: sql });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + PROJECT + '/database/query',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + MGMT_TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){resolve(d)} }); });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function callOpenAI(prompt, opts = {}) {
  const body = JSON.stringify({
    model: opts.model || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: opts.temperature || 0.7,
    max_tokens: opts.max_tokens || 2048,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} }); });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function callTTS(text) {
  const body = JSON.stringify({ model: 'tts-1', input: text, voice: 'onyx', response_format: 'mp3' });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/audio/speech',
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function log(label, data) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ ${label}`);
  if (data) console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

function logError(label, err) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`❌ ${label}`);
  console.log(err?.message || err);
}

(async () => {
  console.log('\n🚀 PIPELINE COMPLETO — PULSO DARK PT');
  console.log('Ideia: Experimento Humano Mais Bizarro\n');

  // ===== STEP 1: GERAR ROTEIRO com GPT-4o =====
  log('STEP 1: Gerando roteiro com GPT-4o...');

  const prompt = `Você é um roteirista de vídeos curtos virais para o canal "${CANAL_NOME}" (YouTube Shorts / TikTok / Reels).
Tom: sombrio, intrigante, educativo. Idioma: pt-BR. Duração alvo: 45-60 segundos.

Ideia: "Experimento Humano Mais Bizarro"
Descrição: Em 1950, cientistas costuraram dois cães juntos. O resultado foi perturbador.

Crie um roteiro completo com:
1. GANCHO (primeiros 3 segundos — frase que para o scroll)
2. DESENVOLVIMENTO (fatos perturbadores, detalhes do experimento)
3. VIRADA (o que o resultado revelou sobre ciência/humanidade)
4. CTA (chamada para seguir o canal)

Formato: texto corrido para narração em voz over. Sem marcadores técnicos. Apenas o texto falado.`;

  const gptResponse = await callOpenAI(prompt, { temperature: 0.75, max_tokens: 1000 });

  if (!gptResponse.choices?.[0]?.message?.content) {
    logError('GPT-4o falhou', gptResponse);
    process.exit(1);
  }

  const roteiro = gptResponse.choices[0].message.content;
  const tokens = gptResponse.usage;
  log('Roteiro gerado', `Palavras: ${roteiro.split(' ').length} | Tokens: ${JSON.stringify(tokens)}\n\nROTEIRO:\n${roteiro}`);

  // ===== STEP 2: SALVAR ROTEIRO no banco =====
  log('STEP 2: Salvando roteiro no banco...');

  // Verificar se já existe
  const existR = await runSQL(`SELECT id, titulo, status FROM pulso_content.roteiros WHERE ideia_id='${IDEIA_ID}' LIMIT 1`);
  let ROTEIRO_ID;
  if (Array.isArray(existR) && existR.length > 0) {
    ROTEIRO_ID = existR[0].id;
    log('Roteiro já existe', existR[0]);
  } else {
    const roteiroEscapado = roteiro.replace(/'/g, "''");
    const saveR = await runSQL(`
      INSERT INTO pulso_content.roteiros
        (ideia_id, canal_id, titulo, conteudo_md, versao, duracao_estimado_segundos, status, linguagem, metadata)
      VALUES (
        '${IDEIA_ID}', '${CANAL_ID}',
        'Experimento Humano Mais Bizarro',
        '${roteiroEscapado}',
        1,
        ${Math.round(roteiro.split(' ').length / 2.5)},
        'APROVADO',
        'pt-BR',
        '{"ai_modelo":"gpt-4o","gerado_via":"pipeline_test","quality_score":85,"auto_aprovado":true}'::jsonb
      )
      RETURNING id, titulo, status, duracao_estimado_segundos;
    `);
    if (saveR.message) { logError('Salvar roteiro', saveR); process.exit(1); }
    ROTEIRO_ID = saveR[0].id;
    log('Roteiro salvo', saveR[0]);
  }

  // ===== STEP 3: CRIAR CONTEÚDO =====
  log('STEP 3: Criando conteúdo...');

  const existC = await runSQL(`SELECT id, titulo_interno, status FROM pulso_content.conteudos WHERE roteiro_id='${ROTEIRO_ID}' LIMIT 1`);
  let CONTEUDO_ID;
  if (Array.isArray(existC) && existC.length > 0) {
    CONTEUDO_ID = existC[0].id;
    log('Conteúdo já existe', existC[0]);
  } else {
    const saveC = await runSQL(`
      INSERT INTO pulso_content.conteudos
        (canal_id, roteiro_id, titulo_interno, status, linguagem, metadata)
      VALUES (
        '${CANAL_ID}', '${ROTEIRO_ID}',
        'Experimento Humano Mais Bizarro',
        'PRONTO_PARA_PRODUCAO',
        'pt-BR',
        '{"pipeline":"completo","criado_via":"pipeline_test"}'::jsonb
      )
      RETURNING id, titulo_interno, status;
    `);
    if (saveC.message) { logError('Salvar conteudo', saveC); process.exit(1); }
    CONTEUDO_ID = saveC[0].id;
    log('Conteúdo criado', saveC[0]);
  }

  // ===== STEP 4: GERAR ÁUDIO com TTS =====
  log('STEP 4: Gerando áudio com OpenAI TTS (onyx)...');

  // Limpar texto para TTS
  const textoTTS = roteiro
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();

  const ttsResult = await callTTS(textoTTS);

  if (ttsResult.status !== 200) {
    logError('TTS falhou', `Status: ${ttsResult.status}`);
    process.exit(1);
  }

  const audioBytes = ttsResult.buffer.length;
  log('Áudio gerado', `Tamanho: ${(audioBytes/1024).toFixed(1)} KB`);

  // ===== STEP 5: SALVAR ASSET DE ÁUDIO =====
  log('STEP 5: Registrando asset de áudio no banco...');

  const saveA = await runSQL(`
    INSERT INTO pulso_assets.assets
      (tipo, nome, descricao, caminho_storage, provedor, tamanho_bytes, duracao_segundos, metadata)
    VALUES (
      'AUDIO',
      'experimento-humano-bizarro-onyx.mp3',
      'Narração gerada por OpenAI TTS (voz onyx)',
      'pulso-dark-pt/audio/experimento-humano-bizarro-onyx.mp3',
      'openai_tts',
      ${audioBytes},
      ${Math.round(roteiro.split(' ').length / 2.5)},
      '{"voz":"onyx","modelo":"tts-1","gerado_via":"pipeline_test","idioma":"pt-BR"}'::jsonb
    )
    RETURNING id, nome, tipo, tamanho_bytes;
  `);

  if (saveA.message) { logError('Salvar asset', saveA); process.exit(1); }
  const ASSET_ID = saveA[0].id;
  log('Asset registrado', saveA[0]);

  // ===== STEP 6: CRIAR VARIANTES =====
  log('STEP 6: Criando variantes para 3 plataformas...');

  const saveVars = await runSQL(`
    INSERT INTO pulso_content.conteudo_variantes
      (conteudo_id, nome_variacao, plataforma_tipo, status, titulo_publico, descricao_publica, legenda, linguagem, metadata)
    VALUES
      ('${CONTEUDO_ID}', 'YT Shorts', 'YOUTUBE_SHORTS', 'PRONTO_PARA_PUBLICACAO',
       'Experimento Humano Mais Bizarro da História 😱',
       'Em 1950, cientistas costuraram dois cães juntos. O resultado foi perturbador.',
       'A ciência foi longe demais nesse dia... 🐕 #shorts #ciencia #historia #dark #perturbador',
       'pt-BR', '{"formato":"shorts","duracao":55,"canal":"Pulso Dark PT"}'::jsonb),
      ('${CONTEUDO_ID}', 'TikTok', 'TIKTOK', 'PRONTO_PARA_PUBLICACAO',
       'O experimento que foi longe demais 😱',
       'Dois cães... costurados juntos. Isso realmente aconteceu.',
       'Isso vai te deixar sem dormir 😨 #fyp #ciencia #experimento #viral #perturbador',
       'pt-BR', '{"formato":"shorts","duracao":55,"canal":"Pulso Dark PT"}'::jsonb),
      ('${CONTEUDO_ID}', 'IG Reels', 'INSTAGRAM_REELS', 'PRONTO_PARA_PUBLICACAO',
       'O Experimento Mais Sombrio da Ciência',
       'O que a ciência fez em nome do conhecimento pode te chocar.',
       'A história que os livros não contam ✝️ #reels #historia #ciencia #saibamais #pulsodarkt',
       'pt-BR', '{"formato":"reels","duracao":55,"canal":"Pulso Dark PT"}'::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id, plataforma_tipo, status;
  `);

  if (saveVars.message) { logError('Salvar variantes', saveVars); process.exit(1); }
  log('Variantes criadas', saveVars);
  const VAR_IDS = saveVars.map(v => ({ id: v.id, tipo: v.plataforma_tipo }));

  // Vincular asset de áudio a cada variante via tabela de junção
  for (const v of VAR_IDS) {
    await runSQL(`
      INSERT INTO pulso_assets.conteudo_variantes_assets (conteudo_variantes_id, asset_id, papel, ordem)
      VALUES ('${v.id}', '${ASSET_ID}', 'audio_principal', 1)
      ON CONFLICT DO NOTHING;
    `);
  }
  log('Assets vinculados às variantes', '3 variantes → 1 asset de áudio');

  // ===== STEP 7: CRIAR POSTS =====
  log('STEP 7: Criando posts (2 publicados + 1 agendado)...');

  for (const v of VAR_IDS) {
    const cpId = v.tipo === 'YOUTUBE_SHORTS' ? CP_YOUTUBE : v.tipo === 'TIKTOK' ? CP_TIKTOK : CP_INSTA;
    const isPublished = v.tipo !== 'INSTAGRAM_REELS';
    const titulo = 'Experimento Humano Mais Bizarro';

    if (isPublished) {
      await runSQL(`
        INSERT INTO pulso_distribution.posts
          (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, data_publicacao, url_publicacao, metadata)
        VALUES (
          '${v.id}', '${cpId}',
          'PUBLICADO'::pulso_status_post,
          '${titulo}',
          NOW() - INTERVAL '1 day',
          '${v.tipo === 'YOUTUBE_SHORTS' ? 'https://youtube.com/shorts/PulsoDark-Exp001' : 'https://tiktok.com/@pulsodark/video/Exp001'}',
          '{"canal":"Pulso Dark PT","formato":"shorts","gerado_via":"pipeline_test"}'::jsonb
        ) ON CONFLICT DO NOTHING;
      `);
    } else {
      await runSQL(`
        INSERT INTO pulso_distribution.posts
          (conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, data_agendada, metadata)
        VALUES (
          '${v.id}', '${cpId}',
          'AGENDADO'::pulso_status_post,
          '${titulo}',
          NOW() + INTERVAL '4 hours',
          '{"canal":"Pulso Dark PT","formato":"reels","gerado_via":"pipeline_test"}'::jsonb
        ) ON CONFLICT DO NOTHING;
      `);
    }
  }
  log('Posts criados', '2 publicados (YT + TikTok) + 1 agendado (IG)');

  // ===== STEP 8: MÉTRICAS DOS POSTS PUBLICADOS =====
  log('STEP 8: Inserindo métricas dos últimos 7 dias...');

  const saveMet = await runSQL(`
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
        WHEN 'YOUTUBE_SHORTS' THEN (3000 + (RANDOM() * 15000))::BIGINT
        WHEN 'TIKTOK'         THEN (8000 + (RANDOM() * 60000))::BIGINT
        ELSE (800 + (RANDOM() * 6000))::BIGINT
      END,
      (100 + (RANDOM() * 1200))::BIGINT,
      (15 + (RANDOM() * 200))::BIGINT,
      (30 + (RANDOM() * 600))::BIGINT,
      (42 + (RANDOM() * 18))::INT,
      '{"canal":"Pulso Dark PT","pipeline":"completo"}'::jsonb
    FROM pulso_distribution.posts p
    JOIN pulso_content.conteudo_variantes cv ON cv.id = p.conteudo_variantes_id
    WHERE cv.conteudo_id = '${CONTEUDO_ID}' AND p.status = 'PUBLICADO',
    generate_series(NOW()::DATE - 6, NOW()::DATE, '1 day'::interval) d(data)
    ON CONFLICT DO NOTHING;
    SELECT COUNT(*) as novas_metricas FROM pulso_analytics.metricas_diarias WHERE metadata->>'pipeline' = 'completo';
  `);

  log('Métricas inseridas', saveMet);

  // ===== STEP 9: ATUALIZAR STATUS DA IDEIA =====
  await runSQL(`
    UPDATE pulso_content.ideias SET status = 'EM_PRODUCAO' WHERE id = '${IDEIA_ID}';
  `);
  log('Ideia atualizada', 'Status → EM_PRODUCAO');

  // ===== RESUMO FINAL =====
  const resumo = await runSQL(`
    SELECT
      i.titulo as ideia,
      i.status as ideia_status,
      r.titulo as roteiro,
      r.status as roteiro_status,
      r.duracao_estimado_segundos,
      (SELECT COUNT(*) FROM pulso_content.conteudo_variantes cv2 WHERE cv2.conteudo_id = c.id) as variantes,
      (SELECT COUNT(*) FROM pulso_distribution.posts p2
       JOIN pulso_content.conteudo_variantes cv3 ON cv3.id = p2.conteudo_variantes_id
       WHERE cv3.conteudo_id = c.id AND p2.status = 'PUBLICADO') as posts_publicados,
      (SELECT SUM(md.views) FROM pulso_analytics.metricas_diarias md
       JOIN pulso_distribution.posts p3 ON p3.id = md.post_id
       JOIN pulso_content.conteudo_variantes cv4 ON cv4.id = p3.conteudo_variantes_id
       WHERE cv4.conteudo_id = c.id) as total_views
    FROM pulso_content.ideias i
    JOIN pulso_content.roteiros r ON r.ideia_id = i.id
    JOIN pulso_content.conteudos c ON c.roteiro_id = r.id
    WHERE i.id = '${IDEIA_ID}';
  `);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 PIPELINE COMPLETO — RESUMO FINAL');
  console.log('='.repeat(60));
  if (Array.isArray(resumo)) console.log(JSON.stringify(resumo[0], null, 2));

  console.log('\n📊 BANCO GERAL:');
  const geral = await runSQL(`
    SELECT
      (SELECT COUNT(*) FROM pulso_content.ideias) as total_ideias,
      (SELECT COUNT(*) FROM pulso_content.roteiros WHERE status='APROVADO') as roteiros_aprovados,
      (SELECT COUNT(*) FROM pulso_content.conteudos) as conteudos,
      (SELECT COUNT(*) FROM pulso_content.conteudo_variantes) as variantes,
      (SELECT COUNT(*) FROM pulso_assets.assets) as assets,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status='PUBLICADO') as publicados,
      (SELECT COUNT(*) FROM pulso_distribution.posts WHERE status='AGENDADO') as agendados,
      (SELECT SUM(views) FROM pulso_analytics.metricas_diarias) as total_views;
  `);
  if (Array.isArray(geral)) console.log(JSON.stringify(geral[0], null, 2));
})();
