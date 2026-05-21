# Requirements: ItudeAgent

**Defined:** 2026-05-21
**Core Value:** Prover uma experiência de interação por voz bidirecional e local em PT-BR fluida, envolvente e visualmente espetacular, que aprende de forma contínua com o usuário sem depender de APIs proprietárias pagas.

## v1 Requirements

### Interface & Visual (UI)

- [ ] **UI-01**: O usuário deve visualizar uma interface com fundo escuro e estilo minimalista premium sci-fi, inspirada na identidade visual cósmica e dourada de *Eternos*.
- [ ] **UI-02**: A interface deve possuir um visualizador gráfico em HTML Canvas animando círculos e linhas douradas fluindo reativamente à voz e ao áudio em tempo real (60fps).
- [ ] **UI-03**: O usuário deve poder alternar o modelo de LLM ativo no Ollama através de um menu dropdown elegante e reativo na interface.
- [ ] **UI-04**: O usuário deve poder alternar a captação de áudio através de um atalho de teclado global intuitivo (barra de Espaço) ou clicando no centro do visualizador cósmico.
- [ ] **UI-05**: A interface deve exibir de forma elegante o histórico das falas em formato texto (em um log retrátil para não poluir o visual).

### Reconhecimento de Voz & Síntese (VOICE)

- [ ] **VOICE-01**: O sistema deve capturar a voz em português brasileiro (PT-BR) localmente via Web Speech API diretamente no navegador do usuário.
- [ ] **VOICE-02**: O sistema deve transcrever a fala com precisão e disparar a submissão de texto de forma automática quando detectar silêncio contínuo (fim da fala).
- [ ] **VOICE-03**: O sistema deve sintetizar respostas de voz neurais, calmas e sutis em PT-BR usando o motor Microsoft Edge-TTS no backend.
- [ ] **VOICE-04**: O frontend deve silenciar ativamente o microfone (STT) durante a reprodução do áudio da IA (TTS) para evitar loops de eco acústico.
- [ ] **VOICE-05**: O sistema deve reproduzir um hum cósmico de baixa frequência e pulsar a interface visual dourada durante os tempos de espera ("IA pensando"), evitando silêncios mortos.

### Conectividade LLM & Modelos (LLM)

- [ ] **LLM-01**: O backend deve conectar-se via API local do Ollama (`http://localhost:11434`) para disparar os prompts do usuário.
- [ ] **LLM-02**: O backend deve validar na inicialização se o serviço do Ollama está rodando e alertar na interface caso esteja desconectado.
- [ ] **LLM-03**: O backend deve listar dinamicamente todos os modelos locais disponíveis e permitir chaveamento instantâneo via chamada de API.

### Persistência & Memória (MEM)

- [ ] **MEM-01**: O sistema deve registrar mensagens anteriores no SQLite local para manter um histórico de sessão (RAM) e persistência de histórico geral.
- [ ] **MEM-02**: O backend deve disparar um parser em background no LLM para extrair fatos importantes compartilhados pelo usuário ("gosto de javascript", "meu nome é Igor") e preferências de tom de resposta.
- [ ] **MEM-03**: O sistema deve salvar os fatos extraídos na tabela SQLite `user_facts` com pontuações de frequência para injeção automática no prompt do sistema de futuras conversas.
- [ ] **MEM-04**: O usuário deve poder visualizar todos os fatos aprendidos pelo assistente através de um painel elegante chamado "Cofre de Memórias" e apagar qualquer fato indesejado.

### Utilidades do Sistema (SYS)

- [ ] **SYS-01**: O backend deve ler dinamicamente o espaço em disco do sistema local via comandos nativos de sistema operacional (`df`).
- [ ] **SYS-02**: O backend deve computar estatísticas de taxa de consumo de armazenamento semanal no SQLite.
- [ ] **SYS-03**: O backend deve prever matematicamente (regressão linear simples) a data estimada de limite de disco com base na taxa de download de novos modelos do Ollama, exibindo em formato amigável na UI.

---

## v2 Requirements

### Automação & Conectividade Externa

- **AUTO-01**: Ativação do assistente 100% offline via Wake Word física ("Ok Agent").
- **AUTO-02**: Integração nativa com servidor local MCP Alexa para controle de luzes e smart-home por voz.
- **AUTO-03**: Conexão com webcam para suporte a visão computacional local utilizando VLMs locais (como LLaVA).
- **AUTO-04**: Motor de voz alternativo 100% offline via Kokoro TTS rodando localmente na máquina com ONNX runtime.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| **Uso de APIs Proprietárias Pagas** | Evitado para garantir total soberania dos dados do usuário, privacidade e custo zero de execução. |
| **Interface Desktop Nativa (Electron)** | Deferida para evitar overhead desnecessário de 150MB+ de RAM e HD; o navegador atende perfeitamente à performance Canvas. |
| **Suporte Multi-usuário** | O ItudeAgent é conceitualmente um assistente pessoal íntimo de máquina única, mantendo o banco SQLite leve e exclusivo. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| **UI-01**   | Phase 2 | Pending |
| **UI-02**   | Phase 2 | Pending |
| **UI-03**   | Phase 2 | Pending |
| **UI-04**   | Phase 2 | Pending |
| **UI-05**   | Phase 2 | Pending |
| **VOICE-01**| Phase 1 | Pending |
| **VOICE-02**| Phase 1 | Pending |
| **VOICE-03**| Phase 1 | Pending |
| **VOICE-04**| Phase 1 | Pending |
| **VOICE-05**| Phase 1 | Pending |
| **LLM-01**  | Phase 1 | Pending |
| **LLM-02**  | Phase 1 | Pending |
| **LLM-03**  | Phase 1 | Pending |
| **MEM-01**  | Phase 1 | Pending |
| **MEM-02**  | Phase 3 | Pending |
| **MEM-03**  | Phase 3 | Pending |
| **MEM-04**  | Phase 3 | Pending |
| **SYS-01**  | Phase 3 | Pending |
| **SYS-02**  | Phase 3 | Pending |
| **SYS-03**  | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 after initial definition*
