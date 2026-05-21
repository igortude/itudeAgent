// ═══════════════════════════════════════════════════════
//  ItudeAgent — Frontend Controller
//  Eternos Cosmic Voice Interface
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
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const chatLog = document.getElementById('chat-log');
const playerEl = document.getElementById('player');
const modelSelector = document.getElementById('model-selector');
const canvas = document.getElementById('cosmic-canvas');
const ctx = canvas.getContext('2d');
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

// ─── Canvas Config ───
let W = window.innerWidth;
let H = window.innerHeight;
canvas.width = W;
canvas.height = H;

let particles = [];
const MAX_PARTICLES = 100;
let rot1 = 0, rot2 = 0, rot3 = 0;
let userVol = 0, iaVol = 0;
let smoothUserVol = 0, smoothIaVol = 0;

window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
});

// ═══════════════════════════════════════════════════════
//  LOGGING
// ═══════════════════════════════════════════════════════

function addLog(type, text) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  if (type === 'user' || type === 'agent' || type === 'action') {
    const label = document.createElement('span');
    label.className = 'log-label';
    label.textContent = type === 'user' ? 'Você' : type === 'agent' ? 'ItudeAgent' : '⚡ Ação';
    entry.appendChild(label);
  }

  const content = document.createTextNode(text);
  entry.appendChild(content);
  chatLog.appendChild(entry);

  // Auto-scroll
  const panelContent = chatLog.closest('.panel-content');
  if (panelContent) panelContent.scrollTop = panelContent.scrollHeight;
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

    addLog('system', 'Motor de áudio tridimensional ativado.');
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
//  MODELS
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
        opt.textContent = m;
        modelSelector.appendChild(opt);
      });
      selectedModel = data.models[0];
      addLog('system', `Modelo ativo: ${selectedModel}`);
    } else {
      modelSelector.innerHTML = '<option value="">Nenhum modelo</option>';
    }
  } catch (e) {
    modelSelector.innerHTML = '<option value="">Erro</option>';
  }
}

modelSelector.addEventListener('change', e => {
  selectedModel = e.target.value;
  addLog('system', `Modelo alterado: ${selectedModel}`);
});

loadModels();

// ═══════════════════════════════════════════════════════
//  ACTIONS EDITOR
// ═══════════════════════════════════════════════════════

async function loadActions() {
  try {
    const res = await fetch('/api/actions');
    const data = await res.json();
    renderActions(data, activeActionCategory);
  } catch (e) {
    actionsList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Erro ao carregar ações.</div>';
  }
}

function renderActions(data, category) {
  actionsList.innerHTML = '';
  const group = data.actions.find(a => a.category === category);
  if (!group || Object.keys(group.targets).length === 0) {
    actionsList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.78rem; padding: 8px;">Nenhuma ação cadastrada.</div>';
    return;
  }
  for (const [name, info] of Object.entries(group.targets)) {
    const item = document.createElement('div');
    item.className = 'action-item';
    item.innerHTML = `
      <div>
        <span class="action-name">${name}</span>
        <span class="action-binary">${info.binary}</span>
      </div>
      <button class="btn btn-danger" data-target="${name}" data-category="${category}">✕</button>
    `;
    actionsList.appendChild(item);
  }

  // Bind delete buttons
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
        addLog('system', `Ação "${targetName}" removida.`);
      } catch (e) {
        console.error('Delete failed:', e);
      }
    });
  });
}

// Tab switching
document.querySelectorAll('#action-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#action-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeActionCategory = tab.dataset.category;
    loadActions();
  });
});

// Add action
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
      addLog('system', `Ação "${name}" → "${binary}" adicionada.`);
    }
  } catch (e) {
    console.error('Add failed:', e);
  }
});

loadActions();

// ═══════════════════════════════════════════════════════
//  CANVAS ANIMATION (ETERNOS COSMIC GEOMETRY)
// ═══════════════════════════════════════════════════════

class Particle {
  constructor(x, y, hue) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2.5 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 0.8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.012 + 0.004;
    this.hue = hue;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.995;
    this.vy *= 0.995;
    this.alpha -= this.decay;
  }
  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsla(${this.hue}, 80%, 50%, 0.5)`;
    ctx.fill();
    ctx.restore();
  }
}

function drawOrbitRing(cx, cy, rx, ry, rotation, lineWidth, alpha) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function drawCross(cx, cy, size, rotation, alpha) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
  ctx.moveTo(0, -size); ctx.lineTo(0, size);
  ctx.stroke();
  ctx.restore();
}

function drawStarField(cx, cy) {
  // Subtle background star grid
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 0.3;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 600, cy + Math.sin(angle) * 600);
    ctx.stroke();
  }
  // Concentric background rings
  for (let r = 100; r < 500; r += 80) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderLoop() {
  requestAnimationFrame(renderLoop);

  // Dark translucent clear for particle trails
  ctx.fillStyle = 'rgba(2, 2, 8, 0.2)';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;

  // Read analyser data
  if (userAnalyser && isListening) {
    const d = new Uint8Array(userAnalyser.frequencyBinCount);
    userAnalyser.getByteFrequencyData(d);
    userVol = d.reduce((a, b) => a + b, 0) / d.length;
  } else {
    userVol *= 0.9; // fade out
  }

  if (iaAnalyser && isIA_Speaking) {
    const d = new Uint8Array(iaAnalyser.frequencyBinCount);
    iaAnalyser.getByteFrequencyData(d);
    iaVol = d.reduce((a, b) => a + b, 0) / d.length;
  } else {
    iaVol *= 0.9;
  }

  // Smooth interpolation
  smoothUserVol += (userVol - smoothUserVol) * 0.15;
  smoothIaVol += (iaVol - smoothIaVol) * 0.15;
  const vol = Math.max(smoothUserVol, smoothIaVol);

  // Color selection
  let hue = 43; // Gold
  if (isListening) hue = 350; // Red
  else if (isIA_Speaking) hue = 215; // Blue

  // Spawn particles on volume peaks
  if (vol > 12 && particles.length < MAX_PARTICLES) {
    const count = Math.min(Math.floor(vol / 15) + 1, 5);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(cx, cy, hue));
    }
  }

  // Update & draw particles
  particles = particles.filter(p => p.alpha > 0.02);
  particles.forEach(p => { p.update(); p.draw(); });

  // Background star field
  drawStarField(cx, cy);

  // Dynamic radii
  const baseR = 70 + vol * 0.5;

  // Update rotations
  rot1 += 0.002 + vol * 0.00015;
  rot2 -= 0.0015 + vol * 0.0001;
  rot3 += 0.004 + vol * 0.0002;

  // Draw orbital rings
  const alpha = 0.12 + (vol / 255) * 0.4;
  drawOrbitRing(cx, cy, baseR * 2.2, baseR * 2.2, 0, 0.8, alpha * 0.4);
  drawOrbitRing(cx, cy, baseR * 1.6, baseR * 1.6, rot1, 1, alpha * 0.7);
  drawOrbitRing(cx, cy, baseR * 1.1, baseR * 0.5, rot2, 1.2, alpha);
  drawOrbitRing(cx, cy, baseR * 0.7, baseR * 0.7, rot3, 0.6, alpha * 0.5);

  // Cross lines
  drawCross(cx, cy, baseR * 2.5, rot3 * 0.5, alpha * 0.3);

  // Central focus rune
  const coreAlpha = 0.08 + (vol / 255) * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 60%, 55%, ${coreAlpha})`;
  ctx.shadowBlur = 30;
  ctx.shadowColor = `hsla(${hue}, 70%, 50%, ${coreAlpha})`;
  ctx.fill();

  // Core ring
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.25, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

renderLoop();

// ═══════════════════════════════════════════════════════
//  AUDIO ORCHESTRATION & ECHO PREVENTION
// ═══════════════════════════════════════════════════════

playerEl.addEventListener('play', () => {
  isIA_Speaking = true;
  isListening = false;
  if (recognition) recognition.stop();
  setStatus('speaking', 'Respondendo');
});

playerEl.addEventListener('ended', () => {
  isIA_Speaking = false;
  if (recognition) {
    recognition.start();
    isListening = true;
    setStatus('listening', 'Ouvindo');
  }
});

playerEl.addEventListener('error', (e) => {
  console.error('[Player] Error:', e);
  addLog('system', 'Erro no player de áudio.');
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
      setStatus('listening', 'Ouvindo');
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (!isIA_Speaking) setStatus('', 'Pausado');
  };

  recognition.onerror = (event) => {
    console.error('[STT] Error:', event.error);
    if (event.error === 'not-allowed') {
      addLog('system', 'Permissão de microfone negada.');
      setStatus('', 'Mic Negado');
    }
  };

  recognition.onresult = async (event) => {
    const idx = event.results.length - 1;
    const text = event.results[idx][0].transcript.trim();
    if (!text) return;

    addLog('user', text);
    recognition.stop();
    setStatus('', 'Processando');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: selectedModel })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Log differently if it was a system action
      if (data.actionExecuted) {
        addLog('action', data.reply);
      } else {
        addLog('agent', data.reply);
      }

      if (data.audioUrl) {
        playerEl.src = data.audioUrl;
        playerEl.play().catch(e => {
          console.error('[Player] Play blocked:', e);
          addLog('system', `Áudio bloqueado: ${e.message}`);
          if (recognition) recognition.start();
        });
      } else {
        if (recognition) recognition.start();
      }
    } catch (err) {
      console.error('[API] Error:', err);
      addLog('system', `Falha: ${err.message}`);
      if (recognition) recognition.start();
    }
  };
}

// ═══════════════════════════════════════════════════════
//  STATUS HELPER
// ═══════════════════════════════════════════════════════

function setStatus(state, label) {
  statusDot.className = state;
  statusText.className = state;
  statusText.textContent = label;
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
    setStatus('', 'Pausado');
  } else {
    try {
      if (!micStream) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        connectMicAnalyser(micStream);
      }
      if (recognition) recognition.start();
    } catch (e) {
      console.error('[Mic] Access error:', e);
      addLog('system', 'Erro ao acessar microfone.');
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  // Don't trigger spacebar when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.code === 'Space') {
    e.preventDefault();
    toggleMicrophone();
  }
});

canvas.addEventListener('click', () => toggleMicrophone());
