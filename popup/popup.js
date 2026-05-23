const CONTENT_SCRIPTS = ['content/content.js'];

function injectContentScripts(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: CONTENT_SCRIPTS
  });
}

function sendMessageWithInjection(tabId, message) {
  return chrome.tabs.sendMessage(tabId, { action: 'ping' }).then(() => {
    return chrome.tabs.sendMessage(tabId, message);
  }).catch(() => {
    return injectContentScripts(tabId).then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, message).then(resolve).catch(reject);
        }, 250);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const featureToggle = document.getElementById('featureToggle');
  const statusText = document.getElementById('statusText');

  chrome.storage.sync.get(['featureEnabled'], function (result) {
    featureToggle.checked = result.featureEnabled || false;
    updateStatus(featureToggle.checked);
  });

  featureToggle.addEventListener('change', function () {
    const enabled = featureToggle.checked;
    chrome.storage.sync.set({ featureEnabled: enabled });
    updateStatus(enabled);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
        sendMessageWithInjection(tabs[0].id, {
          action: 'toggleFeature',
          enabled: enabled
        }).catch(() => {});
      }
    });
  });

  function updateStatus(enabled) {
    statusText.textContent = enabled ? 'Active' : 'Inactive';
    statusText.classList.toggle('active', enabled);
  }
});
