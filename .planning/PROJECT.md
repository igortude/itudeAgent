# ItudeAgent — Assistente de Voz Adaptativo Alienígena

## What This Is

O **ItudeAgent** é um assistente de voz pessoal adaptativo e inteligente, com uma interface futurista e minimalista inspirada no visual cósmico e alienígena do filme *Eternos* (Eternals). Ele foi projetado para ouvir, compreender e responder ao usuário em português brasileiro (PT-BR) usando uma voz sutil e calma, integrando-se a modelos de linguagem locais via Ollama, memória relacional em SQLite e um monitor inteligente de espaço em disco.

## Core Value

Prover uma experiência de interação por voz bidirecional e local em PT-BR fluida, envolvente e visualmente espetacular, que aprende de forma contínua com o usuário sem depender de APIs proprietárias pagas.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] **UI-01 (Interface Alienígena "Eternos")**: Interface web imersiva e responsiva (HTML/CSS/JS) com animações fluidas em Canvas de partículas, círculos geométricos dourados e linhas cósmicas brilhantes ativadas por som.
- [ ] **STT-01 (Reconhecimento de Voz)**: Captura de voz em tempo real através da Web Speech API diretamente no navegador, configurada para português do Brasil, com detecção inteligente de fim de fala.
- [ ] **TTS-01 (Síntese de Voz Cinematográfica)**: Geração de voz sutil, calma e fluida em PT-BR utilizando o Microsoft Edge-TTS (sem necessidade de chaves de API pagas) com fallback para o Kokoro TTS offline/local.
- [ ] **LLM-01 (Integração Ollama)**: Conexão dinâmica ao Ollama local permitindo selecionar, carregar e alternar entre os modelos instalados (`llama3.1:latest`, `qwen3:8b`, `deepseek-coder`, `phi3:mini`) diretamente pela interface do usuário.
- [ ] **MEM-01 (Memória SQLite)**: Banco de dados SQLite local para registrar preferências de tom do usuário, fatos compartilhados e resumo de sessões de conversas antigas que alimentam o prompt do sistema (RAG de contexto simples).
- [ ] **DISK-01 (Monitoramento de Disco)**: Monitor inteligente de uso de armazenamento do sistema, alertando sobre limites críticos de espaço e projetando a data estimada em que o disco ficará cheio no ritmo atual de downloads de novos modelos.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Uso de APIs Pagas Proprietárias (ElevenLabs, OpenAI)** — Evitado para garantir total soberania dos dados do usuário e custo zero de execução.
- **Ponte MCP Alexa Integrada em Produção** — Apenas estrutura preliminar será preparada; integração real e controle físico de automação ficam para a v2 devido a dependências externas de hardware.

## Context

Este é um projeto greenfield de assistente pessoal. O usuário busca uma alternativa privada, personalizável e de alto apelo visual (visual sci-fi premium) frente aos assistentes de mercado. O desenvolvimento será estruturado em uma arquitetura Full-stack local leve: um servidor backend Node.js (gerenciando Ollama, SQLite, disco e Edge-TTS) e um frontend HTML/JS/CSS puro no navegador com Canvas para performance visual máxima.

## Constraints

- **Tecnologia**: Backend Node.js, Frontend HTML5/Vanilla CSS/JavaScript (Canvas/Web Audio API).
- **Sem Custos**: Não utilizar nenhuma API paga (como ElevenLabs ou OpenAI).
- **Execução Local**: Todos os modelos de linguagem devem rodar localmente sob o Ollama.
- **Idioma**: Toda a comunicação falada e textual deve ser em Português Brasileiro (PT-BR).

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Edge-TTS / Kokoro** | Vozes neurais grátis de altíssima qualidade em PT-BR (Edge-TTS) e opção offline local (Kokoro), substituindo o ElevenLabs pago. | — Pending |
| **Vanilla HTML/CSS/JS (Canvas)** | Performance máxima para as animações geométricas fluidas douradas sem o overhead de frameworks pesados de frontend. | — Pending |
| **SQLite Nativo** | Persistência simples de memória adaptativa local sem necessidade de serviços adicionais de banco de dados. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after initialization*
