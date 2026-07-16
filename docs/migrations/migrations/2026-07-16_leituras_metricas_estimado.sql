-- LEITURA REAL x ESTIMADA — pulso_analytics.leituras_metricas
--
-- Por que existe: em 2026-06-19 13:07 um backfill escreveu 392 leituras retroativas
-- (data_ref de 10/06 a 17/06, coletado_em às 12:00:00 exatas) carimbando o valor que o
-- post tinha NAQUELE dia sobre 8 datas passadas. A série fica chapada e mente pra cima:
-- "views no dia 3" de um post de 10/06 na verdade são as views do dia 9.
--
-- Isso já produziu duas análises erradas sobre o alcance do YouTube (16/07) porque a
-- tabela não tinha como dizer "este número é estimativa". Marcar > apagar: o dado fica
-- auditável e o leitor decide.
--
-- A trava no fim impede que o mesmo erro entre de novo sem ser declarado.

BEGIN;

ALTER TABLE pulso_analytics.leituras_metricas
  ADD COLUMN IF NOT EXISTS estimado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN pulso_analytics.leituras_metricas.estimado IS
  'true = a linha NÃO é medição do dia que data_ref indica (backfill/retroativa). Crescimento, curvas e qualquer leitura por idade do post devem filtrar estimado = false.';

-- marca o backfill de 19/06 pela assinatura exata: criado em bloco + coletado_em sintético
UPDATE pulso_analytics.leituras_metricas
SET estimado = true
WHERE created_at::date > (data_ref + INTERVAL '1 day')::date;

-- Trava: linha nova não pode dizer que representa um dia mais de 1 dia anterior ao seu
-- nascimento — a não ser que se declare estimativa.
ALTER TABLE pulso_analytics.leituras_metricas
  DROP CONSTRAINT IF EXISTS leituras_metricas_sem_backfill_silencioso;

ALTER TABLE pulso_analytics.leituras_metricas
  ADD CONSTRAINT leituras_metricas_sem_backfill_silencioso
  CHECK (estimado OR created_at::date <= (data_ref + INTERVAL '1 day')::date)
  NOT VALID;

COMMIT;
