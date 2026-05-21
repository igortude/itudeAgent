const express = require('express');
const cors = require('cors');
const ollamaService = require('./services/ollamaService');
const ttsService = require('./services/ttsService');

const app = express();
const PORT = 3000;

// Configurações do Express
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend (interface)
app.use(express.static('public'));

/**
 * Healthcheck unificado do servidor.
 * Verifica a saúde do próprio servidor Node.js e sua conexão com o motor Ollama.
 */
app.get('/api/health', async (req, res) => {
  const isOllamaConnected = await ollamaService.checkHealth();
  
  res.json({
    status: 'ok',
    server: 'ItudeAgent Backend Rodando',
    ollamaConnected: isOllamaConnected
  });
});

/**
 * Rota principal de chat (STT -> LLM -> Retorno de Texto).
 * Na próxima etapa será incluída a conversão TTS de áudio.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Nenhum texto foi providenciado.' });
    }
    
    console.log(`[STT] Recebido: "${text}"`);
    
    // Passar para o LLM processar
    const reply = await ollamaService.generateResponse(text);
    
    console.log(`[LLM] Respondendo: "${reply}"`);
    
    // Passar texto do LLM para o TTS converter em áudio
    const audioUrl = await ttsService.generateAudio(reply);
    
    res.json({ reply: reply, audioUrl: audioUrl });
  } catch (error) {
    console.error('[Server] Erro na rota de chat:', error);
    res.status(500).json({ error: 'Falha interna na inteligência artificial.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[ItudeAgent] Servidor de comunicação ativo na porta ${PORT}.`);
  console.log(`[ItudeAgent] Teste o healthcheck em http://localhost:${PORT}/api/health`);
});
