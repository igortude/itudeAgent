// ═══ iTude Agent — Wake Word State Machine ═══
window.onerror = function(msg, src, ln) {
  const f = document.getElementById('action-feed');
  if (f) { const d = document.createElement('div'); d.style.color='var(--neon-red)'; d.textContent=`[ERRO] ${msg} (L${ln})`; f.appendChild(d); }
  return false;
};

// ─── STATES ───
const S = { DORMANT:'DORMANT', PASSIVE:'PASSIVE', GREETING:'GREETING', ACTIVE:'ACTIVE', PROCESSING:'PROCESSING', COMPOUND_ASK:'COMPOUND_ASK', COMPOUND_LISTEN:'COMPOUND_LISTEN', COMPOUND_EXEC:'COMPOUND_EXEC' };
let state = S.DORMANT;
const WAKE = 'anunaki';
let pendingCompound = null;
let activeTimeout = null;

// ─── STT ───
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
if (SR) { rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = false; }
const WAKE_WORDS = ['anunaki', 'anunnaki', 'anunáqui', 'anonaki', 'anomalia', 'abominável'];

// ─── DOM ───
const $ = id => document.getElementById(id);
const activeLlmLbl=$('active-llm-lbl'), chatLog=$('chat-log'), playerEl=$('player'),
  modelSel=$('model-selector'), voiceSel=$('voice-selector'), promptEd=$('prompt-editor'),
  btnSave=$('btn-save-settings'), feed=$('action-feed'), pulse=$('center-status-pulse'),
  statusLbl=$('center-status-lbl'), micTrigger=$('mic-trigger'), btnFS=$('btn-fullscreen'),
  modal=$('learning-modal'), modalCat=$('modal-category-action'), modalTarget=$('modal-target-display'),
  modalInput=$('modal-binary-input'), btnModalSave=$('btn-modal-save'), btnModalCancel=$('btn-modal-cancel'),
  actionsList=$('actions-list'), btnAdd=$('btn-add-action'), inName=$('new-target-name'), inBin=$('new-target-binary');

const canvas=$('cosmic-canvas'), ctx=canvas.getContext('2d');
const dnaC=$('dna-canvas'), dnaX=dnaC.getContext('2d');
const specC=$('spectral-canvas'), specX=specC.getContext('2d');
const brainC=$('brain-canvas'), brainX=brainC.getContext('2d');

let selectedModel='', activeCat='open';
let audioCtx=null, userAn=null, iaAn=null, micStream=null, micSrc=null, iaSrc=null;
let isIA=false, rot1=0, rot2=0, uVol=0, iVol=0, suVol=0, siVol=0, dnaA=0;
let learnCat='', learnTarget='', isRecStarted=false;

// ─── Canvas sizing ───
let W=400, H=400;
function resizeAll(){
  if(canvas.parentElement){W=canvas.parentElement.clientWidth;H=canvas.parentElement.clientHeight;canvas.width=W;canvas.height=H;}
  if(dnaC.parentElement){dnaC.width=dnaC.parentElement.clientWidth;dnaC.height=dnaC.parentElement.clientHeight;}
  if(specC.parentElement){specC.width=specC.parentElement.clientWidth;specC.height=specC.parentElement.clientHeight;}
  if(brainC.parentElement){brainC.width=brainC.parentElement.clientWidth;brainC.height=brainC.parentElement.clientHeight;}
}
window.addEventListener('resize',resizeAll); setTimeout(resizeAll,300);

// ─── Helpers ───
function log(m){ const t=new Date().toLocaleTimeString(); const d=document.createElement('div'); d.textContent=`[${t}] ${m}`; feed.appendChild(d); feed.scrollTop=feed.scrollHeight; }
function chat(type,text){ const e=document.createElement('div'); e.className=`log-entry ${type}`; const l=document.createElement('span'); l.className='log-label'; l.textContent=type==='user'?'VOZ':type==='agent'?'iTude Agent':type==='action'?'TERMINAL':'SISTEMA'; e.appendChild(l); e.appendChild(document.createTextNode(text)); chatLog.appendChild(e); chatLog.parentElement.scrollTop=chatLog.parentElement.scrollHeight; }

function setState(s){
  state=s;
  const labels={[S.DORMANT]:'CLIQUE PARA INICIALIZAR',[S.PASSIVE]:'MODO PASSIVO // DIGA "ANUNAKI"',[S.GREETING]:'SAUDAÇÃO EM PROGRESSO...',[S.ACTIVE]:'ESCUTANDO SEU COMANDO...',[S.PROCESSING]:'PROCESSANDO SINAIS...',[S.COMPOUND_ASK]:'AGUARDANDO RESPOSTA...',[S.COMPOUND_LISTEN]:'ESCUTANDO SUA ESCOLHA...',[S.COMPOUND_EXEC]:'EXECUTANDO AUTOMAÇÃO...'};
  statusLbl.textContent=labels[s]||s;
  pulse.className='pulse-indicator'+(s===S.ACTIVE||s===S.COMPOUND_LISTEN?' active':isIA?' speaking':'');
  log(`ESTADO: ${s}`);
}

function playAudio(url){
  if(!url)return false;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.log(e));
  }
  playerEl.src=`${url}?t=${Date.now()}`;
  playerEl.play().catch(e=>{
    console.error(e);
    log('⚠️ SOM BLOQUEADO: Dê um clique na tela para desbloquear o som!');
    chat('system', 'Clique em qualquer lugar da tela para permitir que o agente fale!');
    tryRestart();
  });
  return true;
}

function tryRestart(){
  if(state===S.DORMANT||modal.style.display==='flex'||isIA)return;
  if(isRecStarted)return;
  try{
    if(rec){
      rec.start();
      isRecStarted=true;
    }
  }catch(e){
    console.log('[Speech] Reconhecimento em transição de desligamento. Tentando novamente em 300ms...');
    setTimeout(tryRestart,300);
  }
}

// ─── Audio Context ───
async function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  userAn=audioCtx.createAnalyser(); userAn.fftSize=128;
  log('ÁUDIO INICIALIZADO');
}

// ─── Player events (state-aware) ───
playerEl.addEventListener('play',()=>{ isIA=true; if(rec)try{rec.stop();}catch(e){} });
playerEl.addEventListener('ended',()=>{
  isIA=false;
  if(state===S.GREETING){ setState(S.ACTIVE); activeTimeout=setTimeout(()=>{if(state===S.ACTIVE){setState(S.PASSIVE);tryRestart();}},15000); tryRestart(); }
  else if(state===S.COMPOUND_ASK){ setState(S.COMPOUND_LISTEN); tryRestart(); }
  else{ setState(S.PASSIVE); tryRestart(); }
});
playerEl.addEventListener('error',()=>{ isIA=false; setState(S.PASSIVE); tryRestart(); });

// ─── Recognition (always-on, state-filtered) ───
if(rec){
  rec.onstart=()=>{ isRecStarted=true; };
  rec.onend=()=>{
    isRecStarted=false;
    if(state!==S.DORMANT&&state!==S.PROCESSING&&state!==S.COMPOUND_EXEC&&state!==S.GREETING&&state!==S.COMPOUND_ASK&&!isIA&&modal.style.display!=='flex') setTimeout(tryRestart,150);
  };
  rec.onerror=(e)=>{ if(e.error==='not-allowed')log('ERRO: Microfone negado.'); else if(e.error!=='aborted')setTimeout(tryRestart,300); };

  rec.onresult=async(ev)=>{
    const text=ev.results[ev.results.length-1][0].transcript.trim();
    if(!text)return;
    const low=text.toLowerCase();
    log(`TRANSCRIÇÃO: "${text}"`);

    // ── PASSIVE: filtrar pelas wake word ──
    if(state===S.PASSIVE){
      const matchedWake = WAKE_WORDS.find(w => low.includes(w));
      if(!matchedWake)return; // ignorar tudo que não for anunaki
      const after=low.split(matchedWake).pop().trim().replace(/^[,.\s]+/,'');
      if(rec)try{rec.stop();}catch(e){}
      if(after.length>3){ // "anunaki abra o chrome" → pular saudação
        setState(S.PROCESSING); chat('user',after); log(`COMANDO DIRETO: "${after.toUpperCase()}"`);
        await processCommand(after);
      } else { // apenas "anunaki" → saudar
        setState(S.GREETING); log('WAKE WORD DETECTADA!');
        try{ const r=await fetch('/api/greet',{method:'POST'}); const d=await r.json(); chat('agent',d.reply); playAudio(d.audioUrl); }catch(e){setState(S.PASSIVE);tryRestart();}
      }
      return;
    }

    // ── ACTIVE: comando após saudação ──
    if(state===S.ACTIVE){
      if(activeTimeout){clearTimeout(activeTimeout);activeTimeout=null;}
      if(rec)try{rec.stop();}catch(e){}
      setState(S.PROCESSING); chat('user',text); log(`PROCESSANDO: "${text.toUpperCase()}"`);
      await processCommand(text);
      return;
    }

    // ── COMPOUND_LISTEN: resposta do follow-up ──
    if(state===S.COMPOUND_LISTEN){
      if(rec)try{rec.stop();}catch(e){}
      setState(S.COMPOUND_EXEC); chat('user',text); log(`BUSCA COMPOSTA: "${text.toUpperCase()}"`);
      try{
        const r=await fetch('/api/compound-search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text,searchCommand:pendingCompound.searchCommand})});
        const d=await r.json(); chat('action',d.reply); playAudio(d.audioUrl);
      }catch(e){log('ERRO na busca composta');setState(S.PASSIVE);tryRestart();}
      pendingCompound=null;
      return;
    }
  };
}

// ─── Process Command ───
async function processCommand(text){
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,model:selectedModel})});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const d=await r.json();

    if(d.compoundAction){ pendingCompound={binary:d.binary,searchCommand:d.searchCommand}; setState(S.COMPOUND_ASK); chat('agent',d.reply); playAudio(d.audioUrl); return; }
    if(d.unrecognizedAction){ chat('agent',d.reply); playAudio(d.audioUrl); openLearnModal(d.category,d.targetName); return; }
    chat(d.actionExecuted?'action':'agent',d.reply); if(d.actionExecuted)log(`AÇÃO: ${d.reply}`);
    if(!playAudio(d.audioUrl)){setState(S.PASSIVE);tryRestart();}
  }catch(e){console.error(e);log('FALHA NA COMUNICAÇÃO');setState(S.PASSIVE);tryRestart();}
}

// ─── Learning Modal ───
function openLearnModal(cat,target){
  learnCat=cat; learnTarget=target;
  modalCat.textContent=cat==='open'?'ABRIR':cat==='close'?'FECHAR':cat==='play'?'REPRODUZIR':'EXECUTAR';
  modalTarget.textContent=`"${target.toUpperCase()}"`;
  modalInput.value=''; modal.style.display='flex'; modalInput.focus();
  if(rec)try{rec.stop();}catch(e){}
}

btnModalSave.addEventListener('click',async()=>{
  const bin=modalInput.value.trim(); if(!bin)return;
  try{
    const r=await fetch('/api/actions/target',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:learnCat,targetName:learnTarget,binary:bin,description:learnTarget})});
    const d=await r.json();
    if(d.success){
      log(`SINAPSE GRAVADA: "${learnTarget}" → "${bin}"`); chat('system',`Aprendi! Executando "${learnTarget}" agora...`);
      modal.style.display='none'; loadActions();
      // Re-executar o comando recém-aprendido
      setState(S.PROCESSING);
      await processCommand(`${learnCat==='open'?'abra o':learnCat==='close'?'feche o':'execute o'} ${learnTarget}`);
    }
  }catch(e){log('ERRO ao gravar sinapse');}
});

btnModalCancel.addEventListener('click',()=>{ modal.style.display='none'; log('APRENDIZADO CANCELADO'); setState(S.PASSIVE); setTimeout(tryRestart, 300); });
modalInput.addEventListener('keydown',e=>{if(e.key==='Enter')btnModalSave.click();});

// ─── Init: primeiro clique ativa tudo ou força escuta ───
async function activateAgent(){
  await initAudio();
  if(audioCtx&&audioCtx.state==='suspended')await audioCtx.resume();
  
  if(state===S.DORMANT){
    try{ micStream=await navigator.mediaDevices.getUserMedia({audio:true}); if(userAn){const s=audioCtx.createMediaStreamSource(micStream);s.connect(userAn);} }catch(e){log('ERRO: Microfone bloqueado.');}
    setState(S.PASSIVE);
    if(rec)try{rec.start();}catch(e){}
    log('AGENTE ATIVADO — ESCUTA PASSIVA INICIADA'); chat('system','Agente ativado. Diga "Anunaki" para me invocar.');
  } else {
    // Se já está ativo, forçar escuta ativa imediata
    if(rec)try{rec.stop();}catch(e){}
    setState(S.ACTIVE);
    if(activeTimeout){clearTimeout(activeTimeout);}
    activeTimeout=setTimeout(()=>{if(state===S.ACTIVE){setState(S.PASSIVE);tryRestart();}},15000);
    setTimeout(tryRestart,100);
    log('ESCUTA MANUAL ATIVADA'); chat('system','Escutando seu comando diretamente...');
  }
}

if(micTrigger)micTrigger.addEventListener('click',activateAgent);
if(canvas)canvas.addEventListener('click',activateAgent);
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='SELECT'){e.preventDefault();activateAgent();}});

// ─── Fullscreen ───
if(btnFS)btnFS.addEventListener('click',()=>{
  if(!document.fullscreenElement){document.documentElement.requestFullscreen().then(()=>{btnFS.textContent='SAIR TELA CHEIA';}).catch(e=>{});}
  else{document.exitFullscreen().then(()=>{btnFS.textContent='MODO TELA CHEIA';});}
});

// ─── Settings & Models ───
async function loadModels(){try{const r=await fetch('/api/models');const d=await r.json();modelSel.innerHTML='';if(d.models&&d.models.length){d.models.forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m.toUpperCase();modelSel.appendChild(o);});let llamaIndex=d.models.findIndex(m=>m.toLowerCase().includes('llama'));let defaultIdx=llamaIndex!==-1?llamaIndex:0;selectedModel=d.models[defaultIdx];modelSel.value=selectedModel;activeLlmLbl.textContent=selectedModel.split(':')[0].toUpperCase();}else{modelSel.innerHTML='<option>NENHUM MODELO</option>';}}catch(e){modelSel.innerHTML='<option>ERRO</option>';}}
async function loadSettings(){try{const r=await fetch('/api/settings');const s=await r.json();promptEd.value=s.systemPrompt;voiceSel.innerHTML='';s.availableVoices.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.name;if(v.id===s.voice)o.selected=true;voiceSel.appendChild(o);});}catch(e){}}
btnSave.addEventListener('click',async()=>{try{const r=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voice:voiceSel.value,systemPrompt:promptEd.value})});const d=await r.json();if(d.success){log('PERSONALIDADE ATUALIZADA');chat('system','Configuração aplicada.');}}catch(e){}});
modelSel.addEventListener('change',e=>{selectedModel=e.target.value;activeLlmLbl.textContent=selectedModel.split(':')[0].toUpperCase();});
loadModels(); loadSettings();

// ─── Actions CRUD ───
async function loadActions(){try{const r=await fetch('/api/actions');const d=await r.json();renderActions(d,activeCat);}catch(e){}}
function renderActions(data,cat){actionsList.innerHTML='';const g=data.actions.find(a=>a.category===cat);if(!g||!Object.keys(g.targets).length){actionsList.innerHTML='<div style="color:var(--text-dim);font-size:0.6rem;padding:6px">Nenhum</div>';return;}
for(const[n,i]of Object.entries(g.targets)){const d=document.createElement('div');d.className='action-item';d.innerHTML=`<div><span class="action-name">${n.toUpperCase()}</span> <span class="action-binary">${i.binary}</span></div><button class="btn btn-danger" data-t="${n}" data-c="${cat}">✕</button>`;actionsList.appendChild(d);}
actionsList.querySelectorAll('.btn-danger').forEach(b=>b.addEventListener('click',async()=>{await fetch('/api/actions/target',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:b.dataset.c,targetName:b.dataset.t})});loadActions();}));}
document.querySelectorAll('#action-tabs .tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('#action-tabs .tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');activeCat=t.dataset.category;loadActions();}));
btnAdd.addEventListener('click',async()=>{const n=inName.value.trim(),b=inBin.value.trim();if(!n||!b){log('Preencha nome e binário');return;}try{const r=await fetch('/api/actions/target',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:activeCat,targetName:n,binary:b,description:n})});const d=await r.json();if(d.success){inName.value='';inBin.value='';loadActions();log(`COMANDO: "${n}" → "${b}"`);};}catch(e){}});
loadActions();

// ═══ CANVAS ANIMATIONS ═══
const brainNodes=[];for(let i=0;i<25;i++)brainNodes.push({x:Math.random()*200+40,y:Math.random()*80+15,r:Math.random()*1.5+0.8,fr:Math.random()*0.05+0.01,ph:Math.random()*Math.PI});

function drawDna(){const w=dnaC.width,h=dnaC.height;dnaX.clearRect(0,0,w,h);const mid=h/2,amp=25+siVol*0.4;dnaA+=0.04+suVol*0.002;for(let x=10;x<w-10;x+=15){const o=(x/(w-20))*Math.PI*4,y1=mid+Math.sin(dnaA+o)*amp,y2=mid+Math.sin(dnaA+o+Math.PI)*amp;dnaX.strokeStyle='rgba(0,243,255,0.1)';dnaX.beginPath();dnaX.moveTo(x,y1);dnaX.lineTo(x,y2);dnaX.stroke();dnaX.fillStyle='#00f3ff';dnaX.beginPath();dnaX.arc(x,y1,2,0,Math.PI*2);dnaX.fill();dnaX.fillStyle='#bc34fa';dnaX.beginPath();dnaX.arc(x,y2,2,0,Math.PI*2);dnaX.fill();}}

function drawBrain(){const w=brainC.width,h=brainC.height;brainX.clearRect(0,0,w,h);brainX.save();brainX.translate(w/2-120,0);for(let i=0;i<brainNodes.length;i++){const n=brainNodes[i];n.ph+=n.fr;const a=0.15+Math.sin(n.ph)*0.15;for(let j=i+1;j<brainNodes.length;j++){const m=brainNodes[j],d=Math.hypot(n.x-m.x,n.y-m.y);if(d<35){brainX.strokeStyle=`rgba(188,52,250,${a*(1-d/35)})`;brainX.lineWidth=0.5;brainX.beginPath();brainX.moveTo(n.x,n.y);brainX.lineTo(m.x,m.y);brainX.stroke();}}brainX.fillStyle=`hsla(280,85%,65%,${a+0.3})`;brainX.beginPath();brainX.arc(n.x,n.y,n.r+(siVol>10?siVol*0.05:0),0,Math.PI*2);brainX.fill();}brainX.restore();}

function drawSpec(){
  const w=specC.width,h=specC.height;
  specX.clearRect(0,0,w,h);
  if(state===S.ACTIVE||state===S.COMPOUND_LISTEN){
    if(userAn){
      const buf=userAn.frequencyBinCount,da=new Uint8Array(buf);
      userAn.getByteFrequencyData(da);
      const bw=(w/buf)*2.5;
      let x=0;
      for(let i=0;i<buf;i++){
        const bh=(da[i]/255)*h;
        specX.fillStyle=`rgba(0,243,255,${bh/h+0.1})`;
        specX.fillRect(x,h-bh,bw-1,bh);
        x+=bw;
      }
    }
  } else if(isIA){
    // Ondas procedimentais roxas neon para a voz da IA
    const buf=64;
    const bw=(w/buf)*2.5;
    let x=0;
    for(let i=0;i<buf;i++){
      const factor=Math.sin(i*0.25+Date.now()*0.02)*0.5+0.5;
      const bh=(factor*(siVol/100))*h*0.85;
      specX.fillStyle=`rgba(188,52,250,${bh/h+0.15})`;
      specX.fillRect(x,h-bh,bw-1,bh);
      x+=bw;
    }
  } else {
    specX.strokeStyle='rgba(0,243,255,0.15)';
    specX.beginPath();
    specX.moveTo(0,h/2);
    specX.lineTo(w,h/2);
    specX.stroke();
  }
}

// Estrelas e glifos alienígenas lentos no background do canvas cósmico
const stars = [];
for (let i = 0; i < 90; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.6 + 0.4,
    speed: Math.random() * 0.0012 + 0.0004,
    angle: Math.random() * Math.PI * 2
  });
}

// Símbolos cósmicos alienígenas dos Eternos
const GLYPHS = ['◈', '⎔', '⌬', '⏛', '⌬', '⌬', '⎔', '⚙', '❈', '✵'];
const holoElements = [];
for (let i = 0; i < 10; i++) {
  holoElements.push({
    x: Math.random(),
    y: Math.random(),
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    size: Math.floor(Math.random() * 14 + 9),
    speed: Math.random() * 0.0004 + 0.0001,
    alpha: Math.random() * 0.25,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.006
  });
}

function drawHolo(){
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = 'rgba(2, 2, 10, 0.22)';
  ctx.fillRect(0, 0, w, h);
  
  const v = Math.max(suVol, siVol);
  const cx = w / 2;
  const cy = h / 2;

  // 1. Estrelas se movendo do centro para fora (efeito de dobra/viagem espacial)
  stars.forEach(s => {
    let px = s.x * w;
    let py = s.y * h;
    
    const angle = Math.atan2(py - cy, px - cx);
    const dist = Math.hypot(px - cx, py - cy);
    const speed = (s.speed * w) * (1 + v * 0.08);
    
    let newDist = dist + speed;
    if (newDist > Math.max(w, h)) {
      newDist = Math.random() * 40;
      s.x = (cx + Math.cos(angle) * newDist) / w;
      s.y = (cy + Math.sin(angle) * newDist) / h;
    } else {
      s.x = (cx + Math.cos(angle) * newDist) / w;
      s.y = (cy + Math.sin(angle) * newDist) / h;
    }
    
    const alpha = Math.min(0.7, 0.2 + (newDist / (w * 0.7)) * 0.5);
    ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, s.size * (1 + v * 0.02), 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Glifos alienígenas flutuantes e rotacionando lentamente no background
  holoElements.forEach(he => {
    he.y -= he.speed * (1 + v * 0.04);
    if (he.y < -0.1) {
      he.y = 1.1;
      he.x = Math.random();
    }
    he.rot += he.rotSpeed;
    
    ctx.save();
    ctx.translate(he.x * w, he.y * h);
    ctx.rotate(he.rot);
    ctx.font = `${he.size}px 'Share Tech Mono'`;
    ctx.fillStyle = `rgba(0, 243, 255, ${0.06 + Math.sin(Date.now() * 0.0012) * 0.03})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'var(--neon-blue)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(he.glyph, 0, 0);
    ctx.restore();
  });
}

(function loop(){requestAnimationFrame(loop);
if(userAn&&(state===S.ACTIVE||state===S.COMPOUND_LISTEN)){const d=new Uint8Array(userAn.frequencyBinCount);userAn.getByteFrequencyData(d);uVol=d.reduce((a,b)=>a+b,0)/d.length;}else uVol*=0.9;
if(isIA){
  iVol=50+Math.sin(Date.now()*0.015)*18+Math.cos(Date.now()*0.008)*12;
}else iVol*=0.9;
suVol+=(uVol-suVol)*0.18;siVol+=(iVol-siVol)*0.18;

// Atualizar variáveis 3D do planeta pulsante
const maxVol = Math.max(suVol, siVol);
document.documentElement.style.setProperty('--voice-scale', (1.0 + maxVol * 0.013).toFixed(3));

// Atualizar estado e tema dinamicamente baseados na voz
const statusLblNode = document.getElementById('voice-status-lbl');
if (statusLblNode) {
  if (state === S.ACTIVE || state === S.COMPOUND_LISTEN) {
    statusLblNode.innerHTML = `Escutando <span>◈</span> Sinais Ativos`;
    document.documentElement.style.setProperty('--cyan', '#ff0055'); // Vermelho/Rosa escuta
    document.documentElement.style.setProperty('--magenta', '#00f3ff');
  } else if (isIA) {
    statusLblNode.innerHTML = `Emissão <span>◈</span> Resposta Voz`;
    document.documentElement.style.setProperty('--cyan', '#bc13fe'); // Roxo fala
    document.documentElement.style.setProperty('--magenta', '#00f3ff');
  } else if (state === S.PROCESSING) {
    statusLblNode.innerHTML = `Processando <span>◈</span> Sinapses`;
    document.documentElement.style.setProperty('--cyan', '#ffea00'); // Amarelo processamento
  } else {
    statusLblNode.innerHTML = `Analisando <span>◈</span> Voz Passiva`;
    document.documentElement.style.setProperty('--cyan', '#00f3ff'); // Ciano normal
    document.documentElement.style.setProperty('--magenta', '#bc13fe');
  }
}

drawDna();drawBrain();drawSpec();drawHolo();})();

// ─── Weather Update ───
async function updateWeatherUI() {
  try {
    const res = await fetch('/api/weather');
    const data = await res.json();
    if (data && data.success) {
      const weatherEl = document.getElementById('local-weather');
      if (weatherEl) {
        weatherEl.textContent = `${data.temp}°C // ${data.desc.toUpperCase()} (${data.city.toUpperCase()})`;
      }
    }
  } catch (e) {
    console.error('Erro ao atualizar clima:', e);
  }
}

// ─── Auto Start on Load & Global Click Resume ───
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(activateAgent, 800); // Aguarda a interface assentar e ativa
  updateWeatherUI();
  setInterval(updateWeatherUI, 300000); // Atualiza a cada 5 minutos
});

document.addEventListener('click', async () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
    log('CONTEXTO DE ÁUDIO RESUMIDO');
  }
});

