const { execFile } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const fs = require('fs');

const execFileAsync = util.promisify(execFile);
const settingsService = require('./settingsService');

/**
 * Gera um arquivo de áudio localmente usando o script Python tts_helper.py (Edge-TTS).
 * Retorna a URL relativa que o frontend usará para tocar o áudio.
 */
async function generateAudio(text) {
  // Configurar pasta e nome do arquivo
  const ttsDir = path.join(__dirname, '..', 'public', 'assets', 'tts');
  
  // Garantir que a pasta exista
  if (!fs.existsSync(ttsDir)) {
    fs.mkdirSync(ttsDir, { recursive: true });
  }

  const settings = settingsService.getSettings();
  const selectedVoice = settings.voice || 'pt-BR-FranciscaNeural';
  const isKokoro = selectedVoice.startsWith('kokoro-');

  const uuid = crypto.randomUUID();
  const ext = isKokoro ? 'wav' : 'mp3';
  const fileName = `output_${uuid}.${ext}`;
  const absoluteOutputPath = path.join(ttsDir, fileName);

  const pythonScriptPath = path.join(__dirname, '..', 'helpers', 'tts_helper.py');
  const pythonBin = path.join(__dirname, '..', 'venv', 'bin', 'python3');

  try {
    // Atenção: estamos executando o script Python do sistema ou de um venv
    // Se você criou um venv local, pode precisar usar './venv/bin/python'
    // Mas para o ambiente atual, chamaremos o python do venv local que criamos.
    
    // IMPORTANTE: child_process.execFile é seguro contra injeção de shell porque
    // envia os argumentos como um array diretamente para o executável sem passar por um shell.
    const { stdout, stderr } = await execFileAsync(pythonBin, [
      pythonScriptPath,
      '--text', text,
      '--voice', selectedVoice,
      '--output', absoluteOutputPath
    ]);
    
    if (stderr) {
       console.error(`[TTS Service] Warning (stderr): ${stderr}`);
    }

    console.log(`[TTS Service] Áudio gerado com sucesso: ${fileName}`);
    
    // Retorna a rota relativa que o Express servirá em sua pasta public estática.
    return `/assets/tts/${fileName}`;

  } catch (error) {
    console.error(`[TTS Service] Erro crítico executando o helper Python:`, error);
    // Em caso de erro, podemos retornar null para o express tratar.
    return null;
  }
}

module.exports = {
  generateAudio
};
