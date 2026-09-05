# Changelog — pulso_control

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), simplificado.

## [Não lançado]

### Removido (04/09)
- **Esteira dos Bastidores sai do app.** Decisão do dono: a série passa ao orquestrador, que conduz com o Limelight. Removidos `/bastidores`, `/api/bastidores/*`, `use-episodios`, `use-horas-longos`, o bloco "Longos prontos" da Central de Publicação, o card "Rumo às 3.000 horas" e o item da sidebar.
- **O que NÃO saiu, de propósito:** as travas de `formato=longo` em 9 rotas (comprometer, popular, publicar-agendados, gerar-roteiro, publicar, aprender, decisor, duplicidade, use-bi/use-hoje) — elas impedem que um vídeo longo caia na grade de Shorts e seja despachado nas 5 redes. Custam nada e protegem um retorno futuro do formato. Também ficam `docs/40_PRODUTO/19` e `20` e `public/pulso/avatar_dono/`: são acervo, não esteira.
- **Antes de remover**, os 10 episódios foram exportados crus (19 colunas, os 3 `roteiro_md` inteiros) para `Cockpit/_BASTIDORES_EXPORT_EPISODIOS_2026-09-04.json`. O material `.md` é a versão humana; o export é o dado. Os dois sobrevivem — condição do orquestrador para "remover do app" não virar "apagar conhecimento".
- **A tabela `pulso_content.episodios` continua de pé.** Dropar é o único passo que não volta com `git revert`, e espera ordem explícita do dono.

### Corrigido (04/09)
- **O dia do PULSO passa a ser o dia de Brasília.** O contador zerava às 21h: `toISOString()` devolve o dia UTC, que depois das 21h já é o seguinte. Medido no momento do relato: dia UTC dava 0 vídeos, dia BRT dava 3 em 4 redes. Corrigidos `contarPublicadosHoje`, a tela Hoje, o teto da linha de produção e o radar de estouro. `lib/datas.ts` separa os dois casos pelo nome (`diaBRT` para coluna com fuso, `diaNaive` para sem).
- **`leituras_metricas.data_ref` reancorada em Brasília** (migration 060, aplicada). 25.731 de 31.351 linhas estavam deslocadas (24.579 exatamente +1 dia) porque a coleta roda às 21h BRT = 00h UTC. Não era "menos um dia em tudo": as ~5.600 da coleta das 03h já estavam certas. Recalculado linha a linha pelo `created_at`; 2.963 duplicatas resolvidas mantendo a mais recente. Resultado: 28.388 linhas, 0 erradas. Backup em `leituras_metricas_bkp_20260904`.


### Bastidores (03/09)
- **Contrato fechado com o orquestrador** (`Cockpit/_RESPOSTA_DO_PULSO_BASTIDORES_2026-09-03.md`, responde a `_PERGUNTAS_AO_PULSO_BASTIDORES_2026-09-02.md`): a série **mora no Pulso**, o Limelight conduz como executor criativo, estado só avança em `pulso_content.episodios`. Linha de corte por estágio: roteiro = Limelight redige / **dono aprova** · narração = Limelight (clone, bloqueado na amostra de voz do dono) · capturas = Pulso (🔒 aplicado aqui) · montagem = Limelight, EP01 com o Pulso no loop · revisão→publicação = dono, só YouTube. Segredo: só o agregado do contrato por rede viaja; quartis/thresholds/prompts não.
- **Roteiros levados para a esteira**: `episodios.roteiro_md` estava **vazio nos 10 episódios** — os roteiros só existiam em `19_SERIE_BASTIDORES.md`, e a transição `planejado → roteiro_ok` não tinha o que aprovar. EP01 (5.185 chars), EP04 (3.269) e EP09 (4.202) gravados. Os 7 restantes têm só tese + `material`.
- **Gaps registrados para o despacho** (auditoria de 03/09): não existe render para `formato=longo` — o worker não conhece o formato e `/api/bastidores/promover` exige `video_url` pronto; montagem é fora do app (proposta: EP01 manual, automatizar depois de um episódio publicado). O card "Rumo às 3.000 horas" depende de `view_time_ms` na coleta do YouTube — confirmar na 1ª publicação.

### Adicionado (02/09)
- **Retenção entra no contrato por rede** (`lib/decisor/contrato-redes.ts`, `briefing-do-momento.ts`, `/api/decisor`): o banco tinha retenção em 456 publicações e o gerador recebia `taxa_retencao: null` — calibrava por `nota_hook`, a nota que ele mesmo deu. Medido por **quartil da própria rede**: Facebook 274→1.087 views (4,0×) e Instagram 128→530 (4,1×) são escada; YouTube é quase plano acima de ~49% (o que paga lá é o gancho, 1,94×). O contrato sai da mesma função para o gerador e para o Decisor.
- **Âncora — identidade declarada do vídeo** (`lib/automation/ancora.ts`, `ideias.metadata.ancora`): o caso concreto com nome/data (`Bluma Zeigarnik 1927`, `Pavlopetri 1967`). Extraída do roteiro pronto com gpt-4o-mini; backfill nos 189 roteiros via `POST /api/duplicidade/backfill`. Colisão exige ≥75% dos termos + 1 raro, **ou** 2 raros iguais (nome), com veto quando cada lado tem um termo exclusivo raro (Cádiz × Yonaguni).
- **Trava no roteiro pronto** (`gerar-roteiro`): colisão de âncora ou gêmeo no acervo **impede a auto-aprovação** (não descarta) — o último portão antes do áudio e do render. Motivo gravado em `pipeline_producao.metadata.colisao_ancora` / `gemeo_no_acervo`.
- **Vigia de duplicidade** (`lib/automation/vigia-duplicidade.ts`, `GET /api/duplicidade`, alerta 👯 no Dashboard): termos raros no corpo dos roteiros, zero IA; ignora a cauda/CTA (corte duplo: marcador + 15% do fim). Só alerta quando o par ainda é evitável.
- **`do-momento` passa pela camada semântica** (era só lexical). **`filtrarDuplicatasSemantica` devolve `indisponivel`** — "IA caiu" deixa de parecer "acervo saturado".

### Corrigido (02/09)
- **Duas repetições agendadas descartadas**: #175 repetia #156 (mesma abertura "Em 2134 a.C., dois astrônomos chineses") e #165 repetia #86 (Bluma Zeigarnik). Títulos com 10% em comum — invisíveis à trava lexical. Grade recompactada (2/dia, sem buraco).
- **Kanban de produção**: a coluna só muda **depois** que a ação deu certo (antes `mutate()` saía junto com a geração — roteiro que falhava ficava em "Roteiro Pronto" sem roteiro; roteiro que precisava de aprovação era forçado a pronto). "processando…" no card durante o arrasto; `alert()` → mensagem inline no padrão da esteira.
- **Publicação**: trava de antecipação após as 19h quando o dia está abaixo da meta (`publicar-agendados`) + vigia de cadência (`use-cadencia`, alerta 📉). 28/08–01/09 saiu 1/dia em vez de 2 e o feed de Shorts caiu 44%.

### Adicionado (17/06)
- **Trava anti-duplicidade 2ª camada — semântica via LLM** (`dedup.ts` `filtrarDuplicatasSemantica` + `gerar-ideias`): o Jaccard lexical perdia dups com palavras diferentes ("seu cérebro acha que uma mão falsa é sua" == "Efeito Rubber Hand"; "menino" vs "mulher que sobreviveu a 2 desastres"; "Voo 19" == "5 aviões nas Bermudas 1945"). Agora, após o pré-filtro lexical, o LLM (gpt-4o, temp 0, JSON) julga se o **assunto central** é o mesmo de alguma ideia existente. Resiliente: se a IA falhar, não trava a geração. Limpamos 5 dups que já tinham passado pela trava antiga.
- **Regra PULSO-CTA embutida no molde (`make_video.py`)**: no trecho final em que a narração já diz "Segue o pulso…" (detectado por `rfind("segue")` no alignment), a bolha do canto some e entra o **mascote grande animado** (8 quadros transparentes de `cta_frames/`, extraídos de `pulso/avatar/1.png`), gesticulando (aponta/apresenta/joinha/pisca) + lip-sync na **própria narração original**. Texto "SEGUE O PULSO" + botão. **Sem áudio novo, sem tempo extra** — não depende da cota ElevenLabs. Um mascote por vez. Tentativa anterior (anexar CTA com voz própria) descartada por duplicar o CTA que já existe na narração.

### Publicado (17/06)
- **#17 Pollock + #18 Chuva de Sapos** (cohort bolha, com CTA) nas **4 redes**: Instagram (API), YouTube Shorts (assistido), TikTok (API → rascunho → publicado no app), Facebook (assistido, página Pulso Projects). 8 publicações registradas em `metricas_publicacao` (4 redes × 2 vídeos). Confirmado: contas pulsoprojects / @pulsohistorias / Pulso Projects (não Óticas).
- ⚠️ **Estoque zerou** após estes 2 — `PRONTO_PUBLICACAO` = 0. Próximo gargalo: montar a fila (13 áudios prontos em `AUDIO_GERADO`).

### Adicionado (15-16/06)
- **2 gráficos no `/analytics`**: "Views ganhos por dia" (barras, delta hoje−ontem — vê se ganha/perde audiência) + "Crescimento total" (área, acumulado). Hook `use-bi` retorna `serieDiaria` + `serieCumulativa`.
- **Trava anti-duplicidade de ideias** (`lib/automation/dedup.ts`): Jaccard ≥0.45 título+descrição no `gerar-ideias`, dedup intra-lote, retorna `ignoradas` (sem descarte silencioso). Limite conhecido: não pega dup semântica reescrita (norte = embeddings).

### Corrigido (15-16/06)
- **Número consistente em todas as telas (fonte única + carimbo)**: os KPIs divergiam (24,1k num lugar, 25,4k em outro) por lerem fontes/momentos diferentes. Agora Dashboard, Validação e Analytics leem todos de `metricas_publicacao` (canônica) e mostram a **hora real da coleta** (`ultima_atualizacao`). Validação usava `updated_at` (muda em qualquer alteração da linha) → corrigido. Analytics ganhou o carimbo "dados de HH:MM". Regra: mesma hora = mesmo número por construção.
- **Double-fire da publicação** (`/publicar`): o botão "Confirmar envio" travava com `publicarAgora.isPending` (nunca true, pois a função usa `fetch` direto) → duplicou **9× o reel do rubber-hand no IG**. Agora trava com estado `publicando` + re-entry guard, e o backend tem **idempotência por (ideia_id, plataforma)** (não republica a mesma rede).
- **Coleta diária sub-contava** (`metricas_diarias`/gráfico): só 20 de 65 publicações tinham espelho em `pulso_distribution.posts` (FK do snapshot) → gráfico mostrava ~6,7k em vez de ~25k. Criados os 45 espelhos faltantes + histórico reconstruído em degraus pela data real de publicação. Coletas futuras incluem todas sozinhas.
- **post_id do rubber-hand (IG/TikTok) apontava errado** → app mostrava 0 views. IG: a limpeza dos 9 dups manteve um `post_id` que o humano deletou no IG → reapontado pro reel vivo. TikTok: estava vazio (post manual) → preenchido via `video.list`.

### Adicionado
- **Endpoint `/api/automation/reconciliar-publicacoes` + botão "Sincronizar Redes"**
  (14/06): descobre vídeos postados FORA do app (FB manual, TikTok no celular, YT
  Studio) que não estavam em `metricas_publicacao` e os auto-cadastra. A coleta de
  métricas é só-update (nunca descobre vídeo novo), o que fazia o app subcontar — IG
  ficava 15/15 (publica via API) mas FB/TikTok ficavam incompletos. Matching por
  **âncora Instagram**: casa a legenda do órfão contra as legendas IG (que já têm
  ideia_id) por Jaccard; só cadastra alta confiança (best≥0.30 e best−second≥0.15),
  o resto vai pra "revisar" (nunca chuta). Insert-only e idempotente. Roda também
  no **cron diário** (10:50 UTC / 7:50 BRT, 10 min antes da coleta) — auto-sincroniza
  sem clique.

### Adicionado
- **Guard das rotas de API (`lib/auth/api-guard.ts`)** (14/06): as rotas de automação
  (coletar-metricas, reconciliar, publicar, orchestrator, gerar-ideias/roteiro/audio,
  relatorio, tiktok-upload) eram abertas (o middleware não cobre `/api`). Agora exigem
  **sessão válida na allowlist** (UI logada) OU `Authorization: Bearer CRON_SECRET`
  (Vercel Cron) OU `x-webhook-secret` (chamadas internas/externas). **Requer setar
  `WEBHOOK_SECRET` (não-vazio) e `CRON_SECRET` na Vercel** — sem isso o cron e a cadeia
  orchestrator→gerar-* quebram.

### Mudado
- **Voz da geração de áudio = PULSO (Voice Design)** (15/06): `callElevenLabsTTS`
  (`lib/automation/ai-clients.ts`) e a rota `gerar-audio` agora usam a voz oficial nova
  do PULSO (`GmzLAnPHSUkxG3P5yfca`, criada do zero 14/06) no lugar da Daniel
  (`onwK4e9ZLuTAKqWW03F9`). Settings da voz: stability 0.45 / similarity 0.8 / style 0.35.
  Todo áudio gerado pelo app (Automações/Produção) passa a ter a cara nova do PULSO.
- **Custos do molde atual (Seedance → Veo + mascote R$0)** (14/06): `lib/config/custos.ts`
  agora reflete o molde bolha — mascote lip-sync R$0 (sem Higgsfield) + B-roll Veo 3.1
  Lite (3 cenas × 12cr) = **R$ 11,18/vídeo** (era R$ 93,80 Seedance). `CUSTO_POR_CENA`:
  Veo 12cr (padrão), Kling 30cr (hero 4K), Seedance 45cr (legado). /financeiro e
  /analytics mostram o custo novo + referência histórica. Custo real continua vindo do
  ledger (dinâmico). Esteira da automação atualizada ("Mascote + B-roll Veo").
- **Label "Desempenho por Tipo"**: era "(7 dias)" mas a view `vw_automation_stats` é
  acumulada (all-time) — corrigido pra "(acumulado)".
- **`coletar-metricas` carimba `ultima_atualizacao`** (14/06): a coleta atualizava
  views/likes mas não a data, fazendo o painel mostrar coleta velha (parecia rede
  "não puxada" com dado correto). Agora carimba a cada coleta.
- **Facebook fora da publicação via API** (12/06): teste A/B provou que reels FB
  publicados via Graph API na Página Pulso Projects são sufocados pelo algoritmo
  (4 reels API = 0-2 plays em 13h; mesmo vídeo repostado manual no Business Suite
  = 232 plays em 40min, "2,1x acima da média"). Default da rota `/api/automation/publicar`
  e do modal de publicar agora é só `['instagram']`; FB volta ao fluxo manual
  (Business Suite) até a Página ter histórico — re-teste futuro com
  `plataformas:['facebook']` explícito.

### Removido
-

---

## [2026-05-22]

### Corrigido
- **🎯 Worker da automação destravado.** O job pg_cron `processar-fila-auto` (jobid=9, schedule `*/5 * * * *`) falhava silenciosamente desde 31/03/2026 com erro `invalid input syntax for type json, Token "Content" is invalid` por causa de JSON malformado no comando — `headers := '{Content-Type: application/json}'::jsonb` (sem aspas duplas em JSON). Diagnóstico via `cron.job_run_details` com PAT Supabase específico do pulso. Fix: `cron.unschedule(9)` + `cron.schedule` novo (jobid=10) com `headers := '{"Content-Type": "application/json"}'::jsonb`. Validado com 10 calls paralelas via curl ao orchestrator (`https://pulsoprojects.vercel.app/api/automation/orchestrator`) — fila começou a esvaziar (403→390 PENDENTE em segundos). Documentado em `Spec/pulso_control.md` §10 gap #8.

### Notas operacionais
- Hipótese inicial de "WEBHOOK_SECRET divergente" estava **errada** — orchestrator passa sem header (lógica `if (secret && secret !== process.env.WEBHOOK_SECRET)`).
- `app.settings.app_url` e `app.settings.webhook_secret` estão NULL no Postgres do pulso, mas isso não importa: o comando do job já tem URL hardcoded.
- `DEPLOY_MASTER_AUTOMACAO.sql` (linhas 501-502) ainda tenta setar esses settings mas o role do Management API não tem permissão (`ALTER DATABASE postgres SET` exige superuser). Como o fix atual não depende disso, segue.
- Fila tem ~390 PENDENTE acumulados desde 31/03/2026. Vão escoar à razão de 5 itens/5min via cron novo, ou via curl manual se quiser acelerar. Muitos são órfãos (ex.: GERAR_AUDIO de roteiros que já têm áudio → vão para ERRO no orchestrator).

## 2026-06-10 — LANÇAMENTO: 5 vídeos produzidos, vídeo 001 publicado nas 4 redes

- **Vídeo 001 (UVB-76/Mistérios) PUBLICADO**: YouTube (youtube.com/shorts/alsJjjvlNuA), TikTok, Instagram Reels, Facebook Reels
- **Vídeos 002-005 produzidos** (Curiosidades/Psicologia/Motivacional/Casos Reais), em PRONTO_PUBLICACAO
- Pipeline provado ponta a ponta: roteiro (harness) → ElevenLabs (voz Daniel + receita E travada) → Seedance 2.0 (cenas) → avatar mascote animado (chroma) → legendas sincronizadas (timestamps) → trilha por emoção (ffmpeg synth) → montagem → publicação assistida
- Identidade nas redes: PULSO / @pulsohistorias (YT+TikTok 100%; IG/FB parciais)
- Novos docs: HARNESS_ROTEIRO_PULSO.md (bíblia editorial), 17_CONTROLE_DE_AGENDA_GRADE.md, redes/CONFIG_REDES_PULSO.md
- Banco: 5 ideias/roteiros/pipeline registrados (origem lote_lancamento_claude) + metricas_publicacao
- Assets de marca: avatar transparente + chroma + animação em OneDrive pulso/avatar/

## 2026-06-10 (cont.) — LANÇAMENTO COMPLETO: 20/20 publicações
- 5 vídeos publicados nas 4 redes (YouTube, TikTok, Instagram, Facebook) = 20 publicações
- YouTube: alsJjjvlNuA, VklMYX5xypc, 4MQzmgWWSos, lJ2VhSSFuxw, P_4V1un7ntY
- TikTok: 5 publicados com marcação IA (conta @pulsohistorias)
- IG+FB: via Meta Business Suite (cross-post simultâneo)
- Banco: 20/20 metricas_publicacao registradas; pipeline 5x PUBLICADO
- Teste de aderência por vertical EM ANDAMENTO (medir 24-72h)

## 2026-06-11 — Meta API configurada (F2 destravada)
- App Meta for Developers criado: "Pulso Control" (ID 1333767978163007), casos de uso API Instagram + API Páginas — sem app review para uso nas contas próprias
- Página "Pulso Projects" + IG @pulsoprojects movidos para o portfólio empresarial "Projetos Pulso" (1539817773572500)
- System user `pulso_publisher` (Admin) criado com token sem expiração e 10 permissões (publicação + insights IG/FB)
- Credenciais META_* salvas no .env local (pendente: copiar ao Vercel quando F1/F2 entrarem no código)
- API validada: page token OK, IG business account vinculado (17841478757082171), leitura de mídia/likes OK
- Caminho aberto: publicação direta IG Reels + FB Reels via Graph API e métricas Meta no app

## 2026-06-11 (cont.) — F1 NO AR: métricas reais no app
- Envs META_* + INSTAGRAM_ACCESS_TOKEN no Vercel (token novo com instagram_manage_insights)
- Rota /api/automation/coletar-metricas reescrita contra o schema real + cron diário 8h BRT (vercel.json)
- 5 vídeos do lançamento agora existem na cadeia completa: conteudos → conteudo_variantes → pulso_distribution.posts (20 posts PUBLICADO)
- Snapshots diários em pulso_analytics.metricas_diarias (FK válida) → painel /analytics com números reais
- IDs YouTube V1/V4 corrigidos (confusão l/I): aIsJjjviNuA, IJ2VhSSFuxw
- Push corrigido: credencial x-access-token fixada no remote origin
- PRIMEIRA LEITURA DE ADERÊNCIA (24h): YouTube V1 Mistérios 282 views (12x o 2º lugar V5 Casos Reais 22) — sinal forte pra faixa âncora da grade; IG total ~551 views distribuído

## 2026-06-11 (cont. 2) — Central de comando: 7 frentes implementadas
- /validacao reescrita: aderência viva das 4 redes (auto + cowork), ranking por vertical, coletar agora, refresh 5min
- MODO_FOCO desativado — operação multi-canal de volta em ideias/roteiros/producao/publicar/canais
- Prompt de ideias AI reescrito com o harness (emoção-âncora, lacuna de curiosidade, STEPPS, fatos reais)
- /producao: banner de antecipação (dias de cobertura vs meta 7-20 dias, via plano_publicacao)
- /publicar: botão "Copiar kit" (kit completo por rede com configs e hashtags) — gate humano via navegador
- /analytics virou BI: filtros rede/vertical/período, curva diária, custo AI por vídeo (lib/config/custos.ts), receita aguardando gate CNPJ
- Coletor Facebook Reels via video_insights — 15/20 publicações automáticas; TikTok via rotina cowork atualizada

## 2026-06-11 (cont. 3) — Geração AI de ideias validada em produção
- /api/automation/gerar-ideias: parse robusto (objeto único, array embrulhado), fallback de rotação de canais (canal com menos ideias), emocao_ancora no metadata
- Validado ponta a ponta em produção: rotação automática → GPT-4o → ideia salva como RASCUNHO (curadoria humana decide)
- Próximo refinamento: forçar N ideias por chamada (GPT às vezes devolve 1)

## 2026-06-11 (cont. 4) — Ciclo completo dentro do app: ideia AI → roteiro AI → publicar via Meta API
- gerar-roteiro: prompt com harness (lacuna, emoção-âncora, fatos reais, TTS-friendly); testado em produção — roteiro "Por que a Lua brilha no escuro?" gerado com quality_score 100, 68s, status RASCUNHO (gate humano)
- /api/automation/publicar REESCRITA: publica IG Reels + FB Reels DIRETO via Graph API (container/publish + reels start/upload/finish), exige confirmar:true (R-011), registra metricas_publicacao + pipeline; "Manus" órfão aposentado
- Gate de confirmação validado em produção (400 sem confirmar)
- Primeira publicação real via API: no próximo vídeo do pipeline (precisa de video_url público — Supabase Storage ou OneDrive direto)

## 2026-06-12 — TikTok 100% integrado: publicação E métricas via API
- TikTok for Developers: app pulso_control1 + Sandbox configurado (ícone injetado via JS), test user @pulsohistorias
- OAuth Login Kit funcionando: token salvo em pulso_core.configuracoes (tiktok_oauth), refresh automático
- /api/automation/tiktok-upload: envia vídeo pros RASCUNHOS do TikTok (inbox/FILE_UPLOAD) — publicação nativa pelo celular com som trending (remédio do shadowban)
- Coleta de métricas TikTok via Display API (video.list) integrada à rota coletar-metricas
- MARCO: 20/20 publicações com métricas 100% automáticas (YouTube, Instagram, Facebook, TikTok) — cowork agora só audita e reporta

## 2026-06-12 (cont.) — LOTE 2 PRODUZIDO: 5 vídeos prontos pra publicar
- 5 vídeos montados (voz Daniel + receita E, legendas sincronizadas, avatar, trilhas por emoção): Lua 75s, Relógio 61s, Relâmpagos 69s, Foco 68s, Tetris 105s
- 33 cenas Seedance (tetris perdeu 3 pro filtro de marca — esticada com clone)
- Arquivos: OneDrive video_006..010 + UPLOAD no Supabase Storage (lote2_*.mp4) prontos pra publicação via API
- Kanban: 5 cards em PRONTO_PUBLICACAO (roteiros todos aprovados)
- Cobertura do experimento: com a publicação do lote 2, 10/10 verticais testadas

## 2026-06-13 → 2026-07-31 — A ERA AUTOMÁTICA (entrada consolidada, registrada em 31/07 por despacho R-032 do digiai)

> O changelog parou em 12/06 e a esteira não parou — este bloco registra a era pra documentação
> parar de mentir sobre o app (o AGENTS.md dizia "travado desde 04/12/2025" e custou 3 rodadas de
> correção no painel do dono). Snapshot 2026-07-31: **475 publicações · 289.528 views**
> (FB 133,5k · Kwai 48,6k · YT 43,5k · TikTok 32,4k · IG 31,5k) · 193 ideias · 13 canais.

### O que substituiu o quê
- **Vercel Crons (vercel.json) substituíram o pg_cron** — os jobs 1–7/10 do pg_cron estão INATIVOS
  e apontam pra schemas que nem existem mais; a automação viva são ~10 crons Vercel
  (reconciliar 4×/dia, coletar 11h, decisor, aprender, auto-funil, auto-audio, agenda).
- **`pulso_content.*` substituiu `public.*`** como fonte — `public.posts` parou 16/06 e
  `public.metricas_diarias` 20/07 (snapshots cumulativos; somar infla ~37×). Legado a descomissionar
  (proposta em docs/20_BANCO/PROPOSTA_LIMPEZA_LEGADO_2026-07-31.md).
- **Cascata de b-roll grátis substituiu o Seedance/Veo como padrão** — banco de clips (684) →
  Pexels/Pixabay → Wan/DashScope → Veo só como último recurso. Seedance aposentado (era 81% do gasto).
- **n8n e Manus aposentados** — publicação via API própria (YT upload OAuth, IG Graph, TikTok inbox);
  Facebook ficou MANUAL de vez (via API a Meta estrangula reel a ~0 — teste A/B 11/07).

### Marcos do período
- 10/06 Desafio dos 100 Dias (dia 1) · 14/06 voz oficial ElevenLabs · 17/06 Higgsfield CLI mata
  gargalo manual de vídeo · 29/06 RLS: anon vira read-only (incidente de escrita aberta) ·
  11/07 veredito A/B: FB via API = 0, fica manual · 17/07 os 2 primeiros virais de FB (29k + 17k,
  ambos história/arqueologia) · 22/07 Wan validado (Singapura) · 25/07 curiosidade/mistério
  vencem sazonal na estratégia · 29/07 tema validado como O sinal (história/arqueologia = 6 de 6
  estouros; tese de "âncora no título" REFUTADA 0,56×) · 29/07 seguidores só do contador diário
  (derivar de conversão×reach errava 7,5×) · 30/07 /decisor no ar (radar de estouro + analista
  com trava anti-invenção) · 30/07 agenda roteada por desempenho (fim da grade fixa por canal) ·
  31/07 coleta blindada (views nunca retrocede a 0; facebook_views em chamada separada) ·
  31/07 digiai cria `public.v_espelho_pulso` (contrato consumido pelo painel — não quebrar).
