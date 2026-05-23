function checkTrialStatus(user) {
  if (!user) {
    return { hasAccess: false, isPro: false, isTrialActive: false, isSubscriptionCanceled: false };
  }
  
  if (user.paid) {
    return { hasAccess: true, isPro: true, isTrialActive: false, isSubscriptionCanceled: false };
  }
  
  if (user.trialStartedAt) {
    const timeRemaining = getTrialTimeRemaining(user.trialStartedAt);
    if (timeRemaining) {
      return { hasAccess: true, isPro: false, isTrialActive: true, isSubscriptionCanceled: false };
    }
  }
  
  if (user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'past_due') {
    return { hasAccess: false, isPro: false, isTrialActive: false, isSubscriptionCanceled: true };
  }
  
  return { hasAccess: false, isPro: false, isTrialActive: false, isSubscriptionCanceled: false };
}

function getTrialTimeRemaining(trialStartedAt) {
  if (!trialStartedAt) return null;
  
  const trialDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const startTime = new Date(trialStartedAt).getTime();
  const endTime = startTime + trialDuration;
  const now = Date.now();
  const remaining = endTime - now;
  
  if (remaining <= 0) return null;
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
  
  return { days, hours, minutes, seconds };
}

function formatTrialTimeRemaining(timeRemaining) {
  if (!timeRemaining) return '';
  
  const parts = [];
  if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
  if (timeRemaining.hours > 0) parts.push(`${timeRemaining.hours}h`);
  if (timeRemaining.minutes > 0) parts.push(`${timeRemaining.minutes}m`);
  parts.push(`${timeRemaining.seconds}s`);
  
  return parts.join(' ');
}

function showEndedState(badgeText, logMessage) {
  const elements = window.popupElements;
  console.log(logMessage);
  elements.tierBadge.innerHTML = badgeText;
  elements.tierBadge.classList.add('limit-reached');
  elements.contentContainer.classList.add('limit-reached');
  
  document.querySelector('.content').style.display = 'none';
  elements.subtitle.textContent = 'YOUR_EXTENSION_TAGLINE';
  elements.featureToggle.disabled = true;
  
  const endedWrapper = document.createElement('div');
  endedWrapper.style.cssText = 'position: relative; z-index: 1;';
  endedWrapper.innerHTML = `
    <div class="trial-info" style="display: flex; flex-direction: column; gap: 12px; padding: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-bottom: 20px; position: relative; z-index: 1; text-align: left;">
      <div style="display: flex; align-items: center; gap: 10px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18dcab" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Feature benefit 1</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18dcab" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Feature benefit 2</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18dcab" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Feature benefit 3</span>
      </div>
    </div>
    <button class="login-button login-button-gold" id="upgradeButton">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
      </svg>
      Unlock Lifetime Access
    </button>
    <div class="btn-subtext" style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-align: center; margin-top: 6px;">One-time payment • No subscription</div>
  `;
  
  const existingButton = elements.upgradeButton;
  existingButton.parentNode.replaceChild(endedWrapper, existingButton);
  
  elements.upgradeButton = endedWrapper.querySelector('#upgradeButton');
  
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  const extpay = ExtPay('your-extension-id');
  elements.upgradeButton.addEventListener('click', function() {
    extpay.openPaymentPage();
  });
}

function updateUIState(user) {
  const elements = window.popupElements;
  if (!elements) return;
  
  if (!user) return;
  
  const trialStatus = checkTrialStatus(user);
  
  if (trialStatus.isPro) {
    elements.tierBadge.innerHTML = 'Pro - Full Access';
    elements.tierBadge.classList.remove('limit-reached');
    elements.contentContainer.classList.remove('limit-reached');
    elements.upgradeButton.style.display = 'none';
    document.querySelector('.content').style.display = 'block';
    elements.subtitle.textContent = 'YOUR_EXTENSION_TAGLINE';
    elements.featureToggle.disabled = false;
  } else if (trialStatus.isTrialActive) {
    const trialStartDateStr = user.trialStartedAt instanceof Date ? user.trialStartedAt.toISOString() : String(user.trialStartedAt);
    chrome.storage.sync.set({ trialActive: true, trialStartDate: trialStartDateStr });
    
    const timeRemaining = getTrialTimeRemaining(user.trialStartedAt);
    const timeText = timeRemaining ? formatTrialTimeRemaining(timeRemaining) : '';
    
    elements.tierBadge.innerHTML = `Trial - ${timeText} remaining`;
    elements.tierBadge.classList.remove('limit-reached');
    elements.contentContainer.classList.remove('limit-reached');
    elements.upgradeButton.style.display = 'flex';
    document.querySelector('.content').style.display = 'block';
    elements.subtitle.textContent = 'YOUR_EXTENSION_TAGLINE';
    elements.featureToggle.disabled = false;
  } else if (trialStatus.isSubscriptionCanceled) {
    showEndedState('Subscription Ended', 'Subscription is canceled - showing subscription cancelled UI');
  } else {
    showEndedState('Trial Ended', 'No trial or pro - showing upgrade prompt');
  }
}

function initializePayment() {
  const elements = window.popupElements;
  if (!elements) return;
  
  document.getElementById('loadingScreen').style.display = 'flex';
  
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  const extpay = ExtPay('your-extension-id');
  let trialTimerInterval = null;
  
  function updateTrialTimer() {
    extpay.getUser().then(user => {
      if (user && user.trialStartedAt && !user.paid) {
        const timeRemaining = getTrialTimeRemaining(user.trialStartedAt);
        if (timeRemaining) {
          const timeText = formatTrialTimeRemaining(timeRemaining);
          elements.tierBadge.innerHTML = `Trial - ${timeText} remaining`;
        } else {
          clearInterval(trialTimerInterval);
          updateUIState(user);
        }
      }
    });
  }
  
  extpay.getUser().then(user => {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    chrome.storage.sync.set({ isPro: user.paid || false }, function() {
      updateUIState(user);
      
      if (user && user.trialStartedAt && !user.paid) {
        clearInterval(trialTimerInterval);
        trialTimerInterval = setInterval(updateTrialTimer, 5000);
      }
    });
    
    updateProfileMenu(user);
  });
  
  extpay.onPaid.addListener(user => {
    clearInterval(trialTimerInterval);
    document.getElementById('loadingScreen').style.display = 'flex';
    chrome.storage.sync.set({ isPro: true }, function() {
      updateUIState(user);
      document.getElementById('loadingScreen').style.display = 'none';
    });
    updateProfileMenu(user);
  });
  
  extpay.onTrialStarted.addListener(user => {
    document.getElementById('loadingScreen').style.display = 'flex';
    extpay.getUser().then(updatedUser => {
      updateUIState(updatedUser);
      updateProfileMenu(updatedUser);
      document.getElementById('loadingScreen').style.display = 'none';
      
      if (updatedUser && updatedUser.trialStartedAt && !updatedUser.paid) {
        clearInterval(trialTimerInterval);
        trialTimerInterval = setInterval(updateTrialTimer, 5000);
      }
    });
  });
  
  elements.upgradeButton.addEventListener('click', function() {
    extpay.openPaymentPage();
    startPaymentPolling();
  });
}

var paymentPollInterval = null;

function startPaymentPolling() {
  if (paymentPollInterval) return;
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  var extpay = ExtPay('your-extension-id');
  paymentPollInterval = setInterval(function() {
    extpay.getUser().then(function(user) {
      if (user && user.paid) {
        clearInterval(paymentPollInterval);
        paymentPollInterval = null;
        updateUIState(user);
        updateProfileMenu(user);
      }
    }).catch(function(err) {
      console.error('Error checking payment:', err);
    });
  }, 5000);
}

function updateProfileMenu(user) {
  const loginMenuItem = document.getElementById('loginMenuItem');
  const logoutMenuItem = document.getElementById('logoutMenuItem');
  const manageSubscriptionMenuItem = document.getElementById('manageSubscriptionMenuItem');
  
  if (user && user.email) {
    loginMenuItem.style.display = 'none';
    logoutMenuItem.style.display = 'block';
    
    if (user.paid || user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'past_due') {
      manageSubscriptionMenuItem.style.display = 'block';
    } else {
      manageSubscriptionMenuItem.style.display = 'none';
    }
  } else {
    loginMenuItem.style.display = 'block';
    logoutMenuItem.style.display = 'none';
    manageSubscriptionMenuItem.style.display = 'none';
  }
}

function initializeProfileMenu() {
  const profileIcon = document.getElementById('profileIcon');
  const profileDropdown = document.getElementById('profileDropdown');
  const loginMenuItem = document.getElementById('loginMenuItem');
  const logoutMenuItem = document.getElementById('logoutMenuItem');
  const manageSubscriptionMenuItem = document.getElementById('manageSubscriptionMenuItem');
  
  // TODO: Replace 'your-extension-id' with your ExtensionPay ID
  const extpay = ExtPay('your-extension-id');
  
  profileIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = profileDropdown.style.display === 'block';
    profileDropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  document.addEventListener('click', function() {
    profileDropdown.style.display = 'none';
  });
  
  profileDropdown.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  loginMenuItem.addEventListener('click', function() {
    extpay.openLoginPage();
    profileDropdown.style.display = 'none';
  });
  
  logoutMenuItem.addEventListener('click', function() {
    profileDropdown.style.display = 'none';
    
    chrome.storage.local.clear(function() {
      chrome.storage.sync.clear(function() {
        chrome.storage.sync.set({ 
          isPro: false, 
          isLoggedIn: false
        }, function() {
          window.location.reload();
        });
      });
    });
  });
  
  manageSubscriptionMenuItem.addEventListener('click', function() {
    extpay.openPaymentPage();
    profileDropdown.style.display = 'none';
  });
}
