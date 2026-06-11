-- Verificar estrutura da tabela pipeline_producao
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'pulso_content'
    AND table_name = 'pipeline_producao'
ORDER BY ordinal_position;
| column_name | data_type | is_nullable | column_default | | --------------- | ------------------------ | ----------- | -------------------------- |
| id | uuid | NO | gen_random_uuid() | | ideia_id | uuid | NO | null | | roteiro_id | uuid | YES | null | | audio_id | uuid | YES | null | | video_id | uuid | YES | null | | status | text | NO | 'AGUARDANDO_ROTEIRO'::text | | prioridade | integer | YES | 5 | | data_prevista | timestamp with time zone | YES | null | | data_publicacao | timestamp with time zone | YES | null | | responsavel | text | YES | null | | observacoes | text | YES | null | | metadata | jsonb | YES | '{}'::jsonb | | created_at | timestamp with time zone | YES | now() | | updated_at | timestamp with time zone | YES | now() | | data_lancamento | date | YES | null |