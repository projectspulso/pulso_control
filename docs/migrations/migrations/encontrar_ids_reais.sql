-- =====================================================
-- ENCONTRAR IDs REAIS DAS DUPLICATAS
-- =====================================================
-- 1. ENCONTRAR ROTEIROS DUPLICADOS COM IDs REAIS DA TABELA
SELECT 'ROTEIROS DUPLICADOS (TABELA REAL)' as tipo,
    titulo,
    array_agg(
        id
        ORDER BY created_at
    ) as ids,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY titulo;
| tipo | titulo | ids | quantidade | | --------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| ROTEIROS DUPLICADOS (TABELA REAL) | A Casa Winchester | ["cf9e80f6-b43e-4855-89ea-58c82b45402e","01907920-887f-4af6-9ea9-36ba48585153"] | 2 | | ROTEIROS DUPLICADOS (TABELA REAL) | A Garota do Elevador Elisa Lam | ["178e6a96-93f8-4fec-af24-8044c534beca","f1b02580-372f-4823-ab72-ab86399230d4"] | 2 | | ROTEIROS DUPLICADOS (TABELA REAL) | A Ilha dos Mortos - Poveglia | ["ba2b3f19-9ae1-4cda-a353-ece73b8e2cef","a606d570-c030-4717-870a-1c2859b13766"] | 2 | | ROTEIROS DUPLICADOS (TABELA REAL) | Bactérias que Controlam Seu Humor | ["e703c9c7-b3a1-4783-96a3-7bb308f17d0a","2da50154-82ef-4de8-a0f4-91cb3c2e44bf"] | 2 | | ROTEIROS DUPLICADOS (TABELA REAL) | Gêmeos Parasitas | ["da115164-81e0-489e-8aa5-3d2b67f0e2b6","45c9f5bc-eee3-4843-8b35-a88447686c08"] | 2 | | ROTEIROS DUPLICADOS (TABELA REAL) | Priões: O Vírus Indestrutível | ["787d9953-9906-4b4f-8776-d0fdf033eb3e","862fecfa-b59e-48f8-bb05-857ec1bf77d4"] | 2 | -- 2. ENCONTRAR IDEIAS DUPLICADAS COM IDs REAIS DA TABELA
SELECT 'IDEIAS DUPLICADAS (TABELA REAL)' as tipo,
    titulo,
    array_agg(
        id
        ORDER BY created_at
    ) as ids,
    COUNT(*) as quantidade
FROM pulso_content.ideias
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY titulo;
| tipo | titulo | ids | quantidade | | ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| IDEIAS DUPLICADAS (TABELA REAL) | A Casa Winchester | ["11f1c9f8-9073-4e2e-b670-066cd76c2820","f64d8a7d-ab33-4067-9c57-a96056b85244"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | A Garota do Elevador Elisa Lam | ["27cd82ed-0539-4ebe-beb4-b31ed0e1b7e3","185ce601-bcb9-4fcc-b845-5590e23c68b1"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | A Ilha dos Mortos - Poveglia | ["8aa3dcc6-46fb-46b1-b183-bb8c9b8e5c5c","79282856-f9ca-4cb3-ba18-5668670619a0"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | A Síndrome da Mão Alienígena | ["8ab47b01-fda0-44c3-8e97-1e040fd7768d","f55b110d-e2b5-4710-82dd-be30598518a4"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | Bactérias que Controlam Seu Humor | ["dd0822e1-b87d-43a9-9e95-385e75868c6c","167ae68f-bdc5-453e-9bec-d99d26e6316a"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | Gêmeos Parasitas | ["bb3f8773-4f2a-471f-ad84-82e2c2c98231","2847eefb-15ed-42f3-bee5-1e58b0b5597b"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | Ninguém Vai Te Salvar | ["6a0b502b-2049-4aba-9e6a-6caaf0bdf6b9","d3d4e2e0-0839-4ef5-aae4-f1758fadbe2f"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | O Experimento do Universo 25 | ["c3e88661-d338-4a74-a94c-f7f0355532e1","c31d6758-9254-44d1-9e09-3ceb31a1b18a"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | O Homem de Taman Shud | ["44d3dd18-2737-46f1-b8cf-a72785b4bc3e","52b67a6e-bbda-4170-9b54-c783164db2e5"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | O Paradoxo do Aniversário | ["ce1281fc-693a-4f81-b107-915322845c29","734e3538-343d-4037-801a-19986c9f35ef"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | O Silêncio Absoluto Te Enlouquece | ["2e92281e-0cf4-4d41-8713-0ff67e7ee6f8","c18b0d83-eecc-487c-bb85-87394f40a912"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | O Suicídio Coletivo de Baleias | ["f1d81b31-8297-4e8e-add4-a20c0d68eeaf","7a173f7d-dd6e-4f65-8188-b02f61526e36"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | Priões: O Vírus Indestrutível | ["ecf951d5-317b-457b-a497-99fd18e37b74","cddb4445-f55d-4ecc-83b7-90fdd3e855c1"] | 2 | | IDEIAS DUPLICADAS (TABELA REAL) | Você Nunca Viu Seu Rosto | ["a4d3c5a0-da48-41c7-a4c6-4e20dd31ab3f","505b1be2-6a28-4433-a72d-4a4fb81aeed6"] | 2 | -- 3. DETALHES COMPLETOS DOS ROTEIROS DUPLICADOS (para decidir qual manter)
WITH duplicatas AS (
    SELECT titulo
    FROM pulso_content.roteiros
    GROUP BY titulo
    HAVING COUNT(*) > 1
)
SELECT r.id,
    r.titulo,
    r.status,
    r.versao,
    r.created_at,
    r.ideia_id,
    r.canal_id,
    -- Mostrar se está na pipeline
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
        WHERE roteiro_id = r.id
    ) as na_pipeline
FROM pulso_content.roteiros r
WHERE r.titulo IN (
        SELECT titulo
        FROM duplicatas
    )
ORDER BY r.titulo,
    r.created_at;
| id | titulo | status | versao | created_at | ideia_id | canal_id | na_pipeline | | ------------------------------------ | --------------------------------- | ---------- | ------ | -------------------------- | ------------------------------------ | ------------------------------------ | ----------- |
| cf9e80f6-b43e-4855-89ea-58c82b45402e | A Casa Winchester | EM_REVISAO | 1 | 2025 -11 -23 18 :49 :47.458109 | f64d8a7d-ab33-4067-9c57-a96056b85244 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | 01907920 - 887f - 4af6 - 9ea9 - 36ba48585153 | A Casa Winchester | EM_REVISAO | 1 | 2025 -11 -23 18 :49 :47.458109 | 11f1c9f8-9073-4e2e-b670-066cd76c2820 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | 178e6a96-93f8-4fec-af24-8044c534beca | A Garota do Elevador Elisa Lam | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | 27cd82ed-0539-4ebe-beb4-b31ed0e1b7e3 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | f1b02580-372f-4823-ab72-ab86399230d4 | A Garota do Elevador Elisa Lam | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | 185ce601-bcb9-4fcc-b845-5590e23c68b1 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | ba2b3f19-9ae1-4cda-a353-ece73b8e2cef | A Ilha dos Mortos - Poveglia | RASCUNHO | 1 | 2025 -11 -23 18 :49 :47.458109 | 8aa3dcc6-46fb-46b1-b183-bb8c9b8e5c5c | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | a606d570-c030-4717-870a-1c2859b13766 | A Ilha dos Mortos - Poveglia | RASCUNHO | 1 | 2025 -11 -23 18 :49 :47.458109 | 79282856 - f9ca - 4cb3 - ba18 - 5668670619a0 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | | e703c9c7-b3a1-4783-96a3-7bb308f17d0a | Bactérias que Controlam Seu Humor | RASCUNHO | 1 | 2025 -11 -23 18 :49 :47.458109 | 167ae68f-bdc5-453e-9bec-d99d26e6316a | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | | 2da50154-82ef-4de8-a0f4-91cb3c2e44bf | Bactérias que Controlam Seu Humor | EM_REVISAO | 1 | 2025 -11 -23 18 :49 :47.458109 | dd0822e1-b87d-43a9-9e95-385e75868c6c | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | | da115164-81e0-489e-8aa5-3d2b67f0e2b6 | Gêmeos Parasitas | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | 2847eefb-15ed-42f3-bee5-1e58b0b5597b | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | | 45c9f5bc-eee3-4843-8b35-a88447686c08 | Gêmeos Parasitas | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | bb3f8773-4f2a-471f-ad84-82e2c2c98231 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | | 787d9953-9906-4b4f-8776-d0fdf033eb3e | Priões: O Vírus Indestrutível | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | ecf951d5-317b-457b-a497-99fd18e37b74 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | | 862fecfa-b59e-48f8-bb05-857ec1bf77d4 | Priões: O Vírus Indestrutível | APROVADO | 1 | 2025 -11 -23 18 :49 :47.458109 | cddb4445-f55d-4ecc-83b7-90fdd3e855c1 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | -- 4. DETALHES COMPLETOS DAS IDEIAS DUPLICADAS
WITH duplicatas AS (
    SELECT titulo
    FROM pulso_content.ideias
    GROUP BY titulo
    HAVING COUNT(*) > 1
)
SELECT i.id,
    i.titulo,
    i.status,
    i.created_at,
    i.canal_id,
    -- Mostrar quantos roteiros essa ideia tem
    (
        SELECT COUNT(*)
        FROM pulso_content.roteiros
        WHERE ideia_id = i.id
    ) as tem_roteiros,
    -- Mostrar se está na pipeline
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
        WHERE ideia_id = i.id
    ) as na_pipeline
FROM pulso_content.ideias i
WHERE i.titulo IN (
        SELECT titulo
        FROM duplicatas
    )
ORDER BY i.titulo,
    i.created_at;
| id | titulo | status | created_at | canal_id | tem_roteiros | na_pipeline | | ------------------------------------ | --------------------------------- | -------- | -------------------------- | ------------------------------------ | ------------ | ----------- |
| 11f1c9f8-9073-4e2e-b670-066cd76c2820 | A Casa Winchester | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | f64d8a7d-ab33-4067-9c57-a96056b85244 | A Casa Winchester | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | 27cd82ed-0539-4ebe-beb4-b31ed0e1b7e3 | A Garota do Elevador Elisa Lam | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | 185ce601-bcb9-4fcc-b845-5590e23c68b1 | A Garota do Elevador Elisa Lam | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | 8aa3dcc6-46fb-46b1-b183-bb8c9b8e5c5c | A Ilha dos Mortos - Poveglia | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | 79282856 - f9ca - 4cb3 - ba18 - 5668670619a0 | A Ilha dos Mortos - Poveglia | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 1 | 1 | | 8ab47b01-fda0-44c3-8e97-1e040fd7768d | A Síndrome da Mão Alienígena | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | f55b110d-e2b5-4710-82dd-be30598518a4 | A Síndrome da Mão Alienígena | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | 167ae68f-bdc5-453e-9bec-d99d26e6316a | Bactérias que Controlam Seu Humor | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | dd0822e1-b87d-43a9-9e95-385e75868c6c | Bactérias que Controlam Seu Humor | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | bb3f8773-4f2a-471f-ad84-82e2c2c98231 | Gêmeos Parasitas | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | 2847eefb-15ed-42f3-bee5-1e58b0b5597b | Gêmeos Parasitas | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | 6a0b502b-2049-4aba-9e6a-6caaf0bdf6b9 | Ninguém Vai Te Salvar | RASCUNHO | 2025 -11 -20 17 :56 :58.076498 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 0 | 0 | | d3d4e2e0-0839-4ef5-aae4-f1758fadbe2f | Ninguém Vai Te Salvar | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 6212146f-a152-4909-852b-c4043451f4df | 0 | 0 | | c31d6758-9254-44d1-9e09-3ceb31a1b18a | O Experimento do Universo 25 | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | c3e88661-d338-4a74-a94c-f7f0355532e1 | O Experimento do Universo 25 | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | 44d3dd18-2737-46f1-b8cf-a72785b4bc3e | O Homem de Taman Shud | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 0 | 0 | | 52b67a6e-bbda-4170-9b54-c783164db2e5 | O Homem de Taman Shud | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 0 | 0 | | 734e3538-343d-4037-801a-19986c9f35ef | O Paradoxo do Aniversário | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | ce1281fc-693a-4f81-b107-915322845c29 | O Paradoxo do Aniversário | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | c18b0d83-eecc-487c-bb85-87394f40a912 | O Silêncio Absoluto Te Enlouquece | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | 2e92281e-0cf4-4d41-8713-0ff67e7ee6f8 | O Silêncio Absoluto Te Enlouquece | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | f1d81b31-8297-4e8e-add4-a20c0d68eeaf | O Suicídio Coletivo de Baleias | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 0 | 0 | | 7a173f7d-dd6e-4f65-8188-b02f61526e36 | O Suicídio Coletivo de Baleias | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 257b5ac4-72ab-4d96-a2eb-031833a319a6 | 0 | 0 | | cddb4445-f55d-4ecc-83b7-90fdd3e855c1 | Priões: O Vírus Indestrutível | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | ecf951d5-317b-457b-a497-99fd18e37b74 | Priões: O Vírus Indestrutível | APROVADA | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 1 | 1 | | a4d3c5a0-da48-41c7-a4c6-4e20dd31ab3f | Você Nunca Viu Seu Rosto | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 | | 505b1be2-6a28-4433-a72d-4a4fb81aeed6 | Você Nunca Viu Seu Rosto | RASCUNHO | 2025 -11 -21 03 :28 :57.135711 | 91ea6bcf-2eda-413e-893c-1fc6b02ff902 | 0 | 0 |