SELECT
canal,
serie,
ideia_id,
ideia_titulo,
pipeline_status,
datahora_publicacao_planejada
FROM pulso_content.vw_agenda_publicacao_detalhada
WHERE datahora_publicacao_planejada IS NOT NULL
AND datahora_publicacao_planejada::date >= DATE '2025-12-01'
ORDER BY datahora_publicacao_planejada,
canal,
serie,
ideia_prioridade DESC;

| canal                      | serie                     | ideia_id                             | ideia_titulo                          | pipeline_status    | datahora_publicacao_planejada |
| -------------------------- | ------------------------- | ------------------------------------ | ------------------------------------- | ------------------ | ----------------------------- |
| PULSO Curiosidades         | Ciência Estranha          | bb3f8773-4f2a-471f-ad84-82e2c2c98231 | Gêmeos Parasitas                      | ROTEIRO_PRONTO     | 2025-12-01 00:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 27cd82ed-0539-4ebe-beb4-b31ed0e1b7e3 | A Garota do Elevador Elisa Lam        | AGUARDANDO_ROTEIRO | 2025-12-01 00:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | df3582e0-6147-473f-ada1-7bb9af265e1c | Faxineira aos 45, CEO aos 55          | AGUARDANDO_ROTEIRO | 2025-12-01 00:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | 6671fc4d-ef16-4d48-bb83-8eb909fc8c3b | Do Vício à Maratona                   | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | cd933c74-00e8-4d77-ab79-b51f68ad5b38 | Professor que Voltou a Estudar aos 60 | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | 5b6646d0-fc6e-4d01-997f-b9fd92608a4e | Sua Desculpa Favorita                 | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | 0e59c520-f38a-4218-8fae-03b658d4126c | Você Não é Especial (E Tudo Bem)      | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | ec5f5d1c-d381-4a6e-ab16-7fee25520876 | O Amanhã Que Nunca Chega              | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Curiosidades         | Curiosidades Dark         | c18b0d83-eecc-487c-bb85-87394f40a912 | O Silêncio Absoluto Te Enlouquece     | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Dark         | 78ed1608-a9fb-4bfe-9f92-157397280cfd | A Ilusão do Livre Arbítrio            | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | 90feda5d-a9ef-4cf5-81be-bc07d051767b | Gaslighting Que Você Faz em Si Mesmo  | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | 42b0f463-e32b-4a94-87d2-828e833e8b5e | Você Mente 200 Vezes Por Dia          | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | 408fc115-fe02-4c8c-a1b8-7ff57c368b9f | O Paradoxo da Escolha                 | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | 00abf09c-84fd-485a-b1a4-3ee27a0801b4 | O Efeito Zeigarnik                    | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Mistérios & História | Casos Reais Misteriosos   | 614ce87d-e2a2-4c2f-82f2-6a7efdfdffc9 | O Caso dos Irmãos Sodder              | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Casos Reais Misteriosos   | 0bda4f6c-daf3-4693-95f2-76b3556b7ddf | A Morte de Gloria Ramirez             | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Casos Reais Misteriosos   | 3c33b554-6781-492e-ab8e-42cc689439f0 | A Colônia Perdida de Roanoke          | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Enigmas Históricos        | ddb8fda2-ea7e-41d4-a1b3-a7ed38be885d | O Manuscrito Voynich                  | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Enigmas Históricos        | 9896dc56-e7c4-4b2d-8d5e-e112a421ad71 | O Tesouro dos Templários              | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 52b67a6e-bbda-4170-9b54-c783164db2e5 | O Homem de Taman Shud                 | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 7a173f7d-dd6e-4f65-8188-b02f61526e36 | O Suicídio Coletivo de Baleias        | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 2004f64a-c873-4bbc-ace4-2e5f22f7991b | Você Não Precisa Ser Perfeito         | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Contos & Microficção | Storytelling Curto        | d24a1711-c260-4d0e-b7ca-2e4e62246118 | O Espelho Vazio                       | AGUARDANDO_ROTEIRO | 2025-12-01 23:00:00+00        |
| PULSO Curiosidades         | Ciência Estranha          | dd0822e1-b87d-43a9-9e95-385e75868c6c | Bactérias que Controlam Seu Humor     | ROTEIRO_PRONTO     | 2025-12-03 00:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 8aa3dcc6-46fb-46b1-b183-bb8c9b8e5c5c | A Ilha dos Mortos - Poveglia          | AGUARDANDO_ROTEIRO | 2025-12-03 00:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | c0dc5db9-2282-42e1-b402-1565f9372d1f | Do Falido ao Fundador                 | ROTEIRO_PRONTO     | 2025-12-03 00:00:00+00        |
| PULSO Curiosidades         | Ciência Estranha          | d4032444-9ae2-45ed-bd44-43b0721d6e9f | Seu Cérebro Inventa Memórias Falsas   | AGUARDANDO_ROTEIRO | 2025-12-05 00:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | 11f1c9f8-9073-4e2e-b670-066cd76c2820 | A Casa Winchester                     | ROTEIRO_PRONTO     | 2025-12-05 00:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | 3c3aec9b-b6a0-40e4-a888-55cf683e12c7 | A Decisão do Jantar                   | AGUARDANDO_ROTEIRO | 2025-12-05 00:00:00+00        |

-- 1) Ver se a view tem linhas
SELECT COUNT(\*)
FROM pulso_content.vw_agenda_publicacao_detalhada;

| count |
| ----- |
| 31    |

-- 2) Ver quantas já têm data/hora planejada
SELECT COUNT(\*)
FROM pulso_content.vw_agenda_publicacao_detalhada
WHERE datahora_publicacao_planejada IS NOT NULL;

| count |
| ----- |
| 29    |

-- 3) Ver as próximas 20 publicações planejadas
SELECT
canal,
serie,
ideia_titulo,
pipeline_status,
datahora_publicacao_planejada
FROM pulso_content.vw_agenda_publicacao_detalhada
WHERE datahora_publicacao_planejada IS NOT NULL
ORDER BY datahora_publicacao_planejada
LIMIT 20;

| canal                      | serie                     | ideia_titulo                          | pipeline_status    | datahora_publicacao_planejada |
| -------------------------- | ------------------------- | ------------------------------------- | ------------------ | ----------------------------- |
| PULSO Mistérios & História | Mistérios Urbanos         | A Garota do Elevador Elisa Lam        | AGUARDANDO_ROTEIRO | 2025-12-01 00:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | Faxineira aos 45, CEO aos 55          | AGUARDANDO_ROTEIRO | 2025-12-01 00:00:00+00        |
| PULSO Curiosidades         | Ciência Estranha          | Gêmeos Parasitas                      | ROTEIRO_PRONTO     | 2025-12-01 00:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | Você Não é Especial (E Tudo Bem)      | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | Do Vício à Maratona                   | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | Sua Desculpa Favorita                 | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Histórias que Viram Chave | Professor que Voltou a Estudar aos 60 | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Motivacional         | Reflexões Diretas         | O Amanhã Que Nunca Chega              | AGUARDANDO_ROTEIRO | 2025-12-01 08:00:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | O Efeito Zeigarnik                    | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Dark         | O Silêncio Absoluto Te Enlouquece     | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | O Paradoxo da Escolha                 | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | Você Mente 200 Vezes Por Dia          | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Dark         | A Ilusão do Livre Arbítrio            | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Curiosidades         | Curiosidades Psicológicas | Gaslighting Que Você Faz em Si Mesmo  | AGUARDANDO_ROTEIRO | 2025-12-01 19:30:00+00        |
| PULSO Mistérios & História | Casos Reais Misteriosos   | A Colônia Perdida de Roanoke          | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | Você Não Precisa Ser Perfeito         | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Enigmas Históricos        | O Manuscrito Voynich                  | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Enigmas Históricos        | O Tesouro dos Templários              | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Casos Reais Misteriosos   | A Morte de Gloria Ramirez             | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
| PULSO Mistérios & História | Mistérios Urbanos         | O Homem de Taman Shud                 | AGUARDANDO_ROTEIRO | 2025-12-01 21:00:00+00        |
