#!/bin/bash

echo "🐳 Iniciando n8n local com Docker..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "   Inicie o Docker Desktop e tente novamente."
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep N8N_API_KEY | xargs)
fi

echo "📦 Subindo container n8n..."
docker-compose -f docker-compose.n8n.yml up -d

echo ""
echo "⏳ Aguardando n8n iniciar..."
sleep 10

# Verificar se está rodando
if docker ps | grep -q n8n-pulso; then
    echo "✅ n8n rodando!"
    echo ""
    echo "📍 Acesse: http://localhost:5678"
    echo "🔐 Usuário: admin"
    echo "🔐 Senha: pulso2025"
    echo ""
    echo "🔌 API disponível em: http://localhost:5678/api/v1"
    echo "🔑 API Key configurada: ${N8N_API_KEY:0:20}..."
    echo ""
    echo "📝 Para parar: docker-compose -f docker-compose.n8n.yml down"
    echo "📊 Para ver logs: docker logs -f n8n-pulso"
else
    echo "❌ Erro ao iniciar n8n"
    docker-compose -f docker-compose.n8n.yml logs
fi
