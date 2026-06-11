-- Verificar o que está acontecendo com os roteiros
-- 1. Ver estrutura da view public.roteiros
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'roteiros'
ORDER BY ordinal_position;
| column_name | data_type | | ------------------------- | --------------------------- |
| id | uuid | | ideia_id | uuid | | titulo | character varying | | versao | integer | | conteudo_md | text | | duracao_estimado_segundos | integer | | status | USER - DEFINED | | linguagem | character varying | | criado_por | uuid | | revisado_por | uuid | | metadata | jsonb | | created_at | timestamp without time zone | | updated_at | timestamp without time zone | -- 2. Ver alguns roteiros da tabela real
SELECT id,
    titulo,
    status,
    LENGTH(conteudo_md) as tamanho
FROM pulso_content.roteiros
LIMIT 5;
| id | titulo | status | tamanho | | ------------------------------------ | ---------------------------------------------- | ---------- | ------- |
| e0895bd6-c3bf-4a13-82da-48ebb98058e1 | O Homem Que Vendeu a Torre Eiffel Duas Vezes | APROVADO | 494 | | e3230649-ff22-4620-827f-ac8f6f380b23 | Golden State Killer: DNA Resolveu Após 40 Anos | EM_REVISAO | 481 | | 1e5247a9-7697-47a1-9703-3cc6f23690ad | O Segredo do Aeris em FF7 | RASCUNHO | 475 | | 790094eb-4fc4-4c63-996f-5cbbcfe87ee6 | O Homem Que Sobreviveu 2 Bombas Atômicas | APROVADO | 475 | | 093ec1d5-1ba9-4018-8b16-8075d7279115 | O Bebê Que Nasceu Grávido | APROVADO | 459 | -- 3. Ver alguns roteiros da view public
SELECT id,
    titulo,
    status,
    ideia_titulo,
    canal_nome
FROM public.roteiros
LIMIT 5;
Error: Failed to run sql query: ERROR: 42703: column "ideia_titulo" does not exist LINE 4: ideia_titulo,
^ -- 4. Comparar ideias com roteiros
SELECT i.id as ideia_id,
    i.titulo as ideia_titulo,
    r.id as roteiro_id,
    r.titulo as roteiro_titulo,
    c.nome as canal_nome
FROM pulso_content.ideias i
    LEFT JOIN pulso_content.roteiros r ON r.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
WHERE i.status = 'APROVADA'
LIMIT 10;
| ideia_id | ideia_titulo | roteiro_id | roteiro_titulo | canal_nome | | ------------------------------------ | ------------------------------------------- | ------------------------------------ | ----------------- | -------------------------- |
| fb69fd52-18d1-400e-b75f-fadc463fe557 | Experimento Humano Mais Bizarro | null | null | Pulso Dark PT | | 0b9d378c-b421-4b2c-8556-a66142f44224 | A Água que Te Mata em Segundos | null | null | Pulso Dark PT | | 11f1c9f8-9073-4e2e-b670-066cd76c2820 | A Casa Winchester | 01907920 - 887f - 4af6 - 9ea9 - 36ba48585153 | A Casa Winchester | PULSO Mistérios & História | | a4944343-fdf5-4aaf-ac1f-9406d6ea2488 | A Doença que Te Faz Morrer de Riso | null | null | Pulso Dark PT | | 36443ad0-51f6-48b1-8e6c-a83722badf70 | A Radiação que Te Mata Amanhã | null | null | Pulso Dark PT | | e5244474-88ec-4a13-9312-2b36b76a2a46 | O Experimento do Sono Russo | null | null | Pulso Dark PT | | d4032444-9ae2-45ed-bd44-43b0721d6e9f | Seu Cérebro Inventa Memórias Falsas | null | null | PULSO Curiosidades | | c5fe8aa3-43ec-43d6-b09e-0d8636637323 | O Planeta Onde Chove Vidro | null | null | Pulso Dark PT | | dc7575ed-7cb5-48c5-89cb-fb1d0eafb2e8 | 3 Sinais de Esgotamento Mental | null | null | PULSO Mistérios & História | | 2735ca5a-4256-430c-b22a-91a7091cdd89 | O Farol de Flannan Isles - 3 Homens Sumiram | null | null | PULSO Mistérios & História |