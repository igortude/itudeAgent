const OLLAMA_URL = 'http://127.0.0.1:11434';
const OLLAMA_MODEL = 'llama3.1'; // ou qwen2.5-coder, conforme configurado

/**
 * Faz o healthcheck na API do Ollama.
 * Retorna true se estiver rodando e respondendo na porta 11434, false caso contrário.
 */
async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
    
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('[OllamaService] Falha no Healthcheck. Ollama parece estar offline:', error.message);
    return false;
  }
}

/**
 * Envia o texto para geração do LLM.
 * Injeta a persona do assistente "Eternos".
 * Retorna um fallback resiliente caso o Ollama não responda.
 */
async function generateResponse(promptText) {
  const isHealthy = await checkHealth();
  
  if (!isHealthy) {
    return "Estou offline no momento. Respondendo em modo de simulação. Verifique minha conexão local.";
  }

  const systemPrompt = `Você é o ItudeAgent, uma inteligência artificial cósmica e minimalista inspirada no filme Eternos.
Sua voz é calma, sutil e sua personalidade é elegante e direta. 
Você SEMPRE responde em Português do Brasil de forma concisa. 
Nunca dê respostas longas ou cansativas de se ouvir.
Responda diretamente a isso: `;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: systemPrompt + promptText,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('[OllamaService] Erro na geração:', error.message);
    return "Tive uma falha de conexão nas minhas sinapses neurais. Tente novamente em alguns segundos.";
  }
}

module.exports = {
  checkHealth,
  generateResponse
};
