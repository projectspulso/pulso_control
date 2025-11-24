-- Verificar se o áudio foi salvo no banco
SELECT a.id,
    a.url,
    a.voz_id,
    a.duracao_segundos,
    r.titulo as roteiro_titulo
FROM pulso_assets.audios a
    JOIN pulso_content.roteiros r ON a.roteiro_id = r.id
ORDER BY a.created_at DESC
LIMIT 5;