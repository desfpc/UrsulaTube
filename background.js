const USA_RULES = [
    {
        id: 1,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                { header: "Accept-Language", operation: "set", value: "en-US,en;q=0.9" },
                { header: "X-YouTube-Client-Name", operation: "set", value: "1" },
                { header: "X-Goog-Visitor-Id", operation: "remove" }
            ]
        },
        condition: {
            urlFilter: "*://*.youtube.com/*",
            resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "script"]
        }
    }
];

function updateRules(enable) {
    if (enable) {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: USA_RULES,
            removeRuleIds: [1]
        });
        console.log("UrsulaTube: План А активен (США).");
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        });
        console.log("UrsulaTube: План А деактивирован.");
    }
}

// Проверяем сохраненное состояние при старте сервис-воркера
chrome.storage.local.get(['planAEnabled'], (res) => {
    updateRules(!!res.planAEnabled);
});

// Слушаем сообщения из попапа
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "togglePlanA") {
        updateRules(message.value);
    }
});