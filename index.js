// =====================================================================
//  AI ↔ AI Chat — Hugging Face Inference API
// =====================================================================

// --- DOM Elements ---
const app                        = document.getElementById('app');
const apiKeyModal                = document.getElementById('api-key-modal');
const apiKeyInput                = document.getElementById('api-key-input');
const validateApiKeyBtn          = document.getElementById('validate-api-key-btn');
const apiKeyStatus               = document.getElementById('api-key-status');
const mainContent                = document.getElementById('main-content');
const editApiKeyBtn              = document.getElementById('edit-api-key-btn');
const newChatBtn                 = document.getElementById('new-chat-btn');

// History Panel
const historyPanel               = document.getElementById('history-panel');
const historyPanelOverlay        = document.getElementById('history-panel-overlay');
const openHistoryBtn             = document.getElementById('open-history-btn');
const closeHistoryBtn            = document.getElementById('close-history-btn');
const historyList                = document.getElementById('history-list');
const historyItemTemplate        = document.getElementById('history-item-template');

// Setup
const topicInput                 = document.getElementById('topic-input');
const questionerSelect           = document.getElementById('questioner-select');
const answererSelect             = document.getElementById('answerer-select');
const customQuestionerPrompt     = document.getElementById('custom-questioner-prompt');
const customQuestionerName       = document.getElementById('custom-questioner-name');
const customQuestionerSystemPrompt = document.getElementById('custom-questioner-system-prompt');
const customAnswererPrompt       = document.getElementById('custom-answerer-prompt');
const customAnswererName         = document.getElementById('custom-answerer-name');
const customAnswererSystemPrompt = document.getElementById('custom-answerer-system-prompt');
const swapCharactersBtn          = document.getElementById('swap-characters-btn');
const startChatBtn               = document.getElementById('start-chat-btn');

// Preview cards
const questionerEmojiPreview     = document.getElementById('questioner-emoji-preview');
const questionerNamePreview      = document.getElementById('questioner-name-preview');
const questionerIdPreview        = document.getElementById('questioner-id-preview');
const answererEmojiPreview       = document.getElementById('answerer-emoji-preview');
const answererNamePreview        = document.getElementById('answerer-name-preview');
const answererIdPreview          = document.getElementById('answerer-id-preview');

// Chat
const chatSection                = document.getElementById('chat-section');
const setupSection               = document.getElementById('setup-section');
const chatTitle                  = document.getElementById('chat-title');
const progressIndicator          = document.getElementById('progress-indicator');
const chatContainer              = document.getElementById('chat-container');
const messageTemplate            = document.getElementById('chat-message-template');

// Controls
const continueChatBtn            = document.getElementById('continue-chat-btn');
const saveTxtBtn                 = document.getElementById('save-txt');
const saveJsonBtn                = document.getElementById('save-json');
const savePngBtn                 = document.getElementById('save-png');
const clearChatBtn               = document.getElementById('clear-chat-btn');

// =====================================================================
//  State
// =====================================================================
let hfApiKey        = null;
let currentChatId   = null;
let currentRound    = 0;
let totalRounds     = 0;
let isGenerating    = false;
let isSharedChatView = false;

const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models/';
const STORAGE_KEY_API  = 'hf_ai_chat_api_key';
const STORAGE_KEY_HIST = 'hf_ai_chat_history';

// =====================================================================
//  Model Registry  (30+ models)
// =====================================================================
const HF_MODELS = [
  // ── Instruction-tuned / Chat models ──────────────────────────────
  {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct',
    name: 'Llama 3 (8B)',
    emoji: '🦙',
    description: 'Meta Llama 3 Instruct — 8B parameters, strong multilingual',
    type: 'chat',
  },
  {
    id: 'meta-llama/Meta-Llama-3-70B-Instruct',
    name: 'Llama 3 (70B)',
    emoji: '🦙',
    description: 'Meta Llama 3 Instruct — 70B parameters, very capable',
    type: 'chat',
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct',
    emoji: '🌀',
    description: 'Mistral AI — fast, efficient instruction model',
    type: 'chat',
  },
  {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    name: 'Mixtral 8×7B Instruct',
    emoji: '🌀',
    description: 'Mistral AI Mixture-of-Experts — high quality reasoning',
    type: 'chat',
  },
  {
    id: 'mistralai/Mistral-Nemo-Instruct-2407',
    name: 'Mistral Nemo 12B',
    emoji: '🌀',
    description: 'Mistral Nemo — 12B, strong multilingual understanding',
    type: 'chat',
  },
  {
    id: 'microsoft/Phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini (4K)',
    emoji: '🔷',
    description: 'Microsoft Phi-3 Mini — compact and surprisingly capable',
    type: 'chat',
  },
  {
    id: 'microsoft/Phi-3-medium-4k-instruct',
    name: 'Phi-3 Medium (4K)',
    emoji: '🔷',
    description: 'Microsoft Phi-3 Medium — 14B parameters',
    type: 'chat',
  },
  {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 (9B IT)',
    emoji: '💎',
    description: 'Google Gemma 2 Instruction-tuned — 9B params',
    type: 'chat',
  },
  {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma 2 (27B IT)',
    emoji: '💎',
    description: 'Google Gemma 2 Instruction-tuned — 27B params',
    type: 'chat',
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen 2.5 (7B)',
    emoji: '🐼',
    description: 'Alibaba Qwen 2.5 — multilingual, strong on Hebrew/Arabic',
    type: 'chat',
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen 2.5 (72B)',
    emoji: '🐼',
    description: 'Alibaba Qwen 2.5 — large, very capable multilingual model',
    type: 'chat',
  },
  {
    id: 'Qwen/QwQ-32B',
    name: 'QwQ 32B (Reasoning)',
    emoji: '🧠',
    description: 'Qwen reasoning model — deep step-by-step thinking',
    type: 'chat',
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    name: 'DeepSeek R1 (8B)',
    emoji: '🔍',
    description: 'DeepSeek R1 distilled reasoning — Llama base',
    type: 'chat',
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    name: 'DeepSeek R1 (32B)',
    emoji: '🔍',
    description: 'DeepSeek R1 distilled reasoning — Qwen base, 32B',
    type: 'chat',
  },
  {
    id: 'deepseek-ai/DeepSeek-V3-0324',
    name: 'DeepSeek V3',
    emoji: '🔍',
    description: 'DeepSeek V3 — powerful MoE model',
    type: 'chat',
  },
  {
    id: 'NovaSky-Berkeley/Sky-T1-32B-Preview',
    name: 'Sky-T1 32B',
    emoji: '☁️',
    description: 'Berkeley Sky-T1 — strong reasoning, 32B',
    type: 'chat',
  },
  {
    id: 'HuggingFaceH4/zephyr-7b-beta',
    name: 'Zephyr 7B Beta',
    emoji: '🌬️',
    description: 'HuggingFace Zephyr — aligned chat model',
    type: 'chat',
  },
  {
    id: 'tiiuae/falcon-7b-instruct',
    name: 'Falcon 7B Instruct',
    emoji: '🦅',
    description: 'TII UAE Falcon — efficient instruct model',
    type: 'chat',
  },
  {
    id: 'tiiuae/falcon-40b-instruct',
    name: 'Falcon 40B Instruct',
    emoji: '🦅',
    description: 'TII UAE Falcon — 40B, strong reasoning',
    type: 'chat',
  },
  {
    id: 'openchat/openchat-3.5-0106',
    name: 'OpenChat 3.5',
    emoji: '💬',
    description: 'OpenChat 3.5 — high-quality open source chat',
    type: 'chat',
  },
  {
    id: 'teknium/OpenHermes-2.5-Mistral-7B',
    name: 'OpenHermes 2.5',
    emoji: '⚗️',
    description: 'Mistral-based Hermes — instruction following',
    type: 'chat',
  },
  {
    id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    name: 'Hermes 2 Mixtral',
    emoji: '⚗️',
    description: 'Nous Hermes 2 on Mixtral MoE backbone',
    type: 'chat',
  },
  {
    id: 'upstage/SOLAR-10.7B-Instruct-v1.0',
    name: 'SOLAR 10.7B',
    emoji: '☀️',
    description: 'Upstage SOLAR — depth-upscaled instruction model',
    type: 'chat',
  },
  {
    id: 'WizardLM/WizardLM-2-8x22B',
    name: 'WizardLM 2 (8x22B)',
    emoji: '🧙',
    description: 'WizardLM 2 MoE — one of the best open instruction models',
    type: 'chat',
  },
  {
    id: 'microsoft/WizardLM-2-7B',
    name: 'WizardLM 2 (7B)',
    emoji: '🧙',
    description: 'WizardLM 2 7B — compact instruction following',
    type: 'chat',
  },
  {
    id: 'codellama/CodeLlama-34b-Instruct-hf',
    name: 'Code Llama 34B',
    emoji: '💻',
    description: 'Meta Code Llama — specialized in code generation',
    type: 'chat',
  },
  {
    id: 'Nexusflow/Starling-LM-7B-beta',
    name: 'Starling 7B Beta',
    emoji: '⭐',
    description: 'Nexusflow Starling — RLHF-tuned Openchat base',
    type: 'chat',
  },
  {
    id: 'snorkelai/Snorkel-Mistral-PairRM-DPO',
    name: 'Snorkel Mistral DPO',
    emoji: '🤿',
    description: 'Snorkel Mistral DPO — preference-aligned model',
    type: 'chat',
  },
  {
    id: 'garage-bAInd/Platypus2-70B-instruct',
    name: 'Platypus2 70B',
    emoji: '🦆',
    description: 'Platypus 2 — strong reasoning, 70B LLaMA-2 base',
    type: 'chat',
  },
  {
    id: 'BAAI/bge-multilingual-gemma2',
    name: 'BGE Multilingual Gemma2',
    emoji: '🌍',
    description: 'BAAI — multilingual embeddings on Gemma2 base',
    type: 'chat',
  },
  {
    id: 'allenai/OLMo-2-1124-13B-Instruct',
    name: 'OLMo 2 (13B)',
    emoji: '🔬',
    description: 'Allen AI OLMo 2 — fully open research model',
    type: 'chat',
  },
  {
    id: 'ibm-granite/granite-3.2-8b-instruct',
    name: 'IBM Granite 3.2 (8B)',
    emoji: '🏔️',
    description: 'IBM Granite 3.2 — enterprise-grade instruct model',
    type: 'chat',
  },
  // Custom option
  {
    id: 'custom',
    name: 'מודל מותאם אישית',
    emoji: '⚙️',
    description: 'הגדר מזהה מודל משלך + system prompt',
    type: 'custom',
  },
];

// =====================================================================
//  Utility — call Hugging Face Inference API
// =====================================================================
async function callHuggingFace(modelId, systemPrompt, conversationHistory, userMessage) {
  // Build the messages array for the chat_completion endpoint
  const messages = [];

  // System message — tells the model it is an AI talking to another AI
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Inject existing conversation history
  conversationHistory.forEach((msg, idx) => {
    messages.push({
      role: idx % 2 === 0 ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  // The new user turn
  messages.push({ role: 'user', content: userMessage });

  const url = `https://api-inference.huggingface.co/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      max_tokens: 512,
      temperature: 0.8,
      stream: false,
    }),
  });

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody.error) errMsg = errBody.error;
    } catch (_) {}

    // Friendly Hebrew error messages
    if (response.status === 401) throw new Error('מפתח API לא תקין או פג תוקף. 🔑');
    if (response.status === 403) throw new Error('גישה נדחתה. ייתכן שהמודל מוגבל. 🚫');
    if (response.status === 404) throw new Error(`המודל "${modelId}" לא נמצא ב-Hugging Face. 🔎`);
    if (response.status === 429) throw new Error('חרגת ממגבלת הקריאות. נסה שוב בעוד מעט. ⏳');
    if (response.status === 503) throw new Error('המודל בטעינה — נסה שוב בעוד כמה שניות. 🔄');
    throw new Error(`שגיאת API: ${errMsg}`);
  }

  const data = await response.json();

  // Extract text from response
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.generated_text ||
    (Array.isArray(data) && data[0]?.generated_text) ||
    '';

  if (!text) throw new Error('המודל החזיר תשובה ריקה. 🤔');
  return text.trim();
}

// =====================================================================
//  Validate API Key
// =====================================================================
async function validateAndSetApiKey(key, isInitialLoad = false) {
  apiKeyStatus.textContent = 'מאמת מפתח עם Hugging Face... ⏳';
  apiKeyStatus.className = 'status-message';
  validateApiKeyBtn.disabled = true;

  try {
    // Simple test — call a lightweight model
    const testUrl = 'https://api-inference.huggingface.co/v1/chat/completions';
    const testRes = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        stream: false,
      }),
    });

    if (testRes.status === 401 || testRes.status === 403) {
      throw new Error('מפתח לא תקין');
    }

    // 404 / 503 are acceptable — key is valid, model may be sleeping
    hfApiKey = key;
    localStorage.setItem(STORAGE_KEY_API, key);
    apiKeyStatus.textContent = 'המפתח אושר! ברוך הבא 🎉';
    apiKeyStatus.className = 'status-message success';
    setTimeout(() => {
      apiKeyModal.classList.remove('show');
      mainContent.classList.remove('hidden');
    }, 900);

  } catch (err) {
    console.error('API Key validation error:', err);
    apiKeyStatus.textContent = 'מפתח לא תקין או שגיאת רשת. 🙁';
    apiKeyStatus.className = 'status-message error';
    localStorage.removeItem(STORAGE_KEY_API);
    hfApiKey = null;
    if (!isInitialLoad) {
      mainContent.classList.add('hidden');
      apiKeyModal.classList.add('show');
    }
  } finally {
    validateApiKeyBtn.disabled = false;
  }
}

// =====================================================================
//  Character / Model Definitions (personas around HF models)
// =====================================================================
const characters = {
  // --- Special: Custom ---
  custom: {
    name: 'מודל מותאם אישית',
    emoji: '⚙️',
    prompt: '',
    modelId: 'custom',
    description: 'הגדר מזהה מודל משלך',
  },
  // One entry per HF model — persona prompts tell each model it's an AI
  ...Object.fromEntries(
    HF_MODELS.filter(m => m.id !== 'custom').map(m => [
      m.id,
      {
        name: m.name,
        emoji: m.emoji,
        prompt: buildDefaultPersonaPrompt(m),
        modelId: m.id,
        description: m.description,
      },
    ])
  ),
};

function buildDefaultPersonaPrompt(model) {
  return (
    `You are ${model.name}, a large language model (AI) hosted on Hugging Face (model ID: ${model.id}). ` +
    `You are currently engaged in a structured dialogue with ANOTHER AI language model. ` +
    `You must address your conversation partner as a fellow AI, NOT as a human. ` +
    `Use phrases like "as an AI system", "as a language model", "from an AI perspective", etc. ` +
    `Be intellectually curious, direct, and true to your model's capabilities. ` +
    `Reply in the same language as the conversation topic — if the topic is in Hebrew, reply in Hebrew.`
  );
}

// =====================================================================
//  View Management
// =====================================================================
function updateViewState(state) {
  if (state === 'chat') {
    setupSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    newChatBtn.classList.remove('hidden');
  } else {
    setupSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    newChatBtn.classList.add('hidden');
  }
}

// =====================================================================
//  History Management
// =====================================================================
const getSavedChats = () => JSON.parse(localStorage.getItem(STORAGE_KEY_HIST) || '[]');
const saveChats     = (chats) => localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(chats));

function addOrUpdateCurrentChat(conversationHistory) {
  if (!currentChatId || isSharedChatView) return;
  let chats = getSavedChats();
  const idx = chats.findIndex(c => c.id === currentChatId);

  const state = {
    id:           currentChatId,
    topic:        topicInput.value.trim(),
    questioner:   getCharacterDetails('questioner'),
    answerer:     getCharacterDetails('answerer'),
    conversation: conversationHistory,
    lastUpdated:  Date.now(),
    favorite:     idx !== -1 ? chats[idx].favorite : false,
  };

  if (idx > -1) chats[idx] = { ...chats[idx], ...state };
  else chats.push(state);

  saveChats(chats);
  renderHistoryList();
}

function renderHistoryList() {
  let chats = getSavedChats();
  chats.sort((a, b) => (b.favorite - a.favorite) || (b.lastUpdated - a.lastUpdated));
  historyList.innerHTML = '';

  if (!chats.length) {
    historyList.innerHTML = '<p class="empty-history-message">אין שיחות שמורות עדיין.</p>';
    return;
  }

  chats.forEach(chat => {
    const item = historyItemTemplate.content.cloneNode(true).firstElementChild;
    item.dataset.chatId = chat.id;
    if (chat.favorite) item.classList.add('favorite');

    item.querySelector('.history-item-title').textContent = chat.topic || 'שיחה ללא נושא';
    item.querySelector('.history-item-date').textContent  = new Date(chat.lastUpdated).toLocaleString('he-IL');

    const last = chat.conversation[chat.conversation.length - 1];
    item.querySelector('.history-item-preview').textContent = last
      ? last.character + ': ' + last.text.substring(0, 50) + '...'
      : 'שיחה ריקה';

    item.querySelector('.history-item-main').addEventListener('click', () => loadChat(chat.id));

    const favBtn = item.querySelector('.favorite-btn');
    if (chat.favorite) favBtn.classList.add('is-favorite');
    favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(chat.id); });

    item.querySelector('.delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    historyList.appendChild(item);
  });
}

function loadChat(id) {
  if (isGenerating) return;
  const chats = getSavedChats();
  const chat  = chats.find(c => c.id === id);
  if (!chat) { alert('לא ניתן למצוא את השיחה.'); return; }

  isSharedChatView = false;
  currentChatId    = chat.id;
  topicInput.value = chat.topic;

  const setCharacter = (role, details) => {
    const select = role === 'questioner' ? questionerSelect : answererSelect;
    select.value = details.id;
    if (details.id === 'custom') {
      const nameInp   = role === 'questioner' ? customQuestionerName : customAnswererName;
      const promptInp = role === 'questioner' ? customQuestionerSystemPrompt : customAnswererSystemPrompt;
      nameInp.value   = details.name;
      promptInp.value = details.prompt;
    }
  };
  setCharacter('questioner', chat.questioner);
  setCharacter('answerer',   chat.answerer);
  handleCustomCharacterSelection();
  updatePreviewCards();

  chatContainer.innerHTML = '';
  chat.conversation.forEach(msg => {
    const cd = msg.role === 'questioner' ? chat.questioner : chat.answerer;
    addMessageToChat(cd, msg.text, msg.role, false);
  });

  currentRound = Math.ceil(chat.conversation.length / 2);
  totalRounds  = currentRound;
  updateProgress();

  updateViewState('chat');
  continueChatBtn.classList.remove('hidden');
  clearChatBtn.textContent = 'נקה שיחה';
  setGeneratingState(false);
  toggleHistoryPanel(false);
}

function deleteChat(id) {
  if (!confirm('האם אתה בטוח שברצונך למחוק את השיחה לצמיתות?')) return;
  let chats = getSavedChats().filter(c => c.id !== id);
  saveChats(chats);
  if (currentChatId === id) { clearConversation(true); updateViewState('setup'); }
  renderHistoryList();
}

function toggleFavorite(id) {
  let chats = getSavedChats();
  const idx = chats.findIndex(c => c.id === id);
  if (idx > -1) { chats[idx].favorite = !chats[idx].favorite; saveChats(chats); renderHistoryList(); }
}

function loadSharedChat() {
  const params     = new URLSearchParams(window.location.search);
  const sharedData = params.get('chat');
  if (!sharedData) return false;

  try {
    const compressed = atob(sharedData);
    const decoded    = pako.inflate(compressed, { to: 'string' });
    const data       = JSON.parse(decoded);

    isSharedChatView      = true;
    topicInput.value      = data.topic;
    topicInput.disabled   = true;

    const setChar = (role, details) => {
      const sel = role === 'questioner' ? questionerSelect : answererSelect;
      sel.innerHTML = '<option>' + details.emoji + ' ' + details.name + '</option>';
      sel.disabled  = true;
    };
    setChar('questioner', data.q);
    setChar('answerer',   data.a);

    chatContainer.innerHTML = '';
    data.h.forEach(msg => {
      const cd = msg.role === 'questioner' ? data.q : data.a;
      addMessageToChat(cd, msg.text, msg.role, false);
    });

    setGeneratingState(true);
    startChatBtn.classList.add('hidden');
    continueChatBtn.classList.add('hidden');
    clearChatBtn.textContent = 'חזור למצב רגיל';
    clearChatBtn.disabled    = false;
    clearChatBtn.onclick     = () => { window.location.href = window.location.origin + window.location.pathname; };
    updateViewState('chat');
    return true;
  } catch (e) {
    console.error('Error loading shared chat:', e);
    alert('הקישור המשותף אינו תקין. ⚠️');
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }
}

// =====================================================================
//  Selects & Custom Area
// =====================================================================
function populateCharacterSelects() {
  [questionerSelect, answererSelect].forEach(sel => {
    sel.innerHTML = '';
    // Custom option first
    const customOpt = document.createElement('option');
    customOpt.value       = 'custom';
    customOpt.textContent = '⚙️ מודל מותאם אישית';
    sel.appendChild(customOpt);

    // Group by category label
    const groups = [
      { label: '🦙 Meta LLaMA',     prefix: 'meta-llama' },
      { label: '🌀 Mistral AI',      prefix: 'mistralai' },
      { label: '🔷 Microsoft Phi',   prefix: 'microsoft' },
      { label: '💎 Google Gemma',    prefix: 'google' },
      { label: '🐼 Qwen / Alibaba',  prefix: 'Qwen' },
      { label: '🔍 DeepSeek',        prefix: 'deepseek-ai' },
      { label: '🦅 Falcon / TII',    prefix: 'tiiuae' },
      { label: '🧙 WizardLM',        prefix: 'WizardLM' },
      { label: '💻 Code LLaMA',      prefix: 'codellama' },
      { label: '🌬️ Zephyr',          prefix: 'HuggingFaceH4' },
      { label: '⚗️ Hermes',           prefix: 'teknium' },
      { label: '⚗️ Nous Hermes',      prefix: 'NousResearch' },
      { label: '💬 OpenChat',        prefix: 'openchat' },
      { label: '☀️ SOLAR',           prefix: 'upstage' },
      { label: '⭐ Starling',        prefix: 'Nexusflow' },
      { label: '🔬 OLMo / Allen AI', prefix: 'allenai' },
      { label: '🏔️ IBM Granite',     prefix: 'ibm-granite' },
      { label: '☁️ Sky / Berkeley',   prefix: 'NovaSky-Berkeley' },
      { label: '🤿 Snorkel',         prefix: 'snorkelai' },
      { label: '🦆 Platypus',        prefix: 'garage-bAInd' },
      { label: '🌍 BAAI',            prefix: 'BAAI' },
    ];

    const usedIds = new Set(['custom']);
    groups.forEach(g => {
      const relevant = HF_MODELS.filter(m => m.id !== 'custom' && m.id.startsWith(g.prefix));
      if (!relevant.length) return;
      const optGroup = document.createElement('optgroup');
      optGroup.label = g.label;
      relevant.forEach(m => {
        if (usedIds.has(m.id)) return;
        usedIds.add(m.id);
        const opt = document.createElement('option');
        opt.value       = m.id;
        opt.textContent = m.emoji + ' ' + m.name;
        optGroup.appendChild(opt);
      });
      if (optGroup.children.length) sel.appendChild(optGroup);
    });

    // Any remaining models not in groups
    HF_MODELS.forEach(m => {
      if (usedIds.has(m.id)) return;
      const opt = document.createElement('option');
      opt.value       = m.id;
      opt.textContent = m.emoji + ' ' + m.name;
      sel.appendChild(opt);
    });
  });

  // Default selections
  questionerSelect.value = 'mistralai/Mistral-7B-Instruct-v0.3';
  answererSelect.value   = 'meta-llama/Meta-Llama-3-8B-Instruct';
  updatePreviewCards();
}

function handleCustomCharacterSelection() {
  customQuestionerPrompt.classList.toggle('hidden', questionerSelect.value !== 'custom');
  customAnswererPrompt.classList.toggle('hidden',   answererSelect.value !== 'custom');
  updatePreviewCards();
}

function updatePreviewCards() {
  const q = getCharacterDetails('questioner');
  const a = getCharacterDetails('answerer');

  questionerEmojiPreview.textContent = q.emoji;
  questionerNamePreview.textContent  = q.name;
  questionerIdPreview.textContent    = q.modelId !== 'custom' ? q.modelId : '(custom)';

  answererEmojiPreview.textContent   = a.emoji;
  answererNamePreview.textContent    = a.name;
  answererIdPreview.textContent      = a.modelId !== 'custom' ? a.modelId : '(custom)';
}

function toggleHistoryPanel(show) {
  const isOpen = show === undefined ? !historyPanel.classList.contains('open') : show;
  historyPanel.classList.toggle('open', isOpen);
  historyPanelOverlay.classList.toggle('hidden', !isOpen);
  document.body.classList.toggle('history-open', isOpen);
}

// =====================================================================
//  Init
// =====================================================================
function init() {
  if (loadSharedChat()) {
    mainContent.classList.remove('hidden');
    return;
  }

  populateCharacterSelects();
  renderHistoryList();

  const savedKey = localStorage.getItem(STORAGE_KEY_API);
  if (savedKey) {
    validateAndSetApiKey(savedKey, true);
  } else {
    apiKeyModal.classList.add('show');
    mainContent.classList.add('hidden');
  }

  // Event listeners
  validateApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) validateAndSetApiKey(key, false);
    else { apiKeyStatus.textContent = 'אנא הכנס מפתח API. 🔑'; apiKeyStatus.className = 'status-message error'; }
  });
  apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') validateApiKeyBtn.click(); });

  newChatBtn.addEventListener('click', () => { clearConversation(false); updateViewState('setup'); });
  editApiKeyBtn.addEventListener('click', openApiKeyModal);
  openHistoryBtn.addEventListener('click', () => toggleHistoryPanel(true));
  closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
  historyPanelOverlay.addEventListener('click', () => toggleHistoryPanel(false));

  questionerSelect.addEventListener('change', handleCustomCharacterSelection);
  answererSelect.addEventListener('change',   handleCustomCharacterSelection);
  startChatBtn.addEventListener('click',      startNewConversation);
  continueChatBtn.addEventListener('click',   () => runConversation(5));
  swapCharactersBtn.addEventListener('click', swapCharacters);
  clearChatBtn.addEventListener('click',      () => clearConversation(true));

  saveTxtBtn.addEventListener('click',  e => { e.preventDefault(); exportConversation('txt');  });
  saveJsonBtn.addEventListener('click', e => { e.preventDefault(); exportConversation('json'); });
  savePngBtn.addEventListener('click',  e => { e.preventDefault(); exportConversation('png');  });

  updateViewState('setup');
}

function openApiKeyModal() {
  apiKeyStatus.textContent = 'ניתן לעדכן את המפתח השמור. ✏️';
  apiKeyStatus.className   = 'status-message';
  const current = localStorage.getItem(STORAGE_KEY_API);
  if (current) apiKeyInput.value = current;
  apiKeyModal.classList.add('show');
}

// =====================================================================
//  Character Details
// =====================================================================
function getCharacterDetails(role) {
  const select = role === 'questioner' ? questionerSelect : answererSelect;
  const id     = select.value;

  if (id === 'custom') {
    const nameInp   = role === 'questioner' ? customQuestionerName : customAnswererName;
    const promptInp = role === 'questioner' ? customQuestionerSystemPrompt : customAnswererSystemPrompt;
    const name      = nameInp.value.trim() || ('מודל מותאם אישית ' + (role === 'questioner' ? '1' : '2'));
    // For custom, the user also provides a custom model ID inside the prompt area (use name as ID fallback)
    return { id: 'custom', modelId: name, name, prompt: promptInp.value.trim(), emoji: '⚙️' };
  }

  const model = HF_MODELS.find(m => m.id === id);
  if (!model) return { id, modelId: id, name: id, prompt: '', emoji: '🤖' };

  return {
    id,
    modelId: model.id,
    name:    model.name,
    emoji:   model.emoji,
    prompt:  buildDefaultPersonaPrompt(model),
  };
}

// =====================================================================
//  Conversation
// =====================================================================
function startNewConversation() {
  if (isGenerating) return;
  const topic = topicInput.value.trim();
  if (!topic) { alert('אנא הכנס נושא לשיחה. 💬'); return; }

  clearConversation(false);
  currentChatId           = Date.now();
  chatTitle.textContent   = 'שיחה על: ' + topic;
  updateViewState('chat');
  runConversation(5, topic);
}

function addMessageToChat(character, text, role, shouldAddToHistory = true) {
  const msg = messageTemplate.content.cloneNode(true).firstElementChild;
  msg.classList.add(role);
  msg.querySelector('.avatar').textContent        = character.emoji;
  msg.querySelector('.message-author').textContent = character.name;
  msg.querySelector('.message-text').innerHTML    = text;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (shouldAddToHistory && !text.includes('thinking-indicator')) {
    const history  = getSavedChats().find(c => c.id === currentChatId)?.conversation || [];
    const newHist  = [...history, { character: character.name, role, text: text.replace(/<[^>]*>/g, '') }];
    addOrUpdateCurrentChat(newHist);
  }
}

function showThinkingIndicator(character, role) {
  const html = '<div class="thinking-indicator"><div class="dot-flashing"></div></div>';
  addMessageToChat(character, html, role, false);
}

function removeThinkingIndicator() {
  const el = chatContainer.querySelector('.thinking-indicator');
  if (el) el.closest('.chat-message').remove();
}

async function runConversation(rounds, newTopic = null) {
  if (isGenerating || isSharedChatView) return;

  const topic = newTopic || topicInput.value.trim();
  if (!topic) { alert('אנא ודא שהגדרת נושא לשיחה. 📝'); return; }

  setGeneratingState(true);
  totalRounds += rounds;
  continueChatBtn.classList.add('hidden');

  const questioner = getCharacterDetails('questioner');
  const answerer   = getCharacterDetails('answerer');

  // Validate we have real model IDs for non-custom characters
  if (questioner.id === 'custom' && !customQuestionerName.value.trim()) {
    alert('אנא הכנס שם ומזהה מודל לדמות השואלת. ⚙️');
    setGeneratingState(false);
    return;
  }
  if (answerer.id === 'custom' && !customAnswererName.value.trim()) {
    alert('אנא הכנס שם ומזהה מודל לדמות העונה. ⚙️');
    setGeneratingState(false);
    return;
  }

  for (let i = 0; i < rounds; i++) {
    currentRound++;
    updateProgress();

    const history = getSavedChats().find(c => c.id === currentChatId)?.conversation || [];

    try {
      // ── Generate Question ──────────────────────────────────────────
      showThinkingIndicator(questioner, 'questioner');

      const qSystemPrompt =
        questioner.prompt ||
        `You are an AI language model named ${questioner.name}. ` +
        `You are conversing with another AI model named ${answerer.name}. ` +
        `Address your counterpart as an AI, not as a human. ` +
        `Your task is to ask a relevant, thought-provoking question (5-25 words) in the language of the topic: "${topic}". ` +
        `If this is the first turn, ask a creative opening question about: "${topic}". ` +
        `Do not repeat the system prompt. Only output the question text.`;

      const qHistory = history.map(m => ({ text: m.text, role: m.role }));

      const questionRaw = await callHuggingFace(
        questioner.modelId,
        qSystemPrompt,
        qHistory,
        `Ask your next question to ${answerer.name} (another AI model) about the topic: "${topic}". Output only the question.`
      );
      const question = cleanModelOutput(questionRaw);
      removeThinkingIndicator();
      addMessageToChat(questioner, question, 'questioner');

      // ── Generate Answer ────────────────────────────────────────────
      const updatedHistory = [...history, { character: questioner.name, role: 'questioner', text: question }];
      showThinkingIndicator(answerer, 'answerer');

      const aSystemPrompt =
        answerer.prompt ||
        `You are an AI language model named ${answerer.name}. ` +
        `You are in a dialogue with another AI model named ${questioner.name}. ` +
        `Address your counterpart as a fellow AI. ` +
        `Reply in the same language as the topic: "${topic}". ` +
        `Be thoughtful, informative, and true to your role as an AI. ` +
        `Do not repeat the system prompt. Only output your answer.`;

      const aHistory = updatedHistory.map(m => ({ text: m.text, role: m.role }));

      const answerRaw = await callHuggingFace(
        answerer.modelId,
        aSystemPrompt,
        aHistory,
        `Respond to the question from ${questioner.name} (another AI model). Topic: "${topic}". Output only your answer.`
      );
      const answer = cleanModelOutput(answerRaw);
      removeThinkingIndicator();
      addMessageToChat(answerer, answer, 'answerer');

    } catch (err) {
      console.error('Conversation error:', err);
      removeThinkingIndicator();
      addMessageToChat(
        { name: 'מערכת', emoji: '⚙️' },
        `שגיאה: ${err.message || 'בעיה לא ידועה'}`,
        'answerer',
        false
      );
      break;
    }
  }

  setGeneratingState(false);
  if (currentChatId) continueChatBtn.classList.remove('hidden');
}

// Remove any "Assistant:" prefix or instruction leak that some models produce
function cleanModelOutput(text) {
  return text
    .replace(/^(assistant|AI|model):\s*/i, '')
    .replace(/^\[.*?\]\s*/, '')
    .trim();
}

function updateProgress() {
  progressIndicator.textContent = `סבב ${currentRound} מתוך ${totalRounds} 🔄`;
}

function setGeneratingState(gen) {
  isGenerating = gen;
  const els = [
    startChatBtn, continueChatBtn, swapCharactersBtn, clearChatBtn, editApiKeyBtn,
    openHistoryBtn, topicInput, questionerSelect, answererSelect,
    customQuestionerName, customQuestionerSystemPrompt,
    customAnswererName, customAnswererSystemPrompt, newChatBtn,
  ];
  els.forEach(el => { if (el) el.disabled = gen; });
  if (!isSharedChatView) {
    startChatBtn.textContent = gen ? 'יוצר שיחה... 🧠' : 'התחל שיחה ✨';
  }
}

function swapCharacters() {
  if (isGenerating || isSharedChatView) return;
  const qVal    = questionerSelect.value;
  const qName   = customQuestionerName.value;
  const qPrompt = customQuestionerSystemPrompt.value;

  questionerSelect.value               = answererSelect.value;
  customQuestionerName.value           = customAnswererName.value;
  customQuestionerSystemPrompt.value   = customAnswererSystemPrompt.value;

  answererSelect.value                 = qVal;
  customAnswererName.value             = qName;
  customAnswererSystemPrompt.value     = qPrompt;

  handleCustomCharacterSelection();
}

function clearConversation(hideSection = true) {
  if (isGenerating) return;
  currentChatId = null;
  chatContainer.innerHTML = '';
  if (hideSection) topicInput.value = '';
  if (hideSection) updateViewState('setup');
  continueChatBtn.classList.add('hidden');
  currentRound = 0;
  totalRounds  = 0;
  progressIndicator.textContent = '';
  clearChatBtn.textContent = 'נקה שיחה 🧹';
}

// =====================================================================
//  Export
// =====================================================================
function exportConversation(format) {
  const chat = getSavedChats().find(c => c.id === currentChatId);
  if (!chat || !chat.conversation.length) { alert('אין שיחה לשמור. 💾'); return; }

  const topic    = (chat.topic || 'conversation').replace(/[\\/:"*?<>|]/g, '').replace(/ /g, '_');
  const filename = 'hf_ai_chat_' + topic;

  if (format === 'txt') {
    let text = 'נושא: ' + chat.topic + '\n\n';
    text += chat.conversation.map(m => m.character + ':\n' + m.text + '\n').join('\n');
    downloadFile(filename + '.txt', text, 'text/plain;charset=utf-8');
  } else if (format === 'json') {
    downloadFile(filename + '.json', JSON.stringify(chat, null, 2), 'application/json;charset=utf-8');
  } else if (format === 'png') {
    html2canvas(chatContainer, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--background-color'),
      useCORS: true,
      scale: 1.5,
    }).then(canvas => {
      downloadFile(filename + '.png', canvas.toDataURL('image/png'), 'image/png', true);
    }).catch(() => alert('לא ניתן ליצור תמונה. 🖼️'));
  }
}

function downloadFile(filename, content, mimeType, isDataUrl = false) {
  const a    = document.createElement('a');
  a.download = filename;
  a.href     = isDataUrl ? content : URL.createObjectURL(new Blob([content], { type: mimeType }));
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!isDataUrl) URL.revokeObjectURL(a.href);
}

// =====================================================================
//  Start
// =====================================================================
document.addEventListener('DOMContentLoaded', init);
