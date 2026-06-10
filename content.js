async function extractTranscript() {
    // 1. Проверяем, открыто ли уже окно расшифровки, чтобы не кликать лишний раз
    let textSegments = document.querySelectorAll(
        'ytd-transcript-segment-renderer .segment-text, ' +
        'ytd-transcript-segment-renderer .transcript-text, ' +
        '.ytd-transcript-segment-renderer #segments-container .segment-text, ' +
        'ytd-transcript-renderer #segments-container yt-formatted-string'
    );

    if (textSegments.length > 0) {
        return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
    }

    // 2. Если окно закрыто, пытаемся его развернуть. Сначала жмем "Ещё" (expand) в описании
    const expandBtn = document.querySelector('#expand, ytd-text-inline-expander, #description-inline-expander');
    if (expandBtn) expandBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // 3. Ищем кнопку открытия расшифровки по всем актуальным селекторам и атрибутам YouTube
    const transcriptBtn = document.querySelector(
        'button[aria-label="Показать текст видео"], ' +
        'button[aria-label="Show transcript"], ' +
        '#primary-button ytd-button-renderer button, ' +
        'ytd-video-description-infocards-section-renderer button, ' +
        '#action-panel-trigger button'
    );

    if (transcriptBtn) {
        transcriptBtn.click();
    } else {
        // Если явную кнопку не нашли, ищем по тексту внутри блоков описания
        const allButtons = document.querySelectorAll('ytd-structured-description-content-renderer button, ytd-button-renderer button');
        for (let btn of allButtons) {
            if (btn.innerText && (btn.innerText.includes('Показать текст') || btn.innerText.includes('Show transcript'))) {
                btn.click();
                break;
            }
        }
    }

    // 4. Цикл ожидания рендера текста (проверяем каждые 200мс в течение 3 секунд)
    for (let i = 0; i < 15; i++) {
        textSegments = document.querySelectorAll(
            'ytd-transcript-segment-renderer .segment-text, ' +
            'ytd-transcript-segment-renderer .transcript-text, ' +
            '.ytd-transcript-segment-renderer #segments-container .segment-text, ' +
            'ytd-transcript-renderer #segments-container yt-formatted-string'
        );

        if (textSegments.length > 0) {
            // Успешно распарсили
            return Array.from(textSegments).map(el => el.innerText.trim()).join(' ');
        }
        await new Promise(r => setTimeout(r, 200));
    }

    return null;
}