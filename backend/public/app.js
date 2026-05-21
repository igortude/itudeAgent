// Instanciar o STT Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;
} else {
  alert("Desculpe, seu navegador não suporta a Web Speech API. Use o Chrome ou Edge para a experiência completa.");
}

// Elementos DOM
const topIndicator = document.getElementById('top-indicator');
const chatLog = document.getElementById('chat-log');
const playerEl = document.getElementById('player');
const modelSelector = document.getElementById('model-selector');
const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');

// Estados globais
let isListening = false;
let isIA_Speaking = false;
let selectedModel = '';

// Web Audio API Context
let audioCtx = null;
let userAnalyser = null;
let iaAnalyser = null;
let micStream = null;
let micSourceNode = null;
let iaSourceNode = null;

// Configurações do Canvas & Animação
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Partículas
let particles = [];
const MAX_PARTICLES = 120;

// Rotações das órbitas
let rot1 = 0;
let rot2 = 0;
let rot3 = 0;

// Médias de volume
let userVol = 0;
let iaVol = 0;

// Redimensionamento do canvas
window.addEventListener('resize', () => {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
});

// ==========================================
// MÉTODOS DE LOG NA UI
// ==========================================

function addLog(type, text) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// ==========================================
// INICIALIZAÇÃO DO WEB AUDIO API
// ==========================================

async function initAudioContext() {
  if (audioCtx) return; // Já inicializado
  
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Configura analisador do usuário (mic)
    userAnalyser = audioCtx.createAnalyser();
    userAnalyser.fftSize = 128; // Pouco detalhe para performance
    
    // Configura analisador da IA (player)
    iaAnalyser = audioCtx.createAnalyser();
    iaAnalyser.fftSize = 256;
    
    // Conectar elemento de áudio da IA
    // O MediaElementSource só pode ser criado UMA vez por elemento
    iaSourceNode = audioCtx.createMediaElementSource(playerEl);
    iaSourceNode.connect(iaAnalyser);
    iaAnalyser.connect(audioCtx.destination); // Necessário para sair som nas caixas
    
    addLog('system', 'Sistema de áudio tridimensional ativado.');
  } catch (error) {
    console.error('[AudioContext] Erro de inicialização:', error);
  }
}

// Conectar o microfone à Web Audio API
async function connectMicAnalyser(stream) {
  if (!audioCtx) await initAudioContext();
  
  try {
    if (micSourceNode) {
      micSourceNode.disconnect();
    }
    micSourceNode = audioCtx.createMediaStreamSource(stream);
    micSourceNode.connect(userAnalyser);
  } catch (error) {
    console.error('[AudioContext] Erro conectando microfone:', error);
  }
}

// ==========================================
// POPULAR MODELOS OLLAMA
// ==========================================

async function loadModels() {
  try {
    const response = await fetch('/api/models');
    if (!response.ok) throw new Error('Falha ao obter modelos.');
    const data = await response.json();
    
    modelSelector.innerHTML = '';
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelector.appendChild(option);
      });
      selectedModel = data.models[0];
      addLog('system', `Modelo padrão carregado: ${selectedModel}`);
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Sem modelos locais';
      modelSelector.appendChild(option);
      addLog('system', 'Aviso: Nenhum modelo de IA encontrado no Ollama local.');
    }
  } catch (err) {
    console.error('[Models] Erro:', err);
    modelSelector.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

modelSelector.addEventListener('change', (e) => {
  selectedModel = e.target.value;
  addLog('system', `Modelo alterado para: ${selectedModel}`);
});

// Inicialização de modelos no boot
loadModels();

// ==========================================
// ANIMACAO CANVAS (ETERNOS COSMIC GEOMETRY)
// ==========================================

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.005;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

function renderLoop() {
  requestAnimationFrame(renderLoop);
  
  // Limpar fundo escuro translúcido para deixar trail das partículas
  ctx.fillStyle = 'rgba(3, 3, 3, 0.25)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // 1. Processar dados de volume do usuário
  if (userAnalyser && isListening) {
    const dataArray = new Uint8Array(userAnalyser.frequencyBinCount);
    userAnalyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    userVol = sum / dataArray.length;
  } else {
    userVol = 0;
  }

  // 2. Processar dados de volume da IA
  if (iaAnalyser && isIA_Speaking) {
    const dataArray = new Uint8Array(iaAnalyser.frequencyBinCount);
    iaAnalyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    iaVol = sum / dataArray.length;
  } else {
    iaVol = 0;
  }
  
  // Escolher cor baseado no estado
  let themeColor = 'rgba(230, 197, 92, 0.8)'; // Dourado fosco (Pausado)
  let shadowColor = 'rgba(230, 197, 92, 0.3)';
  
  if (isListening) {
    themeColor = 'rgba(255, 71, 87, 0.9)'; // Vermelho (Gravando)
    shadowColor = 'rgba(255, 71, 87, 0.5)';
  } else if (isIA_Speaking) {
    themeColor = 'rgba(30, 144, 255, 0.9)'; // Azul (Falando)
    shadowColor = 'rgba(30, 144, 255, 0.5)';
  }

  const volumeFactor = Math.max(userVol, iaVol);
  
  // Gerar partículas com base no volume
  if (volumeFactor > 15 && particles.length < MAX_PARTICLES) {
    for (let i = 0; i < Math.floor(volumeFactor / 20) + 1; i++) {
      particles.push(new Particle(centerX, centerY, themeColor));
    }
  }

  // Atualizar e desenhar partículas
  particles = particles.filter(p => p.alpha > 0.05);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  // 3. Desenhar órbitas cósmicas / geometria de Eternos
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = themeColor;
  ctx.shadowBlur = 15;
  ctx.shadowColor = shadowColor;
  
  // Rotação dinâmica
  rot1 += 0.003 + (volumeFactor * 0.0003);
  rot2 -= 0.002 + (volumeFactor * 0.0002);
  rot3 += 0.005 + (volumeFactor * 0.0005);
  
  // Runa central pulsante
  const baseRadius = 80 + (volumeFactor * 0.4);
  
  // Órbita 1 (Externa)
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
  ctx.stroke();
  
  // Órbita 2 (Intermediária com interrupções)
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 1.3, rot1, rot1 + Math.PI * 1.5);
  ctx.stroke();
  
  // Órbita 3 (Interna com elipse)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rot2);
  ctx.beginPath();
  ctx.ellipse(0, 0, baseRadius * 0.8, baseRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  
  // Linhas transversais geométricas (cruz sagrada cósmica)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rot3);
  ctx.beginPath();
  ctx.moveTo(-baseRadius * 2, 0);
  ctx.lineTo(baseRadius * 2, 0);
  ctx.moveTo(0, -baseRadius * 2);
  ctx.lineTo(0, baseRadius * 2);
  ctx.stroke();
  ctx.restore();

  // Runa / Anel de foco central
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = themeColor.replace('0.9', '0.1').replace('0.8', '0.05');
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Iniciar a animação
renderLoop();

// ==========================================
// ORQUESTRAÇÃO DE ÁUDIO & ECO
// ==========================================

playerEl.addEventListener('play', () => {
  isIA_Speaking = true;
  isListening = false;
  
  if (recognition) {
    recognition.stop();
  }
  
  topIndicator.textContent = 'Respondendo';
  topIndicator.className = 'speaking';
});

playerEl.addEventListener('ended', () => {
  isIA_Speaking = false;
  
  // Religamento do microfone pós-fala automático
  if (recognition) {
    recognition.start();
    isListening = true;
    topIndicator.textContent = 'Ouvindo';
    topIndicator.className = 'listening';
  }
});

// ==========================================
// EVENTOS DO RECONHECIMENTO DE VOZ (STT)
// ==========================================

if (recognition) {
  recognition.onstart = () => {
    if (!isIA_Speaking) {
      isListening = true;
      topIndicator.textContent = 'Ouvindo';
      topIndicator.className = 'listening';
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (!isIA_Speaking) {
      topIndicator.textContent = 'Pausado';
      topIndicator.className = 'paused';
    }
  };

  recognition.onerror = (event) => {
    console.error('[STT] Erro:', event.error);
    if (event.error === 'not-allowed') {
      addLog('system', 'Erro: Acesso ao microfone negado pelo navegador.');
      topIndicator.textContent = 'Acesso ao Mic Negado';
    }
  };

  recognition.onresult = async (event) => {
    const lastResultIndex = event.results.length - 1;
    const transcriptText = event.results[lastResultIndex][0].transcript.trim();

    if (!transcriptText) return;

    addLog('user', transcriptText);
    recognition.stop();
    topIndicator.textContent = 'Processando...';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptText,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      addLog('agent', data.reply);

      if (data.audioUrl) {
        playerEl.src = data.audioUrl;
        playerEl.play();
      } else {
        recognition.start();
      }
    } catch (err) {
      console.error('[API] Falha:', err);
      addLog('system', `Erro na conexão neural: ${err.message}`);
      recognition.start();
    }
  };
}

// ==========================================
// CONTROLE DE INTERAÇÃO (SPACE / CLICK)
// ==========================================

async function toggleMicrophone() {
  if (isIA_Speaking) return;

  // Garante a ativação inicial do AudioContext no primeiro gesto do usuário
  if (!audioCtx) {
    await initAudioContext();
  }

  // Tenta retomar AudioContext se ele foi suspenso pelo navegador
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  if (isListening) {
    if (recognition) recognition.stop();
    isListening = false;
    topIndicator.textContent = 'Pausado';
    topIndicator.className = 'paused';
  } else {
    // Solicitar permissão de microfone se necessário e capturar o stream para o analisador
    try {
      if (!micStream) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        connectMicAnalyser(micStream);
      }
      if (recognition) recognition.start();
    } catch (err) {
      console.error('[Mic] Erro de acesso:', err);
      addLog('system', 'Erro: Não foi possível obter acesso ao microfone.');
    }
  }
}

// Atalho Teclado
document.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  
  if (event.code === 'Space') {
    event.preventDefault(); // Evita scroll do espaço
    toggleMicrophone();
  }
});

// Clique na tela
canvas.addEventListener('click', () => {
  toggleMicrophone();
});
