#!/bin/bash

# ═══════════════════════════════════════════════════════
#  iTude Agent // INICIALIZADOR DE NAVEGADOR AUTÔNOMO
# ═══════════════════════════════════════════════════════

echo -e "\033[1;36m[iTude Agent]\033[0m Iniciando servidores cognitivos..."

# Diretório raiz do projeto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Perfil isolado do Chrome para garantir que as flags de autoplay funcionem
# (Chrome ignora flags se já existe uma instância rodando com outro perfil)
CHROME_PROFILE="$PROJECT_DIR/.chrome-itude-profile"

# Ir para a pasta backend
cd "$PROJECT_DIR/backend"

# Iniciar servidor backend em segundo plano
node server.js &
BACKEND_PID=$!

# Função para encerrar o backend ao fechar o script
cleanup() {
  echo -e "\n\033[1;31m[iTude Agent]\033[0m Encerrando servidores..."
  kill $BACKEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Aguardar 2 segundos para garantir que a porta 3000 está escutando
sleep 2

echo -e "\033[1;36m[iTude Agent]\033[0m Abrindo navegador autônomo com SOM HABILITADO..."

# Flags fundamentais:
#   --user-data-dir       → Perfil isolado (garante que flags funcionem mesmo com outro Chrome aberto)
#   --autoplay-policy     → Permite reprodução de áudio sem interação do usuário
#   --use-fake-ui...      → Auto-concede permissão de microfone sem popup
#   --disable-features    → Remove bloqueios de autoplay baseados em engajamento
CHROME_FLAGS=(
  "--app=http://localhost:3000"
  "--kiosk"
  "--user-data-dir=$CHROME_PROFILE"
  "--autoplay-policy=no-user-gesture-required"
  "--use-fake-ui-for-media-stream"
  "--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies"
  "--no-first-run"
  "--no-default-browser-check"
)

# Tentar abrir usando Chrome/Chromium disponível
if command -v google-chrome &> /dev/null; then
  google-chrome "${CHROME_FLAGS[@]}"
elif command -v chromium &> /dev/null; then
  chromium "${CHROME_FLAGS[@]}"
elif command -v google-chrome-stable &> /dev/null; then
  google-chrome-stable "${CHROME_FLAGS[@]}"
else
  echo -e "\033[1;33m[Aviso]\033[0m Google Chrome/Chromium não encontrado. Abrindo navegador padrão..."
  xdg-open http://localhost:3000
  # Manter script rodando até o usuário dar Ctrl+C
  wait $BACKEND_PID
fi
