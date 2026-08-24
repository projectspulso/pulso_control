# Configuração das Redes Sociais — PULSO Histórias

> **Regra Cockpit:** finalizar tudo, atualizar tudo, não deixar rabos. Este doc é o controle único do estado de cada rede.
> **Atualizado:** 24 de agosto de 2026

---

## 0. ⚠️ MUDANÇA DE NOME — 2026-08-24

O canal passou de **PULSO** para **PULSO Histórias**.

**Por quê:** busca no INPI (24/08) mostrou que a **Editora Globo** tem **5 registros de "PULSO"
EM VIGOR** — três na **classe 41** (entretenimento/produção audiovisual) e dois na **38**
(difusão), exatamente as classes que o canal precisaria. Foram prorrogados em 2023/24, e o INPI
**indeferiu dois terceiros** que tentaram registrar "PULSO" (PULSO COMUNICAÇÃO VISUAL 2022,
FELITRON 2024).

**"PULSO HISTÓRIAS" está livre no INPI**, é mais distintivo, e já era o handle — não é
rebranding, é assumir o nome que a audiência já digita. Detalhes:
[`Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md`](../../../Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md) §Bloco 4 + ADENDO.

| Onde | Estado |
|---|---|
| YouTube (nome do canal) | ✅ 24/08 — público propaga em algumas horas |
| Facebook (nome da Página + bio) | ✅ 24/08 |
| Instagram (nome de exibição) | ✅ 24/08 |
| Hub `pulsohub.netlify.app` | ✅ 24/08 (commit `bc56121`, no ar) |
| **TikTok** | ⚠️ **pendente** — ainda exibe "PULSO" |
| **Kwai** | ⚠️ **pendente** — web dá 404, só app |

⚠️ **YouTube só permite 2 mudanças de nome a cada 14 dias.** Uma já foi usada em 24/08.

## 0.1. Outros ajustes de 24/08 (Facebook)

- 🔴 **Endereço residencial do dono removido** — a Página publicava `rua alfredo batista pizolato
  148`, endereço pessoal. Trocado pela sede: Rua General Francisco Glicério, 940 — Térreo Sala 02,
  Jardim Guaio, CEP 08674-000.
- **Telefone** trocado para `+55 11 98602-7415`.
- ⚠️ **O nome da Página NÃO é editável pela web** — o modal "Editar Página" do Business Suite tem
  foto, capa, bio, categoria, telefone, e-mail, endereço, site e links sociais, mas **nenhum campo
  de nome**. Foi feito pelo app.

## 0.2. Seguidores em 24/08

| Rede | Seguidores | Gate mais próximo |
|---|---|---|
| **Facebook** | **483** | **Estrelas: 500** — faltam **17** ⬅️ o mais perto de todos |
| YouTube | 321 inscritos | YPP: 500 inscritos **E** 3M views Shorts/90d (está em 33 mil) |
| Instagram | 248 | Assinaturas: ~10.000 |
| TikTok | 221 | Creator Rewards: 10.000 |

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
