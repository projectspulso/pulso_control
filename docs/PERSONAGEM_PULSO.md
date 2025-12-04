# 🎭 PULSO - Personagem Metamórfico

**Criado em:** 04/12/2025  
**Conceito:** Um personagem único que se adapta ao contexto

---

## 🧠 CONCEITO

O **Pulso** é um personagem metamórfico que:
- Mantém sua **identidade core** (voz base, personalidade essencial)
- **Adapta sua forma visual** conforme o canal
- **Modifica sua entonação** baseado no tema
- Cria **conexão emocional** diferente para cada audiência

### Por que um personagem só?

✅ **Branding coeso** - Uma identidade reconhecível  
✅ **Economia** - Uma voz, múltiplas emoções  
✅ **Flexibilidade** - Se adapta sem perder essência  
✅ **Narrativa** - "Pulso se transforma para te guiar"

---

## 🎨 VARIAÇÕES POR CANAL

### 1️⃣ PSICOLOGIA

**Visual:**
- Cores terrosas (#8B7355, #D4A574, #F5E6D3)
- Expressão calma, acolhedora
- Postura relaxada

**Voz:**
- Speed: 0.9 (10% mais devagar)
- Pitch: -0.1 (tom mais grave)
- Stability: 0.8 (mais estável, menos variação)
- Estilo: Reflexivo, pausado

**Descrição:**  
_"Pulso assume uma forma calma e acolhedora. Sua voz pausada e reflexiva cria um ambiente seguro para explorar a mente humana."_

---

### 2️⃣ FATOS INUSITADOS

**Visual:**
- Cores vibrantes (#FF6B35, #F7931E, #FDC830)
- Expressão curiosa, empolgada
- Olhos arregalados, sorriso animado

**Voz:**
- Speed: 1.1 (10% mais rápido)
- Pitch: 0.1 (tom mais agudo)
- Stability: 0.5 (mais variado, animado)
- Estilo: Empolgado, surpreendente

**Descrição:**  
_"Pulso fica empolgado e curioso! Sua voz rápida e animada te surpreende a cada fato inusitado."_

---

### 3️⃣ TECNOLOGIA

**Visual:**
- Cores futuristas (#667EEA, #764BA2, #00D4FF)
- Expressão confiante, moderna
- Elementos tech (neon, grids)

**Voz:**
- Speed: 1.0 (velocidade padrão)
- Pitch: 0.0 (tom neutro)
- Stability: 0.7 (moderado)
- Estilo: Profissional, preciso

**Descrição:**  
_"Pulso assume forma futurista. Voz moderna e precisa para navegar o mundo tech."_

---

### 4️⃣ DEFAULT (Outros canais)

**Visual:**
- Gradiente padrão (#6366F1, #8B5CF6, #EC4899)
- Expressão neutra, versátil

**Voz:**
- Speed: 1.0
- Pitch: 0.0
- Stability: 0.7
- Estilo: Equilibrado

---

## 🗄️ ESTRUTURA NO BANCO

```sql
-- 1 registro na tabela personagens
{
  "nome": "Pulso",
  "tipo": "AVATAR_ADAPTATIVO",
  "metadata": {
    "voz": {
      "provedor": "openai",      -- ou elevenlabs
      "voz_base_id": "alloy",
      "modelo": "tts-1-hd"
    },
    "variacoes": {
      "psicologia": { ... },
      "fatos_inusitados": { ... },
      "tecnologia": { ... },
      "default": { ... }
    }
  }
}
```

---

## 🤖 COMO OS WORKFLOWS USAM

### WF02 - Gerar Áudio

```javascript
// 1. Buscar ideia com canal
const ideia = $('Buscar Ideia').item.json;
const canalSlug = ideia.canal.slug; // 'psicologia'

// 2. Buscar Pulso
const pulso = await db.query(
  'SELECT * FROM personagens WHERE nome = $1',
  ['Pulso']
);

// 3. Selecionar variação
const variacoes = pulso.metadata.variacoes;
const variacao = variacoes[canalSlug] || variacoes.default;

// 4. Gerar áudio com configuração específica
const audio = await openai.audio.speech.create({
  model: 'tts-1-hd',
  voice: pulso.metadata.voz.voz_base_id,
  input: roteiro.texto,
  speed: variacao.voz.speed  // 0.9 para psicologia, 1.1 para fatos
});
```

### WF03 - Gerar Vídeo

```javascript
// 1. Selecionar avatar visual correto
const avatarPath = `/avatars/${variacao.visual}`;
// → /avatars/pulso_psicologia.png

// 2. Usar cores da variação
const cores = variacao.cores;
// → ['#8B7355', '#D4A574', '#F5E6D3']

// 3. Gerar vídeo com avatar + áudio
const video = await ffmpeg({
  input: audioPath,
  image: avatarPath,
  filters: `colorize(${cores.join(',')})`
});
```

---

## 📁 ASSETS NECESSÁRIOS

Você precisa criar estes arquivos visuais:

```
public/avatars/
  ├── pulso_psicologia.png           # Calmo, cores terra
  ├── pulso_fatos_inusitados.png     # Animado, cores vibrantes
  ├── pulso_tecnologia.png           # Futurista, azul/roxo
  └── pulso_default.png              # Base padrão

Specs sugeridas:
- Resolução: 1024x1024 (quadrado)
- Formato: PNG com transparência
- Estilo: Avatar/mascote minimalista
- Background: Transparente ou cor sólida
```

---

## 🎤 PROVEDORES DE VOZ

### Opção 1: OpenAI TTS (Atual)

**Vantagens:**
- ✅ Já integrado
- ✅ Qualidade boa
- ✅ Parâmetro `speed` (0.25 a 4.0)

**Limitações:**
- ❌ Não tem `pitch` (tom)
- ❌ Não tem `stability` (controle emocional)
- ❌ Só `speed` para diferenciar

**Custo:** $15/1M caracteres

**Código:**
```javascript
const audio = await openai.audio.speech.create({
  model: 'tts-1-hd',
  voice: 'alloy',
  input: text,
  speed: 1.1  // Único parâmetro disponível
});
```

---

### Opção 2: ElevenLabs (Recomendado)

**Vantagens:**
- ✅ `stability` (0-1): controla variação emocional
- ✅ `similarity_boost` (0-1): mantém identidade
- ✅ `style` (0-1): expressividade
- ✅ Mesma voz, emoções diferentes

**Limitações:**
- ❌ Precisa conta (tem free tier)
- ❌ Mais caro que OpenAI

**Custo:**
- Free: 10k chars/mês
- Starter: $5/30k chars

**Código:**
```javascript
const audio = await elevenlabs.textToSpeech({
  voice_id: 'voice_id_pulso',
  text: text,
  voice_settings: {
    stability: 0.8,        // Psicologia: estável
    similarity_boost: 0.8, // Mantém identidade
    style: 0.3            // Menos dramático
  }
});
```

---

### Opção 3: Google Cloud TTS

**Vantagens:**
- ✅ `pitch` (-20 a 20 semitons)
- ✅ `speakingRate` (0.25 a 4.0)
- ✅ Mais controle que OpenAI

**Custo:** $4/1M caracteres

**Código:**
```javascript
const [response] = await client.synthesizeSpeech({
  input: { text },
  voice: {
    languageCode: 'pt-BR',
    name: 'pt-BR-Standard-A'
  },
  audioConfig: {
    audioEncoding: 'MP3',
    pitch: -2.0,           // Tom mais grave
    speakingRate: 0.9      // Mais devagar
  }
});
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Esta semana)
- [x] Criar estrutura no banco
- [x] Inserir Pulso com variações
- [ ] Executar script SQL
- [ ] Criar assets visuais básicos (pode ser placeholder)

### Fase 2: Voz (Semana que vem)
- [ ] Testar variações com OpenAI (apenas speed)
- [ ] Avaliar se precisa ElevenLabs (pitch/stability)
- [ ] Atualizar WF02 para usar variações
- [ ] Testar áudio com diferentes entonações

### Fase 3: Vídeo (Em breve)
- [ ] Criar WF03 para gerar vídeo
- [ ] Integrar avatar visual correto
- [ ] Aplicar cores da variação
- [ ] Testar pipeline completo

### Fase 4: Refinamento (Futuro)
- [ ] Coletar feedback sobre vozes
- [ ] Ajustar parâmetros (speed, pitch, etc)
- [ ] Criar mais variações se necessário
- [ ] A/B test de diferentes configurações

---

## 💡 EXEMPLOS DE USO

### Exemplo 1: Roteiro de Psicologia

```javascript
Canal: Psicologia
Roteiro: "Você sabia que nosso cérebro processa..."

→ Pulso assume forma calma (pulso_psicologia.png)
→ Voz devagar (speed: 0.9), tom grave
→ Cores terrosas no vídeo
→ Resultado: Atmosfera reflexiva e acolhedora
```

### Exemplo 2: Fato Inusitado

```javascript
Canal: Fatos Inusitados
Roteiro: "Você não vai acreditar! Existe uma ilha..."

→ Pulso assume forma empolgada (pulso_fatos_inusitados.png)
→ Voz rápida (speed: 1.1), tom agudo
→ Cores vibrantes no vídeo
→ Resultado: Energia e surpresa
```

---

## ❓ DÚVIDAS E DECISÕES

### 1. Quantas variações criar inicialmente?

**Sugestão:** Começar com 3 (Psicologia, Fatos, Tech) + Default

### 2. OpenAI ou ElevenLabs?

**Fase 1:** OpenAI (já integrado, só speed)  
**Fase 2:** Testar ElevenLabs se precisar mais controle

### 3. Como criar os avatares visuais?

**Opções:**
- DALL-E 3 / Midjourney (gerar IA)
- Designer gráfico (profissional)
- Placeholder inicial (círculo colorido com emoji)

### 4. Precisa de múltiplas vozes base?

**Não.** Uma voz (ex: Alloy) com variações é suficiente.

---

## 📋 PRÓXIMOS PASSOS

1. **Executar script SQL** (`inserir_personagem_pulso.sql`)
2. **Criar placeholders visuais** (mesmo que simples)
3. **Atualizar WF02** para buscar variação do Pulso
4. **Testar áudio** com speed diferente por canal
5. **Validar conceito** antes de criar assets finais

---

**Filosofia do Pulso:**  
_"Um personagem, infinitas formas. Adapta-se ao contexto sem perder sua essência."_
