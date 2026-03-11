# ✅ CHECKLIST DE IMPLEMENTAÇÃO - PULSO

> **Status Geral: 70% COMPLETO** | Faltam ~2 horas de trabalho focado

---

## 📋 FASE 1: FUNDAÇÃO (✅ 100% COMPLETO)

### Database

- [x] Schemas criados (6 schemas no Supabase)
- [x] Tabelas estruturadas
- [x] RLS configurado
- [x] Relacionamentos definidos

### Documentação

- [x] Ecossistema mapeado
- [x] Workflows documentados
- [x] Banco de dados especificado
- [x] Fluxo de conteúdo definido
- [x] Guia Fase 1 criado
- [x] Mapa completo unificando tudo

### Blueprints

- [x] Blueprint Editorial movido → `docs/50_BLUEPRINTS/06_CONTEUDO_EDITORIAL.md`
- [x] Blueprint Técnico movido → `docs/50_BLUEPRINTS/07_ARQUITETURA_TECNICA.md`
- [x] Todos os 8 blueprints organizados em `docs/50_BLUEPRINTS/`

---

## 📊 FASE 2: POPULAÇÃO DE DADOS (✅ 100% COMPLETO)

### Canais e Séries

- [x] SQL criado com 30 ideias → `content/ideias/fase1_30dias.sql`
- [ ] Executar SQL no Supabase
- [ ] Verificar inserção: `SELECT COUNT(*) FROM pulso_content.ideias;` (deve retornar 30)

**AÇÃO IMEDIATA:**

```sql
-- Copiar conteúdo de: content/ideias/fase1_30dias.sql
-- Colar no Supabase SQL Editor
-- Executar
-- Verificar resultado
```

---

## 🤖 FASE 3: WORKFLOWS N8N (⏳ 30% COMPLETO)

### WF1: Ideias → Roteiros

- [x] Workflow base criado
- [ ] **Atualizar prompts com templates de formato**
- [ ] Testar com Ideia #1 (Efeito Placebo - Psicologia)
- [ ] Validar JSON gerado

**Templates a adicionar no prompt do WF1:**

```markdown
FORMATOS DISPONÍVEIS:

1. CURIOSIDADE RÁPIDA (15-30s)
   Estrutura: Gancho → Fato surpreendente → Twist → CTA
   Exemplo: "Você sabia que [X]? [Fato]. O mais louco: [Twist]!"

2. PSICOLOGIA (20-45s)
   Estrutura: Problema relatable → Explicação científica → Aplicação prática
   Exemplo: "Se você [comportamento], seu cérebro está [razão]. Estudos mostram [ciência]."

3. STORYTELLING (40-60s)
   Estrutura: Situação → Conflito → Resolução → Lição
   Exemplo: "Havia [personagem] que [situação]. Um dia [conflito]. No final [resolução]."

4. MISTÉRIO (60s)
   Estrutura: Evento intrigante → Detalhes perturbadores → Investigação → Final aberto
   Exemplo: "Em [ano], [evento]. Descobriram [detalhe]. Até hoje [mistério]."

5. MOTIVACIONAL (20-35s)
   Estrutura: Verdade dura → Reframing → Call to action
   Exemplo: "[Verdade]. Mas [reframing]. Agora [ação]."
```

**PROMPT ATUALIZADO SUGERIDO:**

```
Você é roteirista especializado em vídeos curtos virais para TikTok/YouTube Shorts.

CONTEXTO DA IDEIA:
- Título: {{$json.titulo}}
- Descrição: {{$json.descricao}}
- Tipo de formato: {{$json.metadata.tipo_formato}}
- Duração alvo: {{$json.metadata.duracao_alvo}}s

INSTRUÇÕES:
1. Use a estrutura do formato especificado acima
2. Linguagem: brasileira, informal, direta
3. Tom: dark, intrigante, com profundidade
4. Gancho: primeiros 3 segundos devem prender
5. CTA: natural, não forçado ("Segue o PULSO", "Comenta se já sentiu isso")

GERE UM ROTEIRO EM JSON:
{
  "titulo": "título otimizado para SEO",
  "gancho": "primeira frase impactante",
  "corpo": "desenvolvimento do conteúdo",
  "twist": "reviravolta ou fato mais impactante",
  "cta": "call to action natural",
  "duracao_estimada": 30,
  "palavras_chave": ["tag1", "tag2", "tag3"]
}
```

### WF2, WF3, WF4, WF5

- [x] Workflows documentados
- [ ] Implementar no n8n Cloud (após validar WF1)

---

## 🎬 FASE 4: PRODUÇÃO DO PRIMEIRO VÍDEO (⏳ 0% COMPLETO)

### Dia 1: Efeito Placebo

**Passo a passo:**

1. **Executar WF1**

   - [ ] Selecionar ideia #1 do banco
   - [ ] Gerar roteiro via OpenAI
   - [ ] Salvar em `pulso_content.roteiros`
   - [ ] Revisar output JSON

2. **Executar WF2 (TTS)**

   - [ ] Pegar roteiro gerado
   - [ ] Enviar para ElevenLabs
   - [ ] Fazer download do áudio
   - [ ] Salvar em Cloudflare R2
   - [ ] Registrar em `pulso_assets.assets_audio`

3. **Executar WF3 (Vídeo)**

   - [ ] Pegar áudio + roteiro
   - [ ] Enviar para Runway/Pexels
   - [ ] Gerar vídeo 9:16
   - [ ] Aplicar identidade visual (palette violeta/azul/amarelo)
   - [ ] Salvar em R2
   - [ ] Registrar em `pulso_assets.assets_video`

4. **Edição Manual** (até automatizar)

   - [ ] Baixar vídeo do R2
   - [ ] Adicionar:
     - Logo PULSO (canto superior)
     - Legendas (estilo TikTok)
     - Transições suaves
     - Efeitos de som (opcional)
   - [ ] Exportar 9:16, 1080x1920

5. **Publicação Manual** (WF4 futuro)

   - [ ] Upload YouTube Shorts
   - [ ] Upload TikTok
   - [ ] Upload Instagram Reels
   - [ ] Upload Kwai
   - [ ] Registrar URLs em `pulso_distribution.publicacoes`

6. **Coleta de Métricas** (WF5 - 48h depois)
   - [ ] Executar workflow de métricas
   - [ ] Salvar em `pulso_analytics.metricas_publicacao`
   - [ ] Analisar: views, likes, shares, comments, watch_time

---

## 📈 FASE 5: ITERAÇÃO E ESCALA (⏳ 0% COMPLETO)

### Análise do Primeiro Vídeo

- [ ] Qual formato performou melhor?
- [ ] Qual plataforma trouxe mais views?
- [ ] CTR do gancho foi alto?
- [ ] Retenção média?
- [ ] Comentários indicam engajamento?

### Ajustes

- [ ] Refinar prompts baseado em aprendizados
- [ ] Ajustar durações se necessário
- [ ] Testar variações de CTA
- [ ] Otimizar thumbnails (se aplicável)

### Escala

- [ ] Produzir dias 2-7 (semana 1)
- [ ] Automatizar edição (explorar ferramentas)
- [ ] Automatizar publicação (APIs das plataformas)
- [ ] Criar dashboard de métricas em tempo real

---

## 🎯 PRÓXIMOS 3 PASSOS CRÍTICOS

### 1️⃣ AGORA MESMO (5 minutos)

```bash
# Executar SQL das 30 ideias
1. Abrir Supabase → SQL Editor
2. Copiar conteúdo de: content/ideias/fase1_30dias.sql
3. Executar
4. Verificar: SELECT COUNT(*) FROM pulso_content.ideias;
```

### 2️⃣ HOJE (30 minutos)

```bash
# Atualizar WF1 com templates de formato
1. Abrir n8n Cloud
2. Editar workflow "01_Ideias_para_Roteiros"
3. Atualizar prompt do nó OpenAI (ver template acima)
4. Testar com ideia #1
5. Validar JSON gerado
```

### 3️⃣ ESTA SEMANA (1-2 horas)

```bash
# Produzir primeiro vídeo completo
1. Executar WF1 → WF2 → WF3
2. Edição manual (CapCut/Premiere)
3. Publicar nas 4 plataformas
4. Aguardar 48h
5. Executar WF5 (métricas)
6. COMEMORAR! 🎉
```

---

## 📊 TRACKING DE PROGRESSO

### Por Semana

**Semana 1** (Dias 1-7)

- [ ] Dia 1: Efeito Placebo (Psicologia)
- [ ] Dia 2: Soldado Sumiu (Mistério)
- [ ] Dia 3: Esgotamento Mental (Psicologia)
- [ ] Dia 4: Ganhou Tudo Perdeu Si Mesmo (Storytelling)
- [ ] Dia 5: Farol Flannan (Mistério)
- [ ] Dia 6: Ninguém Vai Te Salvar (Motivacional)
- [ ] Dia 7: Memórias Falsas (Curiosidade)

**Semana 2** (Dias 8-14)

- [ ] Dia 8: Procrastinação = Ansiedade
- [ ] Dia 9: Menina Pessimista
- [ ] Dia 10: Avião Fantasma
- [ ] Dia 11: Nunca É Tarde
- [ ] Dia 12: Música e Dopamina
- [ ] Dia 13: Ansiedade Social
- [ ] Dia 14: Homem que Reclamava

**Semana 3** (Dias 15-21)

- [ ] Dia 15: Déjà Vu Infinito
- [ ] Dia 16: Não Precisa Ser Perfeito
- [ ] Dia 17: Plot Twists
- [ ] Dia 18: Efeito Manada
- [ ] Dia 19: Escolha de 5 Segundos
- [ ] Dia 20: Pripyat
- [ ] Dia 21: Talvez Só Cansado

**Semana 4** (Dias 22-28)

- [ ] Dia 22: Memória e Cheiro
- [ ] Dia 23: Padrões Ruins
- [ ] Dia 24: Relógio Quebrado
- [ ] Dia 25: Sinal WOW
- [ ] Dia 26: Futuro Eu
- [ ] Dia 27: Tempo Acelera
- [ ] Dia 28: Apego Relacionamentos

**Semana 5** (Dias 29-30)

- [ ] Dia 29: Vizinho Invisível
- [ ] Dia 30: Objetos do Nada

### Métricas de Sucesso (após 30 dias)

**Mínimo Viável:**

- [ ] 30 vídeos publicados (1/dia)
- [ ] 4 plataformas ativas
- [ ] Pelo menos 10k views totais
- [ ] 100+ seguidores em cada plataforma

**Objetivo Ideal:**

- [ ] 50k+ views totais
- [ ] 500+ seguidores/plataforma
- [ ] 1-2 vídeos virais (>100k views)
- [ ] Comentários engajados em 50%+ dos vídeos

**Excelente:**

- [ ] 200k+ views totais
- [ ] 2k+ seguidores/plataforma
- [ ] 5+ vídeos virais
- [ ] Parcerias ou oportunidades de monetização aparecendo

---

## 🔧 FERRAMENTAS NECESSÁRIAS

### Essenciais

- [x] Supabase (banco de dados)
- [x] n8n Cloud (automação)
- [ ] OpenAI API key configurada no n8n
- [ ] ElevenLabs API key
- [ ] Cloudflare R2 configurado
- [ ] Runway/Pexels API

### Publicação

- [ ] Conta YouTube (criador)
- [ ] Conta TikTok
- [ ] Conta Instagram Business
- [ ] Conta Kwai

### Edição (temporário até automatizar)

- [ ] CapCut ou Adobe Premiere
- [ ] Canva (thumbnails/logos)

---

## 💡 DICAS DE OURO

1. **Não busque perfeição no primeiro vídeo**

   - Melhor: publicar imperfeito e iterar
   - Pior: ficar semanas ajustando

2. **Analise métricas de RETENÇÃO, não só views**

   - Se as pessoas assistem <50%, o gancho está fraco
   - Se dropam nos primeiros 3s, mude o hook

3. **Use os comentários como pesquisa**

   - Pessoas pedem temas? Anote!
   - Algum assunto gera polêmica? Explore mais

4. **Teste horários de publicação**

   - TikTok: 19h-22h (noite)
   - Instagram: 12h-13h e 18h-20h
   - YouTube Shorts: 15h-18h

5. **Seja consistente MAS sustentável**
   - Melhor 3x/semana por meses do que 7x/semana por 2 semanas

---

## 🆘 TROUBLESHOOTING RÁPIDO

**Problema: SQL não executa no Supabase**

- Verifique se canais e séries existem
- Rode primeiro os INSERTs de `pulso_core.canais` e `pulso_core.series`

**Problema: WF1 não gera roteiro bom**

- Ajuste temperatura do modelo (tente 0.7-0.9)
- Adicione exemplos reais no prompt
- Teste com modelos diferentes (GPT-4 > GPT-3.5)

**Problema: Áudio do ElevenLabs não é natural**

- Teste vozes diferentes (PT-BR: "Antonio", "Camila")
- Ajuste stability e clarity sliders
- Use SSML tags para pausas: `<break time="0.5s"/>`

**Problema: Vídeo gerado pelo Runway é genérico**

- Seja MUITO específico no prompt
- Use termos técnicos: "close-up", "dutch angle", "cinematic"
- Referende estilos visuais: "no estilo de Black Mirror"

**Problema: Vídeo não viraliza**

- Analise: gancho prende nos 3s?
- Legendas estão visíveis e rápidas?
- CTA é claro e fácil de seguir?
- Hashtags estão relevantes?

---

## 🎉 CELEBRE MARCOS

- [ ] Primeiro roteiro gerado ✅
- [ ] Primeiro áudio gerado ✅
- [ ] Primeiro vídeo completo ✅
- [ ] Primeira publicação ✅
- [ ] 100 views ✅
- [ ] 1.000 views ✅
- [ ] 10.000 views ✅
- [ ] Primeiro seguidor ✅
- [ ] 100 seguidores ✅
- [ ] Primeiro comentário engajado ✅
- [ ] Primeiro vídeo viral (>100k) ✅
- [ ] Primeiro mês completo ✅

---

**Última atualização:** 20/11/2025
**Próxima revisão:** Após primeiro vídeo publicado

---

> **Lembre-se:** Você já fez 70% do trabalho. Os últimos 30% são execução. Não pense. FAÇA. 🚀
