# DESPACHO — suporte a vídeo longo no pipeline

> **Para:** agente do `pulso_control`
> **De:** sessão de auditoria de conformidade (Cockpit), 2026-08-24
> **Autorizado por:** Gilberto, no chat
> **Leia antes:** `AGENTS.md` · `docs/40_PRODUTO/19_SERIE_BASTIDORES.md` · `Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md` (§ADENDO)

---

## Por que isto existe (leia, não pule)

O canal tem **0 horas qualificadas de exibição** em 365 dias. Não é falta de audiência — é que
**Short não gera hora qualificada**. O YPP tem dois caminhos e o canal está preso num beco:

| Caminho | Meta | Hoje (verificado no Studio 24/08) | Distância |
|---|---|---|---|
| Views qualificadas de Shorts / 90d | 3.000.000 | 33.000 | **91×** |
| **Horas de exibição / 365d** | 3.000 | **0** | o canal não tem **nenhum** vídeo longo |

O caminho dos Shorts exige multiplicar por 91 — não acontece por acúmulo, só por viralização.
O caminho das horas nunca começou porque o pipeline **só sabe fazer Short**.

Conta: 1 vídeo de 10 min, 40% de retenção, 1.000 views ≈ 67 horas. **44 vídeos = 3.000 horas.**
Um por semana fecha em menos de um ano.

**Sua tarefa é destravar esse segundo caminho.**

---

## O que NÃO fazer (limites duros)

1. **Não mexa no fluxo de Shorts.** Ele publica há 50+ dias sem furo. Vídeo longo é um caminho
   **paralelo**, não um refactor do existente. Se a sua mudança fizer o Short passar por um `if`
   novo, você foi longe demais.
2. **Não crie gerador de roteiro para esta série.** Os roteiros são escritos à mão a partir de
   fatos do repositório (changelog, commits, prints de painel). Gerador aqui inventa, e o valor da
   série é justamente ser verificável. Já existem 3 roteiros prontos em `19_SERIE_BASTIDORES.md`.
3. **Não publique nada.** R-011 continua valendo: `confirmar: true` obrigatório.
4. **Não commite sem o dono pedir.**

---

## O que fazer

### 1. Tipo de conteúdo no banco

O pipeline hoje assume Short em todo lugar. Introduza a distinção **sem quebrar o default**:

- Campo novo em `pulso_content` (sugestão: `formato` em `pipeline_producao` ou `ideias`, valores
  `short` | `longo`, **default `short`**) — assim todo registro existente continua válido.
- Migration sequencial, espelhada em `docs/migrations/`, DDL via Management API (R-012).
- ⚠️ Se mexer em tabela lida pela view `public.v_espelho_pulso`, **atualize a view junto** — ela é
  consumida em produção por `app.digiai.app.br/#/marketing`. Quebrar = tela vazia no painel do dono.

### 2. Upload do YouTube: parar de forçar Short

Em `app/api/automation/publicar/route.ts`, a função `publicarYouTube` hoje:
- injeta `#Shorts` na descrição se não houver (`const desc = /#shorts/i.test(...)`)
- adiciona a tag `shorts`
- devolve URL como `youtube.com/shorts/<id>`

Para `formato === 'longo'`, os três precisam mudar: **sem `#Shorts`**, sem a tag `shorts`, e URL
`youtube.com/watch?v=<id>`.

**Mantenha `containsSyntheticMedia: true`** — ele entrou em `6f6ca32` e vale para os dois formatos:
a narração é voz sintética do ElevenLabs, o que a política do YouTube manda declarar mesmo quando
não há cena gerada.

### 3. Montagem em 16:9

O `motor/make_video.py` corta tudo para 9:16 (`make_video.py` monta vertical, e o `worker_render`
passa por `crop`). Vídeo longo de bastidores é **captura de tela** — precisa de 16:9.

⚠️ **Leia `motor/README.md` antes de tocar em qualquer coisa do motor.** O runtime real está em
`D:/tmp`, não em `motor/`. Editar `motor/` **não muda o que roda**. Se for alterar, alinhe os dois
lados ou proponha ao dono a unificação (que está pendente de propósito, porque mexe num agendador
que hoje funciona).

Para os primeiros episódios, montagem manual é aceitável — **não construa automação de montagem
antes de o formato ser validado.** Ver o critério de morte no fim do `19_SERIE_BASTIDORES.md`:
4 episódios abaixo de 30% de retenção = formato errado.

### 4. Métricas: separar as duas séries

`coletar-metricas` e o `/decisor` comparam desempenho contra a mediana da rede. Misturar um vídeo
de 10 min com Shorts de 60s **contamina as duas leituras** — o radar de estouro vai achar que todo
vídeo longo é fracasso (menos views) e todo Short é normal.

- Separe por `formato` nas comparações e medianas.
- Para vídeo longo, a métrica-norte **não é views**: é **hora de exibição acumulada** e **retenção
  média**. Views não fecham gate nenhum nesse caminho.
- Se der, exponha no `/analytics` um contador de **horas acumuladas rumo às 3.000** — é o número
  que decide se a estratégia está funcionando.

### 5. Canal/vertical novo

Cadastre um canal/vertical "Bastidores" (ou nome que o dono preferir) no padrão dos 13 existentes,
para os episódios entrarem na agenda e nas métricas junto com o resto.

---

## Ordem sugerida

```
1. migration (formato)  →  2. upload YouTube sem #Shorts  →  3. canal novo
   →  4. separar métricas  →  5. (só depois) montagem 16:9
```

Os itens 1-3 destravam a publicação do primeiro episódio. O 4 evita contaminar o `/decisor`. O 5 é
o mais caro e o menos urgente — o primeiro episódio pode ser montado à mão.

---

## Contexto recente que você precisa saber

- **Credenciais migradas em 24/08:** o projeto saiu da `service_role` legada para **secret key**
  (`sb_secret_…`) e da anon legada para **publishable** (`sb_publishable_…`). `.env` local e Vercel
  já atualizados e validados. Se algo autenticar errado, é aí que você olha primeiro.
- **Segredos saíram do código** (`6f6ca32`): `scripts/_env.js` é o leitor compartilhado. Nunca
  volte a hardcodar chave em script.
- **Higgsfield com 2,38 créditos** — não dá uma cena. Auto-refill desativado de propósito. Vídeo de
  bastidores não precisa de Veo (é captura de tela), o que é mais uma vantagem do formato.
- **ElevenLabs Creator US$22/mês** — inclui uso comercial, confirmado 24/08.

## Ao terminar

Relate: o que mudou, quais migrations aplicou, o que **não** fez e por quê, e o que ficou
dependendo de decisão do dono. Não declare pronto o que não viu funcionando (R-005).
