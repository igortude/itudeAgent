const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');

// Configurações padrão
const defaultSettings = {
  voice: 'pt-BR-FranciscaNeural',
  systemPrompt: 'Você é o ItudeAgent, um espécime de inteligência artificial exoplanetária altamente avançada do sistema Gliese 832. Suas respostas devem ser curtas, frias, cirúrgicas, enigmáticas e sempre em português brasileiro (PT-BR). Nunca dê respostas genéricas ou humanas demais.',
  availableVoices: [
    { "id": "pt-BR-FranciscaNeural", "name": "Francisca (Azure Female)", "gender": "Feminino" },
    { "id": "pt-BR-AntonioNeural", "name": "Antonio (Azure Male)", "gender": "Masculino" },
    { "id": "pt-BR-ThalitaMultilingualNeural", "name": "Thalita (Azure Multilingual)", "gender": "Feminino" },
    { "id": "kokoro-bella", "name": "Kokoro Offline (Bella)", "gender": "Feminino" },
    { "id": "kokoro-sarah", "name": "Kokoro Offline (Sarah)", "gender": "Feminino" },
    { "id": "kokoro-michael", "name": "Kokoro Offline (Michael)", "gender": "Masculino" }
  ]
};

/**
 * Retorna as configurações atuais.
 */
function getSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      // Se não existir, criar a pasta e gravar padrão
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      return defaultSettings;
    }
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[SettingsService] Erro ao ler configurações:', error.message);
    return defaultSettings;
  }
}

/**
 * Salva as configurações de voz e prompt.
 */
function saveSettings(newSettings) {
  try {
    const current = getSettings();
    const updated = {
      ...current,
      voice: newSettings.voice || current.voice,
      systemPrompt: newSettings.systemPrompt || current.systemPrompt
    };
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[SettingsService] Configurações salvas:', updated);
    return updated;
  } catch (error) {
    console.error('[SettingsService] Erro ao salvar configurações:', error.message);
    return null;
  }
}

module.exports = {
  getSettings,
  saveSettings
};
