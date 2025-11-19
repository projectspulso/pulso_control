# PULSO – Ecossistema de Canais Dark

Este repositório centraliza:

- **Supabase**: banco de dados (ideias, roteiros, assets, publicações e métricas).
- **n8n**: orquestração dos fluxos (ideia → roteiro → áudio → vídeo → postagem → métricas).
- **Apps**: dashboard e API de suporte.
- **Content**: roteiros, templates e assets de conteúdo.
- **Docs**: blueprints, processos e padrões.

Estrutura geral:

- `apps/dashboard`: frontend (painel interno)
- `apps/api`: backend interno / APIs auxiliares
- `automation/n8n`: workflows exportados do n8n
- `database/sql`: schema, migrations e seeds do Supabase
- `content`: ideias, roteiros, assets
- `analytics`: scripts e exportações de métricas
- `docs`: documentação do ecossistema
