// Load ExtPay library for service worker
importScripts('extpay.js');

// TODO: Replace 'your-extension-id' with your ExtensionPay ID from extensionpay.com
const extpay = ExtPay('your-extension-id');
extpay.startBackground();

// Check user payment status on startup
extpay.getUser().then(user => {
  chrome.storage.sync.set({ isPro: user.paid });
});

// Listen for payment events
extpay.onPaid.addListener(user => {
  chrome.storage.sync.set({ isPro: true });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'userUpgraded' }).catch(() => {});
    });
  });
});

// Listen for trial started events
extpay.onTrialStarted.addListener(user => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'trialStarted' }).catch(() => {});
    });
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        chrome.storage.sync.set({
          featureEnabled: false,
          isPro: false,
          isLoggedIn: false
        });
      });
    });
  } else if (details.reason === 'update') {
    chrome.storage.sync.get(['isLoggedIn'], (result) => {
      if (!result.hasOwnProperty('isLoggedIn')) {
        chrome.storage.sync.set({ isLoggedIn: false });
      }
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
