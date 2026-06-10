function injectAIButton() {
    const actionsMenu = document.querySelector(
        '#top-level-buttons-computed, ' +
        'ytd-menu-renderer, ' +
        '#actions-inner, ' +
        '#owner + #actions, ' +
        'ytd-watch-metadata #actions'
    );

    if (!actionsMenu) return;
    if (document.getElementById('resis-ai-btn')) return;

    const aiBtn = document.createElement('button');
    aiBtn.id = 'resis-ai-btn';
    aiBtn.style = 'background: #ff0000; color: white; border: none; padding: 0 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-family: Roboto, Arial, sans-serif;';

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

    if (observer) observer.disconnect();

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
    // Функция для сбора текста из нового контейнера .ytSectionListRendererContents и старых блоков
    const getSegments = () => {
        return document.querySelectorAll(
            '.ytSectionListRendererContents yt-formatted-string, ' +
            '.ytSectionListRendererContents span, ' +
            'ytd-transcript-segment-renderer .segment-text, ' +
            '#segments-container .segment-text'
        );
    };

    // Если окно уже открыто кем-то, сразу собираем текст
    let textSegments = getSegments();
    if (textSegments.length > 0) {
        return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
    }

    // 1. Раскрываем блок описания, если он свернут
    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander, #description-inline-expander');
    if (expandBtn && expandBtn.getAttribute('aria-expanded') !== 'true') {
        expandBtn.click();
        await new Promise(r => setTimeout(r, 500));
    }

    // 2. Ищем конкретную кнопку "Показать текст видео" по твоей разметке
    let transcriptBtn = document.querySelector(
        '#primary-button.ytd-video-description-transcript-section-renderer button, ' +
        'ytd-video-description-transcript-section-renderer button[aria-label="Показать текст видео"], ' +
        'ytd-video-description-transcript-section-renderer button[aria-label="Show transcript"]'
    );

    // Запасной вариант: клик по табу-чипсу "Расшифровка видео", если YouTube подсунул такую разметку
    if (!transcriptBtn) {
        const chips = document.querySelectorAll('.ytChipShapeButtonReset, button[role="tab"]');
        for (let chip of chips) {
            if (chip.innerText && (chip.innerText.includes('Расшифровка') || chip.innerText.includes('Transcript'))) {
                transcriptBtn = chip;
                break;
            }
        }
    }

    // Запасной вариант 2: ищем кнопку по тексту "Показать текст видео" внутри всего описания
    if (!transcriptBtn) {
        const allButtons = document.querySelectorAll('#expanded button, ytd-structured-description-content-renderer button');
        for (let btn of allButtons) {
            if (btn.innerText && (btn.innerText.includes('Показать текст') || btn.innerText.includes('Show transcript'))) {
                transcriptBtn = btn;
                break;
            }
        }
    }

    // Кликаем по найденной кнопке
    if (transcriptBtn) {
        transcriptBtn.click();
    } else {
        console.log('UrsulaTube: Кнопка расшифровки не найдена в DOM.');
        return null;
    }

    // 3. Ждем появления текста в .ytSectionListRendererContents
    for (let i = 0; i < 15; i++) {
        textSegments = getSegments();
        if (textSegments.length > 0) {
            // Фильтруем пустые строки и склеиваем текст роликов
            const text = Array.from(textSegments)
                .map(el => el.innerText.trim())
                .filter(txt => txt.length > 0)
                .join(' ');
            if (text.length > 100) return text; // Убеждаемся, что распарсили именно текст роликов, а не заголовки
        }
        await new Promise(r => setTimeout(r, 200));
    }

    return null;
}

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

startObserver();
setInterval(injectAIButton, 1500);