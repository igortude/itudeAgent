# Stack Research

**Domain:** Assistente de Voz Pessoal Adaptativo com IA Local
**Researched:** 2026-05-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | v20.x (LTS) | Servidor de Orquestração Backend | Assincronismo ideal para WebSockets, streaming de áudio e chamadas ao Ollama. |
| **Express.js** | v4.19.x | API REST & Servidor Estático | Leve, robusto e ideal para expor rotas de áudio, monitoramento e controle. |
| **Python** | v3.11.x | Motor Offline de Voz (TTS) | Ecossistema maduro para executar `edge-tts` (Azure) e `kokoro-onnx` (TTS Local). |
| **Ollama** | latest | Servidor de LLMs Local | Gerenciamento local, privado e super otimizado de LLMs de alta qualidade (`llama3.1`, `qwen3`). |
| **SQLite3** | v3.45.x | Banco de Dados Relacional Local | Persistência leve e rápida da Memória Adaptativa, sem overhead de servidores. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Better-SQLite3** | v9.4.x | Driver SQLite para Node.js | Execução síncrona e extremamente rápida de queries SQLite em Node.js. |
| **edge-tts** (Python) | v6.1.x | Síntese de Voz (Microsoft Azure) | Geração de áudio neural de altíssima qualidade em PT-BR (Francisca/Antonio) grátis. |
| **kokoro-onnx** (Python) | v0.3.x | Síntese de Voz 100% Offline | Execução local do Kokoro-82M via ONNX Runtime para síntese de voz privada. |
| **Web Speech API** | Nativa | Reconhecimento de Voz (STT) | Execução instantânea e gratuita no frontend do navegador, sem consumir CPU do servidor. |
| **Web Audio API** | Nativa | Visualizador de Voz e Áudio | Captura dados de frequência de áudio no frontend para alimentar as animações Canvas em tempo real. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Nodemon** | Auto-reload do Backend | Agiliza o ciclo de desenvolvimento backend. |
| **Pipenv** ou **venv** | Isolamento de dependências Python | Necessário para isolar o ambiente com `edge-tts` e `kokoro-onnx`. |

## Installation

```bash
# Core Node dependencies
npm install express better-sqlite3 dotenv ws

# Dev dependencies
npm install -D nodemon

# Python environments setup
python3 -m venv .venv
source .venv/bin/activate
pip install edge-tts kokoro-onnx onnxruntime soundfile
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Web Speech API (STT)** | **Whisper Local (Python/ONNX)** | Se o usuário exigir transcrição 100% offline e sem envio de pacotes de voz para fora do navegador (o Web Speech pode enviar trechos de áudio para servidores do Google/Microsoft dependendo do navegador). |
| **Edge-TTS (Online)** | **Kokoro TTS (Local/Offline)** | Escolhido como o motor primário para obter a melhor qualidade de voz do mundo sem custos, usando o Kokoro como fallback nativo caso falte conexão de internet. |
| **Better-SQLite3** | **Prisma ORM** | Apenas se o banco de dados crescer muito ou se o usuário preferir migrations e type-safety estrita, mas para o escopo do assistente, SQL puro no SQLite é mais performático. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **pyttsx3** | Voz extremamente robótica, metálica e desagradável, que quebra o clima cinematográfico de "Eternos". | `edge-tts` ou `kokoro-onnx`. |
| **ElevenLabs (Pago)** | Custo recorrente por caractere falado e risco de bloqueio de conta caso ultrapasse limites. | `edge-tts` que possui qualidade neural equivalente e é grátis. |
| **Sequelize ORM** | Overhead desnecessário de queries e inicialização lenta em um banco de dados local super simples de memória. | `better-sqlite3` para queries SQL nativas instantâneas. |

## Stack Patterns by Variant

**Se o usuário estiver offline:**
- O backend detecta a falta de conexão à internet e altera o motor de fala de `edge-tts` para o `kokoro-onnx` local.
- Garante resiliência total e funcionamento em qualquer situação.

**Se o navegador for o Chrome/Edge:**
- A Web Speech API funciona nativamente com altíssima precisão e velocidade.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `better-sqlite3@9.4.x` | `node@20.x` | Requer ferramentas de compilação C++ durante instalação (`node-gyp`). |
| `kokoro-onnx@0.3.x` | `onnxruntime@1.16+` | Compatível com CPUs modernas e aceleração de GPU (DirectML/CUDA). |

## Sources

- [Microsoft Azure Neural Voices Docs] — Verificação das capacidades e vozes nativas em PT-BR.
- [Kokoro-82M Official GitHub] — Confirmação do tamanho leve do modelo e capacidade PT-BR via ONNX.
- [Web Speech API MDN] — Verificação de compatibilidade de navegadores para SpeechRecognition.

---
*Stack research for: ItudeAgent*
*Researched: 2026-05-21*
