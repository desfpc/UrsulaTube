function injectAIButton() {
    // Расширенный список селекторов под новые А/Б тесты YouTube (включая контейнеры под лайками)
    const actionsMenu = document.querySelector(
        '#top-level-buttons-computed, ' +
        'ytd-menu-renderer, ' +
        '#actions-inner, ' +
        '#owner + #actions, ' +
        'ytd-watch-metadata #actions'
    );

    // Если меню еще не отрендерилось — уходим, сработает следующий тик интервала
    if (!actionsMenu) return;

    // Если кнопка уже на месте — ничего не делаем
    if (document.getElementById('resis-ai-btn')) return;

    const aiBtn = document.createElement('button');
    aiBtn.id = 'resis-ai-btn';
    // Нативный стиль YouTube-кнопки (подстраивается под темную/светлую тему)
    aiBtn.style = 'background: #ff0000; color: white; border: none; padding: 0 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-family: Roboto, Arial, sans-serif;';

    // Проверяем ключ и ставим правильный текст
    chrome.storage.local.get(['geminiKey'], (res) => {
        aiBtn.innerText = res.geminiKey ? '⚡ Спросить встроенный ИИ' : '🚀 Отправить в Gemini Web';
    });

    aiBtn.addEventListener('click', async () => {
        const originalText = aiBtn.innerText;
        aiBtn.innerText = 'Парсим транскрипт...';

        const transcript = await extractTranscript();
        if (!transcript) {
            aiBtn.innerText = '❌ Включи субтитры на видео!';
            setTimeout(() => {
                chrome.storage.local.get(['geminiKey'], (res) => {
                    aiBtn.innerText = res.geminiKey ? '⚡ Спросить встроенный ИИ' : '🚀 Отправить в Gemini Web';
                });
            }, 3000);
            return;
        }

        chrome.storage.local.get(['geminiKey'], async (res) => {
            const key = res.geminiKey;
            const promptText = `Сделай краткую выжимку (Summary) этого видео на основе его транскрипта:\n\n${transcript.substring(0, 60000)}`;

            if (key) {
                aiBtn.innerText = 'ИИ думает...';
                try {
                    const model = 'gemini-3.1-flash-lite';
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                    });
                    const data = await response.json();

                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        alert(`Ответ ИИ (${model}):\n\n${data.candidates[0].content.parts[0].text}`);
                    } else {
                        alert('Ошибка ответа ИИ. Возможно, неверный ключ или лимиты.');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка запроса к API. Проверь сеть или ключ.');
                }
            } else {
                aiBtn.innerText = 'Копируем...';
                const copied = fallbackCopyText(promptText);
                if (copied) {
                    alert('Текст видео скопирован в буфер обмена! Сейчас откроется сайт Gemini — просто нажми Ctrl+V и Enter.');
                    window.open('https://gemini.google.com/app', '_blank');
                } else {
                    alert('Не удалось скопировать текст автоматически.');
                }
            }

            aiBtn.innerText = key ? '⚡ Спросить встроенный ИИ' : '🚀 Отправить в Gemini Web';
        });
    });

    // Безопасная вставка кнопки без зацикливания обсервера
    if (observer) observer.disconnect();

    // Вставляем в начало или в конец меню действий в зависимости от структуры
    if (actionsMenu.firstChild) {
        actionsMenu.insertBefore(aiBtn, actionsMenu.firstChild);
    } else {
        actionsMenu.appendChild(aiBtn);
    }

    if (observer) startObserver();
}

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
    // Селекторы строк текста внутри открытого окна расшифровки
    const getSegments = () => document.querySelectorAll(
        'ytd-transcript-segment-renderer .segment-text, ' +
        'ytd-transcript-segment-renderer .transcript-text, ' +
        '.ytd-transcript-segment-renderer #segments-container .segment-text, ' +
        'ytd-transcript-renderer #segments-container yt-formatted-string, ' +
        '#segments-container .segment-text'
    );

    let textSegments = getSegments();
    if (textSegments.length > 0) {
        return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
    }

    // Разворачиваем описание ролика
    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander, #description-inline-expander, .ytd-watch-metadata #expand');
    if (expandBtn) expandBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // Ищем кнопку открытия окна расшифровки
    const transcriptBtn = document.querySelector(
        'button[aria-label="Показать текст видео"], ' +
        'button[aria-label="Show transcript"], ' +
        '#primary-button ytd-button-renderer button, ' +
        'ytd-video-description-infocards-section-renderer button, ' +
        '#action-panel-trigger button, ' +
        'ytd-structured-description-content-renderer ytd-button-renderer button'
    );

    if (transcriptBtn) {
        transcriptBtn.click();
    } else {
        // Запасной перебор кнопок по тексту
        const allButtons = document.querySelectorAll('ytd-structured-description-content-renderer button, ytd-button-renderer button');
        for (let btn of allButtons) {
            if (btn.innerText && (btn.innerText.includes('Показать текст') || btn.innerText.includes('Show transcript'))) {
                btn.click();
                break;
            }
        }
    }

    // Ждем рендера строк текста
    for (let i = 0; i < 15; i++) {
        textSegments = getSegments();
        if (textSegments.length > 0) {
            return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
        }
        await new Promise(r => setTimeout(r, 200));
    }

    return null;
}

// Перезапуск обсервера только при добавлении значимых DOM-элементов плеера
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            injectAIButton();
            break;
        }
    }
});

function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
}

// Старт
startObserver();
// Жесткий интервал-подстраховка для SPA-переходов внутри YouTube
setInterval(injectAIButton, 1500);