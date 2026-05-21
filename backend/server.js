const express = require('express');
const cors = require('cors');
const ollamaService = require('./services/ollamaService');
const ttsService = require('./services/ttsService');
const actionService = require('./services/actionService');

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
 * Retorna os modelos locais disponíveis no Ollama.
 */
app.get('/api/models', async (req, res) => {
  const models = await ollamaService.getModels();
  res.json({ models });
});

/**
 * Rota principal de chat (STT -> LLM -> Retorno de Texto).
 * Na próxima etapa será incluída a conversão TTS de áudio.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { text, model } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Nenhum texto foi providenciado.' });
    }
    
    console.log(`[STT] Recebido: "${text}" usando modelo: "${model || 'default'}"`);
    
    // 1. Verificar se é um COMANDO DE AÇÃO (abrir app, fechar app, etc.)
    const action = actionService.detectAction(text);
    
    if (action) {
      console.log(`[Action] Detectado: ${action.category} -> ${action.target} (${action.binary})`);
      const actionResult = await actionService.executeAction(action);
      console.log(`[Action] Resultado: "${actionResult}"`);
      
      // Gerar áudio da confirmação
      const audioUrl = await ttsService.generateAudio(actionResult);
      return res.json({ reply: actionResult, audioUrl: audioUrl, actionExecuted: true });
    }
    
    // 2. Se não for comando de ação, passar para o LLM processar normalmente
    const reply = await ollamaService.generateResponse(text, model);
    
    console.log(`[LLM] Respondendo: "${reply}"`);
    
    // Passar texto do LLM para o TTS converter em áudio
    const audioUrl = await ttsService.generateAudio(reply);
    
    res.json({ reply: reply, audioUrl: audioUrl });
  } catch (error) {
    console.error('[Server] Erro na rota de chat:', error);
    res.status(500).json({ error: 'Falha interna na inteligência artificial.' });
  }
});

// ==========================================
// API DE GERENCIAMENTO DE AÇÕES
// ==========================================

const fs = require('fs');
const path = require('path');
const actionsFilePath = path.join(__dirname, 'data', 'actions.json');

/**
 * Retorna todas as ações cadastradas.
 */
app.get('/api/actions', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler ações.' });
  }
});

/**
 * Adiciona um novo target a uma categoria existente.
 * Body: { category: "open", targetName: "obs studio", binary: "obs", description: "OBS Studio" }
 */
app.post('/api/actions/target', (req, res) => {
  try {
    const { category, targetName, binary, description } = req.body;
    
    if (!category || !targetName || !binary) {
      return res.status(400).json({ error: 'Campos obrigatórios: category, targetName, binary.' });
    }
    
    const data = JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8'));
    const actionGroup = data.actions.find(a => a.category === category);
    
    if (!actionGroup) {
      return res.status(404).json({ error: `Categoria "${category}" não encontrada.` });
    }
    
    actionGroup.targets[targetName.toLowerCase()] = {
      binary: binary,
      description: description || targetName
    };
    
    fs.writeFileSync(actionsFilePath, JSON.stringify(data, null, 2));
    actionService.reloadActions();
    
    console.log(`[Actions] Adicionado: "${targetName}" -> "${binary}" na categoria "${category}"`);
    res.json({ success: true, message: `"${targetName}" adicionado com sucesso.` });
  } catch (error) {
    console.error('[Actions] Erro ao adicionar:', error);
    res.status(500).json({ error: 'Erro ao salvar ação.' });
  }
});

/**
 * Remove um target de uma categoria.
 * Body: { category: "open", targetName: "obs studio" }
 */
app.delete('/api/actions/target', (req, res) => {
  try {
    const { category, targetName } = req.body;
    
    const data = JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8'));
    const actionGroup = data.actions.find(a => a.category === category);
    
    if (!actionGroup || !actionGroup.targets[targetName.toLowerCase()]) {
      return res.status(404).json({ error: 'Target não encontrado.' });
    }
    
    delete actionGroup.targets[targetName.toLowerCase()];
    fs.writeFileSync(actionsFilePath, JSON.stringify(data, null, 2));
    actionService.reloadActions();
    
    console.log(`[Actions] Removido: "${targetName}" da categoria "${category}"`);
    res.json({ success: true, message: `"${targetName}" removido.` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover ação.' });
  }
});

// ==========================================
// API DE CONFIGURAÇÕES DE PERSONALIDADE E VOZ
// ==========================================

const settingsService = require('./services/settingsService');

/**
 * Retorna as configurações atuais.
 */
app.get('/api/settings', (req, res) => {
  const currentSettings = settingsService.getSettings();
  res.json(currentSettings);
});

/**
 * Atualiza e salva as configurações de personalidade e voz.
 */
app.post('/api/settings', (req, res) => {
  const { voice, systemPrompt } = req.body;
  const updated = settingsService.saveSettings({ voice, systemPrompt });
  if (updated) {
    res.json({ success: true, settings: updated });
  } else {
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[ItudeAgent] Servidor de comunicação ativo na porta ${PORT}.`);
  console.log(`[ItudeAgent] Teste o healthcheck em http://localhost:${PORT}/api/health`);
});
