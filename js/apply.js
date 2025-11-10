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

  // Step 1 -> Step 2
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
        goToStep(2);
        speak('Please connect your bank account to continue.', false);
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

  // Consent checkbox
  if (consentCheckbox) {
    consentCheckbox.addEventListener('change', (e) => {
      if (nextStep2) {
        nextStep2.disabled = !e.target.checked || !selectedBank;
      }
    });
  }

  // Bank selection
  bankCards.forEach(card => {
    card.addEventListener('click', function() {
      // Remove previous selection
      bankCards.forEach(c => c.classList.remove('selected'));
      
      // Select this bank
      this.classList.add('selected');
      selectedBank = this.dataset.bank;

      // Enable next button if consent given
      if (nextStep2 && consentCheckbox && consentCheckbox.checked) {
        nextStep2.disabled = false;
      }

      speak(`Selected ${this.textContent.trim()}.`, false);
    });
  });

  // Step 2 -> Step 3 (with consent flow)
  if (nextStep2) {
    nextStep2.addEventListener('click', async () => {
      if (!selectedBank || !consentCheckbox.checked) {
        speak('Please select a bank and provide consent.', false);
        return;
      }

      // Show consent modal
      if (consentModal) {
        consentModal.removeAttribute('hidden');
      }
    });
  }

  // Confirm consent
  if (confirmConsent) {
    confirmConsent.addEventListener('click', async () => {
      if (consentModal) {
        consentModal.setAttribute('hidden', '');
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

  // Cancel consent
  if (cancelConsent) {
    cancelConsent.addEventListener('click', () => {
      if (consentModal) {
        consentModal.setAttribute('hidden', '');
      }
      speak('Consent canceled. You can try again when ready.', false);
    });
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
