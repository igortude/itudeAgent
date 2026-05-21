# Pitfalls Research

**Domain:** Assistente de Voz Pessoal Adaptativo com IA Local
**Researched:** 2026-05-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Loop de Eco de Voz (A IA se escuta e responde a si mesma)

**What goes wrong:**
O assistente fala a resposta pelo alto-falante. O microfone do computador capta o áudio da própria IA falando, transcreve como se fosse uma nova fala do usuário, e envia para o Ollama. Isso cria um loop infinito e bizarro de auto-conversação da IA.

**Why it happens:**
A captação do microfone (STT) permanece ativa enquanto o player de áudio (TTS) está reproduzindo a resposta.

**How to avoid:**
O módulo `speech.js` na interface do navegador deve silenciar/pausar explicitamente o motor de reconhecimento (`SpeechRecognition.stop()`) no exato momento em que o áudio da IA começa a tocar, e só reativá-lo (`SpeechRecognition.start()`) quando o evento `onended` do elemento de áudio for disparado.

**Warning signs:**
Mensagens repetidas ou respostas a frases que o usuário não disse aparecendo no histórico de chat logo após o assistente terminar de falar.

**Phase to address:**
Phase 1 (Ciclo de Conversação Principal).

---

### Pitfall 2: Latência do Edge-TTS em textos longos (Silêncio desconfortável)

**What goes wrong:**
O Ollama gera uma resposta longa de 3 parágrafos. O backend envia todo o texto de uma vez para o Python sintetizar. A geração do arquivo de áudio demora 3 a 5 segundos, durante os quais a interface fica paralisada em silêncio absoluto. O usuário acha que o sistema travou.

**Why it happens:**
Tentar sintetizar blocos massivos de texto em lote (batch processing) antes de começar a reproduzir qualquer som.

**How to avoid:**
1. Instruir o LLM via System Prompt a fornecer respostas concisas (máximo 2 a 3 frases por interação).
2. Na interface, exibir uma animação pulsante dourada especial "IA Pensando/Materializando" e tocar um efeito sonoro de baixíssima frequência (um hum cósmico de ficção científica sutil) enquanto o backend gera o áudio. Isso transforma a espera em parte da experiência de ficção científica.

**Warning signs:**
Tempo de resposta de áudio superior a 1.5 segundos.

**Phase to address:**
Phase 1 (Ciclo de Conversação) e Phase 2 (Polimento UI/UX).

---

### Pitfall 3: Modelos do Ollama Não Baixados / Serviço Desativado

**What goes wrong:**
O usuário inicia o servidor Node.js e abre a interface, mas a rota `/api/chat` falha silenciosamente ou trava porque o executável do Ollama não está rodando na máquina ou o modelo selecionado ainda não foi baixado (`ollama pull`).

**Why it happens:**
Presumir que o ambiente local do Ollama está sempre perfeitamente configurado e ativo.

**How to avoid:**
O backend deve fazer uma chamada rápida de verificação (`healthcheck`) ao endpoint local do Ollama (`http://localhost:11434/api/tags`) na inicialização do servidor. Se falhar, o backend avisa o frontend para exibir uma mensagem elegante com tipografia alienígena em dourado avisando: *"Sinal mental desconectado. Certifique-se de que o Ollama está ativo na porta 11434"*.

**Warning signs:**
Erros `ECONNREFUSED` constantes nos logs do console do backend ao tentar enviar prompts.

**Phase to address:**
Phase 1 (Orquestração do Backend).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Salvar áudios permanentemente** | Evita gerar novamente o mesmo áudio se o usuário repetir uma pergunta. | Consome gigabytes de espaço em disco rapidamente com arquivos `.mp3` inúteis. | **Nunca**. Os arquivos de áudio temporários devem ser limpos a cada nova inicialização ou após 5 minutos. |
| **Ignorar suporte a navegadores não-Chromium** | Economiza tempo de codificação de fallbacks de STT usando apenas a Web Speech API. | Usuários no Firefox ou Safari não terão áudio-captura funcionando e verão uma tela preta ou quebrada. | **Aceitável no MVP (v1)**. Como é uma ferramenta pessoal rodando localmente na máquina do próprio usuário, basta ele abrir no Chrome ou Edge. |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **O Banco SQLite fica bloqueado** | LOW | Reiniciar o servidor Node.js e certificar-se de fechar conexões abertas com `db.close()` nos handlers de erro. |
| **Microfone para de escutar sem motivo** | LOW | Implementar um listener de `onerror` na Web Speech API que força o reinício do reconhecimento automaticamente após 1 segundo de inatividade. |

---
*Pitfalls research for: ItudeAgent*
*Researched: 2026-05-21*
