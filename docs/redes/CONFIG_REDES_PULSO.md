# Configuração das Redes Sociais — PULSO

> **Regra Cockpit:** finalizar tudo, atualizar tudo, não deixar rabos. Este doc é o controle único do estado de cada rede.
> **Atualizado:** 09 de junho de 2026

---

## 1. Identidade canônica (aplicar IGUAL em todas as redes)

| Campo | Valor oficial |
|---|---|
| **Nome** | `PULSO` |
| **@handle / username** | `pulsohistorias` (garantido no YouTube; replicar onde der) |
| **Tagline** | Histórias que mexem com você. |
| **Categoria** | Serviço de produção de vídeo / Entretenimento |
| **Idioma / país** | Português / Brasil |

**Bio curta (TikTok/Instagram, ≤150):**
> PULSO — Histórias que mexem com você.
> Mistérios, curiosidades e o lado estranho da mente humana.
> YouTube: @pulsohistorias

**Descrição longa (YouTube/Facebook):**
> PULSO — Histórias que mexem com você.
> Mistérios sem resposta, curiosidades sombrias e o lado estranho da mente humana, em vídeos curtos e diretos.
> Casos reais, enigmas históricos e fatos que ninguém te contou.
>
> Inscreva-se e ative o sino. Conteúdo novo toda semana.
> Você acredita em coincidência? Comenta.

**Links cruzados (cada perfil aponta pros outros):**
- YouTube: `youtube.com/@pulsohistorias`
- Instagram: `instagram.com/pulsoprojects`
- TikTok: `tiktok.com/@pulsohistorias` (a confirmar no login)
- Facebook: `facebook.com/<página>`

---

## 2. Estado por rede

| Rede | Login | Avatar | Banner/Capa | Nome | @handle | Bio/Descr | Links | Status |
|---|---|---|---|---|---|---|---|---|
| **YouTube** | ✅ | ✅ | ✅ | ✅ PULSO | ✅ @pulsohistorias | ✅ | ✅ IG | **COMPLETO** |
| **TikTok** (@pulsohistorias) | ✅ | ✅ | — | ✅ PULSO | ✅ @pulsohistorias | ✅ bio | — | **COMPLETO** |
| **Instagram** (@pulsoprojects) | ✅ | ✅ | — | ⛔ app | ⛔ app | ✅ bio | ⛔ app | **bio ok, resto app** |
| **Facebook** (Página Pulso Projects) | ✅ | ✅ | ✅ | ⛔ falta | ⛔ falta | ✅ bio+links | ✅ na bio | **falta só nome** |
| **Kwai** | ⛔ web | — | — | — | — | — | — | **100% app (web dá 404, só Download)** |
| **Threads** | ⚪ criar | — | — | — | — | — | — | **criar via Instagram (1 clique)** |

---

## 2.1. Infra Meta API (11/06/2026) ✅

App Meta **"Pulso Control"** (ID 1333767978163007) vinculado ao portfólio **"Projetos Pulso"** (1539817773572500), que agora é dono da Página `926237593895365` e do IG business `17841478757082171`. System user `pulso_publisher` com token sem expiração (publicação + insights). Credenciais `META_*` no `.env` do pulso_control. Detalhes e endpoints: [LANCAMENTO_2026-06-10.md](../00_MESTRE/LANCAMENTO_2026-06-10.md) §Infra Meta API.

> Pendência menor: atribuição direta do ativo IG ao system user pede login do Instagram no Business Suite (Contas do Instagram → "Entrar"). Não bloqueia: a Página compartilha as permissões com o IG conectado.

---

## 3. Ações que FALTAM (sem rabo)

### 3.1. O agente faz (navegador)
- [x] **TikTok:** nome PULSO, @pulsohistorias, bio, avatar — **FEITO 09/06**
- [x] **Facebook:** bio + cross-links (YT/TikTok) — **FEITO 09/06**
- [x] **YouTube:** links Instagram + TikTok — **FEITO 09/06**
- [ ] **Facebook:** nome `Pulso Projects` → `PULSO` — **fica no Meta Business Suite** (web esconde); fazer depois

### 3.2. Só o dono faz (app / criação de conta — web não permite)
- [ ] **Instagram (app):** nome → PULSO · link `youtube.com/@pulsohistorias` · (opcional) @ → `pulsohistorias`
- [ ] **Kwai (app):** TODO o perfil — avatar, nome PULSO, bio, @ (web não edita perfil)
- [ ] **Threads:** criar em 1 clique via Instagram, depois nome/bio PULSO

---

## 3.3. GATE de monetização (NÃO publicar antes)

> **Regra:** não publicar conteúdo monetizável até a estrutura de recebimento estar pronta.

- [ ] Definir **CNPJ** dono/recebedor da receita das redes (dono + contador)
- [ ] Vincular **Google AdSense** (canal @pulsohistorias) ao CNPJ
- [ ] Conta bancária **PJ** para recebimento
- Monetização só **libera após metas** (YouTube 1k inscritos + 4k h ou 10M views Shorts/90d; TikTok/Kwai/Meta similar) — metas vêm publicando, mas o recebimento deve estar pronto antes de faturar.
- Reforça **R-011** (IA nunca publica sem aprovação humana).

## 4. Bloqueio técnico atual (09/06/2026)

A extensão Claude-in-Chrome ficou **instável**: havia **dois navegadores Chrome abertos** com a extensão ativa (o "pulso completo" e outro com o projeto Ótica em `localhost:4173`), e o controle **alternava entre eles** a cada comando, impedindo finalizar Facebook/TikTok.

**Resolução:** manter **apenas o "pulso completo"** aberto (fechar o outro Chrome) e reconectar a extensão. Depois disso, os itens de §3.1 são executáveis.
