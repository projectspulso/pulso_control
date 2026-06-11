-- =====================================================
-- DELETAR DUPLICATAS - VERSÃO FINAL (IDs CORRETOS)
-- =====================================================
-- ESTRATÉGIA: Manter o SEGUNDO ID de cada par (mais recente ou melhor status)
-- 1. DELETAR DA PIPELINE (roteiros duplicados - manter o 2º)
DELETE FROM pulso_content.pipeline_producao
WHERE roteiro_id IN (
        'cf9e80f6-b43e-4855-89ea-58c82b45402e',
        -- A Casa Winchester (manter 01907920)
        '178e6a96-93f8-4fec-af24-8044c534beca',
        -- Elisa Lam (manter f1b02580)
        'ba2b3f19-9ae1-4cda-a353-ece73b8e2cef',
        -- Ilha Mortos (manter a606d570)
        'e703c9c7-b3a1-4783-96a3-7bb308f17d0a',
        -- Bactérias RASCUNHO (manter 2da50154 EM_REVISAO)
        'da115164-81e0-489e-8aa5-3d2b67f0e2b6',
        -- Gêmeos (manter 45c9f5bc)
        '787d9953-9906-4b4f-8776-d0fdf033eb3e' -- Priões (manter 862fecfa)
    );
-- 2. DELETAR ROTEIROS DUPLICADOS
DELETE FROM pulso_content.roteiros
WHERE id IN (
        'cf9e80f6-b43e-4855-89ea-58c82b45402e',
        '178e6a96-93f8-4fec-af24-8044c534beca',
        'ba2b3f19-9ae1-4cda-a353-ece73b8e2cef',
        'e703c9c7-b3a1-4783-96a3-7bb308f17d0a',
        'da115164-81e0-489e-8aa5-3d2b67f0e2b6',
        '787d9953-9906-4b4f-8776-d0fdf033eb3e'
    );
-- 3. DELETAR DA PIPELINE (ideias duplicadas - manter aprovadas/com roteiros)
DELETE FROM pulso_content.pipeline_producao
WHERE ideia_id IN (
        'f64d8a7d-ab33-4067-9c57-a96056b85244',
        -- Casa Winchester (manter 11f1c9f8)
        '185ce601-bcb9-4fcc-b845-5590e23c68b1',
        -- Elisa Lam (manter 27cd82ed)
        '79282856-f9ca-4cb3-ba18-5668670619a0',
        -- Ilha Mortos (manter 8aa3dcc6)
        '167ae68f-bdc5-453e-9bec-d99d26e6316a',
        -- Bactérias (manter dd0822e1)
        '2847eefb-15ed-42f3-bee5-1e58b0b5597b',
        -- Gêmeos (manter bb3f8773)
        'cddb4445-f55d-4ecc-83b7-90fdd3e855c1' -- Priões (manter ecf951d5)
    );
-- 4. DELETAR ROTEIROS (que dependem das ideias duplicadas a serem deletadas)
-- Estas ideias NÃO estão na pipeline mas TÊM roteiros, então deletar os roteiros primeiro
DELETE FROM pulso_content.roteiros
WHERE ideia_id IN (
        'f64d8a7d-ab33-4067-9c57-a96056b85244',
        -- Casa Winchester
        '185ce601-bcb9-4fcc-b845-5590e23c68b1',
        -- Elisa Lam
        '79282856-f9ca-4cb3-ba18-5668670619a0',
        -- Ilha Mortos
        '167ae68f-bdc5-453e-9bec-d99d26e6316a',
        -- Bactérias
        '2847eefb-15ed-42f3-bee5-1e58b0b5597b',
        -- Gêmeos
        'cddb4445-f55d-4ecc-83b7-90fdd3e855c1' -- Priões
    );
-- 5. DELETAR IDEIAS DUPLICADAS (agora não há mais FKs bloqueando)
DELETE FROM pulso_content.ideias
WHERE id IN (
        -- Ideias com roteiros (já deletados acima)
        'f64d8a7d-ab33-4067-9c57-a96056b85244',
        -- Casa Winchester
        '185ce601-bcb9-4fcc-b845-5590e23c68b1',
        -- Elisa Lam
        '79282856-f9ca-4cb3-ba18-5668670619a0',
        -- Ilha Mortos
        '167ae68f-bdc5-453e-9bec-d99d26e6316a',
        -- Bactérias
        '2847eefb-15ed-42f3-bee5-1e58b0b5597b',
        -- Gêmeos
        'cddb4445-f55d-4ecc-83b7-90fdd3e855c1',
        -- Priões
        -- Ideias sem roteiros (deletar RASCUNHO, manter APROVADA)
        '8ab47b01-fda0-44c3-8e97-1e040fd7768d',
        -- Mão Alienígena RASCUNHO (manter f55b110d APROVADA)
        '6a0b502b-2049-4aba-9e6a-6caaf0bdf6b9',
        -- Ninguém Vai Te Salvar RASCUNHO (manter d3d4e2e0 APROVADA)
        'c31d6758-9254-44d1-9e09-3ceb31a1b18a',
        -- Universo 25 RASCUNHO (manter c3e88661 APROVADA)
        '44d3dd18-2737-46f1-b8cf-a72785b4bc3e',
        -- Taman Shud (manter 52b67a6e - ambos RASCUNHO, manter 2º)
        'ce1281fc-693a-4f81-b107-915322845c29',
        -- Paradoxo RASCUNHO (manter 734e3538 APROVADA)
        '2e92281e-0cf4-4d41-8713-0ff67e7ee6f8',
        -- Silêncio (manter c18b0d83 - ambos RASCUNHO, manter 2º)
        'f1d81b31-8297-4e8e-add4-a20c0d68eeaf',
        -- Baleias (manter 7a173f7d - ambos RASCUNHO, manter 2º)
        'a4d3c5a0-da48-41c7-a4c6-4e20dd31ab3f' -- Você Nunca Viu (manter 505b1be2 - ambos RASCUNHO, manter 2º)
    );
-- 6. VERIFICAR RESULTADO FINAL
SELECT 'CONTAGENS FINAIS' as resultado;
SELECT 'Roteiros' as tabela,
    COUNT(*) as total
FROM pulso_content.roteiros
UNION ALL
SELECT 'Ideias' as tabela,
    COUNT(*) as total
FROM pulso_content.ideias
UNION ALL
SELECT 'Pipeline' as tabela,
    COUNT(*) as total
FROM pulso_content.pipeline_producao;
| tabela | total | | -------- | ----- |
| Roteiros | 21 | | Ideias | 114 | | Pipeline | 21 | -- 7. VERIFICAR SE AINDA HÁ DUPLICATAS
SELECT 'VERIFICANDO DUPLICATAS RESTANTES' as verificacao;
SELECT 'ROTEIROS' as tipo,
    titulo,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY titulo
HAVING COUNT(*) > 1;
SELECT 'IDEIAS' as tipo,
    titulo,
    COUNT(*) as quantidade
FROM pulso_content.ideias
GROUP BY titulo
HAVING COUNT(*) > 1;
| verificacao | | -------------------------------- |
| VERIFICANDO DUPLICATAS RESTANTES |