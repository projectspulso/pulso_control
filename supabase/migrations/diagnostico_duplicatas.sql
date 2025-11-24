-- =====================================================
-- DIAGNÓSTICO: Por que os DELETEs não funcionam?
-- =====================================================
-- 1. VERIFICAR SE OS IDs REALMENTE EXISTEM
SELECT 'ROTEIROS DUPLICADOS EXISTEM?' as pergunta;
SELECT id,
    titulo
FROM pulso_content.roteiros
WHERE id IN (
        'da115164-fd56-447f-b9e3-daa2e1d31406',
        '787d9953-7ed0-486a-ac0f-1af066baea54',
        '2da50154-0e2f-4450-945b-13c40f3d55bb',
        '178e6a96-0da8-49a7-95dc-7a8c30e26742',
        'cf9e80f6-64e5-4c93-b08b-e3fc21eb2bc9',
        'ba2b3f19-7354-4c80-810e-fa17374b5f84'
    );
| pergunta | | ---------------------------- |
| ROTEIROS DUPLICADOS EXISTEM ? | -- 2. VERIFICAR CONSTRAINTS/TRIGGERS NA TABELA ROTEIROS
SELECT 'CONSTRAINTS NA TABELA ROTEIROS' as info;
SELECT conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'pulso_content.roteiros'::regclass;
| constraint_name | constraint_type | definition | | ---------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| roteiros_canal_id_fkey | f | FOREIGN KEY (canal_id) REFERENCES pulso_core.canais(id) | | roteiros_criado_por_fkey | f | FOREIGN KEY (criado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE
SET NULL | | roteiros_ideia_id_fkey | f | FOREIGN KEY (ideia_id) REFERENCES pulso_content.ideias(id) ON DELETE
SET NULL | | roteiros_ideia_id_versao_key | u | UNIQUE (ideia_id, versao) | | roteiros_pkey | p | PRIMARY KEY (id) | | roteiros_revisado_por_fkey | f | FOREIGN KEY (revisado_por) REFERENCES pulso_core.usuarios_internos(id) ON DELETE
SET NULL | -- 3. VERIFICAR TRIGGERS NA TABELA ROTEIROS
SELECT 'TRIGGERS NA TABELA ROTEIROS' as info;
SELECT tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'pulso_content.roteiros'::regclass
    AND tgisinternal = false;
| info | | --------------------------- |
| TRIGGERS NA TABELA ROTEIROS | -- 4. VERIFICAR SE HÁ REGISTROS NA PIPELINE APONTANDO PARA ESTES ROTEIROS
SELECT 'PIPELINE USANDO ROTEIROS DUPLICADOS?' as pergunta;
SELECT p.id as pipeline_id,
    p.roteiro_id,
    r.titulo as roteiro_titulo
FROM pulso_content.pipeline_producao p
    JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
WHERE p.roteiro_id IN (
        'da115164-fd56-447f-b9e3-daa2e1d31406',
        '787d9953-7ed0-486a-ac0f-1af066baea54',
        '2da50154-0e2f-4450-945b-13c40f3d55bb',
        '178e6a96-0da8-49a7-95dc-7a8c30e26742',
        'cf9e80f6-64e5-4c93-b08b-e3fc21eb2bc9',
        'ba2b3f19-7354-4c80-810e-fa17374b5f84'
    );
| pergunta | | ------------------------------------ |
| PIPELINE USANDO ROTEIROS DUPLICADOS ? | -- 5. VERIFICAR POLÍTICAS RLS (Row Level Security)
SELECT 'POLÍTICAS RLS EM ROTEIROS?' as pergunta;
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'pulso_content'
    AND tablename = 'roteiros';
| pergunta | | -------------------------- |
| POLÍTICAS RLS EM ROTEIROS ? | -- 6. VERIFICAR SE RLS ESTÁ ATIVO
SELECT 'RLS ATIVO?' as pergunta;
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'pulso_content'
    AND tablename IN ('roteiros', 'ideias', 'pipeline_producao');
| schemaname | tablename | rls_enabled | | ------------- | ----------------- | ----------- |
| pulso_content | ideias | false | | pulso_content | pipeline_producao | true | | pulso_content | roteiros | false | -- 7. TESTAR DELETE SIMPLES DE 1 ROTEIRO ESPECÍFICO
SELECT 'TENTANDO DELETE DE 1 ROTEIRO...' as acao;
-- Não executar ainda, só mostrar o comando que seria usado:
-- DELETE FROM pulso_content.roteiros WHERE id = 'da115164-fd56-447f-b9e3-daa2e1d31406';