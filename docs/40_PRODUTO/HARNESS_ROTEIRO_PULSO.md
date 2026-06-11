# HARNESS DE ROTEIRO — PULSO

> **O que é:** a bíblia editorial que **trava** todo roteiro do PULSO. Nenhum roteiro é aprovado sem passar no **Checklist §9**.
> **Princípio-mestre:** *roubar a atenção em 1 segundo, prender com uma lacuna aberta, e pagar com uma emoção que o cérebro quer reviver.*
> **Curadoria:** nível museu — cada regra abaixo vem de pesquisa real, não de achismo. As fontes são os "consultores" (§2).
> **Atualizado:** 10 de junho de 2026

---

## 1. A única lei (se esquecer tudo, lembre disto)

**Atenção → Lacuna → Dopamina.**
1. **Atenção:** o 1º segundo decide se o vídeo existe.
2. **Lacuna:** abrir uma pergunta que o cérebro **não consegue** deixar em aberto.
3. **Dopamina:** entregar a recompensa (resposta/emoção) de um jeito que dá vontade de reviver → ele assiste de novo, compartilha, e **volta**.

Tudo no PULSO serve a essa sequência. Se uma frase não serve, **corta**.

---

## 2. Os consultores (em quem o harness se apoia)

| Fonte | O que travamos com ela |
|---|---|
| **George Loewenstein** — *Information Gap Theory* | Curiosidade = lacuna entre o que sei e o que quero saber. Abrir a lacuna **cedo**. |
| **Bluma Zeigarnik** — *Efeito Zeigarnik* | O inacabado gruda na memória. Loops abertos = retenção. |
| **Daniel Kahneman** — *Peak–End Rule* | A memória do vídeo = o **pico** + o **fim**. Engenheirar os dois. |
| **Jonah Berger** — *Contagious / STEPPS* | Emoção de **alta excitação** (awe, medo, raiva, humor) é o que faz compartilhar. |
| **Nir Eyal** — *Hooked* | Recompensa **variável** (não saber exatamente o que vem) vicia. |
| **Chip & Dan Heath** — *Made to Stick (SUCCESs)* | Simples, Inesperado, Concreto, Crível, Emocional, História. |
| **Robert Cialdini** — *Influence* | Gatilhos: mistério, prova social, autoridade, escassez. |
| **Aristóteles** — *Poética (mythos)* | A **trama** é a alma: situação → tensão → virada → catarse, mesmo em 45s. |
| **Walter Murch** — *In the Blink of an Eye* | Corte na emoção, não no movimento. Ritmo é respiração. |

---

## 3. O Gancho (primeiros ≤2 segundos) — a parte mais cara do vídeo

Regra: **zero introdução, zero "fala galera".** O 1º quadro já é o gancho.

**Fórmulas validadas (escolha 1):**
- **Lacuna direta:** "Existe uma rádio que transmite há 40 anos. E ninguém sabe por quê."
- **Quebra de padrão:** afirmação que contradiz o senso comum.
- **Pergunta-isca:** "Você ligaria pra um número que ninguém deveria atender?"
- **Promessa de payoff:** "No fim desse vídeo você não vai mais ouvir o silêncio do mesmo jeito."
- **Concreto + estranho:** um detalhe específico e bizarro (Heath: concreto > abstrato).

**Proibido no gancho:** logo de 3s, "olá", contexto antes da isca, frase genérica.

---

## 4. Arquitetura de retenção (o miolo)

- **Loop aberto no gancho, fechado só no fim** (Zeigarnik). Pode abrir **micro-loops** no meio ("mas tem algo mais perturbador…").
- **Densidade:** cada frase **avança** a história (1 fato/imagem nova). Sem pausa morta, sem enrolação.
- **Pattern interrupt a cada 2–4s:** o visual muda (corte, zoom, novo plano) pra resetar a atenção (dopamina de novidade).
- **Recompensa variável (Eyal):** não entregue tudo de uma vez; escalone revelações.
- **Regra do "e se parar agora?"** — em qualquer ponto, se o espectador parar, ele perde algo. Se não perde, **corte aquela parte.**

---

## 5. O arco emocional — **1 emoção-âncora por vídeo** (trava obrigatória)

Defina a emoção **antes** de escrever. Ela rege voz, ritmo, trilha e cor.

| Emoção-âncora | Faixa típica | Voz | Ritmo/Cor | Catarse (payoff) |
|---|---|---|---|---|
| **Suspense / medo** | Mistérios, Casos Reais | grave, íntima, "ASMR-tenso" | cortes lentos-tensos, azul-frio | o arrepio + a pergunta sem resposta |
| **Admiração / awe** | Curiosidades, Ciência | brilhante, curiosa, acelerada | cortes ágeis, alto-contraste | "eu não sabia disso" (uau) |
| **Catarse / virada** | Motivacional, Histórias | calorosa, firme | crescente, dourado | o estalo de "vira-chave" |
| **Tensão→alívio** | Psicologia, Comportamento | próxima, empática | médio, identificável | "isso explica a minha vida" |

> **Berger:** medo, awe e raiva (alta excitação) compartilham mais que tristeza (baixa). Awe é o mais "premium" pro PULSO.

---

## 6. A Assinatura PULSO (o "chiclete que gruda")

- **A Voz do PULSO:** **1 voz travada por idioma** (PT-BR primeiro). Sempre a mesma = reconhecimento (mere-exposure effect).

### 🔒 VOZ OFICIAL TRAVADA (10/06/2026 — aprovada pelo dono)

| Item | Valor |
|---|---|
| Voz ElevenLabs | **Daniel** (`onwK4e9ZLuTAKqWW03F9`) |
| Modelo | `eleven_multilingual_v2` |
| voice_settings | stability 0.45 · similarity 0.85 · style 0.30-0.35 · speaker_boost on |
| **Mixagem obrigatória (receita E)** | pitch −6% + banda estreita + compressão (entonação "cinema" + timbre "rádio-íntima") |

**Cadeia ffmpeg canônica (aplicar em TODA narração):**
```
asetrate=44100*0.94,aresample=44100,atempo=1.0638,highpass=f=90,lowpass=f=9000,bass=g=4:f=130,acompressor=threshold=-22dB:ratio=4:attack=10,loudnorm=I=-13:TP=-1.5
```

> O chiclete não é só a voz — é a voz **+ sempre a mesma mixagem**.
- **Sonic signature:** um **sting** curto (1–2s) recorrente — abertura e/ou no payoff. É o "logo sonoro" que gruda.
- **Bordão de fechamento:** uma frase-marca repetida ("…e o PULSO continua ouvindo.").
- **Visual fixo:** logo discreto no canto, paleta da emoção, template de legenda (a maioria assiste no mudo → **legenda é obrigatória**).

---

## 7. Gatilho de compartilhamento (engenheirar, não torcer)

Antes de fechar o roteiro, marque qual STEPPS (Berger) o vídeo aciona:
- **Moeda social** (quem compartilha parece interessante/inteligente)
- **Gatilho** (associa a algo do cotidiano que relembra o vídeo)
- **Emoção** (alta excitação)
- **Prático** (útil/curioso de passar adiante)
- **História** (embrulhado numa narrativa, não numa lista)

Se o vídeo não aciona **pelo menos 2**, reescrever.

---

## 8. O fechamento (Peak–End — metade da memória mora aqui)

- **Pico perto do fim:** a revelação/arrepio mais forte vem nos últimos segundos.
- **Catarse:** fecha o loop do gancho (paga a dívida de curiosidade).
- **Próximo loop:** abre uma micro-curiosidade pro próximo vídeo ("amanhã: o caso que a polícia apagou").
- **CTA emocional, não mecânico:** "Comenta se você teria coragem." > "deixa o like".

---

## 9. ✅ CHECKLIST DE QC — nenhum roteiro passa sem isto

- [ ] Gancho entrega a isca em **≤2s**, sem introdução
- [ ] Há **1 loop aberto** claro, fechado só no fim
- [ ] **Emoção-âncora** definida e única (§5)
- [ ] Cada frase **avança** (densidade — sem pausa morta)
- [ ] Pattern interrupt visual a cada **2–4s**
- [ ] **Pico** posicionado nos últimos segundos (Peak–End)
- [ ] Aciona **≥2 STEPPS** (§7)
- [ ] Legenda + Voz PULSO + assinatura sonora previstas
- [ ] Fechamento paga o loop **e** abre o próximo
- [ ] Passa no "e se parar agora?" (§4)

---

## 10. Aplicação por faixa (emoção-âncora padrão)

| Faixa | Emoção-âncora | Sonic/Cor |
|---|---|---|
| Mistérios & História | Suspense / medo | drone grave, azul-frio |
| Curiosidades | Admiração / awe | sting brilhante, alto-contraste |
| Psicologia & Comportamento | Tensão→alívio | minimal, tom íntimo |
| Motivacional | Catarse | crescente, dourado |

---

## Notas

- Este harness **trava todo roteiro**. Geração por IA (OpenAI/Gemini/Claude) recebe estas regras como *system prompt*.
- Localização: a mesma estrutura, com **voz nativa e gatilhos culturais** por nacionalidade (não traduzir — **adaptar**).
- Evolui com dados: quando houver métricas reais (retenção/compart.), ajustar as travas pelo que o público confirma.
