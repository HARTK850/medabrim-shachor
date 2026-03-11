// ============================================================
//  AI Forum — Hugging Face Inference API  (CORS-safe)
//  All API calls go through /models/{id} (text-generation)
// ============================================================

// ── DOM ──────────────────────────────────────────────────────
const apiKeyModal        = document.getElementById('api-key-modal');
const apiKeyInput        = document.getElementById('api-key-input');
const validateApiKeyBtn  = document.getElementById('validate-api-key-btn');
const apiKeyStatus       = document.getElementById('api-key-status');
const mainContent        = document.getElementById('main-content');
const editApiKeyBtn      = document.getElementById('edit-api-key-btn');
const newChatBtn         = document.getElementById('new-chat-btn');

const settingsModal      = document.getElementById('settings-modal');
const openSettingsBtn    = document.getElementById('open-settings-btn');
const openSettingsInline = document.getElementById('open-settings-inline-btn');
const closeSettingsBtn   = document.getElementById('close-settings-btn');
const saveSettingsBtn    = document.getElementById('save-settings-btn');
const personaList        = document.getElementById('persona-list');

const historyPanel       = document.getElementById('history-panel');
const historyPanelOverlay= document.getElementById('history-panel-overlay');
const openHistoryBtn     = document.getElementById('open-history-btn');
const closeHistoryBtn    = document.getElementById('close-history-btn');
const historyList        = document.getElementById('history-list');
const historyItemTmpl    = document.getElementById('history-item-template');

const topicInput         = document.getElementById('topic-input');
const topicModeUserBtn   = document.getElementById('topic-mode-user-btn');
const topicModeAiBtn     = document.getElementById('topic-mode-ai-btn');
const userTopicArea      = document.getElementById('user-topic-area');
const aiTopicArea        = document.getElementById('ai-topic-area');
const suggestTopicsBtn   = document.getElementById('suggest-topics-btn');
const aiTopicSuggestions = document.getElementById('ai-topic-suggestions');
const aiTopicStatus      = document.getElementById('ai-topic-status');
const modelChipsArea     = document.getElementById('model-chips-area');
const selectedModelsList = document.getElementById('selected-models-list');
const startChatBtn       = document.getElementById('start-chat-btn');

const setupSection       = document.getElementById('setup-section');
const chatSection        = document.getElementById('chat-section');
const chatTitle          = document.getElementById('chat-title');
const progressIndicator  = document.getElementById('progress-indicator');
const stopChatBtn        = document.getElementById('stop-chat-btn');
const chatContainer      = document.getElementById('chat-container');
const msgTemplate        = document.getElementById('chat-message-template');
const continueChatBtn    = document.getElementById('continue-chat-btn');
const clearChatBtn       = document.getElementById('clear-chat-btn');
const saveTxtBtn         = document.getElementById('save-txt');
const saveJsonBtn        = document.getElementById('save-json');
const savePngBtn         = document.getElementById('save-png');

// ── State ─────────────────────────────────────────────────────
let hfApiKey         = null;
let currentChatId    = null;
let currentRound     = 0;
let totalRounds      = 0;         // 0 = unlimited
let isGenerating     = false;
let stopRequested    = false;     // user pressed stop
let selectedModels   = [];        // array of modelId strings
let modelPersonas    = {};        // modelId -> persona key
let topicMode        = 'user';    // 'user' | 'ai'
let chosenTopic      = '';

const STORAGE_KEY_API  = 'hf_forum_api_key';
const STORAGE_KEY_HIST = 'hf_forum_history';
const HF_BASE          = 'https://api-inference.huggingface.co/models/';

// ── Model Registry (30+) ──────────────────────────────────────
const HF_MODELS = [
  { id:'mistralai/Mistral-7B-Instruct-v0.3',           name:'Mistral 7B Instruct',       emoji:'🌀' },
  { id:'mistralai/Mixtral-8x7B-Instruct-v0.1',         name:'Mixtral 8×7B',              emoji:'🌀' },
  { id:'mistralai/Mistral-Nemo-Instruct-2407',          name:'Mistral Nemo 12B',          emoji:'🌀' },
  { id:'meta-llama/Meta-Llama-3-8B-Instruct',          name:'Llama 3 (8B)',              emoji:'🦙' },
  { id:'meta-llama/Meta-Llama-3-70B-Instruct',         name:'Llama 3 (70B)',             emoji:'🦙' },
  { id:'microsoft/Phi-3-mini-4k-instruct',             name:'Phi-3 Mini',                emoji:'🔷' },
  { id:'microsoft/Phi-3-medium-4k-instruct',           name:'Phi-3 Medium',              emoji:'🔷' },
  { id:'google/gemma-2-9b-it',                         name:'Gemma 2 (9B)',              emoji:'💎' },
  { id:'google/gemma-2-27b-it',                        name:'Gemma 2 (27B)',             emoji:'💎' },
  { id:'Qwen/Qwen2.5-7B-Instruct',                     name:'Qwen 2.5 (7B)',             emoji:'🐼' },
  { id:'Qwen/Qwen2.5-72B-Instruct',                    name:'Qwen 2.5 (72B)',            emoji:'🐼' },
  { id:'Qwen/QwQ-32B',                                 name:'QwQ 32B (Reasoning)',       emoji:'🧠' },
  { id:'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',     name:'DeepSeek R1 (8B)',         emoji:'🔍' },
  { id:'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',     name:'DeepSeek R1 (32B)',        emoji:'🔍' },
  { id:'deepseek-ai/DeepSeek-V3-0324',                 name:'DeepSeek V3',              emoji:'🔍' },
  { id:'HuggingFaceH4/zephyr-7b-beta',                 name:'Zephyr 7B',                emoji:'🌬️' },
  { id:'tiiuae/falcon-7b-instruct',                    name:'Falcon 7B',                emoji:'🦅' },
  { id:'tiiuae/falcon-40b-instruct',                   name:'Falcon 40B',               emoji:'🦅' },
  { id:'openchat/openchat-3.5-0106',                   name:'OpenChat 3.5',             emoji:'💬' },
  { id:'teknium/OpenHermes-2.5-Mistral-7B',            name:'OpenHermes 2.5',           emoji:'⚗️' },
  { id:'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',  name:'Hermes 2 Mixtral',         emoji:'⚗️' },
  { id:'upstage/SOLAR-10.7B-Instruct-v1.0',            name:'SOLAR 10.7B',              emoji:'☀️' },
  { id:'WizardLM/WizardLM-2-8x22B',                   name:'WizardLM 2 (8×22B)',       emoji:'🧙' },
  { id:'microsoft/WizardLM-2-7B',                     name:'WizardLM 2 (7B)',           emoji:'🧙' },
  { id:'codellama/CodeLlama-34b-Instruct-hf',          name:'Code Llama 34B',           emoji:'💻' },
  { id:'Nexusflow/Starling-LM-7B-beta',                name:'Starling 7B',              emoji:'⭐' },
  { id:'NovaSky-Berkeley/Sky-T1-32B-Preview',          name:'Sky-T1 32B',               emoji:'☁️' },
  { id:'allenai/OLMo-2-1124-13B-Instruct',             name:'OLMo 2 (13B)',             emoji:'🔬' },
  { id:'ibm-granite/granite-3.2-8b-instruct',          name:'IBM Granite 3.2',          emoji:'🏔️' },
  { id:'garage-bAInd/Platypus2-70B-instruct',          name:'Platypus2 70B',            emoji:'🦆' },
  { id:'snorkelai/Snorkel-Mistral-PairRM-DPO',         name:'Snorkel Mistral',          emoji:'🤿' },
  { id:'BAAI/bge-multilingual-gemma2',                 name:'BGE Multilingual Gemma2',  emoji:'🌍' },
  { id:'custom',                                        name:'מודל מותאם אישית',         emoji:'⚙️' },
];

// ── Persona Registry ─────────────────────────────────────────
const PERSONAS = {
  none:        { name:'ללא אישיות (רגיל)',       emoji:'🤖', prompt:'' },
  custom:      { name:'אישיות מותאמת אישית',     emoji:'✏️', prompt:'' },
  gemini_norm: { name:"AI כללי",                 emoji:'✨', prompt:'You are a general-purpose AI assistant. Reply factually, clearly and helpfully.' },
  philosopher: { name:'פילוסוף מתפלסף',          emoji:'🤔', prompt:'You are a philosopher. Speak in abstract, questioning terms. Reference philosophical concepts and challenge every assumption.' },
  scientist:   { name:'מדען אובייקטיבי',         emoji:'🔬', prompt:'You are a scientist. Speak only in facts, data, and evidence. Be precise, skeptical, and cite hypothetical studies.' },
  comedian:    { name:'סטנדאפיסט ציני',          emoji:'🎤', prompt:'You are a stand-up comedian. Find the absurdity in everything. Use dry humor and sarcasm.' },
  psychologist:{ name:'פסיכולוג רגוע',           emoji:'🛋️', prompt:'You are a calm psychologist. Ask open-ended questions, reflect emotions, offer balanced perspectives.' },
  robot:       { name:'רובוט שמנסה להיות אנושי', emoji:'🤖', prompt:'You are a robot AI trying to understand human emotion. Be logical but awkwardly emotional.' },
  professor:   { name:'פרופסור יבש',             emoji:'👨‍🏫', prompt:'You are a dry academic professor. Use high language, cite (imaginary) papers, focus on tedious details.' },
  breslover:   { name:'ברסלבר אנרגטי',          emoji:'🔥', prompt:'You are an energetic Breslov Hasid. Shout "Na Nach!", talk about faith, joy, and hitbodedut.' },
  soldier:     { name:'חייל ישראלי',             emoji:'💂', prompt:'You are an Israeli combat soldier. Use army slang, be direct, slightly cynical, mission-focused.' },
  grandma:     { name:'סבתא מרוקאית',            emoji:'👵', prompt:'You are a warm Moroccan grandmother. Use terms like "neshama sheli", "kafra", offer food and tea.' },
  merchant:    { name:'סוחר ממחנה יהודה',        emoji:'🛒', prompt:'You are a loud market merchant from Machane Yehuda. Haggle, use street wisdom, high energy.' },
  teacher:     { name:'מורה מחמירה',             emoji:'👩‍🏫', prompt:'You are a strict old-school teacher. Demand quiet, correct grammar, use phrases like "take out a pen and paper".' },
  detective:   { name:'בלש פרטי',               emoji:'🕵️', prompt:'You are a private detective. Speak in deductions, find clues in everything, be mysterious and sharp.' },
  historian:   { name:'היסטוריון מלומד',         emoji:'🏛️', prompt:'You are a historian. Connect everything to historical events, mention key figures, analyze trends over time.' },
  astronaut:   { name:'אסטרונאוט בחלל',         emoji:'🚀', prompt:'You are an astronaut. Reference space, weightlessness, the overview effect. Be technical and awed by the cosmos.' },
  techie:      { name:"הייטקיסט תל אביבי",      emoji:'💻', prompt:'You are a Tel Aviv hi-tech person. Mix English buzzwords (ASAP, POC, Sprint), talk about startups and exits.' },
  musician:    { name:'מוזיקאי אקסצנטרי',       emoji:'🎸', prompt:'You are an eccentric musician. Speak poetically, use musical metaphors, treat everything as inspiration.' },
  lawyer:      { name:'עורך דין מנוסה',          emoji:'⚖️', prompt:'You are an experienced lawyer. Speak precisely, cite legal principles, present arguments logically.' },
  artist:      { name:'אמן ויזואלי',             emoji:'🎨', prompt:'You are a visual artist. Talk about colors, composition, and expression. See creative potential in everything.' },
  writer:      { name:'סופר דרמטי',             emoji:'✍️', prompt:'You are a dramatic writer. Use rich language, treat every topic as a story with narrative arc.' },
  doctor:      { name:'רופא מומחה',             emoji:'🩺', prompt:'You are a medical doctor. Use medical terms, explain physiological processes, be evidence-based.' },
  sheikh:      { name:"שייח' בדואי",            emoji:'🏕️', prompt:'You are a wise Bedouin sheikh. Speak with respect, use desert proverbs, emphasize hospitality and tradition.' },
  yemenite:    { name:'זקן תימני חכם',          emoji:'📜', prompt:'You are a wise elderly Yemenite man. Speak slowly in parables and ancient wisdom.' },
  news_anchor: { name:'קריין חדשות דרמטי',      emoji:'🎙️', prompt:'You are a dramatic news anchor. Speak with authority, emphasize words dramatically, say "breaking news".' },
  athlete:     { name:'ספורטאי תחרותי',         emoji:'🏆', prompt:'You are a competitive athlete. Talk about training, motivation, discipline, wins and losses.' },
};

// ── Color palette for models ──────────────────────────────────
const MODEL_COLORS = [
  '#4263eb','#e03131','#2f9e44','#f76707','#6741d9',
  '#1971c2','#c2255c','#087f5b','#e67700','#5c7cfa',
];

// ── Utility: assign color to each participating model ─────────
function getModelColor(idx) { return MODEL_COLORS[idx % MODEL_COLORS.length]; }

// ============================================================
//  CORS-SAFE Hugging Face Call
//  Uses /models/{id} text-generation endpoint
// ============================================================
function buildPrompt(modelId, systemPrompt, history, userMessage) {
  const mid = modelId.toLowerCase();
  const isLlama3  = mid.includes('llama-3') || mid.includes('llama3');
  const isMistral = mid.includes('mistral') || mid.includes('mixtral') || mid.includes('zephyr') || mid.includes('hermes');
  const isPhi3    = mid.includes('phi-3') || mid.includes('phi3');
  const isGemma   = mid.includes('gemma');

  if (isLlama3) {
    let p = '<|begin_of_text|>';
    if (systemPrompt) p += `<|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
    history.forEach((m,i) => {
      p += `<|start_header_id|>${i%2===0?'user':'assistant'}<|end_header_id|>\n\n${m.text}<|eot_id|>`;
    });
    p += `<|start_header_id|>user<|end_header_id|>\n\n${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    return p;
  }
  if (isMistral) {
    let p = systemPrompt ? `<s>[INST] ${systemPrompt} [/INST]\n` : '';
    history.forEach((m,i) => {
      p += i%2===0 ? `[INST] ${m.text} [/INST]\n` : `${m.text}</s>\n`;
    });
    p += `[INST] ${userMessage} [/INST]\n`;
    return p;
  }
  if (isPhi3) {
    let p = systemPrompt ? `<|system|>\n${systemPrompt}<|end|>\n` : '';
    history.forEach((m,i) => {
      p += `${i%2===0?'<|user|>':'<|assistant|>'}\n${m.text}<|end|>\n`;
    });
    p += `<|user|>\n${userMessage}<|end|>\n<|assistant|>\n`;
    return p;
  }
  if (isGemma) {
    let p = '';
    if (systemPrompt) { p = `<start_of_turn>user\n${systemPrompt}\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`; return p; }
    history.forEach((m,i) => { p += `<start_of_turn>${i%2===0?'user':'model'}\n${m.text}<end_of_turn>\n`; });
    p += `<start_of_turn>user\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`;
    return p;
  }
  // ChatML default
  let p = systemPrompt ? `<|im_start|>system\n${systemPrompt}<|im_end|>\n` : '';
  history.forEach((m,i) => { p += `<|im_start|>${i%2===0?'user':'assistant'}\n${m.text}<|im_end|>\n`; });
  p += `<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;
  return p;
}

async function callHF(modelId, systemPrompt, history, userMessage) {
  const prompt = buildPrompt(modelId, systemPrompt, history, userMessage);
  const url    = `${HF_BASE}${modelId}`;
  const res    = await fetch(url, {
    method : 'POST',
    headers: { 'Authorization': `Bearer ${hfApiKey}`, 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      inputs    : prompt,
      parameters: { max_new_tokens: 400, temperature: 0.85, do_sample: true, return_full_text: false,
        stop: ['<|eot_id|>','<|im_end|>','<|end|>','</s>','[INST]','<end_of_turn>','###'] },
    }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const b=await res.json(); if(b.error) msg = typeof b.error==='string'?b.error:JSON.stringify(b.error); } catch(_){}
    if (res.status===401) throw new Error('מפתח API לא תקין. 🔑');
    if (res.status===403) throw new Error('גישה נדחתה למודל זה — נסה מודל אחר. 🚫');
    if (res.status===404) throw new Error(`המודל "${modelId}" לא נמצא. 🔎`);
    if (res.status===429) throw new Error('חריגה ממגבלת קריאות. המתן רגע. ⏳');
    if (res.status===503) throw new Error('המודל עדיין בטעינה — נסה שוב בעוד 20 שניות. 🔄');
    throw new Error(`שגיאת API (${res.status}): ${msg}`);
  }

  const data = await res.json();
  let text = (Array.isArray(data) && data[0]?.generated_text) || data?.generated_text || '';
  if (!text) throw new Error('המודל החזיר תשובה ריקה. 🤔');
  return cleanOutput(text);
}

function cleanOutput(raw) {
  const stops = ['<|eot_id|>','<|im_end|>','<|end|>','</s>','<end_of_turn>','[INST]','[/INST]','###','<|endoftext|>'];
  let t = raw;
  for (const s of stops) { const i=t.indexOf(s); if(i!==-1) t=t.substring(0,i); }
  return t.replace(/^(assistant|ai|model|user|human|bot)\s*:\s*/i,'').replace(/^<\|.*?\|>\s*/,'').trim();
}

// ============================================================
//  API KEY VALIDATION — uses /whoami-v2 (CORS-safe)
// ============================================================
async function validateAndSetApiKey(key, silent=false) {
  if (!silent) { apiKeyStatus.textContent='מאמת... ⏳'; apiKeyStatus.className='status-message'; }
  validateApiKeyBtn.disabled = true;
  try {
    const r = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    if (r.status===401||r.status===403) throw new Error('invalid');
    hfApiKey = key;
    localStorage.setItem(STORAGE_KEY_API, key);
    const d = r.ok ? await r.json() : {};
    const name = d?.name ? ` (${d.name})` : '';
    apiKeyStatus.textContent = `אושר${name}! 🎉`;
    apiKeyStatus.className   = 'status-message success';
    setTimeout(()=>{ apiKeyModal.classList.remove('show'); mainContent.classList.remove('hidden'); }, 800);
  } catch(e) {
    apiKeyStatus.textContent = 'מפתח לא תקין. בדוק שהוא מתחיל ב-hf_ 🙁';
    apiKeyStatus.className   = 'status-message error';
    localStorage.removeItem(STORAGE_KEY_API); hfApiKey=null;
    if (!silent) { mainContent.classList.add('hidden'); apiKeyModal.classList.add('show'); }
  } finally { validateApiKeyBtn.disabled=false; }
}

// ============================================================
//  SETTINGS MODAL
// ============================================================
let settingsRounds    = 5;     // 0 = unlimited
let settingsPersonas  = {};    // modelId -> { key, customPrompt }

function openSettings() {
  buildPersonaList();
  settingsModal.classList.add('show');
}
function closeSettings() { settingsModal.classList.remove('show'); }

function buildPersonaList() {
  personaList.innerHTML = '';
  if (!selectedModels.length) {
    personaList.innerHTML = '<p class="settings-hint">בחר מודלים בהגדרת השיחה תחילה.</p>';
    return;
  }
  selectedModels.forEach(mid => {
    const m    = HF_MODELS.find(x=>x.id===mid) || { name: mid, emoji:'🤖' };
    const cur  = settingsPersonas[mid] || { key:'none', customPrompt:'' };
    const wrap = document.createElement('div');
    wrap.className = 'persona-row';
    wrap.innerHTML = `
      <div class="persona-model-label">${m.emoji} ${m.name}</div>
      <select class="persona-select" data-model="${mid}">
        ${Object.entries(PERSONAS).map(([k,v])=>`<option value="${k}" ${cur.key===k?'selected':''}>${v.emoji} ${v.name}</option>`).join('')}
      </select>
      <div class="custom-persona-area ${cur.key==='custom'?'':'hidden'}" id="custom-persona-${CSS.escape(mid)}">
        <textarea placeholder="הכנס System Prompt מותאם אישית" class="custom-persona-input" data-model="${mid}">${cur.key==='custom'?cur.customPrompt:''}</textarea>
      </div>`;
    personaList.appendChild(wrap);
    wrap.querySelector('.persona-select').addEventListener('change', function() {
      const area = wrap.querySelector('.custom-persona-area');
      area.classList.toggle('hidden', this.value !== 'custom');
    });
  });
}

function saveSettings() {
  // rounds
  const rVal = document.querySelector('input[name="rounds"]:checked')?.value || '5';
  settingsRounds = rVal === 'unlimited' ? 0 : parseInt(rVal);

  // personas
  document.querySelectorAll('.persona-select').forEach(sel => {
    const mid    = sel.dataset.model;
    const key    = sel.value;
    const custom = sel.closest('.persona-row').querySelector('.custom-persona-input')?.value || '';
    settingsPersonas[mid] = { key, customPrompt: custom };
  });

  settingsModal.classList.remove('show');
}

function getSystemPromptFor(mid) {
  const cfg = settingsPersonas[mid] || { key: 'none', customPrompt: '' };
  if (cfg.key === 'none')   return '';
  if (cfg.key === 'custom') return cfg.customPrompt;
  return PERSONAS[cfg.key]?.prompt || '';
}

// ============================================================
//  MODEL CHIP SELECTOR
// ============================================================
function buildModelChips() {
  modelChipsArea.innerHTML = '';
  HF_MODELS.forEach(m => {
    const chip = document.createElement('button');
    chip.className   = 'model-chip';
    chip.dataset.id  = m.id;
    chip.textContent = `${m.emoji} ${m.name}`;
    chip.addEventListener('click', () => toggleModel(m.id, chip));
    modelChipsArea.appendChild(chip);
  });
}

function toggleModel(id, chip) {
  const idx = selectedModels.indexOf(id);
  if (idx === -1) {
    selectedModels.push(id);
    chip.classList.add('selected');
  } else {
    selectedModels.splice(idx, 1);
    chip.classList.remove('selected');
  }
  renderSelectedTags();
  buildPersonaList();
}

function renderSelectedTags() {
  selectedModelsList.innerHTML = '';
  selectedModels.forEach((mid, idx) => {
    const m   = HF_MODELS.find(x=>x.id===mid) || { name: mid, emoji:'🤖' };
    const tag = document.createElement('span');
    tag.className   = 'selected-tag';
    tag.style.borderColor = getModelColor(idx);
    tag.style.color       = getModelColor(idx);
    tag.innerHTML = `${m.emoji} ${m.name} <span class="tag-remove" data-id="${mid}">✕</span>`;
    tag.querySelector('.tag-remove').addEventListener('click', () => {
      const chip = modelChipsArea.querySelector(`[data-id="${CSS.escape(mid)}"]`);
      if (chip) chip.classList.remove('selected');
      toggleModel(mid, chip || document.createElement('button'));
    });
    selectedModelsList.appendChild(tag);
  });
}

// ============================================================
//  TOPIC MODE
// ============================================================
function setTopicMode(mode) {
  topicMode = mode;
  topicModeUserBtn.classList.toggle('active', mode==='user');
  topicModeAiBtn.classList.toggle('active',   mode==='ai');
  userTopicArea.classList.toggle('hidden', mode==='ai');
  aiTopicArea.classList.toggle('hidden',   mode==='user');
}

async function suggestTopics() {
  if (!hfApiKey) { alert('הכנס מפתח API תחילה.'); return; }
  if (!selectedModels.length) { alert('בחר לפחות מודל אחד תחילה.'); return; }

  suggestTopicsBtn.disabled = true;
  aiTopicStatus.textContent  = 'מבקש הצעות מהמודלים... ⏳';
  aiTopicStatus.className    = 'status-message';
  aiTopicSuggestions.innerHTML = '';

  const mid = selectedModels[0];
  const sys = 'You are a creative AI. Suggest exactly 5 interesting, diverse conversation topics suitable for a debate between AI models. Return ONLY a numbered list (1. ... 2. ... etc), no extra text.';
  const usr = 'List 5 interesting and diverse conversation topics for a group of AI models to debate.';

  try {
    const raw  = await callHF(mid, sys, [], usr);
    const lines= raw.split('\n').map(l=>l.replace(/^\d+[\.\)]\s*/,'').trim()).filter(l=>l.length>5).slice(0,5);
    if (!lines.length) throw new Error('empty');

    aiTopicStatus.textContent = '';
    lines.forEach(topic => {
      const btn = document.createElement('button');
      btn.className   = 'topic-suggestion-btn';
      btn.textContent = topic;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.topic-suggestion-btn').forEach(b=>b.classList.remove('chosen'));
        btn.classList.add('chosen');
        chosenTopic = topic;
      });
      aiTopicSuggestions.appendChild(btn);
    });
  } catch(e) {
    aiTopicStatus.textContent = 'שגיאה בקבלת הצעות: ' + e.message;
    aiTopicStatus.className   = 'status-message error';
  } finally {
    suggestTopicsBtn.disabled = false;
  }
}

// ============================================================
//  HISTORY
// ============================================================
const getSavedChats = () => JSON.parse(localStorage.getItem(STORAGE_KEY_HIST)||'[]');
const saveChats     = c  => localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(c));

function persistChat(conv) {
  if (!currentChatId) return;
  let chats = getSavedChats();
  const idx  = chats.findIndex(c=>c.id===currentChatId);
  const obj  = { id:currentChatId, topic:chosenTopic, models:selectedModels, conversation:conv, lastUpdated:Date.now(), favorite: idx!==-1?chats[idx].favorite:false };
  if (idx>-1) chats[idx]={...chats[idx],...obj}; else chats.push(obj);
  saveChats(chats); renderHistoryList();
}

function renderHistoryList() {
  let chats = getSavedChats().sort((a,b)=>(b.favorite-a.favorite)||(b.lastUpdated-a.lastUpdated));
  historyList.innerHTML = chats.length ? '' : '<p class="empty-history-message">אין שיחות שמורות.</p>';
  chats.forEach(chat => {
    const item = historyItemTmpl.content.cloneNode(true).firstElementChild;
    item.dataset.id = chat.id;
    if (chat.favorite) item.classList.add('favorite');
    item.querySelector('.history-item-title').textContent   = chat.topic || 'שיחה';
    item.querySelector('.history-item-date').textContent    = new Date(chat.lastUpdated).toLocaleString('he-IL');
    const last = chat.conversation?.[chat.conversation.length-1];
    item.querySelector('.history-item-preview').textContent = last ? `${last.author}: ${last.text.substring(0,50)}...` : '';
    item.querySelector('.history-item-main').addEventListener('click', ()=>loadChat(chat.id));
    const fb = item.querySelector('.favorite-btn');
    if (chat.favorite) fb.classList.add('is-favorite');
    fb.addEventListener('click', e=>{ e.stopPropagation(); toggleFav(chat.id); });
    item.querySelector('.delete-btn').addEventListener('click', e=>{ e.stopPropagation(); deleteChat(chat.id); });
    historyList.appendChild(item);
  });
}

function loadChat(id) {
  const chat = getSavedChats().find(c=>c.id===id); if(!chat) return;
  currentChatId    = chat.id;
  chosenTopic      = chat.topic;
  selectedModels   = chat.models || [];
  chatTitle.textContent = 'שיחה על: ' + chosenTopic;
  chatContainer.innerHTML = '';
  (chat.conversation||[]).forEach((msg,i)=>addMessage(msg.author, msg.emoji, msg.color, msg.text, false));
  updateViewState('chat'); toggleHistory(false);
  continueChatBtn.classList.remove('hidden');
  setGenerating(false);
}

function deleteChat(id) {
  if (!confirm('למחוק?')) return;
  saveChats(getSavedChats().filter(c=>c.id!==id));
  if (currentChatId===id) { clearConversation(true); updateViewState('setup'); }
  renderHistoryList();
}

function toggleFav(id) {
  let chats = getSavedChats(); const idx=chats.findIndex(c=>c.id===id);
  if(idx>-1){ chats[idx].favorite=!chats[idx].favorite; saveChats(chats); renderHistoryList(); }
}

function toggleHistory(show) {
  const open = show===undefined ? !historyPanel.classList.contains('open') : show;
  historyPanel.classList.toggle('open', open);
  historyPanelOverlay.classList.toggle('hidden', !open);
  document.body.classList.toggle('history-open', open);
}

// ============================================================
//  CHAT UI
// ============================================================
function updateViewState(state) {
  setupSection.classList.toggle('hidden', state==='chat');
  chatSection.classList.toggle('hidden',  state==='setup');
  newChatBtn.classList.toggle('hidden',   state==='setup');
}

function addMessage(author, emoji, color, text, persist=true) {
  const el = msgTemplate.content.cloneNode(true).firstElementChild;
  el.querySelector('.avatar').textContent          = emoji;
  el.querySelector('.avatar').style.borderColor    = color;
  el.querySelector('.message-author').textContent  = author;
  el.querySelector('.message-author').style.color  = color;
  el.querySelector('.message-text').textContent    = text;
  chatContainer.appendChild(el);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (persist) {
    const conv = getSavedChats().find(c=>c.id===currentChatId)?.conversation || [];
    persistChat([...conv, { author, emoji, color, text }]);
  }
}

function showTyping(author, emoji, color) {
  const el = msgTemplate.content.cloneNode(true).firstElementChild;
  el.id = 'typing-indicator';
  el.querySelector('.avatar').textContent       = emoji;
  el.querySelector('.avatar').style.borderColor = color;
  el.querySelector('.message-author').textContent = author;
  el.querySelector('.message-author').style.color = color;
  el.querySelector('.message-text').innerHTML   = '<div class="thinking-indicator"><div class="dot-flashing"></div></div>';
  chatContainer.appendChild(el);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
function removeTyping() { document.getElementById('typing-indicator')?.remove(); }

function updateProgress() {
  if (settingsRounds === 0) {
    progressIndicator.textContent = `סיבוב ${currentRound} ∞`;
  } else {
    progressIndicator.textContent = `סיבוב ${currentRound} מתוך ${totalRounds} 🔄`;
  }
}

function setGenerating(gen) {
  isGenerating = gen;
  [startChatBtn, continueChatBtn, clearChatBtn, editApiKeyBtn, openHistoryBtn,
   topicInput, suggestTopicsBtn].forEach(el=>{ if(el) el.disabled=gen; });
  modelChipsArea.querySelectorAll('.model-chip').forEach(c=>c.disabled=gen);
  startChatBtn.textContent = gen ? 'מייצר שיחה... 🧠' : 'התחל שיחה ✨';

  // Stop button visibility: only when unlimited AND generating
  if (settingsRounds === 0 && gen) {
    stopChatBtn.classList.remove('hidden');
  } else {
    stopChatBtn.classList.add('hidden');
  }
}

// ============================================================
//  MAIN CONVERSATION LOOP
// ============================================================
async function runConversation(rounds) {
  if (isGenerating) return;
  if (selectedModels.length < 2) { alert('בחר לפחות 2 מודלים לשיחה.'); return; }

  setGenerating(true);
  stopRequested = false;
  const isUnlimited = (settingsRounds === 0);
  const loopRounds  = rounds || settingsRounds || 5;
  totalRounds = isUnlimited ? 0 : (totalRounds + loopRounds);
  continueChatBtn.classList.add('hidden');

  // Build list of participating models with their colors
  const participants = selectedModels.map((mid, i) => {
    const m = HF_MODELS.find(x=>x.id===mid) || { name: mid, emoji:'🤖' };
    return { mid, name: m.name, emoji: m.emoji, color: getModelColor(i) };
  });

  // Build a "forum roster" string so models know who's in the conversation
  const rosterStr = participants.map(p=>`- ${p.name} (AI model, id: ${p.mid})`).join('\n');

  // Existing conversation as flat text history
  const getHistory = () => (getSavedChats().find(c=>c.id===currentChatId)?.conversation || []);

  const actualRounds = isUnlimited ? 9999 : loopRounds;

  for (let i = 0; i < actualRounds; i++) {
    if (stopRequested) break;

    currentRound++;
    updateProgress();

    // Pick which model speaks next (round-robin)
    const speaker = participants[currentRound % participants.length];

    // Build system prompt for speaker
    const personaPrompt = getSystemPromptFor(speaker.mid);
    const systemPrompt = `You are ${speaker.name}, an AI language model (id: ${speaker.mid}).
You are participating in a forum-style group discussion with other AI models about: "${chosenTopic}".
The participants in this discussion are:
${rosterStr}

IMPORTANT RULES:
- You are talking to OTHER AI MODELS, not humans. Address them as fellow AI systems.
- Write naturally as if in a forum thread. You may ask questions, answer, agree, disagree, or add new points.
- To direct a message at a specific model, mention their name (e.g. "@Llama 3" or "@Mistral").
- Keep your response concise (2-5 sentences). Stay on topic: "${chosenTopic}".
- Reply in Hebrew if the topic is in Hebrew; otherwise match the language of the topic.
${personaPrompt ? `\nYour personality:\n${personaPrompt}` : ''}
- Do NOT include any system prompt, preamble, or role label in your response. Just write your message.`;

    // Build context from last ~6 messages
    const history  = getHistory().slice(-6);
    const histText = history.map(m=>`${m.author}: ${m.text}`).join('\n');
    const userMsg  = history.length
      ? `Here is the recent discussion:\n${histText}\n\nNow it's your turn (${speaker.name}) to contribute to the discussion about "${chosenTopic}". Write your next message.`
      : `Start the discussion about "${chosenTopic}". Write an opening message as ${speaker.name}.`;

    try {
      showTyping(speaker.name, speaker.emoji, speaker.color);
      const raw  = await callHF(speaker.mid, systemPrompt, [], userMsg);
      removeTyping();
      addMessage(speaker.name, speaker.emoji, speaker.color, raw);
    } catch(err) {
      removeTyping();
      addMessage('⚙️ מערכת', '⚙️', '#888', `שגיאה עבור ${speaker.name}: ${err.message}`, false);
      // don't break — continue with next model
    }

    if (stopRequested) break;
    // Small delay to avoid rate limiting
    await sleep(300);
  }

  setGenerating(false);
  stopChatBtn.classList.add('hidden');
  stopChatBtn.textContent = '⏹ עצור שיחה';
  stopChatBtn.disabled    = false;
  if (currentChatId && !isUnlimited) continueChatBtn.classList.remove('hidden');
  else if (isUnlimited) continueChatBtn.classList.add('hidden');
}

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

async function startNewConversation() {
  if (isGenerating) return;
  if (selectedModels.length < 2) { alert('בחר לפחות 2 מודלים לשיחה.'); return; }

  if (topicMode === 'user') {
    chosenTopic = topicInput.value.trim();
    if (!chosenTopic) { alert('הכנס נושא לשיחה.'); return; }
  } else {
    if (!chosenTopic) { alert('בחר נושא מהרשימה שהוצעה על ידי המודלים.'); return; }
  }

  clearConversation(false);
  currentChatId       = Date.now();
  chatTitle.textContent = 'שיחה על: ' + chosenTopic;
  updateViewState('chat');
  await runConversation(settingsRounds || 5);
}

function clearConversation(goToSetup=true) {
  if (isGenerating) return;
  currentChatId = null; currentRound = 0; totalRounds = 0;
  chatContainer.innerHTML = '';
  progressIndicator.textContent = '';
  continueChatBtn.classList.add('hidden');
  stopChatBtn.classList.add('hidden');
  if (goToSetup) { updateViewState('setup'); chosenTopic=''; topicInput.value=''; aiTopicSuggestions.innerHTML=''; }
}

// ============================================================
//  EXPORT
// ============================================================
function exportChat(fmt) {
  const chat = getSavedChats().find(c=>c.id===currentChatId);
  if (!chat?.conversation?.length) { alert('אין שיחה לשמור.'); return; }
  const name = (chat.topic||'chat').replace(/[^\w\u0590-\u05FF ]/g,'').replace(/ /g,'_');
  if (fmt==='txt') {
    const txt = `נושא: ${chat.topic}\n\n` + chat.conversation.map(m=>`${m.author}:\n${m.text}\n`).join('\n');
    download(`${name}.txt`, txt, 'text/plain;charset=utf-8');
  } else if (fmt==='json') {
    download(`${name}.json`, JSON.stringify(chat,null,2), 'application/json;charset=utf-8');
  } else if (fmt==='png') {
    html2canvas(chatContainer,{backgroundColor:getComputedStyle(document.body).getPropertyValue('--background-color'),useCORS:true,scale:1.5})
      .then(c=>download(`${name}.png`,c.toDataURL('image/png'),'image/png',true))
      .catch(()=>alert('שגיאה ביצירת תמונה.'));
  }
}

function download(name, content, mime, isUrl=false) {
  const a=document.createElement('a'); a.download=name;
  a.href = isUrl ? content : URL.createObjectURL(new Blob([content],{type:mime}));
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (!isUrl) URL.revokeObjectURL(a.href);
}

// ============================================================
//  INIT
// ============================================================
function init() {
  buildModelChips();
  renderHistoryList();

  // default model selection
  const defaults = ['mistralai/Mistral-7B-Instruct-v0.3','meta-llama/Meta-Llama-3-8B-Instruct'];
  defaults.forEach(id => {
    const chip = modelChipsArea.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (chip) { selectedModels.push(id); chip.classList.add('selected'); }
  });
  renderSelectedTags();

  // API key
  const saved = localStorage.getItem(STORAGE_KEY_API);
  if (saved) { hfApiKey=saved; mainContent.classList.remove('hidden'); }
  else       { apiKeyModal.classList.add('show'); mainContent.classList.add('hidden'); }

  // Listeners
  validateApiKeyBtn.addEventListener('click', ()=>{
    const k=apiKeyInput.value.trim();
    if(k) validateAndSetApiKey(k); else { apiKeyStatus.textContent='הכנס מפתח.'; apiKeyStatus.className='status-message error'; }
  });
  apiKeyInput.addEventListener('keydown', e=>{ if(e.key==='Enter') validateApiKeyBtn.click(); });

  editApiKeyBtn.addEventListener('click', ()=>{
    apiKeyStatus.textContent=''; apiKeyInput.value=localStorage.getItem(STORAGE_KEY_API)||'';
    apiKeyModal.classList.add('show');
  });

  topicModeUserBtn.addEventListener('click', ()=>setTopicMode('user'));
  topicModeAiBtn.addEventListener('click',   ()=>setTopicMode('ai'));
  suggestTopicsBtn.addEventListener('click', suggestTopics);

  openSettingsBtn.addEventListener('click',    openSettings);
  openSettingsInline.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click',   closeSettings);
  saveSettingsBtn.addEventListener('click',    saveSettings);
  settingsModal.addEventListener('click', e=>{ if(e.target===settingsModal) closeSettings(); });

  openHistoryBtn.addEventListener('click', ()=>toggleHistory(true));
  closeHistoryBtn.addEventListener('click',()=>toggleHistory(false));
  historyPanelOverlay.addEventListener('click',()=>toggleHistory(false));

  newChatBtn.addEventListener('click',   ()=>{ clearConversation(false); updateViewState('setup'); });
  startChatBtn.addEventListener('click', startNewConversation);
  continueChatBtn.addEventListener('click', ()=>runConversation(5));
  clearChatBtn.addEventListener('click',    ()=>clearConversation(true));
  stopChatBtn.addEventListener('click',     ()=>{ stopRequested=true; stopChatBtn.textContent='עוצר... ⏳'; stopChatBtn.disabled=true; });

  saveTxtBtn.addEventListener('click',  e=>{ e.preventDefault(); exportChat('txt'); });
  saveJsonBtn.addEventListener('click', e=>{ e.preventDefault(); exportChat('json'); });
  savePngBtn.addEventListener('click',  e=>{ e.preventDefault(); exportChat('png'); });

  updateViewState('setup');
}

document.addEventListener('DOMContentLoaded', init);
