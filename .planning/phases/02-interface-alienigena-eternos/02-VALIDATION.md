# Phase 2: Nyquist Validation Strategy

**Gathered:** 2026-05-21

## 1. System State & Dependencies (Dimension 1 & 2)
- O navegador deve permitir permissão de microfone.
- As dependências estáticas do Google Fonts ('Cinzel' ou 'Outfit') devem carregar via link CDN no HTML.

## 2. UI & Aesthetics (Dimension 6)
- O visualizador HTML Canvas deve preencher toda a tela (layout responsive `100vw` e `100vh`).
- Ao carregar a página, a runa central deve iniciar em dourado fosco com o status "Pausado".
- Ao apertar `Espaço`, o microfone ativa, a runa central pulsa em dourado vivo/amarelo, e a Web Audio API começa a ler a voz do usuário.
- As gavetas laterais de logs e de modelo do Ollama devem ser minimizadas por padrão e abrir fluidamente ao passar o mouse ou clicar.

## 3. Audio & Web Audio API (Dimension 3)
- O áudio da IA deve continuar tocando normalmente nos alto-falantes (verificar se `destination` está conectado ao `MediaElementAudioSourceNode`).
- Os dados obtidos do `AnalyserNode` (`getByteFrequencyData` ou `getByteTimeDomainData`) não podem ser todos zero durante a reprodução do áudio ou a captura do mic.

## 4. Performance (Dimension 8)
- As runas e partículas no Canvas devem rodar sem lag (60fps).
- O array de partículas ativas deve limpar automaticamente elementos com opacidade menor que 0.05.
