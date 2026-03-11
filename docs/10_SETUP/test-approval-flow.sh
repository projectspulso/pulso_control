#!/bin/bash

# ========================================
# TESTE DO FLUXO DE APROVAÇÃO
# Frontend → API → Supabase → n8n WF01
# ========================================

echo "🧪 TESTE DE APROVAÇÃO DE IDEIA"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
WEBHOOK_URL="https://pulsoprojects.app.n8n.cloud/webhook/ideia-aprovada"
WEBHOOK_SECRET="pulso_wh_sec_2024_n8n_b9c6ef9_secure_token"

# Ler UUID da ideia
echo "📝 Digite o UUID da ideia para testar:"
echo "(ou pressione ENTER para usar UUID de teste)"
read -r IDEIA_ID

if [ -z "$IDEIA_ID" ]; then
  IDEIA_ID="00000000-0000-0000-0000-000000000001"
  echo -e "${YELLOW}⚠️  Usando UUID de teste (provavelmente não existe)${NC}"
fi

echo ""
echo "🎯 Testando com ideia_id: $IDEIA_ID"
echo ""

# Teste 1: Webhook direto (simula frontend)
echo "----------------------------------------"
echo "TESTE 1: Webhook n8n direto"
echo "----------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d "{
    \"ideia_id\": \"$IDEIA_ID\",
    \"trigger\": \"manual-test\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "📊 Status HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Webhook respondeu com sucesso!${NC}"
  echo ""
  echo "📦 Resposta:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Extrair roteiro_id se existir
  ROTEIRO_ID=$(echo "$BODY" | jq -r '.data.roteiro.id // empty' 2>/dev/null)
  
  if [ -n "$ROTEIRO_ID" ]; then
    echo ""
    echo -e "${GREEN}🎉 ROTEIRO CRIADO COM SUCESSO!${NC}"
    echo "   ID: $ROTEIRO_ID"
  fi
  
elif [ "$HTTP_CODE" = "400" ]; then
  echo -e "${RED}❌ Erro 400: Payload inválido${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  echo -e "${RED}❌ Erro de autenticação${NC}"
  echo "Verifique se o webhook secret está correto"
  
elif [ "$HTTP_CODE" = "500" ]; then
  echo -e "${RED}❌ Erro 500: Erro interno do n8n${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "Possíveis causas:"
  echo "  - Credenciais PostgreSQL incorretas"
  echo "  - Credencial OpenAI sem saldo"
  echo "  - Ideia não encontrada no banco"
  
else
  echo -e "${RED}❌ Status inesperado: $HTTP_CODE${NC}"
  echo "$BODY"
fi

echo ""
echo "----------------------------------------"
echo "TESTE 2: Verificar logs do n8n"
echo "----------------------------------------"
echo ""
echo "🔍 Acesse: https://pulsoprojects.app.n8n.cloud"
echo "   → Workflows → WF01 - Gerar Roteiro"
echo "   → Aba 'Executions'"
echo ""
echo "Você deve ver a execução que acabou de rodar."
echo ""

# Resumo
echo "========================================"
echo "📋 RESUMO DO TESTE"
echo "========================================"
echo ""
echo "Ideia testada: $IDEIA_ID"
echo "Webhook URL: $WEBHOOK_URL"
echo "Status HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}STATUS: ✅ SUCESSO${NC}"
  echo ""
  echo "Próximos passos:"
  echo "  1. Verificar roteiro no banco de dados"
  echo "  2. Testar aprovação pelo frontend"
  echo "  3. Configurar WF02 (gerar áudio)"
else
  echo -e "${RED}STATUS: ❌ FALHOU${NC}"
  echo ""
  echo "Ações sugeridas:"
  echo "  1. Verificar logs no painel n8n"
  echo "  2. Confirmar credenciais PostgreSQL"
  echo "  3. Confirmar credencial OpenAI"
  echo "  4. Usar UUID de ideia REAL do banco"
fi

echo ""
echo "========================================"
