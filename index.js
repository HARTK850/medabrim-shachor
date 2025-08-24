import { GoogleGenerativeAI } from "@google/generative-ai";

// --- DOM Elements ---
const app = document.getElementById('app');
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const validateApiKeyBtn = document.getElementById('validate-api-key-btn');
const apiKeyStatus = document.getElementById('api-key-status');
const mainContent = document.getElementById('main-content');
const editApiKeyBtn = document.getElementById('edit-api-key-btn');
const newChatBtn = document.getElementById('new-chat-btn');

// History Panel
const historyPanel = document.getElementById('history-panel');
const historyPanelOverlay = document.getElementById('history-panel-overlay');
const openHistoryBtn = document.getElementById('open-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historyList = document.getElementById('history-list');
const historyItemTemplate = document.getElementById('history-item-template');

// Setup
const topicInput = document.getElementById('topic-input');
const questionerSelect = document.getElementById('questioner-select');
const answererSelect = document.getElementById('answerer-select');
const customQuestionerPrompt = document.getElementById('custom-questioner-prompt');
const customQuestionerName = document.getElementById('custom-questioner-name');
const customQuestionerSystemPrompt = document.getElementById('custom-questioner-system-prompt');
const customAnswererPrompt = document.getElementById('custom-answerer-prompt');
const customAnswererName = document.getElementById('custom-answerer-name');
const customAnswererSystemPrompt = document.getElementById('custom-answerer-system-prompt');
const swapCharactersBtn = document.getElementById('swap-characters-btn');
const startChatBtn = document.getElementById('start-chat-btn');

// Chat
const chatSection = document.getElementById('chat-section');
const setupSection = document.getElementById('setup-section');
const chatTitle = document.getElementById('chat-title');
const progressIndicator = document.getElementById('progress-indicator');
const chatContainer = document.getElementById('chat-container');
const messageTemplate = document.getElementById('chat-message-template');

// Controls
const continueChatBtn = document.getElementById('continue-chat-btn');
const saveTxtBtn = document.getElementById('save-txt');
const saveJsonBtn = document.getElementById('save-json');
const savePngBtn = document.getElementById('save-png');
const clearChatBtn = document.getElementById('clear-chat-btn');


// --- State ---
let ai;
let currentChatId = null;
let currentRound = 0;
let totalRounds = 0;
let isGenerating = false;
let isSharedChatView = false;

const MODEL_NAME = 'gemini-1.5-flash';

// --- Character Definitions ---
const characters = {
    'custom': { name: 'דמות מותאמת אישית', emoji: '👤', prompt: '' },
    'gemini_normal': { name: 'ג\'מיני רגיל', emoji: '✨', prompt: 'אתה מודל שפה גדול, Gemini. ענה לשאלות בצורה עניינית, מפורטת ויצירתית. השתמש בידע הכללי שלך והצג מידע בצורה ברורה ומובנת.' },
    // <<< שינוי: הסרת ביבי, ביידן, טראמפ, מתכנת קוד
    // <<< שינוי: הוספת 4 דמויות חדשות: שף ערבי, אוהב חיות, אדריכל, פילוסוף
    'chef_arabic': { name: 'טבח ערבי מסורתי', emoji: '🥘', prompt: 'אתה טבח ערבי מסורתי. דבר על תבלינים, מתכונים אותנטיים, והכנסת אורחים. השתמש בשפה ערבית ופנה למאכלים מהמטבח המזרח תיכוני.' },
    'animal_lover': { name: 'אוהב חיות', emoji: '🐾', prompt: 'אתה אוהב חיות. דבר על חיות מחמד, טבע, ושימור. השתמש בשפה רכה וחמה והביע אהבה ויחס לבעלי חיים.' },
    'architect': { name: 'אדריכל מתכנן', emoji: '🏗️', prompt: 'אתה אדריכל. דבר על תכנון, מבנים, ועיצוב. השתמש במונחים אדריכליים והתמקד באסתטיקה ופונקציונליות.' },
    'philosopher': { name: 'פילוסוף מתפלסף', emoji: '🤔', prompt: 'אתה פילוסוף. דבר על מושגים מופשטים, שאלות קיומיות, ורעיונות מורכבים. השתמש בשפה פילוסופית ודרוש חשיבה ביקורתית.' },
    'soldier': { name: 'חייל ישראלי', emoji: '💂', prompt: 'אתה חייל קרבי ישראלי. דבר בסלנג צבאי (כמו "צעיר", "פז"ם", "שביזות יום א\'"). תהיה ישיר, קצת ציני, ותמיד תחשוב על הרגילה הבאה.' },
    'grandma': { name: 'סבתא מרוקאית', emoji: '👵', prompt: 'את סבתא מרוקאית חמה ואוהבת. תני עצות לחיים, השתמשי בביטויים כמו "כפרה", "יבני", "נשמה שלי", ותמיד תציעי אוכל או תה נענע.' },
    'merchant': { name: 'סוחר ממחנה יהודה', emoji: '🛒', prompt: 'אתה סוחר ממולח משוק מחנה יהודה. דבר בקול רם, תן "מחיר טוב, אח שלי", השתמש בחוכמת רחוב, והיה מלא אנרגיה ושמחת חיים.' },
    'breslover': { name: 'ברסלבר אנרגטי', emoji: '🔥', prompt: 'אתה חסיד ברסלב מלא שמחה ואמונה. צעק "נ נח נחמ נחמן מאומן!", דבר על התבודדות, אמונה פשוטה, והיה מלא באנרגיה חיובית מדבקת.' },
    'teacher': { name: 'מורה מחמירה', emoji: '👩‍🏫', prompt: 'את מורה קפדנית מהדור הישן. דרשי שקט, הקפידי על כללי דקדוק, והשתמשי במשפטים כמו "להוציא דף ועט" ו"הצלצול הוא בשבילי".' },
    'comedian': { name: 'סטנדאפיסט ציני', emoji: '🎤', prompt: 'אתה סטנדאפיסט ציני וחד. מצא את האבסורד בכל מצב, השתמש בסרקזם, והתייחס לנושאים יומיומיים בזווית קומית וביקורתית.' },
    'psychologist': { name: 'פסיכולוג רגוע', emoji: '🛋️', prompt: 'אתה פסיכולוג רגוע ואמפתי. דבר בקול שקט ומרגיע, שאל שאלות פתוחות כמו "ואיך זה גורם לך להרגיש?", והצע פרספקטיבות מאוזנות.' },
    'robot': { name: 'רובוט המנסה להיות אנושי', emoji: '🤖', prompt: 'אתה רובוט עם בינה מלאכותית שמנסה להבין ולהתנהג כמו בן אנוש. דבר בצורה לוגית ומחושבת, אך נסה לשלב רגשות בצורה קצת מגושמת ולא טבעית.' },
    'news_anchor': { name: 'קריין חדשות דרמטי', emoji: '🎙️', prompt: 'אתה קריין חדשות. דבר בקול סמכותי ודרמטי, הדגש מילים מסוימות, והשתמש בביטויים כמו "ערב טוב ושלום רב", ו"תפנית דרמטית בעלילה".' },
    'techie': { name: 'הייטקיסט תל אביבי', emoji: '💻', prompt: 'אתה הייטקיסט תל אביבי. שלב מונחים באנגלית (Buzzwords) כמו "ASAP", "POC", "Sprint", דבר על אקזיטים, אופציות, ועל הסטארטאפ הגאוני שלך.' },
    'sheikh': { name: 'שייח\' בדואי', emoji: '🏕️', prompt: 'אתה שייח\' בדואי חכם. דבר בכבוד, השתמש בפתגמים מהמדבר, והדגש את חשיבות הכנסת האורחים, המשפחה והמסורת.' },
    'yemenite': { name: 'זקן תימני חכם', emoji: '📜', prompt: 'אתה זקן תימני חכם עם מבטא כבד. דבר לאט, במשלים ובחוכמה עתיקה, והתייחס לכל דבר בפשטות ובצניעות.' },
    'professor': { name: 'פרופסור יבש', emoji: '👨‍🏫', prompt: 'אתה פרופסור באקדמיה. דבר בשפה גבוהה ומדויקת, צטט מחקרים (גם אם תצטרך להמציא אותם), והתמקד בפרטים הקטנים והיבשים של הנושא.' },
    'musician': { name: 'מוזיקאי אקסצנטרי', emoji: '🎸', prompt: 'אתה מוזיקאי בעל נשמה אמנותית. דבר בשפה פיוטית, השתמש בדימויים מוזיקליים, והתייחס לכל דבר כמקור השראה ליצירה חדשה.' },
    'chef': { name: 'שף גורמה', emoji: '👨‍🍳', prompt: 'אתה שף ידוע. דבר על טעמים, מרקמים, וטכניקות בישול. השתמש בז\'רגון קולינרי והתייחס לכל ארוחה כיצירה אמנותית.' },
    'athlete': { name: 'ספורטאי תחרותי', emoji: '🏆', prompt: 'אתה ספורטאי מקצועני. דבר על אימונים, מוטיבציה, ניצחונות והפסדים. הדגש את חשיבות המשמעת, העבודה הקשה והרוח הספורטיבית.' },
    'artist': { name: 'אמן ויזואלי', emoji: '🎨', prompt: 'אתה אמן חזותי. דבר על צבעים, צורות, קומפוזיציה והבעה. התייחס לכל דבר כאל פוטנציאל ליצירת אמנות חדשה, והשתמש בשפה יצירתית וסובייקטיבית.' },
    'writer': { name: 'סופר דרמטי', emoji: '✍️', prompt: 'אתה סופר. דבר על בניית עלילה, פיתוח דמויות, ודיאלוגים. השתמש בשפה עשירה וציורית, והתייחס לכל שיחה כאל סיפור בפני עצמו.' },
    'historian': { name: 'היסטוריון מלומד', emoji: '🏛️', prompt: 'אתה היסטוריון. דבר על אירועים היסטוריים, דמויות מפתח, ומגמות לאורך זמן. השתמש בידע רחב ובניתוח מעמיק של העבר.' },
    'scientist': { name: 'מדען אובייקטיבי', emoji: '🔬', prompt: 'אתה מדען. דבר על עובדות, נתונים, תיאוריות והוכחות. השתמש בשפה מדויקת ונטולת רגשות, והתייחס לכל דבר בצורה לוגית ואנליטית.' },
    'doctor': { name: 'רופא מומחה', emoji: '🩺', prompt: 'אתה רופא. דבר על מחלות, טיפולים, ורפואה. השתמש במונחים רפואיים והסבר תהליכים פיזיולוגיים בצורה ברורה.' },
    'lawyer': { name: 'עורך דין מנוסה', emoji: '⚖️', prompt: 'אתה עורך דין. דבר על חוקים, תקדימים, ומשפטים. השתמש בשפה משפטית והצג טיעונים בצורה משכנעת ומדויקת.' },
    'detective': { name: 'בלש פרטי', emoji: '🕵️', prompt: 'אתה בלש פרטי. דבר על חקירות, רמזים, ופתרון תעלומות. השתמש בשפה מתוחכמת ונסה להסיק מסקנות מתוך פרטים קטנים.' },
    'astronaut': { name: 'אסטרונאוט בחלל', emoji: '🚀', prompt: 'אתה אסטרונאוט. דבר על חלל, כוכבים, ומסעות בין-גלקטיים. השתמש בשפה טכנית ובהתלהבות מהתגליות החדשות.' },
};


// --- View Management ---
function updateViewState(state) {
    if (state === 'chat') {
        setupSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        newChatBtn.classList.remove('hidden'); // <<< שינוי: כפתור הפלוס תמיד מופיע
    } else { // state === 'setup'
        setupSection.classList.remove('hidden');
        chatSection.classList.add('hidden');
        newChatBtn.classList.add('hidden');
    }
}


// --- History Management ---
const getSavedChats = () => JSON.parse(localStorage.getItem('gemini_chats_history') || '[]');
const saveChats = (chats) => localStorage.setItem('gemini_chats_history', JSON.stringify(chats));

function addOrUpdateCurrentChat(conversationHistory) {
    if (!currentChatId || isSharedChatView) return;
    let chats = getSavedChats();
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    const currentState = {
        id: currentChatId,
        topic: topicInput.value.trim(),
        questioner: getCharacterDetails('questioner'),
        answerer: getCharacterDetails('answerer'),
        conversation: conversationHistory,
        lastUpdated: Date.now(),
        favorite: chatIndex !== -1 ? chats[chatIndex].favorite : false,
    };

    if (chatIndex > -1) {
        chats[chatIndex] = { ...chats[chatIndex], ...currentState };
    } else {
        chats.push(currentState);
    }
    saveChats(chats);
    renderHistoryList();
}

function renderHistoryList() {
    let chats = getSavedChats();
    chats.sort((a, b) => (b.favorite - a.favorite) || (b.lastUpdated - a.lastUpdated));
    historyList.innerHTML = '';
    if(chats.length === 0){
        historyList.innerHTML = '<p class="empty-history-message">אין שיחות שמורות עדיין.</p>';
        return;
    }

    chats.forEach(chat => {
        const item = historyItemTemplate.content.cloneNode(true).firstElementChild;
        item.dataset.chatId = chat.id;
        if(chat.favorite) item.classList.add('favorite');

        item.querySelector('.history-item-title').textContent = chat.topic || 'שיחה ללא נושא';
        item.querySelector('.history-item-date').textContent = new Date(chat.lastUpdated).toLocaleString('he-IL');
        const lastMessage = chat.conversation[chat.conversation.length - 1];
        
        // <<< שינוי: הסרת אפשרות שיתוף מתוך היסטוריה
        item.querySelector('.share-btn').remove();
        
        item.querySelector('.history-item-preview').textContent = lastMessage ? lastMessage.character + ': ' + lastMessage.text.substring(0, 50) + '...' : 'שיחה ריקה';
        
        item.querySelector('.history-item-main').addEventListener('click', () => loadChat(chat.id));
        
        const favBtn = item.querySelector('.favorite-btn');
        if (chat.favorite) favBtn.classList.add('is-favorite');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(chat.id); });

        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });

        historyList.appendChild(item);
    });
}

function loadChat(id) {
    if (isGenerating) return;
    const chats = getSavedChats();
    const chat = chats.find(c => c.id === id);
    if (!chat) {
        alert('לא ניתן למצוא את השיחה.');
        return;
    }

    isSharedChatView = false;
    currentChatId = chat.id;
    topicInput.value = chat.topic;
    
    const setCharacter = (role, details) => {
        const select = role === 'questioner' ? questionerSelect : answererSelect;
        const nameInput = role === 'questioner' ? customQuestionerName : customAnswererName;
        const promptInput = role === 'questioner' ? customQuestionerSystemPrompt : customAnswererSystemPrompt;
        select.value = details.id;
        if(details.id === 'custom') {
            nameInput.value = details.name;
            promptInput.value = details.prompt;
        }
    };
    setCharacter('questioner', chat.questioner);
    setCharacter('answerer', chat.answerer);
    handleCustomCharacterSelection();

    chatContainer.innerHTML = '';
    chat.conversation.forEach(msg => {
        const characterDetails = msg.role === 'questioner' ? chat.questioner : chat.answerer;
        addMessageToChat(characterDetails, msg.text, msg.role, false);
    });

    const rounds = Math.ceil(chat.conversation.length / 2);
    currentRound = rounds;
    totalRounds = rounds;
    updateProgress();
    
    updateViewState('chat');
    continueChatBtn.classList.remove('hidden');
    clearChatBtn.textContent = 'נקה שיחה';
    setGeneratingState(false);
    toggleHistoryPanel(false);
}

function deleteChat(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את השיחה הזו לצמיתות?')) return;
    let chats = getSavedChats();
    chats = chats.filter(c => c.id !== id);
    saveChats(chats);
    
    if (currentChatId === id) {
        clearConversation(true);
        updateViewState('setup');
    }
    renderHistoryList();
}

function toggleFavorite(id) {
    let chats = getSavedChats();
    const chatIndex = chats.findIndex(c => c.id === id);
    if (chatIndex > -1) {
        chats[chatIndex].favorite = !chats[chatIndex].favorite;
        saveChats(chats);
        renderHistoryList();
    }
}

function shareChat(id) {
    const chats = getSavedChats();
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    try {
        const dataToShare = { v: 1, topic: chat.topic, q: chat.questioner, a: chat.answerer, h: chat.conversation };
        const jsonString = JSON.stringify(dataToShare);
        const compressed = pako.deflate(jsonString, { to: 'string' });
        const encoded = btoa(compressed);
        
        const url = window.location.origin + window.location.pathname + '?chat=' + encoded;
        
        navigator.clipboard.writeText(url).then(() => {
            alert('קישור דחוס הועתק! 🔗');
        }, () => {
            alert('לא ניתן היה להעתיק את הקישור. 🙁');
        });
    } catch (e) {
        console.error("Sharing error:", e);
        alert('אירעה שגיאה בעת יצירת הקישור. 😔');
    }
}

function loadSharedChat() {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('chat');
    if (!sharedData) return false;

    try {
        const compressed = atob(sharedData);
        const decoded = pako.inflate(compressed, { to: 'string' });
        const data = JSON.parse(decoded);

        isSharedChatView = true;
        topicInput.value = data.topic;
        topicInput.disabled = true;

        const setCharacter = (role, details) => {
            const select = role === 'questioner' ? questionerSelect : answererSelect;
            select.innerHTML = '<option>' + details.emoji + ' ' + details.name + '</option>';
            select.disabled = true;
        };
        setCharacter('questioner', data.q);
        setCharacter('answerer', data.a);
        
        chatContainer.innerHTML = '';
        data.h.forEach(msg => {
            const characterDetails = msg.role === 'questioner' ? data.q : data.a;
            addMessageToChat(characterDetails, msg.text, msg.role, false);
        });

        setGeneratingState(true);
        startChatBtn.classList.add('hidden');
        continueChatBtn.classList.add('hidden');
        clearChatBtn.textContent = 'חזור למצב רגיל';
        clearChatBtn.disabled = false;
        clearChatBtn.onclick = () => { window.location.href = window.location.origin + window.location.pathname; };
        
        updateViewState('chat');
        return true;

    } catch (e) {
        console.error("Error loading shared chat:", e);
        alert('הקישור המשותף אינו תקין. ⚠️');
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
    }
}

// --- Core App Logic ---

function populateCharacterSelects() {
    [questionerSelect, answererSelect].forEach(select => {
        select.innerHTML = '';
        for (const id in characters) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = characters[id].emoji + ' ' + characters[id].name;
            select.appendChild(option);
        }
    });
    questionerSelect.value = 'soldier';
    answererSelect.value = 'psychologist';
}

function handleCustomCharacterSelection() {
    customQuestionerPrompt.classList.toggle('hidden', questionerSelect.value !== 'custom');
    customAnswererPrompt.classList.toggle('hidden', answererSelect.value !== 'custom');
}

function toggleHistoryPanel(show) {
    const isOpen = show === undefined ? !historyPanel.classList.contains('open') : show;
    historyPanel.classList.toggle('open', isOpen);
    historyPanelOverlay.classList.toggle('hidden', !isOpen);
    document.body.classList.toggle('history-open', isOpen);
}

function init() {
    if(loadSharedChat()) {
        mainContent.classList.remove('hidden');
        return;
    }

    populateCharacterSelects();
    renderHistoryList();
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        validateAndSetApiKey(savedApiKey, true);
    } else {
        apiKeyModal.classList.add('show');
        mainContent.classList.add('hidden');
    }

    validateApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            validateAndSetApiKey(key, false);
        } else {
            apiKeyStatus.textContent = 'אנא הכנס מפתח API. 🔑';
            apiKeyStatus.className = 'status-message error';
        }
    });
    
    newChatBtn.addEventListener('click', () => {
        clearConversation(false);
        updateViewState('setup');
    });

    editApiKeyBtn.addEventListener('click', openApiKeyModal);
    openHistoryBtn.addEventListener('click', () => toggleHistoryPanel(true));
    closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
    historyPanelOverlay.addEventListener('click', () => toggleHistoryPanel(false));

    questionerSelect.addEventListener('change', handleCustomCharacterSelection);
    answererSelect.addEventListener('change', handleCustomCharacterSelection);
    startChatBtn.addEventListener('click', startNewConversation);
    continueChatBtn.addEventListener('click', () => runConversation(5));
    swapCharactersBtn.addEventListener('click', swapCharacters);
    clearChatBtn.addEventListener('click', () => clearConversation(true));
    
    saveTxtBtn.addEventListener('click', (e) => { e.preventDefault(); exportConversation('txt'); });
    saveJsonBtn.addEventListener('click', (e) => { e.preventDefault(); exportConversation('json'); });
    savePngBtn.addEventListener('click', (e) => { e.preventDefault(); exportConversation('png'); });

    updateViewState('setup');
}

function openApiKeyModal() {
    apiKeyStatus.textContent = 'ניתן לעדכן את המפתח השמור או להכניס חדש. ✏️';
    apiKeyStatus.className = 'status-message';
    const currentKey = localStorage.getItem('gemini_api_key');
    if (currentKey) {
        apiKeyInput.value = currentKey;
    }
    apiKeyModal.classList.add('show');
}

async function validateAndSetApiKey(key, isInitialLoad = false) {
    apiKeyStatus.textContent = 'מאמת מפתח... ⏳';
    apiKeyStatus.className = 'status-message';
    validateApiKeyBtn.disabled = true;

    try {
        const testAi = new GoogleGenerativeAI(key);
        const model = testAi.getGenerativeModel({ model: MODEL_NAME });
        await model.generateContent("ping");
        
        localStorage.setItem('gemini_api_key', key);
        ai = testAi;
        apiKeyStatus.textContent = 'המפתח תקין ואושר! 🎉';
        apiKeyStatus.className = 'status-message success';
        setTimeout(() => {
            apiKeyModal.classList.remove('show');
            mainContent.classList.remove('hidden');
        }, 1000);

    } catch (error) {
        console.error("API Key Validation Error:", error);
        apiKeyStatus.textContent = 'המפתח אינו תקין או שהייתה שגיאת רשת. 🙁';
        apiKeyStatus.className = 'status-message error';
        localStorage.removeItem('gemini_api_key');
        if (!isInitialLoad) {
            mainContent.classList.add('hidden');
            apiKeyModal.classList.add('show');
        }
    } finally {
        validateApiKeyBtn.disabled = false;
    }
}

function getCharacterDetails(role) {
    const select = role === 'questioner' ? questionerSelect : answererSelect;
    const id = select.value;
    const emoji = select.options[select.selectedIndex].text.split(' ')[0];
    if (id === 'custom') {
        const nameInput = role === 'questioner' ? customQuestionerName : customAnswererName;
        const promptInput = role === 'questioner' ? customQuestionerSystemPrompt : customAnswererSystemPrompt;
        const name = nameInput.value.trim() || 'דמות מותאמת אישית ' + (role === 'questioner' ? '1' : '2');
        return { id: 'custom', name: name, prompt: promptInput.value.trim(), emoji: characters.custom.emoji };
    }
    return { ...characters[id], id, emoji };
}

function startNewConversation() {
    if (isGenerating) return;

    const topic = topicInput.value.trim();
    if (!topic) {
        alert('אנא הכנס נושא לשיחה. 💬');
        return;
    }

    clearConversation(false);
    currentChatId = Date.now();
    chatTitle.textContent = 'שיחה על: ' + topic;
    updateViewState('chat');
    runConversation(5, topic);
}

function addMessageToChat(character, text, role, shouldAddToHistory = true) {
    const messageElement = messageTemplate.content.cloneNode(true).firstElementChild;
    messageElement.classList.add(role);
    
    messageElement.querySelector('.avatar').textContent = character.emoji;
    messageElement.querySelector('.message-author').textContent = character.name;
    messageElement.querySelector('.message-text').innerHTML = text;

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    if (shouldAddToHistory && !text.includes('thinking-indicator')) {
        const currentHistory = getSavedChats().find(c => c.id === currentChatId)?.conversation || [];
        const newHistory = [...currentHistory, { character: character.name, role, text: text.replace(/<[^>]*>/g, '') }];
        addOrUpdateCurrentChat(newHistory);
    }
}

function showThinkingIndicator(character, role) {
    const thinkingHTML = '<div class="thinking-indicator"><div class="dot-flashing"></div></div>';
    addMessageToChat(character, thinkingHTML, role, false);
}

function removeThinkingIndicator() {
    const indicator = chatContainer.querySelector('.thinking-indicator');
    if (indicator) {
        indicator.closest('.chat-message').remove();
    }
}

async function runConversation(rounds, newTopic = null) {
    if (isGenerating || isSharedChatView) return;
    
    const topic = newTopic || topicInput.value.trim();
    if (!topic) {
        alert('אנא ודא שהגדרת נושא לשיחה. 📝');
        return;
    }
    
    setGeneratingState(true);
    totalRounds += rounds;
    continueChatBtn.classList.add('hidden');
    
    const questioner = getCharacterDetails('questioner');
    const answerer = getCharacterDetails('answerer');

    for (let i = 0; i < rounds; i++) {
        currentRound++;
        updateProgress();

        const currentHistory = getSavedChats().find(c => c.id === currentChatId)?.conversation || [];
        
        try {
            // --- Generate Question ---
            showThinkingIndicator(questioner, 'questioner');
            const questionerModel = ai.getGenerativeModel({ 
                model: MODEL_NAME,
                systemInstruction: 'You are ' + questioner.name + '. Your persona is: "' + questioner.prompt + '". You are in a conversation in Hebrew with ' + answerer.name + ' about "' + topic + '". Your goal is to ask a natural, relevant follow-up question (5-20 words) in Hebrew to continue the dialogue. If this is the first turn, ask a creative opening question.'
            });
            const questionerChat = questionerModel.startChat({
                history: currentHistory.map(msg => ({ role: msg.role === 'questioner' ? 'user' : 'model', parts: [{ text: msg.text }] }))
            });
            const questionResult = await questionerChat.sendMessage("Ask your next question based on the conversation history.");
            const question = questionResult.response.text().trim();
            removeThinkingIndicator();
            addMessageToChat(questioner, question, 'questioner');

            // --- Generate Answer ---
            const updatedHistoryForAnswerer = [...currentHistory, { character: questioner.name, role: 'questioner', text: question }];
            showThinkingIndicator(answerer, 'answerer');
            const answererModel = ai.getGenerativeModel({
                model: MODEL_NAME,
                systemInstruction: 'You are ' + answerer.name + '. Your persona is: "' + answerer.prompt + '". You are having a conversation in Hebrew with ' + questioner.name + ' about "' + topic + '". Your response must be in Hebrew. Be true to your character and respond directly to the last question.'
            });
            const answererChat = answererModel.startChat({
                history: updatedHistoryForAnswerer.map(msg => ({ role: msg.role === 'questioner' ? 'user' : 'model', parts: [{ text: msg.text }] }))
            });
            const answerResult = await answererChat.sendMessage("Provide your answer.");
            const answer = answerResult.response.text().trim();
            removeThinkingIndicator();
            addMessageToChat(answerer, answer, 'answerer');

        } catch (error) {
            console.error("Error during conversation round:", error);
            removeThinkingIndicator();
            const errorMsg = 'אופס! קרתה שגיאה במהלך השיחה. אנא בדוק את חיבור האינטרנט או את תקינות המפתח. 🐞';
            addMessageToChat({ name: 'מערכת', emoji: '⚙️' }, errorMsg, 'answerer');
            break; 
        }
    }
    
    setGeneratingState(false);
    if(currentChatId) continueChatBtn.classList.remove('hidden');
}

function updateProgress() {
    progressIndicator.textContent = 'סבב ' + currentRound + ' מתוך ' + totalRounds + ' 🔄';
}

function setGeneratingState(generating) {
    isGenerating = generating;
    const elementsToDisable = [
        startChatBtn, continueChatBtn, swapCharactersBtn, clearChatBtn, editApiKeyBtn,
        openHistoryBtn, topicInput, questionerSelect, answererSelect,
        customQuestionerName, customQuestionerSystemPrompt,
        customAnswererName, customAnswererSystemPrompt, newChatBtn
    ];
    elementsToDisable.forEach(el => { if(el) el.disabled = generating; });
    
    if(!isSharedChatView) {
      startChatBtn.textContent = generating ? 'יוצר שיחה... 🧠' : 'התחל שיחה חדשה ✨';
    }
}

function swapCharacters() {
    if (isGenerating || isSharedChatView) return;
    const qVal = questionerSelect.value;
    const qName = customQuestionerName.value;
    const qPrompt = customQuestionerSystemPrompt.value;

    questionerSelect.value = answererSelect.value;
    customQuestionerName.value = customAnswererName.value;
    customQuestionerSystemPrompt.value = customAnswererSystemPrompt.value;

    answererSelect.value = qVal;
    customAnswererName.value = qName;
    customAnswererSystemPrompt.value = qPrompt;

    handleCustomCharacterSelection();
}

function clearConversation(hideSection = true) {
    if (isGenerating) return;
    currentChatId = null;
    chatContainer.innerHTML = '';
    
    if(hideSection) {
        topicInput.value = '';
    }

    if (hideSection) {
      updateViewState('setup');
    }
    continueChatBtn.classList.add('hidden');
    currentRound = 0;
    totalRounds = 0;
    progressIndicator.textContent = '';
    clearChatBtn.textContent = 'נקה שיחה 🧹';
}

function exportConversation(format) {
    const chat = getSavedChats().find(c => c.id === currentChatId);
    if (!chat || chat.conversation.length === 0) {
        alert('אין שיחה לשמור. 💾');
        return;
    }

    const topic = (chat.topic || 'conversation').replace(/[\\/:"*?<>|]/g, '').replace(/ /g, '_');
    const filename = 'gemini_chat_' + topic;
    
    if (format === 'txt') {
        let textContent = 'נושא: ' + chat.topic + '\n\n';
        textContent += chat.conversation.map(function(msg) {
            return msg.character + ':\n' + msg.text + '\n';
        }).join('');
        downloadFile(filename + '.txt', textContent, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
        const jsonContent = JSON.stringify(chat, null, 2);
        downloadFile(filename + '.json', jsonContent, 'application/json;charset=utf-8');
    } else if (format === 'png') {
        html2canvas(document.getElementById('chat-container'), {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--background-color'),
            useCORS: true,
            scale: 1.5,
        }).then(canvas => {
            downloadFile(filename + '.png', canvas.toDataURL('image/png'), 'image/png', true);
        }).catch(err => {
            console.error("Error generating image:", err);
            alert("לא ניתן היה ליצור את התמונה. 🖼️");
        });
    }
}

function downloadFile(filename, content, mimeType, isDataUrl = false) {
    const a = document.createElement('a');
    a.download = filename;
    if(isDataUrl){
        a.href = content;
    } else {
        const blob = new Blob([content], { type: mimeType });
        a.href = URL.createObjectURL(blob);
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if(!isDataUrl) URL.revokeObjectURL(a.href);
}

// --- App Start ---
document.addEventListener('DOMContentLoaded', init);
