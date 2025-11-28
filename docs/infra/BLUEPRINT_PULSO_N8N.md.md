1. Visão geral do ecossistema PULSO
   1.1. Onde estão os dados principais

Schemas principais:

pulso_content.ideias

Status: RASCUNHO / APROVADA / etc.

Campos importantes: id, canal_id, titulo, descricao, status, metadata (tipo_conteudo, duração, etc.)

pulso_content.roteiros

Já está com:

id

ideia_id

titulo

conteudo_md (roteiro hollywoodiano final)

duracao_estimado_segundos

status (RASCUNHO / APROVADO / etc.)

categoria_metadata (PADRAO_COMPLETO, VAZIO, LEGADO_AUTO, etc.)

metadata (idioma, pipeline_alvo, estilo_narrativa, pronto_para_render, etc.)

Views (em public) que você já está consumindo no front:

Ex: public.vw_roteiros_completos (ou equivalente)

Junta ideias + roteiros + canal + pipeline + diagnósticos.

pulso_assets (já existem tabelas de áudio/vídeo/imagens)

Provavelmente algo como:

pulso_assets.audios

pulso_assets.videos

pulso_assets.imagens

Com campos de referência: roteiro_id, ideia_id, canal_id, tipo, url, status, metadata.

Decisão importante:
👉 Não vamos criar tabelas novas se as de pulso_assets já cobrem:

Áudio TTS final

Vídeo final

Thumbnails / imagens do mascote

Se um dia faltar alguma coluna (ex: provedor, modelo, resolution), a gente adiciona cirurgicamente.

2. Objetivo do pipeline no n8n

Meta:
Com 1 clique (ou com um gatilho manual/cron), pegar um roteiro pronto e passar pelo fluxo:

Validar se o roteiro está pronto para render:

roteiros.status = 'APROVADO' (ou pronto_para_render = true no JSON)

categoria_metadata = 'PADRAO_COMPLETO' (texto ok)

Gerar narração em áudio (TTS) com voz padrão PULSO.

Gerar ou montar o vídeo curto (short vertical):

Plano A: vídeo animado com o mascote PULSO (obrigatório conceitualmente).

Plano B: se não for possível animação ainda, pelo menos:

Background animado

Mascote inserido como elemento fixo/animado (imagem PNG/WEBP com leve animação via editor).

Registrar o que foi feito em pulso_assets:

Registrar o áudio (arquivo + metadados)

Registrar o vídeo (arquivo + metadados)

Opcional: criar registro de post em pulso_distribution.posts (ou schema equivalente futuro) com:

canal (YouTube/TikTok/Instagram)

status (RASCUNHO_PUBLICACAO)

link do vídeo final.

3. Princípios de design dos workflows n8n

Um workflow por “macro-função”

WF01 – Gerar Roteiro (já usamos via app ou direto no Supabase)

WF02 – Gerar Áudio TTS a partir do roteiro

WF03 – Gerar Vídeo a partir do áudio + assets do mascote

WF04 – Publicar ou agendar (integração com YouTube, TikTok, etc.)

Tudo dirigido por ID de roteiro

O n8n sempre recebe roteiro_id (manual, webhook, ou lista em loop).

Idempotência básica

Antes de gerar áudio/vídeo:

Checar se já existe registro em pulso_assets para aquele roteiro_id e tipo = 'AUDIO_TTS' ou VIDEO_FINAL.

Se já existe → pular ou atualizar conforme regra.

Log detalhado em metadata JSON:

Guardar no metadata do asset:

provedor (openai, gcloud, elevenlabs, etc.)

modelo

parâmetros (voice, tempo, seed, etc.)

data de geração

status técnico (SUCESSO, ERRO_TTS, etc.)

4. Bloquinho de SQL de leitura padrão para o n8n
   4.1. Buscar um roteiro pronto por ID

Use um node Postgres (Supabase) no n8n com algo assim:

select
r.id as roteiro_id,
r.ideia_id,
r.titulo as roteiro_titulo,
r.conteudo_md,
r.duracao_estimado_segundos,
r.status as roteiro_status,
r.metadata as metadata_roteiro,
i.canal_id,
c.nome as canal_nome,
i.titulo as ideia_titulo,
i.metadata as metadata_ideia
from pulso_content.roteiros r
join pulso_content.ideias i on i.id = r.ideia_id
left join pulso_core.canais c on c.id = i.canal_id
where r.id = {{ $json.roteiro_id }};

Regras de validação no n8n (com nodes IF):

roteiro_status ∈ ('APROVADO', 'RASCUNHO' mas pronto_para_render = true, etc.)

metadata_roteiro->>'pronto_para_render' = 'true'

r.categoria_metadata = 'PADRAO_COMPLETO' (se estivermos usando esse campo sempre)

4.2. Checar se já existe áudio TTS para esse roteiro
select \*
from pulso_assets.audios a
where a.roteiro_id = {{ $json.roteiro_id }}
and a.tipo = 'AUDIO_TTS'
and a.status = 'OK';

4.3. Checar se já existe vídeo final para esse roteiro
select \*
from pulso_assets.videos v
where v.roteiro_id = {{ $json.roteiro_id }}
and v.tipo = 'VIDEO_SHORT_VERTICAL'
and v.status = 'OK';

5. Workflow WF02 – Gerar Áudio TTS a partir do roteiro
   5.1. Gatilhos possíveis

Manual (nó “Manual Trigger”) → passar roteiro_id na mão ou via input.

Cron (node “Cron”) → rodar a cada X minutos, buscar lista de roteiros prontos:

select r.id as roteiro_id
from pulso_content.roteiros r
where r.status = 'APROVADO'
and (r.metadata->>'pronto_para_render')::boolean = true
and not exists (
select 1
from pulso_assets.audios a
where a.roteiro_id = r.id
and a.tipo = 'AUDIO_TTS'
and a.status = 'OK'
)
limit 20;

5.2. Passos do workflow

Node 1 – Postgres: Buscar roteiros pendentes

Retorna lista de roteiro_id.

Node 2 – Split In Batches

Processa 1 por vez.

Node 3 – Buscar detalhes do roteiro (SQL 4.1)

Node 4 – Montar texto final para TTS

Usar um Function node para:

Extrair somente o texto narrado (sem hashes de título Markdown, se quiser).

Exemplo simples (pode manter markdown e deixar o TTS lidar).

Node 5 – Gerar Áudio (TTS)
Aqui você vai plugar o provedor que tiver disponível/grátis:

Ideias:

OpenAI TTS (gpt-4o-mini-tts ou similar) via HTTP Request

Google Cloud TTS (se tiver crédito)

ElevenLabs (se tiver plano)

Exemplo concept HTTP (pseudo):

Method: POST

URL: https://api.openai.com/v1/audio/speech

Headers: Authorization: Bearer {{OPENAI_API_KEY}}

Body: JSON

{
"model": "gpt-4o-mini-tts",
"voice": "alloy",
"input": "CONTEUDO DO ROTEIRO AQUI"
}

Marcar node para Binary Data (arquivo .mp3 / .wav)

Node 6 – Upload áudio para storage (Supabase / S3 / etc.)

Se já estiver usando Supabase Storage, usar:

HTTP Request para o endpoint storage/v1/object

Ou usar n8n com node HTTP e autenticação via apikey.

Exemplo path:

pulso/audios/{{ $json.roteiro_id }}.mp3

Node 7 – Gravar registro em pulso_assets.audios

insert into pulso_assets.audios (
roteiro_id,
ideia_id,
canal_id,
tipo,
url,
status,
metadata
) values (
{{ $json.roteiro_id }},
{{ $json.ideia_id }},
{{ $json.canal_id }},
'AUDIO_TTS',
{{ $json.url_arquivo_audio }},
'OK',
jsonb_build_object(
'provedor', 'openai',
'modelo', 'gpt-4o-mini-tts',
'voice', 'alloy',
'pipeline_alvo', {{ $json.metadata_roteiro.pipeline_alvo }},
'estilo_narrativa', {{ $json.metadata_roteiro.estilo_narrativa }},
'gerado_em', now()
)
)
on conflict (roteiro_id, tipo) do update
set url = excluded.url,
status = excluded.status,
metadata = pulso_assets.audios.metadata || excluded.metadata;

Ajustar on conflict conforme suas constraints atuais.

6. Workflow WF03 – Gerar Vídeo com Mascote

Aqui entra a parte mais “artística”, mas vamos manter técnico.

6.1. Ideia de arquitetura

Entrada: roteiro_id + asset de áudio TTS gerado.

Carrega assets fixos do mascote:

Pasta de assets estáticos:

pulso/mascote/base.png (versão neutra)

pulso/mascote/reacao_surpreso.png

pulso/mascote/reacao_serio.png

E backgrounds:

pulso/bg/dark_1.png, pulso/bg/space_1.png, etc.

Gera um “storyboard simples”:

Dividir o áudio (ou o texto do roteiro) em 3–5 blocos.

Pra cada bloco:

Escolher um background

Escolher uma pose do mascote

Montar o vídeo:

Opções:

🔧 Ferramentas low/no-code conectáveis via n8n:

Canva API (para templates de vídeo; boa para thumbnail, mais chato pra automatizar full vídeo)

Kapwing / VEED / FlexClip com API (se tiver)

Pika / Runway / Luma → ainda pouco amigáveis pra pipeline em massa, mas dá pra brincar.

🧩 Abordagem pragmática (recomendada para começar):

n8n gera:

Áudio TTS

Lista de cenas + assets (JSON)

Você usa uma etapa manual / semi-automática num editor que suporte templates + batch (ex: CapCut, Premiere com XML, DaVinci com scripts, etc.) – primeira versão.

Futuro: usar ferramentas de template de vídeo programável (Python + MoviePy / FFMPEG + script) rodando em um pequeno backend próprio acionado via n8n (HTTP Request).

6.2. Estrutura de metadata para “storyboard”

Você pode gravar em uma tabela pulso_content.roteiros_storyboard ou só no próprio metadata do roteiro/asset:

{
"cenas": [
{
"ordem": 1,
"bg": "pulso/bg/space_1.png",
"mascote": "pulso/mascote/base.png",
"inicio_seg": 0,
"fim_seg": 10,
"descricao": "Apresentação do gancho"
},
{
"ordem": 2,
"bg": "pulso/bg/space_dark.png",
"mascote": "pulso/mascote/surpreso.png",
"inicio_seg": 10,
"fim_seg": 25,
"descricao": "Explicação principal"
}
]
}

No n8n:

Node Function lê duracao_estimado_segundos e cria 3–5 blocos.

Isso é salvo no metadata do asset de vídeo ou do roteiro.

6.3. Registro do vídeo em pulso_assets.videos

Depois que você tiver o vídeo (mesmo que no começo seja gerado manualmente, mas catalogado pelo n8n):

insert into pulso_assets.videos (
roteiro_id,
ideia_id,
canal_id,
tipo,
url,
status,
metadata
) values (
{{ $json.roteiro_id }},
{{ $json.ideia_id }},
{{ $json.canal_id }},
'VIDEO_SHORT_VERTICAL',
{{ $json.url_video }},
'OK',
jsonb_build_object(
'resolution', '1080x1920',
'fps', 30,
'duracao_segundos', {{ $json.duracao_final }},
'contém_mascote', true,
'storyboard', {{ $json.storyboard }},
'gerado_em', now()
)
)
on conflict (roteiro_id, tipo) do update
set url = excluded.url,
status = excluded.status,
metadata = pulso_assets.videos.metadata || excluded.metadata;

7. Workflow WF04 – Publicação / Agendamento

Mesmo que você não publique direto agora, já deixa o modelo pronto:

Entrada: video_id ou roteiro_id.

Buscar pulso_assets.videos.

Criar registro em (exemplo) pulso_distribution.posts:

insert into pulso_distribution.posts (
canal_id,
roteiro_id,
video_asset_id,
titulo,
descricao,
status,
metadata
) values (
{{ $json.canal_id }},
{{ $json.roteiro_id }},
{{ $json.video_id }},
{{ $json.titulo }},
{{ $json.descricao }},
'RASCUNHO_PUBLICACAO',
jsonb_build_object(
'hashtags_sugeridas', {{ $json.hashtags }},
'plataformas_alvo', ['youtube_shorts', 'instagram_reels', 'tiktok'],
'melhor_horario', 'AUTO_CALENDAR'
)
);

Futuro: n8n chama APIs:

YouTube Data API

Meta (Instagram/Facebook)

TikTok API

8. Foco no mascote (regra de ouro)

Pra garantir que nenhum vídeo seja considerado “válido” sem mascote, podemos aplicar essas regras:

No metadata de pulso_assets.videos:

Campo obrigatório: "contém_mascote": true

Criar uma view de controle de qualidade:

create or replace view pulso_analytics.vw_videos_prontos as
select
v.\*,
(v.metadata->>'contém_mascote')::boolean as contem_mascote
from pulso_assets.videos v
where v.status = 'OK';

Só considerar vídeo “aprovado para publicação” se:

contem_mascote = true

tipo = 'VIDEO_SHORT_VERTICAL'

duracao_segundos entre 20 e 60.

No n8n, antes de disparar workflow de publicação, checar essa view.

9. Próximos passos práticos

Sugestão de ordem de execução:

✅ Já feito: roteiros gerados, metadata organizada, coluna categoria_metadata.

🔧 Passo 1 n8n: WF02 – Gerar Áudio TTS

Pegar um único roteiro_id de teste

Fazer do início ao fim:

Buscar roteiro

Gerar TTS (mesmo que use só uma API gratuita por enquanto)

Subir arquivo para Supabase Storage

Inserir registro em pulso_assets.audios

🔧 Passo 2 n8n: WF03 – Registrar vídeo (mesmo que no início o vídeo seja manual)

Só para ter:

videos registrados

metadata com contém_mascote = true

🔧 Passo 3 n8n: quando definirmos a ferramenta de vídeo programável (ou um backendzinho Python), conectar via HTTP.

🚀 Depois: WF04 – Publicação / agendamento.

Se você quiser, no próximo passo eu posso:

Escrever o fluxo WF02 inteiro em “pseudoconfig” de n8n, tipo:

Lista de nodes com nome, tipo, e principal configuração

Ou gerar um JSON base de workflow (estrutura n8n) pra você importar e só ajustar as credenciais.

Mas com esse blueprint você já consegue começar a montar cada workflow com segurança, sabendo exatamente:

De onde vem o dado

O que precisa validar

O que vai ser gravado em cada tabela

E como manter o mascote como estrela absoluta de tudo. 🐸⚡
