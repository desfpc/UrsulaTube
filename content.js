function injectAIButton() {
    const actionsMenu = document.querySelector('#top-level-buttons-computed, ytd-menu-renderer, #actions-inner');
    if (!actionsMenu || document.getElementById('resis-ai-btn')) return;

    const aiBtn = document.createElement('button');
    aiBtn.id = 'resis-ai-btn';
    aiBtn.style = 'background: #ff0000; color: white; border: none; padding: 8px 16px; margin-left: 8px; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 13px; z-index: 9999;';

    // Динамически проверяем наличие ключа при отрисовке кнопки
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
                // План Б: Встроенный ИИ на актуальной модели Gemini 3
                aiBtn.innerText = 'ИИ думает...';
                try {
                    // Используем самую актуальную и экономную модель серии 3
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
                        alert('Ошибка ответа ИИ. Возможно, неверный ключ или модель недоступна.');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка запроса к API. Проверь сеть или ключ.');
                }
            } else {
                // Фолбек: Отправка на сайт Gemini Web
                aiBtn.innerText = 'Копируем...';

                const copied = fallbackCopyText(promptText);
                if (copied) {
                    alert('Текст видео скопирован в буфер обмена! Сейчас откроется сайт Gemini — просто нажми Ctrl+V и Enter.');
                    window.open('https://gemini.google.com/app', '_blank');
                } else {
                    alert('Не удалось скопировать текст автоматически.');
                }
            }

            // Восстанавливаем корректное имя кнопки
            aiBtn.innerText = key ? '⚡ Спросить встроенный ИИ' : '🚀 Отправить в Gemini Web';
        });
    });

    // Избегаем бесконечного цикла MutationObserver
    if (observer) observer.disconnect();
    actionsMenu.appendChild(aiBtn);
    if (observer) startObserver();
}

// Надежный хак для записи в буфер без блокировок Хрома
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
    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander');
    if (expandBtn) expandBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const transcriptBtn = document.querySelector('button[aria-label="Показать текст видео"], #primary-button ytd-button-renderer button, ytd-video-description-infocards-section-renderer button');
    if (transcriptBtn) transcriptBtn.click();

    for (let i = 0; i < 15; i++) {
        const segments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
        if (segments.length > 0) {
            return Array.from(segments).map(el => el.innerText.trim()).join(' ');
        }
        await new Promise(r => setTimeout(r, 200));
    }
    return null;
}

const observer = new MutationObserver((mutations) => {
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

startObserver();
// Подстраховка для SPA переходов
setInterval(injectAIButton, 2000);