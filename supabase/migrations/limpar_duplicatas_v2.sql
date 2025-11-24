-- =====================================================
-- LIMPAR DUPLICATAS - VERSÃO 2 (ordem correta)
-- =====================================================
-- IMPORTANTE: Deletar primeiro de pipeline_producao (dependente)
-- depois de roteiros, depois de ideias
-- 1. DELETAR DA PIPELINE (onde roteiro_id aponta para duplicatas)
DELETE FROM pulso_content.pipeline_producao
WHERE roteiro_id IN (
        'da115164-fd56-447f-b9e3-daa2e1d31406',
        -- Gêmeos Parasitas
        '787d9953-7ed0-486a-ac0f-1af066baea54',
        -- Priões
        '2da50154-0e2f-4450-945b-13c40f3d55bb',
        -- Bactérias
        '178e6a96-0da8-49a7-95dc-7a8c30e26742',
        -- Elisa Lam
        'cf9e80f6-64e5-4c93-b08b-e3fc21eb2bc9',
        -- Casa Winchester
        'ba2b3f19-7354-4c80-810e-fa17374b5f84' -- Ilha dos Mortos
    );
-- 2. DELETAR ROTEIROS DUPLICADOS
DELETE FROM pulso_content.roteiros
WHERE id IN (
        'da115164-fd56-447f-b9e3-daa2e1d31406',
        -- Gêmeos Parasitas
        '787d9953-7ed0-486a-ac0f-1af066baea54',
        -- Priões
        '2da50154-0e2f-4450-945b-13c40f3d55bb',
        -- Bactérias
        '178e6a96-0da8-49a7-95dc-7a8c30e26742',
        -- Elisa Lam
        'cf9e80f6-64e5-4c93-b08b-e3fc21eb2bc9',
        -- Casa Winchester
        'ba2b3f19-7354-4c80-810e-fa17374b5f84' -- Ilha dos Mortos
    );
-- 3. DELETAR DA PIPELINE (onde ideia_id aponta para duplicatas de ideias)
DELETE FROM pulso_content.pipeline_producao
WHERE ideia_id IN (
        '43897700-f771-4dd0-8f1f-4135300d2800',
        -- Você Já Morreu
        'e72f3aa8-2298-467e-bca7-5bb3b4cc37fb',
        -- Livre Arbítrio
        '2e92281e-5df7-4e16-ad45-8cac8e8e1c6b',
        -- Silêncio Absoluto
        '505b1be2-bf72-4a7e-a849-6bb3fcdcda50',
        -- Nunca Viu Rosto
        '2847eefb-76b3-4ede-8f3b-e2e99e15b71d',
        -- Gêmeos Parasitas
        'ecf951d5-9ed2-47b1-9b67-40e3cb8f96a8',
        -- Priões
        '167ae68f-8e28-4e42-89a3-a0b8485de53b',
        -- Bactérias
        '44d3dd18-6f9c-4a3a-a11e-8c9e49d7e730',
        -- Homem Taman Shud
        '27cd82ed-e5b6-486d-bc0d-9f43c99ea9a1',
        -- Elisa Lam
        'f64d8a7d-a70e-4754-ab52-4be4eec7c5a8',
        -- Casa Winchester
        '7a173f7d-ba73-4dc7-928b-3aefa5ca60f9',
        -- Suicídio Baleias
        '8aa3dcc6-1ee9-45db-ada3-a0cee4cd6af3',
        -- Ilha Mortos
        '734e3538-3daf-4f58-8fa7-e8ca97dacc7f',
        -- Paradoxo Aniversário
        'c3e88661-2e15-4e65-adf1-ee80f63d5f02',
        -- Universo 25
        'f55b110d-ea71-4e87-b8bf-eb6a85eeb823',
        -- Mão Alienígena
        'd3d4e2e0-a95c-4cf7-87a5-29b8ebbc53fb' -- Ninguém Vai Salvar
    );
-- 4. DELETAR ROTEIROS (onde ideia_id aponta para duplicatas de ideias)
DELETE FROM pulso_content.roteiros
WHERE ideia_id IN (
        '43897700-f771-4dd0-8f1f-4135300d2800',
        -- Você Já Morreu
        'e72f3aa8-2298-467e-bca7-5bb3b4cc37fb',
        -- Livre Arbítrio
        '2e92281e-5df7-4e16-ad45-8cac8e8e1c6b',
        -- Silêncio Absoluto
        '505b1be2-bf72-4a7e-a849-6bb3fcdcda50',
        -- Nunca Viu Rosto
        '2847eefb-76b3-4ede-8f3b-e2e99e15b71d',
        -- Gêmeos Parasitas
        'ecf951d5-9ed2-47b1-9b67-40e3cb8f96a8',
        -- Priões
        '167ae68f-8e28-4e42-89a3-a0b8485de53b',
        -- Bactérias
        '44d3dd18-6f9c-4a3a-a11e-8c9e49d7e730',
        -- Homem Taman Shud
        '27cd82ed-e5b6-486d-bc0d-9f43c99ea9a1',
        -- Elisa Lam
        'f64d8a7d-a70e-4754-ab52-4be4eec7c5a8',
        -- Casa Winchester
        '7a173f7d-ba73-4dc7-928b-3aefa5ca60f9',
        -- Suicídio Baleias
        '8aa3dcc6-1ee9-45db-ada3-a0cee4cd6af3',
        -- Ilha Mortos
        '734e3538-3daf-4f58-8fa7-e8ca97dacc7f',
        -- Paradoxo Aniversário
        'c3e88661-2e15-4e65-adf1-ee80f63d5f02',
        -- Universo 25
        'f55b110d-ea71-4e87-b8bf-eb6a85eeb823',
        -- Mão Alienígena
        'd3d4e2e0-a95c-4cf7-87a5-29b8ebbc53fb' -- Ninguém Vai Salvar
    );
-- 5. DELETAR IDEIAS DUPLICADAS
DELETE FROM pulso_content.ideias
WHERE id IN (
        '43897700-f771-4dd0-8f1f-4135300d2800',
        -- Você Já Morreu
        'e72f3aa8-2298-467e-bca7-5bb3b4cc37fb',
        -- Livre Arbítrio
        '2e92281e-5df7-4e16-ad45-8cac8e8e1c6b',
        -- Silêncio Absoluto
        '505b1be2-bf72-4a7e-a849-6bb3fcdcda50',
        -- Nunca Viu Rosto
        '2847eefb-76b3-4ede-8f3b-e2e99e15b71d',
        -- Gêmeos Parasitas
        'ecf951d5-9ed2-47b1-9b67-40e3cb8f96a8',
        -- Priões
        '167ae68f-8e28-4e42-89a3-a0b8485de53b',
        -- Bactérias
        '44d3dd18-6f9c-4a3a-a11e-8c9e49d7e730',
        -- Homem Taman Shud
        '27cd82ed-e5b6-486d-bc0d-9f43c99ea9a1',
        -- Elisa Lam
        'f64d8a7d-a70e-4754-ab52-4be4eec7c5a8',
        -- Casa Winchester
        '7a173f7d-ba73-4dc7-928b-3aefa5ca60f9',
        -- Suicídio Baleias
        '8aa3dcc6-1ee9-45db-ada3-a0cee4cd6af3',
        -- Ilha Mortos
        '734e3538-3daf-4f58-8fa7-e8ca97dacc7f',
        -- Paradoxo Aniversário
        'c3e88661-2e15-4e65-adf1-ee80f63d5f02',
        -- Universo 25
        'f55b110d-ea71-4e87-b8bf-eb6a85eeb823',
        -- Mão Alienígena
        'd3d4e2e0-a95c-4cf7-87a5-29b8ebbc53fb' -- Ninguém Vai Salvar
    );
-- 6. VERIFICAR RESULTADO
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
| Roteiros | 30 | | Ideias | 128 | | Pipeline | 30 | -- 7. VERIFICAR SE AINDA HÁ DUPLICATAS DE ROTEIROS
SELECT titulo,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
| titulo | quantidade | | --------------------------------- | ---------- |
| A Casa Winchester | 2 | | A Ilha dos Mortos - Poveglia | 2 | | A Garota do Elevador Elisa Lam | 2 | | Priões: O Vírus Indestrutível | 2 | | Bactérias que Controlam Seu Humor | 2 | | Gêmeos Parasitas | 2 | -- 8. VERIFICAR SE AINDA HÁ DUPLICATAS DE IDEIAS
SELECT titulo,
    COUNT(*) as quantidade
FROM pulso_content.ideias
GROUP BY titulo
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;
| titulo | quantidade | | --------------------------------- | ---------- |
| A Casa Winchester | 2 | | Priões: O Vírus Indestrutível | 2 | | A Síndrome da Mão Alienígena | 2 | | O Paradoxo do Aniversário | 2 | | O Suicídio Coletivo de Baleias | 2 | | O Homem de Taman Shud | 2 | | A Ilha dos Mortos - Poveglia | 2 | | Bactérias que Controlam Seu Humor | 2 | | Você Nunca Viu Seu Rosto | 2 | | O Silêncio Absoluto Te Enlouquece | 2 | | Gêmeos Parasitas | 2 | | A Garota do Elevador Elisa Lam | 2 | | O Experimento do Universo 25 | 2 | | Ninguém Vai Te Salvar | 2 |