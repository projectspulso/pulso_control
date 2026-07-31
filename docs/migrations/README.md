# docs/migrations — espelho documentado do banco (pulso_control)

> Backup **legível e versionado** do estado do banco. Padrão DIGIAI (CLAUDE.md §3, desde 2026-05-29).
> Banco isolado deste app — não confundir com o banco Clearix (compartilhado pelos sub-apps clearix_*).

## Conteúdo

| Arquivo | O que é | Fonte de verdade? |
|---|---|---|
| `migrations/` | Cópia fiel das 56 migrations canônicas (`supabase/migrations`) | ✅ **sim** — DDL exato, ordem real |
| `schema.sql` | Snapshot estrutural atual (CREATE TABLE + RLS + policies) via Management API | retrato legível |
| `seed-candidates.md` | Contagem por tabela — base para o `seed.sql` | — |

## Regenerar

```bash
node Cockpit/scripts/dump-db-mirror.mjs pulso_control
```

Lê token Supabase + URL do `pulso_control/.env` (nunca expõe). Read-only no banco.

## Ressalvas

- `schema.sql` é estrutural. Constraints/índices/triggers exatos: ver `migrations/`.
- `seed.sql` **não é gerado automaticamente** — curadoria humana por LGPD (R-013).
