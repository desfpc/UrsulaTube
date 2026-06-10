function injectAIButton() {
    const actionsMenu = document.querySelector('#top-level-buttons-computed, ytd-menu-renderer, #actions-inner');
    if (!actionsMenu || document.getElementById('resis-ai-btn')) return;

    const aiBtn = document.createElement('button');
    aiBtn.id = 'resis-ai-btn';
    aiBtn.style = 'background: #ff0000; color: white; border: none; padding: 8px 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999;';

    chrome.storage.local.get(['geminiKey'], (res) => {
        aiBtn.innerText = res.geminiKey ? '⚡ Спросить встроенный ИИ' : '🚀 Отправить в Gemini Web';
    });

    aiBtn.addEventListener('click', async () => {
        const originalText = aiBtn.innerText;
        aiBtn.innerText = 'Парсим транскрипт...';

        const transcript = await extractTranscript();
        if (!transcript) {
            aiBtn.innerText = '❌ Включи субтитры на видео!';
            setTimeout(() => { aiBtn.innerText = originalText; }, 3000);
            return;
        }

        chrome.storage.local.get(['geminiKey'], async (res) => {
            const key = res.geminiKey;
            const promptText = `Сделай краткую выжимку (Summary) этого видео на основе его транскрипта:\n\n${transcript.substring(0, 60000)}`;

            if (key) {
                aiBtn.innerText = 'ИИ думает...';
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                    });
                    const data = await response.json();
                    alert(`Ответ ИИ:\n\n${data.candidates[0].content.parts[0].text}`);
                } catch (err) {
                    alert('Ошибка API. Проверь ключ в настройках.');
                }
                aiBtn.innerText = originalText;
            } else {
                aiBtn.innerText = 'Копируем в буфер...';

                // Используем фокус перед записью в буфер
                window.focus();
                navigator.clipboard.writeText(promptText).then(() => {
                    alert('Текст видео скопирован в буфер обмена! Сейчас откроется сайт Gemini — просто нажми Ctrl+V (Вставить) и Enter.');
                    window.open('https://gemini.google.com/app', '_blank');
                }).catch((err) => {
                    console.error(err);
                    alert('Не удалось скопировать автоматически. Выведи текст в консоль или разреши права.');
                });

                aiBtn.innerText = originalText;
            }
        });
    });

    // Временно отключаем обсервер, чтобы не зацикливать DOM-мутации
    observer.disconnect();
    actionsMenu.appendChild(aiBtn);
    startObserver();
}

async function extractTranscript() {
    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander');
    if (expandBtn) expandBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const transcriptBtn = document.querySelector('button[aria-label="Показать текст видео"], #primary-button ytd-button-renderer button');
    if (transcriptBtn) transcriptBtn.click();
    await new Promise(r => setTimeout(r, 800));

    const textSegments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
    if (textSegments.length === 0) return null;

    return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
}

const observer = new MutationObserver((mutations) => {
    // Триггеримся только если изменился важный узел, а не рандомный элемент
    for (let mutation of mutations) {
        if (mutation.addedNodes.length) {
            injectAIButton();
            break;
        }
    }
});

function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
}

// Запуск
startObserver();