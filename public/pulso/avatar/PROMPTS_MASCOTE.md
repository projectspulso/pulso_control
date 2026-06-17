# Pacote de prompts — Mascote PULSO (assets limpos, 1 por pose)

**Objetivo:** gerar cada pose do mascote como arquivo próprio, completo e enquadrado igual — para lip-sync sem corte de sheet.

**Regra de ouro (consistência):** em TODA geração, anexar `final_images.png` como **imagem de referência** do personagem. Só a boca/expressão muda. Mesmo enquadramento e escala sempre.

---

## BASE FIXA (cole no início de TODO prompt)

> Flat 2D vector cartoon mascot "PULSO", **same character as the reference image**: a young explorer boy, purple-blue skin, big round expressive eyes, yellow cap with a white pulse-wave symbol on the front, blue cape, yellow shirt with a pulse-wave symbol on the chest. **Chest-up portrait, perfectly centered, facing camera straight-on, identical framing and scale, generous headroom above the cap (do not crop the head), soft even lighting, thick clean black outlines, flat colors, same art style as reference. Transparent background. No text, no labels, no panel, single character only.**

Depois da base, troca só a linha da boca/expressão abaixo.

---

## 6 VISEMAS (bocas — o essencial do lip-sync)

1. **viseme_MBP (repouso/fechada)** → `...mouth gently closed, relaxed neutral lips (resting pose for M, B, P sounds).`
2. **viseme_AEI (aberta)** → `...mouth open wide with relaxed jaw, saying "ah/eh", teeth slightly visible.`
3. **viseme_O (redonda)** → `...lips rounded into a clear "O" shape.`
4. **viseme_U (bico)** → `...lips pursed forward into a small rounded "oo" shape.`
5. **viseme_L (língua)** → `...mouth open with the tongue tip touching the upper teeth (L sound).`
6. **viseme_FV (dentes)** → `...upper teeth lightly resting on the lower lip (F, V sounds).`

## NEUTRO (idle)
7. **exp_neutro** → `...calm neutral friendly expression, mouth gently closed, looking at camera.` (pode ser igual ao MBP)

---

## EXPRESSÕES (fase 2 — depois que os visemas validarem)

8. **exp_feliz** → `...big warm smile, eyes slightly squinted with joy.`
9. **exp_surpreso** → `...wide surprised eyes, mouth open in an "oh!", eyebrows raised.`
10. **exp_pensativo** → `...thoughtful look, one hand on chin, eyes glancing up.`
11. **exp_curioso** → `...curious tilted head, raised eyebrow, slight intrigued smile.`
12. **exp_entusiasmado** → `...excited big open smile, sparkling eyes, energetic.`

---

## Onde gerar
- **GPT (ChatGPT / GPT Image)** — igual ao Doug. Grátis, você controla, ótima consistência com referência. Recomendado.
- **Higgsfield (Nano Banana Pro / GPT Image 2)** — eu dirijo, custa créditos. Bom se quiser que eu faça em lote.

## Padrão de nome do arquivo (salvar em `public/pulso/avatar/`)
`viseme_AEI.png`, `viseme_O.png`, `viseme_U.png`, `viseme_L.png`, `viseme_MBP.png`, `viseme_FV.png`, `exp_neutro.png` (+ expressões fase 2)

O motor de lip-sync (`D:/tmp/lipsync_pulso.py`) já lê exatamente esses nomes — é só substituir os arquivos atuais pelos limpos.
