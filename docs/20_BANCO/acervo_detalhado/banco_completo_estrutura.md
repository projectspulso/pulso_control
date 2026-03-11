SELECT schema_name
FROM information_schema.schemata
ORDER BY schema_name;


| schema_name        |
| ------------------ |
| analytics          |
| assets             |
| auth               |
| content            |
| core               |
| distribution       |
| extensions         |
| graphql            |
| graphql_public     |
| information_schema |
| pg_catalog         |
| pg_temp_0          |
| pg_temp_1          |
| pg_temp_10         |
| pg_temp_11         |
| pg_temp_12         |
| pg_temp_13         |
| pg_temp_14         |
| pg_temp_15         |
| pg_temp_16         |
| pg_temp_17         |
| pg_temp_19         |
| pg_temp_2          |
| pg_temp_20         |
| pg_temp_21         |
| pg_temp_22         |
| pg_temp_23         |
| pg_temp_24         |
| pg_temp_25         |
| pg_temp_26         |
| pg_temp_27         |
| pg_temp_28         |
| pg_temp_29         |
| pg_temp_3          |
| pg_temp_30         |
| pg_temp_31         |
| pg_temp_32         |
| pg_temp_33         |
| pg_temp_34         |
| pg_temp_35         |
| pg_temp_36         |
| pg_temp_37         |
| pg_temp_38         |
| pg_temp_39         |
| pg_temp_4          |
| pg_temp_40         |
| pg_temp_41         |
| pg_temp_42         |
| pg_temp_43         |
| pg_temp_44         |
| pg_temp_46         |
| pg_temp_47         |
| pg_temp_48         |
| pg_temp_5          |
| pg_temp_50         |
| pg_temp_51         |
| pg_temp_52         |
| pg_temp_53         |
| pg_temp_54         |
| pg_temp_55         |
| pg_temp_56         |
| pg_temp_57         |
| pg_temp_58         |
| pg_temp_59         |
| pg_temp_7          |
| pg_temp_8          |
| pg_temp_9          |
| pg_toast           |
| pg_toast_temp_0    |
| pg_toast_temp_1    |
| pg_toast_temp_10   |
| pg_toast_temp_11   |
| pg_toast_temp_12   |
| pg_toast_temp_13   |
| pg_toast_temp_14   |
| pg_toast_temp_15   |
| pg_toast_temp_16   |
| pg_toast_temp_17   |
| pg_toast_temp_19   |
| pg_toast_temp_2    |
| pg_toast_temp_20   |
| pg_toast_temp_21   |
| pg_toast_temp_22   |
| pg_toast_temp_23   |
| pg_toast_temp_24   |
| pg_toast_temp_25   |
| pg_toast_temp_26   |
| pg_toast_temp_27   |
| pg_toast_temp_28   |
| pg_toast_temp_29   |
| pg_toast_temp_3    |
| pg_toast_temp_30   |
| pg_toast_temp_31   |
| pg_toast_temp_32   |
| pg_toast_temp_33   |
| pg_toast_temp_34   |
| pg_toast_temp_35   |
| pg_toast_temp_36   |
| pg_toast_temp_37   |
| pg_toast_temp_38   |
| pg_toast_temp_39   |
| pg_toast_temp_4    |
| pg_toast_temp_40   |
| pg_toast_temp_41   |
| pg_toast_temp_42   |
| pg_toast_temp_43   |
| pg_toast_temp_44   |
| pg_toast_temp_46   |
| pg_toast_temp_47   |
| pg_toast_temp_48   |
| pg_toast_temp_5    |
| pg_toast_temp_50   |
| pg_toast_temp_51   |
| pg_toast_temp_52   |
| pg_toast_temp_53   |
| pg_toast_temp_54   |
| pg_toast_temp_55   |
| pg_toast_temp_56   |
| pg_toast_temp_57   |
| pg_toast_temp_58   |
| pg_toast_temp_59   |
| pg_toast_temp_7    |
| pg_toast_temp_8    |
| pg_toast_temp_9    |
| pgbouncer          |
| public             |
| pulso_analytics    |
| pulso_assets       |
| pulso_automation   |
| pulso_content      |
| pulso_core         |
| pulso_distribution |
| realtime           |
| storage            |
| vault              |



SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema LIKE 'pulso%' OR table_schema IN ('public', 'core', 'content')
ORDER BY table_schema, table_name;


| table_schema       | table_name                         |
| ------------------ | ---------------------------------- |
| content            | ideias                             |
| content            | pipeline_producao                  |
| content            | roteiros                           |
| content            | vw_pipeline_completo               |
| core               | canais                             |
| core               | series                             |
| public             | assets                             |
| public             | canais                             |
| public             | canais_plataformas                 |
| public             | conteudo_variantes                 |
| public             | conteudo_variantes_assets          |
| public             | conteudos                          |
| public             | eventos                            |
| public             | ideias                             |
| public             | metricas_diarias                   |
| public             | pipeline_producao                  |
| public             | plataformas                        |
| public             | posts                              |
| public             | posts_logs                         |
| public             | roteiros                           |
| public             | series                             |
| public             | tags                               |
| public             | usuarios_internos                  |
| public             | vw_pulso_canais                    |
| public             | vw_pulso_conteudo_variantes        |
| public             | vw_pulso_conteudo_variantes_assets |
| public             | vw_pulso_conteudos                 |
| public             | vw_pulso_ideias                    |
| public             | vw_pulso_posts                     |
| public             | vw_pulso_posts_metricas_diarias    |
| public             | vw_pulso_posts_resumo              |
| public             | vw_pulso_roteiros                  |
| public             | vw_pulso_series                    |
| public             | vw_pulso_workflow_execucoes        |
| public             | vw_pulso_workflows                 |
| public             | workflow_execucoes                 |
| public             | workflows                          |
| pulso_analytics    | eventos                            |
| pulso_analytics    | metricas_diarias                   |
| pulso_assets       | assets                             |
| pulso_assets       | conteudo_variantes_assets          |
| pulso_automation   | workflow_execucoes                 |
| pulso_automation   | workflows                          |
| pulso_content      | conteudo_variantes                 |
| pulso_content      | conteudos                          |
| pulso_content      | ideias                             |
| pulso_content      | pipeline_producao                  |
| pulso_content      | roteiros                           |
| pulso_core         | canais                             |
| pulso_core         | canais_plataformas                 |
| pulso_core         | plataformas                        |
| pulso_core         | series                             |
| pulso_core         | series_tags                        |
| pulso_core         | tags                               |
| pulso_core         | usuarios_internos                  |
| pulso_distribution | posts                              |
| pulso_distribution | posts_logs                         |



SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema LIKE 'pulso%' 
   OR tc.table_schema IN ('public', 'core', 'content')
ORDER BY tc.table_schema, tc.table_name;


| table_schema       | table_name                | constraint_name                                            | constraint_type | column_name           | foreign_table_schema | foreign_table_name        | foreign_column_name   |
| ------------------ | ------------------------- | ---------------------------------------------------------- | --------------- | --------------------- | -------------------- | ------------------------- | --------------------- |
| content            | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | core                 | series                    | id                    |
| content            | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| content            | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | core                 | series                    | id                    |
| content            | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| content            | ideias                    | ideias_prioridade_check                                    | CHECK           | null                  | content              | ideias                    | prioridade            |
| content            | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | content              | ideias                    | id                    |
| content            | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | pulso_content        | ideias                    | id                    |
| content            | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | content              | ideias                    | id                    |
| content            | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | pulso_content        | ideias                    | id                    |
| content            | ideias                    | ideias_origem_check                                        | CHECK           | null                  | content              | ideias                    | origem                |
| content            | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| content            | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| content            | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| content            | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| content            | ideias                    | 20308_20342_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | ideias                    | 20308_20342_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | ideias                    | ideias_status_check                                        | CHECK           | null                  | content              | ideias                    | status                |
| content            | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | content              | pipeline_producao         | id                    |
| content            | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | pulso_content        | pipeline_producao         | id                    |
| content            | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | content              | pipeline_producao         | id                    |
| content            | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | pulso_content        | pipeline_producao         | id                    |
| content            | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| content            | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| content            | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| content            | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| content            | pipeline_producao         | pipeline_producao_status_check                             | CHECK           | null                  | pulso_content        | pipeline_producao         | status                |
| content            | pipeline_producao         | pipeline_producao_status_check                             | CHECK           | null                  | content              | pipeline_producao         | status                |
| content            | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | pulso_content        | roteiros                  | id                    |
| content            | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | content              | roteiros                  | id                    |
| content            | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | pulso_content        | roteiros                  | id                    |
| content            | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | content              | roteiros                  | id                    |
| content            | pipeline_producao         | pipeline_producao_prioridade_check                         | CHECK           | null                  | pulso_content        | pipeline_producao         | prioridade            |
| content            | pipeline_producao         | pipeline_producao_prioridade_check                         | CHECK           | null                  | content              | pipeline_producao         | prioridade            |
| content            | pipeline_producao         | 20308_20423_6_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | pipeline_producao         | 20308_20423_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | pipeline_producao         | 20308_20423_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| content            | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| content            | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| content            | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| content            | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| content            | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| content            | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| content            | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| content            | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | pulso_content        | roteiros                  | id                    |
| content            | roteiros                  | 20308_20371_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | roteiros                  | 20308_20371_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | roteiros                  | roteiros_status_check                                      | CHECK           | null                  | content              | roteiros                  | status                |
| content            | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | content              | roteiros                  | id                    |
| content            | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| content            | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| content            | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| content            | roteiros                  | 20308_20371_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| content            | roteiros                  | roteiros_criado_por_check                                  | CHECK           | null                  | content              | roteiros                  | criado_por            |
| content            | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| content            | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | pulso_content        | roteiros                  | id                    |
| content            | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | content              | roteiros                  | id                    |
| core               | canais                    | canais_tipo_check                                          | CHECK           | null                  | core                 | canais                    | tipo                  |
| core               | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | canais                    | id                    |
| core               | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | core                 | canais                    | id                    |
| core               | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | canais                    | id                    |
| core               | canais                    | 20307_20312_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| core               | canais                    | 20307_20312_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| core               | canais                    | 20307_20312_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| core               | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | core                 | canais                    | id                    |
| core               | series                    | 20307_20325_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| core               | series                    | 20307_20325_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| core               | series                    | series_pkey                                                | PRIMARY KEY     | id                    | core                 | series                    | id                    |
| core               | series                    | series_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | series                    | id                    |
| core               | series                    | series_pkey                                                | PRIMARY KEY     | id                    | core                 | series                    | id                    |
| core               | series                    | series_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | series                    | id                    |
| core               | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| core               | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| core               | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| core               | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| core               | series                    | 20307_20325_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | eventos                   | eventos_plataforma_id_fkey                                 | FOREIGN KEY     | plataforma_id         | pulso_core           | plataformas               | id                    |
| pulso_analytics    | eventos                   | 17302_17743_9_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | eventos                   | 17302_17743_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | eventos                   | 17302_17743_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | eventos                   | 17302_17743_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | eventos                   | eventos_pkey                                               | PRIMARY KEY     | id                    | pulso_analytics      | eventos                   | id                    |
| pulso_analytics    | eventos                   | eventos_post_id_fkey                                       | FOREIGN KEY     | post_id               | pulso_distribution   | posts                     | id                    |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_data_ref_key                      | UNIQUE          | data_ref              | pulso_analytics      | metricas_diarias          | data_ref              |
| pulso_analytics    | metricas_diarias          | 17302_17767_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | metricas_diarias          | 17302_17767_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_fkey                              | FOREIGN KEY     | post_id               | pulso_distribution   | posts                     | id                    |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_data_ref_key                      | UNIQUE          | data_ref              | pulso_analytics      | metricas_diarias          | post_id               |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_data_ref_key                      | UNIQUE          | post_id               | pulso_analytics      | metricas_diarias          | post_id               |
| pulso_analytics    | metricas_diarias          | metricas_diarias_post_id_data_ref_key                      | UNIQUE          | post_id               | pulso_analytics      | metricas_diarias          | data_ref              |
| pulso_analytics    | metricas_diarias          | metricas_diarias_pkey                                      | PRIMARY KEY     | id                    | pulso_analytics      | metricas_diarias          | id                    |
| pulso_analytics    | metricas_diarias          | metricas_diarias_plataforma_id_fkey                        | FOREIGN KEY     | plataforma_id         | pulso_core           | plataformas               | id                    |
| pulso_analytics    | metricas_diarias          | 17302_17767_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | assets                    | 17299_17628_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | assets                    | 17299_17628_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | assets                    | assets_pkey                                                | PRIMARY KEY     | id                    | pulso_assets         | assets                    | id                    |
| pulso_assets       | assets                    | assets_criado_por_fkey                                     | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_assets       | assets                    | 17299_17628_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | asset_id              | pulso_assets         | conteudo_variantes_assets | papel                 |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | papel                 | pulso_assets         | conteudo_variantes_assets | asset_id              |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | papel                 | pulso_assets         | conteudo_variantes_assets | conteudo_variantes_id |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | papel                 | pulso_assets         | conteudo_variantes_assets | papel                 |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | conteudo_variantes_id | pulso_assets         | conteudo_variantes_assets | papel                 |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | conteudo_variantes_id | pulso_assets         | conteudo_variantes_assets | conteudo_variantes_id |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | conteudo_variantes_id | pulso_assets         | conteudo_variantes_assets | asset_id              |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_conteudo_variantes_id_fkey       | FOREIGN KEY     | conteudo_variantes_id | pulso_content        | conteudo_variantes        | id                    |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_asset_id_fkey                    | FOREIGN KEY     | asset_id              | pulso_assets         | assets                    | id                    |
| pulso_assets       | conteudo_variantes_assets | 17299_17645_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | conteudo_variantes_assets | 17299_17645_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | conteudo_variantes_assets | 17299_17645_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | asset_id              | pulso_assets         | conteudo_variantes_assets | asset_id              |
| pulso_assets       | conteudo_variantes_assets | conteudo_variantes_assets_pkey                             | PRIMARY KEY     | asset_id              | pulso_assets         | conteudo_variantes_assets | conteudo_variantes_id |
| pulso_automation   | workflow_execucoes        | 17301_17722_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_criado_por_fkey                         | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_pkey                                    | PRIMARY KEY     | id                    | pulso_automation     | workflow_execucoes        | id                    |
| pulso_automation   | workflow_execucoes        | workflow_execucoes_workflow_id_fkey                        | FOREIGN KEY     | workflow_id           | pulso_automation     | workflows                 | id                    |
| pulso_automation   | workflow_execucoes        | 17301_17722_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflow_execucoes        | 17301_17722_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflows                 | 17301_17707_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflows                 | 17301_17707_7_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflows                 | 17301_17707_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflows                 | workflows_slug_key                                         | UNIQUE          | slug                  | pulso_automation     | workflows                 | slug                  |
| pulso_automation   | workflows                 | 17301_17707_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_automation   | workflows                 | workflows_pkey                                             | PRIMARY KEY     | id                    | pulso_automation     | workflows                 | id                    |
| pulso_content      | conteudo_variantes        | 17298_17610_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudo_variantes        | conteudo_variantes_pkey                                    | PRIMARY KEY     | id                    | pulso_content        | conteudo_variantes        | id                    |
| pulso_content      | conteudo_variantes        | 17298_17610_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudo_variantes        | 17298_17610_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudo_variantes        | conteudo_variantes_conteudo_id_fkey                        | FOREIGN KEY     | conteudo_id           | pulso_content        | conteudos                 | id                    |
| pulso_content      | conteudo_variantes        | 17298_17610_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudos                 | conteudos_canal_id_fkey                                    | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_content      | conteudos                 | 17298_17577_7_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudos                 | conteudos_criado_por_fkey                                  | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_content      | conteudos                 | 17298_17577_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudos                 | 17298_17577_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | conteudos                 | conteudos_serie_id_fkey                                    | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| pulso_content      | conteudos                 | conteudos_roteiro_id_fkey                                  | FOREIGN KEY     | roteiro_id            | pulso_content        | roteiros                  | id                    |
| pulso_content      | conteudos                 | conteudos_pkey                                             | PRIMARY KEY     | id                    | pulso_content        | conteudos                 | id                    |
| pulso_content      | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| pulso_content      | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | core                 | series                    | id                    |
| pulso_content      | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| pulso_content      | ideias                    | ideias_serie_id_fkey                                       | FOREIGN KEY     | serie_id              | core                 | series                    | id                    |
| pulso_content      | ideias                    | 17298_17517_8_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| pulso_content      | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| pulso_content      | ideias                    | ideias_criado_por_fkey                                     | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_content      | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | pulso_content        | ideias                    | id                    |
| pulso_content      | ideias                    | 17298_17517_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | ideias                    | 17298_17517_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | content              | ideias                    | id                    |
| pulso_content      | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_content      | ideias                    | ideias_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_content      | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | pulso_content        | ideias                    | id                    |
| pulso_content      | ideias                    | ideias_pkey                                                | PRIMARY KEY     | id                    | content              | ideias                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| pulso_content      | pipeline_producao         | 17298_20713_6_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | pipeline_producao         | 17298_20713_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | pipeline_producao         | 17298_20713_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_ideia_id_fkey                            | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | content              | pipeline_producao         | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | pulso_content        | pipeline_producao         | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | content              | pipeline_producao         | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_pkey                                     | PRIMARY KEY     | id                    | pulso_content        | pipeline_producao         | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_prioridade_check                         | CHECK           | null                  | content              | pipeline_producao         | prioridade            |
| pulso_content      | pipeline_producao         | pipeline_producao_prioridade_check                         | CHECK           | null                  | pulso_content        | pipeline_producao         | prioridade            |
| pulso_content      | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | content              | roteiros                  | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | pulso_content        | roteiros                  | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | content              | roteiros                  | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_roteiro_id_fkey                          | FOREIGN KEY     | roteiro_id            | pulso_content        | roteiros                  | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_status_check                             | CHECK           | null                  | content              | pipeline_producao         | status                |
| pulso_content      | pipeline_producao         | pipeline_producao_status_check                             | CHECK           | null                  | pulso_content        | pipeline_producao         | status                |
| pulso_content      | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_video_id_fkey                            | FOREIGN KEY     | video_id              | assets               | videos                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| pulso_content      | pipeline_producao         | pipeline_producao_audio_id_fkey                            | FOREIGN KEY     | audio_id              | assets               | audios                    | id                    |
| pulso_content      | roteiros                  | roteiros_revisado_por_fkey                                 | FOREIGN KEY     | revisado_por          | pulso_core           | usuarios_internos         | id                    |
| pulso_content      | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | content              | roteiros                  | id                    |
| pulso_content      | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | pulso_content        | roteiros                  | id                    |
| pulso_content      | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | content              | roteiros                  | id                    |
| pulso_content      | roteiros                  | roteiros_pkey                                              | PRIMARY KEY     | id                    | pulso_content        | roteiros                  | id                    |
| pulso_content      | roteiros                  | roteiros_ideia_id_versao_key                               | UNIQUE          | versao                | pulso_content        | roteiros                  | versao                |
| pulso_content      | roteiros                  | roteiros_ideia_id_versao_key                               | UNIQUE          | versao                | pulso_content        | roteiros                  | ideia_id              |
| pulso_content      | roteiros                  | roteiros_ideia_id_versao_key                               | UNIQUE          | ideia_id              | pulso_content        | roteiros                  | versao                |
| pulso_content      | roteiros                  | roteiros_ideia_id_versao_key                               | UNIQUE          | ideia_id              | pulso_content        | roteiros                  | ideia_id              |
| pulso_content      | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| pulso_content      | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| pulso_content      | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | content              | ideias                    | id                    |
| pulso_content      | roteiros                  | 17298_17546_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | roteiros                  | 17298_17546_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | roteiros                  | roteiros_ideia_id_fkey                                     | FOREIGN KEY     | ideia_id              | pulso_content        | ideias                    | id                    |
| pulso_content      | roteiros                  | roteiros_criado_por_fkey                                   | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_content      | roteiros                  | roteiros_canal_id_fkey                                     | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_content      | roteiros                  | 17298_17546_7_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | roteiros                  | 17298_17546_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_content      | roteiros                  | 17298_17546_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais                    | 17297_17407_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | canais                    | id                    |
| pulso_core         | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | core                 | canais                    | id                    |
| pulso_core         | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | canais                    | id                    |
| pulso_core         | canais                    | canais_pkey                                                | PRIMARY KEY     | id                    | core                 | canais                    | id                    |
| pulso_core         | canais                    | canais_slug_key                                            | UNIQUE          | slug                  | pulso_core           | canais                    | slug                  |
| pulso_core         | canais                    | 17297_17407_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais                    | 17297_17407_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais                    | 17297_17407_6_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais_plataformas        | 17297_17435_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais_plataformas        | 17297_17435_7_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais_plataformas        | canais_plataformas_canal_id_fkey                           | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_core         | canais_plataformas        | canais_plataformas_pkey                                    | PRIMARY KEY     | id                    | pulso_core           | canais_plataformas        | id                    |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_fkey                      | FOREIGN KEY     | plataforma_id         | pulso_core           | plataformas               | id                    |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_identificador_externo_key | UNIQUE          | plataforma_id         | pulso_core           | canais_plataformas        | identificador_externo |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_identificador_externo_key | UNIQUE          | plataforma_id         | pulso_core           | canais_plataformas        | plataforma_id         |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_identificador_externo_key | UNIQUE          | identificador_externo | pulso_core           | canais_plataformas        | identificador_externo |
| pulso_core         | canais_plataformas        | canais_plataformas_plataforma_id_identificador_externo_key | UNIQUE          | identificador_externo | pulso_core           | canais_plataformas        | plataforma_id         |
| pulso_core         | canais_plataformas        | 17297_17435_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais_plataformas        | 17297_17435_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | canais_plataformas        | 17297_17435_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | plataformas               | 17297_17422_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | plataformas               | 17297_17422_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | plataformas               | 17297_17422_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | plataformas               | 17297_17422_5_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | plataformas               | plataformas_tipo_nome_exibicao_key                         | UNIQUE          | tipo                  | pulso_core           | plataformas               | tipo                  |
| pulso_core         | plataformas               | plataformas_tipo_nome_exibicao_key                         | UNIQUE          | nome_exibicao         | pulso_core           | plataformas               | tipo                  |
| pulso_core         | plataformas               | plataformas_tipo_nome_exibicao_key                         | UNIQUE          | nome_exibicao         | pulso_core           | plataformas               | nome_exibicao         |
| pulso_core         | plataformas               | plataformas_pkey                                           | PRIMARY KEY     | id                    | pulso_core           | plataformas               | id                    |
| pulso_core         | plataformas               | plataformas_tipo_nome_exibicao_key                         | UNIQUE          | tipo                  | pulso_core           | plataformas               | nome_exibicao         |
| pulso_core         | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| pulso_core         | series                    | 17297_17459_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series                    | 17297_17459_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series                    | 17297_17459_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series                    | 17297_17459_6_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | core                 | canais                    | id                    |
| pulso_core         | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_core         | series                    | series_canal_id_fkey                                       | FOREIGN KEY     | canal_id              | pulso_core           | canais                    | id                    |
| pulso_core         | series                    | 17297_17459_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series                    | series_canal_id_slug_key                                   | UNIQUE          | canal_id              | pulso_core           | series                    | canal_id              |
| pulso_core         | series                    | series_canal_id_slug_key                                   | UNIQUE          | canal_id              | pulso_core           | series                    | slug                  |
| pulso_core         | series                    | series_canal_id_slug_key                                   | UNIQUE          | slug                  | pulso_core           | series                    | canal_id              |
| pulso_core         | series                    | series_canal_id_slug_key                                   | UNIQUE          | slug                  | pulso_core           | series                    | slug                  |
| pulso_core         | series                    | series_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | series                    | id                    |
| pulso_core         | series                    | series_pkey                                                | PRIMARY KEY     | id                    | core                 | series                    | id                    |
| pulso_core         | series                    | series_pkey                                                | PRIMARY KEY     | id                    | pulso_core           | series                    | id                    |
| pulso_core         | series                    | series_pkey                                                | PRIMARY KEY     | id                    | core                 | series                    | id                    |
| pulso_core         | series_tags               | 17297_17491_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series_tags               | 17297_17491_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | series_tags               | series_tags_tag_id_fkey                                    | FOREIGN KEY     | tag_id                | pulso_core           | tags                      | id                    |
| pulso_core         | series_tags               | series_tags_serie_id_fkey                                  | FOREIGN KEY     | serie_id              | pulso_core           | series                    | id                    |
| pulso_core         | series_tags               | series_tags_pkey                                           | PRIMARY KEY     | tag_id                | pulso_core           | series_tags               | tag_id                |
| pulso_core         | series_tags               | series_tags_pkey                                           | PRIMARY KEY     | tag_id                | pulso_core           | series_tags               | serie_id              |
| pulso_core         | series_tags               | series_tags_pkey                                           | PRIMARY KEY     | serie_id              | pulso_core           | series_tags               | tag_id                |
| pulso_core         | series_tags               | series_tags_pkey                                           | PRIMARY KEY     | serie_id              | pulso_core           | series_tags               | serie_id              |
| pulso_core         | tags                      | tags_slug_key                                              | UNIQUE          | slug                  | pulso_core           | tags                      | slug                  |
| pulso_core         | tags                      | 17297_17478_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | tags                      | 17297_17478_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | tags                      | 17297_17478_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | tags                      | tags_pkey                                                  | PRIMARY KEY     | id                    | pulso_core           | tags                      | id                    |
| pulso_core         | tags                      | tags_nome_key                                              | UNIQUE          | nome                  | pulso_core           | tags                      | nome                  |
| pulso_core         | usuarios_internos         | 17297_17506_6_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | usuarios_internos         | 17297_17506_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_core         | usuarios_internos         | usuarios_internos_pkey                                     | PRIMARY KEY     | id                    | pulso_core           | usuarios_internos         | id                    |
| pulso_core         | usuarios_internos         | 17297_17506_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts                     | posts_conteudo_variantes_id_fkey                           | FOREIGN KEY     | conteudo_variantes_id | pulso_content        | conteudo_variantes        | id                    |
| pulso_distribution | posts                     | 17300_17661_4_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts                     | 17300_17661_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts                     | 17300_17661_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts                     | 17300_17661_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts                     | posts_canal_plataforma_id_fkey                             | FOREIGN KEY     | canal_plataforma_id   | pulso_core           | canais_plataformas        | id                    |
| pulso_distribution | posts                     | posts_criado_por_fkey                                      | FOREIGN KEY     | criado_por            | pulso_core           | usuarios_internos         | id                    |
| pulso_distribution | posts                     | posts_pkey                                                 | PRIMARY KEY     | id                    | pulso_distribution   | posts                     | id                    |
| pulso_distribution | posts_logs                | posts_logs_post_id_fkey                                    | FOREIGN KEY     | post_id               | pulso_distribution   | posts                     | id                    |
| pulso_distribution | posts_logs                | posts_logs_pkey                                            | PRIMARY KEY     | id                    | pulso_distribution   | posts_logs                | id                    |
| pulso_distribution | posts_logs                | 17300_17692_3_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts_logs                | 17300_17692_1_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |
| pulso_distribution | posts_logs                | 17300_17692_2_not_null                                     | CHECK           | null                  | null                 | null                      | null                  |



SELECT table_schema, table_name
FROM information_schema.views
ORDER BY table_schema, table_name;

| table_schema       | table_name                            |
| ------------------ | ------------------------------------- |
| content            | vw_pipeline_completo                  |
| extensions         | pg_stat_statements                    |
| extensions         | pg_stat_statements_info               |
| information_schema | _pg_foreign_data_wrappers             |
| information_schema | _pg_foreign_servers                   |
| information_schema | _pg_foreign_table_columns             |
| information_schema | _pg_foreign_tables                    |
| information_schema | _pg_user_mappings                     |
| information_schema | administrable_role_authorizations     |
| information_schema | applicable_roles                      |
| information_schema | attributes                            |
| information_schema | character_sets                        |
| information_schema | check_constraint_routine_usage        |
| information_schema | check_constraints                     |
| information_schema | collation_character_set_applicability |
| information_schema | collations                            |
| information_schema | column_column_usage                   |
| information_schema | column_domain_usage                   |
| information_schema | column_options                        |
| information_schema | column_privileges                     |
| information_schema | column_udt_usage                      |
| information_schema | columns                               |
| information_schema | constraint_column_usage               |
| information_schema | constraint_table_usage                |
| information_schema | data_type_privileges                  |
| information_schema | domain_constraints                    |
| information_schema | domain_udt_usage                      |
| information_schema | domains                               |
| information_schema | element_types                         |
| information_schema | enabled_roles                         |
| information_schema | foreign_data_wrapper_options          |
| information_schema | foreign_data_wrappers                 |
| information_schema | foreign_server_options                |
| information_schema | foreign_servers                       |
| information_schema | foreign_table_options                 |
| information_schema | foreign_tables                        |
| information_schema | information_schema_catalog_name       |
| information_schema | key_column_usage                      |
| information_schema | parameters                            |
| information_schema | referential_constraints               |
| information_schema | role_column_grants                    |
| information_schema | role_routine_grants                   |
| information_schema | role_table_grants                     |
| information_schema | role_udt_grants                       |
| information_schema | role_usage_grants                     |
| information_schema | routine_column_usage                  |
| information_schema | routine_privileges                    |
| information_schema | routine_routine_usage                 |
| information_schema | routine_sequence_usage                |
| information_schema | routine_table_usage                   |
| information_schema | routines                              |
| information_schema | schemata                              |
| information_schema | sequences                             |
| information_schema | table_constraints                     |
| information_schema | table_privileges                      |
| information_schema | tables                                |
| information_schema | transforms                            |
| information_schema | triggered_update_columns              |
| information_schema | triggers                              |
| information_schema | udt_privileges                        |
| information_schema | usage_privileges                      |
| information_schema | user_defined_types                    |
| information_schema | user_mapping_options                  |
| information_schema | user_mappings                         |
| information_schema | view_column_usage                     |
| information_schema | view_routine_usage                    |
| information_schema | view_table_usage                      |
| information_schema | views                                 |
| pg_catalog         | pg_available_extension_versions       |
| pg_catalog         | pg_available_extensions               |
| pg_catalog         | pg_backend_memory_contexts            |
| pg_catalog         | pg_config                             |
| pg_catalog         | pg_cursors                            |
| pg_catalog         | pg_file_settings                      |
| pg_catalog         | pg_group                              |
| pg_catalog         | pg_hba_file_rules                     |
| pg_catalog         | pg_ident_file_mappings                |
| pg_catalog         | pg_indexes                            |
| pg_catalog         | pg_locks                              |
| pg_catalog         | pg_matviews                           |
| pg_catalog         | pg_policies                           |
| pg_catalog         | pg_prepared_statements                |
| pg_catalog         | pg_prepared_xacts                     |
| pg_catalog         | pg_publication_tables                 |
| pg_catalog         | pg_replication_origin_status          |
| pg_catalog         | pg_replication_slots                  |
| pg_catalog         | pg_roles                              |
| pg_catalog         | pg_rules                              |
| pg_catalog         | pg_seclabels                          |
| pg_catalog         | pg_sequences                          |
| pg_catalog         | pg_settings                           |
| pg_catalog         | pg_shadow                             |
| pg_catalog         | pg_shmem_allocations                  |
| pg_catalog         | pg_stat_activity                      |
| pg_catalog         | pg_stat_all_indexes                   |
| pg_catalog         | pg_stat_all_tables                    |
| pg_catalog         | pg_stat_archiver                      |
| pg_catalog         | pg_stat_bgwriter                      |
| pg_catalog         | pg_stat_checkpointer                  |
| pg_catalog         | pg_stat_database                      |
| pg_catalog         | pg_stat_database_conflicts            |
| pg_catalog         | pg_stat_gssapi                        |
| pg_catalog         | pg_stat_io                            |
| pg_catalog         | pg_stat_progress_analyze              |
| pg_catalog         | pg_stat_progress_basebackup           |
| pg_catalog         | pg_stat_progress_cluster              |
| pg_catalog         | pg_stat_progress_copy                 |
| pg_catalog         | pg_stat_progress_create_index         |
| pg_catalog         | pg_stat_progress_vacuum               |
| pg_catalog         | pg_stat_recovery_prefetch             |
| pg_catalog         | pg_stat_replication                   |
| pg_catalog         | pg_stat_replication_slots             |
| pg_catalog         | pg_stat_slru                          |
| pg_catalog         | pg_stat_ssl                           |
| pg_catalog         | pg_stat_subscription                  |
| pg_catalog         | pg_stat_subscription_stats            |
| pg_catalog         | pg_stat_sys_indexes                   |
| pg_catalog         | pg_stat_sys_tables                    |
| pg_catalog         | pg_stat_user_functions                |
| pg_catalog         | pg_stat_user_indexes                  |
| pg_catalog         | pg_stat_user_tables                   |
| pg_catalog         | pg_stat_wal                           |
| pg_catalog         | pg_stat_wal_receiver                  |
| pg_catalog         | pg_stat_xact_all_tables               |
| pg_catalog         | pg_stat_xact_sys_tables               |
| pg_catalog         | pg_stat_xact_user_functions           |
| pg_catalog         | pg_stat_xact_user_tables              |
| pg_catalog         | pg_statio_all_indexes                 |
| pg_catalog         | pg_statio_all_sequences               |
| pg_catalog         | pg_statio_all_tables                  |
| pg_catalog         | pg_statio_sys_indexes                 |
| pg_catalog         | pg_statio_sys_sequences               |
| pg_catalog         | pg_statio_sys_tables                  |
| pg_catalog         | pg_statio_user_indexes                |
| pg_catalog         | pg_statio_user_sequences              |
| pg_catalog         | pg_statio_user_tables                 |
| pg_catalog         | pg_stats                              |
| pg_catalog         | pg_stats_ext                          |
| pg_catalog         | pg_stats_ext_exprs                    |
| pg_catalog         | pg_tables                             |
| pg_catalog         | pg_timezone_abbrevs                   |
| pg_catalog         | pg_timezone_names                     |
| pg_catalog         | pg_user                               |
| pg_catalog         | pg_user_mappings                      |
| pg_catalog         | pg_views                              |
| pg_catalog         | pg_wait_events                        |
| public             | assets                                |
| public             | canais                                |
| public             | canais_plataformas                    |
| public             | conteudo_variantes                    |
| public             | conteudo_variantes_assets             |
| public             | conteudos                             |
| public             | eventos                               |
| public             | ideias                                |
| public             | metricas_diarias                      |
| public             | pipeline_producao                     |
| public             | plataformas                           |
| public             | posts                                 |
| public             | posts_logs                            |
| public             | roteiros                              |
| public             | series                                |
| public             | tags                                  |
| public             | usuarios_internos                     |
| public             | vw_pulso_canais                       |
| public             | vw_pulso_conteudo_variantes           |
| public             | vw_pulso_conteudo_variantes_assets    |
| public             | vw_pulso_conteudos                    |
| public             | vw_pulso_ideias                       |
| public             | vw_pulso_posts                        |
| public             | vw_pulso_posts_metricas_diarias       |
| public             | vw_pulso_posts_resumo                 |
| public             | vw_pulso_roteiros                     |
| public             | vw_pulso_series                       |
| public             | vw_pulso_workflow_execucoes           |
| public             | vw_pulso_workflows                    |
| public             | workflow_execucoes                    |
| public             | workflows                             |
| vault              | decrypted_secrets                     |


SELECT routine_schema, routine_name
FROM information_schema.routines
ORDER BY routine_schema, routine_name;


| routine_schema     | routine_name                                         |
| ------------------ | ---------------------------------------------------- |
| auth               | email                                                |
| auth               | jwt                                                  |
| auth               | role                                                 |
| auth               | uid                                                  |
| extensions         | armor                                                |
| extensions         | armor                                                |
| extensions         | crypt                                                |
| extensions         | dearmor                                              |
| extensions         | decrypt                                              |
| extensions         | decrypt_iv                                           |
| extensions         | digest                                               |
| extensions         | digest                                               |
| extensions         | encrypt                                              |
| extensions         | encrypt_iv                                           |
| extensions         | gen_random_bytes                                     |
| extensions         | gen_random_uuid                                      |
| extensions         | gen_salt                                             |
| extensions         | gen_salt                                             |
| extensions         | grant_pg_cron_access                                 |
| extensions         | grant_pg_graphql_access                              |
| extensions         | grant_pg_net_access                                  |
| extensions         | hmac                                                 |
| extensions         | hmac                                                 |
| extensions         | pg_stat_statements                                   |
| extensions         | pg_stat_statements_info                              |
| extensions         | pg_stat_statements_reset                             |
| extensions         | pgp_armor_headers                                    |
| extensions         | pgp_key_id                                           |
| extensions         | pgp_pub_decrypt                                      |
| extensions         | pgp_pub_decrypt                                      |
| extensions         | pgp_pub_decrypt                                      |
| extensions         | pgp_pub_decrypt_bytea                                |
| extensions         | pgp_pub_decrypt_bytea                                |
| extensions         | pgp_pub_decrypt_bytea                                |
| extensions         | pgp_pub_encrypt                                      |
| extensions         | pgp_pub_encrypt                                      |
| extensions         | pgp_pub_encrypt_bytea                                |
| extensions         | pgp_pub_encrypt_bytea                                |
| extensions         | pgp_sym_decrypt                                      |
| extensions         | pgp_sym_decrypt                                      |
| extensions         | pgp_sym_decrypt_bytea                                |
| extensions         | pgp_sym_decrypt_bytea                                |
| extensions         | pgp_sym_encrypt                                      |
| extensions         | pgp_sym_encrypt                                      |
| extensions         | pgp_sym_encrypt_bytea                                |
| extensions         | pgp_sym_encrypt_bytea                                |
| extensions         | pgrst_ddl_watch                                      |
| extensions         | pgrst_drop_watch                                     |
| extensions         | set_graphql_placeholder                              |
| extensions         | uuid_generate_v1                                     |
| extensions         | uuid_generate_v1mc                                   |
| extensions         | uuid_generate_v3                                     |
| extensions         | uuid_generate_v4                                     |
| extensions         | uuid_generate_v5                                     |
| extensions         | uuid_nil                                             |
| extensions         | uuid_ns_dns                                          |
| extensions         | uuid_ns_oid                                          |
| extensions         | uuid_ns_url                                          |
| extensions         | uuid_ns_x500                                         |
| graphql            | _internal_resolve                                    |
| graphql            | comment_directive                                    |
| graphql            | exception                                            |
| graphql            | get_schema_version                                   |
| graphql            | increment_schema_version                             |
| graphql            | resolve                                              |
| graphql_public     | graphql                                              |
| information_schema | _pg_char_max_length                                  |
| information_schema | _pg_char_octet_length                                |
| information_schema | _pg_datetime_precision                               |
| information_schema | _pg_expandarray                                      |
| information_schema | _pg_index_position                                   |
| information_schema | _pg_interval_type                                    |
| information_schema | _pg_numeric_precision                                |
| information_schema | _pg_numeric_precision_radix                          |
| information_schema | _pg_numeric_scale                                    |
| information_schema | _pg_truetypid                                        |
| information_schema | _pg_truetypmod                                       |
| pg_catalog         | RI_FKey_cascade_del                                  |
| pg_catalog         | RI_FKey_cascade_upd                                  |
| pg_catalog         | RI_FKey_check_ins                                    |
| pg_catalog         | RI_FKey_check_upd                                    |
| pg_catalog         | RI_FKey_noaction_del                                 |
| pg_catalog         | RI_FKey_noaction_upd                                 |
| pg_catalog         | RI_FKey_restrict_del                                 |
| pg_catalog         | RI_FKey_restrict_upd                                 |
| pg_catalog         | RI_FKey_setdefault_del                               |
| pg_catalog         | RI_FKey_setdefault_upd                               |
| pg_catalog         | RI_FKey_setnull_del                                  |
| pg_catalog         | RI_FKey_setnull_upd                                  |
| pg_catalog         | abbrev                                               |
| pg_catalog         | abbrev                                               |
| pg_catalog         | abs                                                  |
| pg_catalog         | abs                                                  |
| pg_catalog         | abs                                                  |
| pg_catalog         | abs                                                  |
| pg_catalog         | abs                                                  |
| pg_catalog         | abs                                                  |
| pg_catalog         | aclcontains                                          |
| pg_catalog         | acldefault                                           |
| pg_catalog         | aclexplode                                           |
| pg_catalog         | aclinsert                                            |
| pg_catalog         | aclitemeq                                            |
| pg_catalog         | aclitemin                                            |
| pg_catalog         | aclitemout                                           |
| pg_catalog         | aclremove                                            |
| pg_catalog         | acos                                                 |
| pg_catalog         | acosd                                                |
| pg_catalog         | acosh                                                |
| pg_catalog         | age                                                  |
| pg_catalog         | age                                                  |
| pg_catalog         | age                                                  |
| pg_catalog         | age                                                  |
| pg_catalog         | age                                                  |
| pg_catalog         | amvalidate                                           |
| pg_catalog         | any_in                                               |
| pg_catalog         | any_out                                              |
| pg_catalog         | any_value                                            |
| pg_catalog         | any_value_transfn                                    |
| pg_catalog         | anyarray_in                                          |
| pg_catalog         | anyarray_out                                         |
| pg_catalog         | anyarray_recv                                        |
| pg_catalog         | anyarray_send                                        |
| pg_catalog         | anycompatible_in                                     |
| pg_catalog         | anycompatible_out                                    |
| pg_catalog         | anycompatiblearray_in                                |
| pg_catalog         | anycompatiblearray_out                               |
| pg_catalog         | anycompatiblearray_recv                              |
| pg_catalog         | anycompatiblearray_send                              |
| pg_catalog         | anycompatiblemultirange_in                           |
| pg_catalog         | anycompatiblemultirange_out                          |
| pg_catalog         | anycompatiblenonarray_in                             |
| pg_catalog         | anycompatiblenonarray_out                            |
| pg_catalog         | anycompatiblerange_in                                |
| pg_catalog         | anycompatiblerange_out                               |
| pg_catalog         | anyelement_in                                        |
| pg_catalog         | anyelement_out                                       |
| pg_catalog         | anyenum_in                                           |
| pg_catalog         | anyenum_out                                          |
| pg_catalog         | anymultirange_in                                     |
| pg_catalog         | anymultirange_out                                    |
| pg_catalog         | anynonarray_in                                       |
| pg_catalog         | anynonarray_out                                      |
| pg_catalog         | anyrange_in                                          |
| pg_catalog         | anyrange_out                                         |
| pg_catalog         | anytextcat                                           |
| pg_catalog         | area                                                 |
| pg_catalog         | area                                                 |
| pg_catalog         | area                                                 |
| pg_catalog         | areajoinsel                                          |
| pg_catalog         | areasel                                              |
| pg_catalog         | array_agg                                            |
| pg_catalog         | array_agg                                            |
| pg_catalog         | array_agg_array_combine                              |
| pg_catalog         | array_agg_array_deserialize                          |
| pg_catalog         | array_agg_array_finalfn                              |
| pg_catalog         | array_agg_array_serialize                            |
| pg_catalog         | array_agg_array_transfn                              |
| pg_catalog         | array_agg_combine                                    |
| pg_catalog         | array_agg_deserialize                                |
| pg_catalog         | array_agg_finalfn                                    |
| pg_catalog         | array_agg_serialize                                  |
| pg_catalog         | array_agg_transfn                                    |
| pg_catalog         | array_append                                         |
| pg_catalog         | array_cat                                            |
| pg_catalog         | array_dims                                           |
| pg_catalog         | array_eq                                             |
| pg_catalog         | array_fill                                           |
| pg_catalog         | array_fill                                           |
| pg_catalog         | array_ge                                             |
| pg_catalog         | array_gt                                             |
| pg_catalog         | array_in                                             |
| pg_catalog         | array_larger                                         |
| pg_catalog         | array_le                                             |
| pg_catalog         | array_length                                         |
| pg_catalog         | array_lower                                          |
| pg_catalog         | array_lt                                             |
| pg_catalog         | array_ndims                                          |
| pg_catalog         | array_ne                                             |
| pg_catalog         | array_out                                            |
| pg_catalog         | array_position                                       |
| pg_catalog         | array_position                                       |
| pg_catalog         | array_positions                                      |
| pg_catalog         | array_prepend                                        |
| pg_catalog         | array_recv                                           |
| pg_catalog         | array_remove                                         |
| pg_catalog         | array_replace                                        |
| pg_catalog         | array_sample                                         |
| pg_catalog         | array_send                                           |
| pg_catalog         | array_shuffle                                        |
| pg_catalog         | array_smaller                                        |
| pg_catalog         | array_subscript_handler                              |
| pg_catalog         | array_to_json                                        |
| pg_catalog         | array_to_json                                        |
| pg_catalog         | array_to_string                                      |
| pg_catalog         | array_to_string                                      |
| pg_catalog         | array_to_tsvector                                    |
| pg_catalog         | array_typanalyze                                     |
| pg_catalog         | array_unnest_support                                 |
| pg_catalog         | array_upper                                          |
| pg_catalog         | arraycontained                                       |
| pg_catalog         | arraycontains                                        |
| pg_catalog         | arraycontjoinsel                                     |
| pg_catalog         | arraycontsel                                         |
| pg_catalog         | arrayoverlap                                         |
| pg_catalog         | ascii                                                |
| pg_catalog         | asin                                                 |
| pg_catalog         | asind                                                |
| pg_catalog         | asinh                                                |
| pg_catalog         | atan                                                 |
| pg_catalog         | atan2                                                |
| pg_catalog         | atan2d                                               |
| pg_catalog         | atand                                                |
| pg_catalog         | atanh                                                |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | avg                                                  |
| pg_catalog         | bernoulli                                            |
| pg_catalog         | big5_to_euc_tw                                       |
| pg_catalog         | big5_to_mic                                          |
| pg_catalog         | big5_to_utf8                                         |
| pg_catalog         | binary_upgrade_add_sub_rel_state                     |
| pg_catalog         | binary_upgrade_create_empty_extension                |
| pg_catalog         | binary_upgrade_logical_slot_has_caught_up            |
| pg_catalog         | binary_upgrade_replorigin_advance                    |
| pg_catalog         | binary_upgrade_set_missing_value                     |
| pg_catalog         | binary_upgrade_set_next_array_pg_type_oid            |
| pg_catalog         | binary_upgrade_set_next_heap_pg_class_oid            |
| pg_catalog         | binary_upgrade_set_next_heap_relfilenode             |
| pg_catalog         | binary_upgrade_set_next_index_pg_class_oid           |
| pg_catalog         | binary_upgrade_set_next_index_relfilenode            |
| pg_catalog         | binary_upgrade_set_next_multirange_array_pg_type_oid |
| pg_catalog         | binary_upgrade_set_next_multirange_pg_type_oid       |
| pg_catalog         | binary_upgrade_set_next_pg_authid_oid                |
| pg_catalog         | binary_upgrade_set_next_pg_enum_oid                  |
| pg_catalog         | binary_upgrade_set_next_pg_tablespace_oid            |
| pg_catalog         | binary_upgrade_set_next_pg_type_oid                  |
| pg_catalog         | binary_upgrade_set_next_toast_pg_class_oid           |
| pg_catalog         | binary_upgrade_set_next_toast_relfilenode            |
| pg_catalog         | binary_upgrade_set_record_init_privs                 |
| pg_catalog         | bit                                                  |
| pg_catalog         | bit                                                  |
| pg_catalog         | bit                                                  |
| pg_catalog         | bit_and                                              |
| pg_catalog         | bit_and                                              |
| pg_catalog         | bit_and                                              |
| pg_catalog         | bit_and                                              |
| pg_catalog         | bit_count                                            |
| pg_catalog         | bit_count                                            |
| pg_catalog         | bit_in                                               |
| pg_catalog         | bit_length                                           |
| pg_catalog         | bit_length                                           |
| pg_catalog         | bit_length                                           |
| pg_catalog         | bit_or                                               |
| pg_catalog         | bit_or                                               |
| pg_catalog         | bit_or                                               |
| pg_catalog         | bit_or                                               |
| pg_catalog         | bit_out                                              |
| pg_catalog         | bit_recv                                             |
| pg_catalog         | bit_send                                             |
| pg_catalog         | bit_xor                                              |
| pg_catalog         | bit_xor                                              |
| pg_catalog         | bit_xor                                              |
| pg_catalog         | bit_xor                                              |
| pg_catalog         | bitand                                               |
| pg_catalog         | bitcat                                               |
| pg_catalog         | bitcmp                                               |
| pg_catalog         | biteq                                                |
| pg_catalog         | bitge                                                |
| pg_catalog         | bitgt                                                |
| pg_catalog         | bitle                                                |
| pg_catalog         | bitlt                                                |
| pg_catalog         | bitne                                                |
| pg_catalog         | bitnot                                               |
| pg_catalog         | bitor                                                |
| pg_catalog         | bitshiftleft                                         |
| pg_catalog         | bitshiftright                                        |
| pg_catalog         | bittypmodin                                          |
| pg_catalog         | bittypmodout                                         |
| pg_catalog         | bitxor                                               |
| pg_catalog         | bool                                                 |
| pg_catalog         | bool                                                 |
| pg_catalog         | bool_accum                                           |
| pg_catalog         | bool_accum_inv                                       |
| pg_catalog         | bool_alltrue                                         |
| pg_catalog         | bool_and                                             |
| pg_catalog         | bool_anytrue                                         |
| pg_catalog         | bool_or                                              |
| pg_catalog         | booland_statefunc                                    |
| pg_catalog         | booleq                                               |
| pg_catalog         | boolge                                               |
| pg_catalog         | boolgt                                               |
| pg_catalog         | boolin                                               |
| pg_catalog         | boolle                                               |
| pg_catalog         | boollt                                               |
| pg_catalog         | boolne                                               |
| pg_catalog         | boolor_statefunc                                     |
| pg_catalog         | boolout                                              |
| pg_catalog         | boolrecv                                             |
| pg_catalog         | boolsend                                             |
| pg_catalog         | bound_box                                            |
| pg_catalog         | box                                                  |
| pg_catalog         | box                                                  |
| pg_catalog         | box                                                  |
| pg_catalog         | box                                                  |
| pg_catalog         | box_above                                            |
| pg_catalog         | box_above_eq                                         |
| pg_catalog         | box_add                                              |
| pg_catalog         | box_below                                            |
| pg_catalog         | box_below_eq                                         |
| pg_catalog         | box_center                                           |
| pg_catalog         | box_contain                                          |
| pg_catalog         | box_contain_pt                                       |
| pg_catalog         | box_contained                                        |
| pg_catalog         | box_distance                                         |
| pg_catalog         | box_div                                              |
| pg_catalog         | box_eq                                               |
| pg_catalog         | box_ge                                               |
| pg_catalog         | box_gt                                               |
| pg_catalog         | box_in                                               |
| pg_catalog         | box_intersect                                        |
| pg_catalog         | box_le                                               |
| pg_catalog         | box_left                                             |
| pg_catalog         | box_lt                                               |
| pg_catalog         | box_mul                                              |
| pg_catalog         | box_out                                              |
| pg_catalog         | box_overabove                                        |
| pg_catalog         | box_overbelow                                        |
| pg_catalog         | box_overlap                                          |
| pg_catalog         | box_overleft                                         |
| pg_catalog         | box_overright                                        |
| pg_catalog         | box_recv                                             |
| pg_catalog         | box_right                                            |
| pg_catalog         | box_same                                             |
| pg_catalog         | box_send                                             |
| pg_catalog         | box_sub                                              |
| pg_catalog         | bpchar                                               |
| pg_catalog         | bpchar                                               |
| pg_catalog         | bpchar                                               |
| pg_catalog         | bpchar_larger                                        |
| pg_catalog         | bpchar_pattern_ge                                    |
| pg_catalog         | bpchar_pattern_gt                                    |
| pg_catalog         | bpchar_pattern_le                                    |
| pg_catalog         | bpchar_pattern_lt                                    |
| pg_catalog         | bpchar_smaller                                       |
| pg_catalog         | bpchar_sortsupport                                   |
| pg_catalog         | bpcharcmp                                            |
| pg_catalog         | bpchareq                                             |
| pg_catalog         | bpcharge                                             |
| pg_catalog         | bpchargt                                             |
| pg_catalog         | bpchariclike                                         |
| pg_catalog         | bpcharicnlike                                        |
| pg_catalog         | bpcharicregexeq                                      |
| pg_catalog         | bpcharicregexne                                      |
| pg_catalog         | bpcharin                                             |
| pg_catalog         | bpcharle                                             |
| pg_catalog         | bpcharlike                                           |
| pg_catalog         | bpcharlt                                             |
| pg_catalog         | bpcharne                                             |
| pg_catalog         | bpcharnlike                                          |
| pg_catalog         | bpcharout                                            |
| pg_catalog         | bpcharrecv                                           |
| pg_catalog         | bpcharregexeq                                        |
| pg_catalog         | bpcharregexne                                        |
| pg_catalog         | bpcharsend                                           |
| pg_catalog         | bpchartypmodin                                       |
| pg_catalog         | bpchartypmodout                                      |
| pg_catalog         | brin_bloom_add_value                                 |
| pg_catalog         | brin_bloom_consistent                                |
| pg_catalog         | brin_bloom_opcinfo                                   |
| pg_catalog         | brin_bloom_options                                   |
| pg_catalog         | brin_bloom_summary_in                                |
| pg_catalog         | brin_bloom_summary_out                               |
| pg_catalog         | brin_bloom_summary_recv                              |
| pg_catalog         | brin_bloom_summary_send                              |
| pg_catalog         | brin_bloom_union                                     |
| pg_catalog         | brin_desummarize_range                               |
| pg_catalog         | brin_inclusion_add_value                             |
| pg_catalog         | brin_inclusion_consistent                            |
| pg_catalog         | brin_inclusion_opcinfo                               |
| pg_catalog         | brin_inclusion_union                                 |
| pg_catalog         | brin_minmax_add_value                                |
| pg_catalog         | brin_minmax_consistent                               |
| pg_catalog         | brin_minmax_multi_add_value                          |
| pg_catalog         | brin_minmax_multi_consistent                         |
| pg_catalog         | brin_minmax_multi_distance_date                      |
| pg_catalog         | brin_minmax_multi_distance_float4                    |
| pg_catalog         | brin_minmax_multi_distance_float8                    |
| pg_catalog         | brin_minmax_multi_distance_inet                      |
| pg_catalog         | brin_minmax_multi_distance_int2                      |
| pg_catalog         | brin_minmax_multi_distance_int4                      |
| pg_catalog         | brin_minmax_multi_distance_int8                      |
| pg_catalog         | brin_minmax_multi_distance_interval                  |
| pg_catalog         | brin_minmax_multi_distance_macaddr                   |
| pg_catalog         | brin_minmax_multi_distance_macaddr8                  |
| pg_catalog         | brin_minmax_multi_distance_numeric                   |
| pg_catalog         | brin_minmax_multi_distance_pg_lsn                    |
| pg_catalog         | brin_minmax_multi_distance_tid                       |
| pg_catalog         | brin_minmax_multi_distance_time                      |
| pg_catalog         | brin_minmax_multi_distance_timestamp                 |
| pg_catalog         | brin_minmax_multi_distance_timetz                    |
| pg_catalog         | brin_minmax_multi_distance_uuid                      |
| pg_catalog         | brin_minmax_multi_opcinfo                            |
| pg_catalog         | brin_minmax_multi_options                            |
| pg_catalog         | brin_minmax_multi_summary_in                         |
| pg_catalog         | brin_minmax_multi_summary_out                        |
| pg_catalog         | brin_minmax_multi_summary_recv                       |
| pg_catalog         | brin_minmax_multi_summary_send                       |
| pg_catalog         | brin_minmax_multi_union                              |
| pg_catalog         | brin_minmax_opcinfo                                  |
| pg_catalog         | brin_minmax_union                                    |
| pg_catalog         | brin_summarize_new_values                            |
| pg_catalog         | brin_summarize_range                                 |
| pg_catalog         | brinhandler                                          |
| pg_catalog         | broadcast                                            |
| pg_catalog         | btarraycmp                                           |
| pg_catalog         | btboolcmp                                            |
| pg_catalog         | btbpchar_pattern_cmp                                 |
| pg_catalog         | btbpchar_pattern_sortsupport                         |
| pg_catalog         | btcharcmp                                            |
| pg_catalog         | btequalimage                                         |
| pg_catalog         | btfloat48cmp                                         |
| pg_catalog         | btfloat4cmp                                          |
| pg_catalog         | btfloat4sortsupport                                  |
| pg_catalog         | btfloat84cmp                                         |
| pg_catalog         | btfloat8cmp                                          |
| pg_catalog         | btfloat8sortsupport                                  |
| pg_catalog         | bthandler                                            |
| pg_catalog         | btint24cmp                                           |
| pg_catalog         | btint28cmp                                           |
| pg_catalog         | btint2cmp                                            |
| pg_catalog         | btint2sortsupport                                    |
| pg_catalog         | btint42cmp                                           |
| pg_catalog         | btint48cmp                                           |
| pg_catalog         | btint4cmp                                            |
| pg_catalog         | btint4sortsupport                                    |
| pg_catalog         | btint82cmp                                           |
| pg_catalog         | btint84cmp                                           |
| pg_catalog         | btint8cmp                                            |
| pg_catalog         | btint8sortsupport                                    |
| pg_catalog         | btnamecmp                                            |
| pg_catalog         | btnamesortsupport                                    |
| pg_catalog         | btnametextcmp                                        |
| pg_catalog         | btoidcmp                                             |
| pg_catalog         | btoidsortsupport                                     |
| pg_catalog         | btoidvectorcmp                                       |
| pg_catalog         | btrecordcmp                                          |
| pg_catalog         | btrecordimagecmp                                     |
| pg_catalog         | btrim                                                |
| pg_catalog         | btrim                                                |
| pg_catalog         | btrim                                                |
| pg_catalog         | bttext_pattern_cmp                                   |
| pg_catalog         | bttext_pattern_sortsupport                           |
| pg_catalog         | bttextcmp                                            |
| pg_catalog         | bttextnamecmp                                        |
| pg_catalog         | bttextsortsupport                                    |
| pg_catalog         | bttidcmp                                             |
| pg_catalog         | btvarstrequalimage                                   |
| pg_catalog         | bytea_sortsupport                                    |
| pg_catalog         | bytea_string_agg_finalfn                             |
| pg_catalog         | bytea_string_agg_transfn                             |
| pg_catalog         | byteacat                                             |
| pg_catalog         | byteacmp                                             |
| pg_catalog         | byteaeq                                              |
| pg_catalog         | byteage                                              |
| pg_catalog         | byteagt                                              |
| pg_catalog         | byteain                                              |
| pg_catalog         | byteale                                              |
| pg_catalog         | bytealike                                            |
| pg_catalog         | bytealt                                              |
| pg_catalog         | byteane                                              |
| pg_catalog         | byteanlike                                           |
| pg_catalog         | byteaout                                             |
| pg_catalog         | bytearecv                                            |
| pg_catalog         | byteasend                                            |
| pg_catalog         | cardinality                                          |
| pg_catalog         | cash_cmp                                             |
| pg_catalog         | cash_div_cash                                        |
| pg_catalog         | cash_div_flt4                                        |
| pg_catalog         | cash_div_flt8                                        |
| pg_catalog         | cash_div_int2                                        |
| pg_catalog         | cash_div_int4                                        |
| pg_catalog         | cash_div_int8                                        |
| pg_catalog         | cash_eq                                              |
| pg_catalog         | cash_ge                                              |
| pg_catalog         | cash_gt                                              |
| pg_catalog         | cash_in                                              |
| pg_catalog         | cash_le                                              |
| pg_catalog         | cash_lt                                              |
| pg_catalog         | cash_mi                                              |
| pg_catalog         | cash_mul_flt4                                        |
| pg_catalog         | cash_mul_flt8                                        |
| pg_catalog         | cash_mul_int2                                        |
| pg_catalog         | cash_mul_int4                                        |
| pg_catalog         | cash_mul_int8                                        |
| pg_catalog         | cash_ne                                              |
| pg_catalog         | cash_out                                             |
| pg_catalog         | cash_pl                                              |
| pg_catalog         | cash_recv                                            |
| pg_catalog         | cash_send                                            |
| pg_catalog         | cash_words                                           |
| pg_catalog         | cashlarger                                           |
| pg_catalog         | cashsmaller                                          |
| pg_catalog         | cbrt                                                 |
| pg_catalog         | ceil                                                 |
| pg_catalog         | ceil                                                 |
| pg_catalog         | ceiling                                              |
| pg_catalog         | ceiling                                              |
| pg_catalog         | center                                               |
| pg_catalog         | center                                               |
| pg_catalog         | char                                                 |
| pg_catalog         | char                                                 |
| pg_catalog         | char_length                                          |
| pg_catalog         | char_length                                          |
| pg_catalog         | character_length                                     |
| pg_catalog         | character_length                                     |
| pg_catalog         | chareq                                               |
| pg_catalog         | charge                                               |
| pg_catalog         | chargt                                               |
| pg_catalog         | charin                                               |
| pg_catalog         | charle                                               |
| pg_catalog         | charlt                                               |
| pg_catalog         | charne                                               |
| pg_catalog         | charout                                              |
| pg_catalog         | charrecv                                             |
| pg_catalog         | charsend                                             |
| pg_catalog         | chr                                                  |
| pg_catalog         | cideq                                                |
| pg_catalog         | cidin                                                |
| pg_catalog         | cidout                                               |
| pg_catalog         | cidr                                                 |
| pg_catalog         | cidr_in                                              |
| pg_catalog         | cidr_out                                             |
| pg_catalog         | cidr_recv                                            |
| pg_catalog         | cidr_send                                            |
| pg_catalog         | cidrecv                                              |
| pg_catalog         | cidsend                                              |
| pg_catalog         | circle                                               |
| pg_catalog         | circle                                               |
| pg_catalog         | circle                                               |
| pg_catalog         | circle_above                                         |
| pg_catalog         | circle_add_pt                                        |
| pg_catalog         | circle_below                                         |
| pg_catalog         | circle_center                                        |
| pg_catalog         | circle_contain                                       |
| pg_catalog         | circle_contain_pt                                    |
| pg_catalog         | circle_contained                                     |
| pg_catalog         | circle_distance                                      |
| pg_catalog         | circle_div_pt                                        |
| pg_catalog         | circle_eq                                            |
| pg_catalog         | circle_ge                                            |
| pg_catalog         | circle_gt                                            |
| pg_catalog         | circle_in                                            |
| pg_catalog         | circle_le                                            |
| pg_catalog         | circle_left                                          |
| pg_catalog         | circle_lt                                            |
| pg_catalog         | circle_mul_pt                                        |
| pg_catalog         | circle_ne                                            |
| pg_catalog         | circle_out                                           |
| pg_catalog         | circle_overabove                                     |
| pg_catalog         | circle_overbelow                                     |
| pg_catalog         | circle_overlap                                       |
| pg_catalog         | circle_overleft                                      |
| pg_catalog         | circle_overright                                     |
| pg_catalog         | circle_recv                                          |
| pg_catalog         | circle_right                                         |
| pg_catalog         | circle_same                                          |
| pg_catalog         | circle_send                                          |
| pg_catalog         | circle_sub_pt                                        |
| pg_catalog         | clock_timestamp                                      |
| pg_catalog         | close_ls                                             |
| pg_catalog         | close_lseg                                           |
| pg_catalog         | close_pb                                             |
| pg_catalog         | close_pl                                             |
| pg_catalog         | close_ps                                             |
| pg_catalog         | close_sb                                             |
| pg_catalog         | col_description                                      |
| pg_catalog         | concat                                               |
| pg_catalog         | concat_ws                                            |
| pg_catalog         | contjoinsel                                          |
| pg_catalog         | contsel                                              |
| pg_catalog         | convert                                              |
| pg_catalog         | convert_from                                         |
| pg_catalog         | convert_to                                           |
| pg_catalog         | corr                                                 |
| pg_catalog         | cos                                                  |
| pg_catalog         | cosd                                                 |
| pg_catalog         | cosh                                                 |
| pg_catalog         | cot                                                  |
| pg_catalog         | cotd                                                 |
| pg_catalog         | count                                                |
| pg_catalog         | count                                                |
| pg_catalog         | covar_pop                                            |
| pg_catalog         | covar_samp                                           |
| pg_catalog         | cstring_in                                           |
| pg_catalog         | cstring_out                                          |
| pg_catalog         | cstring_recv                                         |
| pg_catalog         | cstring_send                                         |
| pg_catalog         | cume_dist                                            |
| pg_catalog         | cume_dist                                            |
| pg_catalog         | cume_dist_final                                      |
| pg_catalog         | current_database                                     |
| pg_catalog         | current_query                                        |
| pg_catalog         | current_schema                                       |
| pg_catalog         | current_schemas                                      |
| pg_catalog         | current_setting                                      |
| pg_catalog         | current_setting                                      |
| pg_catalog         | current_user                                         |
| pg_catalog         | currtid2                                             |
| pg_catalog         | currval                                              |
| pg_catalog         | cursor_to_xml                                        |
| pg_catalog         | cursor_to_xmlschema                                  |
| pg_catalog         | database_to_xml                                      |
| pg_catalog         | database_to_xml_and_xmlschema                        |
| pg_catalog         | database_to_xmlschema                                |
| pg_catalog         | date                                                 |
| pg_catalog         | date                                                 |
| pg_catalog         | date_add                                             |
| pg_catalog         | date_add                                             |
| pg_catalog         | date_bin                                             |
| pg_catalog         | date_bin                                             |
| pg_catalog         | date_cmp                                             |
| pg_catalog         | date_cmp_timestamp                                   |
| pg_catalog         | date_cmp_timestamptz                                 |
| pg_catalog         | date_eq                                              |
| pg_catalog         | date_eq_timestamp                                    |
| pg_catalog         | date_eq_timestamptz                                  |
| pg_catalog         | date_ge                                              |
| pg_catalog         | date_ge_timestamp                                    |
| pg_catalog         | date_ge_timestamptz                                  |
| pg_catalog         | date_gt                                              |
| pg_catalog         | date_gt_timestamp                                    |
| pg_catalog         | date_gt_timestamptz                                  |
| pg_catalog         | date_in                                              |
| pg_catalog         | date_larger                                          |
| pg_catalog         | date_le                                              |
| pg_catalog         | date_le_timestamp                                    |
| pg_catalog         | date_le_timestamptz                                  |
| pg_catalog         | date_lt                                              |
| pg_catalog         | date_lt_timestamp                                    |
| pg_catalog         | date_lt_timestamptz                                  |
| pg_catalog         | date_mi                                              |
| pg_catalog         | date_mi_interval                                     |
| pg_catalog         | date_mii                                             |
| pg_catalog         | date_ne                                              |
| pg_catalog         | date_ne_timestamp                                    |
| pg_catalog         | date_ne_timestamptz                                  |
| pg_catalog         | date_out                                             |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_part                                            |
| pg_catalog         | date_pl_interval                                     |
| pg_catalog         | date_pli                                             |
| pg_catalog         | date_recv                                            |
| pg_catalog         | date_send                                            |
| pg_catalog         | date_smaller                                         |
| pg_catalog         | date_sortsupport                                     |
| pg_catalog         | date_subtract                                        |
| pg_catalog         | date_subtract                                        |
| pg_catalog         | date_trunc                                           |
| pg_catalog         | date_trunc                                           |
| pg_catalog         | date_trunc                                           |
| pg_catalog         | date_trunc                                           |
| pg_catalog         | datemultirange                                       |
| pg_catalog         | datemultirange                                       |
| pg_catalog         | datemultirange                                       |
| pg_catalog         | daterange                                            |
| pg_catalog         | daterange                                            |
| pg_catalog         | daterange_canonical                                  |
| pg_catalog         | daterange_subdiff                                    |
| pg_catalog         | datetime_pl                                          |
| pg_catalog         | datetimetz_pl                                        |
| pg_catalog         | dcbrt                                                |
| pg_catalog         | decode                                               |
| pg_catalog         | degrees                                              |
| pg_catalog         | dense_rank                                           |
| pg_catalog         | dense_rank                                           |
| pg_catalog         | dense_rank_final                                     |
| pg_catalog         | dexp                                                 |
| pg_catalog         | diagonal                                             |
| pg_catalog         | diameter                                             |
| pg_catalog         | dispell_init                                         |
| pg_catalog         | dispell_lexize                                       |
| pg_catalog         | dist_bp                                              |
| pg_catalog         | dist_bs                                              |
| pg_catalog         | dist_cpoint                                          |
| pg_catalog         | dist_cpoly                                           |
| pg_catalog         | dist_lp                                              |
| pg_catalog         | dist_ls                                              |
| pg_catalog         | dist_pathp                                           |
| pg_catalog         | dist_pb                                              |
| pg_catalog         | dist_pc                                              |
| pg_catalog         | dist_pl                                              |
| pg_catalog         | dist_polyc                                           |
| pg_catalog         | dist_polyp                                           |
| pg_catalog         | dist_ppath                                           |
| pg_catalog         | dist_ppoly                                           |
| pg_catalog         | dist_ps                                              |
| pg_catalog         | dist_sb                                              |
| pg_catalog         | dist_sl                                              |
| pg_catalog         | dist_sp                                              |
| pg_catalog         | div                                                  |
| pg_catalog         | dlog1                                                |
| pg_catalog         | dlog10                                               |
| pg_catalog         | domain_in                                            |
| pg_catalog         | domain_recv                                          |
| pg_catalog         | dpow                                                 |
| pg_catalog         | dround                                               |
| pg_catalog         | dsimple_init                                         |
| pg_catalog         | dsimple_lexize                                       |
| pg_catalog         | dsnowball_init                                       |
| pg_catalog         | dsnowball_lexize                                     |
| pg_catalog         | dsqrt                                                |
| pg_catalog         | dsynonym_init                                        |
| pg_catalog         | dsynonym_lexize                                      |
| pg_catalog         | dtrunc                                               |
| pg_catalog         | elem_contained_by_multirange                         |
| pg_catalog         | elem_contained_by_range                              |
| pg_catalog         | elem_contained_by_range_support                      |
| pg_catalog         | encode                                               |
| pg_catalog         | enum_cmp                                             |
| pg_catalog         | enum_eq                                              |
| pg_catalog         | enum_first                                           |
| pg_catalog         | enum_ge                                              |
| pg_catalog         | enum_gt                                              |
| pg_catalog         | enum_in                                              |
| pg_catalog         | enum_larger                                          |
| pg_catalog         | enum_last                                            |
| pg_catalog         | enum_le                                              |
| pg_catalog         | enum_lt                                              |
| pg_catalog         | enum_ne                                              |
| pg_catalog         | enum_out                                             |
| pg_catalog         | enum_range                                           |
| pg_catalog         | enum_range                                           |
| pg_catalog         | enum_recv                                            |
| pg_catalog         | enum_send                                            |
| pg_catalog         | enum_smaller                                         |
| pg_catalog         | eqjoinsel                                            |
| pg_catalog         | eqsel                                                |
| pg_catalog         | erf                                                  |
| pg_catalog         | erfc                                                 |
| pg_catalog         | euc_cn_to_mic                                        |
| pg_catalog         | euc_cn_to_utf8                                       |
| pg_catalog         | euc_jis_2004_to_shift_jis_2004                       |
| pg_catalog         | euc_jis_2004_to_utf8                                 |
| pg_catalog         | euc_jp_to_mic                                        |
| pg_catalog         | euc_jp_to_sjis                                       |
| pg_catalog         | euc_jp_to_utf8                                       |
| pg_catalog         | euc_kr_to_mic                                        |
| pg_catalog         | euc_kr_to_utf8                                       |
| pg_catalog         | euc_tw_to_big5                                       |
| pg_catalog         | euc_tw_to_mic                                        |
| pg_catalog         | euc_tw_to_utf8                                       |
| pg_catalog         | event_trigger_in                                     |
| pg_catalog         | event_trigger_out                                    |
| pg_catalog         | every                                                |
| pg_catalog         | exp                                                  |
| pg_catalog         | exp                                                  |
| pg_catalog         | extract                                              |
| pg_catalog         | extract                                              |
| pg_catalog         | extract                                              |
| pg_catalog         | extract                                              |
| pg_catalog         | extract                                              |
| pg_catalog         | extract                                              |
| pg_catalog         | factorial                                            |
| pg_catalog         | family                                               |
| pg_catalog         | fdw_handler_in                                       |
| pg_catalog         | fdw_handler_out                                      |
| pg_catalog         | first_value                                          |
| pg_catalog         | float4                                               |
| pg_catalog         | float4                                               |
| pg_catalog         | float4                                               |
| pg_catalog         | float4                                               |
| pg_catalog         | float4                                               |
| pg_catalog         | float4                                               |
| pg_catalog         | float48div                                           |
| pg_catalog         | float48eq                                            |
| pg_catalog         | float48ge                                            |
| pg_catalog         | float48gt                                            |
| pg_catalog         | float48le                                            |
| pg_catalog         | float48lt                                            |
| pg_catalog         | float48mi                                            |
| pg_catalog         | float48mul                                           |
| pg_catalog         | float48ne                                            |
| pg_catalog         | float48pl                                            |
| pg_catalog         | float4_accum                                         |
| pg_catalog         | float4abs                                            |
| pg_catalog         | float4div                                            |
| pg_catalog         | float4eq                                             |
| pg_catalog         | float4ge                                             |
| pg_catalog         | float4gt                                             |
| pg_catalog         | float4in                                             |
| pg_catalog         | float4larger                                         |
| pg_catalog         | float4le                                             |
| pg_catalog         | float4lt                                             |
| pg_catalog         | float4mi                                             |
| pg_catalog         | float4mul                                            |
| pg_catalog         | float4ne                                             |
| pg_catalog         | float4out                                            |
| pg_catalog         | float4pl                                             |
| pg_catalog         | float4recv                                           |
| pg_catalog         | float4send                                           |
| pg_catalog         | float4smaller                                        |
| pg_catalog         | float4um                                             |
| pg_catalog         | float4up                                             |
| pg_catalog         | float8                                               |
| pg_catalog         | float8                                               |
| pg_catalog         | float8                                               |
| pg_catalog         | float8                                               |
| pg_catalog         | float8                                               |
| pg_catalog         | float8                                               |
| pg_catalog         | float84div                                           |
| pg_catalog         | float84eq                                            |
| pg_catalog         | float84ge                                            |
| pg_catalog         | float84gt                                            |
| pg_catalog         | float84le                                            |
| pg_catalog         | float84lt                                            |
| pg_catalog         | float84mi                                            |
| pg_catalog         | float84mul                                           |
| pg_catalog         | float84ne                                            |
| pg_catalog         | float84pl                                            |
| pg_catalog         | float8_accum                                         |
| pg_catalog         | float8_avg                                           |
| pg_catalog         | float8_combine                                       |
| pg_catalog         | float8_corr                                          |
| pg_catalog         | float8_covar_pop                                     |
| pg_catalog         | float8_covar_samp                                    |
| pg_catalog         | float8_regr_accum                                    |
| pg_catalog         | float8_regr_avgx                                     |
| pg_catalog         | float8_regr_avgy                                     |
| pg_catalog         | float8_regr_combine                                  |
| pg_catalog         | float8_regr_intercept                                |
| pg_catalog         | float8_regr_r2                                       |
| pg_catalog         | float8_regr_slope                                    |
| pg_catalog         | float8_regr_sxx                                      |
| pg_catalog         | float8_regr_sxy                                      |
| pg_catalog         | float8_regr_syy                                      |
| pg_catalog         | float8_stddev_pop                                    |
| pg_catalog         | float8_stddev_samp                                   |
| pg_catalog         | float8_var_pop                                       |
| pg_catalog         | float8_var_samp                                      |
| pg_catalog         | float8abs                                            |
| pg_catalog         | float8div                                            |
| pg_catalog         | float8eq                                             |
| pg_catalog         | float8ge                                             |
| pg_catalog         | float8gt                                             |
| pg_catalog         | float8in                                             |
| pg_catalog         | float8larger                                         |
| pg_catalog         | float8le                                             |
| pg_catalog         | float8lt                                             |
| pg_catalog         | float8mi                                             |
| pg_catalog         | float8mul                                            |
| pg_catalog         | float8ne                                             |
| pg_catalog         | float8out                                            |
| pg_catalog         | float8pl                                             |
| pg_catalog         | float8recv                                           |
| pg_catalog         | float8send                                           |
| pg_catalog         | float8smaller                                        |
| pg_catalog         | float8um                                             |
| pg_catalog         | float8up                                             |
| pg_catalog         | floor                                                |
| pg_catalog         | floor                                                |
| pg_catalog         | flt4_mul_cash                                        |
| pg_catalog         | flt8_mul_cash                                        |
| pg_catalog         | fmgr_c_validator                                     |
| pg_catalog         | fmgr_internal_validator                              |
| pg_catalog         | fmgr_sql_validator                                   |
| pg_catalog         | format                                               |
| pg_catalog         | format                                               |
| pg_catalog         | format_type                                          |
| pg_catalog         | gb18030_to_utf8                                      |
| pg_catalog         | gbk_to_utf8                                          |
| pg_catalog         | gcd                                                  |
| pg_catalog         | gcd                                                  |
| pg_catalog         | gcd                                                  |
| pg_catalog         | gen_random_uuid                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series                                      |
| pg_catalog         | generate_series_int4_support                         |
| pg_catalog         | generate_series_int8_support                         |
| pg_catalog         | generate_subscripts                                  |
| pg_catalog         | generate_subscripts                                  |
| pg_catalog         | get_bit                                              |
| pg_catalog         | get_bit                                              |
| pg_catalog         | get_byte                                             |
| pg_catalog         | get_current_ts_config                                |
| pg_catalog         | getdatabaseencoding                                  |
| pg_catalog         | getpgusername                                        |
| pg_catalog         | gin_clean_pending_list                               |
| pg_catalog         | gin_cmp_prefix                                       |
| pg_catalog         | gin_cmp_tslexeme                                     |
| pg_catalog         | gin_compare_jsonb                                    |
| pg_catalog         | gin_consistent_jsonb                                 |
| pg_catalog         | gin_consistent_jsonb_path                            |
| pg_catalog         | gin_extract_jsonb                                    |
| pg_catalog         | gin_extract_jsonb_path                               |
| pg_catalog         | gin_extract_jsonb_query                              |
| pg_catalog         | gin_extract_jsonb_query_path                         |
| pg_catalog         | gin_extract_tsquery                                  |
| pg_catalog         | gin_extract_tsquery                                  |
| pg_catalog         | gin_extract_tsquery                                  |
| pg_catalog         | gin_extract_tsvector                                 |
| pg_catalog         | gin_extract_tsvector                                 |
| pg_catalog         | gin_triconsistent_jsonb                              |
| pg_catalog         | gin_triconsistent_jsonb_path                         |
| pg_catalog         | gin_tsquery_consistent                               |
| pg_catalog         | gin_tsquery_consistent                               |
| pg_catalog         | gin_tsquery_consistent                               |
| pg_catalog         | gin_tsquery_triconsistent                            |
| pg_catalog         | ginarrayconsistent                                   |
| pg_catalog         | ginarrayextract                                      |
| pg_catalog         | ginarrayextract                                      |
| pg_catalog         | ginarraytriconsistent                                |
| pg_catalog         | ginhandler                                           |
| pg_catalog         | ginqueryarrayextract                                 |
| pg_catalog         | gist_box_consistent                                  |
| pg_catalog         | gist_box_distance                                    |
| pg_catalog         | gist_box_penalty                                     |
| pg_catalog         | gist_box_picksplit                                   |
| pg_catalog         | gist_box_same                                        |
| pg_catalog         | gist_box_union                                       |
| pg_catalog         | gist_circle_compress                                 |
| pg_catalog         | gist_circle_consistent                               |
| pg_catalog         | gist_circle_distance                                 |
| pg_catalog         | gist_point_compress                                  |
| pg_catalog         | gist_point_consistent                                |
| pg_catalog         | gist_point_distance                                  |
| pg_catalog         | gist_point_fetch                                     |
| pg_catalog         | gist_point_sortsupport                               |
| pg_catalog         | gist_poly_compress                                   |
| pg_catalog         | gist_poly_consistent                                 |
| pg_catalog         | gist_poly_distance                                   |
| pg_catalog         | gisthandler                                          |
| pg_catalog         | gtsquery_compress                                    |
| pg_catalog         | gtsquery_consistent                                  |
| pg_catalog         | gtsquery_consistent                                  |
| pg_catalog         | gtsquery_penalty                                     |
| pg_catalog         | gtsquery_picksplit                                   |
| pg_catalog         | gtsquery_same                                        |
| pg_catalog         | gtsquery_union                                       |
| pg_catalog         | gtsvector_compress                                   |
| pg_catalog         | gtsvector_consistent                                 |
| pg_catalog         | gtsvector_consistent                                 |
| pg_catalog         | gtsvector_decompress                                 |
| pg_catalog         | gtsvector_options                                    |
| pg_catalog         | gtsvector_penalty                                    |
| pg_catalog         | gtsvector_picksplit                                  |
| pg_catalog         | gtsvector_same                                       |
| pg_catalog         | gtsvector_union                                      |
| pg_catalog         | gtsvectorin                                          |
| pg_catalog         | gtsvectorout                                         |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_any_column_privilege                             |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_column_privilege                                 |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_database_privilege                               |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_foreign_data_wrapper_privilege                   |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_function_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_language_privilege                               |
| pg_catalog         | has_parameter_privilege                              |
| pg_catalog         | has_parameter_privilege                              |
| pg_catalog         | has_parameter_privilege                              |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_schema_privilege                                 |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_sequence_privilege                               |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_server_privilege                                 |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_table_privilege                                  |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_tablespace_privilege                             |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | has_type_privilege                                   |
| pg_catalog         | hash_aclitem                                         |
| pg_catalog         | hash_aclitem_extended                                |
| pg_catalog         | hash_array                                           |
| pg_catalog         | hash_array_extended                                  |
| pg_catalog         | hash_multirange                                      |
| pg_catalog         | hash_multirange_extended                             |
| pg_catalog         | hash_numeric                                         |
| pg_catalog         | hash_numeric_extended                                |
| pg_catalog         | hash_range                                           |
| pg_catalog         | hash_range_extended                                  |
| pg_catalog         | hash_record                                          |
| pg_catalog         | hash_record_extended                                 |
| pg_catalog         | hashbpchar                                           |
| pg_catalog         | hashbpcharextended                                   |
| pg_catalog         | hashchar                                             |
| pg_catalog         | hashcharextended                                     |
| pg_catalog         | hashenum                                             |
| pg_catalog         | hashenumextended                                     |
| pg_catalog         | hashfloat4                                           |
| pg_catalog         | hashfloat4extended                                   |
| pg_catalog         | hashfloat8                                           |
| pg_catalog         | hashfloat8extended                                   |
| pg_catalog         | hashhandler                                          |
| pg_catalog         | hashinet                                             |
| pg_catalog         | hashinetextended                                     |
| pg_catalog         | hashint2                                             |
| pg_catalog         | hashint2extended                                     |
| pg_catalog         | hashint4                                             |
| pg_catalog         | hashint4extended                                     |
| pg_catalog         | hashint8                                             |
| pg_catalog         | hashint8extended                                     |
| pg_catalog         | hashmacaddr                                          |
| pg_catalog         | hashmacaddr8                                         |
| pg_catalog         | hashmacaddr8extended                                 |
| pg_catalog         | hashmacaddrextended                                  |
| pg_catalog         | hashname                                             |
| pg_catalog         | hashnameextended                                     |
| pg_catalog         | hashoid                                              |
| pg_catalog         | hashoidextended                                      |
| pg_catalog         | hashoidvector                                        |
| pg_catalog         | hashoidvectorextended                                |
| pg_catalog         | hashtext                                             |
| pg_catalog         | hashtextextended                                     |
| pg_catalog         | hashtid                                              |
| pg_catalog         | hashtidextended                                      |
| pg_catalog         | hashvarlena                                          |
| pg_catalog         | hashvarlenaextended                                  |
| pg_catalog         | heap_tableam_handler                                 |
| pg_catalog         | height                                               |
| pg_catalog         | host                                                 |
| pg_catalog         | hostmask                                             |
| pg_catalog         | iclikejoinsel                                        |
| pg_catalog         | iclikesel                                            |
| pg_catalog         | icnlikejoinsel                                       |
| pg_catalog         | icnlikesel                                           |
| pg_catalog         | icregexeqjoinsel                                     |
| pg_catalog         | icregexeqsel                                         |
| pg_catalog         | icregexnejoinsel                                     |
| pg_catalog         | icregexnesel                                         |
| pg_catalog         | icu_unicode_version                                  |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | in_range                                             |
| pg_catalog         | index_am_handler_in                                  |
| pg_catalog         | index_am_handler_out                                 |
| pg_catalog         | inet_client_addr                                     |
| pg_catalog         | inet_client_port                                     |
| pg_catalog         | inet_gist_compress                                   |
| pg_catalog         | inet_gist_consistent                                 |
| pg_catalog         | inet_gist_fetch                                      |
| pg_catalog         | inet_gist_penalty                                    |
| pg_catalog         | inet_gist_picksplit                                  |
| pg_catalog         | inet_gist_same                                       |
| pg_catalog         | inet_gist_union                                      |
| pg_catalog         | inet_in                                              |
| pg_catalog         | inet_merge                                           |
| pg_catalog         | inet_out                                             |
| pg_catalog         | inet_recv                                            |
| pg_catalog         | inet_same_family                                     |
| pg_catalog         | inet_send                                            |
| pg_catalog         | inet_server_addr                                     |
| pg_catalog         | inet_server_port                                     |
| pg_catalog         | inet_spg_choose                                      |
| pg_catalog         | inet_spg_config                                      |
| pg_catalog         | inet_spg_inner_consistent                            |
| pg_catalog         | inet_spg_leaf_consistent                             |
| pg_catalog         | inet_spg_picksplit                                   |
| pg_catalog         | inetand                                              |
| pg_catalog         | inetmi                                               |
| pg_catalog         | inetmi_int8                                          |
| pg_catalog         | inetnot                                              |
| pg_catalog         | inetor                                               |
| pg_catalog         | inetpl                                               |
| pg_catalog         | initcap                                              |
| pg_catalog         | int2                                                 |
| pg_catalog         | int2                                                 |
| pg_catalog         | int2                                                 |
| pg_catalog         | int2                                                 |
| pg_catalog         | int2                                                 |
| pg_catalog         | int2                                                 |
| pg_catalog         | int24div                                             |
| pg_catalog         | int24eq                                              |
| pg_catalog         | int24ge                                              |
| pg_catalog         | int24gt                                              |
| pg_catalog         | int24le                                              |
| pg_catalog         | int24lt                                              |
| pg_catalog         | int24mi                                              |
| pg_catalog         | int24mul                                             |
| pg_catalog         | int24ne                                              |
| pg_catalog         | int24pl                                              |
| pg_catalog         | int28div                                             |
| pg_catalog         | int28eq                                              |
| pg_catalog         | int28ge                                              |
| pg_catalog         | int28gt                                              |
| pg_catalog         | int28le                                              |
| pg_catalog         | int28lt                                              |
| pg_catalog         | int28mi                                              |
| pg_catalog         | int28mul                                             |
| pg_catalog         | int28ne                                              |
| pg_catalog         | int28pl                                              |
| pg_catalog         | int2_accum                                           |
| pg_catalog         | int2_accum_inv                                       |
| pg_catalog         | int2_avg_accum                                       |
| pg_catalog         | int2_avg_accum_inv                                   |
| pg_catalog         | int2_mul_cash                                        |
| pg_catalog         | int2_sum                                             |
| pg_catalog         | int2abs                                              |
| pg_catalog         | int2and                                              |
| pg_catalog         | int2div                                              |
| pg_catalog         | int2eq                                               |
| pg_catalog         | int2ge                                               |
| pg_catalog         | int2gt                                               |
| pg_catalog         | int2in                                               |
| pg_catalog         | int2int4_sum                                         |
| pg_catalog         | int2larger                                           |
| pg_catalog         | int2le                                               |
| pg_catalog         | int2lt                                               |
| pg_catalog         | int2mi                                               |
| pg_catalog         | int2mod                                              |
| pg_catalog         | int2mul                                              |
| pg_catalog         | int2ne                                               |
| pg_catalog         | int2not                                              |
| pg_catalog         | int2or                                               |
| pg_catalog         | int2out                                              |
| pg_catalog         | int2pl                                               |
| pg_catalog         | int2recv                                             |
| pg_catalog         | int2send                                             |
| pg_catalog         | int2shl                                              |
| pg_catalog         | int2shr                                              |
| pg_catalog         | int2smaller                                          |
| pg_catalog         | int2um                                               |
| pg_catalog         | int2up                                               |
| pg_catalog         | int2vectorin                                         |
| pg_catalog         | int2vectorout                                        |
| pg_catalog         | int2vectorrecv                                       |
| pg_catalog         | int2vectorsend                                       |
| pg_catalog         | int2xor                                              |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int4                                                 |
| pg_catalog         | int42div                                             |
| pg_catalog         | int42eq                                              |
| pg_catalog         | int42ge                                              |
| pg_catalog         | int42gt                                              |
| pg_catalog         | int42le                                              |
| pg_catalog         | int42lt                                              |
| pg_catalog         | int42mi                                              |
| pg_catalog         | int42mul                                             |
| pg_catalog         | int42ne                                              |
| pg_catalog         | int42pl                                              |
| pg_catalog         | int48div                                             |
| pg_catalog         | int48eq                                              |
| pg_catalog         | int48ge                                              |
| pg_catalog         | int48gt                                              |
| pg_catalog         | int48le                                              |
| pg_catalog         | int48lt                                              |
| pg_catalog         | int48mi                                              |
| pg_catalog         | int48mul                                             |
| pg_catalog         | int48ne                                              |
| pg_catalog         | int48pl                                              |
| pg_catalog         | int4_accum                                           |
| pg_catalog         | int4_accum_inv                                       |
| pg_catalog         | int4_avg_accum                                       |
| pg_catalog         | int4_avg_accum_inv                                   |
| pg_catalog         | int4_avg_combine                                     |
| pg_catalog         | int4_mul_cash                                        |
| pg_catalog         | int4_sum                                             |
| pg_catalog         | int4abs                                              |
| pg_catalog         | int4and                                              |
| pg_catalog         | int4div                                              |
| pg_catalog         | int4eq                                               |
| pg_catalog         | int4ge                                               |
| pg_catalog         | int4gt                                               |
| pg_catalog         | int4in                                               |
| pg_catalog         | int4inc                                              |
| pg_catalog         | int4larger                                           |
| pg_catalog         | int4le                                               |
| pg_catalog         | int4lt                                               |
| pg_catalog         | int4mi                                               |
| pg_catalog         | int4mod                                              |
| pg_catalog         | int4mul                                              |
| pg_catalog         | int4multirange                                       |
| pg_catalog         | int4multirange                                       |
| pg_catalog         | int4multirange                                       |
| pg_catalog         | int4ne                                               |
| pg_catalog         | int4not                                              |
| pg_catalog         | int4or                                               |
| pg_catalog         | int4out                                              |
| pg_catalog         | int4pl                                               |
| pg_catalog         | int4range                                            |
| pg_catalog         | int4range                                            |
| pg_catalog         | int4range_canonical                                  |
| pg_catalog         | int4range_subdiff                                    |
| pg_catalog         | int4recv                                             |
| pg_catalog         | int4send                                             |
| pg_catalog         | int4shl                                              |
| pg_catalog         | int4shr                                              |
| pg_catalog         | int4smaller                                          |
| pg_catalog         | int4um                                               |
| pg_catalog         | int4up                                               |
| pg_catalog         | int4xor                                              |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int8                                                 |
| pg_catalog         | int82div                                             |
| pg_catalog         | int82eq                                              |
| pg_catalog         | int82ge                                              |
| pg_catalog         | int82gt                                              |
| pg_catalog         | int82le                                              |
| pg_catalog         | int82lt                                              |
| pg_catalog         | int82mi                                              |
| pg_catalog         | int82mul                                             |
| pg_catalog         | int82ne                                              |
| pg_catalog         | int82pl                                              |
| pg_catalog         | int84div                                             |
| pg_catalog         | int84eq                                              |
| pg_catalog         | int84ge                                              |
| pg_catalog         | int84gt                                              |
| pg_catalog         | int84le                                              |
| pg_catalog         | int84lt                                              |
| pg_catalog         | int84mi                                              |
| pg_catalog         | int84mul                                             |
| pg_catalog         | int84ne                                              |
| pg_catalog         | int84pl                                              |
| pg_catalog         | int8_accum                                           |
| pg_catalog         | int8_accum_inv                                       |
| pg_catalog         | int8_avg                                             |
| pg_catalog         | int8_avg_accum                                       |
| pg_catalog         | int8_avg_accum_inv                                   |
| pg_catalog         | int8_avg_combine                                     |
| pg_catalog         | int8_avg_deserialize                                 |
| pg_catalog         | int8_avg_serialize                                   |
| pg_catalog         | int8_mul_cash                                        |
| pg_catalog         | int8_sum                                             |
| pg_catalog         | int8abs                                              |
| pg_catalog         | int8and                                              |
| pg_catalog         | int8dec                                              |
| pg_catalog         | int8dec_any                                          |
| pg_catalog         | int8div                                              |
| pg_catalog         | int8eq                                               |
| pg_catalog         | int8ge                                               |
| pg_catalog         | int8gt                                               |
| pg_catalog         | int8in                                               |
| pg_catalog         | int8inc                                              |
| pg_catalog         | int8inc_any                                          |
| pg_catalog         | int8inc_float8_float8                                |
| pg_catalog         | int8inc_support                                      |
| pg_catalog         | int8larger                                           |
| pg_catalog         | int8le                                               |
| pg_catalog         | int8lt                                               |
| pg_catalog         | int8mi                                               |
| pg_catalog         | int8mod                                              |
| pg_catalog         | int8mul                                              |
| pg_catalog         | int8multirange                                       |
| pg_catalog         | int8multirange                                       |
| pg_catalog         | int8multirange                                       |
| pg_catalog         | int8ne                                               |
| pg_catalog         | int8not                                              |
| pg_catalog         | int8or                                               |
| pg_catalog         | int8out                                              |
| pg_catalog         | int8pl                                               |
| pg_catalog         | int8pl_inet                                          |
| pg_catalog         | int8range                                            |
| pg_catalog         | int8range                                            |
| pg_catalog         | int8range_canonical                                  |
| pg_catalog         | int8range_subdiff                                    |
| pg_catalog         | int8recv                                             |
| pg_catalog         | int8send                                             |
| pg_catalog         | int8shl                                              |
| pg_catalog         | int8shr                                              |
| pg_catalog         | int8smaller                                          |
| pg_catalog         | int8um                                               |
| pg_catalog         | int8up                                               |
| pg_catalog         | int8xor                                              |
| pg_catalog         | integer_pl_date                                      |
| pg_catalog         | inter_lb                                             |
| pg_catalog         | inter_sb                                             |
| pg_catalog         | inter_sl                                             |
| pg_catalog         | internal_in                                          |
| pg_catalog         | internal_out                                         |
| pg_catalog         | interval                                             |
| pg_catalog         | interval                                             |
| pg_catalog         | interval_avg                                         |
| pg_catalog         | interval_avg_accum                                   |
| pg_catalog         | interval_avg_accum_inv                               |
| pg_catalog         | interval_avg_combine                                 |
| pg_catalog         | interval_avg_deserialize                             |
| pg_catalog         | interval_avg_serialize                               |
| pg_catalog         | interval_cmp                                         |
| pg_catalog         | interval_div                                         |
| pg_catalog         | interval_eq                                          |
| pg_catalog         | interval_ge                                          |
| pg_catalog         | interval_gt                                          |
| pg_catalog         | interval_hash                                        |
| pg_catalog         | interval_hash_extended                               |
| pg_catalog         | interval_in                                          |
| pg_catalog         | interval_larger                                      |
| pg_catalog         | interval_le                                          |
| pg_catalog         | interval_lt                                          |
| pg_catalog         | interval_mi                                          |
| pg_catalog         | interval_mul                                         |
| pg_catalog         | interval_ne                                          |
| pg_catalog         | interval_out                                         |
| pg_catalog         | interval_pl                                          |
| pg_catalog         | interval_pl_date                                     |
| pg_catalog         | interval_pl_time                                     |
| pg_catalog         | interval_pl_timestamp                                |
| pg_catalog         | interval_pl_timestamptz                              |
| pg_catalog         | interval_pl_timetz                                   |
| pg_catalog         | interval_recv                                        |
| pg_catalog         | interval_send                                        |
| pg_catalog         | interval_smaller                                     |
| pg_catalog         | interval_sum                                         |
| pg_catalog         | interval_support                                     |
| pg_catalog         | interval_um                                          |
| pg_catalog         | intervaltypmodin                                     |
| pg_catalog         | intervaltypmodout                                    |
| pg_catalog         | is_normalized                                        |
| pg_catalog         | isclosed                                             |
| pg_catalog         | isempty                                              |
| pg_catalog         | isempty                                              |
| pg_catalog         | isfinite                                             |
| pg_catalog         | isfinite                                             |
| pg_catalog         | isfinite                                             |
| pg_catalog         | isfinite                                             |
| pg_catalog         | ishorizontal                                         |
| pg_catalog         | ishorizontal                                         |
| pg_catalog         | ishorizontal                                         |
| pg_catalog         | iso8859_1_to_utf8                                    |
| pg_catalog         | iso8859_to_utf8                                      |
| pg_catalog         | iso_to_koi8r                                         |
| pg_catalog         | iso_to_mic                                           |
| pg_catalog         | iso_to_win1251                                       |
| pg_catalog         | iso_to_win866                                        |
| pg_catalog         | isopen                                               |
| pg_catalog         | isparallel                                           |
| pg_catalog         | isparallel                                           |
| pg_catalog         | isperp                                               |
| pg_catalog         | isperp                                               |
| pg_catalog         | isvertical                                           |
| pg_catalog         | isvertical                                           |
| pg_catalog         | isvertical                                           |
| pg_catalog         | johab_to_utf8                                        |
| pg_catalog         | json_agg                                             |
| pg_catalog         | json_agg_finalfn                                     |
| pg_catalog         | json_agg_strict                                      |
| pg_catalog         | json_agg_strict_transfn                              |
| pg_catalog         | json_agg_transfn                                     |
| pg_catalog         | json_array_element                                   |
| pg_catalog         | json_array_element_text                              |
| pg_catalog         | json_array_elements                                  |
| pg_catalog         | json_array_elements_text                             |
| pg_catalog         | json_array_length                                    |
| pg_catalog         | json_build_array                                     |
| pg_catalog         | json_build_array                                     |
| pg_catalog         | json_build_object                                    |
| pg_catalog         | json_build_object                                    |
| pg_catalog         | json_each                                            |
| pg_catalog         | json_each_text                                       |
| pg_catalog         | json_extract_path                                    |
| pg_catalog         | json_extract_path_text                               |
| pg_catalog         | json_in                                              |
| pg_catalog         | json_object                                          |
| pg_catalog         | json_object                                          |
| pg_catalog         | json_object_agg                                      |
| pg_catalog         | json_object_agg_finalfn                              |
| pg_catalog         | json_object_agg_strict                               |
| pg_catalog         | json_object_agg_strict_transfn                       |
| pg_catalog         | json_object_agg_transfn                              |
| pg_catalog         | json_object_agg_unique                               |
| pg_catalog         | json_object_agg_unique_strict                        |
| pg_catalog         | json_object_agg_unique_strict_transfn                |
| pg_catalog         | json_object_agg_unique_transfn                       |
| pg_catalog         | json_object_field                                    |
| pg_catalog         | json_object_field_text                               |
| pg_catalog         | json_object_keys                                     |
| pg_catalog         | json_out                                             |
| pg_catalog         | json_populate_record                                 |
| pg_catalog         | json_populate_recordset                              |
| pg_catalog         | json_recv                                            |
| pg_catalog         | json_send                                            |
| pg_catalog         | json_strip_nulls                                     |
| pg_catalog         | json_to_record                                       |
| pg_catalog         | json_to_recordset                                    |
| pg_catalog         | json_to_tsvector                                     |
| pg_catalog         | json_to_tsvector                                     |
| pg_catalog         | json_typeof                                          |
| pg_catalog         | jsonb_agg                                            |
| pg_catalog         | jsonb_agg_finalfn                                    |
| pg_catalog         | jsonb_agg_strict                                     |
| pg_catalog         | jsonb_agg_strict_transfn                             |
| pg_catalog         | jsonb_agg_transfn                                    |
| pg_catalog         | jsonb_array_element                                  |
| pg_catalog         | jsonb_array_element_text                             |
| pg_catalog         | jsonb_array_elements                                 |
| pg_catalog         | jsonb_array_elements_text                            |
| pg_catalog         | jsonb_array_length                                   |
| pg_catalog         | jsonb_build_array                                    |
| pg_catalog         | jsonb_build_array                                    |
| pg_catalog         | jsonb_build_object                                   |
| pg_catalog         | jsonb_build_object                                   |
| pg_catalog         | jsonb_cmp                                            |
| pg_catalog         | jsonb_concat                                         |
| pg_catalog         | jsonb_contained                                      |
| pg_catalog         | jsonb_contains                                       |
| pg_catalog         | jsonb_delete                                         |
| pg_catalog         | jsonb_delete                                         |
| pg_catalog         | jsonb_delete                                         |
| pg_catalog         | jsonb_delete_path                                    |
| pg_catalog         | jsonb_each                                           |
| pg_catalog         | jsonb_each_text                                      |
| pg_catalog         | jsonb_eq                                             |
| pg_catalog         | jsonb_exists                                         |
| pg_catalog         | jsonb_exists_all                                     |
| pg_catalog         | jsonb_exists_any                                     |
| pg_catalog         | jsonb_extract_path                                   |
| pg_catalog         | jsonb_extract_path_text                              |
| pg_catalog         | jsonb_ge                                             |
| pg_catalog         | jsonb_gt                                             |
| pg_catalog         | jsonb_hash                                           |
| pg_catalog         | jsonb_hash_extended                                  |
| pg_catalog         | jsonb_in                                             |
| pg_catalog         | jsonb_insert                                         |
| pg_catalog         | jsonb_le                                             |
| pg_catalog         | jsonb_lt                                             |
| pg_catalog         | jsonb_ne                                             |
| pg_catalog         | jsonb_object                                         |
| pg_catalog         | jsonb_object                                         |
| pg_catalog         | jsonb_object_agg                                     |
| pg_catalog         | jsonb_object_agg_finalfn                             |
| pg_catalog         | jsonb_object_agg_strict                              |
| pg_catalog         | jsonb_object_agg_strict_transfn                      |
| pg_catalog         | jsonb_object_agg_transfn                             |
| pg_catalog         | jsonb_object_agg_unique                              |
| pg_catalog         | jsonb_object_agg_unique_strict                       |
| pg_catalog         | jsonb_object_agg_unique_strict_transfn               |
| pg_catalog         | jsonb_object_agg_unique_transfn                      |
| pg_catalog         | jsonb_object_field                                   |
| pg_catalog         | jsonb_object_field_text                              |
| pg_catalog         | jsonb_object_keys                                    |
| pg_catalog         | jsonb_out                                            |
| pg_catalog         | jsonb_path_exists                                    |
| pg_catalog         | jsonb_path_exists_opr                                |
| pg_catalog         | jsonb_path_exists_tz                                 |
| pg_catalog         | jsonb_path_match                                     |
| pg_catalog         | jsonb_path_match_opr                                 |
| pg_catalog         | jsonb_path_match_tz                                  |
| pg_catalog         | jsonb_path_query                                     |
| pg_catalog         | jsonb_path_query_array                               |
| pg_catalog         | jsonb_path_query_array_tz                            |
| pg_catalog         | jsonb_path_query_first                               |
| pg_catalog         | jsonb_path_query_first_tz                            |
| pg_catalog         | jsonb_path_query_tz                                  |
| pg_catalog         | jsonb_populate_record                                |
| pg_catalog         | jsonb_populate_record_valid                          |
| pg_catalog         | jsonb_populate_recordset                             |
| pg_catalog         | jsonb_pretty                                         |
| pg_catalog         | jsonb_recv                                           |
| pg_catalog         | jsonb_send                                           |
| pg_catalog         | jsonb_set                                            |
| pg_catalog         | jsonb_set_lax                                        |
| pg_catalog         | jsonb_strip_nulls                                    |
| pg_catalog         | jsonb_subscript_handler                              |
| pg_catalog         | jsonb_to_record                                      |
| pg_catalog         | jsonb_to_recordset                                   |
| pg_catalog         | jsonb_to_tsvector                                    |
| pg_catalog         | jsonb_to_tsvector                                    |
| pg_catalog         | jsonb_typeof                                         |
| pg_catalog         | jsonpath_in                                          |
| pg_catalog         | jsonpath_out                                         |
| pg_catalog         | jsonpath_recv                                        |
| pg_catalog         | jsonpath_send                                        |
| pg_catalog         | justify_days                                         |
| pg_catalog         | justify_hours                                        |
| pg_catalog         | justify_interval                                     |
| pg_catalog         | koi8r_to_iso                                         |
| pg_catalog         | koi8r_to_mic                                         |
| pg_catalog         | koi8r_to_utf8                                        |
| pg_catalog         | koi8r_to_win1251                                     |
| pg_catalog         | koi8r_to_win866                                      |
| pg_catalog         | koi8u_to_utf8                                        |
| pg_catalog         | lag                                                  |
| pg_catalog         | lag                                                  |
| pg_catalog         | lag                                                  |
| pg_catalog         | language_handler_in                                  |
| pg_catalog         | language_handler_out                                 |
| pg_catalog         | last_value                                           |
| pg_catalog         | lastval                                              |
| pg_catalog         | latin1_to_mic                                        |
| pg_catalog         | latin2_to_mic                                        |
| pg_catalog         | latin2_to_win1250                                    |
| pg_catalog         | latin3_to_mic                                        |
| pg_catalog         | latin4_to_mic                                        |
| pg_catalog         | lcm                                                  |
| pg_catalog         | lcm                                                  |
| pg_catalog         | lcm                                                  |
| pg_catalog         | lead                                                 |
| pg_catalog         | lead                                                 |
| pg_catalog         | lead                                                 |
| pg_catalog         | left                                                 |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | length                                               |
| pg_catalog         | like                                                 |
| pg_catalog         | like                                                 |
| pg_catalog         | like                                                 |
| pg_catalog         | like_escape                                          |
| pg_catalog         | like_escape                                          |
| pg_catalog         | likejoinsel                                          |
| pg_catalog         | likesel                                              |
| pg_catalog         | line                                                 |
| pg_catalog         | line_distance                                        |
| pg_catalog         | line_eq                                              |
| pg_catalog         | line_horizontal                                      |
| pg_catalog         | line_in                                              |
| pg_catalog         | line_interpt                                         |
| pg_catalog         | line_intersect                                       |
| pg_catalog         | line_out                                             |
| pg_catalog         | line_parallel                                        |
| pg_catalog         | line_perp                                            |
| pg_catalog         | line_recv                                            |
| pg_catalog         | line_send                                            |
| pg_catalog         | line_vertical                                        |
| pg_catalog         | ln                                                   |
| pg_catalog         | ln                                                   |
| pg_catalog         | lo_close                                             |
| pg_catalog         | lo_creat                                             |
| pg_catalog         | lo_create                                            |
| pg_catalog         | lo_from_bytea                                        |
| pg_catalog         | lo_get                                               |
| pg_catalog         | lo_get                                               |
| pg_catalog         | lo_lseek                                             |
| pg_catalog         | lo_lseek64                                           |
| pg_catalog         | lo_open                                              |
| pg_catalog         | lo_put                                               |
| pg_catalog         | lo_tell                                              |
| pg_catalog         | lo_tell64                                            |
| pg_catalog         | lo_truncate                                          |
| pg_catalog         | lo_truncate64                                        |
| pg_catalog         | lo_unlink                                            |
| pg_catalog         | log                                                  |
| pg_catalog         | log                                                  |
| pg_catalog         | log                                                  |
| pg_catalog         | log10                                                |
| pg_catalog         | log10                                                |
| pg_catalog         | loread                                               |
| pg_catalog         | lower                                                |
| pg_catalog         | lower                                                |
| pg_catalog         | lower                                                |
| pg_catalog         | lower_inc                                            |
| pg_catalog         | lower_inc                                            |
| pg_catalog         | lower_inf                                            |
| pg_catalog         | lower_inf                                            |
| pg_catalog         | lowrite                                              |
| pg_catalog         | lpad                                                 |
| pg_catalog         | lpad                                                 |
| pg_catalog         | lseg                                                 |
| pg_catalog         | lseg                                                 |
| pg_catalog         | lseg_center                                          |
| pg_catalog         | lseg_distance                                        |
| pg_catalog         | lseg_eq                                              |
| pg_catalog         | lseg_ge                                              |
| pg_catalog         | lseg_gt                                              |
| pg_catalog         | lseg_horizontal                                      |
| pg_catalog         | lseg_in                                              |
| pg_catalog         | lseg_interpt                                         |
| pg_catalog         | lseg_intersect                                       |
| pg_catalog         | lseg_le                                              |
| pg_catalog         | lseg_length                                          |
| pg_catalog         | lseg_lt                                              |
| pg_catalog         | lseg_ne                                              |
| pg_catalog         | lseg_out                                             |
| pg_catalog         | lseg_parallel                                        |
| pg_catalog         | lseg_perp                                            |
| pg_catalog         | lseg_recv                                            |
| pg_catalog         | lseg_send                                            |
| pg_catalog         | lseg_vertical                                        |
| pg_catalog         | ltrim                                                |
| pg_catalog         | ltrim                                                |
| pg_catalog         | ltrim                                                |
| pg_catalog         | macaddr                                              |
| pg_catalog         | macaddr8                                             |
| pg_catalog         | macaddr8_and                                         |
| pg_catalog         | macaddr8_cmp                                         |
| pg_catalog         | macaddr8_eq                                          |
| pg_catalog         | macaddr8_ge                                          |
| pg_catalog         | macaddr8_gt                                          |
| pg_catalog         | macaddr8_in                                          |
| pg_catalog         | macaddr8_le                                          |
| pg_catalog         | macaddr8_lt                                          |
| pg_catalog         | macaddr8_ne                                          |
| pg_catalog         | macaddr8_not                                         |
| pg_catalog         | macaddr8_or                                          |
| pg_catalog         | macaddr8_out                                         |
| pg_catalog         | macaddr8_recv                                        |
| pg_catalog         | macaddr8_send                                        |
| pg_catalog         | macaddr8_set7bit                                     |
| pg_catalog         | macaddr_and                                          |
| pg_catalog         | macaddr_cmp                                          |
| pg_catalog         | macaddr_eq                                           |
| pg_catalog         | macaddr_ge                                           |
| pg_catalog         | macaddr_gt                                           |
| pg_catalog         | macaddr_in                                           |
| pg_catalog         | macaddr_le                                           |
| pg_catalog         | macaddr_lt                                           |
| pg_catalog         | macaddr_ne                                           |
| pg_catalog         | macaddr_not                                          |
| pg_catalog         | macaddr_or                                           |
| pg_catalog         | macaddr_out                                          |
| pg_catalog         | macaddr_recv                                         |
| pg_catalog         | macaddr_send                                         |
| pg_catalog         | macaddr_sortsupport                                  |
| pg_catalog         | make_date                                            |
| pg_catalog         | make_interval                                        |
| pg_catalog         | make_time                                            |
| pg_catalog         | make_timestamp                                       |
| pg_catalog         | make_timestamptz                                     |
| pg_catalog         | make_timestamptz                                     |
| pg_catalog         | makeaclitem                                          |
| pg_catalog         | masklen                                              |
| pg_catalog         | matchingjoinsel                                      |
| pg_catalog         | matchingsel                                          |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | max                                                  |
| pg_catalog         | md5                                                  |
| pg_catalog         | md5                                                  |
| pg_catalog         | mic_to_big5                                          |
| pg_catalog         | mic_to_euc_cn                                        |
| pg_catalog         | mic_to_euc_jp                                        |
| pg_catalog         | mic_to_euc_kr                                        |
| pg_catalog         | mic_to_euc_tw                                        |
| pg_catalog         | mic_to_iso                                           |
| pg_catalog         | mic_to_koi8r                                         |
| pg_catalog         | mic_to_latin1                                        |
| pg_catalog         | mic_to_latin2                                        |
| pg_catalog         | mic_to_latin3                                        |
| pg_catalog         | mic_to_latin4                                        |
| pg_catalog         | mic_to_sjis                                          |
| pg_catalog         | mic_to_win1250                                       |
| pg_catalog         | mic_to_win1251                                       |
| pg_catalog         | mic_to_win866                                        |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min                                                  |
| pg_catalog         | min_scale                                            |
| pg_catalog         | mod                                                  |
| pg_catalog         | mod                                                  |
| pg_catalog         | mod                                                  |
| pg_catalog         | mod                                                  |
| pg_catalog         | mode                                                 |
| pg_catalog         | mode_final                                           |
| pg_catalog         | money                                                |
| pg_catalog         | money                                                |
| pg_catalog         | money                                                |
| pg_catalog         | mul_d_interval                                       |
| pg_catalog         | multirange                                           |
| pg_catalog         | multirange_adjacent_multirange                       |
| pg_catalog         | multirange_adjacent_range                            |
| pg_catalog         | multirange_after_multirange                          |
| pg_catalog         | multirange_after_range                               |
| pg_catalog         | multirange_agg_finalfn                               |
| pg_catalog         | multirange_agg_transfn                               |
| pg_catalog         | multirange_before_multirange                         |
| pg_catalog         | multirange_before_range                              |
| pg_catalog         | multirange_cmp                                       |
| pg_catalog         | multirange_contained_by_multirange                   |
| pg_catalog         | multirange_contained_by_range                        |
| pg_catalog         | multirange_contains_elem                             |
| pg_catalog         | multirange_contains_multirange                       |
| pg_catalog         | multirange_contains_range                            |
| pg_catalog         | multirange_eq                                        |
| pg_catalog         | multirange_ge                                        |
| pg_catalog         | multirange_gist_compress                             |
| pg_catalog         | multirange_gist_consistent                           |
| pg_catalog         | multirange_gt                                        |
| pg_catalog         | multirange_in                                        |
| pg_catalog         | multirange_intersect                                 |
| pg_catalog         | multirange_intersect_agg_transfn                     |
| pg_catalog         | multirange_le                                        |
| pg_catalog         | multirange_lt                                        |
| pg_catalog         | multirange_minus                                     |
| pg_catalog         | multirange_ne                                        |
| pg_catalog         | multirange_out                                       |
| pg_catalog         | multirange_overlaps_multirange                       |
| pg_catalog         | multirange_overlaps_range                            |
| pg_catalog         | multirange_overleft_multirange                       |
| pg_catalog         | multirange_overleft_range                            |
| pg_catalog         | multirange_overright_multirange                      |
| pg_catalog         | multirange_overright_range                           |
| pg_catalog         | multirange_recv                                      |
| pg_catalog         | multirange_send                                      |
| pg_catalog         | multirange_typanalyze                                |
| pg_catalog         | multirange_union                                     |
| pg_catalog         | multirangesel                                        |
| pg_catalog         | mxid_age                                             |
| pg_catalog         | name                                                 |
| pg_catalog         | name                                                 |
| pg_catalog         | name                                                 |
| pg_catalog         | nameconcatoid                                        |
| pg_catalog         | nameeq                                               |
| pg_catalog         | nameeqtext                                           |
| pg_catalog         | namege                                               |
| pg_catalog         | namegetext                                           |
| pg_catalog         | namegt                                               |
| pg_catalog         | namegttext                                           |
| pg_catalog         | nameiclike                                           |
| pg_catalog         | nameicnlike                                          |
| pg_catalog         | nameicregexeq                                        |
| pg_catalog         | nameicregexne                                        |
| pg_catalog         | namein                                               |
| pg_catalog         | namele                                               |
| pg_catalog         | nameletext                                           |
| pg_catalog         | namelike                                             |
| pg_catalog         | namelt                                               |
| pg_catalog         | namelttext                                           |
| pg_catalog         | namene                                               |
| pg_catalog         | namenetext                                           |
| pg_catalog         | namenlike                                            |
| pg_catalog         | nameout                                              |
| pg_catalog         | namerecv                                             |
| pg_catalog         | nameregexeq                                          |
| pg_catalog         | nameregexne                                          |
| pg_catalog         | namesend                                             |
| pg_catalog         | neqjoinsel                                           |
| pg_catalog         | neqsel                                               |
| pg_catalog         | netmask                                              |
| pg_catalog         | network                                              |
| pg_catalog         | network_cmp                                          |
| pg_catalog         | network_eq                                           |
| pg_catalog         | network_ge                                           |
| pg_catalog         | network_gt                                           |
| pg_catalog         | network_larger                                       |
| pg_catalog         | network_le                                           |
| pg_catalog         | network_lt                                           |
| pg_catalog         | network_ne                                           |
| pg_catalog         | network_overlap                                      |
| pg_catalog         | network_smaller                                      |
| pg_catalog         | network_sortsupport                                  |
| pg_catalog         | network_sub                                          |
| pg_catalog         | network_subeq                                        |
| pg_catalog         | network_subset_support                               |
| pg_catalog         | network_sup                                          |
| pg_catalog         | network_supeq                                        |
| pg_catalog         | networkjoinsel                                       |
| pg_catalog         | networksel                                           |
| pg_catalog         | nextval                                              |
| pg_catalog         | nlikejoinsel                                         |
| pg_catalog         | nlikesel                                             |
| pg_catalog         | normalize                                            |
| pg_catalog         | notlike                                              |
| pg_catalog         | notlike                                              |
| pg_catalog         | notlike                                              |
| pg_catalog         | now                                                  |
| pg_catalog         | npoints                                              |
| pg_catalog         | npoints                                              |
| pg_catalog         | nth_value                                            |
| pg_catalog         | ntile                                                |
| pg_catalog         | num_nonnulls                                         |
| pg_catalog         | num_nulls                                            |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric                                              |
| pg_catalog         | numeric_abs                                          |
| pg_catalog         | numeric_accum                                        |
| pg_catalog         | numeric_accum_inv                                    |
| pg_catalog         | numeric_add                                          |
| pg_catalog         | numeric_avg                                          |
| pg_catalog         | numeric_avg_accum                                    |
| pg_catalog         | numeric_avg_combine                                  |
| pg_catalog         | numeric_avg_deserialize                              |
| pg_catalog         | numeric_avg_serialize                                |
| pg_catalog         | numeric_cmp                                          |
| pg_catalog         | numeric_combine                                      |
| pg_catalog         | numeric_deserialize                                  |
| pg_catalog         | numeric_div                                          |
| pg_catalog         | numeric_div_trunc                                    |
| pg_catalog         | numeric_eq                                           |
| pg_catalog         | numeric_exp                                          |
| pg_catalog         | numeric_ge                                           |
| pg_catalog         | numeric_gt                                           |
| pg_catalog         | numeric_in                                           |
| pg_catalog         | numeric_inc                                          |
| pg_catalog         | numeric_larger                                       |
| pg_catalog         | numeric_le                                           |
| pg_catalog         | numeric_ln                                           |
| pg_catalog         | numeric_log                                          |
| pg_catalog         | numeric_lt                                           |
| pg_catalog         | numeric_mod                                          |
| pg_catalog         | numeric_mul                                          |
| pg_catalog         | numeric_ne                                           |
| pg_catalog         | numeric_out                                          |
| pg_catalog         | numeric_pl_pg_lsn                                    |
| pg_catalog         | numeric_poly_avg                                     |
| pg_catalog         | numeric_poly_combine                                 |
| pg_catalog         | numeric_poly_deserialize                             |
| pg_catalog         | numeric_poly_serialize                               |
| pg_catalog         | numeric_poly_stddev_pop                              |
| pg_catalog         | numeric_poly_stddev_samp                             |
| pg_catalog         | numeric_poly_sum                                     |
| pg_catalog         | numeric_poly_var_pop                                 |
| pg_catalog         | numeric_poly_var_samp                                |
| pg_catalog         | numeric_power                                        |
| pg_catalog         | numeric_recv                                         |
| pg_catalog         | numeric_send                                         |
| pg_catalog         | numeric_serialize                                    |
| pg_catalog         | numeric_smaller                                      |
| pg_catalog         | numeric_sortsupport                                  |
| pg_catalog         | numeric_sqrt                                         |
| pg_catalog         | numeric_stddev_pop                                   |
| pg_catalog         | numeric_stddev_samp                                  |
| pg_catalog         | numeric_sub                                          |
| pg_catalog         | numeric_sum                                          |
| pg_catalog         | numeric_support                                      |
| pg_catalog         | numeric_uminus                                       |
| pg_catalog         | numeric_uplus                                        |
| pg_catalog         | numeric_var_pop                                      |
| pg_catalog         | numeric_var_samp                                     |
| pg_catalog         | numerictypmodin                                      |
| pg_catalog         | numerictypmodout                                     |
| pg_catalog         | nummultirange                                        |
| pg_catalog         | nummultirange                                        |
| pg_catalog         | nummultirange                                        |
| pg_catalog         | numnode                                              |
| pg_catalog         | numrange                                             |
| pg_catalog         | numrange                                             |
| pg_catalog         | numrange_subdiff                                     |
| pg_catalog         | obj_description                                      |
| pg_catalog         | obj_description                                      |
| pg_catalog         | octet_length                                         |
| pg_catalog         | octet_length                                         |
| pg_catalog         | octet_length                                         |
| pg_catalog         | octet_length                                         |
| pg_catalog         | oid                                                  |
| pg_catalog         | oideq                                                |
| pg_catalog         | oidge                                                |
| pg_catalog         | oidgt                                                |
| pg_catalog         | oidin                                                |
| pg_catalog         | oidlarger                                            |
| pg_catalog         | oidle                                                |
| pg_catalog         | oidlt                                                |
| pg_catalog         | oidne                                                |
| pg_catalog         | oidout                                               |
| pg_catalog         | oidrecv                                              |
| pg_catalog         | oidsend                                              |
| pg_catalog         | oidsmaller                                           |
| pg_catalog         | oidvectoreq                                          |
| pg_catalog         | oidvectorge                                          |
| pg_catalog         | oidvectorgt                                          |
| pg_catalog         | oidvectorin                                          |
| pg_catalog         | oidvectorle                                          |
| pg_catalog         | oidvectorlt                                          |
| pg_catalog         | oidvectorne                                          |
| pg_catalog         | oidvectorout                                         |
| pg_catalog         | oidvectorrecv                                        |
| pg_catalog         | oidvectorsend                                        |
| pg_catalog         | oidvectortypes                                       |
| pg_catalog         | on_pb                                                |
| pg_catalog         | on_pl                                                |
| pg_catalog         | on_ppath                                             |
| pg_catalog         | on_ps                                                |
| pg_catalog         | on_sb                                                |
| pg_catalog         | on_sl                                                |
| pg_catalog         | ordered_set_transition                               |
| pg_catalog         | ordered_set_transition_multi                         |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlaps                                             |
| pg_catalog         | overlay                                              |
| pg_catalog         | overlay                                              |
| pg_catalog         | overlay                                              |
| pg_catalog         | overlay                                              |
| pg_catalog         | overlay                                              |
| pg_catalog         | overlay                                              |
| pg_catalog         | parse_ident                                          |
| pg_catalog         | path                                                 |
| pg_catalog         | path_add                                             |
| pg_catalog         | path_add_pt                                          |
| pg_catalog         | path_contain_pt                                      |
| pg_catalog         | path_distance                                        |
| pg_catalog         | path_div_pt                                          |
| pg_catalog         | path_in                                              |
| pg_catalog         | path_inter                                           |
| pg_catalog         | path_length                                          |
| pg_catalog         | path_mul_pt                                          |
| pg_catalog         | path_n_eq                                            |
| pg_catalog         | path_n_ge                                            |
| pg_catalog         | path_n_gt                                            |
| pg_catalog         | path_n_le                                            |
| pg_catalog         | path_n_lt                                            |
| pg_catalog         | path_npoints                                         |
| pg_catalog         | path_out                                             |
| pg_catalog         | path_recv                                            |
| pg_catalog         | path_send                                            |
| pg_catalog         | path_sub_pt                                          |
| pg_catalog         | pclose                                               |
| pg_catalog         | percent_rank                                         |
| pg_catalog         | percent_rank                                         |
| pg_catalog         | percent_rank_final                                   |
| pg_catalog         | percentile_cont                                      |
| pg_catalog         | percentile_cont                                      |
| pg_catalog         | percentile_cont                                      |
| pg_catalog         | percentile_cont                                      |
| pg_catalog         | percentile_cont_float8_final                         |
| pg_catalog         | percentile_cont_float8_multi_final                   |
| pg_catalog         | percentile_cont_interval_final                       |
| pg_catalog         | percentile_cont_interval_multi_final                 |
| pg_catalog         | percentile_disc                                      |
| pg_catalog         | percentile_disc                                      |
| pg_catalog         | percentile_disc_final                                |
| pg_catalog         | percentile_disc_multi_final                          |
| pg_catalog         | pg_advisory_lock                                     |
| pg_catalog         | pg_advisory_lock                                     |
| pg_catalog         | pg_advisory_lock_shared                              |
| pg_catalog         | pg_advisory_lock_shared                              |
| pg_catalog         | pg_advisory_unlock                                   |
| pg_catalog         | pg_advisory_unlock                                   |
| pg_catalog         | pg_advisory_unlock_all                               |
| pg_catalog         | pg_advisory_unlock_shared                            |
| pg_catalog         | pg_advisory_unlock_shared                            |
| pg_catalog         | pg_advisory_xact_lock                                |
| pg_catalog         | pg_advisory_xact_lock                                |
| pg_catalog         | pg_advisory_xact_lock_shared                         |
| pg_catalog         | pg_advisory_xact_lock_shared                         |
| pg_catalog         | pg_available_extension_versions                      |
| pg_catalog         | pg_available_extensions                              |
| pg_catalog         | pg_available_wal_summaries                           |
| pg_catalog         | pg_backend_pid                                       |
| pg_catalog         | pg_basetype                                          |
| pg_catalog         | pg_blocking_pids                                     |
| pg_catalog         | pg_cancel_backend                                    |
| pg_catalog         | pg_char_to_encoding                                  |
| pg_catalog         | pg_client_encoding                                   |
| pg_catalog         | pg_collation_actual_version                          |
| pg_catalog         | pg_collation_for                                     |
| pg_catalog         | pg_collation_is_visible                              |
| pg_catalog         | pg_column_compression                                |
| pg_catalog         | pg_column_is_updatable                               |
| pg_catalog         | pg_column_size                                       |
| pg_catalog         | pg_column_toast_chunk_id                             |
| pg_catalog         | pg_conf_load_time                                    |
| pg_catalog         | pg_control_checkpoint                                |
| pg_catalog         | pg_control_init                                      |
| pg_catalog         | pg_control_recovery                                  |
| pg_catalog         | pg_control_system                                    |
| pg_catalog         | pg_conversion_is_visible                             |
| pg_catalog         | pg_copy_logical_replication_slot                     |
| pg_catalog         | pg_copy_logical_replication_slot                     |
| pg_catalog         | pg_copy_logical_replication_slot                     |
| pg_catalog         | pg_copy_physical_replication_slot                    |
| pg_catalog         | pg_copy_physical_replication_slot                    |
| pg_catalog         | pg_create_logical_replication_slot                   |
| pg_catalog         | pg_create_physical_replication_slot                  |
| pg_catalog         | pg_current_logfile                                   |
| pg_catalog         | pg_current_logfile                                   |
| pg_catalog         | pg_current_snapshot                                  |
| pg_catalog         | pg_current_wal_flush_lsn                             |
| pg_catalog         | pg_current_wal_insert_lsn                            |
| pg_catalog         | pg_current_wal_lsn                                   |
| pg_catalog         | pg_current_xact_id                                   |
| pg_catalog         | pg_current_xact_id_if_assigned                       |
| pg_catalog         | pg_cursor                                            |
| pg_catalog         | pg_database_collation_actual_version                 |
| pg_catalog         | pg_database_size                                     |
| pg_catalog         | pg_database_size                                     |
| pg_catalog         | pg_ddl_command_in                                    |
| pg_catalog         | pg_ddl_command_out                                   |
| pg_catalog         | pg_ddl_command_recv                                  |
| pg_catalog         | pg_ddl_command_send                                  |
| pg_catalog         | pg_dependencies_in                                   |
| pg_catalog         | pg_dependencies_out                                  |
| pg_catalog         | pg_dependencies_recv                                 |
| pg_catalog         | pg_dependencies_send                                 |
| pg_catalog         | pg_describe_object                                   |
| pg_catalog         | pg_drop_replication_slot                             |
| pg_catalog         | pg_encoding_max_length                               |
| pg_catalog         | pg_encoding_to_char                                  |
| pg_catalog         | pg_event_trigger_ddl_commands                        |
| pg_catalog         | pg_event_trigger_dropped_objects                     |
| pg_catalog         | pg_event_trigger_table_rewrite_oid                   |
| pg_catalog         | pg_event_trigger_table_rewrite_reason                |
| pg_catalog         | pg_export_snapshot                                   |
| pg_catalog         | pg_extension_config_dump                             |
| pg_catalog         | pg_extension_update_paths                            |
| pg_catalog         | pg_filenode_relation                                 |
| pg_catalog         | pg_function_is_visible                               |
| pg_catalog         | pg_get_backend_memory_contexts                       |
| pg_catalog         | pg_get_catalog_foreign_keys                          |
| pg_catalog         | pg_get_constraintdef                                 |
| pg_catalog         | pg_get_constraintdef                                 |
| pg_catalog         | pg_get_expr                                          |
| pg_catalog         | pg_get_expr                                          |
| pg_catalog         | pg_get_function_arg_default                          |
| pg_catalog         | pg_get_function_arguments                            |
| pg_catalog         | pg_get_function_identity_arguments                   |
| pg_catalog         | pg_get_function_result                               |
| pg_catalog         | pg_get_function_sqlbody                              |
| pg_catalog         | pg_get_functiondef                                   |
| pg_catalog         | pg_get_indexdef                                      |
| pg_catalog         | pg_get_indexdef                                      |
| pg_catalog         | pg_get_keywords                                      |
| pg_catalog         | pg_get_multixact_members                             |
| pg_catalog         | pg_get_object_address                                |
| pg_catalog         | pg_get_partition_constraintdef                       |
| pg_catalog         | pg_get_partkeydef                                    |
| pg_catalog         | pg_get_publication_tables                            |
| pg_catalog         | pg_get_replica_identity_index                        |
| pg_catalog         | pg_get_replication_slots                             |
| pg_catalog         | pg_get_ruledef                                       |
| pg_catalog         | pg_get_ruledef                                       |
| pg_catalog         | pg_get_serial_sequence                               |
| pg_catalog         | pg_get_shmem_allocations                             |
| pg_catalog         | pg_get_statisticsobjdef                              |
| pg_catalog         | pg_get_statisticsobjdef_columns                      |
| pg_catalog         | pg_get_statisticsobjdef_expressions                  |
| pg_catalog         | pg_get_triggerdef                                    |
| pg_catalog         | pg_get_triggerdef                                    |
| pg_catalog         | pg_get_userbyid                                      |
| pg_catalog         | pg_get_viewdef                                       |
| pg_catalog         | pg_get_viewdef                                       |
| pg_catalog         | pg_get_viewdef                                       |
| pg_catalog         | pg_get_viewdef                                       |
| pg_catalog         | pg_get_viewdef                                       |
| pg_catalog         | pg_get_wait_events                                   |
| pg_catalog         | pg_get_wal_replay_pause_state                        |
| pg_catalog         | pg_get_wal_resource_managers                         |
| pg_catalog         | pg_get_wal_summarizer_state                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_has_role                                          |
| pg_catalog         | pg_identify_object                                   |
| pg_catalog         | pg_identify_object_as_address                        |
| pg_catalog         | pg_import_system_collations                          |
| pg_catalog         | pg_index_column_has_property                         |
| pg_catalog         | pg_index_has_property                                |
| pg_catalog         | pg_indexam_has_property                              |
| pg_catalog         | pg_indexam_progress_phasename                        |
| pg_catalog         | pg_indexes_size                                      |
| pg_catalog         | pg_input_error_info                                  |
| pg_catalog         | pg_input_is_valid                                    |
| pg_catalog         | pg_is_in_recovery                                    |
| pg_catalog         | pg_is_other_temp_schema                              |
| pg_catalog         | pg_is_wal_replay_paused                              |
| pg_catalog         | pg_isolation_test_session_is_blocked                 |
| pg_catalog         | pg_jit_available                                     |
| pg_catalog         | pg_last_committed_xact                               |
| pg_catalog         | pg_last_wal_receive_lsn                              |
| pg_catalog         | pg_last_wal_replay_lsn                               |
| pg_catalog         | pg_last_xact_replay_timestamp                        |
| pg_catalog         | pg_listening_channels                                |
| pg_catalog         | pg_lock_status                                       |
| pg_catalog         | pg_logical_emit_message                              |
| pg_catalog         | pg_logical_emit_message                              |
| pg_catalog         | pg_logical_slot_get_binary_changes                   |
| pg_catalog         | pg_logical_slot_get_changes                          |
| pg_catalog         | pg_logical_slot_peek_binary_changes                  |
| pg_catalog         | pg_logical_slot_peek_changes                         |
| pg_catalog         | pg_ls_archive_statusdir                              |
| pg_catalog         | pg_ls_logdir                                         |
| pg_catalog         | pg_ls_logicalmapdir                                  |
| pg_catalog         | pg_ls_logicalsnapdir                                 |
| pg_catalog         | pg_ls_replslotdir                                    |
| pg_catalog         | pg_ls_tmpdir                                         |
| pg_catalog         | pg_ls_tmpdir                                         |
| pg_catalog         | pg_ls_waldir                                         |
| pg_catalog         | pg_lsn                                               |
| pg_catalog         | pg_lsn_cmp                                           |
| pg_catalog         | pg_lsn_eq                                            |
| pg_catalog         | pg_lsn_ge                                            |
| pg_catalog         | pg_lsn_gt                                            |
| pg_catalog         | pg_lsn_hash                                          |
| pg_catalog         | pg_lsn_hash_extended                                 |
| pg_catalog         | pg_lsn_in                                            |
| pg_catalog         | pg_lsn_larger                                        |
| pg_catalog         | pg_lsn_le                                            |
| pg_catalog         | pg_lsn_lt                                            |
| pg_catalog         | pg_lsn_mi                                            |
| pg_catalog         | pg_lsn_mii                                           |
| pg_catalog         | pg_lsn_ne                                            |
| pg_catalog         | pg_lsn_out                                           |
| pg_catalog         | pg_lsn_pli                                           |
| pg_catalog         | pg_lsn_recv                                          |
| pg_catalog         | pg_lsn_send                                          |
| pg_catalog         | pg_lsn_smaller                                       |
| pg_catalog         | pg_mcv_list_in                                       |
| pg_catalog         | pg_mcv_list_items                                    |
| pg_catalog         | pg_mcv_list_out                                      |
| pg_catalog         | pg_mcv_list_recv                                     |
| pg_catalog         | pg_mcv_list_send                                     |
| pg_catalog         | pg_my_temp_schema                                    |
| pg_catalog         | pg_ndistinct_in                                      |
| pg_catalog         | pg_ndistinct_out                                     |
| pg_catalog         | pg_ndistinct_recv                                    |
| pg_catalog         | pg_ndistinct_send                                    |
| pg_catalog         | pg_nextoid                                           |
| pg_catalog         | pg_node_tree_in                                      |
| pg_catalog         | pg_node_tree_out                                     |
| pg_catalog         | pg_node_tree_recv                                    |
| pg_catalog         | pg_node_tree_send                                    |
| pg_catalog         | pg_notification_queue_usage                          |
| pg_catalog         | pg_notify                                            |
| pg_catalog         | pg_opclass_is_visible                                |
| pg_catalog         | pg_operator_is_visible                               |
| pg_catalog         | pg_opfamily_is_visible                               |
| pg_catalog         | pg_options_to_table                                  |
| pg_catalog         | pg_partition_ancestors                               |
| pg_catalog         | pg_partition_root                                    |
| pg_catalog         | pg_partition_tree                                    |
| pg_catalog         | pg_postmaster_start_time                             |
| pg_catalog         | pg_prepared_statement                                |
| pg_catalog         | pg_prepared_xact                                     |
| pg_catalog         | pg_relation_filenode                                 |
| pg_catalog         | pg_relation_filepath                                 |
| pg_catalog         | pg_relation_is_publishable                           |
| pg_catalog         | pg_relation_is_updatable                             |
| pg_catalog         | pg_relation_size                                     |
| pg_catalog         | pg_relation_size                                     |
| pg_catalog         | pg_reload_conf                                       |
| pg_catalog         | pg_replication_slot_advance                          |
| pg_catalog         | pg_safe_snapshot_blocking_pids                       |
| pg_catalog         | pg_sequence_last_value                               |
| pg_catalog         | pg_sequence_parameters                               |
| pg_catalog         | pg_settings_get_flags                                |
| pg_catalog         | pg_show_all_settings                                 |
| pg_catalog         | pg_size_bytes                                        |
| pg_catalog         | pg_size_pretty                                       |
| pg_catalog         | pg_size_pretty                                       |
| pg_catalog         | pg_sleep                                             |
| pg_catalog         | pg_sleep_for                                         |
| pg_catalog         | pg_sleep_until                                       |
| pg_catalog         | pg_snapshot_in                                       |
| pg_catalog         | pg_snapshot_out                                      |
| pg_catalog         | pg_snapshot_recv                                     |
| pg_catalog         | pg_snapshot_send                                     |
| pg_catalog         | pg_snapshot_xip                                      |
| pg_catalog         | pg_snapshot_xmax                                     |
| pg_catalog         | pg_snapshot_xmin                                     |
| pg_catalog         | pg_split_walfile_name                                |
| pg_catalog         | pg_stat_clear_snapshot                               |
| pg_catalog         | pg_stat_force_next_flush                             |
| pg_catalog         | pg_stat_get_activity                                 |
| pg_catalog         | pg_stat_get_analyze_count                            |
| pg_catalog         | pg_stat_get_archiver                                 |
| pg_catalog         | pg_stat_get_autoanalyze_count                        |
| pg_catalog         | pg_stat_get_autovacuum_count                         |
| pg_catalog         | pg_stat_get_backend_activity                         |
| pg_catalog         | pg_stat_get_backend_activity_start                   |
| pg_catalog         | pg_stat_get_backend_client_addr                      |
| pg_catalog         | pg_stat_get_backend_client_port                      |
| pg_catalog         | pg_stat_get_backend_dbid                             |
| pg_catalog         | pg_stat_get_backend_idset                            |
| pg_catalog         | pg_stat_get_backend_pid                              |
| pg_catalog         | pg_stat_get_backend_start                            |
| pg_catalog         | pg_stat_get_backend_subxact                          |
| pg_catalog         | pg_stat_get_backend_userid                           |
| pg_catalog         | pg_stat_get_backend_wait_event                       |
| pg_catalog         | pg_stat_get_backend_wait_event_type                  |
| pg_catalog         | pg_stat_get_backend_xact_start                       |
| pg_catalog         | pg_stat_get_bgwriter_buf_written_clean               |
| pg_catalog         | pg_stat_get_bgwriter_maxwritten_clean                |
| pg_catalog         | pg_stat_get_bgwriter_stat_reset_time                 |
| pg_catalog         | pg_stat_get_blocks_fetched                           |
| pg_catalog         | pg_stat_get_blocks_hit                               |
| pg_catalog         | pg_stat_get_buf_alloc                                |
| pg_catalog         | pg_stat_get_checkpointer_buffers_written             |
| pg_catalog         | pg_stat_get_checkpointer_num_requested               |
| pg_catalog         | pg_stat_get_checkpointer_num_timed                   |
| pg_catalog         | pg_stat_get_checkpointer_restartpoints_performed     |
| pg_catalog         | pg_stat_get_checkpointer_restartpoints_requested     |
| pg_catalog         | pg_stat_get_checkpointer_restartpoints_timed         |
| pg_catalog         | pg_stat_get_checkpointer_stat_reset_time             |
| pg_catalog         | pg_stat_get_checkpointer_sync_time                   |
| pg_catalog         | pg_stat_get_checkpointer_write_time                  |
| pg_catalog         | pg_stat_get_db_active_time                           |
| pg_catalog         | pg_stat_get_db_blk_read_time                         |
| pg_catalog         | pg_stat_get_db_blk_write_time                        |
| pg_catalog         | pg_stat_get_db_blocks_fetched                        |
| pg_catalog         | pg_stat_get_db_blocks_hit                            |
| pg_catalog         | pg_stat_get_db_checksum_failures                     |
| pg_catalog         | pg_stat_get_db_checksum_last_failure                 |
| pg_catalog         | pg_stat_get_db_conflict_all                          |
| pg_catalog         | pg_stat_get_db_conflict_bufferpin                    |
| pg_catalog         | pg_stat_get_db_conflict_lock                         |
| pg_catalog         | pg_stat_get_db_conflict_logicalslot                  |
| pg_catalog         | pg_stat_get_db_conflict_snapshot                     |
| pg_catalog         | pg_stat_get_db_conflict_startup_deadlock             |
| pg_catalog         | pg_stat_get_db_conflict_tablespace                   |
| pg_catalog         | pg_stat_get_db_deadlocks                             |
| pg_catalog         | pg_stat_get_db_idle_in_transaction_time              |
| pg_catalog         | pg_stat_get_db_numbackends                           |
| pg_catalog         | pg_stat_get_db_session_time                          |
| pg_catalog         | pg_stat_get_db_sessions                              |
| pg_catalog         | pg_stat_get_db_sessions_abandoned                    |
| pg_catalog         | pg_stat_get_db_sessions_fatal                        |
| pg_catalog         | pg_stat_get_db_sessions_killed                       |
| pg_catalog         | pg_stat_get_db_stat_reset_time                       |
| pg_catalog         | pg_stat_get_db_temp_bytes                            |
| pg_catalog         | pg_stat_get_db_temp_files                            |
| pg_catalog         | pg_stat_get_db_tuples_deleted                        |
| pg_catalog         | pg_stat_get_db_tuples_fetched                        |
| pg_catalog         | pg_stat_get_db_tuples_inserted                       |
| pg_catalog         | pg_stat_get_db_tuples_returned                       |
| pg_catalog         | pg_stat_get_db_tuples_updated                        |
| pg_catalog         | pg_stat_get_db_xact_commit                           |
| pg_catalog         | pg_stat_get_db_xact_rollback                         |
| pg_catalog         | pg_stat_get_dead_tuples                              |
| pg_catalog         | pg_stat_get_function_calls                           |
| pg_catalog         | pg_stat_get_function_self_time                       |
| pg_catalog         | pg_stat_get_function_total_time                      |
| pg_catalog         | pg_stat_get_ins_since_vacuum                         |
| pg_catalog         | pg_stat_get_io                                       |
| pg_catalog         | pg_stat_get_last_analyze_time                        |
| pg_catalog         | pg_stat_get_last_autoanalyze_time                    |
| pg_catalog         | pg_stat_get_last_autovacuum_time                     |
| pg_catalog         | pg_stat_get_last_vacuum_time                         |
| pg_catalog         | pg_stat_get_lastscan                                 |
| pg_catalog         | pg_stat_get_live_tuples                              |
| pg_catalog         | pg_stat_get_mod_since_analyze                        |
| pg_catalog         | pg_stat_get_numscans                                 |
| pg_catalog         | pg_stat_get_progress_info                            |
| pg_catalog         | pg_stat_get_recovery_prefetch                        |
| pg_catalog         | pg_stat_get_replication_slot                         |
| pg_catalog         | pg_stat_get_slru                                     |
| pg_catalog         | pg_stat_get_snapshot_timestamp                       |
| pg_catalog         | pg_stat_get_subscription                             |
| pg_catalog         | pg_stat_get_subscription_stats                       |
| pg_catalog         | pg_stat_get_tuples_deleted                           |
| pg_catalog         | pg_stat_get_tuples_fetched                           |
| pg_catalog         | pg_stat_get_tuples_hot_updated                       |
| pg_catalog         | pg_stat_get_tuples_inserted                          |
| pg_catalog         | pg_stat_get_tuples_newpage_updated                   |
| pg_catalog         | pg_stat_get_tuples_returned                          |
| pg_catalog         | pg_stat_get_tuples_updated                           |
| pg_catalog         | pg_stat_get_vacuum_count                             |
| pg_catalog         | pg_stat_get_wal                                      |
| pg_catalog         | pg_stat_get_wal_receiver                             |
| pg_catalog         | pg_stat_get_wal_senders                              |
| pg_catalog         | pg_stat_get_xact_blocks_fetched                      |
| pg_catalog         | pg_stat_get_xact_blocks_hit                          |
| pg_catalog         | pg_stat_get_xact_function_calls                      |
| pg_catalog         | pg_stat_get_xact_function_self_time                  |
| pg_catalog         | pg_stat_get_xact_function_total_time                 |
| pg_catalog         | pg_stat_get_xact_numscans                            |
| pg_catalog         | pg_stat_get_xact_tuples_deleted                      |
| pg_catalog         | pg_stat_get_xact_tuples_fetched                      |
| pg_catalog         | pg_stat_get_xact_tuples_hot_updated                  |
| pg_catalog         | pg_stat_get_xact_tuples_inserted                     |
| pg_catalog         | pg_stat_get_xact_tuples_newpage_updated              |
| pg_catalog         | pg_stat_get_xact_tuples_returned                     |
| pg_catalog         | pg_stat_get_xact_tuples_updated                      |
| pg_catalog         | pg_statistics_obj_is_visible                         |
| pg_catalog         | pg_stop_making_pinned_objects                        |
| pg_catalog         | pg_sync_replication_slots                            |
| pg_catalog         | pg_table_is_visible                                  |
| pg_catalog         | pg_table_size                                        |
| pg_catalog         | pg_tablespace_databases                              |
| pg_catalog         | pg_tablespace_location                               |
| pg_catalog         | pg_tablespace_size                                   |
| pg_catalog         | pg_tablespace_size                                   |
| pg_catalog         | pg_terminate_backend                                 |
| pg_catalog         | pg_timezone_abbrevs                                  |
| pg_catalog         | pg_timezone_names                                    |
| pg_catalog         | pg_total_relation_size                               |
| pg_catalog         | pg_trigger_depth                                     |
| pg_catalog         | pg_try_advisory_lock                                 |
| pg_catalog         | pg_try_advisory_lock                                 |
| pg_catalog         | pg_try_advisory_lock_shared                          |
| pg_catalog         | pg_try_advisory_lock_shared                          |
| pg_catalog         | pg_try_advisory_xact_lock                            |
| pg_catalog         | pg_try_advisory_xact_lock                            |
| pg_catalog         | pg_try_advisory_xact_lock_shared                     |
| pg_catalog         | pg_try_advisory_xact_lock_shared                     |
| pg_catalog         | pg_ts_config_is_visible                              |
| pg_catalog         | pg_ts_dict_is_visible                                |
| pg_catalog         | pg_ts_parser_is_visible                              |
| pg_catalog         | pg_ts_template_is_visible                            |
| pg_catalog         | pg_type_is_visible                                   |
| pg_catalog         | pg_typeof                                            |
| pg_catalog         | pg_visible_in_snapshot                               |
| pg_catalog         | pg_wal_lsn_diff                                      |
| pg_catalog         | pg_wal_summary_contents                              |
| pg_catalog         | pg_walfile_name                                      |
| pg_catalog         | pg_walfile_name_offset                               |
| pg_catalog         | pg_xact_commit_timestamp                             |
| pg_catalog         | pg_xact_commit_timestamp_origin                      |
| pg_catalog         | pg_xact_status                                       |
| pg_catalog         | phraseto_tsquery                                     |
| pg_catalog         | phraseto_tsquery                                     |
| pg_catalog         | pi                                                   |
| pg_catalog         | plainto_tsquery                                      |
| pg_catalog         | plainto_tsquery                                      |
| pg_catalog         | plpgsql_call_handler                                 |
| pg_catalog         | plpgsql_inline_handler                               |
| pg_catalog         | plpgsql_validator                                    |
| pg_catalog         | point                                                |
| pg_catalog         | point                                                |
| pg_catalog         | point                                                |
| pg_catalog         | point                                                |
| pg_catalog         | point                                                |
| pg_catalog         | point_above                                          |
| pg_catalog         | point_add                                            |
| pg_catalog         | point_below                                          |
| pg_catalog         | point_distance                                       |
| pg_catalog         | point_div                                            |
| pg_catalog         | point_eq                                             |
| pg_catalog         | point_horiz                                          |
| pg_catalog         | point_in                                             |
| pg_catalog         | point_left                                           |
| pg_catalog         | point_mul                                            |
| pg_catalog         | point_ne                                             |
| pg_catalog         | point_out                                            |
| pg_catalog         | point_recv                                           |
| pg_catalog         | point_right                                          |
| pg_catalog         | point_send                                           |
| pg_catalog         | point_sub                                            |
| pg_catalog         | point_vert                                           |
| pg_catalog         | poly_above                                           |
| pg_catalog         | poly_below                                           |
| pg_catalog         | poly_center                                          |
| pg_catalog         | poly_contain                                         |
| pg_catalog         | poly_contain_pt                                      |
| pg_catalog         | poly_contained                                       |
| pg_catalog         | poly_distance                                        |
| pg_catalog         | poly_in                                              |
| pg_catalog         | poly_left                                            |
| pg_catalog         | poly_npoints                                         |
| pg_catalog         | poly_out                                             |
| pg_catalog         | poly_overabove                                       |
| pg_catalog         | poly_overbelow                                       |
| pg_catalog         | poly_overlap                                         |
| pg_catalog         | poly_overleft                                        |
| pg_catalog         | poly_overright                                       |
| pg_catalog         | poly_recv                                            |
| pg_catalog         | poly_right                                           |
| pg_catalog         | poly_same                                            |
| pg_catalog         | poly_send                                            |
| pg_catalog         | polygon                                              |
| pg_catalog         | polygon                                              |
| pg_catalog         | polygon                                              |
| pg_catalog         | polygon                                              |
| pg_catalog         | popen                                                |
| pg_catalog         | position                                             |
| pg_catalog         | position                                             |
| pg_catalog         | position                                             |
| pg_catalog         | positionjoinsel                                      |
| pg_catalog         | positionsel                                          |
| pg_catalog         | postgresql_fdw_validator                             |
| pg_catalog         | pow                                                  |
| pg_catalog         | pow                                                  |
| pg_catalog         | power                                                |
| pg_catalog         | power                                                |
| pg_catalog         | prefixjoinsel                                        |
| pg_catalog         | prefixsel                                            |
| pg_catalog         | prsd_end                                             |
| pg_catalog         | prsd_headline                                        |
| pg_catalog         | prsd_lextype                                         |
| pg_catalog         | prsd_nexttoken                                       |
| pg_catalog         | prsd_start                                           |
| pg_catalog         | pt_contained_circle                                  |
| pg_catalog         | pt_contained_poly                                    |
| pg_catalog         | query_to_xml                                         |
| pg_catalog         | query_to_xml_and_xmlschema                           |
| pg_catalog         | query_to_xmlschema                                   |
| pg_catalog         | querytree                                            |
| pg_catalog         | quote_ident                                          |
| pg_catalog         | quote_literal                                        |
| pg_catalog         | quote_literal                                        |
| pg_catalog         | quote_nullable                                       |
| pg_catalog         | quote_nullable                                       |
| pg_catalog         | radians                                              |
| pg_catalog         | radius                                               |
| pg_catalog         | random                                               |
| pg_catalog         | random                                               |
| pg_catalog         | random                                               |
| pg_catalog         | random                                               |
| pg_catalog         | random_normal                                        |
| pg_catalog         | range_adjacent                                       |
| pg_catalog         | range_adjacent_multirange                            |
| pg_catalog         | range_after                                          |
| pg_catalog         | range_after_multirange                               |
| pg_catalog         | range_agg                                            |
| pg_catalog         | range_agg                                            |
| pg_catalog         | range_agg_finalfn                                    |
| pg_catalog         | range_agg_transfn                                    |
| pg_catalog         | range_before                                         |
| pg_catalog         | range_before_multirange                              |
| pg_catalog         | range_cmp                                            |
| pg_catalog         | range_contained_by                                   |
| pg_catalog         | range_contained_by_multirange                        |
| pg_catalog         | range_contains                                       |
| pg_catalog         | range_contains_elem                                  |
| pg_catalog         | range_contains_elem_support                          |
| pg_catalog         | range_contains_multirange                            |
| pg_catalog         | range_eq                                             |
| pg_catalog         | range_ge                                             |
| pg_catalog         | range_gist_consistent                                |
| pg_catalog         | range_gist_penalty                                   |
| pg_catalog         | range_gist_picksplit                                 |
| pg_catalog         | range_gist_same                                      |
| pg_catalog         | range_gist_union                                     |
| pg_catalog         | range_gt                                             |
| pg_catalog         | range_in                                             |
| pg_catalog         | range_intersect                                      |
| pg_catalog         | range_intersect_agg                                  |
| pg_catalog         | range_intersect_agg                                  |
| pg_catalog         | range_intersect_agg_transfn                          |
| pg_catalog         | range_le                                             |
| pg_catalog         | range_lt                                             |
| pg_catalog         | range_merge                                          |
| pg_catalog         | range_merge                                          |
| pg_catalog         | range_minus                                          |
| pg_catalog         | range_ne                                             |
| pg_catalog         | range_out                                            |
| pg_catalog         | range_overlaps                                       |
| pg_catalog         | range_overlaps_multirange                            |
| pg_catalog         | range_overleft                                       |
| pg_catalog         | range_overleft_multirange                            |
| pg_catalog         | range_overright                                      |
| pg_catalog         | range_overright_multirange                           |
| pg_catalog         | range_recv                                           |
| pg_catalog         | range_send                                           |
| pg_catalog         | range_typanalyze                                     |
| pg_catalog         | range_union                                          |
| pg_catalog         | rangesel                                             |
| pg_catalog         | rank                                                 |
| pg_catalog         | rank                                                 |
| pg_catalog         | rank_final                                           |
| pg_catalog         | raw_array_subscript_handler                          |
| pg_catalog         | record_eq                                            |
| pg_catalog         | record_ge                                            |
| pg_catalog         | record_gt                                            |
| pg_catalog         | record_image_eq                                      |
| pg_catalog         | record_image_ge                                      |
| pg_catalog         | record_image_gt                                      |
| pg_catalog         | record_image_le                                      |
| pg_catalog         | record_image_lt                                      |
| pg_catalog         | record_image_ne                                      |
| pg_catalog         | record_in                                            |
| pg_catalog         | record_le                                            |
| pg_catalog         | record_lt                                            |
| pg_catalog         | record_ne                                            |
| pg_catalog         | record_out                                           |
| pg_catalog         | record_recv                                          |
| pg_catalog         | record_send                                          |
| pg_catalog         | regclass                                             |
| pg_catalog         | regclassin                                           |
| pg_catalog         | regclassout                                          |
| pg_catalog         | regclassrecv                                         |
| pg_catalog         | regclasssend                                         |
| pg_catalog         | regcollationin                                       |
| pg_catalog         | regcollationout                                      |
| pg_catalog         | regcollationrecv                                     |
| pg_catalog         | regcollationsend                                     |
| pg_catalog         | regconfigin                                          |
| pg_catalog         | regconfigout                                         |
| pg_catalog         | regconfigrecv                                        |
| pg_catalog         | regconfigsend                                        |
| pg_catalog         | regdictionaryin                                      |
| pg_catalog         | regdictionaryout                                     |
| pg_catalog         | regdictionaryrecv                                    |
| pg_catalog         | regdictionarysend                                    |
| pg_catalog         | regexeqjoinsel                                       |
| pg_catalog         | regexeqsel                                           |
| pg_catalog         | regexnejoinsel                                       |
| pg_catalog         | regexnesel                                           |
| pg_catalog         | regexp_count                                         |
| pg_catalog         | regexp_count                                         |
| pg_catalog         | regexp_count                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_instr                                         |
| pg_catalog         | regexp_like                                          |
| pg_catalog         | regexp_like                                          |
| pg_catalog         | regexp_match                                         |
| pg_catalog         | regexp_match                                         |
| pg_catalog         | regexp_matches                                       |
| pg_catalog         | regexp_matches                                       |
| pg_catalog         | regexp_replace                                       |
| pg_catalog         | regexp_replace                                       |
| pg_catalog         | regexp_replace                                       |
| pg_catalog         | regexp_replace                                       |
| pg_catalog         | regexp_replace                                       |
| pg_catalog         | regexp_split_to_array                                |
| pg_catalog         | regexp_split_to_array                                |
| pg_catalog         | regexp_split_to_table                                |
| pg_catalog         | regexp_split_to_table                                |
| pg_catalog         | regexp_substr                                        |
| pg_catalog         | regexp_substr                                        |
| pg_catalog         | regexp_substr                                        |
| pg_catalog         | regexp_substr                                        |
| pg_catalog         | regexp_substr                                        |
| pg_catalog         | regnamespacein                                       |
| pg_catalog         | regnamespaceout                                      |
| pg_catalog         | regnamespacerecv                                     |
| pg_catalog         | regnamespacesend                                     |
| pg_catalog         | regoperatorin                                        |
| pg_catalog         | regoperatorout                                       |
| pg_catalog         | regoperatorrecv                                      |
| pg_catalog         | regoperatorsend                                      |
| pg_catalog         | regoperin                                            |
| pg_catalog         | regoperout                                           |
| pg_catalog         | regoperrecv                                          |
| pg_catalog         | regopersend                                          |
| pg_catalog         | regprocedurein                                       |
| pg_catalog         | regprocedureout                                      |
| pg_catalog         | regprocedurerecv                                     |
| pg_catalog         | regproceduresend                                     |
| pg_catalog         | regprocin                                            |
| pg_catalog         | regprocout                                           |
| pg_catalog         | regprocrecv                                          |
| pg_catalog         | regprocsend                                          |
| pg_catalog         | regr_avgx                                            |
| pg_catalog         | regr_avgy                                            |
| pg_catalog         | regr_count                                           |
| pg_catalog         | regr_intercept                                       |
| pg_catalog         | regr_r2                                              |
| pg_catalog         | regr_slope                                           |
| pg_catalog         | regr_sxx                                             |
| pg_catalog         | regr_sxy                                             |
| pg_catalog         | regr_syy                                             |
| pg_catalog         | regrolein                                            |
| pg_catalog         | regroleout                                           |
| pg_catalog         | regrolerecv                                          |
| pg_catalog         | regrolesend                                          |
| pg_catalog         | regtypein                                            |
| pg_catalog         | regtypeout                                           |
| pg_catalog         | regtyperecv                                          |
| pg_catalog         | regtypesend                                          |
| pg_catalog         | repeat                                               |
| pg_catalog         | replace                                              |
| pg_catalog         | reverse                                              |
| pg_catalog         | right                                                |
| pg_catalog         | round                                                |
| pg_catalog         | round                                                |
| pg_catalog         | round                                                |
| pg_catalog         | row_number                                           |
| pg_catalog         | row_security_active                                  |
| pg_catalog         | row_security_active                                  |
| pg_catalog         | row_to_json                                          |
| pg_catalog         | row_to_json                                          |
| pg_catalog         | rpad                                                 |
| pg_catalog         | rpad                                                 |
| pg_catalog         | rtrim                                                |
| pg_catalog         | rtrim                                                |
| pg_catalog         | rtrim                                                |
| pg_catalog         | satisfies_hash_partition                             |
| pg_catalog         | scalargejoinsel                                      |
| pg_catalog         | scalargesel                                          |
| pg_catalog         | scalargtjoinsel                                      |
| pg_catalog         | scalargtsel                                          |
| pg_catalog         | scalarlejoinsel                                      |
| pg_catalog         | scalarlesel                                          |
| pg_catalog         | scalarltjoinsel                                      |
| pg_catalog         | scalarltsel                                          |
| pg_catalog         | scale                                                |
| pg_catalog         | schema_to_xml                                        |
| pg_catalog         | schema_to_xml_and_xmlschema                          |
| pg_catalog         | schema_to_xmlschema                                  |
| pg_catalog         | session_user                                         |
| pg_catalog         | set_bit                                              |
| pg_catalog         | set_bit                                              |
| pg_catalog         | set_byte                                             |
| pg_catalog         | set_config                                           |
| pg_catalog         | set_masklen                                          |
| pg_catalog         | set_masklen                                          |
| pg_catalog         | setseed                                              |
| pg_catalog         | setval                                               |
| pg_catalog         | setval                                               |
| pg_catalog         | setweight                                            |
| pg_catalog         | setweight                                            |
| pg_catalog         | sha224                                               |
| pg_catalog         | sha256                                               |
| pg_catalog         | sha384                                               |
| pg_catalog         | sha512                                               |
| pg_catalog         | shell_in                                             |
| pg_catalog         | shell_out                                            |
| pg_catalog         | shift_jis_2004_to_euc_jis_2004                       |
| pg_catalog         | shift_jis_2004_to_utf8                               |
| pg_catalog         | shobj_description                                    |
| pg_catalog         | sign                                                 |
| pg_catalog         | sign                                                 |
| pg_catalog         | similar_escape                                       |
| pg_catalog         | similar_to_escape                                    |
| pg_catalog         | similar_to_escape                                    |
| pg_catalog         | sin                                                  |
| pg_catalog         | sind                                                 |
| pg_catalog         | sinh                                                 |
| pg_catalog         | sjis_to_euc_jp                                       |
| pg_catalog         | sjis_to_mic                                          |
| pg_catalog         | sjis_to_utf8                                         |
| pg_catalog         | slope                                                |
| pg_catalog         | spg_bbox_quad_config                                 |
| pg_catalog         | spg_box_quad_choose                                  |
| pg_catalog         | spg_box_quad_config                                  |
| pg_catalog         | spg_box_quad_inner_consistent                        |
| pg_catalog         | spg_box_quad_leaf_consistent                         |
| pg_catalog         | spg_box_quad_picksplit                               |
| pg_catalog         | spg_kd_choose                                        |
| pg_catalog         | spg_kd_config                                        |
| pg_catalog         | spg_kd_inner_consistent                              |
| pg_catalog         | spg_kd_picksplit                                     |
| pg_catalog         | spg_poly_quad_compress                               |
| pg_catalog         | spg_quad_choose                                      |
| pg_catalog         | spg_quad_config                                      |
| pg_catalog         | spg_quad_inner_consistent                            |
| pg_catalog         | spg_quad_leaf_consistent                             |
| pg_catalog         | spg_quad_picksplit                                   |
| pg_catalog         | spg_range_quad_choose                                |
| pg_catalog         | spg_range_quad_config                                |
| pg_catalog         | spg_range_quad_inner_consistent                      |
| pg_catalog         | spg_range_quad_leaf_consistent                       |
| pg_catalog         | spg_range_quad_picksplit                             |
| pg_catalog         | spg_text_choose                                      |
| pg_catalog         | spg_text_config                                      |
| pg_catalog         | spg_text_inner_consistent                            |
| pg_catalog         | spg_text_leaf_consistent                             |
| pg_catalog         | spg_text_picksplit                                   |
| pg_catalog         | spghandler                                           |
| pg_catalog         | split_part                                           |
| pg_catalog         | sqrt                                                 |
| pg_catalog         | sqrt                                                 |
| pg_catalog         | starts_with                                          |
| pg_catalog         | statement_timestamp                                  |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev                                               |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_pop                                           |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | stddev_samp                                          |
| pg_catalog         | string_agg                                           |
| pg_catalog         | string_agg                                           |
| pg_catalog         | string_agg_combine                                   |
| pg_catalog         | string_agg_deserialize                               |
| pg_catalog         | string_agg_finalfn                                   |
| pg_catalog         | string_agg_serialize                                 |
| pg_catalog         | string_agg_transfn                                   |
| pg_catalog         | string_to_array                                      |
| pg_catalog         | string_to_array                                      |
| pg_catalog         | string_to_table                                      |
| pg_catalog         | string_to_table                                      |
| pg_catalog         | strip                                                |
| pg_catalog         | strpos                                               |
| pg_catalog         | substr                                               |
| pg_catalog         | substr                                               |
| pg_catalog         | substr                                               |
| pg_catalog         | substr                                               |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | substring                                            |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | sum                                                  |
| pg_catalog         | suppress_redundant_updates_trigger                   |
| pg_catalog         | system                                               |
| pg_catalog         | system_user                                          |
| pg_catalog         | table_am_handler_in                                  |
| pg_catalog         | table_am_handler_out                                 |
| pg_catalog         | table_to_xml                                         |
| pg_catalog         | table_to_xml_and_xmlschema                           |
| pg_catalog         | table_to_xmlschema                                   |
| pg_catalog         | tan                                                  |
| pg_catalog         | tand                                                 |
| pg_catalog         | tanh                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text                                                 |
| pg_catalog         | text_ge                                              |
| pg_catalog         | text_gt                                              |
| pg_catalog         | text_larger                                          |
| pg_catalog         | text_le                                              |
| pg_catalog         | text_lt                                              |
| pg_catalog         | text_pattern_ge                                      |
| pg_catalog         | text_pattern_gt                                      |
| pg_catalog         | text_pattern_le                                      |
| pg_catalog         | text_pattern_lt                                      |
| pg_catalog         | text_smaller                                         |
| pg_catalog         | text_starts_with_support                             |
| pg_catalog         | textanycat                                           |
| pg_catalog         | textcat                                              |
| pg_catalog         | texteq                                               |
| pg_catalog         | texteqname                                           |
| pg_catalog         | textgename                                           |
| pg_catalog         | textgtname                                           |
| pg_catalog         | texticlike                                           |
| pg_catalog         | texticlike_support                                   |
| pg_catalog         | texticnlike                                          |
| pg_catalog         | texticregexeq                                        |
| pg_catalog         | texticregexeq_support                                |
| pg_catalog         | texticregexne                                        |
| pg_catalog         | textin                                               |
| pg_catalog         | textlen                                              |
| pg_catalog         | textlename                                           |
| pg_catalog         | textlike                                             |
| pg_catalog         | textlike_support                                     |
| pg_catalog         | textltname                                           |
| pg_catalog         | textne                                               |
| pg_catalog         | textnename                                           |
| pg_catalog         | textnlike                                            |
| pg_catalog         | textout                                              |
| pg_catalog         | textrecv                                             |
| pg_catalog         | textregexeq                                          |
| pg_catalog         | textregexeq_support                                  |
| pg_catalog         | textregexne                                          |
| pg_catalog         | textsend                                             |
| pg_catalog         | thesaurus_init                                       |
| pg_catalog         | thesaurus_lexize                                     |
| pg_catalog         | tideq                                                |
| pg_catalog         | tidge                                                |
| pg_catalog         | tidgt                                                |
| pg_catalog         | tidin                                                |
| pg_catalog         | tidlarger                                            |
| pg_catalog         | tidle                                                |
| pg_catalog         | tidlt                                                |
| pg_catalog         | tidne                                                |
| pg_catalog         | tidout                                               |
| pg_catalog         | tidrecv                                              |
| pg_catalog         | tidsend                                              |
| pg_catalog         | tidsmaller                                           |
| pg_catalog         | time                                                 |
| pg_catalog         | time                                                 |
| pg_catalog         | time                                                 |
| pg_catalog         | time                                                 |
| pg_catalog         | time                                                 |
| pg_catalog         | time_cmp                                             |
| pg_catalog         | time_eq                                              |
| pg_catalog         | time_ge                                              |
| pg_catalog         | time_gt                                              |
| pg_catalog         | time_hash                                            |
| pg_catalog         | time_hash_extended                                   |
| pg_catalog         | time_in                                              |
| pg_catalog         | time_larger                                          |
| pg_catalog         | time_le                                              |
| pg_catalog         | time_lt                                              |
| pg_catalog         | time_mi_interval                                     |
| pg_catalog         | time_mi_time                                         |
| pg_catalog         | time_ne                                              |
| pg_catalog         | time_out                                             |
| pg_catalog         | time_pl_interval                                     |
| pg_catalog         | time_recv                                            |
| pg_catalog         | time_send                                            |
| pg_catalog         | time_smaller                                         |
| pg_catalog         | time_support                                         |
| pg_catalog         | timedate_pl                                          |
| pg_catalog         | timeofday                                            |
| pg_catalog         | timestamp                                            |
| pg_catalog         | timestamp                                            |
| pg_catalog         | timestamp                                            |
| pg_catalog         | timestamp                                            |
| pg_catalog         | timestamp_cmp                                        |
| pg_catalog         | timestamp_cmp_date                                   |
| pg_catalog         | timestamp_cmp_timestamptz                            |
| pg_catalog         | timestamp_eq                                         |
| pg_catalog         | timestamp_eq_date                                    |
| pg_catalog         | timestamp_eq_timestamptz                             |
| pg_catalog         | timestamp_ge                                         |
| pg_catalog         | timestamp_ge_date                                    |
| pg_catalog         | timestamp_ge_timestamptz                             |
| pg_catalog         | timestamp_gt                                         |
| pg_catalog         | timestamp_gt_date                                    |
| pg_catalog         | timestamp_gt_timestamptz                             |
| pg_catalog         | timestamp_hash                                       |
| pg_catalog         | timestamp_hash_extended                              |
| pg_catalog         | timestamp_in                                         |
| pg_catalog         | timestamp_larger                                     |
| pg_catalog         | timestamp_le                                         |
| pg_catalog         | timestamp_le_date                                    |
| pg_catalog         | timestamp_le_timestamptz                             |
| pg_catalog         | timestamp_lt                                         |
| pg_catalog         | timestamp_lt_date                                    |
| pg_catalog         | timestamp_lt_timestamptz                             |
| pg_catalog         | timestamp_mi                                         |
| pg_catalog         | timestamp_mi_interval                                |
| pg_catalog         | timestamp_ne                                         |
| pg_catalog         | timestamp_ne_date                                    |
| pg_catalog         | timestamp_ne_timestamptz                             |
| pg_catalog         | timestamp_out                                        |
| pg_catalog         | timestamp_pl_interval                                |
| pg_catalog         | timestamp_recv                                       |
| pg_catalog         | timestamp_send                                       |
| pg_catalog         | timestamp_smaller                                    |
| pg_catalog         | timestamp_sortsupport                                |
| pg_catalog         | timestamp_support                                    |
| pg_catalog         | timestamptypmodin                                    |
| pg_catalog         | timestamptypmodout                                   |
| pg_catalog         | timestamptz                                          |
| pg_catalog         | timestamptz                                          |
| pg_catalog         | timestamptz                                          |
| pg_catalog         | timestamptz                                          |
| pg_catalog         | timestamptz                                          |
| pg_catalog         | timestamptz_cmp                                      |
| pg_catalog         | timestamptz_cmp_date                                 |
| pg_catalog         | timestamptz_cmp_timestamp                            |
| pg_catalog         | timestamptz_eq                                       |
| pg_catalog         | timestamptz_eq_date                                  |
| pg_catalog         | timestamptz_eq_timestamp                             |
| pg_catalog         | timestamptz_ge                                       |
| pg_catalog         | timestamptz_ge_date                                  |
| pg_catalog         | timestamptz_ge_timestamp                             |
| pg_catalog         | timestamptz_gt                                       |
| pg_catalog         | timestamptz_gt_date                                  |
| pg_catalog         | timestamptz_gt_timestamp                             |
| pg_catalog         | timestamptz_in                                       |
| pg_catalog         | timestamptz_larger                                   |
| pg_catalog         | timestamptz_le                                       |
| pg_catalog         | timestamptz_le_date                                  |
| pg_catalog         | timestamptz_le_timestamp                             |
| pg_catalog         | timestamptz_lt                                       |
| pg_catalog         | timestamptz_lt_date                                  |
| pg_catalog         | timestamptz_lt_timestamp                             |
| pg_catalog         | timestamptz_mi                                       |
| pg_catalog         | timestamptz_mi_interval                              |
| pg_catalog         | timestamptz_ne                                       |
| pg_catalog         | timestamptz_ne_date                                  |
| pg_catalog         | timestamptz_ne_timestamp                             |
| pg_catalog         | timestamptz_out                                      |
| pg_catalog         | timestamptz_pl_interval                              |
| pg_catalog         | timestamptz_recv                                     |
| pg_catalog         | timestamptz_send                                     |
| pg_catalog         | timestamptz_smaller                                  |
| pg_catalog         | timestamptztypmodin                                  |
| pg_catalog         | timestamptztypmodout                                 |
| pg_catalog         | timetypmodin                                         |
| pg_catalog         | timetypmodout                                        |
| pg_catalog         | timetz                                               |
| pg_catalog         | timetz                                               |
| pg_catalog         | timetz                                               |
| pg_catalog         | timetz_cmp                                           |
| pg_catalog         | timetz_eq                                            |
| pg_catalog         | timetz_ge                                            |
| pg_catalog         | timetz_gt                                            |
| pg_catalog         | timetz_hash                                          |
| pg_catalog         | timetz_hash_extended                                 |
| pg_catalog         | timetz_in                                            |
| pg_catalog         | timetz_larger                                        |
| pg_catalog         | timetz_le                                            |
| pg_catalog         | timetz_lt                                            |
| pg_catalog         | timetz_mi_interval                                   |
| pg_catalog         | timetz_ne                                            |
| pg_catalog         | timetz_out                                           |
| pg_catalog         | timetz_pl_interval                                   |
| pg_catalog         | timetz_recv                                          |
| pg_catalog         | timetz_send                                          |
| pg_catalog         | timetz_smaller                                       |
| pg_catalog         | timetzdate_pl                                        |
| pg_catalog         | timetztypmodin                                       |
| pg_catalog         | timetztypmodout                                      |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | timezone                                             |
| pg_catalog         | to_ascii                                             |
| pg_catalog         | to_ascii                                             |
| pg_catalog         | to_ascii                                             |
| pg_catalog         | to_bin                                               |
| pg_catalog         | to_bin                                               |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_char                                              |
| pg_catalog         | to_date                                              |
| pg_catalog         | to_hex                                               |
| pg_catalog         | to_hex                                               |
| pg_catalog         | to_json                                              |
| pg_catalog         | to_jsonb                                             |
| pg_catalog         | to_number                                            |
| pg_catalog         | to_oct                                               |
| pg_catalog         | to_oct                                               |
| pg_catalog         | to_regclass                                          |
| pg_catalog         | to_regcollation                                      |
| pg_catalog         | to_regnamespace                                      |
| pg_catalog         | to_regoper                                           |
| pg_catalog         | to_regoperator                                       |
| pg_catalog         | to_regproc                                           |
| pg_catalog         | to_regprocedure                                      |
| pg_catalog         | to_regrole                                           |
| pg_catalog         | to_regtype                                           |
| pg_catalog         | to_regtypemod                                        |
| pg_catalog         | to_timestamp                                         |
| pg_catalog         | to_timestamp                                         |
| pg_catalog         | to_tsquery                                           |
| pg_catalog         | to_tsquery                                           |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | to_tsvector                                          |
| pg_catalog         | transaction_timestamp                                |
| pg_catalog         | translate                                            |
| pg_catalog         | trigger_in                                           |
| pg_catalog         | trigger_out                                          |
| pg_catalog         | trim_array                                           |
| pg_catalog         | trim_scale                                           |
| pg_catalog         | trunc                                                |
| pg_catalog         | trunc                                                |
| pg_catalog         | trunc                                                |
| pg_catalog         | trunc                                                |
| pg_catalog         | trunc                                                |
| pg_catalog         | ts_debug                                             |
| pg_catalog         | ts_debug                                             |
| pg_catalog         | ts_delete                                            |
| pg_catalog         | ts_delete                                            |
| pg_catalog         | ts_filter                                            |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_headline                                          |
| pg_catalog         | ts_lexize                                            |
| pg_catalog         | ts_match_qv                                          |
| pg_catalog         | ts_match_tq                                          |
| pg_catalog         | ts_match_tt                                          |
| pg_catalog         | ts_match_vq                                          |
| pg_catalog         | ts_parse                                             |
| pg_catalog         | ts_parse                                             |
| pg_catalog         | ts_rank                                              |
| pg_catalog         | ts_rank                                              |
| pg_catalog         | ts_rank                                              |
| pg_catalog         | ts_rank                                              |
| pg_catalog         | ts_rank_cd                                           |
| pg_catalog         | ts_rank_cd                                           |
| pg_catalog         | ts_rank_cd                                           |
| pg_catalog         | ts_rank_cd                                           |
| pg_catalog         | ts_rewrite                                           |
| pg_catalog         | ts_rewrite                                           |
| pg_catalog         | ts_stat                                              |
| pg_catalog         | ts_stat                                              |
| pg_catalog         | ts_token_type                                        |
| pg_catalog         | ts_token_type                                        |
| pg_catalog         | ts_typanalyze                                        |
| pg_catalog         | tsm_handler_in                                       |
| pg_catalog         | tsm_handler_out                                      |
| pg_catalog         | tsmatchjoinsel                                       |
| pg_catalog         | tsmatchsel                                           |
| pg_catalog         | tsmultirange                                         |
| pg_catalog         | tsmultirange                                         |
| pg_catalog         | tsmultirange                                         |
| pg_catalog         | tsq_mcontained                                       |
| pg_catalog         | tsq_mcontains                                        |
| pg_catalog         | tsquery_and                                          |
| pg_catalog         | tsquery_cmp                                          |
| pg_catalog         | tsquery_eq                                           |
| pg_catalog         | tsquery_ge                                           |
| pg_catalog         | tsquery_gt                                           |
| pg_catalog         | tsquery_le                                           |
| pg_catalog         | tsquery_lt                                           |
| pg_catalog         | tsquery_ne                                           |
| pg_catalog         | tsquery_not                                          |
| pg_catalog         | tsquery_or                                           |
| pg_catalog         | tsquery_phrase                                       |
| pg_catalog         | tsquery_phrase                                       |
| pg_catalog         | tsqueryin                                            |
| pg_catalog         | tsqueryout                                           |
| pg_catalog         | tsqueryrecv                                          |
| pg_catalog         | tsquerysend                                          |
| pg_catalog         | tsrange                                              |
| pg_catalog         | tsrange                                              |
| pg_catalog         | tsrange_subdiff                                      |
| pg_catalog         | tstzmultirange                                       |
| pg_catalog         | tstzmultirange                                       |
| pg_catalog         | tstzmultirange                                       |
| pg_catalog         | tstzrange                                            |
| pg_catalog         | tstzrange                                            |
| pg_catalog         | tstzrange_subdiff                                    |
| pg_catalog         | tsvector_cmp                                         |
| pg_catalog         | tsvector_concat                                      |
| pg_catalog         | tsvector_eq                                          |
| pg_catalog         | tsvector_ge                                          |
| pg_catalog         | tsvector_gt                                          |
| pg_catalog         | tsvector_le                                          |
| pg_catalog         | tsvector_lt                                          |
| pg_catalog         | tsvector_ne                                          |
| pg_catalog         | tsvector_to_array                                    |
| pg_catalog         | tsvector_update_trigger                              |
| pg_catalog         | tsvector_update_trigger_column                       |
| pg_catalog         | tsvectorin                                           |
| pg_catalog         | tsvectorout                                          |
| pg_catalog         | tsvectorrecv                                         |
| pg_catalog         | tsvectorsend                                         |
| pg_catalog         | txid_current                                         |
| pg_catalog         | txid_current_if_assigned                             |
| pg_catalog         | txid_current_snapshot                                |
| pg_catalog         | txid_snapshot_in                                     |
| pg_catalog         | txid_snapshot_out                                    |
| pg_catalog         | txid_snapshot_recv                                   |
| pg_catalog         | txid_snapshot_send                                   |
| pg_catalog         | txid_snapshot_xip                                    |
| pg_catalog         | txid_snapshot_xmax                                   |
| pg_catalog         | txid_snapshot_xmin                                   |
| pg_catalog         | txid_status                                          |
| pg_catalog         | txid_visible_in_snapshot                             |
| pg_catalog         | uhc_to_utf8                                          |
| pg_catalog         | unicode_assigned                                     |
| pg_catalog         | unicode_version                                      |
| pg_catalog         | unique_key_recheck                                   |
| pg_catalog         | unistr                                               |
| pg_catalog         | unknownin                                            |
| pg_catalog         | unknownout                                           |
| pg_catalog         | unknownrecv                                          |
| pg_catalog         | unknownsend                                          |
| pg_catalog         | unnest                                               |
| pg_catalog         | unnest                                               |
| pg_catalog         | unnest                                               |
| pg_catalog         | upper                                                |
| pg_catalog         | upper                                                |
| pg_catalog         | upper                                                |
| pg_catalog         | upper_inc                                            |
| pg_catalog         | upper_inc                                            |
| pg_catalog         | upper_inf                                            |
| pg_catalog         | upper_inf                                            |
| pg_catalog         | utf8_to_big5                                         |
| pg_catalog         | utf8_to_euc_cn                                       |
| pg_catalog         | utf8_to_euc_jis_2004                                 |
| pg_catalog         | utf8_to_euc_jp                                       |
| pg_catalog         | utf8_to_euc_kr                                       |
| pg_catalog         | utf8_to_euc_tw                                       |
| pg_catalog         | utf8_to_gb18030                                      |
| pg_catalog         | utf8_to_gbk                                          |
| pg_catalog         | utf8_to_iso8859                                      |
| pg_catalog         | utf8_to_iso8859_1                                    |
| pg_catalog         | utf8_to_johab                                        |
| pg_catalog         | utf8_to_koi8r                                        |
| pg_catalog         | utf8_to_koi8u                                        |
| pg_catalog         | utf8_to_shift_jis_2004                               |
| pg_catalog         | utf8_to_sjis                                         |
| pg_catalog         | utf8_to_uhc                                          |
| pg_catalog         | utf8_to_win                                          |
| pg_catalog         | uuid_cmp                                             |
| pg_catalog         | uuid_eq                                              |
| pg_catalog         | uuid_extract_timestamp                               |
| pg_catalog         | uuid_extract_version                                 |
| pg_catalog         | uuid_ge                                              |
| pg_catalog         | uuid_gt                                              |
| pg_catalog         | uuid_hash                                            |
| pg_catalog         | uuid_hash_extended                                   |
| pg_catalog         | uuid_in                                              |
| pg_catalog         | uuid_le                                              |
| pg_catalog         | uuid_lt                                              |
| pg_catalog         | uuid_ne                                              |
| pg_catalog         | uuid_out                                             |
| pg_catalog         | uuid_recv                                            |
| pg_catalog         | uuid_send                                            |
| pg_catalog         | uuid_sortsupport                                     |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_pop                                              |
| pg_catalog         | var_samp                                             |
| pg_catalog         | var_samp                                             |
| pg_catalog         | var_samp                                             |
| pg_catalog         | var_samp                                             |
| pg_catalog         | var_samp                                             |
| pg_catalog         | var_samp                                             |
| pg_catalog         | varbit                                               |
| pg_catalog         | varbit_in                                            |
| pg_catalog         | varbit_out                                           |
| pg_catalog         | varbit_recv                                          |
| pg_catalog         | varbit_send                                          |
| pg_catalog         | varbit_support                                       |
| pg_catalog         | varbitcmp                                            |
| pg_catalog         | varbiteq                                             |
| pg_catalog         | varbitge                                             |
| pg_catalog         | varbitgt                                             |
| pg_catalog         | varbitle                                             |
| pg_catalog         | varbitlt                                             |
| pg_catalog         | varbitne                                             |
| pg_catalog         | varbittypmodin                                       |
| pg_catalog         | varbittypmodout                                      |
| pg_catalog         | varchar                                              |
| pg_catalog         | varchar                                              |
| pg_catalog         | varchar_support                                      |
| pg_catalog         | varcharin                                            |
| pg_catalog         | varcharout                                           |
| pg_catalog         | varcharrecv                                          |
| pg_catalog         | varcharsend                                          |
| pg_catalog         | varchartypmodin                                      |
| pg_catalog         | varchartypmodout                                     |
| pg_catalog         | variance                                             |
| pg_catalog         | variance                                             |
| pg_catalog         | variance                                             |
| pg_catalog         | variance                                             |
| pg_catalog         | variance                                             |
| pg_catalog         | variance                                             |
| pg_catalog         | version                                              |
| pg_catalog         | void_in                                              |
| pg_catalog         | void_out                                             |
| pg_catalog         | void_recv                                            |
| pg_catalog         | void_send                                            |
| pg_catalog         | websearch_to_tsquery                                 |
| pg_catalog         | websearch_to_tsquery                                 |
| pg_catalog         | width                                                |
| pg_catalog         | width_bucket                                         |
| pg_catalog         | width_bucket                                         |
| pg_catalog         | width_bucket                                         |
| pg_catalog         | win1250_to_latin2                                    |
| pg_catalog         | win1250_to_mic                                       |
| pg_catalog         | win1251_to_iso                                       |
| pg_catalog         | win1251_to_koi8r                                     |
| pg_catalog         | win1251_to_mic                                       |
| pg_catalog         | win1251_to_win866                                    |
| pg_catalog         | win866_to_iso                                        |
| pg_catalog         | win866_to_koi8r                                      |
| pg_catalog         | win866_to_mic                                        |
| pg_catalog         | win866_to_win1251                                    |
| pg_catalog         | win_to_utf8                                          |
| pg_catalog         | window_cume_dist_support                             |
| pg_catalog         | window_dense_rank_support                            |
| pg_catalog         | window_ntile_support                                 |
| pg_catalog         | window_percent_rank_support                          |
| pg_catalog         | window_rank_support                                  |
| pg_catalog         | window_row_number_support                            |
| pg_catalog         | xid                                                  |
| pg_catalog         | xid8_larger                                          |
| pg_catalog         | xid8_smaller                                         |
| pg_catalog         | xid8cmp                                              |
| pg_catalog         | xid8eq                                               |
| pg_catalog         | xid8ge                                               |
| pg_catalog         | xid8gt                                               |
| pg_catalog         | xid8in                                               |
| pg_catalog         | xid8le                                               |
| pg_catalog         | xid8lt                                               |
| pg_catalog         | xid8ne                                               |
| pg_catalog         | xid8out                                              |
| pg_catalog         | xid8recv                                             |
| pg_catalog         | xid8send                                             |
| pg_catalog         | xideq                                                |
| pg_catalog         | xideqint4                                            |
| pg_catalog         | xidin                                                |
| pg_catalog         | xidneq                                               |
| pg_catalog         | xidneqint4                                           |
| pg_catalog         | xidout                                               |
| pg_catalog         | xidrecv                                              |
| pg_catalog         | xidsend                                              |
| pg_catalog         | xml                                                  |
| pg_catalog         | xml_in                                               |
| pg_catalog         | xml_is_well_formed                                   |
| pg_catalog         | xml_is_well_formed_content                           |
| pg_catalog         | xml_is_well_formed_document                          |
| pg_catalog         | xml_out                                              |
| pg_catalog         | xml_recv                                             |
| pg_catalog         | xml_send                                             |
| pg_catalog         | xmlagg                                               |
| pg_catalog         | xmlcomment                                           |
| pg_catalog         | xmlconcat2                                           |
| pg_catalog         | xmlexists                                            |
| pg_catalog         | xmltext                                              |
| pg_catalog         | xmlvalidate                                          |
| pg_catalog         | xpath                                                |
| pg_catalog         | xpath                                                |
| pg_catalog         | xpath_exists                                         |
| pg_catalog         | xpath_exists                                         |
| pgbouncer          | get_auth                                             |
| public             | atualizar_ideia                                      |
| public             | atualizar_pipeline                                   |
| public             | atualizar_roteiro                                    |
| public             | deletar_ideia                                        |
| public             | deletar_pipeline                                     |
| public             | deletar_roteiro                                      |
| public             | ideias_delete                                        |
| public             | ideias_insert                                        |
| public             | ideias_update                                        |
| public             | inserir_ideia                                        |
| public             | inserir_pipeline                                     |
| public             | inserir_roteiro                                      |
| public             | roteiros_delete                                      |
| public             | roteiros_insert                                      |
| public             | roteiros_update                                      |
| public             | update_pipeline_updated_at                           |
| public             | update_updated_at_column                             |
| realtime           | apply_rls                                            |
| realtime           | broadcast_changes                                    |
| realtime           | build_prepared_statement_sql                         |
| realtime           | cast                                                 |
| realtime           | check_equality_op                                    |
| realtime           | is_visible_through_filters                           |
| realtime           | list_changes                                         |
| realtime           | quote_wal2json                                       |
| realtime           | send                                                 |
| realtime           | subscription_check_filters                           |
| realtime           | to_regrole                                           |
| realtime           | topic                                                |
| storage            | add_prefixes                                         |
| storage            | can_insert_object                                    |
| storage            | delete_leaf_prefixes                                 |
| storage            | delete_prefix                                        |
| storage            | delete_prefix_hierarchy_trigger                      |
| storage            | enforce_bucket_name_length                           |
| storage            | extension                                            |
| storage            | filename                                             |
| storage            | foldername                                           |
| storage            | get_level                                            |
| storage            | get_prefix                                           |
| storage            | get_prefixes                                         |
| storage            | get_size_by_bucket                                   |
| storage            | list_multipart_uploads_with_delimiter                |
| storage            | list_objects_with_delimiter                          |
| storage            | lock_top_prefixes                                    |
| storage            | objects_delete_cleanup                               |
| storage            | objects_insert_prefix_trigger                        |
| storage            | objects_update_cleanup                               |
| storage            | objects_update_level_trigger                         |
| storage            | objects_update_prefix_trigger                        |
| storage            | operation                                            |
| storage            | prefixes_delete_cleanup                              |
| storage            | prefixes_insert_trigger                              |
| storage            | search                                               |
| storage            | search_legacy_v1                                     |
| storage            | search_v1_optimised                                  |
| storage            | search_v2                                            |
| storage            | update_updated_at_column                             |
| vault              | _crypto_aead_det_decrypt                             |
| vault              | create_secret                                        |
| vault              | update_secret                                        |
