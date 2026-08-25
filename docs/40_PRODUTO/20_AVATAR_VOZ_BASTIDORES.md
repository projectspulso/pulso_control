# Avatar + Voz do dono — série Bastidores

> **Criado em:** 2026-08-26 · **Status:** direção de estilo escolhida — aguardando quadros individuais + amostra de voz
> Decisões do chat de 26/08: avatar gerado **direto no GPT** (histórico de ideias/personalidade já está lá);
> voz **clonada no ElevenLabs** (plano Creator, uso comercial ok). Rotulagem de IA continua obrigatória.
>
> **Sessão de 25/08 (madrugada) — AVATAR PRONTO:** kit completo de **20 quadros** gerado no GPT
> (conversa "PULSO - Perfil empreendedor criativo") e validado quadro a quadro:
> 11 bocas de fala (MBP/meio/AEI/E/I/O/U/FV/L/S + neutro), sorriso de reação, ciclo de piscada
> (olhos_meio/olhos_fechados/blink_falando), cabeça 3/4 (esq/dir) e 3 gestos (apresentando/
> apontando/joinha). Estilo: **ink colorido com círculo âmbar** (prancha 6). Gate mecânico dos
> visemas: desvio ≤3px, IoU ≥0,958 vs quadro-base; alfa real em todos; 1254×1254.
> Canônico em `OneDrive …/digiai/pulso/avatar_dono/`; espelho em `public/pulso/avatar_dono/`.
> Prova de animação (gancho EP01 mudo) entregue e aprovada no chat. 1 rejeição corrigida:
> pose_apontando derivou de personagem no texto-livre; refeito por edição do apresentando.
> **Falta: amostra de voz do dono (roteiro em `avatar_dono/roteiro_amostra_voz.txt`) → clone IVC
> → mp4 do gancho do EP01 com voz + avatar (A/B contra a voz do canal).**
>
> **Sessão de 24/08 (agente avatar/voz):**
> - Estilo escolhido: **ink colorido** (prancha nº 6 do GPT — nanquim + círculo âmbar), **busto** em vez
>   de corpo inteiro (plano de fala de canto; menos quadros, mais estável). Prancha mono (nº 9) vira
>   ativo secundário (cartelas/thumbnail).
> - Infra pronta: `public/pulso/avatar_dono/` criada com `PROMPTS_AVATAR_DONO.md` (prompt de derivação
>   dos 10 quadros) e `roteiro_amostra_voz.txt` (Bloco 0+1 do EP01, instruções de gravação);
>   `D:\tmp\lipsync_dono_test.py` (render 16:9, avatar no canto) validado em dry-run com o mascote.
> - Chave ElevenLabs do `.env` validada (lê vozes; conta já tem clones IVC — plano suporta).
> - Falta do dono: (1) os 10 quadros individuais derivados do FRONTAL colorido, com alfa real;
>   (2) a amostra de voz 1–3 min lendo o roteiro.

## O que o dono traz

1. **Amostra de voz**: 1–3 min de áudio limpo (sem música/ruído). Sugestão: ler o Bloco 0 + Bloco 1
   do roteiro do EP01 — já serve de teste de tom. → clone *instant* primeiro; o *professional*
   (30min+ de gravação) entra depois que o formato validar.
2. **Quadros do avatar vindos do GPT** (especificação abaixo).

## Especificação dos quadros (para plugar no motor de lip-sync existente, custo R$0)

- PNG **fundo transparente**, mesmo personagem/traço/paleta em TODOS os quadros, corpo inteiro,
  ~1024px de altura, ancorável pelos pés.
- **6 bocas (visemas)** — o motor lê a narração e troca a boca sozinho:
  `AEI` (aberta) · `O` · `U` · `MBP` (fechada) · `FV` (lábio no dente) · `L` (língua).
- **4 poses de expressão**: neutro · apresentando (mão aberta) · apontando · joinha.
- Estilo: caricatura 2D com acabamento acima do avatar da Mello (referência: limelight_studio,
  `divulgacao/avatar/`). Sem foto-realismo — é desenho com identidade.

## Prompt de partida para o GPT (colar e ajustar)

```
Crie um avatar caricatura 2D do [meu nome/descrição — você já me conhece do nosso histórico],
estilo flat moderno com contorno limpo, para narrar vídeos de bastidores de tecnologia.
Preciso de um PACOTE DE QUADROS consistentes (mesmo personagem, traço e paleta em todos),
PNG com fundo transparente, corpo inteiro, alta resolução:

1) 6 variações de BOCA para lip-sync, mantendo o resto do corpo idêntico:
   boca aberta (A/E/I), boca O, boca U, boca fechada (M/B/P), lábio no dente (F/V), língua (L)
2) 4 poses de expressão: neutro, apresentando com a mão aberta, apontando para o lado, joinha

Paleta: tons que conversem com roxo/rosa da marca PULSO. Sem texto na imagem.
```

## Pipeline quando os insumos chegarem

1. Quadros → `public/pulso/avatar_dono/` (mesmo padrão do mascote) — o motor `lipsync_pulso.py`
   anima sem mudança de código;
2. Amostra → Instant Voice Clone no ElevenLabs → gerar o gancho do EP01 como teste A/B contra a
   voz do canal;
3. Aprovado o teste → EP01 inteiro: narração + capturas (checklist no app) + montagem 16:9.

**Lembrete**: a conversa de storytelling/referências de canais (item 3 do plano) acontece antes de
fechar o corte do EP01.
