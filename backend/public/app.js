// ═══════════════════════════════════════════════════════
//  XENOLYTICA // EXOPLANETARY ANALYSIS CONTROLLER
// ═══════════════════════════════════════════════════════

// ─── STT Setup ───
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;
}

// ─── DOM Elements ───
const activeLlmLbl = document.getElementById('active-llm-lbl');
const chatLog = document.getElementById('chat-log');
const playerEl = document.getElementById('player');
const modelSelector = document.getElementById('model-selector');
const voiceSelector = document.getElementById('voice-selector');
const promptEditor = document.getElementById('prompt-editor');
const btnSaveSettings = document.getElementById('btn-save-settings');
const actionFeed = document.getElementById('action-feed');
const centerStatusPulse = document.getElementById('center-status-pulse');
const centerStatusLbl = document.getElementById('center-status-lbl');
const micTrigger = document.getElementById('mic-trigger');

const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');

const dnaCanvas = document.getElementById('dna-canvas');
const dnaCtx = dnaCanvas.getContext('2d');

const spectralCanvas = document.getElementById('spectral-canvas');
const spectralCtx = spectralCanvas.getContext('2d');

const brainCanvas = document.getElementById('brain-canvas');
const brainCtx = brainCanvas.getContext('2d');

const actionsList = document.getElementById('actions-list');
const btnAddAction = document.getElementById('btn-add-action');
const inputTargetName = document.getElementById('new-target-name');
const inputTargetBinary = document.getElementById('new-target-binary');

// ─── State ───
let isListening = false;
let isIA_Speaking = false;
let selectedModel = '';
let activeActionCategory = 'open';

// ─── Web Audio API ───
let audioCtx = null;
let userAnalyser = null;
let iaAnalyser = null;
let micStream = null;
let micSourceNode = null;
let iaSourceNode = null;

// ─── Canvas Radii ───
let W = canvas.parentElement.clientWidth;
let H = canvas.parentElement.clientHeight;
canvas.width = W;
canvas.height = H;

// Fit canvases on resize
function resizeCanvases() {
  W = canvas.parentElement.clientWidth;
  H = canvas.parentElement.clientHeight;
  canvas.width = W;
  canvas.height = H;
  
  dnaCanvas.width = dnaCanvas.parentElement.clientWidth;
  dnaCanvas.height = dnaCanvas.parentElement.clientHeight;
  
  spectralCanvas.width = spectralCanvas.parentElement.clientWidth;
  spectralCanvas.height = spectralCanvas.parentElement.clientHeight;
  
  brainCanvas.width = brainCanvas.parentElement.clientWidth;
  brainCanvas.height = brainCanvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 200);

let rot1 = 0, rot2 = 0, rot3 = 0;
let userVol = 0, iaVol = 0;
let smoothUserVol = 0, smoothIaVol = 0;
let brainPulse = 0;

// ═══════════════════════════════════════════════════════
//  TERMINAL & COMMUNICATION LOGGING
// ═══════════════════════════════════════════════════════

function addTerminalLog(message) {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.textContent = `[${time}] ${message}`;
  actionFeed.appendChild(line);
  actionFeed.scrollTop = actionFeed.scrollHeight;
}

function addChatLog(type, text) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  const label = document.createElement('span');
  label.className = 'log-label';
  label.textContent = type === 'user' ? 'TRANSCRIÇÃO DE VOZ' : type === 'agent' ? 'RESPOSTA DE ESPÉCIME' : type === 'action' ? 'EXECUTOR TERMINAL' : 'SISTEMA';
  entry.appendChild(label);

  const content = document.createTextNode(text);
  entry.appendChild(content);
  chatLog.appendChild(entry);

  const container = chatLog.parentElement;
  container.scrollTop = container.scrollHeight;
}

// ═══════════════════════════════════════════════════════
//  WEB AUDIO API
// ═══════════════════════════════════════════════════════

async function initAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    userAnalyser = audioCtx.createAnalyser();
    userAnalyser.fftSize = 128;

    iaAnalyser = audioCtx.createAnalyser();
    iaAnalyser.fftSize = 256;

    iaSourceNode = audioCtx.createMediaElementSource(playerEl);
    iaSourceNode.connect(iaAnalyser);
    iaAnalyser.connect(audioCtx.destination);

    addTerminalLog('SISTEMA DE ÁUDIO TRIDIMENSIONAL INTEGRADO');
  } catch (e) {
    console.error('[AudioCtx] Init error:', e);
  }
}

async function connectMicAnalyser(stream) {
  if (!audioCtx) await initAudioContext();
  try {
    if (micSourceNode) micSourceNode.disconnect();
    micSourceNode = audioCtx.createMediaStreamSource(stream);
    micSourceNode.connect(userAnalyser);
  } catch (e) {
    console.error('[AudioCtx] Mic connect error:', e);
  }
}

// ═══════════════════════════════════════════════════════
//  SETTINGS & MODEL API
// ═══════════════════════════════════════════════════════

async function loadModels() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    modelSelector.innerHTML = '';
    if (data.models && data.models.length > 0) {
      data.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m.toUpperCase();
        modelSelector.appendChild(opt);
      });
      selectedModel = data.models[0];
      activeLlmLbl.textContent = selectedModel.split(':')[0].toUpperCase();
      addTerminalLog(`MODELO ATIVO CARREGADO: ${selectedModel}`);
    } else {
      modelSelector.innerHTML = '<option value="">SEM MODELOS</option>';
    }
  } catch (e) {
    modelSelector.innerHTML = '<option value="">ERRO DE CARREGAMENTO</option>';
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    
    // Configurar o prompt de personalidade
    promptEditor.value = settings.systemPrompt;
    
    // Configurar o seletor de voz
    voiceSelector.innerHTML = '';
    settings.availableVoices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name;
      if (v.id === settings.voice) {
        opt.selected = true;
      }
      voiceSelector.appendChild(opt);
    });
    addTerminalLog(`CONFIGURAÇÕES DE ASSINATURA COGNITIVA CARREGADAS`);
  } catch (e) {
    console.error('[Settings] Load error:', e);
  }
}

btnSaveSettings.addEventListener('click', async () => {
  const voice = voiceSelector.value;
  const prompt = promptEditor.value;
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice, systemPrompt: prompt })
    });
    const data = await res.json();
    if (data.success) {
      addTerminalLog(`ASSINATURA COGNITIVA SALVA COM SUCESSO`);
      addChatLog('system', 'Personalidade e voz atualizadas no motor exoplanetário.');
    }
  } catch (e) {
    addTerminalLog(`ERRO AO ATUALIZAR CONFIGURAÇÕES`);
  }
});

modelSelector.addEventListener('change', e => {
  selectedModel = e.target.value;
  activeLlmLbl.textContent = selectedModel.split(':')[0].toUpperCase();
  addTerminalLog(`COGNITIVE MODEL ALTERADO PARA: ${selectedModel}`);
});

// Inicializar configs
loadModels();
loadSettings();

// ═══════════════════════════════════════════════════════
//  ACTIONS MANAGEMENT
// ═══════════════════════════════════════════════════════

async function loadActions() {
  try {
    const res = await fetch('/api/actions');
    const data = await res.json();
    renderActions(data, activeActionCategory);
  } catch (e) {
    actionsList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.65rem;">Erro de rede</div>';
  }
}

function renderActions(data, category) {
  actionsList.innerHTML = '';
  const group = data.actions.find(a => a.category === category);
  if (!group || Object.keys(group.targets).length === 0) {
    actionsList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.62rem; padding: 6px;">Vazio</div>';
    return;
  }
  for (const [name, info] of Object.entries(group.targets)) {
    const item = document.createElement('div');
    item.className = 'action-item';
    item.innerHTML = `
      <div>
        <span class="action-name">${name.toUpperCase()}</span>
        <span class="action-binary">${info.binary}</span>
      </div>
      <button class="btn btn-danger" data-target="${name}" data-category="${category}">✕</button>
    `;
    actionsList.appendChild(item);
  }

  // Bind delete button events
  actionsList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetName = btn.dataset.target;
      const cat = btn.dataset.category;
      try {
        await fetch('/api/actions/target', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat, targetName })
        });
        loadActions();
        addTerminalLog(`REMOVIDA AÇÃO DOURADA: ${targetName}`);
      } catch (e) {
        console.error('Delete failed:', e);
      }
    });
  });
}

// Tab Switching
document.querySelectorAll('#action-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#action-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeActionCategory = tab.dataset.category;
    loadActions();
  });
});

// Add custom action
btnAddAction.addEventListener('click', async () => {
  const name = inputTargetName.value.trim();
  const binary = inputTargetBinary.value.trim();
  if (!name || !binary) return;

  try {
    const res = await fetch('/api/actions/target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: activeActionCategory,
        targetName: name,
        binary: binary,
        description: name
      })
    });
    const data = await res.json();
    if (data.success) {
      inputTargetName.value = '';
      inputTargetBinary.value = '';
      loadActions();
      addTerminalLog(`NOVA AÇÃO DE SISTEMA CRIADA: "${name}" → "${binary}"`);
    }
  } catch (e) {
    console.error('Add failed:', e);
  }
});

loadActions();

// ═══════════════════════════════════════════════════════
//  DYNAMIC CANVAS VISUALIZATIONS (XENOLYTICA HIGH-TECH)
// ═══════════════════════════════════════════════════════

// ─── 1. DNA HELIX ANGLE ───
let dnaAngle = 0;
function drawDnaHelix() {
  const w = dnaCanvas.width;
  const h = dnaCanvas.height;
  dnaCtx.clearRect(0, 0, w, h);
  
  const midY = h / 2;
  const length = w - 20;
  const amp = 25 + smoothIaVol * 0.4;
  const speed = 0.04 + smoothUserVol * 0.002;
  dnaAngle += speed;

  dnaCtx.lineWidth = 1;
  
  // Render nodes
  for (let x = 10; x < w - 10; x += 15) {
    const offset = (x / length) * Math.PI * 4;
    const y1 = midY + Math.sin(dnaAngle + offset) * amp;
    const y2 = midY + Math.sin(dnaAngle + offset + Math.PI) * amp;
    
    // Connect bridge
    dnaCtx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    dnaCtx.beginPath();
    dnaCtx.moveTo(x, y1);
    dnaCtx.lineTo(x, y2);
    dnaCtx.stroke();
    
    // Ball 1
    dnaCtx.fillStyle = '#00f3ff';
    dnaCtx.beginPath();
    dnaCtx.arc(x, y1, 2, 0, Math.PI * 2);
    dnaCtx.fill();
    
    // Ball 2
    dnaCtx.fillStyle = '#bc34fa';
    dnaCtx.beginPath();
    dnaCtx.arc(x, y2, 2, 0, Math.PI * 2);
    dnaCtx.fill();
  }
}

// ─── 2. BRAIN WAVE MAP ───
const brainNodes = [];
for (let i = 0; i < 25; i++) {
  brainNodes.push({
    x: Math.random() * 200 + 40,
    y: Math.random() * 80 + 15,
    r: Math.random() * 1.5 + 0.8,
    flashRate: Math.random() * 0.05 + 0.01,
    phase: Math.random() * Math.PI
  });
}

function drawBrainCanvas() {
  const w = brainCanvas.width;
  const h = brainCanvas.height;
  brainCtx.clearRect(0, 0, w, h);
  
  // Draw glowing grid brain outline
  brainCtx.save();
  brainCtx.translate(w/2 - 120, 0);
  
  // Render node links
  brainCtx.lineWidth = 0.5;
  for (let i = 0; i < brainNodes.length; i++) {
    const n1 = brainNodes[i];
    n1.phase += n1.flashRate;
    const alpha = 0.15 + Math.sin(n1.phase) * 0.15;
    
    for (let j = i + 1; j < brainNodes.length; j++) {
      const n2 = brainNodes[j];
      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      if (dist < 35) {
        brainCtx.strokeStyle = `rgba(188, 52, 250, ${alpha * (1 - dist / 35)})`;
        brainCtx.beginPath();
        brainCtx.moveTo(n1.x, n1.y);
        brainCtx.lineTo(n2.x, n2.y);
        brainCtx.stroke();
      }
    }
    
    // Nodes
    const pulseVol = (smoothIaVol > 10 ? smoothIaVol * 0.05 : 0);
    brainCtx.fillStyle = `hsla(280, 85%, 65%, ${alpha + 0.3})`;
    brainCtx.beginPath();
    brainCtx.arc(n1.x, n1.y, n1.r + pulseVol, 0, Math.PI * 2);
    brainCtx.fill();
  }
  brainCtx.restore();
}

// ─── 3. SPECTRAL ANALYSIS FREQUENCY ───
function drawSpectralCanvas() {
  const w = spectralCanvas.width;
  const h = spectralCanvas.height;
  spectralCtx.clearRect(0, 0, w, h);

  let analyser = null;
  if (isListening && userAnalyser) analyser = userAnalyser;
  else if (isIA_Speaking && iaAnalyser) analyser = iaAnalyser;
  
  if (analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (w / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * h;
      
      const r = 0;
      const g = 243;
      const b = 255;
      
      spectralCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${barHeight / h + 0.1})`;
      spectralCtx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
      
      // glowing peak
      spectralCtx.fillStyle = 'var(--neon-purple)';
      spectralCtx.fillRect(x, h - barHeight - 2, barWidth - 1, 2);

      x += barWidth;
    }
  } else {
    // Idle flat line
    spectralCtx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    spectralCtx.lineWidth = 1;
    spectralCtx.beginPath();
    spectralCtx.moveTo(0, h / 2);
    spectralCtx.lineTo(w, h / 2);
    spectralCtx.stroke();
  }
}

// ─── 4. MAIN CENTRAL HOLOGRAM CHAMBER (ALIEN SPECIMEN) ───
function drawContainmentHologram() {
  const cx = W / 2;
  const cy = H / 2;
  
  // Translucent backdrop clear
  ctx.fillStyle = 'rgba(3, 4, 15, 0.15)';
  ctx.fillRect(0, 0, W, H);
  
  const vol = Math.max(smoothUserVol, smoothIaVol);
  const scale = 1.0 + vol * 0.005;

  rot1 += 0.005 + vol * 0.0001;
  rot2 -= 0.003 + vol * 0.0001;

  // Concentric holographic outer tube cylinder lines
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  
  // Base rotating cylinder lock rings
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.stroke();

  // Ticks and ticks overlays
  ctx.save();
  ctx.rotate(rot1);
  ctx.strokeStyle = 'var(--neon-blue)';
  ctx.beginPath();
  ctx.setLineDash([3, 15]);
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(rot2);
  ctx.strokeStyle = 'var(--neon-purple)';
  ctx.beginPath();
  ctx.setLineDash([8, 30]);
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Center vector geometry alien "NX-7427 Core"
  // Inspired by movie Eternos, glowing wireframe geometric lock
  ctx.lineWidth = 1;
  let activeHue = isListening ? '350' : isIA_Speaking ? '280' : '185';
  
  ctx.strokeStyle = `hsla(${activeHue}, 90%, 60%, 0.3)`;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + rot1 * 0.5;
    const r1 = 30 + vol * 0.2;
    const r2 = 70 + vol * 0.4;
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
  }
  ctx.stroke();

  // Outer core polygon
  ctx.strokeStyle = `hsla(${activeHue}, 90%, 65%, 0.5)`;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * i + rot1 * 0.5;
    const r = 70 + vol * 0.4;
    const tx = Math.cos(angle) * r;
    const ty = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.closePath();
  ctx.stroke();

  // Center focal core
  ctx.fillStyle = `hsla(${activeHue}, 90%, 60%, ${0.1 + vol * 0.003})`;
  ctx.shadowBlur = 20 + vol * 0.2;
  ctx.shadowColor = `hsla(${activeHue}, 90%, 55%, 0.5)`;
  ctx.beginPath();
  ctx.arc(0, 0, 30 + vol * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0; // reset

  // Scanning laser lines sweeping up/down
  const scanY = Math.sin(Date.now() * 0.0018) * 160;
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-160, scanY);
  ctx.lineTo(160, scanY);
  ctx.stroke();

  // Draw cyber target dots on corners
  ctx.fillStyle = 'var(--neon-blue)';
  ctx.fillRect(-150, -150, 3, 3);
  ctx.fillRect(150, -150, 3, 3);
  ctx.fillRect(-150, 150, 3, 3);
  ctx.fillRect(150, 150, 3, 3);

  ctx.restore();
}

// ─── 5. GLOBAL ANIMATION LOOP ───
function renderLoop() {
  requestAnimationFrame(renderLoop);

  // Read volume data
  if (userAnalyser && isListening) {
    const d = new Uint8Array(userAnalyser.frequencyBinCount);
    userAnalyser.getByteFrequencyData(d);
    userVol = d.reduce((a, b) => a + b, 0) / d.length;
  } else {
    userVol *= 0.9;
  }

  if (iaAnalyser && isIA_Speaking) {
    const d = new Uint8Array(iaAnalyser.frequencyBinCount);
    iaAnalyser.getByteFrequencyData(d);
    iaVol = d.reduce((a, b) => a + b, 0) / d.length;
  } else {
    iaVol *= 0.9;
  }

  // Smooth interpolation
  smoothUserVol += (userVol - smoothUserVol) * 0.18;
  smoothIaVol += (iaVol - smoothIaVol) * 0.18;

  // Run render loops
  drawDnaHelix();
  drawBrainCanvas();
  drawSpectralCanvas();
  drawContainmentHologram();
}

renderLoop();

// ═══════════════════════════════════════════════════════
//  AUDIO ORCHESTRATION & ECHO PREVENTION
// ═══════════════════════════════════════════════════════

playerEl.addEventListener('play', () => {
  isIA_Speaking = true;
  isListening = false;
  if (recognition) recognition.stop();
  
  // Set UI state
  centerStatusPulse.className = 'pulse-indicator speaking';
  centerStatusLbl.textContent = 'CONVERSATIONAL TRANSMISSION IN PROGRESS';
});

playerEl.addEventListener('ended', () => {
  isIA_Speaking = false;
  
  // Reset UI
  centerStatusPulse.className = 'pulse-indicator';
  centerStatusLbl.textContent = 'CONTAINMENT SYSTEM READY // STANDBY';
  
  if (recognition) {
    recognition.start();
    isListening = true;
    centerStatusPulse.className = 'pulse-indicator active';
    centerStatusLbl.textContent = 'LISTENING FOR AUDIO WAVE INPUT...';
  }
});

playerEl.addEventListener('error', (e) => {
  console.error('[Player] Error:', e);
  addTerminalLog('ERRO NO MOTOR DE EXECUÇÃO DE ÁUDIO');
  isIA_Speaking = false;
  if (recognition) recognition.start();
});

// ═══════════════════════════════════════════════════════
//  STT EVENTS
// ═══════════════════════════════════════════════════════

if (recognition) {
  recognition.onstart = () => {
    if (!isIA_Speaking) {
      isListening = true;
      centerStatusPulse.className = 'pulse-indicator active';
      centerStatusLbl.textContent = 'LISTENING FOR AUDIO WAVE INPUT...';
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (!isIA_Speaking) {
      centerStatusPulse.className = 'pulse-indicator';
      centerStatusLbl.textContent = 'CONTAINMENT SYSTEM READY // STANDBY';
    }
  };

  recognition.onerror = (event) => {
    console.error('[STT] Error:', event.error);
    if (event.error === 'not-allowed') {
      addTerminalLog('ACESSO DE MICROFONE NEGADO');
    }
  };

  recognition.onresult = async (event) => {
    const idx = event.results.length - 1;
    const text = event.results[idx][0].transcript.trim();
    if (!text) return;

    addChatLog('user', text);
    recognition.stop();
    
    centerStatusPulse.className = 'pulse-indicator';
    centerStatusLbl.textContent = 'PROCESSING SPEECH SIGNALS...';
    addTerminalLog(`PROCESSANDO INTERFACE COGNITIVA: "${text.toUpperCase()}"`);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: selectedModel })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Show terminal action result
      if (data.actionExecuted) {
        addChatLog('action', data.reply);
        addTerminalLog(`AÇÃO EXECUTADA COM SUCESSO: ${data.reply}`);
      } else {
        addChatLog('agent', data.reply);
      }

      if (data.audioUrl) {
        // dynamic cache prevention
        playerEl.src = `${data.audioUrl}?t=${Date.now()}`;
        playerEl.play().catch(e => {
          console.error('[Player] Play blocked:', e);
          addTerminalLog('ÁUDIO BLOQUEADO PELO NAVEGADOR');
          if (recognition) recognition.start();
        });
      } else {
        if (recognition) recognition.start();
      }
    } catch (err) {
      console.error('[API] Error:', err);
      addTerminalLog(`FALHA NA SESSÃO DE CONEXÃO COGNITIVA`);
      if (recognition) recognition.start();
    }
  };
}

// ═══════════════════════════════════════════════════════
//  INTERACTION CONTROLS
// ═══════════════════════════════════════════════════════

async function toggleMicrophone() {
  if (isIA_Speaking) return;

  if (!audioCtx) await initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

  if (isListening) {
    if (recognition) recognition.stop();
    isListening = false;
    addTerminalLog('MIC DESATIVADO PELO ANALISTA');
  } else {
    try {
      if (!micStream) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        connectMicAnalyser(micStream);
      }
      if (recognition) recognition.start();
      addTerminalLog('MIC ATIVADO — MONITORANDO BIO-SINAIS');
    } catch (e) {
      console.error('[Mic] Access error:', e);
      addTerminalLog('ERRO DE PERMISSÃO DO MICROFONE');
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  // Ignore spacebar when user is typing in inputs or textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') {
    e.preventDefault();
    toggleMicrophone();
  }
});

micTrigger.addEventListener('click', () => toggleMicrophone());
