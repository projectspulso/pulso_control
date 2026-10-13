-- 075 · Calendário de datas especiais (dono, 12/10/2026: Dia das Crianças passou sem vídeo)
-- Lido por /api/automation/datas-especiais (cron pulso-datas-especiais, 2×/dia).
-- videos=2 → véspera + o dia; videos=1 → véspera. Canal = onde o tema rende (temas_medidos 90d):
-- origem/história → Mistérios & História; costumes → Curiosidades; comportamento → Psicologia.
-- Datas móveis já calculadas (Carnaval/Páscoa/Mães/Pais 2027). Renovar a lista antes de out/2027.

insert into pulso_core.configuracoes (chave, tipo, categoria, descricao, valor)
values ('datas_especiais', 'json', 'producao',
  'Calendário de datas especiais: o robô cria e produz o vídeo antes da data e crava a publicação.',
$json${
  "antecedencia_dias": 20,
  "horario": "19:00",
  "datas": [
    {"slug":"halloween","nome":"Halloween / Dia das Bruxas","data":"2026-10-31","videos":2,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"a origem real do Halloween (Samhain celta) e lendas sombrias por trás dos costumes"},
    {"slug":"finados","nome":"Dia de Finados","data":"2026-11-02","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"como culturas antigas lembravam os mortos e de onde veio o Dia de Finados"},
    {"slug":"proclamacao","nome":"Proclamação da República","data":"2026-11-15","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"bastidores pouco contados da noite de 15 de novembro de 1889, sem opinião política"},
    {"slug":"consciencia_negra","nome":"Dia da Consciência Negra","data":"2026-11-20","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"Palmares: o quilombo que resistiu quase um século, pelo que a história documenta"},
    {"slug":"black_friday","nome":"Black Friday","data":"2026-11-27","videos":1,"canal_id":"d1d643cd-5945-4469-89fa-0658dbc190bf","angulo":"a psicologia que faz o cérebro comprar em promoção e de onde veio o nome Black Friday"},
    {"slug":"natal","nome":"Natal","data":"2026-12-25","videos":2,"canal_id":"91ea6bcf-2eda-413e-893c-1fc6b02ff902","angulo":"origens surpreendentes do Natal: a árvore, o Papai Noel e por que 25 de dezembro"},
    {"slug":"reveillon","nome":"Réveillon","data":"2026-12-31","videos":2,"canal_id":"91ea6bcf-2eda-413e-893c-1fc6b02ff902","angulo":"por que o ano começa em 1º de janeiro e as superstições de Ano-Novo pelo mundo"},
    {"slug":"carnaval","nome":"Carnaval","data":"2027-02-09","videos":2,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"a origem antiga do Carnaval, das festas romanas ao entrudo"},
    {"slug":"dia_mulher","nome":"Dia Internacional da Mulher","data":"2027-03-08","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"a história real por trás do 8 de março"},
    {"slug":"pascoa","nome":"Páscoa","data":"2027-03-28","videos":2,"canal_id":"91ea6bcf-2eda-413e-893c-1fc6b02ff902","angulo":"por que coelho e ovo viraram símbolos da Páscoa"},
    {"slug":"dia_mentira","nome":"Dia da Mentira","data":"2027-04-01","videos":1,"canal_id":"d1d643cd-5945-4469-89fa-0658dbc190bf","angulo":"a origem do 1º de abril e por que o cérebro cai em pegadinhas"},
    {"slug":"tiradentes","nome":"Tiradentes","data":"2027-04-21","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"o que se sabe e o que é mito sobre Tiradentes"},
    {"slug":"dia_maes","nome":"Dia das Mães","data":"2027-05-09","videos":2,"canal_id":"d1d643cd-5945-4469-89fa-0658dbc190bf","angulo":"a ciência do vínculo entre mãe e bebê e a origem do Dia das Mães"},
    {"slug":"namorados","nome":"Dia dos Namorados","data":"2027-06-12","videos":2,"canal_id":"d1d643cd-5945-4469-89fa-0658dbc190bf","angulo":"o que acontece no cérebro apaixonado e por que no Brasil é 12 de junho"},
    {"slug":"sao_joao","nome":"São João / Festa Junina","data":"2027-06-24","videos":1,"canal_id":"91ea6bcf-2eda-413e-893c-1fc6b02ff902","angulo":"a origem europeia das festas juninas e como viraram tão brasileiras"},
    {"slug":"dia_pais","nome":"Dia dos Pais","data":"2027-08-08","videos":2,"canal_id":"d1d643cd-5945-4469-89fa-0658dbc190bf","angulo":"a ciência do papel do pai no cérebro dos filhos e a origem da data"},
    {"slug":"folclore","nome":"Dia do Folclore","data":"2027-08-22","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"lendas brasileiras e as histórias reais que podem tê-las inspirado"},
    {"slug":"independencia","nome":"Independência do Brasil","data":"2027-09-07","videos":1,"canal_id":"257b5ac4-72ab-4d96-a2eb-031833a319a6","angulo":"curiosidades pouco contadas do 7 de setembro de 1822"},
    {"slug":"dia_criancas","nome":"Dia das Crianças","data":"2027-10-12","videos":2,"canal_id":"91ea6bcf-2eda-413e-893c-1fc6b02ff902","angulo":"por que o Dia das Crianças no Brasil é 12 de outubro e a história de brinquedos antigos (sem mostrar crianças: formato faceless)"}
  ]
}$json$)
on conflict (chave) do update set valor = excluded.valor, updated_at = now();

-- cron 2×/dia: 09:40 UTC (antes do popular-agenda 10:30) e 16:40 UTC (dobra o ritmo de avanço)
select cron.schedule('pulso-datas-especiais', '40 9,16 * * *', $cron$
select net.http_post(
  url := 'https://pulsoprojects.vercel.app/api/automation/datas-especiais',
  headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',(select decrypted_secret from vault.decrypted_secrets where name='pulso_webhook_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 290000);
$cron$);
