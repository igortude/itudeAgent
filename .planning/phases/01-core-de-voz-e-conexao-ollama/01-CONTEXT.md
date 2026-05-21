# Phase 1: Core de Voz e Conexão Ollama - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase estabelece o core de conversação por voz bidirecional em português brasileiro (PT-BR) de forma local e com custo zero. Ela entrega a estrutura inicial do backend Node.js, a integração com o Ollama, o gerador utilitário em Python para Edge-TTS, e o módulo frontend básico de captura de voz (STT) e player de áudio (TTS) com mecanismos preventivos de eco acústico.

</domain>

<decisions>
## Implementation Decisions

### Orquestração de Áudio e Prevenção de Eco
- **D-01 (Silenciamento por Estado - Recomendado):** O microfone (STT) via Web Speech API será desligado ativamente no frontend no exato instante em que o player de áudio (TTS) iniciar a reprodução da resposta da IA. O reconhecimento será reativado de forma automática imediatamente após o evento `onended` do player de áudio disparar. Isso elimina completamente o loop de auto-escuta (eco) da IA.
- **D-02 (Controle por Teclado):** O atalho da barra de Espaço alternará o estado do microfone (Ligar/Desligar) na interface inicial, servindo como backup tátil rápido para o usuário.

### Arquitetura do Backend de TTS
- **D-03 (Script CLI Python Desacoplado):** A geração do Edge-TTS e Kokoro local será orquestrada via um script Python utilitário leve (`backend/helpers/tts_generator.py`) acionado por subprocesso do Node.js (`child_process.execFile` ou `exec`). O script Python receberá os argumentos `--text`, `--voice` e `--output`, salvando o arquivo final `.mp3` no diretório estático público `backend/public/assets/tts/`. O backend Express responderá à chamada da API `/api/tts` retornando a URL relativa do áudio (ex: `/assets/tts/saida.mp3`), otimizando RAM e latência de rede.

### Gerenciamento de Erros e Healthcheck do Ollama
- **D-04 (Resiliência de Startup):** O servidor backend fará um `healthcheck` na API do Ollama (`:11434/api/tags`) ao iniciar. Se falhar, o servidor inicia normalmente, mas emite uma flag `ollamaConnected: false` nas APIs. A UI exibirá um aviso elegante em dourado na inicialização explicando que o Ollama está fora do ar e ativará respostas simuladas locais (mock em PT-BR) para permitir testes da interface e do motor de voz mesmo sem o LLM rodando.

### the agent's Discretion
- **Voz Padrão de Início:** O agente pode definir a voz neural feminina `pt-BR-FranciscaNeural` ou masculina `pt-BR-AntonioNeural` do Edge-TTS como padrão inicial de acordo com testes de latência e qualidade sutil.
- **Duração do Cache de Áudio:** O backend pode implementar uma rotina simples de expurgo de arquivos de áudio mais antigos que 5 minutos na inicialização para evitar consumo excessivo de HD.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Requirements and Stack
- `PROJECT.md` — Visão geral e constraints da IA cósmica *Eternos*.
- `.planning/REQUIREMENTS.md` — Requisitos do sistema v1 mapeados (VOICE-01 a VOICE-05, LLM-01 a LLM-03, MEM-01).
- `.planning/research/STACK.md` — Stacks e dependências recomendadas (Express, Better-SQLite3, edge-tts Python).
- `.planning/research/PITFALLS.md` — Riscos específicos mapeados (Eco, silêncio por latência).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project. A estrutura do Express backend e o script de ajuda CLI em Python devem ser criados do zero de forma simples, focada e reutilizável para as próximas fases.

### Established Patterns
- **Estrutura Express limpa:** Servir a pasta `public/` como arquivos estáticos para que o HTML acesse as APIs na mesma porta.
- **Python CLI Decoupling:** Executar o script Python de voz passando strings e aguardando conclusão do processo de forma assíncrona usando promises.

</code_context>

<specifics>
## Specific Ideas

- **Sons de Transição e Efeitos:** Durante o tempo de processamento ("pensando"), o frontend deve rodar um loop suave de som cósmico em baixa frequência (`hum.mp3`) para dar a sensação de imersão de filme SCI-FI e diminuir a percepção psicológica da latência da resposta.

</specifics>

<deferred>
## Deferred Ideas

- **Kokoro-TTS 100% Offline (Phase 3):** Implementação e fallback offline no script Python diferido para as fases finais de forma a agilizar a entrega inicial.

</deferred>

---

*Phase: 1-Core de Voz e Conexão Ollama*
*Context gathered: 2026-05-21*
