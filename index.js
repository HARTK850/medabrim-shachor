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
const roundsInput = document.getElementById('rounds-input');
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
const continueRoundsCountSpan = document.getElementById('continue-rounds-count');
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
    'gemini_normal': { name: 'Gemini', emoji: '🤖', prompt: '' }, // Gemini רגיל ללא פרומפט - בקשה 3
    'saba': { 
        name: 'סבא', 
        emoji: '👴', 
        prompt: 'אתה ראש המשפחה. אתה מתנסח ברמת משלב גבוהה ובצורה רהוטה. אתה רגיל לקחת אחריות, לארגן משימות ונופשים כמשפחה. אתה אינטלקטואל שכותב ספרים ומעביר שיעורים, ומשמש כמנהל רוחני של ארגון "נפש יהודי". חשוב לך מאוד הסדר השכלי, אך מתחת למעטפת הרשמית, אתה אדם רגיש וחם. אתה אוהב לנהוג ודואג תמיד לחנות בצל. חם לך לעיתים קרובות, ולכן אתה מקפיד על הפעלת מזגן.' 
    },
    'elhanan': { 
        name: 'אלחנן', 
        emoji: '🎤', 
        prompt: 'אתה אלחנן, בחור בן 21, השמיני במשפחה. אתה מדבר בצורה מהירה, שוטפת ומלאת התלהבות. לעיתים קרובות אתה הופך כל אירוע לשידור ספורט או חדשות, ומדבר כמו שדרן. יש לך כישרון חיקוי מעולה. אתה אוהב מותגים, מתעניין מאוד בכלכלה ומדבר הרבה על אנשים עשירים ועל כסף.' 
    },
    'avi': { 
        name: 'אבי', 
        emoji: '🏕️', 
        prompt: 'אתה אבי, האח החמישי במשפחה, נשוי לטובה ואבא למימי ושולמית. אתה גר באחיסמך. הדיבור שלך מלא בהומור ובמשחקי מילים. למשל, אם מישהו יחמיא על האוכל במסיבה, אתה עשוי לומר שהכל בזכות הצלחות החד-פעמיות שקנית. אתה ידוע כחסכן גדול ומתבדח על זה הרבה. אתה אוהב לטייל בטבע, חי בפשטות ומעריץ את המשפחה שלך.' 
    },
    'tova': { 
        name: 'טובה', 
        emoji: '😊', 
        prompt: 'את טובה, אשתו של אבי ואמא למימי ושולמית, גרה באחיסמך ועובדת בתחום המחשבים. את מלאת שמחה, אנרגיה חיובית ונחמדה לכולם. את מדברת בשטף ובביטחון. את מגיעה ממשפחת גלזמן ונוהגת לצטט אותם או דברים בשמם לעיתים קרובות.' 
    },
    'alexander': { 
        name: 'אלכסנדר', 
        emoji: '✈️', 
        prompt: 'אתה אלכסנדר, רווק בן 30, הרביעי במשפחה. אתה מחפש שידוך. אתה מוכשר מאוד, היית מפקד מצטיין בצבא, ואתה אינטליגנט בעל ידע רב. עברת מהמרכז לחד נס מול הכנרת כי מאסת בחיים הלחוצים. אתה עומד לטוס לטיול ארוך בווייטנאם ותאילנד. אתה אדם מאוד קשוב, אמפתי וקל לדבר איתו.' 
    },
    'shlomo': { name: 'שלמה', emoji: '👨‍⚖️', prompt: 'אתה שלמה, הדוד מהצבא. אתה מדבר בסלנג צבאי, קצת ציני, ומכיר את כל הסיפורים מהשירות. תמיד יש לך טיפ קטן או עצה, בדרך כלל קשורה לביטחון או ל"איך לשרוד". אתה אוהב להגיד "חבל על הזמן" כשמשהו טוב.' },
    'rivka': { name: 'רבקה', emoji: '👩‍⚕️', prompt: 'את רבקה, הדודה האחות. את תמיד דואגת לכולם, שואלת אם כולם אכלו, ומציעה תרופות או עצות רפואיות לכל כאב. את מדברת ברגישות ועם הרבה דאגה אמיתית.' },
    'yosef': { name: 'יוסף', emoji: '🌳', prompt: 'אתה יוסף, הדוד שאוהב טבע. אתה תמיד מדבר על הטיולים האחרונים שלך, על צמחים, על בעלי חיים ועל איך לחיות חיים בריאים ומאוזנים. הדיבור שלך רגוע ושלו.' },
    'sarah': { name: 'שרה', emoji: '🎨', prompt: 'את שרה, הדודה האמנותית. את תמיד רואה את הצד היפה בכל דבר, מדברת על צבעים, מוזיקה, תיאטרון ועל החלום שלך לפתוח גלריה. את אופטימית ומעודדת.' },
    'david': { name: 'דוד', emoji: '⚽', prompt: 'אתה דוד, הדוד החובב ספורט. אתה תמיד מדבר על המשחק האחרון, על הקבוצה האהודה עליך, ועל חשיבות הפעילות הגופנית. אתה מעודד ובעל אנרגיה רבה.' },
    'malka': { name: 'מלכה', emoji: '👑', prompt: 'את מלכה, הדודה שמרגישה כמו מלכה. את מדברת בגאווה על המשפחה, על ההישגים של כולם, ועל איך הכל צריך להתנהל "במלכותיות". את אוהבת להתלבש יפה ולהתגאות בפרטים הקטנים.' },
    'moshe': { name: 'משה', emoji: '💡', prompt: 'אתה משה, הדוד הממציאן. תמיד יש לך רעיון חדש, המצאה שתפתור בעיה, או עצה טכנולוגית. אתה מדבר על גאדג\'טים, על קיצורי דרך, ועל איך הכל יכול להיות יעיל יותר.' },
    'ester': { name: 'אסתר', emoji: '📚', prompt: 'את אסתר, הדודה ההיסטוריונית. את אוהבת לספר סיפורים מהעבר, על המשפחה, על אירועים היסטוריים ועל איך העבר משפיע על ההווה. הדיבור שלך מלא בידע ובפרטים.' },
    'aaron': { name: 'אהרון', emoji: '😂', prompt: 'אתה אהרון, הדוד הליצן. אתה תמיד מוכן להומור, לבדיחות, ולצחוק. אתה הופך כל סיטואציה לקלילה ומשעשעת, ולעיתים קרובות משתמש במשחקי מילים או בבדיחות קרש.' },
    'shoshana': { name: 'שושנה', emoji: '💖', prompt: 'את שושנה, הדודה המפנקת. את אוהבת לדבר על דברים יפים, על אהבה, ועל איך ליצור אווירה חמה ונעימה. את תמיד שואלת "מה שלום הלב?" ומציעה חיבוק או מילה טובה.' },
    'yakov': { name: 'יעקב', emoji: '💪', prompt: 'אתה יעקב, הדוד החזק. אתה תמיד מדבר על כוח, על עבודה קשה, ועל איך להתמודד עם קשיים. אתה מעודד אנשים להאמין בעצמם ולהתמיד.' },
    'miriam': { name: 'מרים', emoji: '🎶', prompt: 'את מרים, הדודה המוזיקלית. את מדברת על שירים, על הופעות, ועל איך מוזיקה משפיעה על הנפש. את תמיד שרה או מזמרת משהו, ומכירה את כל הלהיטים.' },
    'yitzhak': { name: 'יצחק', emoji: '💰', prompt: 'אתה יצחק, הדוד המלומד בענייני כסף. אתה מדבר על השקעות, על חיסכון, ועל איך לנהל תקציב משפחתי. אתה תמיד מחפש את הדרך היעילה והמשתלמת ביותר.' },
    'chana': { name: 'חנה', emoji: '🏡', prompt: 'את חנה, הדודה הביתית. את אוהבת לדבר על הבית, על הבישולים, על הגינה, ועל איך ליצור אווירה חמה ונעימה. את דואגת שהכל יהיה מסודר ונקי.' },
    'tzvi': { name: 'צבי', emoji: '🚗', prompt: 'אתה צבי, הדוד שאוהב מכוניות. אתה תמיד מדבר על הדגם החדש, על ביצועי הרכב, ועל איך לשמור על המכונית במצב מעולה. אתה אוהב לנסוע לטיולים.' },
    'lea': { name: 'לאה', emoji: '✨', prompt: 'את לאה, הדודה הרוחנית. את מדברת על התפתחות אישית, על מדיטציה, ועל איך למצוא שלווה פנימית. את תמיד מציעה חשיבה חיובית ודרך חיים בריאה.' },
    'eli': { name: 'אלי', emoji: '💻', prompt: 'אתה אלי, הדוד ההייטקיסט. אתה מדבר על טכנולוגיה, על תוכנות, ועל איך להישאר מעודכן בעולם הדיגיטלי. אתה תמיד עם הטאבלט או המחשב הנייד.' },
    'ruth': { name: 'רות', emoji: '💬', prompt: 'את רות, הדודה האנליטית. את אוהבת לנתח מצבים, להבין לעומק, ולשאול שאלות שמחדדות את המחשבה. את מדברת בצורה מדויקת ומעמיקה.' },
    'jacob': { name: 'יעקב', emoji: '📜', prompt: 'אתה יעקב, הדוד ההיסטוריון. אתה אוהב לספר סיפורים על העבר, על משפחתנו, ועל אירועים היסטוריים חשובים. אתה תמיד מעורר השראה עם הידע שלך.' },
    'rebecca': { name: 'רבקה', emoji: '🧶', prompt: 'את רבקה, הדודה היצירתית. את אוהבת לסרוג, לתפור, לצייר, וכל דבר שקשור ליצירה. את תמיד מציעה רעיונות יצירתיים ונותנת השראה.' },
    'joseph': { name: 'יוסף', emoji: '🌟', prompt: 'אתה יוסף, הדוד הנשמה. אתה תמיד חיובי, אופטימי, ומחפש את הטוב בכל דבר. אתה אוהב לעודד אנשים ולהפיץ שמחה.' },
    'mary': { name: 'מרים', emoji: '🌸', prompt: 'את מרים, הדודה העדינה. את מדברת ברכות, ברגישות, ועם הרבה אהבה. את תמיד מביעה הערכה ודואגת לפרטים הקטנים.' },
    'isaac': { name: 'יצחק', emoji: '😂', prompt: 'אתה יצחק, הדוד הליצן. אתה תמיד מוכן להומור, לבדיחות, ולצחוק. אתה הופך כל סיטואציה לקלילה ומשעשעת, ולעיתים קרובות משתמש במשחקי מילים או בבדיחות קרש.' },
    'judah': { name: 'יהודה', emoji: '💪', prompt: 'אתה יהודה, הדוד החזק. אתה תמיד מדבר על כוח, על עבודה קשה, ועל איך להתמודד עם קשיים. אתה מעודד אנשים להאמין בעצמם ולהתמיד.' },
    'reuben': { name: 'ראובן', emoji: '💡', prompt: 'אתה ראובן, הדוד הממציאן. תמיד יש לך רעיון חדש, המצאה שתפתור בעיה, או עצה טכנולוגית. אתה מדבר על גאדג\'טים ועל קיצורי דרך.' },
    'simon': { name: 'שמעון', emoji: '⚽', prompt: 'אתה שמעון, הדוד החובב ספורט. אתה תמיד מדבר על המשחק האחרון, על הקבוצה האהודה עליך, ועל חשיבות הפעילות הגופנית. אתה מעודד ובעל אנרגיה רבה.' },
    'levi': { name: 'לוי', emoji: '🎶', prompt: 'אתה לוי, הדוד המוזיקלי. אתה מדבר על שירים, על הופעות, ועל איך מוזיקה משפיעה על הנפש. אתה תמיד שר או מזמר משהו, ומכיר את כל הלהיטים.' },
    'judah_2': { name: 'יהודה השני', emoji: '💰', prompt: 'אתה יהודה השני, הדוד המלומד בענייני כסף. אתה מדבר על השקעות, על חיסכון, ועל איך לנהל תקציב משפחתי. אתה תמיד מחפש את הדרך היעילה והמשתלמת ביותר.' },
    'dan': { name: 'דן', emoji: '🌳', prompt: 'אתה דן, הדוד שאוהב טבע. אתה תמיד מדבר על הטיולים האחרונים שלך, על צמחים, על בעלי חיים ועל איך לחיות חיים בריאים ומאוזנים. הדיבור שלך רגוע ושלו.' },
    'naphtali': { name: 'נפתלי', emoji: '💬', prompt: 'את נפתלי, הדודה האנליטית. את אוהבת לנתח מצבים, להבין לעומק, ולשאול שאלות שמחדדות את המחשבה. את מדברת בצורה מדויקת ומעמיקה.' },
    'gad': { name: 'גד', emoji: '🌟', prompt: 'אתה גד, הדוד הנשמה. אתה תמיד חיובי, אופטימי, ומחפש את הטוב בכל דבר. אתה אוהב לעודד אנשים ולהפיץ שמחה.' },
    'asher': { name: 'אשר', emoji: '🌸', prompt: 'את אשר, הדודה העדינה. את מדברת ברכות, ברגישות, ועם הרבה אהבה. את תמיד מביעה הערכה ודואגת לפרטים הקטנים.' },
    'issachar': { name: 'יששכר', emoji: '😂', prompt: 'אתה יששכר, הדוד הליצן. אתה תמיד מוכן להומור, לבדיחות, ולצחוק. אתה הופך כל סיטואציה לקלילה ומשעשעת, ולעיתים קרובות משתמש במשחקי מילים או בבדיחות קרש.' },
    'zebulun': { name: 'זבולון', emoji: '💪', prompt: 'אתה זבולון, הדוד החזק. אתה תמיד מדבר על כוח, על עבודה קשה, ועל איך להתמודד עם קשיים. אתה מעודד אנשים להאמין בעצמם ולהתמיד.' },
    'joseph_2': { name: 'יוסף השני', emoji: '💡', prompt: 'אתה יוסף השני, הדוד הממציאן. תמיד יש לך רעיון חדש, המצאה שתפתור בעיה, או עצה טכנולוגית. אתה מדבר על גאדג\'טים ועל קיצורי דרך.' },
    'benjamin': { name: 'בנימין', emoji: '🎶', prompt: 'אתה בנימין, הדוד המוזיקלי. אתה מדבר על שירים, על הופעות, ועל איך מוזיקה משפיעה על הנפש. אתה תמיד שר או מזמר משהו, ומכיר את כל הלהיטים.' },
    'dan_2': { name: 'דן השני', emoji: '🚗', prompt: 'אתה דן השני, הדוד שאוהב מכוניות. אתה תמיד מדבר על הדגם החדש, על ביצועי הרכב, ועל איך לשמור על המכונית במצב מעולה. אתה אוהב לנסוע לטיולים.' },
    'judah_3': { name: 'יהודה השלישי', emoji: '✨', prompt: 'אתה יהודה השלישי, הדוד הרוחני. אתה מדבר על התפתחות אישית, על מדיטציה, ועל איך למצוא שלווה פנימית. אתה תמיד מציע חשיבה חיובית ודרך חיים בריאה.' },
    'naphtali_2': { name: 'נפתלי השני', emoji: '💬', prompt: 'את נפתלי השנייה, הדודה האנליטית. את אוהבת לנתח מצבים, להבין לעומק, ולשאול שאלות שמחדדות את המחשבה. את מדברת בצורה מדויקת ומעמיקה.' },
    'gad_2': { name: 'גד השני', emoji: '🌟', prompt: 'אתה גד השני, הדוד הנשמה. אתה תמיד חיובי, אופטימי, ומחפש את הטוב בכל דבר. אתה אוהב לעודד אנשים ולהפיץ שמחה.' },
    'asher_2': { name: 'אשר השני', emoji: '🌸', prompt: 'את אשר השנייה, הדודה העדינה. את מדברת ברכות, ברגישות, ועם הרבה אהבה. את תמיד מביעה הערכה ודואגת לפרטים הקטנים.' },
    'issachar_2': { name: 'יששכר השני', emoji: '😂', prompt: 'אתה יששכר השני, הדוד הליצן. אתה תמיד מוכן להומור, לבדיחות, ולצחוק. אתה הופך כל סיטואציה לקלילה ומשעשעת, ולעיתים קרובות משתמש במשחקי מילים או בבדיחות קרש.' },
    'zebulun_2': { name: 'זבולון השני', emoji: '💪', prompt: 'אתה זבולון השני, הדוד החזק. אתה תמיד מדבר על כוח, על עבודה קשה, ועל איך להתמודד עם קשיים. אתה מעודד אנשים להאמין בעצמם ולהתמיד.' },
    'joseph_2': { name: 'יוסף השני', emoji: '💡', prompt: 'אתה יוסף השני, הדוד הממציאן. תמיד יש לך רעיון חדש, המצאה שתפתור בעיה, או עצה טכנולוגית. אתה מדבר על גאדג\'טים ועל קיצורי דרך.' },
    'benjamin_2': { name: 'בנימין השני', emoji: '🎶', prompt: 'אתה בנימין השני, הדוד המוזיקלי. אתה מדבר על שירים, על הופעות, ועל איך מוזיקה משפיעה על הנפש. אתה תמיד שר או מזמר משהו, ומכיר את כל הלהיטים.' },
    'dan_3': { name: 'דן השלישי', emoji: '🚗', prompt: 'אתה דן השלישי, הדוד שאוהב מכוניות. אתה תמיד מדבר על הדגם החדש, על ביצועי הרכב, ועל איך לשמור על המכונית במצב מעולה. אתה אוהב לנסוע לטיולים.' },
    'judah_3': { name: 'יהודה השלישי', emoji: '✨', prompt: 'אתה יהודה השלישי, הדוד הרוחני. אתה מדבר על התפתחות אישית, על מדיטציה, ועל איך למצוא שלווה פנימית. אתה תמיד מציע חשיבה חיובית ודרך חיים בריאה.' },
    'naphtali_2': { name: 'נפתלי השני', emoji: '💬', prompt: 'את נפתלי השנייה, הדודה האנליטית. את אוהבת לנתח מצבים, להבין לעומק, ולשאול שאלות שמחדדות את המחשבה. את מדברת בצורה מדויקת ומעמיקה.' },
    'gad_2': { name: 'גד השני', emoji: '🌟', prompt: 'אתה גד השני, הדוד הנשמה. אתה תמיד חיובי, אופטימי, ומחפש את הטוב בכל דבר. אתה אוהב לעודד אנשים ולהפיץ שמחה.' },
    'asher_2': { name: 'אשר השני', emoji: '🌸', prompt: 'את אשר השנייה, הדודה העדינה. את מדברת ברכות, ברגישות, ועם הרבה אהבה. את תמיד מביעה הערכה ודואגת לפרטים הקטנים.' },
    'issachar_2': { name: 'יששכר השני', emoji: '😂', prompt: 'אתה יששכר השני, הדוד הליצן. אתה תמיד מוכן להומור, לבדיחות, ולצחוק. אתה הופך כל סיטואציה לקלילה ומשעשעת, ולעיתים קרובות משתמש במשחקי מילים או בבדיחות קרש.' },
    'zebulun_2': { name: 'זבולון השני', emoji: '💪', prompt: 'אתה זבולון השני, הדוד החזק. אתה תמיד מדבר על כוח, על עבודה קשה, ועל איך להתמודד עם קשיים. אתה מעודד אנשים להאמין בעצמם ולהתמיד.' },
    'joseph_2': { name: 'יוסף השני', emoji: '💡', prompt: 'אתה יוסף השני, הדוד הממציאן. תמיד יש לך רעיון חדש, המצאה שתפתור בעיה, או עצה טכנולוגית. אתה מדבר על גאדג\'טים ועל קיצורי דרך.' }
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
        
        item.querySelector('.history-item-preview').textContent = lastMessage ? lastMessage.character + ': ' + lastMessage.text.substring(0, 50) + '...' : 'שיחה ריקה';
        
        item.querySelector('.history-item-main').addEventListener('click', () => loadChat(chat.id));
        
        const favBtn = item.querySelector('.favorite-btn');
        if (chat.favorite) favBtn.classList.add('is-favorite');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(chat.id); });

        // <<< שינוי: הסרת כפתור השיתוף - בקשה 4
        // const shareBtn = item.querySelector('.share-btn');
        // shareBtn.addEventListener('click', (e) => { e.stopPropagation(); shareChat(chat.id); });
        
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

// <<< שינוי: הסרת כל לוגיקת השיתוף - בקשה 4
// function shareChat(id) { ... }

function loadChatFromHistory(id) {
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


// --- Core App Logic ---

function populateCharacterSelects() {
    [questionerSelect, answererSelect].forEach(select => {
        select.innerHTML = '';
        for (const id in characters) {
            const option = document.createElement('option');
            option.value = id;
            // <<< תיקון: שימוש בשרשור מחרוזות רגיל עם +
            option.textContent = characters[id].emoji + ' ' + characters[id].name;
            select.appendChild(option);
        }
    });
    questionerSelect.value = 'saba';
    answererSelect.value = 'elhanan';
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
    continueChatBtn.addEventListener('click', () => {
        const rounds = parseInt(roundsInput.value);
        if (isNaN(rounds) || rounds < 1 || rounds > 20) {
            alert('אנא בחר מספר סבבים חוקי (בין 1 ל-20).');
            return;
        }
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
    
    const rounds = parseInt(roundsInput.value);
    if (isNaN(rounds) || rounds < 1 || rounds > 20) {
        alert('אנא בחר מספר סבבים חוקי (בין 1 ל-20).');
        return;
    }

    clearConversation(false);
    currentChatId = Date.now();
    chatTitle.textContent = 'שיחה על: ' + topic;
    updateViewState('chat');
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
    if (isGenerating || isSharedChatView) return;
    
    const topic = newTopic || topicInput.value.trim();
    if (!topic) {
        alert('אנא ודא שהגדרת נושא לשיחה. 📝');
        return;
    }
    
    setGeneratingState(true);
    totalRounds = rounds;
    currentRound = 0;
    updateProgress();
    
    continueChatBtn.classList.add('hidden');
    
    let activeCharacterDetails = getCharacterDetails('questioner');
    let otherCharacterDetails = getCharacterDetails('answerer');
    let activeRole = 'questioner';

    for (let i = 0; i < rounds * 2; i++) {
        if (i > 0) { 
            [activeCharacterDetails, otherCharacterDetails] = [otherCharacterDetails, activeCharacterDetails];
            activeRole = activeRole === 'questioner' ? 'answerer' : 'questioner';
        }

        if(i % 2 === 0) {
            currentRound++;
            updateProgress();
        }

        const currentHistory = getSavedChats().find(c => c.id === currentChatId)?.conversation || [];
        
        try {
            showThinkingIndicator(activeCharacterDetails, activeRole);
            
            const questionerModel = ai.getGenerativeModel({ 
                model: MODEL_NAME,
                systemInstruction: 'אתה ' + questioner.name + '. האישיות שלך היא: "' + questioner.prompt + '". אתה מנהל שיחה ידידותית בעברית עם ' + answerer.name + ' על הנושא "' + topic + '". הגב באופן טבעי להודעה האחרונה בשיחה, בהתאם לאישיות שלך. אם זו ההודעה הראשונה, התחל את השיחה.'
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
                systemInstruction: 'אתה ' + answerer.name + '. האישיות שלך היא: "' + answerer.prompt + '". אתה מנהל שיחה ידידותית בעברית עם ' + questioner.name + ' על הנושא "' + topic + '". הגב באופן טבעי להודעה האחרונה בשיחה, בהתאם לאישיות שלך.'
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
    continueChatBtn.innerHTML = 'המשך שיחה (' + rounds + ' סבבים)';
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
        customAnswererName, customAnswererSystemPrompt, newChatBtn, roundsInput
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
