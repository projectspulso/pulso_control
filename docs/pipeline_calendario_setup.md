# Pipeline de Produção & Calendário Editorial

## Executar Migration

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver conteúdo do arquivo: supabase/migrations/20241121_create_pipeline_producao.sql
```

## Popular com Dados de Teste

Após criar a tabela, execute:

```sql
-- Inserir alguns itens de teste no pipeline
INSERT INTO content.pipeline_producao (ideia_id, status, prioridade, data_prevista, responsavel)
SELECT
  id,
  CASE
    WHEN random() < 0.2 THEN 'AGUARDANDO_ROTEIRO'
    WHEN random() < 0.4 THEN 'ROTEIRO_PRONTO'
    WHEN random() < 0.6 THEN 'AUDIO_GERADO'
    WHEN random() < 0.8 THEN 'EM_EDICAO'
    ELSE 'PRONTO_PUBLICACAO'
  END,
  floor(random() * 10 + 1)::int,
  now() + (random() * interval '30 days'),
  'Equipe PULSO'
FROM content.ideias
WHERE status = 'APROVADA'
LIMIT 20;
```

## Funcionalidades

### Pipeline Kanban (`/producao`)

- ✅ 6 colunas de status
- ✅ Drag & drop entre colunas
- ✅ Prioridade visual (P1-P10)
- ✅ Data prevista em cada card
- ✅ Link direto para calendário

### Calendário Editorial (`/calendario`)

- ✅ Visualizações: Mês, Semana, Dia, Lista
- ✅ Drag & drop para reagendar
- ✅ Cores por status
- ✅ Navegação prev/next
- ✅ Link direto para Kanban
- ✅ Localização PT-BR

## Bibliotecas Instaladas

```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@dnd-kit/utilities": "^3.x",
  "react-big-calendar": "^1.x",
  "date-fns": "^3.x"
}
```

## Próximos Passos (Sprint 4)

- [ ] Sistema de publicação
- [ ] Wizard de upload
- [ ] Integração YouTube API
- [ ] Integração TikTok API
- [ ] Agendamento automático
