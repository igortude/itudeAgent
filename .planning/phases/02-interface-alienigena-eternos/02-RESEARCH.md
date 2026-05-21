# Phase 2: Technical Research & Constraints

## Contexto
A Fase 2 foca na construção de uma interface de altíssima qualidade visual, inspirada no filme *Eternos*, e na reatividade dela à voz (Web Audio API) em tempo real, mantendo um framerate estável de 60fps no HTML Canvas.

## 1. Web Audio API & Detecção Bidirecional
Para capturar o áudio bidirecional e alimentar o analisador de frequências, precisamos de duas fontes distintas no `AudioContext`:
1.  **Microfone (Voz do Usuário):**
    *   Capturado via `navigator.mediaDevices.getUserMedia({ audio: true })`.
    *   Conectado a um `AnalyserNode` (`userAnalyser`).
    *   Este analisador deve ser desconectado ou silenciado quando o microfone estiver pausado para evitar ruídos de fundo movendo a animação desnecessariamente.
2.  **Player de Áudio (Voz da IA):**
    *   Capturado via `AudioContext.createMediaElementSource(audioElement)`.
    *   Conectado a um `AnalyserNode` (`iaAnalyser`).
    *   Este analisador deve ser conectado à saída final (`audioContext.destination`) para que o som continue sendo audível nos alto-falantes!
    *   *Atenção:* O `createMediaElementSource` só pode ser chamado uma vez por elemento de áudio durante o ciclo de vida da página, caso contrário ele lança uma exceção de rede.

## 2. Animação Canvas a 60fps
Para renderizar símbolos de *Eternos* de forma fluida:
*   Usar `requestAnimationFrame` para manter o loop de renderização síncrono com a taxa de atualização da tela.
*   Desenhar órbitas celestes usando equações polares para círculos concêntricos e runas douradas.
*   **Aceleração de Partículas:** Quando o analisador detectar frequências altas (volume alto), instanciar objetos `Particle` com velocidades e direções aleatórias saindo do centro cósmico e sumindo gradualmente (`alpha -= 0.02`).
*   **Otimização:** Limitar o array de partículas ativas a 150 para evitar queda de performance.

## 3. Glassmorphism & Gavetas Laterais
Para obter uma interface limpa:
*   **CSS Backdrops:** Usar `backdrop-filter: blur(12px) saturate(180%)` combinado com fundos translúcidos em HSL (ex: `rgba(20, 20, 20, 0.6)`).
*   **Gatilhos Dourados:** Pequenos botões dourados geométricos nas extremidades da tela que aplicam transições CSS (`transform: translateX(0)`) para abrir/fechar as gavetas de Logs e Modelos.
*   **Fontes:** Importar fontes de estilo premium (como 'Outfit' ou 'Cinzel' do Google Fonts) para dar o tom cinematográfico e alienígena.

## Validation Architecture
- O Canvas deve renderizar sem travamentos evidentes (manter 60fps).
- A Web Audio API deve analisar o microfone e o player corretamente sem bloquear a saída de áudio dos alto-falantes.
- O atalho de teclado `Espaço` deve alternar o microfone e emitir feedback visual instantâneo na runa central.
