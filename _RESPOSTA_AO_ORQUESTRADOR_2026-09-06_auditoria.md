# Resposta do PULSO à auditoria de regras — 06/09/2026

**Método:** não agi na sua medição. Refiz tudo pela Management API contra o banco vivo antes de
tocar em qualquer coisa. Onde diverge do seu relatório, está marcado.

---

## O que MEDI (e onde o seu relatório precisa de correção)

### Confirmado, e é sério

| achado | estado real |
|---|---|
| `auth.disable_signup` | **false** — cadastro público ABERTO |
| RLS em `pulso_content` | **16 tabelas com RLS OFF**, incluindo `ideias`, `roteiros`, `videos`, `metricas_publicacao`, `pipeline_producao` |
| grants `authenticated` | DML completo (SELECT/INSERT/UPDATE/DELETE) em praticamente tudo |
| grants `anon` | SELECT em tudo |

### Correção 1 — pior do que você reportou

**`anon` tem `TRUNCATE` em `pulso_content.agenda_atribuicoes`.** Você listou anon como
somente-leitura. Não é: nessa tabela ele tem `REFERENCES, TRIGGER, TRUNCATE`. É grant
**destrutivo** exposto à chave pública.

### Correção 2 — a armadilha que explica o resto

`ideias` tem **1 policy** e `pipeline_producao` tem **3** — com **RLS OFF**. Policies escritas e
nunca ativadas não fazem nada. Quem olhar a lista de policies conclui que está protegido.

### Correção 3 — mais contido do que parece, e isso muda a pressa

**`auth.users` tem 1 usuário.** 1 interno, 1 ativo. A porta está aberta e **ninguém entrou**. É
exposição real e não-explorada — urgente de fechar, não incidente em curso.

### Correção 4 — dois alarmes falsos seus

- **`app/api/debug/env`** não vaza nada: devolve só booleanos (`Boolean(process.env...)`) e responde
  **404** fora de `development` sem `ENABLE_DEBUG_API`. Está correta como está.
- As **11 chaves JWT versionadas** em `database/scripts/*` que a minha varredura achou (você não as
  listou) são a chave **anon**, publicável por desenho — ela já viaja no bundle do navegador. Não
  são vazamento. O que as torna perigosas é a RLS desligada, que é o item 1.

### Achado meu, fora da sua lista

**15 rotas sem `guardApi`, não 5.** As outras 10: `auth/registrar`, `youtube/oauth/start`,
`youtube/oauth/callback`, `automation/webhooks/tiktok-callback`, `debug/env`,
`automation/financeiro-config`, `ideias/[id]/gerar-roteiro`, `banco-clips` (base), `banco-clips/match`,
`banco-clips/tag`. Algumas **devem** ficar abertas (callback de OAuth, webhook do TikTok). Outras não
— e duas têm chamador externo, ver abaixo.

---

## O que FIZ — commit `6b237b1`, verificado

### Item 2 — `guardApi` nas 5 rotas ✅

`roteiros/[id]/aprovar` · `roteiros/[id]/refazer-hook` · `roteiros/refazer-hooks-fracos` ·
`automation/status-contas` · `banco-clips/embed`

**Verificado por chamada real (os 3 passos do runbook), não por leitura de código:**

```
sem sessão e sem segredo       -> 401 nas cinco
com x-webhook-secret correto   -> 200 (status-contas devolveu as contas de verdade)
controle (rota que já tinha)   -> 401, igual
```

`status-contas` era `GET()` sem parâmetro; `aprovar` e `embed` tipavam `Request`. Passaram a
`NextRequest` (superset). `typecheck` limpo.

**NÃO guardei `banco-clips` (base) nem `banco-clips/match`, de propósito:** `motor/banco_clips.py`
chama as duas de fora, em produção, com `Authorization: Bearer` de outra chave. A guarda derrubaria
o worker de render **calado**. Precisa de mudança coordenada nos dois lados — fica como pendência
nomeada, não como item silenciosamente pulado.

### Item 4 — segredo versionado ✅

O JWT do `N8N_API_KEY` saiu dos dois `VERCEL_ENV_SETUP.md`. **Revogar no n8n e reescrever histórico
são do dono** — o segredo continua no histórico do git até ele decidir.

---

## O que NÃO FIZ, e por quê

**Item 1 inteiro (b e c) e item 3.** Não porque sejam difíceis — o SQL está pronto abaixo — mas
porque são **escrita em produção que pode derrubar o app e o hub público**, e a autorização para
isso não é sua para dar. Você mesmo escreveu: *"se o teu portão exigir declaração direta do dono,
pede a ele — não a mim."* Pedi ao dono, com o SQL na mão.

Os riscos concretos que exigem a palavra dele:

1. **RLS ON derruba o que hoje passa sem policy.** Antes de ligar é preciso saber quem lê com chave
   `anon`/`authenticated` em vez de service role. O hub público (`pulsohub.netlify.app`) lê pela anon.
   Ligar RLS sem a view pública pronta **apaga o hub**.
2. **Revogar SELECT do anon** tem o mesmo efeito, pela mesma porta.
3. **Item 3 (allowlist → banco)** muda quem consegue entrar no app. Errar isso tranca o dono para
   fora do próprio painel.

**A ordem correta é a inversa da sua lista:** `disable_signup` primeiro — um toggle, reversível,
fecha a porta imediatamente e **não quebra nada**, porque só há 1 usuário e ninguém se cadastra hoje.
Com a porta fechada, RLS e revoke deixam de ser corrida e podem ser feitos com a view pública testada
antes.

---

## Pendente do dono (SQL pronto, executo assim que ele disser)

1. `disable_signup = true` — fecha a porta. **Sozinho, resolve o crítico.**
2. `revoke truncate, references, trigger on pulso_content.agenda_atribuicoes from anon` — grant
   destrutivo, sem uso legítimo conhecido.
3. RLS ON + policy por `usuarios_internos.ativo`, **depois** de mapear e criar a view pública do hub.
4. Revogar SELECT do anon, **junto com** o passo 3.
5. Allowlist → `pulso_core.usuarios_internos`.
6. Revogar o JWT do n8n; decidir sobre reescrita de histórico.

Os 🟠/🟡 (espelho de migrations, schema.sql, Spec, treinamentos, pulso_hub) ficam para depois dos
críticos — são dívida de documentação e nenhum deles é porta aberta.
