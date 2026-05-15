# Pendencias do Usuario para Fechar o MVP

Data de referencia: 15 de maio de 2026

## Decisoes que dependem de voce

1. Confirmar a voz MVP do Pulso.
   - Recomendacao atual: voz masculina jovem-adulta, curiosa, direta e levemente misteriosa.
   - Caminho mais simples: OpenAI TTS com uma voz base unica no primeiro lote.
   - Nao decidir agora: voz clonada, lip sync ou personagem animado completo.

2. Confirmar o padrao visual do primeiro lote.
   - Recomendacao atual: imagens de fundo, cortes simples, legendas, movimento leve e assinatura visual do Pulso.
   - Nao fazer agora: animacao complexa do mascote.

3. Escolher as contas reais de publicacao.
   - Rede ancora: YouTube Shorts.
   - TikTok e Instagram entram apenas se nao atrasarem o lote ancora.

4. Validar manualmente os 5 primeiros temas antes de publicar.
   - O app pode organizar e gerar.
   - A decisao editorial final ainda precisa ser humana.

## Acessos ou configuracoes que preciso de voce

1. Confirmar se a `OPENAI_API_KEY` real esta no `.env.local`.
   - Sem isso, a geracao real de roteiro/audio pode falhar.

2. Confirmar se as contas de YouTube/TikTok/Instagram estao prontas para receber publicacao.
   - Se nao estiverem, a publicacao continua assistida/manual.

3. Confirmar onde os videos finais serao montados no MVP.
   - Opcao recomendada agora: template simples com imagens, audio e legenda.
   - A ferramenta pode ser definida depois, mas o padrao visual precisa ser fechado antes do lote.

## O que eu consigo continuar fazendo daqui

1. Corrigir fluxo e UI do app.
2. Validar build e rotas locais.
3. Consultar o Supabase em modo read-only.
4. Preparar lote, filtros, docs, roteiro operacional e travas de foco.
5. Gerar chamadas de API do app quando houver credenciais validas.

## O que eu nao devo fazer sem sua confirmacao explicita

1. Publicar conteudo em rede social.
2. Cancelar, arquivar ou limpar fila antiga em massa.
3. Rodar migration destrutiva.
4. Alterar conta/plataforma externa.
5. Assumir que o canal gerou renda sem dado real de publicacao e metrica.

## Estado operacional atual

- Canal foco oficial: `PULSO Mistérios & História`.
- Banco tem 43 ideias aprovadas do canal foco.
- Banco tem 11 roteiros do canal foco.
- Banco tem 3 audios prontos do canal foco.
- Pipeline do canal foco tem 43 itens:
  - 38 em `AGUARDANDO_ROTEIRO`
  - 2 em `ROTEIRO_PRONTO`
  - 3 em `AUDIO_GERADO`
- Ainda nao ha item do canal foco em `PRONTO_PUBLICACAO`.

## Proxima decisao pratica

Mover os 3 itens com audio gerado para revisao de video/template e depois para `PRONTO_PUBLICACAO`, ou gerar audio para os 2 itens em `ROTEIRO_PRONTO` para fechar lote minimo de 5.

