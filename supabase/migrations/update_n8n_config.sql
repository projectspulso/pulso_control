-- =====================================================
-- Atualizar configurações do n8n
-- =====================================================
-- Atualizar URL do n8n
UPDATE pulso_core.configuracoes
SET valor = 'https://pulsoprojects.app.n8n.cloud/mcp-server/http'
WHERE chave = 'n8n_url';
-- Atualizar API Key do n8n
UPDATE pulso_core.configuracoes
SET valor = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmYzNmJhMy1lMzM1LTRlYWItYmEyNi03NGVkM2YwOTIyN2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjUyZjIzOWI1LTM0NDQtNDllYS05N2Y2LTU5NzQ3MDQxNmVlYyIsImlhdCI6MTc2NDE5NzYzN30.Owq98NDZKQoDlzjuO4pfx-qU6fevyJG0jYds3hj5F-w'
WHERE chave = 'n8n_api_key';
-- Atualizar webhook base URL
UPDATE pulso_core.configuracoes
SET valor = 'https://pulsoprojects.app.n8n.cloud/webhook'
WHERE chave = 'n8n_webhook_base_url';
-- Verificar configurações
SELECT chave,
    CASE
        WHEN tipo = 'secret' THEN '*** (atualizado)'
        ELSE valor
    END as valor,
    tipo,
    descricao,
    updated_at
FROM pulso_core.configuracoes
WHERE categoria = 'n8n'
ORDER BY chave;