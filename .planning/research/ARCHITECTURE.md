# Architecture Research

**Domain:** Assistente de Voz Pessoal Adaptativo com IA Local
**Researched:** 2026-05-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Camada de Interface)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Speech STT   │  │   Canvas     │  │ Web Audio    │       │
│  │ (Navegador)  │  │ Visualizer   │  │  Analyzer    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
├─────────┼─────────────────┼─────────────────┼───────────────┤
│         ▼                 ▼                 ▼               │
│                 BACKEND (Orquestração API REST / Node)      │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Express Server (controllers, routes, static server)   │   │
│  └──────┬──────────────────────┬──────────────┬──────────┘   │
│         │                      │              │              │
├─────────┼──────────────────────┼──────────────┼──────────────┤
│         ▼                      ▼              ▼              │
│  MODELOS & VOZ          BANCO DE DADOS     SISTEMA           │
│  ┌──────────────┐      ┌──────────────┐ ┌──────────────┐     │
│  │ Ollama Local │      │ SQLite       │ │ Disk Tracker │     │
│  │  (:11434)    │      │ (memory.db)  │ │   (df CLI)   │     │
│  └──────┬───────┘      └──────────────┘ └──────────────┘     │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Python Helper│                                            │
│  │ (Edge/Kokoro)│                                            │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend UI** | Renderizar as animações douradas do Canvas (estilo Eternos), gerenciar o microfone do usuário com o Web Speech API e reproduzir as respostas em áudio da IA. | HTML5, Vanilla CSS3 (Visual Premium), JavaScript com Web Audio API. |
| **Backend Express** | Fornecer APIs HTTP REST para o frontend, rotear solicitações ao Ollama, disparar o gerador de voz Python, gerenciar leituras do disco e consultar o banco de dados. | Node.js com Express.js, `better-sqlite3` e `child_process` para o script de áudio. |
| **Python Voice Helper** | Script utilitário leve chamado pelo Node para executar a síntese de voz usando a biblioteca neural Microsoft `edge-tts` (Azure) ou o motor local `kokoro-onnx`. | Python 3.11 com bibliotecas `edge-tts` e `soundfile`. |
| **Banco SQLite** | Armazenar o histórico de mensagens, fatos aprendidos sobre o usuário (Tom, Nome, Preferências) e o histórico de uso de disco para previsão de crescimento. | Banco único SQLite (`~/.itudeagent/data.db`). |

## Recommended Project Structure

```
itudeagent/
├── backend/
│   ├── config/
│   │   └── database.js      # Conexão e inicialização do SQLite
│   ├── controllers/
│   │   ├── aiController.js   # Comunicação com o Ollama
│   │   ├── ttsController.js  # Disparo do script de voz Python
│   │   └── diskController.js # Rastreamento de disco e regressão
│   ├── helpers/
│   │   └── tts_generator.py  # Script Python de Edge-TTS/Kokoro
│   ├── public/               # Pasta estática do Frontend
│   │   ├── index.html        # Página da Interface Alienígena
│   │   ├── styles/
│   │   │   └── main.css      # Design e temas com brilho dourado
│   │   ├── js/
│   │   │   ├── visualizer.js # Motor de animação reativa do Canvas
│   │   │   ├── speech.js     # Captura de microfone STT e play TTS
│   │   │   └── main.js       # Orquestrador geral da UI
│   │   └── assets/           # Pasta temporária para arquivos de áudio (.mp3)
│   └── server.js             # Entrada principal do Node.js
├── requirements.txt          # Dependências do Python
└── package.json              # Dependências do Node.js
```

### Structure Rationale

- **backend/public/:** Ao colocar o frontend diretamente na pasta pública do servidor Express, eliminamos a complexidade de CORS e simplificamos a distribuição do app. O usuário pode abrir o navegador diretamente em `http://localhost:3000` para começar a interagir.
- **backend/helpers/tts_generator.py:** O script Python é totalmente desacoplado da lógica JS do servidor. Ele aceita parâmetros simples CLI e gera arquivos de áudio estáticos na pasta de assets, que são servidos de forma rápida para o navegador reproduzir.

## Architectural Patterns

### Pattern 1: Injeção de Contexto Dinâmico (Memory Prompt Ingestion)

**What:** Antes de cada envio de mensagem ao Ollama, o backend executa uma consulta SQLite para buscar fatos e preferências guardadas do usuário. Ele reconstrói o prompt do sistema injetando essas memórias no cabeçalho das diretivas.

**When to use:** Em todas as interações do agente com o LLM para simular aprendizado de longo prazo sem estourar o limite de tokens com o histórico completo.

**Example:**
```javascript
async function buildSystemPrompt(db) {
  const preferences = db.prepare("SELECT value FROM user_facts WHERE category = 'preference'").all();
  const facts = db.prepare("SELECT value FROM user_facts WHERE category = 'fact'").all();
  
  let prompt = "Você é o ItudeAgent, um assistente com tom sutil, calmo e acolhedor, como uma IA de filme de ficção científica (estilo os Eternos da Marvel).\n";
  prompt += "Use respostas concisas e poéticas quando apropriado.\n";
  
  if (facts.length > 0 || preferences.length > 0) {
    prompt += "\nVocê se lembra das seguintes informações sobre o usuário:\n";
    facts.forEach(f => prompt += `- ${f.value}\n`);
    preferences.forEach(p => prompt += `- Preferência: ${p.value}\n`);
  }
  return prompt;
}
```

### Pattern 2: Buffer de Frequência de Áudio em Canvas (Visual Audio-Reactive Loop)

**What:** O frontend usa a Web Audio API para conectar a tag `<audio>` do player (ou a entrada do microfone) a um `AnalyserNode`. Extraímos os dados de frequência a cada quadro e usamos esses valores para variar o raio, a velocidade de rotação e o brilho das elipses douradas desenhadas no Canvas.

**Trade-offs:** Consome processamento da GPU/CPU no navegador, mas fornece uma animação perfeitamente sincronizada com a fala e que aparenta estar viva.

## Data Flow

### Request Flow

```
[Usuário Fala]
     ↓
[speech.js (Web Speech)] ── Transcreve Texto ──> [main.js]
                                                     ↓
[tts.js <── áudio] <── [server.js] <── [aiController (Ollama)]
```

### Key Data Flows

1. **Extração de Fatos de Conversa:**
   - Após gerar a resposta textual, o servidor Node.js dispara um subprocesso rápido ou chamada assíncrona ao LLM em background: *"Analise a interação do usuário e extraia qualquer novo fato relevante (Ex: nome, hobby, preferência). Retorne em formato JSON"*.
   - Se encontrar novos fatos, insere no SQLite. O usuário vê o painel de memórias atualizado na UI na próxima renderização.

2. **Monitoramento e Tendência de Disco:**
   - O backend executa o comando nativo `df` a cada inicialização (ou agendamento de 1 hora) e armazena o percentual de uso no SQLite.
   - O `diskController.js` calcula a média de crescimento diário e executa uma regressão linear para projetar a data aproximada de limite de armazenamento, retornando isso em linguagem natural para o agente ler se o usuário perguntar *"como está meu disco?"*.

## Anti-Patterns

### Anti-Pattern 1: Carregar arquivos de áudio inteiros na memória do servidor
**What people do:** Fazer o script de áudio Python retornar o áudio serializado em base64 via JSON.
**Why it's wrong:** Congestiona a memória RAM do servidor Node.js em textos grandes e lentifica a resposta.
**Do this instead:** Salvar o arquivo `.mp3` temporário em `public/assets/` e retornar apenas a URL relativa (Ex: `/assets/fala_123.mp3`) para o navegador ler de forma assíncrona por streaming nativo.

---
*Architecture research for: ItudeAgent*
*Researched: 2026-05-21*
