# Phase 1: Core de Voz e Conexão Ollama - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 1-Core de Voz e Conexão Ollama
**Areas discussed:** Orquestração de Áudio, Arquitetura do Backend de TTS, Gerenciamento de Erros e Healthcheck do Ollama

---

## Orquestração de Áudio e Prevenção de Eco

| Option | Description | Selected |
|--------|-------------|----------|
| Silenciamento por Estado | O frontend gerencia os estados do microfone (STT) silenciando ativamente quando o player (TTS) reproduz áudio, reativando no fim da reprodução. | ✓ |
| Push-to-Talk Manual | O usuário deve apertar e segurar uma tecla física para falar. | |

**User's choice:** Silenciamento por Estado (Default Recomendado)
**Notes:** Decisão tomada automaticamente no modo YOLO/Auto para garantir a melhor UX nativa sem a necessidade de atrito de atalho constante por parte do usuário.

---

## Arquitetura do Backend de TTS

| Option | Description | Selected |
|--------|-------------|----------|
| Script CLI Python Temporário | Subprocesso Node.js dispara um script Python isolado que gera o áudio físico MP3 local. | ✓ |
| Servidor Web Python Extra | Criar um servidor web Flask/FastAPI rodando em paralelo para a rota de voz. | |

**User's choice:** Script CLI Python Temporário (Default Recomendado)
**Notes:** Selecionado de forma automática por ser muito mais leve em termos de memória e simplificar o deploi do ecossistema local do ItudeAgent.

---

## Gerenciamento de Erros e Healthcheck do Ollama

| Option | Description | Selected |
|--------|-------------|----------|
| Healthcheck com Mock Resiliente | Servidor avisa a UI do status de falha do Ollama, mas roda normalmente e ativando mock em PT-BR para testes. | ✓ |
| Bloqueio Estrito no Startup | Recusa a iniciar o servidor Node caso a API local do Ollama esteja fora do ar. | |

**User's choice:** Healthcheck com Mock Resiliente (Default Recomendado)
**Notes:** Escolhido autonomamente para garantir excelente resiliência de ambiente e uma ótima experiência de onboarding para o usuário.

---

## the agent's Discretion

- **Opção de Voz Calma:** Escolhido Francisca/Antonio do Edge-TTS como vozes padrão para o assistente.
- **Cache de Áudio:** Limpeza de arquivos MP3 antigos a cada início ou temporizado de forma automática.

## Deferred Ideas

- **Kokoro TTS ONNX Offline Fallback:** Adiado para a Phase 3/Polimento Final, priorizando a estabilização da rota do Edge-TTS e integração Ollama no MVP.
