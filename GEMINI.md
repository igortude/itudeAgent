<!-- GSD:project-start source:PROJECT.md -->
## Project

**ItudeAgent — Assistente de Voz Adaptativo Alienígena**

O **ItudeAgent** é um assistente de voz pessoal adaptativo e inteligente, com uma interface futurista e minimalista inspirada no visual cósmico e alienígena do filme *Eternos* (Eternals). Ele foi projetado para ouvir, compreender e responder ao usuário em português brasileiro (PT-BR) usando uma voz sutil e calma, integrando-se a modelos de linguagem locais via Ollama, memória relacional em SQLite e um monitor inteligente de espaço em disco.

**Core Value:** Prover uma experiência de interação por voz bidirecional e local em PT-BR fluida, envolvente e visualmente espetacular, que aprende de forma contínua com o usuário sem depender de APIs proprietárias pagas.

### Constraints

- **Tecnologia**: Backend Node.js, Frontend HTML5/Vanilla CSS/JavaScript (Canvas/Web Audio API).
- **Sem Custos**: Não utilizar nenhuma API paga (como ElevenLabs ou OpenAI).
- **Execução Local**: Todos os modelos de linguagem devem rodar localmente sob o Ollama.
- **Idioma**: Toda a comunicação falada e textual deve ser em Português Brasileiro (PT-BR).
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Core Node dependencies
# Dev dependencies
# Python environments setup
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
- O backend detecta a falta de conexão à internet e altera o motor de fala de `edge-tts` para o `kokoro-onnx` local.
- Garante resiliência total e funcionamento em qualquer situação.
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
