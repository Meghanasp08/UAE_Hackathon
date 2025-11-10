// Apply.js - Application flow with progress steps and consent

let currentStep = 1;
let consentId = null;
let selectedBank = null;

document.addEventListener('DOMContentLoaded', () => {
  // Step navigation
  const nextStep1 = document.getElementById('nextStep1');
  const nextStep2 = document.getElementById('nextStep2');
  const backStep2 = document.getElementById('backStep2');
  const backStep3 = document.getElementById('backStep3');
  const acceptOffer = document.getElementById('acceptOffer');
  const voiceApply = document.getElementById('voiceApply');

  // Consent modal
  const consentCheckbox = document.getElementById('consentCheckbox');
  const confirmConsent = document.getElementById('confirmConsent');
  const cancelConsent = document.getElementById('cancelConsent');
  const consentModal = document.getElementById('consentModal');

  // Bank selection
  const bankCards = document.querySelectorAll('.bank-card');

  // Step 1 -> Open banking popup directly
  if (nextStep1) {
    nextStep1.addEventListener('click', () => {
      const form = document.getElementById('applicationForm');
      const step1Inputs = document.querySelectorAll('#step1 input[required]');
      let valid = true;

      step1Inputs.forEach(input => {
        if (!input.value) {
          valid = false;
          input.style.borderColor = '#dc2626';
        } else {
          input.style.borderColor = '';
        }
      });

      if (valid) {
        // Store application state
        const applicationData = {
          fullName: document.getElementById('fullName')?.value,
          emiratesID: document.getElementById('emiratesID')?.value,
          email: document.getElementById('email')?.value,
          phone: document.getElementById('phone')?.value,
          monthlyIncome: document.getElementById('monthlyIncome')?.value,
          step: 1
        };
        sessionStorage.setItem('applicationData', JSON.stringify(applicationData));
        
        // Show loading overlay
        showLoadingOverlay();
        
        speak('Opening Nebras Open Banking portal.', false);
        
        // Open banking portal directly
        const bankingUrl = 'https://testapp.ariticapp.com/mercurypay/callOpenFinanceClient.php';
        openBankingPopup(bankingUrl);
      } else {
        speak('Please fill in all required fields.', false);
      }
    });
  }

  // Voice apply
  if (voiceApply) {
    voiceApply.addEventListener('click', () => {
      speak('Voice application is starting. Please answer the questions.', false);
      setTimeout(() => {
        speak('What is your full name?', false);
        // In a real implementation, this would capture voice responses
      }, 2000);
    });
  }

  // Consent checkbox - Show modal immediately when checked
  if (consentCheckbox) {
    consentCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Show consent modal immediately
        if (consentModal) {
          consentModal.removeAttribute('hidden');
        }
      }
    });
  }

  // Bank selection - Disabled, will redirect to external URL
  bankCards.forEach(card => {
    card.addEventListener('click', function() {
      speak('Please provide consent first to connect your bank account.', false);
    });
  });

  // Step 2 -> Step 3 (callback from external URL)
  // This will be triggered after returning from external bank selection
  if (nextStep2) {
    nextStep2.addEventListener('click', async () => {
      if (!consentCheckbox.checked) {
        speak('Please provide consent to continue.', false);
        return;
      }

      goToStep(3);
      speak('Connecting to your bank securely.', false);

      // Show connection status
      const connectionStatus = document.getElementById('connectionStatus');
      const statusText = document.getElementById('statusText');
      
      if (connectionStatus) {
        connectionStatus.removeAttribute('hidden');
      }

      // Simulate connection
      await simulateConnection(statusText);

      // Start credit assessment
      await simulateCreditAssessment();

      // Show result
      const creditResult = document.getElementById('creditResult');
      const acceptOffer = document.getElementById('acceptOffer');
      
      if (creditResult) {
        creditResult.removeAttribute('hidden');
      }
      if (acceptOffer) {
        acceptOffer.disabled = false;
      }

      speak('Congratulations! You have been pre-approved for a credit line of 15,250 dirhams.');
    });
  }

  // Confirm consent - not needed anymore (popup opens from Step 1)
  if (confirmConsent) {
    confirmConsent.addEventListener('click', () => {
      if (consentModal) {
        consentModal.setAttribute('hidden', '');
      }
    });
  }

  // Cancel consent
  if (cancelConsent) {
    cancelConsent.addEventListener('click', () => {
      if (consentModal) {
        consentModal.setAttribute('hidden', '');
      }
      // Uncheck the consent checkbox
      if (consentCheckbox) {
        consentCheckbox.checked = false;
      }
      speak('Consent canceled. You can try again when ready.', false);
    });
  }

  // Check if returning from external bank selection
  const urlParams = new URLSearchParams(window.location.search);
  const bankConnected = urlParams.get('bankConnected');
  const savedData = sessionStorage.getItem('applicationData');
  
  if (bankConnected === 'true' && savedData) {
    // Restore application data
    const data = JSON.parse(savedData);
    if (data.step === 2) {
      // Mark consent as given
      if (consentCheckbox) {
        consentCheckbox.checked = true;
      }
      selectedBank = 'external';
      
      // Enable next button
      if (nextStep2) {
        nextStep2.disabled = false;
      }
      
      goToStep(2);
      speak('Bank connected successfully. You can now proceed to credit assessment.', false);
      
      // Clear stored data
      sessionStorage.removeItem('applicationData');
    }
  }

  // Back buttons
  if (backStep2) {
    backStep2.addEventListener('click', () => goToStep(1));
  }
  if (backStep3) {
    backStep3.addEventListener('click', () => goToStep(2));
  }

  // Accept offer
  if (acceptOffer) {
    acceptOffer.addEventListener('click', () => {
      goToStep(4);
      speak('Your credit line is now active! You can start using it immediately.');

      // Confetti effect (simple visual feedback)
      setTimeout(() => {
        document.body.style.background = 'linear-gradient(135deg, #f6f8fb 0%, #e8f5e9 100%)';
        setTimeout(() => {
          document.body.style.background = '';
        }, 3000);
      }, 500);
    });
  }
});

// Navigate to step
const goToStep = (stepNumber) => {
  // Hide all steps
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target step
  const targetStep = document.getElementById(`step${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }

  // Update progress bar
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    if (index < stepNumber) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  currentStep = stepNumber;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Simulate bank connection
const simulateConnection = async (statusText) => {
  const steps = [
    'Connecting to your bank...',
    'Authenticating your account...',
    'Retrieving account data...',
    'Connection successful!'
  ];

  for (let i = 0; i < steps.length; i++) {
    if (statusText) {
      statusText.textContent = steps[i];
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get consent
  const consent = await mockAPI.requestConsent();
  consentId = consent.consentId;
  console.log('Consent received:', consentId);
};

// Simulate credit assessment
const simulateCreditAssessment = async () => {
  const assessments = [
    { id: 'assess1', text: 'Account data verified ✓', delay: 1500 },
    { id: 'assess2', text: 'Credit score calculated ✓', delay: 2000 },
    { id: 'assess3', text: 'Assessment complete ✓', delay: 1800 }
  ];

  for (let assessment of assessments) {
    await new Promise(resolve => setTimeout(resolve, assessment.delay));
    
    const el = document.getElementById(assessment.id);
    if (el) {
      el.classList.add('complete');
      el.querySelector('.spinner').style.display = 'none';
      const span = el.querySelector('span');
      if (span) {
        span.textContent = assessment.text;
        span.style.color = '#16a34a';
        span.style.fontWeight = '600';
      }
    }
  }

  // Call mock credit evaluation API
  const result = await mockAPI.evaluateCredit({
    name: document.getElementById('fullName')?.value,
    income: document.getElementById('monthlyIncome')?.value
  });

  console.log('Credit evaluation result:', result);
};

// Open banking portal in popup window
const openBankingPopup = (url) => {
  const width = 900;
  const height = 700;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const popup = window.open(
    url,
    'BankingPortal',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`
  );
  
  if (popup) {
    speak('Opening banking portal in new window. Please complete bank selection and return here.', false);
    
    // Focus the popup
    popup.focus();
    
    let tokensReceived = false;
    
    // Listen for messages from popup BEFORE checking if closed
    const messageHandler = (event) => {
      handleBankingMessage(event);
      if (event.data && (event.data.type === 'bankingComplete' || event.data.type === 'bankConnected')) {
        tokensReceived = true;
      }
    };
    window.addEventListener('message', messageHandler);
    
    // Check if popup is closed
    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        window.removeEventListener('message', messageHandler);
        
        // Hide loading overlay
        hideLoadingOverlay();
        
        // Wait a moment for any pending messages
        setTimeout(() => {
          // Check if tokens were received
          const storedTokens = localStorage.getItem('bankingTokens');
          
          if (storedTokens && tokensReceived) {
            // Tokens received via postMessage - notification already shown
            console.log('Tokens received via postMessage');
          } else {
            // No tokens received - show mock notification for demo
            console.log('No tokens received - using demo data');
            const mockTokens = {
              jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.token',
              authorizationCode: 'AUTH_CODE_DEMO_12345',
              accessToken: 'ACCESS_TOKEN_DEMO_67890',
              refreshToken: 'REFRESH_TOKEN_DEMO_ABCDE',
              bankName: 'Demo Bank',
              timestamp: Date.now(),
              expiresIn: 3600
            };
            
            // Store mock tokens
            localStorage.setItem('bankingTokens', JSON.stringify(mockTokens));
            
            // Show notification
            showTokenStorageNotification(mockTokens);
          }
        }, 500);
      }
    }, 500);
    
  } else {
    hideLoadingOverlay();
    alert('Popup was blocked. Please allow popups for this site and try again.');
    speak('Popup was blocked. Please allow popups and try again.', false);
  }
};

// Handle banking messages
const handleBankingMessage = (event) => {
  // Verify origin for security
  if (event.origin !== 'https://testapp.ariticapp.com') {
    console.warn('Received message from untrusted origin:', event.origin);
    return;
  }
  
  const data = event.data;
  
  // Handle banking completion with tokens
  if (data.type === 'bankingComplete' || (data.type === 'bankConnected' && data.success)) {
    // Store banking tokens in localStorage
    const bankingTokens = {
      jwt: data.jwt || null,
      authorizationCode: data.authorizationCode || data.code || null,
      accessToken: data.accessToken || null,
      refreshToken: data.refreshToken || null,
      bankName: data.bankName || 'Connected Bank',
      timestamp: Date.now(),
      expiresIn: data.expiresIn || 3600
    };
    
    // Save to localStorage
    localStorage.setItem('bankingTokens', JSON.stringify(bankingTokens));
    console.log('Banking tokens stored successfully:', bankingTokens);
    
    // Mark consent as given and bank as selected
    const consentCheckbox = document.getElementById('consentCheckbox');
    if (consentCheckbox) {
      consentCheckbox.checked = true;
    }
    selectedBank = data.bankName || 'external';
    
    // Show token storage notification
    showTokenStorageNotification(bankingTokens);
  }
};



// Show notification that tokens are stored
const showTokenStorageNotification = (tokens) => {
  // Create notification modal
  const notificationModal = document.createElement('div');
  notificationModal.id = 'tokenNotificationModal';
  notificationModal.className = 'modal';
  notificationModal.setAttribute('role', 'dialog');
  notificationModal.setAttribute('aria-modal', 'true');
  
  // Add celebration animation styles
  const celebrationStyles = document.createElement('style');
  celebrationStyles.textContent = `
    @keyframes celebrate {
      0%, 100% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.2) rotate(-10deg); }
      75% { transform: scale(1.2) rotate(10deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    @keyframes slideInScale {
      0% { transform: scale(0.5); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes confetti {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
    }
    .celebration-emoji {
      display: inline-block;
      animation: celebrate 1s ease-in-out infinite;
      font-size: 3rem;
      margin: 0 0.3rem;
    }
    .celebration-emoji:nth-child(2) { animation-delay: 0.2s; }
    .celebration-emoji:nth-child(3) { animation-delay: 0.4s; }
    .celebration-emoji:nth-child(4) { animation-delay: 0.6s; }
    .celebration-emoji:nth-child(5) { animation-delay: 0.8s; }
    .float-animation {
      animation: float 2s ease-in-out infinite;
    }
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #F9A826;
      animation: confetti 3s ease-out forwards;
    }
  `;
  document.head.appendChild(celebrationStyles);
  
  notificationModal.innerHTML = `
    <div class="modal-content" style="max-width: 550px; position: relative; overflow: hidden;">
      <div class="modal-header" style="background: linear-gradient(135deg, #7B2687 0%, #B83280 50%, #F9A826 100%); color: white; border-radius: 12px 12px 0 0; padding: 2rem;">
        <h3 style="margin: 0; color: white; font-size: 1.8rem; animation: slideInScale 0.6s ease-out;">Success!</h3>
      </div>
      <div class="modal-body" style="padding: 2.5rem 2rem; text-align: center; background: linear-gradient(180deg, #ffffff 0%, #f9f5ff 100%);">
        <div style="margin-bottom: 1.5rem;">
    
          <span class="celebration-emoji">🎉</span>
    
        </div>
        <p style="font-size: 2rem; color: #7B2687; margin-bottom: 1rem; font-weight: 800; animation: slideInScale 0.7s ease-out;">
          Thank You for Your Consent! 
        </p>
        <p style="font-size: 1.3rem; color: #2B0B3A; margin-bottom: 1rem; font-weight: 600; animation: slideInScale 0.8s ease-out;">
          🙏 We appreciate your trust
        </p>
        <div class="float-animation" style="font-size: 4rem; margin: 1rem 0;">
          ✅
        </div>
        <p style="font-size: 1.15rem; color: #5B3A6C; margin-bottom: 0.5rem; animation: slideInScale 0.9s ease-out;">
          Your banking credentials have been <strong>securely connected</strong>
        </p>
        <p style="font-size: 1rem; color: #B83280; font-weight: 600; animation: slideInScale 1s ease-out;">
          🔒 Your data is safe with us
        </p>
      </div>
      <div class="modal-body" style="padding: 0 2rem 2.5rem 2rem;">
        <button class="btn-primary" id="proceedToCreditAssessment" style="
          width: 100%; 
          padding: 16px; 
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(90deg, #7B2687 0%, #B83280 100%);
          border: none;
          box-shadow: 0 4px 15px rgba(123, 38, 135, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(123, 38, 135, 0.6)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(123, 38, 135, 0.4)';">
          Proceed to Credit Assessment →
        </button>
      </div>
    </div>
  `;
  
  // Add confetti effect
  const modalContent = notificationModal.querySelector('.modal-content');
  const colors = ['#7B2687', '#B83280', '#F9A826', '#E0CFEA', '#16a34a'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    modalContent.appendChild(confetti);
  }
  
  document.body.appendChild(notificationModal);
  notificationModal.removeAttribute('hidden');
  
  // Handle proceed button
  const proceedBtn = document.getElementById('proceedToCreditAssessment');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', async () => {
      notificationModal.remove();
      
      // Proceed to Step 3
      goToStep(3);
      speak('Proceeding to credit assessment.', false);

      // Show connection status
      const connectionStatus = document.getElementById('connectionStatus');
      const statusText = document.getElementById('statusText');
      
      if (connectionStatus) {
        connectionStatus.removeAttribute('hidden');
      }

      // Simulate connection
      await simulateConnection(statusText);

      // Start credit assessment
      await simulateCreditAssessment();

      // Show result
      const creditResult = document.getElementById('creditResult');
      const acceptOffer = document.getElementById('acceptOffer');
      
      if (creditResult) {
        creditResult.removeAttribute('hidden');
      }
      if (acceptOffer) {
        acceptOffer.disabled = false;
      }

      speak('Congratulations! You have been pre-approved for a credit line of 15,250 dirhams.');
    });
  }
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('tokenNotificationModal')) {
      proceedBtn?.click();
    }
  }, 10000);
  
  speak('Banking credentials securely stored.', false);
};

// Show loading overlay
const showLoadingOverlay = () => {
  let overlay = document.getElementById('loadingOverlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(123, 38, 135, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(5px);
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; color: white;">
        <div class="spinner" style="
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem auto;
        "></div>
        <h2 style="font-size: 1.8rem; margin-bottom: 1rem; font-weight: 700;">
          Connecting to Nebras Banking Portal
        </h2>
        <p style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 0.5rem;">
          Please complete bank authentication in the popup window
        </p>
        <p style="font-size: 0.95rem; opacity: 0.7;">
          This page will automatically proceed once you're done
        </p>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add spin animation if not exists
    if (!document.getElementById('spinKeyframes')) {
      const style = document.createElement('style');
      style.id = 'spinKeyframes';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  overlay.style.display = 'flex';
};

// Hide loading overlay
const hideLoadingOverlay = () => {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
};
