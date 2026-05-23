# Google Chrome Extension Template

A clean, minimal boilerplate for building Google Chrome extensions using **Manifest V3**.

## Features

- Manifest V3 structure (latest Chrome extension standard)
- Background service worker
- Content script with messaging
- Popup UI with toggle switch (dark theme)
- Chrome Storage API integration
- Content script injection with fallback

## Project Structure

```
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for extension lifecycle
├── content/
│   └── content.js         # Injected into web pages
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic
├── icons/
│   └── README.md          # Icon requirements
├── .gitignore
└── README.md
```

## Getting Started

1. Clone this repository
2. Replace all `YOUR_EXTENSION_NAME`, `YOUR_EXTENSION_TAGLINE`, and `YOUR_EXTENSION_DESCRIPTION` placeholders
3. Add your icons to the `icons/` folder (16x16, 48x48, 128x128 PNG)
4. Open `chrome://extensions/` in Chrome
5. Enable **Developer mode** (top-right toggle)
6. Click **Load unpacked** and select this folder
7. The extension appears in your toolbar

## Customisation Checklist

- [ ] Update `manifest.json` — name, description, version
- [ ] Update `popup/popup.html` — title, labels
- [ ] Add your icons to `icons/`
- [ ] Modify `content/content.js` — your page manipulation logic
- [ ] Modify `background.js` — your background event handling
- [ ] Adjust permissions in `manifest.json` to only what you need

## Permissions Reference

| Permission   | Purpose                                  |
|-------------|------------------------------------------|
| `storage`   | Save user preferences across sessions    |
| `activeTab` | Access the currently active tab          |
| `scripting` | Programmatically inject content scripts  |
| `tabs`      | Query and interact with browser tabs     |

Remove any permissions you don't need — Chrome Web Store reviews are stricter with broad permissions.

## Key Patterns

### Popup ↔ Content Script Messaging

```javascript
// From popup.js — send message to content script
chrome.tabs.sendMessage(tabId, { action: 'toggleFeature', enabled: true });

// In content.js — listen for messages
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggleFeature') {
    // handle it
  }
});
```

### Persistent State with Chrome Storage

```javascript
// Save
chrome.storage.sync.set({ featureEnabled: true });

// Load
chrome.storage.sync.get(['featureEnabled'], (result) => {
  console.log(result.featureEnabled);
});
```

## Publishing to Chrome Web Store

1. Remove any dev-only files
2. Zip the extension folder (excluding `.git`, `node_modules`, etc.)
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Upload the ZIP and fill in listing details
5. Submit for review

## License

MIT
