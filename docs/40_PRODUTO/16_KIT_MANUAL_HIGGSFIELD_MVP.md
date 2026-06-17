# Kit Manual Higgsfield do MVP

Data de referencia: 15 de maio de 2026

## Decisao

O video do MVP pode ser manual no Higgsfield.

Isso e correto para agora porque o gargalo real e publicar o lote e medir, nao automatizar video antes de provar formato.

## Regra de duracao

O video final deve ter mais de 15 segundos. Na pratica o padrao atual e ~60-70s (narracao completa).

Nao depender de take unico longo. Quanto maior o take unico em IA de video, maior o risco de deformacao, perda de identidade visual e movimento incoerente.

## REGRA DE FLUIDEZ (obrigatoria desde 17/06/2026)

> **Causa do problema:** o clipe-fonte do Veo 3.1 Lite tem no maximo **8 segundos**. Se uma cena precisa cobrir um trecho de narracao maior que isso, o montador estica o clipe (`setpts`) e acima de ~1,5x vira **camera lenta travada (judder)** — duplicacao de frame, movimento engasgado. Foi o que baixou o padrao em Pollock (#17) e Chuva (#18): 5 cenas esticadas ate 1,96x (8s -> 15,7s).

**Regra dura:**

- **Nenhuma cena pode esticar mais de 8s de span.** Fator alvo 0,75-1,0 (span de 6 a 8 segundos).
- **Faltou clipe para um trecho longo?** Quebra o bloco em 2 cortes ou puxa um clipe do **banco** (67+ cenas catalogadas, reuso gratis) — **NUNCA estica**.
- **Quantidade alvo: ~9 a 10 cenas por video** de ~60-70s (antes eram 7, esticadas demais).
- **Orcamento:** ate **5 cenas novas Veo** (5 x 8cr = 40cr) + **4-5 clips do banco**. Mais fluido pelo mesmo custo.
- O `make_video.py` valida automaticamente: ao rodar, ele **avisa toda cena com span > 8s** antes de montar. Corrigir `SCENES_BY` antes de publicar.

Cada clipe novo: **9:16 vertical, 8s, sem audio** (montagem usa a voz PULSO). Ver custos em `Cockpit`/memoria higgsfield-custos-modelos.

## Referencias que devem ser subidas

1. Referencia do Pulso ou assinatura visual do canal.
2. Imagem/scene frame do tema do video.
3. Quando existir, primeiro e ultimo frame para travar continuidade.
4. Referencia de movimento apenas se o clipe precisar de camera muito especifica.

## Trava visual

Prompt base:

```text
Vertical 9:16 cinematic mystery short for PULSO Misterios & Historia. Use the uploaded reference image as visual identity guidance. Pulso is an unseen narrator and editorial guide. Curious, direct and slightly mysterious tone. Realistic atmosphere, strong subject clarity, no distorted faces, no readable text, no logos, no gore, no comedy style.
```

Negative prompt:

```text
Avoid: low quality, blurry subject, warped hands, distorted face, extra limbs, text artifacts, subtitles, watermarks, logos, cartoon style, overexposed image, fast chaotic camera, lip sync, talking mascot.
```

## Estrutura do video

1. Hook: 5 a 7 segundos
   - Abrir curiosidade sem entregar resposta.
   - Movimento: slow push-in, subtle handheld tension.

2. Contexto: 5 a 7 segundos
   - Mostrar lugar, objeto ou pista central.
   - Movimento: parallax movement, shallow depth of field.

3. Virada: 5 a 7 segundos
   - Mostrar detalhe estranho, contradicao ou pista nova.
   - Movimento: slow lateral tracking, dramatic light shift.

4. Fecho: 5 a 8 segundos
   - Encerrar com pergunta ou tensao.
   - Movimento: slow pull-back, clean negative space for captions.

## Checklist de aceite

- 9:16 vertical.
- Sem texto gerado dentro da imagem.
- Sem lip sync do Pulso no MVP.
- Sem personagem deformado.
- Sem estilo infantil/cartoon.
- Legenda adicionada na edicao, nao no Higgsfield.
- Audio do Pulso sincronizado na montagem.
- Video final acima de 15 segundos.
- **~9-10 cenas; NENHUMA cena com span > 8s** (rodar `make_video.py` e conferir que nao ha aviso de FLUIDEZ).
- Arquivo final revisado antes de mover para `PRONTO_PUBLICACAO`.

## Saida e nome de arquivos (regra dura desde 17/06/2026)

**Pasta-mae canonica dos videos prontos** (e de onde sai a publicacao):

```text
D:\OneDrive - Óticas Taty Mello\Grupo Mello\Marketing_e_Vendas\pulso\videos
```

Convencao:

- Uma pasta por video: `video_<NNN>_<slug>/` (NNN sequencial 3 digitos; 001-018 usados).
- Dentro: `FINAL_<slug>.mp4` (master) + `UPLOAD_<slug>.mp4` (versao publicada com CTA).
- `PUBLICACAO.md` na raiz = kit de titulos/descricoes/hashtags por rede.
- `PUBLICAR_AGORA/` = staging dos prontos aguardando publicacao.

O `make_video.py` monta em `D:/tmp/pulso_lote4/<slug>/`; ao finalizar, **copiar FINAL_ + UPLOAD_ para a pasta `video_<NNN>_<slug>/`** no OneDrive e atualizar `PUBLICACAO.md`. (A convencao antiga `pulso-misterios-historia__<tema>__clip-*.mp4` esta OBSOLETA.)

## Trava critica

Se a animacao do mascote atrasar o lote, ela esta errada para esta fase.

No MVP, Pulso pode ser voz, assinatura visual e guia editorial. O personagem animado completo so entra depois que houver sinal real de audiencia.

