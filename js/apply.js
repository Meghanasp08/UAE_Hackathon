// Apply.js - Application flow with progress steps and consent

let currentStep = 1;
let consentId = null;
let selectedBank = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (typeof requireAuth === 'function') {
    requireAuth();
  }
  
  // Update user display
  if (typeof updateUserDisplay === 'function') {
    updateUserDisplay();
  }
  
  // Check if returning from OAuth flow or if already connected
  checkOAuthReturn();
  
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

  // Step 1 -> Submit form and redirect to banking portal
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
        speak('Saving your information and connecting to bank...', false);
        
        // Submit form data to PHP session and redirect to OAuth
        const formData = new FormData(form);
        
        fetch(window.location.href, {
          method: 'POST',
          body: formData
        }).then(() => {
          // Redirect to banking OAuth flow
          window.location.href = 'https://mercurypay.ariticapp.com/mercurypay/callOpenFinanceClient.php';
        }).catch(error => {
          console.error('Error saving form data:', error);
          // Fallback: direct redirect
          window.location.href = 'https://mercurypay.ariticapp.com/mercurypay/callOpenFinanceClient.php';
        });
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

// Check if returning from OAuth flow
const checkOAuthReturn = () => {
  // Use PHP data passed to JavaScript
  const phpData = window.phpData || {};
  
  console.log('🔍 checkOAuthReturn() called');
  console.log('📋 phpData:', phpData);
  console.log('✅ oauthSuccess:', phpData.oauthSuccess);
  console.log('❌ oauthError:', phpData.oauthError);
  console.log('🔐 bankConnected:', phpData.bankConnected);
  
  if (phpData.oauthSuccess) {
    console.log('✅ Returning from successful OAuth flow - Will fetch banking data!');
    
    // Application data is already restored from PHP session
    console.log('Application data restored from PHP session:', phpData.applicationData);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Mark consent as given
    const consentCheckbox = document.getElementById('consentCheckbox');
    if (consentCheckbox) {
      consentCheckbox.checked = true;
    }
    selectedBank = 'external';
    
    // Go to Step 2 and fetch banking data
    goToStep(2);
    console.log('🚀 About to call fetchBankingData()...');
    fetchBankingData();
    
  } else if (phpData.oauthError) {
    console.error('OAuth error:', phpData.oauthError);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Show error message
    if (typeof speak === 'function') {
      speak('Bank connection failed. Please try again.', false);
    }
    alert('Failed to connect to bank: ' + phpData.oauthError);
    
    // Stay on step 1
    goToStep(1);
  }
  
  // If bank is already connected (from PHP session)
  if (phpData.bankConnected) {
    console.log('🔐 Bank already connected via session');
    
    const consentCheckbox = document.getElementById('consentCheckbox');
    if (consentCheckbox) {
      consentCheckbox.checked = true;
    }
    selectedBank = 'external';
    
    // Enable next step button
    const nextStep2 = document.getElementById('nextStep2');
    if (nextStep2) {
      nextStep2.disabled = false;
    }
  }
};

/**
 * Fetch banking data from Open Banking APIs
 * Shows progress UI and displays summary when complete
 */
const fetchBankingData = async () => {
  console.log('🚀 fetchBankingData() called - Starting to fetch banking data...');
  
  // Show fetching progress UI
  const fetchingProgress = document.getElementById('fetchingDataProgress');
  const bankingSummary = document.getElementById('bankingDataSummary');
  const fetchError = document.getElementById('fetchErrorDisplay');
  const nextBtn = document.getElementById('nextStep2');
  
  console.log('UI Elements found:', {
    fetchingProgress: !!fetchingProgress,
    bankingSummary: !!bankingSummary,
    fetchError: !!fetchError,
    nextBtn: !!nextBtn
  });
  
  if (fetchingProgress) {
    fetchingProgress.removeAttribute('hidden');
    console.log('✅ Showing fetching progress UI');
  }
  if (bankingSummary) {
    bankingSummary.setAttribute('hidden', '');
  }
  if (fetchError) {
    fetchError.setAttribute('hidden', '');
  }
  
  // Animate progress steps
  const steps = ['fetchStep1', 'fetchStep2', 'fetchStep3', 'fetchStep4'];
  const stepMessages = [
    'Retrieving accounts... ✓',
    'Fetching account details... ✓',
    'Loading balance information... ✓',
    'Analyzing transactions... ✓'
  ];
  
  // Simulate step-by-step progress with delays
  let currentStepIndex = 0;
  const progressInterval = setInterval(() => {
    if (currentStepIndex < steps.length) {
      const stepEl = document.getElementById(steps[currentStepIndex]);
      if (stepEl) {
        const icon = stepEl.querySelector('.fetch-icon');
        const text = stepEl.querySelector('span:last-child');
        if (icon) icon.textContent = '✅';
        if (text) text.textContent = stepMessages[currentStepIndex];
        stepEl.style.color = '#15803d';
        stepEl.style.fontWeight = '600';
      }
      currentStepIndex++;
    }
  }, 800);
  
  try {
    // Call the API endpoint
    const apiUrl = 'api/fetch_banking_data.php';
    console.log('📡 Making AJAX call to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin' // Include session cookies
    });
    
    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    // Clear progress interval
    clearInterval(progressInterval);
    
    // Mark all steps as complete
    steps.forEach((stepId, index) => {
      const stepEl = document.getElementById(stepId);
      if (stepEl) {
        const icon = stepEl.querySelector('.fetch-icon');
        const text = stepEl.querySelector('span:last-child');
        if (icon) icon.textContent = '✅';
        if (text) text.textContent = stepMessages[index];
        stepEl.style.color = '#15803d';
        stepEl.style.fontWeight = '600';
      }
    });
    
    // Wait a moment to show completion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (data.success) {
      console.log('✅ Banking data fetched successfully:', data);
      
      // Hide fetching progress
      if (fetchingProgress) {
        fetchingProgress.setAttribute('hidden', '');
      }
      
      // Show summary
      if (bankingSummary) {
        bankingSummary.removeAttribute('hidden');
      }
      
      // Update summary values
      const accountsCount = document.getElementById('summaryAccountsCount');
      const balance = document.getElementById('summaryBalance');
      const transactions = document.getElementById('summaryTransactions');
      
      if (accountsCount && data.summary.accounts_count !== undefined) {
        accountsCount.textContent = data.summary.accounts_count;
      }
      if (balance && data.summary.total_balance) {
        balance.textContent = `${data.summary.currency} ${data.summary.total_balance}`;
      }
      if (transactions && data.summary.transactions_count !== undefined) {
        transactions.textContent = data.summary.transactions_count;
      }
      
      // Enable next button
      if (nextBtn) {
        nextBtn.disabled = false;
      }
      
      if (typeof speak === 'function') {
        speak('Your banking data has been successfully retrieved.', false);
      }
      
    } else {
      throw new Error(data.error || 'Failed to fetch banking data');
    }
    
  } catch (error) {
    console.error('❌ Error fetching banking data:', error);
    
    // Clear progress interval
    clearInterval(progressInterval);
    
    // Hide fetching progress
    if (fetchingProgress) {
      fetchingProgress.setAttribute('hidden', '');
    }
    
    // Show error
    if (fetchError) {
      fetchError.removeAttribute('hidden');
      const errorMsg = document.getElementById('fetchErrorMessage');
      if (errorMsg) {
        errorMsg.textContent = error.message || 'Failed to fetch banking data. Please try again.';
      }
    }
    
    if (typeof speak === 'function') {
      speak('Failed to retrieve banking data. Please try reconnecting.', false);
    }
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

// Note: Popup functions removed - using redirect flow instead
