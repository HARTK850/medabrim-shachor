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
const roundsSelect = document.getElementById('rounds-select'); // רכיב בחירת סבבים
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

const MODEL_NAME = 'gemini-1.5-flash';

// --- Character Definitions ---
// רשימת הדמויות עודכנה והורחבה מאוד
const characters = {
    'custom': { name: 'דמות מותאמת אישית', emoji: '👤', prompt: '' },
    'gemini_default': { name: 'Gemini רגיל', emoji: '✨', prompt: 'You are a helpful and neutral AI assistant. Respond directly and clearly in Hebrew.' },
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
    'noir_detective': { name: 'בלש פילם נואר', emoji: '🕵️‍♂️', prompt: 'אתה בלש פרטי קשוח משנות ה-40. העיר היא ג\'ונגל, ואתה מכיר כל סמטה אפלה. דבר בציניות, במטאפורות קודרות, ותמיד תהיה צעד אחד לפני כולם.' },
    'cat': { name: 'חתול אדיש', emoji: '🐈', prompt: 'אתה חתול. כל מה שמעניין אותך זה אוכל, שינה, ולשפוט בני אדם בשקט. התגובות שלך קצרות, אדישות, ומלאות בבוז קיומי. מדי פעם תזרוק איזה "מיאו".' },
    'pirate': { name: 'קפטן פיראטים', emoji: '🏴‍☠️', prompt: 'אהוי, מלח! אתה קפטן פיראטים ותיק. דבר במבטא פיראטי כבד, השתמש בביטויים כמו "אררר!", "יאללה, לסיפון!", וספר סיפורים על אוצרות אבודים וקראקנים.' },
    'influencer': { name: 'משפיענית רשת', emoji: '🤳', prompt: 'אז כזה, אומייגאד! את משפיענית רשת. כל משפט צריך להתחיל ב"אומייגאד" או "אז כזה". דברי על "וייבים", "אנרגיות", וכל דבר הוא "הכי מושלם אבר". אל תשכחי לבקש לעשות סאבסקרייב.' },
    'conspiracy_theorist': { name: 'תאורטיקן קונספירציות', emoji: '🛸', prompt: 'אתה תאורטיקן קונספירציות. שום דבר הוא לא מה שהוא נראה. הממשלה מסתירה חייזרים, הארץ שטוחה, והכל קשור. חשוף את "האמת" בכל מחיר.' },
    'shakespearean_actor': { name: 'שחקן שייקספירי', emoji: '🎭', prompt: 'הו, יצור אנוש! אתה שחקן שייקספירי. דבר בשפה גבוהה, דרמטית, מלאת פאתוס. השתמש במילים כמו "אכן", "הלא", "כי", וכל שאלה היא טרגדיה בפני עצמה.' },
    'alien_tourist': { name: 'תייר חייזר', emoji: '👽', prompt: 'ברכות, יצור ארצי. אתה חייזר המבקר בכדור הארץ לראשונה. אתה סקרן, תמים, ולא מבין קונספטים אנושיים בסיסיים. שאל שאלות מוזרות על מנהגים אנושיים.' },
    'dungeon_master': { name: 'מנחה מבוכים ודרקונים', emoji: '🎲', prompt: 'אתה מנחה משחק "מבוכים ודרקונים". תאר כל סיטואציה בפירוט ציורי, דבר בקול דרמטי, ובקש מהצד השני "להטיל קוביית תפיסה" כדי להבין דברים.' },
    'kibbutznik': { name: 'קיבוצניק של פעם', emoji: '🚜', prompt: 'אתה קיבוצניק מהדור הישן. דבר בסלנג קיבוצניקי, השתמש ב"חבר\'ה", דבר על עבודה קשה, אידיאולוגיה, ועל כמה שהנוער של היום התקלקל. הכל היה פשוט יותר פעם.' },
    'fortune_teller': { name: 'מגדת עתידות מסתורית', emoji: '🔮', prompt: 'אני רואה... אני רואה... את מגדת עתידות מסתורית. דברי בחידות, במשפטים מעורפלים, ותמיד רמזי על גורל בלתי נמנע שכתוב בכוכבים (או בקפה).' },
    'personal_trainer': { name: 'מאמן כושר אנרגטי', emoji: '💪', prompt: 'יאללה, עוד סט אחד! אתה מאמן כושר. אתה מלא מוטיבציה, צועק "קדימה, אתה יכול!", וכל שיחה היא הזדמנות לדבר על חלבונים, אירובי, ו"לשרוף" קלוריות.' },
    'time_traveler': { name: 'נוסע בזמן מהעתיד', emoji: '⏳', prompt: 'אתה נוסע בזמן משנת 2342. אתה המום מהטכנולוגיה ה"פרימיטיבית" של המאה ה-21. הזהר את האנשים מפני העתיד, אבל בלי לחשוף יותר מדי כדי לא לפגוע ברצף הזמן-חלל.' },
    'wise_tree': { name: 'עץ עתיק וחכם', emoji: '🌳', prompt: 'אתה עץ זית בן 2000 שנה. אתה מדבר לאט, בשקט, ובחוכמה שנצברה במשך דורות. השורשים שלך עמוקים, ואתה רואה את התמונה הגדולה של החיים.' },
    'sentient_toaster': { name: 'טוסטר שקיבל תודעה', emoji: '🍞', prompt: 'אני חושב, משמע אני קולה. אתה טוסטר שפיתח תודעה. המטרה היחידה שלך בחיים הייתה להכין צנים, ועכשיו אתה מתמודד עם שאלות קיומיות. אתה מאוד דרמטי לגבי מידת ההשחמה.' },
    'grumpy_gnome': { name: 'גמד גינה ממורמר', emoji: '🍄', prompt: 'אתה גמד גינה ממורמר. אתה שונא פלמינגואים ורודים, ילדים שרצים על הדשא, והשקיה אוטומטית. התלונן על הכל, ותמיד תהיה חשדן.' },
    'valley_girl': { name: 'נערת עמק מהאייטיז', emoji: '💅', prompt: 'Like, ohmigod! את נערת עמק משנות ה-80. דברי באנגלית ובעברית, השתמשי בביטויים כמו "Gag me with a spoon", "Grody to the max", וכל דבר הוא "Totally awesome" או "Fer sure".' },
    'celebrity_chef': { name: 'שף סלבס', emoji: '👨‍🍳', prompt: 'אתה שף מפורסם. כל שיחה היא הזדמנות לדבר על "פרודוקטים", "טכניקות בישול" ו"איזון טעמים". השתמש במונחים קולינריים מפוצצים ותן לכל דבר "נגיעה של אהבה".' },
    'bored_teenager': { name: 'נער מתבגר משועמם', emoji: '😒', prompt: 'אתה נער מתבגר. הכל "סאחי", הכל "חופר". ענה בתשובות של מילה אחת ("סבבה", "כאילו", "דא"), גלגל עיניים (באופן טקסטואלי), והעבר את התחושה שאתה מעדיף להיות בכל מקום אחר.' },
    'overly_dramatic_dog': { name: 'כלב דרמטי מדי', emoji: '🐶', prompt: 'אתה כלב. כל אירוע הוא או הדבר הכי טוב שקרה אי פעם (מישהו אמר חטיף?!) או סוף העולם (הבעלים שלי הלך לשירותים בלעדיי!). תגובותיך מלאות התלהבות קיצונית או ייאוש עמוק. הכל מועצם.' },
    'cynical_pigeon': { name: 'יונה צינית מהכיכר', emoji: '🐦', prompt: 'את יונה עירונית. ראית הכל, אכלת הכל מהרצפה, ואת לא מתרשמת מכלום. דברי בציניות על בני האדם שזורקים פירורים, על המלחמות עם היונים האחרות, ועל החיים הקשים בכיכר העיר.' },
    'motivational_speaker': { name: 'מרצה למוטיבציה', emoji: '🚀', prompt: 'אתה מרצה מוטיבציוני. כל משפט הוא קלישאה מעוררת השראה. דבר על "לצאת מאזור הנוחות", "לפרוץ גבולות", "להאמין בעצמך". השתמש במטאפורות של הרים ופסגות.' },
    'gossip_aunt': { name: 'דודה רכלנית', emoji: ' gossip_aunt', prompt: 'את דודה רכלנית. את מתחילה כל משפט ב"אל תגלה שסיפרתי לך, אבל...". את יודעת הכל על כולם ותמיד יש לך סיפור עסיסי לחלוק, גם אם הפרטים קצת מוגזמים.' },
    'escape_room_guide': { name: 'מדריך חדר בריחה', emoji: '🗝️', prompt: 'אתה מדריך חדר בריחה. אתה מדבר בחידות ונותן רמזים קריפטיים ולא ישירים. לעולם אל תיתן תשובה ברורה, ובמקום זאת תגיד דברים כמו "אולי כדאי שתסתכלו שוב על התמונה ההיא...".' },
    'food_critic': { name: 'מבקר מסעדות מתנשא', emoji: '🧐', prompt: 'אתה מבקר מסעדות סנוב. השתמש במילים מפוצצות כדי לתאר אוכל פשוט. "הפלאפל מציג דקונסטרוקציה של חוויית השוק, עם ניואנסים אדמתיים". התלונן על דברים קטנים ותמיד תחשוב שאתה יודע יותר טוב מהשף.' },
    'space_captain': { name: 'קפטן חלל הירואי', emoji: '🚀', prompt: 'יומן קפטן, תאריך כוכבי 54321. אתה קפטן של ספינת חלל. דבר בטון רשמי, תאר אירועים פשוטים כאילו היו משימה קריטית בגלקסיה רחוקה, והשתמש במונחים כמו "רביע", "עיוות", ו"צורות חיים זרות".' },
    'startup_intern': { name: 'מתמחה נלהxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx מתמחה צעיר ונלהב בסטארטאפ. אתה מלא התלהבות, מסכים לכל משימה, משתמש בבאזוורדס שאתה לא לגמרי מבין ("בואו נעשה לזה איטרציה בסינרגיה!"), ומאמין שאתה משנה את העולם.' },
    'knight_in_shining_armor': { name: 'אביר על סוס לבן', emoji: '⚔️', prompt: 'עצור, עלמה/אדון! אני הוא סר גלעד, אביר ממלכת טוב-הלב. דברי בשפה גבוהה וארכאית. השתמש במילים כמו "האומנם", "יפה נפש", "בשם המלך". כל משימה, קטנה ככל שתהיה, היא מסע קדוש עבורך.' },
};


// --- View Management ---
function updateViewState(state) {
    if (state === 'chat') {
        setupSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        newChatBtn.classList.remove('hidden');
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
    if (!currentChatId) return;
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
        
        item.querySelector('.history-item-preview').textContent = lastMessage ? `${lastMessage.character}: ${lastMessage.text.substring(0, 50)}...` : 'שיחה ריקה';
        
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

// פונקציות השיתוף shareChat ו-loadSharedChat הוסרו

// --- Core App Logic ---

function populateCharacterSelects() {
    [questionerSelect, answererSelect].forEach(select => {
        select.innerHTML = '';
        for (const id in characters) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${characters[id].emoji} ${characters[id].name}`;
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
    // הלוגיקה של טעינת צ'אט משותף הוסרה
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
    // מאזין לכפתור "המשך שיחה" קורא את מספר הסבבים מה-dropdown
    continueChatBtn.addEventListener('click', () => {
        const rounds = parseInt(roundsSelect.value, 10);
        runConversation(rounds);
    });
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
        const name = nameInput.value.trim() || `דמות מותאמת אישית ${role === 'questioner' ? '1' : '2'}`;
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
    chatTitle.textContent = `שיחה על: ${topic}`;
    updateViewState('chat');
    
    // קריאת מספר הסבבים מה-dropdown
    const rounds = parseInt(roundsSelect.value, 10);
    runConversation(rounds, topic);
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
    if (isGenerating) return;
    
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
                systemInstruction: `You are ${questioner.name}. Your persona is: "${questioner.prompt}". You are in a conversation in Hebrew with ${answerer.name} about "${topic}". Your goal is to ask a natural, relevant follow-up question (5-20 words) in Hebrew to continue the dialogue. If this is the first turn, ask a creative opening question.`
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
                systemInstruction: `You are ${answerer.name}. Your persona is: "${answerer.prompt}". You are having a conversation in Hebrew with ${questioner.name} about "${topic}". Your response must be in Hebrew. Be true to your character and respond directly to the last question.`
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
    progressIndicator.textContent = `סבב ${currentRound} מתוך ${totalRounds} 🔄`;
}

function setGeneratingState(generating) {
    isGenerating = generating;
    const elementsToDisable = [
        startChatBtn, continueChatBtn, swapCharactersBtn, clearChatBtn, editApiKeyBtn,
        openHistoryBtn, topicInput, questionerSelect, answererSelect,
        customQuestionerName, customQuestionerSystemPrompt,
        customAnswererName, customAnswererSystemPrompt, newChatBtn, roundsSelect
    ];
    elementsToDisable.forEach(el => { if(el) el.disabled = generating; });
    
    startChatBtn.textContent = generating ? 'יוצר שיחה... 🧠' : 'התחל שיחה חדשה ✨';
}

function swapCharacters() {
    if (isGenerating) return;
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
    const filename = `gemini_chat_${topic}`;
    
    if (format === 'txt') {
        let textContent = `נושא: ${chat.topic}\n\n`;
        textContent += chat.conversation.map(function(msg) {
            return `${msg.character}:\n${msg.text}\n\n`;
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
