const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ollamaService = require('./services/ollamaService');
const ttsService = require('./services/ttsService');
const actionService = require('./services/actionService');
const settingsService = require('./services/settingsService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const actionsFilePath = path.join(__dirname, 'data', 'actions.json');

// ==========================================
// HEALTHCHECK & MODELOS
// ==========================================

app.get('/api/health', async (req, res) => {
  const isOllamaConnected = await ollamaService.checkHealth();
  res.json({ status: 'ok', server: 'ItudeAgent Backend Rodando', ollamaConnected: isOllamaConnected });
});

app.get('/api/models', async (req, res) => {
  const models = await ollamaService.getModels();
  res.json({ models });
});

// ==========================================
// WAKE WORD — SAUDAÇÃO
// ==========================================

app.post('/api/greet', async (req, res) => {
  try {
    const greeting = 'Como posso servi-lo senhor?';
    console.log(`[WakeWord] Ativação detectada. Saudação: "${greeting}"`);
    const audioUrl = await ttsService.generateAudio(greeting);
    res.json({ reply: greeting, audioUrl });
  } catch (error) {
    console.error('[Server] Erro na saudação:', error);
    res.status(500).json({ error: 'Falha ao gerar saudação.' });
  }
});

// ==========================================
// CHAT PRINCIPAL (STT → Ação/LLM → TTS)
// ==========================================

app.post('/api/chat', async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) return res.status(400).json({ error: 'Nenhum texto.' });

    console.log(`[STT] Recebido: "${text}" | modelo: "${model || 'default'}"`);

    // 1. Detectar se é um comando de ação
    const action = actionService.detectAction(text);

    if (action) {
      console.log(`[Action] Detectado: ${action.category} → ${action.target} (${action.binary || 'SEM BINÁRIO'})`);

      // Ação sem binário mapeado → pedir ao usuário para ensinar
      if (!action.binary) {
        const reply = `Não encontrei o programa "${action.target}" nas minhas sinapses neurais. Gostaria de me ensinar o comando Linux correspondente?`;
        const audioUrl = await ttsService.generateAudio(reply);
        return res.json({
          reply, audioUrl,
          unrecognizedAction: true,
          category: action.category,
          targetName: action.target
        });
      }

      // Ação composta (ex: "toque uma música" → abre app + pergunta qual música)
      if (action.compound) {
        console.log(`[Compound] Abrindo ${action.binary} e preparando follow-up...`);
        // Abrir o app em background
        await actionService.executeAction({ ...action, compound: false });
        const audioUrl = await ttsService.generateAudio(action.followUp);
        return res.json({
          reply: action.followUp,
          audioUrl,
          compoundAction: true,
          binary: action.binary,
          searchCommand: action.searchCommand,
          category: action.category,
          targetName: action.target
        });
      }

      // Ação simples (abrir, fechar, pesquisar)
      const result = await actionService.executeAction(action);
      console.log(`[Action] Resultado: "${result}"`);
      const audioUrl = await ttsService.generateAudio(result);
      return res.json({ reply: result, audioUrl, actionExecuted: true });
    }

    // 2. Não é comando → passar para o LLM
    const reply = await ollamaService.generateResponse(text, model);
    console.log(`[LLM] Respondendo: "${reply}"`);
    const audioUrl = await ttsService.generateAudio(reply);
    res.json({ reply, audioUrl });

  } catch (error) {
    console.error('[Server] Erro na rota de chat:', error);
    res.status(500).json({ error: 'Falha interna.' });
  }
});

// ==========================================
// COMPOUND SEARCH (etapa 2 de ações compostas)
// ==========================================

app.post('/api/compound-search', async (req, res) => {
  try {
    const { query, searchCommand } = req.body;
    if (!query || !searchCommand) {
      return res.status(400).json({ error: 'Query e searchCommand obrigatórios.' });
    }

    console.log(`[Compound] Pesquisando: "${query}"`);
    const result = await actionService.executeCompoundSearch(searchCommand, query);
    const audioUrl = await ttsService.generateAudio(result);
    res.json({ reply: result, audioUrl, actionExecuted: true });

  } catch (error) {
    console.error('[Server] Erro no compound-search:', error);
    res.status(500).json({ error: 'Falha na busca composta.' });
  }
});

// ==========================================
// GERENCIAMENTO DE AÇÕES (CRUD)
// ==========================================

app.get('/api/actions', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8')));
  } catch (e) {
    res.status(500).json({ error: 'Erro ao ler ações.' });
  }
});

app.post('/api/actions/target', (req, res) => {
  try {
    const { category, targetName, binary, description } = req.body;
    if (!category || !targetName || !binary) {
      return res.status(400).json({ error: 'Campos obrigatórios: category, targetName, binary.' });
    }
    const data = JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8'));
    const group = data.actions.find(a => a.category === category);
    if (!group) return res.status(404).json({ error: `Categoria "${category}" não encontrada.` });

    group.targets[targetName.toLowerCase()] = { binary, description: description || targetName };
    fs.writeFileSync(actionsFilePath, JSON.stringify(data, null, 2));
    actionService.reloadActions();

    console.log(`[Actions] Aprendido: "${targetName}" → "${binary}" (${category})`);
    res.json({ success: true, message: `"${targetName}" gravado com sucesso.` });
  } catch (e) {
    console.error('[Actions] Erro ao adicionar:', e);
    res.status(500).json({ error: 'Erro ao salvar.' });
  }
});

app.delete('/api/actions/target', (req, res) => {
  try {
    const { category, targetName } = req.body;
    const data = JSON.parse(fs.readFileSync(actionsFilePath, 'utf-8'));
    const group = data.actions.find(a => a.category === category);
    if (!group || !group.targets[targetName.toLowerCase()]) {
      return res.status(404).json({ error: 'Target não encontrado.' });
    }
    delete group.targets[targetName.toLowerCase()];
    fs.writeFileSync(actionsFilePath, JSON.stringify(data, null, 2));
    actionService.reloadActions();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover.' });
  }
});

// ==========================================
// CONFIGURAÇÕES DE PERSONALIDADE E VOZ
// ==========================================

app.get('/api/settings', (req, res) => {
  res.json(settingsService.getSettings());
});

app.post('/api/settings', (req, res) => {
  const { voice, systemPrompt } = req.body;
  const updated = settingsService.saveSettings({ voice, systemPrompt });
  if (updated) res.json({ success: true, settings: updated });
  else res.status(500).json({ error: 'Erro ao salvar.' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log(`[ItudeAgent] Servidor ativo na porta ${PORT}.`);
  console.log(`[ItudeAgent] http://localhost:${PORT}`);
});
