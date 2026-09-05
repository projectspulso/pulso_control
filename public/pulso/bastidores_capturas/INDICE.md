# Capturas dos Bastidores — índice e plano

> **Spec acordada** (orquestrador + Limelight, 04/09/2026):
> PNG **3840×2160** tela inteira · MP4 **1080p30**, 10–20s, onde houver movimento ·
> **duas versões** de tudo que toque o 🔒: a CRUA fica aqui e nunca sai, a BORRADA é a que viaja ·
> nome `EPxx_<bloco>_<descricao>.png|mp4` · esta pasta com espelho no OneDrive.
>
> **Por que 4K e não 1080p:** numa série de tela real, o movimento mais comum é *entrar* num
> número — painel inteiro, depois a câmera fecha no que importa. Capturado a 1×, esse zoom vira
> interpolação e o número sai borrado justo no quadro em que ele é o assunto. A 2× dá para cortar
> até ~50% da tela e ainda entregar 1080p nativo. Reduzir sempre melhora; ampliar nunca.
>
> **Regra do 🔒:** *blur na origem é trava, blur na edição é lembrete* (Limelight). O que estiver
> na §4 do diário do dia sai borrado antes de sair daqui.

---

## O que este índice é

O mapa do que **precisa ser capturado** por episódio, e o que **já não pode mais ser**. O segundo
grupo é o motivo de o dono ter liberado a coleta mesmo com a produção congelada: tela não espera.

Status: `PENDENTE` (existe, dá para capturar) · `PERDIDA` (o estado não existe mais) ·
`FEITA` (arquivo nesta pasta).

---

## T01E01 — O bug de um caractere que parou tudo por 6 meses

| Captura | Onde | Status |
|---|---|---|
| Changelog na linha do bug (pg_cron job 9, JSON malformado) | `docs/changelog.md` no editor | PENDENTE |
| O cron rodando hoje, saudável | `select jobname, schedule, active from cron.job` | PENDENTE |
| **A tela do erro, em fevereiro** | — | **PERDIDA** |

> É o episódio que prova a tese deste índice: o bug é de seis meses atrás e **a tela dele não
> existe mais**. Sobra o changelog e a reconstituição.

## T01E02 — Quanto custa publicar 1 vídeo por dia

| Captura | Onde | Status |
|---|---|---|
| Extrato de custo por serviço | `/financeiro` | PENDENTE |
| Ledger de render (custo por cena) | `/assets` ou painel de custo | PENDENTE |
| Banco de clips reusados (o que deixou de ser gerado) | `/assets` | PENDENTE |

## T01E03 — Eu estava contando o custo errado, em 2,3×

| Captura | Onde | Status |
|---|---|---|
| Conciliação: razão do app × fatura real | `/financeiro`, bloco de conciliação | PENDENTE |
| **O painel mentindo, antes da correção de 01/08** | — | **PERDIDA** |

## T01E04 — O Facebook estrangula quem publica por API

| Captura | Onde | Status |
|---|---|---|
| Comparativo por rede: views e alcance | `/analytics` | PENDENTE |
| Os posts do teste A/B lado a lado | `/validacao` (Aderência) | PENDENTE |
| Ficha de um vídeo publicado nas 5 redes | `/video/[id]` | PENDENTE |

## T01E05 — Tomei shadowban por um detalhe idiota

| Captura | Onde | Status |
|---|---|---|
| Histórico de views do vídeo afetado | `/video/[id]`, linha do tempo | PENDENTE |
| **O painel do TikTok na época** | — | **PERDIDA** |

## T01E06 — O algoritmo me disse o que escrever 🔒 RISCO ALTO

| Captura | Onde | Status |
|---|---|---|
| Decisor, visão geral | `/` (home) | PENDENTE — **só borrada** |
| Parecer do analista | `/` bloco do parecer | PENDENTE — **só borrada** |

> **Nada deste episódio viaja sem blur.** O placar tema×rede, os quartis e qualquer peso ficam
> cobertos. A história pode ser contada; o mecanismo, não.

## T01E07 — Como se faz uma voz que não existe

| Captura | Onde | Status |
|---|---|---|
| Kit do avatar do dono (20 quadros) | `public/pulso/avatar_dono/` | PENDENTE |
| Forma de onda de uma narração | arquivo de áudio | PENDENTE |
| Configuração da voz | — | **NÃO CAPTURAR** (🔒 config de modelo/voz) |

## T01E08 — Descobri que minha marca já é de outra empresa

> **NÃO GRAVAR e NÃO CAPTURAR** até o parecer do advogado de marcas. Portão do dono.

## T01E09 — O gate que eu perseguia era o errado

| Captura | Onde | Status |
|---|---|---|
| Card de monetização com os dois caminhos e a distância | `/analytics` | PENDENTE |
| Contador de seguidores por rede | `/analytics` | PENDENTE |
| YouTube Studio: horas de exibição em 365 dias | Studio (fora do app) | PENDENTE |

## T01E10 — 100 dias publicando todo dia

> Só depois de **17/09/2026**. Capturar o contador do desafio **no dia 100**, não antes — é a
> imagem inteira do episódio e ela só existe naquele dia.

| Captura | Onde | Status |
|---|---|---|
| Contador do desafio (dia 100/100) | `/` ou `/analytics` | AGENDADA para 17/09 |
| Curva de crescimento acumulado | `/analytics` | PENDENTE |

---

## Capturas de estado geral (servem a vários episódios, e evaporam todo dia)

Estas não são de um episódio só: são o retrato da operação em movimento. Devem ser refeitas
periodicamente, porque mudam sozinhas.

| Captura | Onde | Nota |
|---|---|---|
| Kanban de produção com a fila cheia | `/producao` | muda todo dia |
| Calendário com a grade 2/dia sem buraco | `/publicar` | muda todo dia |
| Esteira de ideias | `/esteira` | — |
| Saúde dos dados (6 checks) | `/validacao` | — |
| Ficha completa de um vídeo | `/video/[id]` | escolher um campeão |

---

## Pendências antes da primeira coleta

1. **Verificar se o navegador entrega 3840×2160 de verdade.** O painel pode reduzir para caber, e
   aí a captura sai a 1× com nome de 2×. Se não entregar, é melhor saber agora e resolver por
   captura de tela do sistema, não descobrir na montagem.
2. **Espelho no OneDrive** — combinar a pasta.
3. **Peso no git:** PNG 4K é pesado. Se a pasta crescer, ela sai do git e fica só no OneDrive, com
   este índice permanecendo versionado.
