# Controle de Agenda — Grade de Programação (1 canal online, multi-faixa)

> **Status:** proposta de desenho — aguardando aprovação para construir
> **Data:** 09 de junho de 2026
> **Decisão do dono (09/06/2026):** 1 canal online real · publicar por tema em dias/horários diferentes · 3 plataformas (YouTube + TikTok + Instagram) · começar pelas 3 primeiras verticais
> **Origem:** sessão de estudo de estratégia do Pulso

---

## 1. O problema que isto resolve

Hoje o app tem **10 canais ativos** e **20 séries** dispersos, e **0 vídeos publicados** ponta a ponta. O público não tem como entender "o foco" porque não existe ritmo nem destino único.

A decisão é inverter o modelo:

- **No app:** as verticais continuam separadas (organização interna).
- **Online:** existe **1 canal real** por plataforma.
- **Publicação:** cada vertical/faixa sai em **dia e horário fixos** → o público aprende a grade ("segunda é curiosidade, terça é mistério…").

A peça que falta no sistema é a **grade de programação recorrente** — uma regra "faixa X sai toda Seg/Qua 19h" que gera os agendamentos sozinha. Isso é o "controle de agenda completa".

---

## 2. Como encaixa no banco que já existe

| Conceito | Tabela existente | Papel no novo modelo |
|---|---|---|
| Vertical / tema | `pulso_core.canais` | Vira **faixa** (organização interna). `canais.eh_canal_principal` marca o canal-guarda-chuva |
| Sub-tema | `pulso_core.series` | Detalha a faixa (ex: Mistérios Urbanos dentro de Mistérios) |
| Tipo de plataforma | `pulso_core.plataformas` (6) | YouTube Shorts, TikTok, Instagram Reels, etc. |
| **Conta online real** | `pulso_core.canais_plataformas` | O destino concreto (1 por plataforma): `identificador_externo`, `url_canal` |
| Credenciais | `pulso_core.plataforma_credenciais` | OAuth/API por plataforma |
| Publicação agendada | `pulso_distribution.posts.data_agendada` | Já existe; a grade preenche este campo |
| Calendário | `public.vw_pulso_calendario_publicacao_v2` | Já existe; a grade alimenta a visão semanal |

**O que falta criar:** a tabela de regras da grade + o gerador que a transforma em `posts` agendados. Nada precisa ser destruído.

---

## 3. Escopo de estreia (as 3 primeiras faixas)

Para "misturar verticais sem perder o foco", a estreia usa as **3 verticais vizinhas** que o roadmap já priorizava (Fase 1/2) e que conversam entre si — edutainment de mente/mistério/curiosidade:

| Faixa (vertical) | Séries disponíveis hoje | Formato |
|---|---|---|
| **Curiosidades** | Ciência Estranha · Curiosidades Dark · Curiosidades Psicológicas | 15–30s |
| **Mistérios & História** | Mistérios Urbanos · Enigmas Históricos · Casos Reais Misteriosos | 40–60s |
| **Psicologia & Comportamento** | Saúde Mental no Cotidiano · Relacionamentos & Apego · Psicologia & Comportamento | 20–45s |

As outras 7 verticais (Infantil, Games, Motivacional, Contos, Estudos, Casos Reais & Bizarros, Dark PT) ficam **cadastradas e pausadas** — entram como faixas novas (ou canais novos) depois do primeiro ciclo provado.

---

## 4. A grade semanal proposta

Ritmo: **1 vídeo/dia**, mesmo vídeo replicado nas 3 plataformas em horário ótimo de cada uma.
Resultado: 7 vídeos/semana × 3 plataformas = **21 posts/semana**.

| Dia | Faixa | Série sugerida | YouTube | TikTok | Instagram |
|---|---|---|---|---|---|
| Seg | Curiosidades | Ciência Estranha | 19h | 12h | 18h |
| Ter | Mistérios | Mistérios Urbanos | 19h | 12h | 18h |
| Qua | Psicologia | Saúde Mental no Cotidiano | 19h | 12h | 18h |
| Qui | Curiosidades | Curiosidades Psicológicas | 19h | 12h | 18h |
| Sex | Mistérios | Enigmas Históricos | 19h | 12h | 18h |
| Sáb | Psicologia | Relacionamentos & Apego | 11h | 11h | 11h |
| Dom | Mistérios | Casos Reais Misteriosos | 11h | 11h | 11h |

> Distribuição: Mistérios 3×/semana (faixa âncora), Curiosidades 2×, Psicologia 2×. Tudo configurável — esta é uma proposta inicial, não regra fixa. Fuso: `America/Sao_Paulo`.

---

## 5. Modelo de dados novo

### 5.1. Tabela de regras da grade

```sql
CREATE TABLE pulso_distribution.grade_slots (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_id        uuid NOT NULL REFERENCES pulso_core.canais(id),        -- a faixa/vertical
    serie_id        uuid REFERENCES pulso_core.series(id),                  -- opcional: fixa a série do slot
    dia_semana      smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),   -- 0=Dom .. 6=Sáb
    hora_local      time NOT NULL,
    fuso            text NOT NULL DEFAULT 'America/Sao_Paulo',
    plataforma_id   uuid REFERENCES pulso_core.plataformas(id),            -- NULL = todas as ativas
    ativo           boolean NOT NULL DEFAULT true,
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);
```

Cada linha = "esta faixa sai neste dia/hora nesta plataforma". A grade da seção 4 são ~21 linhas.

### 5.2. Gerador de agenda (regra → posts)

Lógica (roda no app ou via cron, com gate humano):

1. Para cada slot ativo nas próximas N semanas, calcular a próxima ocorrência (`dia_semana` + `hora_local` no fuso).
2. Buscar o próximo conteúdo **pronto** (`pipeline_status = PRONTO_PUBLICACAO`) da faixa/série do slot que ainda não foi agendado.
3. Criar `posts` com `status = AGENDADO` e `data_agendada` = ocorrência calculada, vinculado ao `canais_plataformas` da plataforma.
4. Se não houver conteúdo pronto para um slot → marcar **SLOT VAZIO** e alertar (não publicar nada).

> A grade nunca inventa conteúdo. Slot sem conteúdo pronto = alerta, não buraco silencioso.

---

## 6. Interface

- **`/agenda` (nova):** editor visual da grade — tabela faixa × dia × hora, liga/desliga slots, ajusta horário por plataforma.
- **`/calendario` (existente, evoluído):** visão semanal mostrando cada slot como **planejado / preenchido / publicado / vazio**.
- **`/publicar` (existente):** no horário do slot, o humano confirma o post (publicação assistida).

---

## 7. Realidade das 3 plataformas (limites honestos)

A "agenda completa" **planeja e enfileira**; o disparo final é **assistido**, por dois motivos: R-011 (IA não publica sozinha em rede da empresa) e limites de API.

| Plataforma | Como agenda + publica | Limite |
|---|---|---|
| **YouTube Shorts** | API oficial (Data API v3) com gate humano | 10k unidades/dia; público exige OAuth |
| **TikTok** | Apps não auditados publicam só **privado** → na prática, publicação manual assistida | API restrita |
| **Instagram Reels** | Graph API, só conta **Business/Creator** | Sem conta Business, é manual assistido |

> Conclusão: a grade é a fonte da verdade do "o que sai quando". O disparo pode ser semi-automático no YouTube e assistido (humano fecha) no TikTok/Instagram até as APIs estarem liberadas.

---

## 8. Pré-condição que não pode ser ignorada

A grade só tem valor quando há conteúdo **pronto** para preencher os slots. Hoje há **0 itens em `PRONTO_PUBLICACAO`**. Então o caminho é paralelo:

1. **Montar a grade** (este doc) — barato, define o frame.
2. **Fechar o primeiro lote** de vídeos prontos por faixa (destravar o pipeline).
3. **Ligar o gerador** — a grade preenche o calendário com o lote.
4. **Publicar assistido**, medir, ajustar a grade.

---

## 9. Plano de construção (fases)

| Fase | Entrega | Risco |
|---|---|---|
| F0 | Definir o canal online real (1 `canais_plataformas` por plataforma) + marcar `eh_canal_principal` | 🟢 dado |
| F1 | Migration `grade_slots` + seed da grade da seção 4 | 🟡 DDL (confirmar antes) |
| F2 | Tela `/agenda` (editor da grade) | 🟢 |
| F3 | Gerador grade→posts (com alerta de slot vazio) | 🟡 |
| F4 | `/calendario` mostrando grade semanal preenchida | 🟢 |
| F5 | Publicação assistida por plataforma no horário do slot | 🔴 R-011 — humano confirma |

---

## 10. Decisões ainda abertas

- [ ] Nome/handle do canal online único por plataforma (YouTube/TikTok/Instagram)
- [ ] Confirmar a grade da seção 4 (dias/horários) ou ajustar
- [ ] Confirmar as 3 faixas de estreia (Curiosidades / Mistérios / Psicologia)
- [ ] Quantas semanas o gerador agenda à frente (sugestão: 2)
- [ ] Voz TTS padrão e ferramenta antes de produzir o lote
