# Pacote de prompts — Avatar do dono (série Bastidores)

> **Direção escolhida (24/08, chat):** estilo **ink colorido** (prancha nº 6 do GPT — traço de
> nanquim + círculo âmbar de pincel), **busto** (não corpo inteiro), quadro **1. FRONTAL** como base.
> A prancha monocromática (nº 9) fica como ativo secundário (cartelas/thumbnail), não é a do vídeo.
> Motivo: sobre o fundo roxo-escuro dos vídeos (#100C26) o âmbar estoura; a mono some.

**Objetivo:** derivar da prancha aprovada o pacote de quadros que o motor de lip-sync anima
(custo R$0). **Onde salvar:** nesta pasta, com os nomes EXATOS das tabelas.

---

## Como gerar (a ordem importa)

1. Na MESMA conversa do GPT onde as pranchas nasceram, gere primeiro o quadro-base
   (`pose_neutro.png`): o **1. FRONTAL da prancha ink colorida, isolado, um arquivo só**.
2. Para TODOS os outros quadros, anexe o quadro-base como referência e mude SÓ o que a
   linha da tabela diz. Cabeça, olhos, corpo, círculo âmbar e enquadramento idênticos.
3. Gere as 6 bocas antes das poses — são elas que fazem o lip-sync.

## Regra de ouro da transparência

⚠️ As pranchas vieram com fundo cinza-claro pintado. O pacote final precisa de
**transparência alfa REAL** fora do personagem+círculo. Peça sempre "PNG with real alpha
transparency" e confira: aberto num editor, o fundo tem que ser o xadrez de transparência.
O **círculo âmbar fica** — ele é parte do personagem — mas tem que ser IDÊNTICO em todos
os quadros, senão o avatar "pisca" ao trocar de boca.

---

## Prompt de derivação (cole no GPT, anexando o quadro-base)

> Usando a imagem anexada como referência EXATA — mesmo personagem, mesmo traço ink,
> mesmo círculo âmbar de pincel na mesma posição, mesmo enquadramento de busto, mesma
> escala — gere a variação abaixo ALTERANDO APENAS o que descrevo. Cabeça, olhos, óculos,
> barba, camiseta e círculo permanecem pixel-idênticos. PNG com transparência alfa real
> fora do personagem e do círculo, alta resolução (mínimo 2048px), sem texto, sem rótulo,
> um quadro só (não prancha). Variação: [LINHA DA TABELA]

---

## Os 10 quadros

### Visemas — as 6 bocas do lip-sync (SÓ a boca muda)

| Arquivo | A boca |
|---|---|
| `viseme_MBP.png` | lábios fechados e relaxados (sons M, B, P — também é o repouso/silêncio) |
| `viseme_AEI.png` | bem aberta, mandíbula solta, dentes de leve à mostra (sons A, E, I) |
| `viseme_O.png` | arredondada em "O" claro |
| `viseme_U.png` | pequena, projetada em bico (som "U") |
| `viseme_FV.png` | dentes superiores encostando no lábio inferior (sons F, V) |
| `viseme_L.png` | entreaberta com a ponta da língua tocando os dentes de cima (som L) |

**Crítico:** se a cabeça deslocar entre bocas, o personagem "treme" ao falar. Peça
explicitamente: *"head, eyes, glasses, beard and ink circle EXACTLY identical to the
reference — only the mouth changes"*.

### Poses de expressão (4)

| Arquivo | O que muda |
|---|---|
| `pose_neutro.png` | o 1. FRONTAL isolado, boca fechada relaxada — **QUADRO-BASE** |
| `pose_apresentando.png` | uma mão entra no quadro aberta, palma para cima, apresentando; leve sorriso |
| `pose_apontando.png` | mão apontando com o indicador para o lado, boca entreaberta de fala |
| `pose_joinha.png` | polegar para cima no quadro, sorriso confiante (tem na prancha: 7. SORRINDO como base de expressão) |

---

## Checklist de validação (o agente confere quando os arquivos chegarem)

- [ ] 10 arquivos com os nomes exatos das tabelas
- [ ] Transparência alfa real em todos (círculo âmbar fica; fundo cinza não)
- [ ] Círculo âmbar idêntico nos 10 (posição, tamanho, respingos)
- [ ] Mesmo personagem/traço nos 10 (sem "irmão parecido")
- [ ] As 6 bocas alinham sobre o quadro-base (teste de sobreposição)
- [ ] ≥2048px, 1 quadro por arquivo (não prancha)
- [ ] Destaca sobre fundo roxo-escuro #100C26

## Depois da validação

O motor de teste (`D:\tmp\lipsync_dono_test.py`, já validado em dry-run) anima estes
quadros em 16:9 com o avatar no canto inferior direito — o gancho do EP01 com a voz
clonada é o teste A/B de aprovação.

## Amostra de voz

Texto e instruções de gravação em `roteiro_amostra_voz.txt` (nesta pasta):
Bloco 0 + Bloco 1 do EP01, ~1min30 de leitura.
