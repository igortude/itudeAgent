#!/bin/bash

# ═══════════════════════════════════════════════════════
#  iTude Agent // INICIALIZADOR DE NAVEGADOR AUTÔNOMO
# ═══════════════════════════════════════════════════════

echo -e "\033[1;36m[iTude Agent]\033[0m Iniciando servidores cognitivos..."

# Ir para a pasta backend
cd "$(dirname "$0")/backend"

# Iniciar servidor backend em segundo plano
node server.js &
BACKEND_PID=$!

# Função para encerrar o backend ao fechar o script
cleanup() {
  echo -e "\n\033[1;31m[iTude Agent]\033[0m Encerrando servidores..."
  kill $BACKEND_PID
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Aguardar 1.5 segundos para garantir que a porta 3000 está escutando
sleep 1.5

echo -e "\033[1;36m[iTude Agent]\033[0m Abrindo navegador autônomo em Tela Cheia..."

# Tentar abrir em modo App Standalone e Tela Cheia usando Chrome/Chromium
if command -v google-chrome &> /dev/null; then
  google-chrome --app=http://localhost:3000 --start-fullscreen --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --unsafely-treat-insecure-origin-as-secure=http://localhost:3000
elif command -v chromium &> /dev/null; then
  chromium --app=http://localhost:3000 --start-fullscreen --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --unsafely-treat-insecure-origin-as-secure=http://localhost:3000
elif command -v google-chrome-stable &> /dev/null; then
  google-chrome-stable --app=http://localhost:3000 --start-fullscreen --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream --unsafely-treat-insecure-origin-as-secure=http://localhost:3000
else
  echo -e "\033[1;33m[Aviso]\033[0m Google Chrome/Chromium não encontrado. Abrindo navegador padrão..."
  xdg-open http://localhost:3000
  # Manter script rodando até o usuário dar Ctrl+C
  wait $BACKEND_PID
fi
