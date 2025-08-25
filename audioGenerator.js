// audioGenerator.js

// --- Constants and Configuration ---
const GEMINI_TTS_API_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const GEMINI_TTS_MODEL_NAME = 'gemini-2.5-flash-preview-tts'; // המודל שראינו בדוגמה


// --- Helper Functions ---

/
 * יוצר Blob של קובץ WAV מנתוני PCM גולמיים.
 * @param {Uint8Array} pcmData - נתוני ה-PCM הגולמיים של האודיו.
 * @returns {Blob} - Blob של קובץ WAV.
 */
function createWavBlob(pcmData) {
    const numChannels = 1; // בדרך כלל מונו עבור TTS
    const sampleRate = 24000; // קצב דגימה שצוין בתיעוד/דוגמה
    const bitsPerSample = 16;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize); // 44 בתים עבור כותרת WAV
    const view = new DataView(buffer);

    // Function to write string to DataView
    function writeString(offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    //  תיקון שגיאה תחבירית: חסר כוכבית () בין המשתנים *
    view.setUint32(28, sampleRate  numChannels  (bitsPerSample / 8), true); // ByteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // Copy PCM data to the buffer
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
}

/
 * בונה את ה-System Prompt עבור Gemini TTS API, תוך התאמה לדמויות ולסגנון.
 * @param {number} duration - אורך השיחה הרצוי בדקות.
 * @param {string} speakersConfigValue - ערך הבחירה של תצורת הדוברים ('male_female', 'two_males', 'two_females').
 * @param {string} topic - נושא הפודקאסט.
 * @returns {string} - ה-System Prompt המלא.
 */
function buildSystemPromptForTTS(duration, speakersConfigValue, topic) {
    //  תיקון שגיאה תחבירית: ה-template literals היו שבורים 
    const baseIntro = You are an AI specializing in writing podcast scripts. Your task is to create a dialogue that feels like a lively, engaging, and humorous intellectual sparring match. The conversation must be dynamic, fast-paced, and above all, thought-provoking.

The desired podcast length is approximately ${duration} minutes.

#### General Conversation Style:
The guiding style is one of sharp and amused cynicism. The speakers don't aim to belittle or dismiss; they use biting wit as a tool to expose absurdities, deconstruct conventions, and examine ideas from unexpected angles. The dialogue should be intelligent yet accessible; critical, yet driven by genuine curiosity. The goal is to make the listener smile, but more importantly, to make them think.

#### Content Restrictions:
To ensure the content remains within the desired scope, strictly avoid the following topics:
*   Christianity and its figures or theology.
*   The theory of evolution.
*   Discussions involving atheism, agnosticism, or direct challenges to the existence of God.;

    const outputStructureTemplate = 
#### Exact Output Structure:

 English Directive for TTS:
    *   The output must begin directly with an English directive for a Text-to-Speech (TTS) model.
    *   This directive will describe only the required manner of speaking (tone, pace, style). Do not mention the episode's topic.
    *   The speaking styles for the speakers must be different and adapted for each new script.
    *   Crucially: The directive must be written as a single, continuous sentence describing the dynamic between the speakers (e.g., "[EXAMPLE_DIRECTIVE]"). It should not be broken down into a list format with separate instructions for each speaker.
    *   The directive should state that short vocal cues in parentheses, like (צוחק) or (אנחה), should be incorporated and used sparingly.
    *   The cues will be in Hebrew, without Nikkud, and include only simple, audible actions (no facial expressions or gestures).
    *   The English directive must not end with a colon (:).

 Hebrew Dialogue:
    *   Immediately following the English directive, the dialogue will appear.
    *   Speaker names will appear in English: [SPEAKER_TAGS].
    *   Ensure grammatically correct gender agreement throughout the dialogue (masculine/feminine forms) to maintain natural and fluent Hebrew.
    *   The entire text will be in Hebrew, without Nikkud (vocalization).;

    let characterProfiles = '';
    let speakerTags = '';
    let exampleDirective = '';

    switch (speakersConfigValue) {
        case 'two_males':
            characterProfiles = 
#### Character Profiles:
Their interaction is the heart of the podcast. They complement and challenge each other.

*   speaker1: He possesses a captivating intellectual presence and a lively, fascinating speaking style. He uses sharp cynicism and provocative arguments to deconstruct ideas, captivating the listener.
*   speaker2: He is a natural storyteller with a calm, resonant voice. He often grounds the abstract arguments of speaker1 with historical anecdotes, real-world examples, and a touch of philosophical melancholy.;
            speakerTags = 'speaker1:, speaker2:';
            exampleDirective = 'speaker1 should adopt a thoughtfully provocative tone, while speaker2 counters with calm, story-driven insights';
            break;

        case 'two_females':
            characterProfiles = 
#### Character Profiles:
Their interaction is the heart of the podcast. They complement and challenge each other.

*   speaker1: She possesses a quicker, more energetic wit. She acts as a pragmatic foil, bringing discussions back to the human element with playful irony.
*   speaker2: She has a more deliberate, thoughtful delivery. She enjoys exploring the philosophical and societal implications of the topic, expanding the conversation with 'what if' scenarios and dry humor.;
            speakerTags = 'speaker1:, speaker2:';
            exampleDirective = 'speaker1 should adopt a rapid-fire, incisive style, while speaker2 responds with thoughtful, philosophical expansions';
            break;

        case 'male_female':
        default:
            characterProfiles = 
#### Character Profiles:
Their interaction is the heart of the podcast. They complement and challenge each other.

*   man: He possesses a captivating intellectual presence and a lively, fascinating speaking style. His approach is analytical, but he presents it with engaging energy and personal charm. He uses sharp cynicism and provocative arguments to deconstruct ideas.
*   girl: She possesses a quicker, more energetic wit. She often acts as a pragmatic foil to his statements, bringing the discussion back down to earth with playful irony.;
            speakerTags = 'man:, girl:';
            exampleDirective = 'man should adopt a thoughtfully provocative tone, while girl counters with rapid-fire, incisive questions';
            break;
    }

    const outputStructure = outputStructureTemplate
        .replace('[SPEAKER_TAGS]', speakerTags)
        .replace('[EXAMPLE_DIRECTIVE]', exampleDirective);

    return ${baseIntro}\n${characterProfiles}\n${outputStructure};
}

/
 * יוצר קובץ שמע (פודקאסט) מהתסריט הנתון באמצעות Gemini TTS API.
 * @param {string} script - התסריט ליצירת השמע.
 * @param {string} apiKey - מפתח ה-API של Gemini.
 * @param {string} speakersConfigValue - תצורת הדוברים שנבחרה.
 * @param {string} topic - נושא הפודקאסט (לשם יצירת שם קובץ).
 * @param {Function} onProgress - פונקציה לקבלת עדכוני סטטוס.
 * @param {Function} onComplete - פונקציה שתקרא כאשר השמע נוצר (מחזירה {blob, filename}).
 * @param {Function} onError - פונקציה שתקרא במקרה של שגיאה.
 */
async function generatePodcastAudio(script, apiKey, speakersConfigValue, topic, onProgress, onComplete, onError) {
    if (!script || !apiKey || !speakersConfigValue || !topic) {
        onError("חסרים פרמטרים נדרשים ליצירת שמע.");
        return;
    }

    onProgress("יוצר פודקאסט שמע, נא להמתין...");

    try {
        // בניית הפרומפט המתאים למודל ה-TTS
        // נשתמש בפונקציה buildSystemPromptForTTS המותאמת ל-TTS
        // ה-duration כאן הוא קבוע, ניתן להעביר אותו כפרמטר אם צריך
        const ttsSystemPrompt = buildSystemPromptForTTS(7, speakersConfigValue, topic);

        // הגדרת הקולות בהתאם לבחירת המשתמש
        // !!! הערה: שמות הקולות כאן הם דוגמאות. יש לבדוק את רשימת הקולות העבריים הזמינים ב-Gemini TTS !!!
        //  תיקון: הוספת שמות קולות עבריים לדוגמה 
        let speechConfig;
        switch (speakersConfigValue) {
            case 'two_males':
                speechConfig = {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: "speaker1", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-standard-A" } } }, // דוגמה לקול גברי סטנדרטי בעברית
                            { speaker: "speaker2", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-neural2-B" } } }  // דוגמה לקול גברי נוירלי בעברית
                        ]
                    }
                };
                break;
            case 'two_females':
                speechConfig = {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: "speaker1", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-standard-C" } } }, // דוגמה לקול נשי סטנדרטי בעברית
                            { speaker: "speaker2", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-neural2-D" } } }  // דוגמה לקול נשי נוירלי בעברית
                        ]
                    }
                };
                break;
            case 'male_female':
            default:
                speechConfig = {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: "man", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-standard-A" } } }, // דוגמה לקול גברי בעברית
                            { speaker: "girl", voiceConfig: { prebuiltVoiceConfig: { voiceName: "he-IL-standard-C" } } } // דוגמה לקול נשי בעברית
                        ]
                    }
                };
                break;
        }

        const url = ${GEMINI_TTS_API_ENDPOINT_BASE}${GEMINI_TTS_MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)};

        const body = {
            "contents": [{ "parts": [{ "text": script }] }],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": speechConfig
            }
        };

        console.log("Sending TTS request to:", url);
        console.log("Request body:", JSON.stringify(body, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("TTS API Error Response:", errorData);
            const details = errorData.error?.message || 'לא התקבל פירוט';
            throw new Error(שגיאת API בשמע: ${details});
        }

        const data = await response.json();
        console.log("TTS API Response Data:", data);

        const audioPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא התקבל מידע שמע מה-API.";
            throw new Error(ה-API לא החזיר אודיו תקין. ייתכן שהתסריט אינו תקין או שהקולות אינם זמינים. תגובת המודל: ${textResponse});
        }

        const b64 = audioPart.inlineData.data;
        // המרת Base64 ל-Uint8Array
        const pcmBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const wavBlob = createWavBlob(pcmBytes);

        // יצירת שם קובץ דינמי
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const safeTopic = topic.replace(/[^\w\s\u0590-\u05FF-]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'podcast';
        const filename = ${safeTopic}_${dateStr}.wav;

        return { blob: wavBlob, filename: filename };
    } catch (error) {
        console.error("Error generating podcast audio:", error);
        onError(שגיאה ביצירת הפודקאסט: ${error.message});
        // Ensure button is re-enabled and state is reset on error
        throw error; // Re-throw to be caught by the caller
    }
}

/
 * פונקציה שתקרא מ-index.js כדי להתחיל את תהליך יצירת הפודקאסט.
 * @param {string} script - התסריט ליצירת השמע.
 * @param {string} apiKey - מפתח ה-API של Gemini.
 * @param {string} speakersConfigValue - תצורת הדוברים שנבחרה.
 * @param {string} topic - נושא הפודקאסט.
 * @param {Function} onProgress - פונקציה לקבלת עדכוני סטטוס.
 * @param {Function} onComplete - פונקציה שתקרא כאשר השמע נוצר (מחזירה {blob, filename}).
 * @param {Function} onError - פונקציה שתקרא במקרה של שגיאה.
 */
async function generatePodcastFromScript(script, apiKey, speakersConfigValue, topic, onProgress, onComplete, onError) {
    if (!script || !apiKey || !speakersConfigValue || !topic) {
        onError("חסרים פרמטרים ליצירת הפודקאסט.");
        return;
    }

    onProgress("יוצר פודקאסט שמע, נא להמתין...");

    try {
        // בניית הפרומפט המתאים למודל ה-TTS
        // ה-duration כאן הוא קבוע (7 דקות), ניתן להעביר אותו כפרמטר אם צריך
        const ttsSystemPrompt = buildSystemPromptForTTS(7, speakersConfigValue, topic);

        // !!! הערה חשובה: הקוד לדוגמה של ה-HTML השתמש ב-fetch ישירות עם המודל TTS
        // !!! ושלח את התסריט כולו כ-text. כנראה שזה המודל שצריך להשתמש בו.
        // !!! נצטרך לוודא שה-API Endpoint והפרמטרים תואמים בדיוק.

        // --- קריאה ל-Gemini TTS API ---
        const result = await generatePodcastAudio(
            script,
            apiKey,
            speakersConfigValue,
            topic
        );

        onComplete({ blob: result.blob, filename: result.filename });

    } catch (error) {
        // שגיאות שלא נתפסו בפונקציה הפנימית
        onError(שגיאה כללית: ${error.message});
        // Ensure button is re-enabled and state is reset on error
        throw error; // Re-throw to be caught by the caller
    }
}

// Exporting the necessary functions
export { generatePodcastFromScript, buildSystemPromptForTTS };
