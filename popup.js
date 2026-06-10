document.addEventListener('DOMContentLoaded', () => {
    const planACheck = document.getElementById('planA');
    const apiKeyInput = document.getElementById('apiKey');

    // Загружаем сохраненные данные
    chrome.storage.local.get(['planAEnabled', 'geminiKey'], (res) => {
        planACheck.checked = !!res.planAEnabled;
        apiKeyInput.value = res.geminiKey || '';
    });

    // Следим за тумблером Плана А
    planACheck.addEventListener('change', (e) => {
        chrome.storage.local.set({ planAEnabled: e.target.checked }, () => {
            // Отправляем сигнал в background.js, чтобы применить/снять правила
            chrome.runtime.sendMessage({ action: "togglePlanA", value: e.target.checked });
        });
    });

    // Следим за вводом API ключа
    apiKeyInput.addEventListener('input', (e) => {
        chrome.storage.local.set({ geminiKey: e.target.value.trim() });
    });
});