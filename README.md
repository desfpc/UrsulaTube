# UrsulaTube: Digital Resistance 🇪🇺🚫⚡

**UrsulaTube** — это легковесное Chrome-расширение, созданное для того, чтобы шатать трубу регуляторного дебилизма Евросоюза непосредственно на просторах YouTube.

Если вам надоело, что брюссельские чиновники из соображений «тотальной безопасности и конфиденциальности» превратили европейский интернет в лоскутное одеяло из заборов, кастрировали ИИ-функции YouTube и заставляют вас чувствовать себя специалистом второго сорта — этот инструмент для вас.

Расширение создано инженерами для инженеров, чтобы вернуть базовое право на полноценный доступ к современным технологиям, даже если вы сидите под европейским IP.

---

## 🛠 Как это работает

Проект предлагает два уровня цифрового сопротивления, переключаемых в интерфейсе:

### 🇺🇸 План А: Сетевая диверсия (Маскировка под США)
При активации этого тумблера расширение с помощью `declarativeNetRequest` API перехватывает сетевые запросы браузера к серверам YouTube «на лету» и жестко подменяет языковые и региональные заголовки:
* Форсирует `Accept-Language` в `en-US`.
* Сбрасывает куки европейского цифрового следа (`X-Goog-Visitor-Id`).
* Меняет контекст клиента, заставляя YouTube думать, что вы чистокровный американец, и разблокировать родные генеративные фичи.

### 🚀 План Б: Независимый ИИ-Ассистент (Выжимка видео через Gemini 1.5 Flash)
Если Google врубает жесткий бэкенд-геофенсинг, UrsulaTube активирует план «Б» и встраивает альтернативный ИИ-инструмент прямо в интерфейс YouTube (под плеер рядом с кнопками лайков):
1. **Режим с API-ключом (Luxury):** Вы вставляете свой личный бесплатный ключ от Google AI Studio. Расширение за секунду парсит транскрипт любого (даже часового) видео, скармливает его модели `gemini-1.5-flash` и выдает готовое саммари прямо на странице.
2. **Режим без ключа (Fallback):** Если ключа нет, расширение само соберет транскрипт, упакует его в идеальный промпт для выжимки, скопирует в буфер обмена и откроет веб-версию Gemini. Вам останется только нажать `Ctrl+V` и `Enter`.

---

## 📦 Структура репозитория

Проект построен на чистом JavaScript (Manifest V3) по принципу KISS (Keep It Simple, Stupid) — никакого Node.js/NPM хаоса, никаких тяжелых фронтенд-фреймворков и лишних зависимостей.

* `manifest.json` — конфигурация и права доступа расширения.
* `background.js` — бэкграунд-скрипт для перехвата сетевого трафика и подмены гео-заголовков.
* `content.js` — скрипт внедрения в DOM YouTube, парсинга субтитров и работы с API.
* `popup.html` — минималистичный и удобный пульт управления расширением.
* `styles.css` — нативные стили для интеграции элементов в темную и светлую темы YouTube.

---

## 🚀 Быстрый старт (Локальная установка)

Так как Брюссель явно не пропустит это в официальный Chrome Web Store, ставим расширение руками за 1 минуту:

1. Склонируйте этот репозиторий или скачайте его архивом.
2. Откройте Chrome и перейдите на страницу управления расширениями: `chrome://extensions/`.
3. В правом верхнем углу включите **Режим разработчика** (*Developer mode*).
4. Нажмите кнопку **Загрузить распакованное расширение** (*Load unpacked*) слева вверху.
5. Выберите папку с файлами проекта.
6. Открывайте YouTube, настраивайте UrsulaTube под себя и пользуйтесь технологиями без шлагбаумов.

---

## 📜 Лицензия

Проект распространяется под лицензией **WTFPL (Do What The Fuck You Want To Public License)**.
Потому что в мире и так слишком много правил. Делайте с этим кодом всё, что вам заблагорассудится.


# UrsulaTube: Digital Resistance 🇪🇺🚫⚡

**UrsulaTube** is a lightweight Chrome extension engineered to bypass the regulatory hurdles imposed by the European Union directly on YouTube.

If you are tired of EU bureaucrats crippling YouTube's native AI features under the guise of "total privacy and compliance"—leaving European users and tech professionals feeling like second-class citizens—this tool is for you.

Built by engineers for engineers, UrsulaTube restores your fundamental right to full, unrestricted access to modern technology, even if you are browsing from an EU IP address.

---

## 🛠 How It Works

The project offers two layers of digital resistance, which can be toggled instantly via the popup interface:

### 🇺🇸 Plan A: Network Diversion (US Spoofing)
When enabled, the extension utilizes the `declarativeNetRequest` API to intercept the browser's network requests to YouTube servers on the fly. It forcefully modifies the headers to wipe your European digital footprint:
* Forces `Accept-Language` to `en-US,en;q=0.9`.
* Injects a clean client name context to trick YouTube into thinking you are a US resident.
* Strips out EU-specific tracking tokens (`X-Goog-Visitor-Id`).
* **Result:** YouTube native interface unlocks its original conversational and generative AI features.

### 🚀 Plan B: Independent AI Assistant (Video Summarization via Gemini 1.5 Flash)
In case Google deploys hard backend geofencing that header modification can't solve, UrsulaTube activates Plan B. It injects a custom AI tool directly into the YouTube DOM (placed natively below the video player next to the like/share buttons):
1. **API Key Mode (Luxury):** Provide your own free API key from Google AI Studio. The extension parses the transcript of any video (even hour-long ones) in a split second, feeds it to the `gemini-1.5-flash` model, and displays a comprehensive summary right on your screen.
2. **Keyless Mode (Fallback):** If no key is provided, the extension will still scrape the video transcript, wrap it into a perfectly optimized summary prompt, copy it to your clipboard, and open Gemini Web. All you have to do is hit `Ctrl+V` and `Enter`.

---

## 📦 Project Structure

Built entirely in pure JavaScript (Manifest V3) adhering strictly to the **KISS (Keep It Simple, Stupid)** principle. No Node.js/NPM bloat, no heavy frontend frameworks, and zero external dependencies.

* `manifest.json` — Extension configuration, matching rules, and permissions.
* `background.js` — Background service worker handles network traffic interception and geo-spoofing.
* `content.js` — Content script handles DOM injection, transcript extraction, and direct API communication.
* `popup.html` — A minimalist control panel to manage your settings.
* `styles.css` — Native styling ensuring seamless UI integration with both Dark and Light YouTube themes.

---

## 🚀 Quick Start (Local Installation)

Since EU regulators would never let this pass into the official Chrome Web Store, you can install it manually in less than a minute:

1. Clone this repository or download it as a ZIP archive.
2. Open Chrome and navigate to the extension management page: `chrome://extensions/`.
3. In the top-right corner, enable **Developer mode**.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder containing the project files.
6. Open YouTube, configure your preferences in UrsulaTube, and enjoy technology without borders.

---

## 📜 License

This project is released under the **WTFPL (Do What The Fuck You Want To Public License)**.
Because the world already has too many rules. Do whatever you want with this code.