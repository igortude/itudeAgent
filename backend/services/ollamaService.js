const OLLAMA_URL = 'http://127.0.0.1:11434';
const OLLAMA_MODEL = 'llama3.1'; // ou qwen2.5-coder, conforme configurado
const settingsService = require('./settingsService');

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
 * Obtém a lista de modelos instalados no Ollama.
 */
async function getModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models ? data.models.map(m => m.name) : [];
  } catch (error) {
    console.error('[OllamaService] Erro ao listar modelos:', error.message);
    return [];
  }
}

/**
 * Envia o texto para geração do LLM.
 * Injeta a persona do assistente "Eternos".
 * Retorna um fallback resiliente caso o Ollama não responda.
 */
async function generateResponse(promptText, modelName = OLLAMA_MODEL) {
  const isHealthy = await checkHealth();
  
  if (!isHealthy) {
    return "Estou offline no momento. Respondendo em modo de simulação. Verifique minha conexão local.";
  }

  const settings = settingsService.getSettings();
  const systemPrompt = settings.systemPrompt + "\nResponda diretamente a isso: ";

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
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
  generateResponse,
  getModels
};
