# Phase 1: Technical Research & Constraints

## Contexto
O ItudeAgent requer uma pipeline bidirecional de voz em tempo real. O backend orquestra chamadas locais ao Ollama e a um script Python que consome o Edge-TTS. O frontend roda a Web Speech API para capturar áudio em PT-BR.

## 1. Edge-TTS e Integração Python-Node
A integração mais eficiente para gerar TTS sem custo e com alta qualidade em PT-BR é invocar o módulo Python `edge-tts` através do Node.js.
*   **Abordagem CLI:** O Node usará `child_process.execFile` ou `exec` para invocar um arquivo `tts_helper.py`.
*   **Armazenamento:** O script Python salvará o `.mp3` em `backend/public/assets/tts/`.
*   **Limpeza de Cache:** Para evitar vazamento de disco, o Node pode deletar arquivos antigos nessa pasta na inicialização, ou o nome do arquivo pode ser fixo (ex: `response.mp3`) para sobrescrever a cada turno.

## 2. Ollama Healthcheck & Mocking
Ollama expõe uma API RESTful.
*   **Endpoint Padrão:** `http://127.0.0.1:11434/api/generate`.
*   **Healthcheck:** Um `GET` ou `HEAD` para o endpoint básico na inicialização do servidor Node.
*   **Mock:** Se o `fetch` para o Ollama der `ECONNREFUSED`, o backend entra em modo "Mock" (retornando uma string "Estou offline no momento. Ativando modo de simulação." para teste de TTS).

## 3. Web Speech API e Eco Acústico
O STT será implementado via `window.SpeechRecognition` ou `window.webkitSpeechRecognition`.
*   **Evento de Eco:** O microfone capta a resposta do TTS, criando um loop de alucinação no LLM.
*   **Solução:** Quando o `<audio>` HTML emitir o evento `play`, chamar `recognition.stop()`. Quando emitir `ended`, chamar `recognition.start()`.
*   **Estado:** Manter uma flag booleana `isIA_Speaking = true` para evitar que o STT inicie acidentalmente durante a fala.

## Validation Architecture
- O backend Express deve estar acessível na porta estipulada e servir estáticos.
- O endpoint `/api/health` deve retornar o status do Ollama.
- O script Python `tts_helper.py` deve gerar um MP3 com sucesso ao ser executado no terminal.
- O Frontend deve ser capaz de reconhecer PT-BR e solicitar TTS para a API.
