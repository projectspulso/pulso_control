# Série "Como se constrói um canal sozinho" — bastidores do PULSO

> **Formato:** vídeo longo, 8–12 min · **Cadência:** 1/semana · **Canal:** YouTube (@pulsohistorias)
> **Criado em:** 2026-08-24
> **Origem:** decisão do dono após a auditoria de conformidade — ver
> [`Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md`](../../../Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md)

---

## Por que esta série existe (a razão que não é criativa)

O canal tem **0 horas qualificadas de exibição** em 365 dias. Não é falta de audiência — é que
**Shorts não geram hora qualificada**. O YPP tem dois caminhos e o PULSO está em um beco:

| Caminho | Meta | Hoje | Distância |
|---|---|---|---|
| Views qualificadas de Shorts / 90d | 3.000.000 | 33.000 | **91×** |
| **Horas de exibição / 365d** | **3.000** | **0** | canal não tem vídeo longo |

O caminho dos Shorts exige multiplicar por 91 — não acontece por acúmulo, só por viralização.
O caminho das horas **nunca começou** porque nunca houve um vídeo longo no canal.

Conta simples: 1 vídeo de 10 min, com 40% de retenção média e 1.000 views, rende ~67 horas.
44 vídeos assim = 3.000 horas. **Um por semana, e o segundo requisito do YPP fecha em menos de um ano** —
enquanto o caminho dos Shorts continua a 91× de distância.

E tem um segundo motivo, que é de risco: **este conteúdo é 100% original e livre de direitos de
terceiros.** Prints do próprio app, decisões próprias, números próprios. Sem b-roll gerado, sem
trilha de origem duvidosa, sem acervo de terceiro. É o oposto exato do problema que a auditoria
encontrou no acervo de Shorts.

---

## A tese editorial

**O que a série NÃO é:** tutorial de "como criar canal dark", promessa de renda, curso disfarçado.

**O que a série É:** o registro honesto de uma pessoa que operou ótica por 20 anos, virou
construtor de software, e está montando um canal e uma empresa em público — **incluindo os erros,
com os números na tela**.

O diferencial defensável: **quase ninguém mostra o painel de verdade.** A série mostra o Studio, o
banco, o extrato de custo, o commit que quebrou tudo. O ativo aqui é a prova, não a opinião.

**Regra dura da série:** todo número dito em voz alta aparece na tela, lido do painel real. Nada de
número de memória. Se não dá para mostrar, não entra no roteiro.

### Voz e forma

- Primeira pessoa, sem persona de guru. O erro é contado como erro, não como "aprendizado incrível".
- Sem thumbnail de cara espantada. O que vende aqui é o número na tela.
- Ritmo: corte a cada 4–8 s, mas sem a pressa do Short — aqui existe espaço para respirar.
- Narração: mesma voz do canal (ElevenLabs, `GmzLAnPHSUkxG3P5yfca`) para manter identidade sonora.
- **Rotulagem:** episódios feitos só de captura de tela + narração sintética. A voz é sintética e
  **precisa ser declarada** no campo "Uso de IA" do Studio. Não há cena gerada, então não há
  "simulação realista de evento" — mas a narração sintética entra na política. **Declarar.**

---

## Temporada 1 — 10 episódios

| # | Título de trabalho | Gancho central | Material real disponível |
|---|---|---|---|
| **01** | O bug de um caractere que parou tudo por 6 meses | Uma aspa faltando congelou o sistema inteiro e ninguém percebeu | `changelog.md` linha 79 — pg_cron job 9, JSON malformado |
| **02** | Quanto custa, de verdade, publicar 1 vídeo por dia | Extrato real: R$ 2.168,48 por 8.144 créditos | `pulso_guard.py`, ledger de render, cascata de custo |
| **03** | Eu estava contando o custo errado — em 2,3× | O painel mentia e ninguém sabia | `gen_scenes.py` linhas 386-392, correção de 01/08 |
| **04** | O Facebook estrangula quem publica por API — o teste A/B | 0-2 plays em 13h × 232 plays em 40 min | teste de 11/07, decisão de FB manual |
| **05** | Tomei shadowban por um detalhe idiota | Marca d'água de outra rede | histórico TikTok |
| **06** | O algoritmo me disse o que escrever — e eu não gostei | História/arqueologia detém 6 de 6 estouros; tecnologia morreu | módulo `/decisor`, placar tema×rede |
| **07** | Como se faz uma voz que não existe | Voice Design do zero + travas de sotaque pt-BR | `ai-clients.ts`, `previous_text` como âncora |
| **08** | Descobri que minha marca já é de outra empresa | Editora Globo tem 5 registros PULSO em vigor | busca INPI de 24/08/2026 |
| **09** | O gate que eu estava perseguindo era o errado | Mirava 3M de views; o gate real estava a 18 seguidores | auditoria, painéis YouTube e Meta |
| **10** | 100 dias publicando todo dia: o que sobrou | Balanço honesto, números finais, o que continua | banco, série `leituras_metricas` |

**Ordem de produção sugerida:** 01 → 04 → 02 → 09 → 06 → 03 → 07 → 05 → 08 → 10.
O 01 é o piloto porque é o mais narrativo. O 08 depende de parecer do advogado — **não gravar
antes** (falar de colidência de marca em público sem orientação jurídica é criar prova contra si).

---

# ROTEIRO — EP. 01

## "O bug de um caractere que parou tudo por 6 meses"

**Duração alvo:** 9–11 min · **Retenção alvo:** ≥40%

> **Nota de produção:** todo bloco `[TELA]` é captura real. Nada de mockup. Se o print não
> existir, o bloco sai do roteiro — não se substitui por reconstituição.

---

### BLOCO 0 — GANCHO (0:00–0:20)

**[TELA] Terminal, erro em vermelho, zoom lento:**
`invalid input syntax for type json, Token "Content" is invalid`

**NARRAÇÃO:**
> Esse erro apareceu duzentas e quarenta e uma vezes.
> Todo dia. Cinco em cinco minutos. Durante seis meses.
> E eu não vi nenhuma delas.

**[TELA] Corte seco para o painel do canal, gráfico chapado no zero.**

> Porque ele não aparecia em lugar nenhum. Falhava calado.

**[TELA] Cartela: "O BUG DE UM CARACTERE"**

---

### BLOCO 1 — CONTEXTO (0:20–2:00)

**[TELA] Tour rápido pelo kanban do app — colunas Ideia → Roteiro → Áudio → Edição → Publicado.**

**NARRAÇÃO:**
> Deixa eu te mostrar o que era pra estar acontecendo aqui.
>
> Eu construí uma esteira. Uma ideia entra de um lado, e do outro sai um vídeo publicado em cinco
> redes. Roteiro, narração, cenas, montagem, publicação, coleta de métrica. Tudo automático,
> menos uma coisa: **nada é publicado sem eu confirmar.** Isso foi decisão, não limitação.

**[TELA] `vercel.json`, lista de crons, destaque no `processar-fila-auto`.**

> No meio dessa esteira tem um trabalhador. A cada cinco minutos ele acorda, olha a fila, pega o
> próximo item e empurra pra frente. É o coração da coisa.
>
> Em trinta e um de março, ele parou. E continuou parecendo vivo.

**[TELA] Print da fila: 403 itens em PENDENTE.**

> Quatrocentos e três itens parados. A fila só enchia.

---

### BLOCO 2 — A INVESTIGAÇÃO (2:00–5:30)

**NARRAÇÃO:**
> A primeira coisa que eu fiz foi a errada: fui olhar o código do trabalhador. Ele estava certo.
> Rodava perfeito quando eu chamava na mão.

**[TELA] `curl` na rota do orchestrator, resposta 200.**

> Chamava direto, funcionava. Deixava automático, morria. E não deixava rastro.

**[TELA] Query em `cron.job_run_details`, resultado com a coluna de erro.**

> Aí eu descobri que existe uma tabela que guarda o histórico de cada execução agendada. E ela
> estava cheia da mesma mensagem, repetida até não caber na tela.

**[TELA] Zoom no erro. Ao lado, o comando do cron:**
```
headers := '{Content-Type: application/json}'::jsonb
```

**NARRAÇÃO:**
> Olha isso. Consegue ver?
>
> *(pausa de 2s)*
>
> Isso aqui não é JSON. JSON exige aspas duplas nas chaves e nos valores. O que está aí é texto
> solto dentro de chaves. Eu escrevi assim, o banco aceitou na hora de agendar, e só reclamou na
> hora de executar — cinco em cinco minutos, num lugar que eu nunca tinha aberto.

**[TELA] Lado a lado, errado × certo:**
```
❌ '{Content-Type: application/json}'::jsonb
✅ '{"Content-Type": "application/json"}'::jsonb
```

> Quatro aspas. A diferença entre um sistema vivo e seis meses de fila parada são **quatro aspas**.

---

### BLOCO 3 — O CONSERTO (5:30–7:00)

**[TELA] `cron.unschedule(9)` seguido do `cron.schedule` novo.**

**NARRAÇÃO:**
> O conserto levou menos de um minuto. Desagendei o job quebrado, agendei de novo com as aspas no
> lugar.

**[TELA] Terminal com 10 chamadas paralelas. Contador da fila caindo: 403 → 397 → 390.**

> E aí eu fiquei olhando isso aqui por uns bons minutos.
>
> Quatrocentos e três. Trezentos e noventa e sete. Trezentos e noventa.
>
> Seis meses de trabalho represado começando a andar.

---

### BLOCO 4 — A LIÇÃO REAL (7:00–9:30)

**NARRAÇÃO:**
> Agora, a parte que interessa. Porque "faltou uma aspa" não é a lição.

**[TELA] Cartela: "1. Falha silenciosa é pior que falha barulhenta"**

> Se aquele erro tivesse me mandado um e-mail na primeira vez, eu teria consertado em trinta e um
> de março. O problema nunca foi o erro. Foi ele ser **mudo**.
>
> Sistema que quebra fazendo barulho custa uma tarde. Sistema que quebra calado custa seis meses.

**[TELA] Cartela: "2. Eu olhava a métrica errada"**

> Eu acompanhava vídeos publicados. Não acompanhava **tamanho da fila**. Publicados continuava
> parecendo aceitável porque eu ia empurrando na mão sem perceber que estava empurrando na mão.

**[TELA] Print do alarme de saúde, hoje ativo.**

> Hoje existe um alarme. Se a fila passa de um tamanho, eu recebo aviso. Foi a única coisa boa que
> saiu desse episódio.

**[TELA] Cartela: "3. O log que ninguém abre não é log"**

> Aquela tabela sempre esteve lá. Com tudo escrito. Eu é que nunca tinha aberto.
>
> Log que você não olha é só disco ocupado.

---

### BLOCO 5 — FECHAMENTO (9:30–10:30)

**[TELA] Painel de hoje: publicações, views, dias seguidos.**

**NARRAÇÃO:**
> De lá pra cá foram mais de quatrocentas e setenta publicações, quase trezentas mil visualizações,
> e mais de cinquenta dias seguidos sem furo.
>
> Tudo isso estava esperando atrás de quatro aspas.

*(pausa)*

> Eu abri o canal e a empresa em público de propósito. Não pra mostrar que dá certo — pra mostrar
> **quanto** tem que dar errado antes.
>
> No próximo episódio eu abro o extrato: quanto custa, em real, publicar um vídeo por dia.
> O número me assustou.

**[TELA] Cartão de inscrição + próximo vídeo.**

---

# ROTEIRO — EP. 04

## "O Facebook estrangula quem publica por API — eu testei"

**Duração alvo:** 8–10 min

> **Nota de produção:** este episódio é o mais acionável da temporada. Números de teste A/B real.

---

### BLOCO 0 — GANCHO (0:00–0:25)

**[TELA] Dois prints lado a lado, mesmo vídeo, mesma página, mesmo dia.**

**NARRAÇÃO:**
> Mesmo vídeo. Mesma página. Mesmo dia.
>
> Um deles teve **duzentos e trinta e dois** plays em quarenta minutos.
> O outro teve **dois** em treze horas.

*(pausa)*

> A única diferença entre os dois foi **como** eu publiquei.

**[TELA] Cartela: "O TESTE QUE MUDOU MINHA OPERAÇÃO"**

---

### BLOCO 1 — O PROBLEMA (0:25–2:30)

**[TELA] Painel de views por rede: Facebook liderando com folga.**

**NARRAÇÃO:**
> O Facebook é, de longe, a minha maior rede. Mais alcance que YouTube, TikTok e Instagram juntos.
> O que não é intuitivo — todo mundo diz que Facebook morreu. Nos meus números, não morreu.
>
> Então eu automatizei a publicação lá. Óbvio, né? Maior rede, mais motivo pra automatizar.

**[TELA] Código da função de publicação via Graph API.**

> Escrevi a integração, testei, funcionou. Vídeo subia sozinho.
>
> E o alcance despencou.

---

### BLOCO 2 — O TESTE (2:30–5:30)

**NARRAÇÃO:**
> Podia ser o conteúdo. Podia ser o horário. Podia ser azar.
> Só tinha um jeito de saber.

**[TELA] Cartela: "O desenho do teste"**

> Mesmo vídeo. Mesma página. Mesmo dia. Uma cópia publicada pela API, outra publicada na mão pelo
> Business Suite. Tudo igual, menos o caminho.

**[TELA] Resultado, número por número.**

> Pela API: **dois plays em treze horas.**
> Na mão: **duzentos e trinta e dois plays em quarenta minutos.**

*(pausa)*

> Não é margem de erro. Não é variação de horário. É outra ordem de grandeza.

---

### BLOCO 3 — A DECISÃO DIFÍCIL (5:30–7:30)

**NARRAÇÃO:**
> Aqui é onde dói. Porque eu tinha acabado de construir aquela automação.

**[TELA] Commit que muda o padrão para excluir o Facebook.**

> E eu desliguei.
>
> Hoje o Facebook é a única rede que eu publico **na mão**, toda vez. A rede que mais me dá
> resultado é a que menos eu automatizei.

**[TELA] Comentário real no código.**

> Deixei escrito no código o porquê, com a data do teste. Porque daqui a seis meses eu ia olhar
> aquilo e pensar "por que isso está manual?" e ia religar sem lembrar.

---

### BLOCO 4 — O QUE ISSO ENSINA (7:30–9:00)

**[TELA] Cartela: "Automatizar não é sempre melhor"**

**NARRAÇÃO:**
> A lição não é "não automatize". É que **automação tem custo escondido**, e às vezes o custo é
> exatamente aquilo que você queria ganhar.
>
> Eu automatizei pra ganhar tempo. Perdi noventa e nove por cento do alcance. O tempo que eu
> economizei não valia nada.

**[TELA] Cartela: "Teste, não confie"**

> Eu podia ter lido num fórum que a Meta penaliza publicação por API. Ia acreditar? Talvez.
> Ia agir? Provavelmente não.
>
> O que me fez agir foi ver **dois** e **duzentos e trinta e dois** na minha própria página.

---

### BLOCO 5 — FECHAMENTO (9:00–9:45)

**NARRAÇÃO:**
> Se você automatiza publicação em qualquer rede, faz esse teste. Um vídeo, dois caminhos, mesmo dia.
> Leva uma tarde e pode te devolver a rede inteira.
>
> No próximo, o algoritmo me disse qual assunto escrever — e eu não gostei da resposta.

---

# ROTEIRO — EP. 09

## "O gate que eu perseguia era o errado"

**Duração alvo:** 10–12 min

> **Nota de produção:** episódio mais recente e mais honesto da temporada. Baseado na auditoria de
> 24/08/2026. Todos os prints são dos painéis reais.

---

### BLOCO 0 — GANCHO (0:00–0:30)

**[TELA] Print do Studio: "33 mil / 3 milhões"**

**NARRAÇÃO:**
> Eu passei três meses perseguindo esse número. Três milhões de visualizações em noventa dias.
> Estou em trinta e três mil. Um vírgula um por cento.
>
> No ritmo atual, eu não chego nunca.

**[TELA] Corte para o Business Suite: "482 seguidores".**

> Aí eu abri outro painel, por outro motivo, e vi isso.
>
> Quatrocentos e oitenta e dois. E o programa libera com quinhentos.

*(pausa)*

> Faltavam **dezoito**. E eu não sabia que esse programa existia.

---

### BLOCO 1 — COMO EU ERREI (0:30–3:30)

**[TELA] Documento interno com a tabela de gates.**

**NARRAÇÃO:**
> Eu tinha uma planilha. Fiz pesquisa, anotei os requisitos de cada rede, revisei.
>
> E ela estava errada — não porque os números estavam errados, mas porque eu tinha listado **um**
> programa por plataforma. Como se cada rede tivesse um jeito só de pagar criador.

**[TELA] Lista dos programas da Meta: Monetização de Conteúdo, Assinaturas, Estrelas.**

> A Meta tem três. Eu tinha anotado o de cinco mil seguidores e parado ali.
>
> O de **quinhentos** estava na mesma tela. Eu nunca rolei a página.

---

### BLOCO 2 — A ARMADILHA DOS SHORTS (3:30–6:30)

**[TELA] Studio → Ganhos, as duas barras.**

**NARRAÇÃO:**
> Aqui tem uma armadilha que eu quero que você veja com cuidado.
>
> O YouTube tem dois caminhos. Ou três mil horas de exibição, ou três milhões de views de Shorts.
> Olha as minhas barras.

**[TELA] Zoom: "0 hora" e "33 mil".**

> Zero horas. E não é porque ninguém assiste — é porque **Short não gera hora qualificada**.
> Meu canal é cem por cento Short. Eu tranquei sozinho um dos dois caminhos, sem saber.

**[TELA] Cálculo na tela.**

> E tem mais. Eu tenho trinta e uma mil visualizações em vinte e oito dias. Mas o painel de
> monetização conta trinta e três mil em **noventa** dias.
>
> As views que contam pra monetização são menos que as views que aparecem no painel. São réguas
> diferentes, e eu estava lendo a mais generosa.

---

### BLOCO 3 — O QUE MAIS APARECEU (6:30–9:30)

**NARRAÇÃO:**
> Já que eu estava com os painéis abertos, resolvi olhar tudo.

**[TELA] Filtro de reivindicações de direitos autorais, vazio.**

> Boa notícia primeiro: cento e quarenta e seis vídeos, zero reivindicação de direitos autorais.

**[TELA] Campo "Uso de IA" com os dois botões em branco.**

> Notícia ruim: esse campo aqui.
>
> O YouTube pergunta se eu usei IA pra gerar o conteúdo. Não está marcado "sim". **Nem "não".**
> Está em branco. Em todos os vídeos.
>
> Porque eu publico por API, e o meu código nunca mandou esse campo. O campo do lado — se é
> conteúdo infantil — está preenchido. Esse não.

*(pausa)*

> Eu não escondi de propósito. Mas o efeito é o mesmo: cento e quarenta e seis vídeos feitos com
> IA, sem declarar que foram feitos com IA. E as ferramentas que eu uso deixam marca no arquivo —
> a plataforma sabe de qualquer jeito.
>
> Não declarar não esconde nada. Só parece tentativa de esconder.

---

### BLOCO 4 — O QUE EU MUDEI (9:30–11:00)

**[TELA] O commit que adiciona a declaração de IA.**

**NARRAÇÃO:**
> Primeira coisa: o código agora declara. Todo vídeo novo sobe com o campo marcado.

**[TELA] Lista de pendências no Cockpit.**

> Segunda: parei de perseguir o gate errado.

**[TELA] Cartela: "Abrir o painel > ler a documentação"**

> E a lição que eu levo:
>
> Eu tinha tudo isso documentado. Escrito, organizado, revisado. E estava errado em quatro pontos
> diferentes — não por descuido, mas porque documentação envelhece e painel não.
>
> Uma tarde abrindo os painéis de verdade valeu mais que três meses de planilha.

---

### BLOCO 5 — FECHAMENTO (11:00–11:45)

**NARRAÇÃO:**
> Se você tem canal, faz isso hoje: abre a página de monetização de cada rede e **rola até o fim**.
> Não lê resumo, não confia em vídeo de gringo, não confia nem no seu próprio documento de seis
> meses atrás.
>
> Pode ser que falte dezoito.

---

## Checklist de produção por episódio

```
[ ] Roteiro revisado — todo número dito tem print correspondente
[ ] Capturas de tela REAIS coletadas (sem mockup, sem reconstituição)
[ ] Dados sensíveis borrados nos prints — tokens, chaves, e-mails, IDs de conta
[ ] Narração gerada (voz oficial GmzLAnPHSUkxG3P5yfca)
[ ] Montagem ≥8 min
[ ] Miniatura: número na tela, sem cara de espanto
[ ] Título sem promessa de renda
[ ] ⚠️ CAMPO "USO DE IA" MARCADO COMO SIM (narração sintética)
[ ] Descrição declara: "narração por voz sintética; capturas de tela reais do sistema"
[ ] Sem trilha de origem não documentada — silêncio ou biblioteca licenciada
[ ] Publicado como vídeo LONGO (não Short) — senão não gera hora qualificada
```

## O que medir

| Métrica | Por quê | Meta inicial |
|---|---|---|
| **Horas de exibição acumuladas** | é o objetivo real da série | +67h por episódio |
| Retenção média (%) | abaixo de 35% o formato não sustenta | ≥40% |
| Retenção aos 30s | mede se o gancho segura | ≥70% |
| Inscritos por vídeo | bastidores converte melhor que Short | ≥15 |

⚠️ **Critério de morte:** se depois de 4 episódios a retenção média ficar abaixo de 30%, o formato
está errado — encurtar para 6 min ou mudar a abordagem. Não insistir por teimosia; foi exatamente
esse tipo de teimosia que a série se propõe a documentar.
