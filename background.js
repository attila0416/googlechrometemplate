chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        chrome.storage.sync.set({
          featureEnabled: false
        });
      });
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get(['featureEnabled'], (result) => {
    const newState = !result.featureEnabled;
    chrome.storage.sync.set({ featureEnabled: newState });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getState') {
    chrome.storage.sync.get(['featureEnabled'], (result) => {
      sendResponse({ featureEnabled: result.featureEnabled });
    });
    return true;
  }
});
