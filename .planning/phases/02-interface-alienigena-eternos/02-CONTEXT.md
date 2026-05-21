# Phase 2: Interface Alienígena "Eternos" - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase compreende a criação do visual sci-fi minimalista e interativo de cair o queixo para o ItudeAgent. Ela engloba a implementação de um canvas de alta performance (60fps) com elipses orbitais e partículas douradas no frontend, animadas de forma responsiva às frequências sonoras da voz do usuário e da IA via Web Audio API, além de controles flutuantes elegantes sob o estilo visual do filme *Eternos*.

</domain>

<decisions>
## Implementation Decisions

### Estética da Animação do Canvas
- **D-01 (Órbitas Celestes Giratórias - Recomendado):** A animação do Canvas 2D representará círculos concêntricos e linhas geométricas interconectadas simulando órbitas celestes e runas douradas de *Eternos*. As órbitas giram em velocidades diferentes e pulsam em raio e brilho baseados na intensidade das frequências de áudio capturadas. Partículas douradas serão emitidas a partir do centro durante picos de volume.

### Captação de Frequência do Áudio (Web Audio API)
- **D-02 (Análise de Frequência Bidirecional - Recomendado):** Utilizaremos a Web Audio API com dois nós `AnalyserNode` separados no frontend: um conectado ao fluxo de mídia (`MediaStream`) do microfone (ativado quando o microfone está ouvindo) e outro conectado à fonte de áudio (`AudioContext.createMediaElementSource`) do player da IA. Isso permite que a animação reaja dinamicamente à voz de ambos os interlocutores com padrões gráficos levemente distintos (ex: pulsações circulares para o usuário, e ondas concêntricas douradas para a IA).

### Painéis Flutuantes de Controle e UX
- **D-03 (Gavetas Laterais com Glassmorphic Glow - Recomendado):** Para manter o centro da tela limpo e focado no Canvas cósmico, as ferramentas secundárias (logs de transcrição e seletor de modelos do Ollama) serão alocadas em painéis flutuantes translúcidos (`backdrop-filter: blur(10px)`) nas laterais esquerda e direita. Esses painéis serão retráteis (deslizando suavemente com transição de CSS ao passar o mouse ou clicar em um pequeno gatilho dourado).
- **D-04 (Feedback Visual de Mic):** O centro do canvas terá uma runa de foco dourada que muda para vermelho brilhante pulsante ou dourado intenso dependendo se o microfone está capturando voz ou pausado, dando feedback instantâneo ao usuário sem poluir o visual.

### the agent's Discretion
- **Paleta de Dourado:** O agente tem total liberdade para sintonizar a paleta HSL do dourado (ex: tons ricos entre `#d4af37`, `#e6c55c` e `#f3e5ab`) e configurar sombras de brilho CSS (`box-shadow`, `filter: drop-shadow`) para alcançar o efeito premium ideal.
- **Número de Partículas:** O número máximo de partículas geradas em picos de volume é ajustável para garantir que o framerate fique travado em 60fps tanto em celulares quanto desktops.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Requirements and Design
- `PROJECT.md` — Conceito e constraints de estilo estético.
- `.planning/REQUIREMENTS.md` — Requisitos específicos (UI-01 a UI-05).
- `.planning/research/STACK.md` — Uso de Web Audio API e Canvas nativo para o visualizador.
- `backend/public/index.html` — HTML base criado na Fase 1 a ser reformulado.
- `backend/public/app.js` — Lógica do STT e orquestração de eco criada na Fase 1.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/public/app.js` contém a máquina de estados básica de áudio (`isListening`, `isIA_Speaking`) que deve ser mantida ou expandida para integrar os nós da Web Audio API.
- `backend/public/index.html` contém as tags de áudio e as classes CSS de status básicas.

### Established Patterns
- **Web Audio API:** Para criar analisadores, precisamos inicializar `new AudioContext()` após um gesto do usuário (clique ou tecla) para evitar restrições de autoplay do navegador.

</code_context>

<specifics>
## Specific Ideas

- **Símbolos Cósmicos Estáticos:** No fundo do Canvas, renderizar de forma tênue círculos e linhas cruzadas finas e fixas em dourado fosco, simulando um mapa estelar antigo, criando profundidade 3D com as partículas em movimento por cima.

</specifics>

<deferred>
## Deferred Ideas

- **Painel de Histórico Completo de Conversas (Phase 3):** O painel de logs do frontend exibirá apenas as transcrições da sessão atual nesta fase, delegando o banco de histórico relacional para a Fase 3.

</deferred>

---

*Phase: 2-Interface Alienígena "Eternos"*
*Context gathered: 2026-05-21*
