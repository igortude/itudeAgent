# Phase 1: Nyquist Validation Strategy

**Gathered:** 2026-05-21

## 1. System State & Dependencies (Dimension 1 & 2)
- Express e Node v20 rodando.
- Ollama disponível localmente na porta 11434 (ou falhando graciosamente para mock mode).
- Ambiente Python virtual configurado com pacote `edge-tts` instalado.

## 2. API & Contract Validation (Dimension 3)
- O backend deve expor `GET /api/health` retornando JSON `{ status: 'ok', ollamaConnected: boolean }`.
- O backend deve expor `POST /api/chat` recebendo `{ text: string }` e retornando `{ reply: string, audioUrl: string }`.

## 3. Storage & Effects (Dimension 4 & 5)
- Arquivos `.mp3` gerados devem ser salvos em `backend/public/assets/tts/`.
- Limpeza automática de arquivos deve ocorrer para sobrescrever versões anteriores (e.g. `response.mp3`).

## 4. UI & Interaction (Dimension 6)
- O STT do navegador deve ser capaz de reconhecer PT-BR.
- A UI deve permitir apertar `Barra de Espaço` para ligar/desligar o microfone (indicador visual rudimentar por enquanto, como logs no console ou um ícone).
- O player de áudio deve desativar o STT durante sua reprodução, religando no evento `onended`.

## 5. Security & Error Handling (Dimension 7 & 8)
- O backend não deve crashar se o Ollama não responder (deve retornar a resposta mockada).
- Erros do script Python (ex: Edge-TTS falhando por falta de rede) devem ser tratados e retornados com fallback de áudio ou log amigável.
