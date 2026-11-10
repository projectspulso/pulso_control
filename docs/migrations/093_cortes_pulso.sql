-- 093 · Cortes dos canais DO PULSO (dono 10/11/2026)
-- Dois canais de cortes do próprio PULSO no YouTube, publicados pelo PULSO (não pelo MKT):
--   Cortes PULSO Histórias  (@cortespulsohistorias, UCHVKmFuQgMxy0tYyrq1L1wg) · gancho e história
--   Bastidores PULSO Histórias (@bastidorespulsohistorias, UCE63Lo9BS6gxrBU_c3DILvg) · técnico e lição
-- · configuracoes.youtube_canais: canais que o app autoriza; cada um tem youtube_oauth:<canal>
--   (principal = youtube_oauth). O callback confere channels?mine antes de gravar.
-- · cortes_destinos.destinos ganha pulso_cortes e pulso_bastidores (publica = pulso).
-- · corte_publicacoes.modo = 'auto' para essas peças: a view do MKT só lê modo = 'job'.
-- · configuracoes.cortes_pulso.publicar = false até o "pode" do dono.
-- · pg_cron chama /api/automation/publicar-cortes-pulso de hora em hora (1 peça por rodada).
-- As configs foram gravadas direto em 10/11 (valores no banco); aqui fica o agendamento.

select cron.unschedule('pulso-publicar-cortes-pulso') where exists (select 1 from cron.job where jobname = 'pulso-publicar-cortes-pulso');
select cron.schedule('pulso-publicar-cortes-pulso', '5 * * * *', $$
select net.http_post(url := 'https://pulsoprojects.vercel.app/api/automation/publicar-cortes-pulso',
 headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',(select decrypted_secret from vault.decrypted_secrets where name='pulso_webhook_secret')),
 body := '{}'::jsonb, timeout_milliseconds := 290000);
$$);
