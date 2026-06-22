function injectAIButtons() {
    const actionsMenu = document.querySelector(
        '#top-level-buttons-computed, ' +
        'ytd-menu-renderer, ' +
        '#actions-inner, ' +
        '#owner + #actions, ' +
        'ytd-watch-metadata #actions'
    );

    if (!actionsMenu) return;
    if (document.getElementById('resis-ai-btn') || document.getElementById('resis-ask-btn')) return;

    const summaryBtn = document.createElement('button');
    summaryBtn.id = 'resis-ai-btn';
    summaryBtn.style = 'background: #ff0000; color: white; border: none; padding: 0 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-family: Roboto, Arial, sans-serif; flex-shrink: 0;';

    const askBtn = document.createElement('button');
    askBtn.id = 'resis-ask-btn';
    askBtn.style = 'background: #282828; color: white; border: 1px solid #444; padding: 0 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-family: Roboto, Arial, sans-serif; flex-shrink: 0;';

    // Задаем тексты и нативные подсказки при наведении (title)
    chrome.storage.local.get(['geminiKey'], (res) => {
        const hasKey = !!res.geminiKey;
        summaryBtn.innerText = hasKey ? '📋 Краткий пересказ' : '🚀 Пересказ в Web';
        summaryBtn.title = hasKey ? 'Получить краткий пересказ видео' : 'Открыть пересказ в веб-версии Gemini';

        askBtn.innerText = hasKey ? '💬 Спросить ИИ' : '🚀 Вопрос в Web';
        askBtn.title = hasKey ? 'Задать кастомный вопрос по видео' : 'Задать вопрос в веб-версии Gemini';
    });

    // Логика кликов остается прежней...
    summaryBtn.addEventListener('click', async () => {
        const originalText = summaryBtn.innerText;
        summaryBtn.innerText = 'Парсим...';
        const transcript = await extractTranscript();
        if (!transcript) {
            summaryBtn.innerText = '❌ Нет субтитров';
            setTimeout(() => { restoreButtonTexts(); }, 3000);
            return;
        }
        chrome.storage.local.get(['geminiKey'], async (res) => {
            const key = res.geminiKey;
            const promptText = `Сделай краткую качественную выжимку (Summary) этого видео на основе его транскрипта, выдели главные тезисы таймлайна:\n\n${transcript.substring(0, 60000)}`;
            if (key) {
                summaryBtn.innerText = 'ИИ думает...';
                createOrOpenChatWindow('Выжимка видео...');
                const answer = await queryGeminiAPI(key, promptText);
                updateChatOutput(answer);
            } else {
                summaryBtn.innerText = 'Копируем...';
                if (fallbackCopyText(promptText)) {
                    alert('Текст видео скопирован в буфер! В открывшемся Gemini просто нажми Ctrl+V.');
                    window.open('https://gemini.google.com/app', '_blank');
                }
            }
            restoreButtonTexts();
        });
    });

    askBtn.addEventListener('click', async () => {
        chrome.storage.local.get(['geminiKey'], async (res) => {
            const key = res.geminiKey;
            if (key) {
                createOrOpenChatWindow('Задай любой вопрос по содержанию этого видео...');
            } else {
                const userQuestion = prompt('Введите ваш вопрос к видео:');
                if (!userQuestion) return;
                askBtn.innerText = 'Парсим...';
                const transcript = await extractTranscript();
                if (!transcript) {
                    askBtn.innerText = '❌ Нет субтитров';
                    setTimeout(() => { restoreButtonTexts(); }, 3000);
                    return;
                }
                const promptText = `Before you is a video transcript:\n\n${transcript.substring(0, 50000)}\n\nAnswer user question: ${userQuestion}`;
                askBtn.innerText = 'Копируем...';
                if (fallbackCopyText(promptText)) {
                    alert('Контекст скопирован! Нажмите Ctrl+V на сайте Gemini.');
                    window.open('https://gemini.google.com/app', '_blank');
                }
                restoreButtonTexts();
            }
        });
    });

    if (observer) observer.disconnect();
    if (actionsMenu.firstChild) {
        actionsMenu.insertBefore(askBtn, actionsMenu.firstChild);
        actionsMenu.insertBefore(summaryBtn, actionsMenu.firstChild);
    } else {
        actionsMenu.appendChild(summaryBtn);
        actionsMenu.appendChild(askBtn);
    }
    if (observer) startObserver();
}

// Восстановление дефолтных названий кнопок из локального хранилища
function restoreButtonTexts() {
    chrome.storage.local.get(['geminiKey'], (res) => {
        const hasKey = !!res.geminiKey;
        const sBtn = document.getElementById('resis-ai-btn');
        const aBtn = document.getElementById('resis-ask-btn');
        if (sBtn) {
            sBtn.innerText = hasKey ? '📋 Краткий пересказ' : '🚀 Пересказ в Web';
            sBtn.title = hasKey ? 'Получить краткий пересказ видео' : 'Открыть пересказ в веб-версии Gemini';
        }
        if (aBtn) {
            aBtn.innerText = hasKey ? '💬 Спросить ИИ' : '🚀 Вопрос в Web';
            aBtn.title = hasKey ? 'Задать кастомный вопрос по видео' : 'Задать вопрос в веб-версии Gemini';
        }
    });
}

// --- УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ЧАТА НА СТРАНИЦЕ ---
function createOrOpenChatWindow(initialText) {
    let chatDiv = document.getElementById('ursula-chat-frame');

    // Ищем контейнер основного контента левой колонки YouTube
    const primaryColumn = document.querySelector('#primary, ytd-watch-metadata, #primary-inner');
    if (!primaryColumn) return;

    if (!chatDiv) {
        chatDiv = document.createElement('div');
        chatDiv.id = 'ursula-chat-frame';
        chatDiv.className = 'ursula-chat-container';

        chatDiv.innerHTML = `
            <div class="ursula-chat-header">
                <div class="ursula-chat-title">UrsulaTube AI Assistant</div>
                <button class="ursula-chat-close" id="ursula-chat-close-btn">✕</button>
            </div>
            <div class="ursula-chat-output" id="ursula-chat-output-area">${initialText}</div>
            <div class="ursula-chat-input-box">
                <input type="text" class="ursula-chat-input" id="ursula-chat-input-field" placeholder="Например: О чем говорилось на 15-й минуте?">
                <button class="ursula-chat-send" id="ursula-chat-send-btn">Отправить</button>
            </div>
        `;

        // Вставляем фрейм чата в самый верх блока primary (или сразу под метаданные видео),
        // гарантируя полноценную ширину по размеру плеера
        primaryColumn.appendChild(chatDiv);

        document.getElementById('ursula-chat-close-btn').addEventListener('click', () => {
            chatDiv.remove();
        });

        const sendQuestion = () => {
            const inputField = document.getElementById('ursula-chat-input-field');
            const question = inputField.value.trim();
            if (!question) return;
            inputField.value = '';
            processCustomQuestion(question);
        };

        document.getElementById('ursula-chat-send-btn').addEventListener('click', sendQuestion);
        document.getElementById('ursula-chat-input-field').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendQuestion();
        });
    } else {
        document.getElementById('ursula-chat-output-area').innerText = initialText;
        chatDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function updateChatOutput(text) {
    const outputArea = document.getElementById('ursula-chat-output-area');
    if (outputArea) outputArea.innerText = text;
}

// Обработка пользовательского вопроса к видео через API
async function processCustomQuestion(question) {
    updateChatOutput('ИИ анализирует видео под твой запрос...');
    const transcript = await extractTranscript();

    if (!transcript) {
        updateChatOutput('❌ Не удалось получить транскрипт видео. Убедись, что субтитры доступны.');
        return;
    }

    chrome.storage.local.get(['geminiKey'], async (res) => {
        const key = res.geminiKey;
        if (!key) {
            updateChatOutput('❌ API ключ был удален из настроек.');
            return;
        }

        const promptText = `Перед тобой полный текст (транскрипт) видеоролика:\n\n${transcript.substring(0, 50000)}\n\nОтветь емко и по сути на следующий вопрос пользователя, используя информацию из текста: "${question}"`;
        const answer = await queryGeminiAPI(key, promptText);
        updateChatOutput(answer);
    });
}

// Базовый асинхронный fetch запрос к актуальной модели Gemini 3.1
async function queryGeminiAPI(key, fullPrompt) {
    try {
        const model = 'gemini-3.1-flash-lite';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }
        return 'Ошибка разбора ответа модели. Проверьте лимиты.';
    } catch (err) {
        console.error(err);
        return 'Ошибка сети при обращении к Gemini API.';
    }
}

// --- ВСПОМОГАТЕЛЬНЫЙ ПАРСИНГ DOM ---
function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        document.body.removeChild(textArea);
        return false;
    }
}

async function extractTranscript() {
    const getSegments = () => {
        return document.querySelectorAll(
            '.ytSectionListRendererContents yt-formatted-string, ' +
            '.ytSectionListRendererContents span, ' +
            'ytd-transcript-segment-renderer .segment-text, ' +
            '#segments-container .segment-text'
        );
    };

    let textSegments = getSegments();
    if (textSegments.length > 0) {
        return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
    }

    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander, #description-inline-expander');
    if (expandBtn && expandBtn.getAttribute('aria-expanded') !== 'true') {
        expandBtn.click();
        await new Promise(r => setTimeout(r, 500));
    }

    let transcriptBtn = document.querySelector(
        '#primary-button.ytd-video-description-transcript-section-renderer button, ' +
        'ytd-video-description-transcript-section-renderer button[aria-label="Показать текст видео"], ' +
        'ytd-video-description-transcript-section-renderer button[aria-label="Show transcript"]'
    );

    if (!transcriptBtn) {
        const chips = document.querySelectorAll('.ytChipShapeButtonReset, button[role="tab"]');
        for (let chip of chips) {
            if (chip.innerText && (chip.innerText.includes('Расшифровка') || chip.innerText.includes('Transcript'))) {
                transcriptBtn = chip;
                break;
            }
        }
    }

    if (!transcriptBtn) {
        const allButtons = document.querySelectorAll('#expanded button, ytd-structured-description-content-renderer button');
        for (let btn of allButtons) {
            if (btn.innerText && (btn.innerText.includes('Показать текст') || btn.innerText.includes('Show transcript'))) {
                transcriptBtn = btn;
                break;
            }
        }
    }

    if (transcriptBtn) {
        transcriptBtn.click();
    } else {
        return null;
    }

    for (let i = 0; i < 15; i++) {
        textSegments = getSegments();
        if (textSegments.length > 0) {
            const text = Array.from(textSegments)
                .map(el => el.innerText.trim())
                .filter(txt => txt.length > 0)
                .join(' ');
            if (text.length > 100) return text;
        }
        await new Promise(r => setTimeout(r, 200));
    }
    return null;
}

const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            injectAIButtons();
            break;
        }
    }
});

function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
}

startObserver();
setInterval(injectAIButtons, 1500);