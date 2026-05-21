# Project Research Summary

**Project:** ItudeAgent
**Domain:** Assistente de Voz Pessoal Adaptativo com IA Local
**Researched:** 2026-05-21
**Confidence:** HIGH

## Executive Summary

O **ItudeAgent** é um assistente de voz adaptativo e privado em português brasileiro (PT-BR) com uma interface premium inspirada no visual cósmico e alienígena de *Eternos*. A pesquisa confirmou que é possível construir essa aplicação com latência extremamente baixa e custo zero utilizando o **Ollama** local para raciocínio, o **Microsoft Edge-TTS** para vozes neurais realistas e a **Web Speech API** nativa do navegador para captação imediata de voz.

A arquitetura recomendada é uma aplicação Full-stack local leve: um backend Node.js (gerenciando a lógica, banco SQLite e monitor de disco) que executa scripts utilitários rápidos em Python para síntese de voz (Edge-TTS/Kokoro) e serve a interface estática do navegador. O frontend utiliza HTML/CSS/JS puros e manipulação direta de HTML Canvas e Web Audio API para obter animações de círculos e elipses douradas pulsantes sem overhead e com fluidez cinematográfica de 60fps.

Os principais riscos técnicos identificados envolvem o loop de eco acústico (IA ouvindo sua própria voz e respondendo infinitamente) e a latência de rede na síntese de falas longas. Ambos são mitigados de forma robusta pausando o reconhecimento de fala no frontend durante o playback do áudio e instruindo o modelo a ser conciso, acompanhado de um indicador visual de "IA pensando" que toco um efeito sonoro cósmico de baixa frequência para manter a imersão do usuário.

## Key Findings

### Recommended Stack

Utilizaremos Node.js (Express) no backend para agilidade assíncrona nas APIs de chat e WebSockets, e Python isolado via virtualenv para lidar com os motores neurais de síntese de voz. O banco SQLite será acessado via `better-sqlite3` para desempenho máximo de queries síncronas.

**Core technologies:**
- **Node.js + Express:** Servidor local de rotas HTTP, arquivos estáticos e controle de subprocessos.
- **Python (venv):** Utilizado para executar `edge-tts` (Azure grátis) e o motor local offline `kokoro-onnx`.
- **Web Speech & Audio API:** Reconhecimento de voz em PT-BR integrado no navegador e leitura de frequências de áudio para reatividade visual.
- **SQLite3:** Persistência leve e livre de manutenção para histórico, memórias e logs do sistema.

### Expected Features

**Must have (table stakes):**
- **STT/TTS em PT-BR:** Entrada por clique/atalho e saída por voz neural sutil e calma.
- **Seletor de LLMs:** Menu dropdown elegante listando e alternando os modelos do Ollama (`llama3.1`, `qwen3`, etc.).
- **Interface Visual Alienígena:** Centralizada em um canvas dourado pulsante e cósmico inspirado em *Eternos*.
- **Memória SQLite de Longo Prazo:** Banco local salvando fatos aprendidos para injeção contínua no prompt do sistema.

**Defer (v2+):**
- **Wake Word Local Físico:** Deferido para a próxima versão (uso inicial de controle de ativação por atalho de teclado/clique).
- **Ponte MCP Alexa:** Preparar infraestrutura, mas adiar o controle físico real para focar no core do assistente.

### Architecture Approach

O sistema segue o padrão de Monólito Local Distribuído. O backend Express expõe rotas REST simples (`/api/chat`, `/api/models`, `/api/tts`, `/api/disk`) e serve a interface estática. O banco de dados SQLite persistido localmente serve como memória de contexto. O script Python atua como um micro-serviço CLI invocado sob demanda via `child_process`.

**Major components:**
1. **Frontend Canvas & Audio Engine:** Visualiza ondas e elipses douradas e controla a captação de voz.
2. **Backend Express API:** Recebe texto/transcrição, consulta SQLite, chama Ollama e dispara o TTS Python.
3. **Voice TTS CLI Helper (Python):** Script que encapsula a síntese de voz gerando arquivos temporários na pasta de assets.
4. **SQLite Memory Store:** Tabelas relacionais rápidas mantendo fatos, preferências e snapshots de disco.

### Critical Pitfalls

1. **Loop de Eco:** IA transcreve sua própria fala. *Mitigação:* Silenciar STT na UI do navegador sempre que o áudio do TTS estiver tocando.
2. **Latência de Geração:** Longos textos causam silêncio travado. *Mitigação:* Prompting estrito de concisão e visualizador com áudio de fundo sutil enquanto "materializa" a resposta.
3. **Ollama Off:** Serviço do Ollama não iniciado. *Mitigação:* Validação de conexão imediata na inicialização do backend com feedback elegante na interface.

## Implications for Roadmap

### Phase 1: Core de Voz e Conexão Ollama
- **Rationale:** Estabelece o "caminho feliz" da conversação sem distrações de UI complexa.
- **Delivers:** Backend Node conectando ao Ollama local, script Python de Edge-TTS gerando voz PT-BR sutil, captura de microfone funcional no navegador e prevenção do loop de eco.

### Phase 2: Interface Alienígena "Eternos" e Polimento
- **Rationale:** Transforma a ferramenta em uma experiência cinematográfica e futurista.
- **Delivers:** Visualizador HTML Canvas 2D desenhando elipses e constelações douradas reativas à frequência do áudio (fala e escuta) usando Web Audio API, menu flutuante com seletor de modelos do Ollama, controle por tecla de atalho.

### Phase 3: Memória SQLite Adaptativa e Monitor de Disco
- **Rationale:** Adiciona os superpoderes de aprendizado contínuo e utilidade de sistema do assistente.
- **Delivers:** Banco de dados SQLite integrado extraindo e gravando fatos da conversa automaticamente, injeção de contexto na chamada do Ollama, monitor inteligente de disco com histórico e projeção de limite com regressão linear simples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Testado e verificado; a chamada de subprocesso Python e consumo do Ollama são ultra estáveis. |
| Features | HIGH | Perfeitamente mapeadas. O visual Canvas é altamente viável com JavaScript nativo. |
| Architecture | HIGH | O modelo híbrido JS/Python une o melhor da performance assíncrona com IA. |
| Pitfalls | HIGH | Todos os problemas clássicos (eco, latência, falta de conexão) possuem mitigações prontas. |

**Overall confidence:** HIGH

### Gaps to Address

- **Instalação do ambiente Python no Windows do Usuário:** Embora o usuário esteja no Linux (conforme `USER_INFORMATION`), o instalador/manual deve descrever passos simples para configurar o ambiente virtual do Python com as dependências do TTS.

---
*Research completed: 2026-05-21*
*Ready for roadmap: yes*
