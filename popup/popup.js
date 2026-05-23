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
  }).catch((err) => {
    return injectContentScripts(tabId).then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, message).then(resolve).catch((err2) => {
            console.error('Still failed after injection:', err2);
            reject(err2);
          });
        }, 250);
      });
    }).catch((injectErr) => {
      if (injectErr.message && (
        injectErr.message.includes('Cannot access') ||
        injectErr.message.includes('chrome://') ||
        injectErr.message.includes('edge://') ||
        injectErr.message.includes('chrome-extension://')
      )) {
        return Promise.resolve();
      }
      throw injectErr;
    });
  });
}

function isOnLoginPage() {
  const loginScreen = document.getElementById('loginScreen');
  return loginScreen && loginScreen.style.display !== 'none';
}

function isInRestrictedState() {
  if (isOnLoginPage()) {
    return true;
  }
  
  const tierBadge = document.getElementById('tierBadge');
  if (tierBadge) {
    const badgeText = tierBadge.innerHTML.toLowerCase();
    if (badgeText.includes('trial ended') || badgeText.includes('subscription ended')) {
      return true;
    }
  }
  
  return false;
}

document.addEventListener('DOMContentLoaded', function() {
  window.popupElements = {
    featureToggle: document.getElementById('featureToggle'),
    contentContainer: document.querySelector('.container'),
    tierBadge: document.getElementById('tierBadge'),
    upgradeButton: document.getElementById('upgradeButtonOnTrialPage'),
    subtitle: document.getElementById('subtitle')
  };
  
  initializeStarParticles();
  
  // Check storage first (instant) for fast UI, but always verify with ExtPay API
  chrome.storage.sync.get(['isLoggedIn'], function(result) {
    if (result.isLoggedIn) {
      checkLoginStatus().then(function(isLoggedIn) {
        if (isLoggedIn) {
          showMainUI();
        } else {
          chrome.storage.sync.set({ isLoggedIn: false }, function() {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('mainContent').style.display = 'none';
            initializeLoginScreen();
          });
        }
      });
    } else {
      checkLoginStatus().then(function(isLoggedIn) {
        if (isLoggedIn) {
          transitionToMainUI();
        } else {
          document.getElementById('loadingScreen').style.display = 'none';
          document.getElementById('loginScreen').style.display = 'flex';
          document.getElementById('mainContent').style.display = 'none';
          initializeLoginScreen();
        }
      });
    }
  });
});

function checkLoginStatus() {
  return new Promise((resolve) => {
    // TODO: Replace 'your-extension-id' with your ExtensionPay ID
    const extpay = ExtPay('your-extension-id');
    extpay.getUser().then(user => {
      const isLoggedIn = user && (user.email || user.trialStartedAt || user.paid);
      resolve(isLoggedIn);
    }).catch(() => {
      resolve(false);
    });
  });
}

function showMainUI() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('loadingScreen').style.display = 'flex';
  
  const upgradeOverlay = document.querySelector('.upgrade-overlay');
  if (upgradeOverlay) {
    upgradeOverlay.style.display = 'none';
  }
  
  initializePayment();
  initializeProfileMenu();
  setupFeatureToggle();
  loadSavedStates();
}

function transitionToMainUI() {
  chrome.storage.sync.set({
    isLoggedIn: true,
    featureEnabled: false
  }, function() {
    showMainUI();
  });
}

var loginPollInterval = null;

function startLoginPolling() {
  if (loginPollInterval) return;
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  var extpay = ExtPay('your-extension-id');
  loginPollInterval = setInterval(function() {
    extpay.getUser().then(function(user) {
      if (user && (user.trialStartedAt || user.paid || user.subscriptionStatus === 'past_due' || user.subscriptionStatus === 'canceled')) {
        clearInterval(loginPollInterval);
        loginPollInterval = null;
        transitionToMainUI();
      }
    }).catch(function(err) {
      console.error('Error checking login:', err);
    });
  }, 5000);
}

function initializeLoginScreen() {
  var startTrialButton = document.getElementById('startTrialButton');
  var unlockProButton = document.getElementById('unlockProButton');
  var loginButton = document.getElementById('loginButton');
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  var extpay = ExtPay('your-extension-id');
  
  extpay.onTrialStarted.addListener(function(user) {
    clearInterval(loginPollInterval);
    loginPollInterval = null;
    transitionToMainUI();
  });
  
  extpay.onPaid.addListener(function(user) {
    clearInterval(loginPollInterval);
    loginPollInterval = null;
    transitionToMainUI();
  });
  
  startTrialButton.addEventListener('click', function() {
    extpay.openTrialPage('7 days');
    startLoginPolling();
  });
  
  unlockProButton.addEventListener('click', function() {
    extpay.openPaymentPage();
    startLoginPolling();
  });
  
  loginButton.addEventListener('click', function() {
    extpay.openLoginPage();
    startLoginPolling();
  });
}

function setupFeatureToggle() {
  const elements = window.popupElements;
  if (!elements || !elements.featureToggle) return;
  
  elements.featureToggle.addEventListener('change', function() {
    const enabled = elements.featureToggle.checked;
    
    if (enabled && isInRestrictedState()) {
      elements.featureToggle.checked = false;
      return;
    }
    
    if (enabled) {
      elements.contentContainer.classList.add('active');
    } else {
      elements.contentContainer.classList.remove('active');
    }
    
    chrome.storage.sync.set({ featureEnabled: enabled });
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
        sendMessageWithInjection(tabs[0].id, {
          action: 'toggleFeature',
          enabled: enabled
        }).catch(() => {});
      }
    });
  });
}

function loadSavedStates() {
  const elements = window.popupElements;
  if (!elements) return;
  
  chrome.storage.sync.get(['featureEnabled'], function(result) {
    const enabled = result.featureEnabled || false;
    elements.featureToggle.checked = enabled;
    
    if (enabled) {
      elements.contentContainer.classList.add('active');
    }
  });
}
