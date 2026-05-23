(function () {
  'use strict';

  function applyFeature(enabled) {
    if (enabled) {
      document.documentElement.setAttribute('data-extension-active', 'true');
    } else {
      document.documentElement.removeAttribute('data-extension-active');
    }
  }

  function init() {
    chrome.storage.sync.get(['featureEnabled'], function (result) {
      applyFeature(result.featureEnabled || false);
    });
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'ping') {
      return true;
    }
    if (request.action === 'toggleFeature') {
      applyFeature(request.enabled);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
