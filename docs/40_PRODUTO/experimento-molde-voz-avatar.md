# Experimento: molde antigo vs molde bolha (voz + avatar)

> Início **16/06/2026** · Leitura **23/06/2026 (terça)** · ~1 semana.
> Tag no banco: `ideias.metadata.experimento = { molde, voz, avatar, inicio, leitura }`.

## Hipótese
O **molde bolha** (mascote PULSO falando + lip-sync) e a **voz PULSO nova** performam
melhor que o **molde antigo** (só B-roll + legenda, voz Daniel).

## Cohorts (tagueados)
| Cohort | n | Voz | Avatar | Quem |
|---|---|---|---|---|
| **antigo** | 15 | Daniel | não | lotes 1-3 |
| **bolha** | 3 | — | sim | rubber-hand (#16, voz PULSO) + Pollock (#17) + Chuva (#18), ambos voz Daniel |

Isso permite **isolar 2 efeitos** quando os 3 bolha tiverem dados:
- **Efeito avatar** = Pollock/Chuva (Daniel+avatar) vs os 15 antigos (Daniel, sem avatar).
- **Efeito voz** = rubber-hand (PULSO+avatar) vs Pollock/Chuva (Daniel+avatar).

## Métrica (comparar na MESMA idade — não o total absoluto)
- **Principal: `views_24h`** (audiência no 1º dia — a janela que o algoritmo usa).
- Secundárias: `views_7dias`, engajamento (`likes/views`), shares+saves.
- ⚠️ Não comparar total bruto: vídeo antigo tem 6 dias, novo tem 1. Sempre normalizar por idade.

## Baseline 16/06 (média por vídeo)
| Cohort | n | views méd | **views_24h** | views_7d | eng% |
|---|---|---|---|---|---|
| antigo | 15 | 1.575 | **1.052** | 1.575 | 3.8% |
| bolha | 1 | 2.083 | **2.083** | — | 3.0% |

**Sinal precoce:** rubber-hand 2.083 em 24h vs 1.052 do molde antigo = **~2× no 1º dia**.
Engajamento 3.0% vs 3.8% (menor, mas n=1). Inconclusivo até os 3 bolha maturarem.

## Plano da semana
1. ✅ **17/06:** Pollock (#17) e Chuva (#18) publicados nas 4 redes → cohort bolha = n=3. **Os 3 da bolha já saem com o CTA do mascote** (regra PULSO-CTA) — o experimento agora carrega também o efeito "CTA animado", não só molde+voz. Muito novos (horas) pra comparar; ler 23/06 por `views_24h`.
2. **Diário:** o cron coleta `views_24h`/`views_7dias` por vídeo (já automático).
3. **23/06 (terça):** ler `views_24h` médio bolha vs antigo + isolar avatar vs voz.

## Decisão na terça
- **Bolha ganha claro** → molde bolha vira padrão; acelerar regravação da voz PULSO nos antigos.
- **Empate/antigo ganha** → reavaliar custo do avatar (tempo de montagem) vs ganho.
- **Avatar ajuda mas voz não (ou vice-versa)** → manter o que ganhou, cortar o que não.

> Como ler na terça: query `ideias.metadata.experimento.molde` + `metricas_publicacao.views_24h`,
> média por cohort. Ou rodar o script de baseline deste doc com a data de leitura.
