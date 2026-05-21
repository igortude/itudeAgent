# Roadmap: ItudeAgent

## Overview

O ItudeAgent será desenvolvido em 3 fases robustas (granularidade grossa/coarse), evoluindo da fundação de voz e conectividade à inteligência artificial local até uma interface sci-fi reativa de cair o queixo e uma inteligência adaptativa de longo prazo. A jornada foca em entregar um MVP polido, 100% gratuito e local em PT-BR.

## Phases

- [ ] **Phase 1: Core de Voz e Conexão Ollama** - Backend Node, Helper de Voz em Python, microfone no navegador (STT/TTS) e orquestração do LLM local sem loop de eco.
- [ ] **Phase 2: Interface Alienígena "Eternos"** - Visualizador em HTML Canvas de círculos e elipses douradas geradas via Web Audio API e UI premium.
- [ ] **Phase 3: Memória SQLite e Monitor de Disco** - SQLite relacional guardando fatos aprendidos para RAG dinâmico e monitoramento preditivo do armazenamento.

## Phase Details

### Phase 1: Core de Voz e Conexão Ollama
**Goal**: Estabelecer a conversação bidirecional básica por voz em PT-BR integrada ao Ollama local com latência mínima e sem loops de eco.
**Depends on**: Nothing (first phase)
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, LLM-01, LLM-02, LLM-03, MEM-01
**Success Criteria** (what must be TRUE):
  1. O assistente transcreve a fala do usuário em PT-BR capturada no navegador.
  2. O assistente responde sintetizando voz PT-BR sutil e calma (Edge-TTS) a partir da resposta do Ollama local.
  3. O microfone é silenciado de forma confiável durante a fala da IA, prevenindo qualquer loop de eco acústico.
  4. O backend valida a saúde da conexão do Ollama na inicialização e expõe endpoints HTTP claros.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Express backend setup, Python venv, e script CLI utilitário de Edge-TTS em PT-BR.
- [ ] 01-02: Integração com Ollama (API REST e seletor de modelos) e persistência de histórico SQLite de sessão.
- [ ] 01-03: Módulo de áudio frontend (Web Speech STT e player de áudio) com lógica preventiva de eco acústico.

### Phase 2: Interface Alienígena "Eternos"
**Goal**: Desenvolver uma interface visual sci-fi minimalista e imersiva reativa em tempo real com animações fluidas de HTML Canvas dourado.
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. A interface renderiza elipses geométricas e partículas douradas brilhantes no HTML Canvas a 60fps constantes.
  2. As animações reagem de forma dinâmica às frequências de áudio capturadas pela Web Audio API (tanto na fala do usuário quanto na da IA).
  3. O atalho de teclado global (Espaço) e clique ativam/desativam a escuta de voz do agente com feedback visual instantâneo.
  4. Painéis flutuantes e retráteis permitem ler o log de chat e escolher modelos do Ollama sem poluir a experiência.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Construção da UI sci-fi minimalista (CSS Glows, fontes premium, painéis de logs e dropdown flutuante).
- [ ] 02-02: Visualizador geométrico Canvas conectado a analisadores de frequência de microfone e alto-falante.

### Phase 3: Memória SQLite e Monitor de Disco
**Goal**: Enriquecer o assistente com memória cognitiva de longo prazo (SQLite RAG) e acompanhamento inteligente de armazenamento.
**Depends on**: Phase 2
**Requirements**: MEM-02, MEM-03, MEM-04, SYS-01, SYS-02, SYS-03
**Success Criteria** (what must be TRUE):
  1. O LLM extrai fatos automaticamente a partir de logs em background e insere na tabela SQLite `user_facts`.
  2. Memórias cadastradas são injetadas no System Prompt da conversa aumentando o nível de intimidade e aprendizado.
  3. Painel do "Cofre de Memórias" permite ler e apagar fatos aprendidos de forma amigável.
  4. O consumo de espaço em disco é registrado periodicamente e calcula a data estimada de limite com regressão linear simples.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Memória adaptativa no SQLite (extração via LLM, armazenamento relacional e injeção inteligente no prompt).
- [ ] 03-02: Monitor preditivo de disco local (df parser, histórico no SQLite e painel de projeção visual na UI).

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core de Voz e Ollama | 0/3 | Not started | - |
| 2. Interface Canvas Eternos | 0/2 | Not started | - |
| 3. Memória e Monitor Disco | 0/2 | Not started | - |
