-- =====================================================
-- CORRIGIR ROTEIROS: Adicionar canal_id
-- =====================================================
-- A tabela roteiros precisa ter canal_id para funcionar corretamente
-- 1. Verificar se a coluna canal_id existe em pulso_content.roteiros
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'roteiros'
    AND column_name = 'canal_id';
-- 2. Se não existir, adicionar a coluna
ALTER TABLE pulso_content.roteiros
ADD COLUMN IF NOT EXISTS canal_id UUID REFERENCES pulso_core.canais(id);
-- 3. Atualizar roteiros existentes com o canal_id da ideia
UPDATE pulso_content.roteiros r
SET canal_id = i.canal_id
FROM pulso_content.ideias i
WHERE r.ideia_id = i.id
    AND r.canal_id IS NULL;
-- 4. Verificar se funcionou
SELECT r.id,
    r.titulo,
    r.canal_id,
    c.nome as canal_nome,
    i.titulo as ideia_titulo
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON r.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON r.canal_id = c.id
LIMIT 10;
-- 5. Recriar a view public.roteiros incluindo canal_id
DROP VIEW IF EXISTS public.roteiros CASCADE;
CREATE OR REPLACE VIEW public.roteiros AS
SELECT r.*,
    i.titulo as ideia_titulo,
    c.nome as canal_nome,
    i.serie_id,
    s.nome as serie_nome
FROM pulso_content.roteiros r
    LEFT JOIN pulso_content.ideias i ON r.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON r.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id;
-- 6. Dar permissões na nova view
GRANT SELECT ON public.roteiros TO anon,
    authenticated;
-- 7. Verificar a view atualizada
SELECT id,
    titulo,
    canal_nome,
    serie_nome,
    status
FROM public.roteiros
LIMIT 10;
| id | titulo | canal_nome | serie_nome | status | | ------------------------------------ | ---------------------------------------------- | ---------------------------- | ---------------------- | ---------- |
| e0895bd6-c3bf-4a13-82da-48ebb98058e1 | O Homem Que Vendeu a Torre Eiffel Duas Vezes | PULSO Casos Reais & Bizarros | Casos Reais & Bizarros | APROVADO | | e3230649-ff22-4620-827f-ac8f6f380b23 | Golden State Killer: DNA Resolveu Após 40 Anos | PULSO Casos Reais & Bizarros | True Crime Dark | EM_REVISAO | | 1e5247a9-7697-47a1-9703-3cc6f23690ad | O Segredo do Aeris em FF7 | PULSO Games Nostalgia | Clássicos & Memórias | RASCUNHO | | 790094eb-4fc4-4c63-996f-5cbbcfe87ee6 | O Homem Que Sobreviveu 2 Bombas Atômicas | PULSO Casos Reais & Bizarros | Casos Reais & Bizarros | APROVADO | | 093ec1d5-1ba9-4018-8b16-8075d7279115 | O Bebê Que Nasceu Grávido | PULSO Casos Reais & Bizarros | Casos Reais & Bizarros | APROVADO | | e703c9c7-b3a1-4783-96a3-7bb308f17d0a | Bactérias que Controlam Seu Humor | PULSO Curiosidades | Ciência Estranha | RASCUNHO | | ccb2c167-5a8e-4d50-9637-7dff39603185 | Você Está Esperando o Que ? | PULSO Motivacional | Reflexões Diretas | RASCUNHO | | 29a30e68-5df9-4415-a955-ae99b5f04fb9 | A Escolha | PULSO Contos & Microficção | Microcontos Dark | EM_REVISAO | | 3afc1220-2bf9-4a3c-907f-2b61becb60e0 | O Easter Egg Impossível do Atari | PULSO Games Nostalgia | Clássicos & Memórias | EM_REVISAO | | 43032097 - fa78 - 454a - b69b - fb83961ab612 | A Última Palavra | PULSO Contos & Microficção | Microcontos Dark | EM_REVISAO |