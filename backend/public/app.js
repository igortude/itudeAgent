// Instanciar o STT Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Desculpe, seu navegador não suporta a Web Speech API. Use o Chrome ou Edge para a experiência completa.");
}

const recognition = new SpeechRecognition();
recognition.lang = 'pt-BR';
recognition.continuous = true;
recognition.interimResults = false;

// Elementos da DOM
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');
const playerEl = document.getElementById('player');

// Estados globais
let isListening = false;
let isIA_Speaking = false;

// Função utilitária para mudar a interface do status
function updateStatus(state, message) {
  statusEl.textContent = message;
  statusEl.className = state;
}

// ==========================================
// MUTE AUTOMÁTICO E ORQUESTRAÇÃO DE ECO
// ==========================================

playerEl.addEventListener('play', () => {
  console.log('[Orquestração] IA começou a falar. Desligando microfone...');
  isIA_Speaking = true;
  
  if (isListening) {
    recognition.stop();
  }
  
  updateStatus('speaking', 'Respondendo...');
});

playerEl.addEventListener('ended', () => {
  console.log('[Orquestração] IA terminou de falar. Religando microfone...');
  isIA_Speaking = false;
  
  // Religamos automaticamente apenas se o usuário havia deixado "LIGADO" antes
  // Por simplicidade na Phase 1, vamos forçar a religação se for o fluxo esperado.
  recognition.start();
  isListening = true;
  updateStatus('listening', 'Ouvindo...');
});

// ==========================================
// EVENTOS DO RECONHECIMENTO DE VOZ (STT)
// ==========================================

recognition.onstart = () => {
  if (!isIA_Speaking) {
    isListening = true;
    updateStatus('listening', 'Ouvindo...');
  }
};

recognition.onend = () => {
  isListening = false;
  // Se a IA NÃO está falando, e o mic parou (ex: por silêncio demorado ou erro), 
  // nós apenas marcamos como pausado.
  if (!isIA_Speaking) {
    updateStatus('paused', 'Pausado');
  }
};

recognition.onerror = (event) => {
  console.error('[STT] Erro no reconhecimento:', event.error);
  if (event.error === 'not-allowed') {
    updateStatus('paused', 'Acesso ao Microfone Negado');
  }
};

recognition.onresult = async (event) => {
  // A WebSpeechAPI retorna um array de resultados
  const lastResultIndex = event.results.length - 1;
  const transcriptText = event.results[lastResultIndex][0].transcript.trim();

  if (!transcriptText) return;

  transcriptEl.textContent = `Você disse: "${transcriptText}"`;
  console.log(`[STT] Enviando para API: "${transcriptText}"`);

  // Desativar a escuta ativamente antes da requisição para ter certeza que não há delay
  recognition.stop();
  updateStatus('paused', 'Pensando...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcriptText })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[LLM] Recebido:', data);

    // Atualiza a tela com o que a IA respondeu
    transcriptEl.textContent = `IA: "${data.reply}"`;

    // Se a IA tiver gerado áudio, toca no player
    if (data.audioUrl) {
      playerEl.src = data.audioUrl;
      // O play dispara o evento 'play' acima, que ajusta a interface.
      playerEl.play(); 
    } else {
      // Caso seja erro na API de voz e só tenhamos texto, apenas religamos o mic
      recognition.start();
    }

  } catch (err) {
    console.error('[API] Falha de comunicação com backend:', err);
    transcriptEl.textContent = `Erro: ${err.message}`;
    recognition.start();
  }
};

// ==========================================
// CONTROLE TÁTIL E MANUAL (SPACEBAR)
// ==========================================

document.addEventListener('keydown', (event) => {
  // Ignora se for keydown repetido segurando a tecla
  if (event.repeat) return;

  if (event.code === 'Space') {
    // Se a IA está falando, bloqueamos o usuário de interromper facilmente na Phase 1.
    // (A interrupção será trabalhada em polimentos de fases seguintes)
    if (isIA_Speaking) {
      console.log('[Controle] IA está falando. Bloqueado.');
      return;
    }

    if (isListening) {
      console.log('[Controle] Pausando manualmente via Espaço.');
      recognition.stop();
      isListening = false;
      updateStatus('paused', 'Pausado');
    } else {
      console.log('[Controle] Iniciando manualmente via Espaço.');
      try {
        recognition.start();
      } catch (e) {
        // As vezes a engine já começou.
      }
    }
  }
});
