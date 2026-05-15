# Kit Manual Higgsfield do MVP

Data de referencia: 15 de maio de 2026

## Decisao

O video do MVP pode ser manual no Higgsfield.

Isso e correto para agora porque o gargalo real e publicar o lote e medir, nao automatizar video antes de provar formato.

## Regra de duracao

O video final deve ter mais de 15 segundos.

Recomendacao operacional:

- alvo bom: 20 a 35 segundos
- gerar 3 ou 4 clipes curtos
- cada clipe: 5 a 8 segundos
- montagem final fora do Higgsfield com audio, cortes e legendas

Nao depender de take unico longo. Quanto maior o take unico em IA de video, maior o risco de deformacao, perda de identidade visual e movimento incoerente.

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
- Arquivo final revisado antes de mover para `PRONTO_PUBLICACAO`.

## Nome de arquivos

```text
pulso-misterios-historia__<tema>__clip-01-hook.mp4
pulso-misterios-historia__<tema>__clip-02-contexto.mp4
pulso-misterios-historia__<tema>__clip-03-virada.mp4
pulso-misterios-historia__<tema>__clip-04-fecho.mp4
pulso-misterios-historia__<tema>__final-v01.mp4
```

## Trava critica

Se a animacao do mascote atrasar o lote, ela esta errada para esta fase.

No MVP, Pulso pode ser voz, assinatura visual e guia editorial. O personagem animado completo so entra depois que houver sinal real de audiencia.

