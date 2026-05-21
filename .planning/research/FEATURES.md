# Feature Research

**Domain:** Assistente de Voz Pessoal Adaptativo com IA Local
**Researched:** 2026-05-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Conversação por Voz (STT/TTS)** | O usuário precisa falar e ouvir a IA em português com naturalidade. | MEDIUM | Usando Web Speech API e Edge-TTS para latência ultra baixa. |
| **Integração com Ollama** | Capacidade de enviar prompts e receber respostas do LLM ativo. | LOW | Rota backend conectada via HTTP à API local do Ollama (`:11434`). |
| **Troca de Modelos na UI** | Selecionar qual cérebro (LLM) usar no momento de acordo com a tarefa. | LOW | Dropdown na interface carregando dinamicamente a lista via `ollama list`. |
| **Histórico de Conversas** | Visualizar o chat em formato textual caso queira rever o que foi dito. | LOW | Salvo na sessão e no SQLite local. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interface Alienígena "Eternos"** | Visual geométrico dourado abstrato em Canvas que pulsa e gira de acordo com a voz captada. | HIGH | Animações customizadas em Web Audio API e HTML Canvas 2D. |
| **Memória Adaptativa SQLite** | IA extrai automaticamente fatos ("Gosto de café", "Sou programador") e preferências do usuário e os salva. | HIGH | RAG integrado simples: busca por similaridade e injeção automática no System Prompt. |
| **Detector de Conexão Inteligente** | Chaveia automaticamente de Edge-TTS (online/rápido) para Kokoro-TTS (local/offline) se cair a rede. | MEDIUM | Monitora conectividade no backend antes de disparar o sintetizador. |
| **Previsor de Disco Inteligente** | Estimativa linear de quando o HD ficará cheio se o usuário continuar baixando LLMs. | MEDIUM | Regressão linear no SQLite computada com dados semanais coletados via `df`. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Empacotamento Electron (App Desktop)** | Querem um arquivo `.exe` ou app instalável. | Consome 150MB+ extras de RAM e HD só para abrir o navegador nativo. | Rodar como app local Node e abrir no navegador padrão com atalho leve. |
| **Vários Usuários (Multi-tenant)** | Permitir que outras pessoas usem com suas próprias vozes/contas. | Complica a tabela de banco de dados e quebra o conceito de "Assistente Pessoal Íntimo". | Focar em uma única conta local de uso exclusivo. |
| **Envio de Voz Contínuo (Always Listening)** | IA fica ouvindo 24/7 sem precisar apertar botão ou dizer Wake Word. | Consome muita CPU, gera falsos positivos irritantes e viola privacidade. | Controle simples por palavra de ativação na UI ou atalho de teclado (Espaço). |

## Feature Dependencies

```
[STT-01: Reconhecimento] ──produz texto──> [LLM-01: Integração Ollama]
                                                │
                                           gera resposta
                                                │
                                                ▼
[UI-01: Visualizador Canvas] <──frequência── [TTS-01: Edge-TTS]
                                                ▲
                                                │
                                        consome contexto
                                                │
                                        [MEM-01: Memória SQLite]
```

### Dependency Notes

- **Ollama depende de Modelos Instalados:** O Ollama precisa ter pelo menos um modelo baixado (o app listará e sugerirá o download se estiver vazio).
- **Edge-TTS / Kokoro alimentam a UI:** O stream de áudio é capturado no frontend usando a Web Audio API para gerar as animações reativas no Canvas.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **UI Cósmica:** Tela inicial escura com animação em Canvas dourado reativo à voz (sem campos de chat convencionais pesados, foco no visual cósmico "Eternos").
- [ ] **Conversação Bidirecional:** Clique para falar (STT) + Resposta por voz (Edge-TTS) integrada com Ollama local em PT-BR.
- [ ] **Menu de Modelos:** Dropdown elegante para alternar os modelos locais do Ollama em tempo real.
- [ ] **Memória de Fatos Básicos:** SQLite extrai fatos ditos pelo usuário na conversa e os exibe no "Cofre de Memórias" integrado na UI.
- [ ] **Monitor de Disco:** Exibição simples do uso atual em gigabytes e alertas rápidos.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Wake Word Local:** Palavra de ativação falada ("Ok Agent") usando biblioteca leve no frontend ou backend.
- [ ] **Detector Offline para Kokoro-TTS:** Integração total do Kokoro local para fala 100% desconectada da rede.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Ponte MCP Alexa:** Controle real de lâmpadas inteligentes e dispositivos de casa conectada via comandos de voz.
- [ ] **Visão Computacional Local:** Conectar a webcam para que a IA "veja" o usuário usando modelos VLM locais (ex: `llava`).

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| UI "Eternos" Canvas | HIGH | HIGH | P1 |
| Conversação Voz (STT/TTS) | HIGH | MEDIUM | P1 |
| Integração Ollama | HIGH | LOW | P1 |
| SQLite Fatos e Histórico | MEDIUM | MEDIUM | P1 |
| Monitor de Disco | LOW | LOW | P2 |
| Chaveamento Kokoro Local | MEDIUM | HIGH | P2 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Alexa / Google Home | Nanobot (Original Python) | Our Approach (ItudeAgent) |
|---------|---------------------|---------------------------|---------------------------|
| **Privacidade** | Baixa (Voz enviada para nuvem corporativa) | Média/Alta (Configuração complexa) | Máxima (LLM e STT locais, TTS opcional) |
| **Interface Visual** | Tela padrão de app de celular ou smart screen comercial | WebUI básica em terminal/HTML cru | Premium Sci-Fi "Eternos" cósmica alienígena |
| **Custo** | Grátis (Hardware pago) | Requer API paga da OpenAI para voz/LLM | 100% Gratuito (Ollama + Edge-TTS) |

## Sources

- [Instalador_nanobot GitHub] — Referência de funcionalidades do projeto original (MCP, canais, memória).
- [Eternals Movie Visual Identity] — Inspiração estética para o Canvas dourado alienígena.

---
*Feature research for: ItudeAgent*
*Researched: 2026-05-21*
