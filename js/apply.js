// Apply.js - Application flow with progress steps and consent

let currentStep = 0; // Start at 0 for type selection
let consentId = null;
let selectedBank = null;
let applicationType = 'personal'; // Default to personal

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (typeof requireAuth === 'function') {
    requireAuth();
  }
  
  // Update user display
  if (typeof updateUserDisplay === 'function') {
    updateUserDisplay();
  }
  
  // Initialize application type from PHP data
  if (window.phpData && window.phpData.applicationType) {
    applicationType = window.phpData.applicationType;
  }
  
  // Check if returning from OAuth flow or if already connected
  checkOAuthReturn();
  
  // Application type selection
  const selectPersonal = document.getElementById('selectPersonal');
  const selectCorporate = document.getElementById('selectCorporate');
  const backToSelector = document.getElementById('backToSelector');
  const backToSelectorCorp = document.getElementById('backToSelectorCorp');
  
  // Step navigation
  const nextStep1 = document.getElementById('nextStep1');
  const nextStepCorporate = document.getElementById('nextStepCorporate');
  const nextStep2 = document.getElementById('nextStep2');
  const backStep2 = document.getElementById('backStep2');
  const backStep3 = document.getElementById('backStep3');
  const acceptOffer = document.getElementById('acceptOffer');
  const voiceApply = document.getElementById('voiceApply');

  // Consent modal
  const confirmConsent = document.getElementById('confirmConsent');
  const cancelConsent = document.getElementById('cancelConsent');
  const consentModal = document.getElementById('consentModal');

  // Bank selection
  const bankCards = document.querySelectorAll('.bank-card');
  
  // Application Type Selection Handlers
  if (selectPersonal) {
    selectPersonal.addEventListener('click', () => {
      applicationType = 'personal';
      localStorage.setItem('applicationType', 'personal');
      
      // Update progress label
      const step1Label = document.getElementById('step1Label');
      if (step1Label) {
        step1Label.textContent = 'Personal Info';
      }
      
      // Hide selector, show personal form
      document.getElementById('step0').classList.remove('active');
      document.getElementById('step1').classList.add('active');
      
      speak('Starting personal credit application.', false);
    });
  }
  
  if (selectCorporate) {
    selectCorporate.addEventListener('click', () => {
      applicationType = 'corporate';
      localStorage.setItem('applicationType', 'corporate');
      
      // Update progress label
      const step1Label = document.getElementById('step1Label');
      if (step1Label) {
        step1Label.textContent = 'Corporate Info';
      }
      
      // Hide selector, show corporate form
      document.getElementById('step0').classList.remove('active');
      document.getElementById('step1-corporate').classList.add('active');
      
      speak('Starting corporate credit application.', false);
    });
  }
  
  // Back to selector buttons
  if (backToSelector) {
    backToSelector.addEventListener('click', () => {
      document.getElementById('step1').classList.remove('active');
      document.getElementById('step0').classList.add('active');
    });
  }
  
  if (backToSelectorCorp) {
    backToSelectorCorp.addEventListener('click', () => {
      document.getElementById('step1-corporate').classList.remove('active');
      document.getElementById('step0').classList.add('active');
    });
  }

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
  
  // Corporate Step -> Submit form and redirect to banking portal
  if (nextStepCorporate) {
    nextStepCorporate.addEventListener('click', () => {
      const form = document.getElementById('applicationForm');
      const corporateInputs = document.querySelectorAll('#step1-corporate input[required]');
      let valid = true;

      corporateInputs.forEach(input => {
        if (!input.value) {
          valid = false;
          input.style.borderColor = '#dc2626';
        } else {
          input.style.borderColor = '';
        }
      });

      if (valid) {
        speak('Saving your corporate information and connecting to bank...', false);
        
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
        speak('Please fill in all required corporate fields.', false);
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

  // Bank selection - Disabled, will redirect to external URL
  bankCards.forEach(card => {
    card.addEventListener('click', function() {
      speak('Please provide consent first to connect your bank account.', false);
    });
  });

  // Step 2 -> Step 3 (Calculate credit score and show offer)
  if (nextStep2) {
    nextStep2.addEventListener('click', async () => {
      goToStep(3);
      speak('Analyzing your financial profile.', false);

      // Start credit assessment with real calculation
      await performCreditAssessment();
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

  // Accept offer - Open smile capture modal first
  if (acceptOffer) {
    acceptOffer.addEventListener('click', () => {
      // Store credit values for later use
      const offerCreditLimit = document.getElementById('offerCreditLimit');
      const offerAPR = document.getElementById('offerAPR');
      
      if (offerCreditLimit) {
        window.pendingCreditLimit = offerCreditLimit.textContent;
      }
      if (offerAPR) {
        window.pendingAPR = offerAPR.textContent;
      }
      
      // Open smile capture modal
      openSmileCaptureModal();
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

/**
 * Perform real credit assessment using banking data
 * Calls the backend API to calculate credit limit and APR
 */
const performCreditAssessment = async () => {
  console.log('💳 Starting credit assessment...');
  
  // Animate assessment steps
  const assessments = [
    { id: 'assess1', text: 'Verifying account data...', completeText: 'Account data verified ✓', delay: 1000 },
    { id: 'assess2', text: 'Calculating credit score...', completeText: 'Credit score calculated ✓', delay: 1500 },
    { id: 'assess3', text: 'Evaluating ESG compatibility...', completeText: 'Assessment complete ✓', delay: 1200 }
  ];

  // Show progress for each assessment step
  for (let i = 0; i < assessments.length; i++) {
    const assessment = assessments[i];
    const el = document.getElementById(assessment.id);
    
    if (el) {
      // Update text to show in progress
      const span = el.querySelector('span');
      if (span) {
        span.textContent = assessment.text;
      }
    }
    
    // Wait for this step
    await new Promise(resolve => setTimeout(resolve, assessment.delay));
    
    // Mark as complete
    if (el) {
      el.classList.add('complete');
      const spinner = el.querySelector('.spinner');
      if (spinner) spinner.style.display = 'none';
      const span = el.querySelector('span');
      if (span) {
        span.textContent = assessment.completeText;
        span.style.color = '#16a34a';
        span.style.fontWeight = '600';
      }
    }
  }
  
  try {
    console.log('📡 Calling calculate_credit_score.php...');
    console.log('🏢 Application Type:', applicationType);
    
    // Call the credit score calculation API with application type
    const response = await fetch(`api/calculate_credit_score.php?application_type=${applicationType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });
    
    console.log('📥 Credit score response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const result = await response.json();
    console.log('💰 Credit assessment result:', result);
    console.log('📊 Score details:', {
      balanceScore: result.details?.balanceScore,
      transactionScore: result.details?.transactionScore,
      cashFlowScore: result.details?.cashFlowScore,
      incomeMultiplier: result.details?.incomeMultiplier,
      monthlyIncome: result.details?.monthlyIncome,
      finalScore: result.score
    });
    
    if (result.success) {
      // Show score breakdown section
      const scoreBreakdown = document.getElementById('scoreBreakdown');
      if (scoreBreakdown) {
        scoreBreakdown.removeAttribute('hidden');
      }
      
      // Populate score breakdown with animated values
      if (result.details) {
        const details = result.details;
        
        // Overall Score
        const overallScore = document.getElementById('overallScore');
        const scoreRating = document.getElementById('scoreRating');
        if (overallScore) {
          animateNumber(overallScore, 0, result.score, 1500);
        }
        if (scoreRating) {
          let rating = 'Poor';
          if (result.score >= 200) rating = 'Excellent';
          else if (result.score >= 150) rating = 'Very Good';
          else if (result.score >= 120) rating = 'Good';
          else if (result.score >= 100) rating = 'Fair';
          else if (result.score >= 80) rating = 'Below Average';
          scoreRating.textContent = rating;
        }
        
        // Balance Score (max 100)
        const balanceScoreValue = document.getElementById('balanceScoreValue');
        const balanceScoreBar = document.getElementById('balanceScoreBar');
        const balanceScoreDesc = document.getElementById('balanceScoreDesc');
        if (balanceScoreValue) {
          animateNumber(balanceScoreValue, 0, details.balanceScore, 1000);
        }
        if (balanceScoreBar) {
          setTimeout(() => {
            balanceScoreBar.style.width = `${details.balanceScore}%`;
          }, 200);
        }
        if (balanceScoreDesc && details.balanceScore) {
          let desc = 'Low account balance';
          if (details.balanceScore >= 100) desc = 'Excellent balance (AED 50,000+)';
          else if (details.balanceScore >= 80) desc = 'Very good balance (AED 30,000+)';
          else if (details.balanceScore >= 65) desc = 'Good balance (AED 20,000+)';
          else if (details.balanceScore >= 50) desc = 'Fair balance (AED 10,000+)';
          else if (details.balanceScore >= 35) desc = 'Moderate balance (AED 5,000+)';
          balanceScoreDesc.textContent = desc;
        }
        
        // Transaction Score (max 20)
        const transactionScoreValue = document.getElementById('transactionScoreValue');
        const transactionScoreBar = document.getElementById('transactionScoreBar');
        const transactionScoreDesc = document.getElementById('transactionScoreDesc');
        if (transactionScoreValue) {
          animateNumber(transactionScoreValue, 0, details.transactionScore, 1000);
        }
        if (transactionScoreBar) {
          setTimeout(() => {
            transactionScoreBar.style.width = `${(details.transactionScore / 20) * 100}%`;
          }, 400);
        }
        if (transactionScoreDesc && details.transactionScore) {
          let desc = 'Limited transaction history';
          if (details.transactionScore >= 20) desc = 'Excellent activity (100+ transactions)';
          else if (details.transactionScore >= 15) desc = 'Very active (50+ transactions)';
          else if (details.transactionScore >= 10) desc = 'Moderate activity (20+ transactions)';
          else if (details.transactionScore >= 5) desc = 'Low activity (less than 20 transactions)';
          transactionScoreDesc.textContent = desc;
        }
        
        // Cash Flow Score (range: -5 to +15, display as 0-20 for visualization)
        const cashFlowScoreValue = document.getElementById('cashFlowScoreValue');
        const cashFlowScoreBar = document.getElementById('cashFlowScoreBar');
        const cashFlowScoreDesc = document.getElementById('cashFlowScoreDesc');
        if (cashFlowScoreValue) {
          animateNumber(cashFlowScoreValue, 0, details.cashFlowScore, 1000);
          // Color code based on positive/negative
          if (details.cashFlowScore >= 10) {
            cashFlowScoreValue.style.color = '#15803d';
          } else if (details.cashFlowScore >= 0) {
            cashFlowScoreValue.style.color = '#7B2687';
          } else {
            cashFlowScoreValue.style.color = '#dc2626';
          }
        }
        if (cashFlowScoreBar) {
          setTimeout(() => {
            // Map -5 to 15 range to 0-100% (adjust for negative values)
            const percentage = ((details.cashFlowScore + 5) / 20) * 100;
            cashFlowScoreBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            if (details.cashFlowScore < 0) {
              cashFlowScoreBar.style.background = '#dc2626';
            }
          }, 600);
        }
        if (cashFlowScoreDesc && details.cashFlowScore !== undefined) {
          let desc = 'Negative cash flow (expenses exceed income)';
          if (details.cashFlowScore >= 15) desc = 'Excellent cash flow (AED 20,000+ surplus)';
          else if (details.cashFlowScore >= 10) desc = 'Very good cash flow (AED 10,000+ surplus)';
          else if (details.cashFlowScore >= 5) desc = 'Positive cash flow (income > expenses)';
          else if (details.cashFlowScore >= 0) desc = 'Balanced cash flow';
          cashFlowScoreDesc.textContent = desc;
        }
        
        // Income Multiplier (1.0 to 2.5, display as percentage)
        const incomeMultiplierValue = document.getElementById('incomeMultiplierValue');
        const incomeMultiplierBar = document.getElementById('incomeMultiplierBar');
        const incomeMultiplierDesc = document.getElementById('incomeMultiplierDesc');
        const monthlyIncomeDisplay = document.getElementById('monthlyIncomeDisplay');
        if (incomeMultiplierValue) {
          animateNumber(incomeMultiplierValue, 1, details.incomeMultiplier, 1000, 'x');
        }
        if (incomeMultiplierBar) {
          setTimeout(() => {
            // Map 1.0-2.5 to 0-100%
            const percentage = ((details.incomeMultiplier - 1) / 1.5) * 100;
            incomeMultiplierBar.style.width = `${percentage}%`;
          }, 800);
        }
        if (monthlyIncomeDisplay && details.monthlyIncome) {
          monthlyIncomeDisplay.textContent = `AED ${details.monthlyIncome.toLocaleString()}`;
        }
        if (incomeMultiplierDesc && details.incomeMultiplier) {
          let incomeDesc = '';
          if (details.incomeMultiplier >= 2.5) incomeDesc = 'Excellent income (AED 50,000+)';
          else if (details.incomeMultiplier >= 2.0) incomeDesc = 'Very good income (AED 30,000+)';
          else if (details.incomeMultiplier >= 1.7) incomeDesc = 'Good income (AED 20,000+)';
          else if (details.incomeMultiplier >= 1.4) incomeDesc = 'Fair income (AED 15,000+)';
          else if (details.incomeMultiplier >= 1.2) incomeDesc = 'Moderate income (AED 10,000+)';
          else incomeDesc = 'Basic income level';
          
          // Use different label for corporate vs personal
          const incomeLabel = applicationType === 'corporate' 
            ? 'Based on declared annual turnover (monthly avg): ' 
            : 'Based on declared monthly income: ';
          
          incomeMultiplierDesc.innerHTML = `${incomeLabel}<span id="monthlyIncomeDisplay">AED ${details.monthlyIncome.toLocaleString()}</span> - ${incomeDesc}`;
        }
      }
      
      // Assessment Reason
      const assessmentReasonText = document.getElementById('assessmentReasonText');
      const assessmentReason = document.getElementById('assessmentReason');
      if (assessmentReasonText && result.reason) {
        assessmentReasonText.textContent = result.reason;
        
        // Color code the reason box based on approval
        if (assessmentReason) {
          if (result.approved) {
            assessmentReason.style.background = '#f0fdf4';
            assessmentReason.style.borderLeftColor = '#22c55e';
            assessmentReasonText.style.color = '#15803d';
            assessmentReason.querySelector('div:first-child').style.color = '#166534';
          } else {
            assessmentReason.style.background = '#fef2f2';
            assessmentReason.style.borderLeftColor = '#ef4444';
            assessmentReasonText.style.color = '#991b1b';
            assessmentReason.querySelector('div:first-child').style.color = '#991b1b';
          }
        }
      }
      
      // Wait for animations to show
      await new Promise(resolve => setTimeout(resolve, 1800));
    }
    
    if (result.success && result.approved) {
      // Update the credit offer UI with real values
      const creditLimitEl = document.getElementById('offerCreditLimit');
      const aprEl = document.getElementById('offerAPR');
      const setupFeeEl = document.getElementById('offerSetupFee');
      
      if (creditLimitEl) {
        creditLimitEl.textContent = `AED ${result.creditLimit.toLocaleString()}`;
      }
      if (aprEl) {
        aprEl.textContent = `${result.apr}%`;
      }
      if (setupFeeEl) {
        setupFeeEl.textContent = `AED ${result.setupFee}`;
      }
      
      // Show the credit result
      const creditResult = document.getElementById('creditResult');
      const acceptOffer = document.getElementById('acceptOffer');
      
      if (creditResult) {
        creditResult.removeAttribute('hidden');
      }
      if (acceptOffer) {
        acceptOffer.disabled = false;
      }
      
      // Speak the result
      speak(`Congratulations! You have been pre-approved for a credit line of ${result.creditLimit} dirhams at ${result.apr}% APR.`);
      
      console.log('✅ Credit assessment complete:', {
        creditLimit: result.creditLimit,
        apr: result.apr,
        setupFee: result.setupFee,
        score: result.score
      });
      
    } else {
      // Handle rejection - still show score breakdown
      console.error('❌ Credit application not approved:', result.reason);
      
      const creditResult = document.getElementById('creditResult');
      if (creditResult) {
        creditResult.innerHTML = `
          <div class="result-error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem;">
            <span class="result-icon" style="font-size: 3rem;">❌</span>
            <h4 style="color: #991b1b; margin: 1rem 0;">Application Not Approved</h4>
            <p style="color: #dc2626; font-size: 1rem; margin: 0.5rem 0;">${result.reason || 'We are unable to approve your application at this time.'}</p>
            <div style="background: white; border: 1px solid #fecaca; border-radius: 6px; padding: 1rem; margin-top: 1rem; text-align: left;">
              <div style="font-size: 0.875rem; font-weight: 600; color: #991b1b; margin-bottom: 0.5rem;">📋 How to improve your chances:</div>
              <ul style="font-size: 0.875rem; color: #64748b; margin: 0; padding-left: 1.5rem;">
                <li>Maintain a minimum balance of AED 5,000</li>
                <li>Ensure regular income deposits exceed expenses</li>
                <li>Build a transaction history with consistent activity</li>
                <li>Keep your monthly income above AED 10,000</li>
              </ul>
            </div>
            <p style="margin-top: 1rem; font-size: 0.875rem; color: #64748b;">
              Your score: <strong>${result.score.toFixed(1)}</strong> (Minimum required: 80)
            </p>
          </div>
        `;
        creditResult.removeAttribute('hidden');
      }
      
      speak('We are unable to approve your credit application at this time.');
    }
    
  } catch (error) {
    console.error('❌ Error calculating credit score:', error);
    
    const creditResult = document.getElementById('creditResult');
    if (creditResult) {
      creditResult.innerHTML = `
        <div class="result-error" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem;">
          <span class="result-icon">⚠️</span>
          <h4>Assessment Error</h4>
          <p>There was an error processing your credit assessment. Please try again.</p>
        </div>
      `;
      creditResult.removeAttribute('hidden');
    }
    
    speak('There was an error processing your application. Please try again.');
  }
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
  console.log('🏢 applicationType:', phpData.applicationType);
  
  // Set application type from PHP data
  if (phpData.applicationType) {
    applicationType = phpData.applicationType;
    localStorage.setItem('applicationType', applicationType);
    
    // Update progress label
    const step1Label = document.getElementById('step1Label');
    if (step1Label) {
      step1Label.textContent = applicationType === 'corporate' ? 'Corporate Info' : 'Personal Info';
    }
  }
  
  if (phpData.oauthSuccess) {
    console.log('✅ Returning from successful OAuth flow - Will fetch banking data!');
    
    // Application data is already restored from PHP session
    console.log('Application data restored from PHP session:', phpData.applicationData);
    console.log('Corporate data restored from PHP session:', phpData.corporateData);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
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
    
    // Return to appropriate step 1 based on application type
    if (applicationType === 'corporate') {
      document.getElementById('step0')?.classList.remove('active');
      document.getElementById('step1')?.classList.remove('active');
      document.getElementById('step1-corporate')?.classList.add('active');
    } else {
      document.getElementById('step0')?.classList.remove('active');
      document.getElementById('step1')?.classList.add('active');
      document.getElementById('step1-corporate')?.classList.remove('active');
    }
  } else {
    // Check if we have existing application data (not returning from OAuth)
    if (phpData.applicationData && Object.keys(phpData.applicationData).length > 0) {
      // Has personal application data - show personal form
      applicationType = 'personal';
      document.getElementById('step0')?.classList.remove('active');
      document.getElementById('step1')?.classList.add('active');
      document.getElementById('step1-corporate')?.classList.remove('active');
    } else if (phpData.corporateData && Object.keys(phpData.corporateData).length > 0) {
      // Has corporate application data - show corporate form
      applicationType = 'corporate';
      document.getElementById('step0')?.classList.remove('active');
      document.getElementById('step1')?.classList.remove('active');
      document.getElementById('step1-corporate')?.classList.add('active');
    }
  }
  
  // If bank is already connected (from PHP session)
  if (phpData.bankConnected) {
    console.log('🔐 Bank already connected via session');
    
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

/**
 * Animate a number from start to end value
 * @param {HTMLElement} element - Element to update
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Animation duration in ms
 * @param {string} suffix - Optional suffix (e.g., 'x', '%')
 */
const animateNumber = (element, start, end, duration, suffix = '') => {
  const range = end - start;
  const startTime = performance.now();
  
  const updateNumber = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (range * easeOut);
    
    // Format number based on range
    let displayValue;
    if (suffix === 'x') {
      displayValue = current.toFixed(1) + suffix;
    } else if (Math.abs(end) >= 1) {
      displayValue = Math.round(current) + suffix;
    } else {
      displayValue = current.toFixed(1) + suffix;
    }
    
    element.textContent = displayValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      // Ensure final value is exact
      if (suffix === 'x') {
        element.textContent = end.toFixed(1) + suffix;
      } else {
        element.textContent = Math.round(end) + suffix;
      }
    }
  };
  
  requestAnimationFrame(updateNumber);
};

// Note: Popup functions removed - using redirect flow instead

// ==================== Smile Capture Modal ====================

let cameraStream = null;
let capturedPhotoDataURL = null;

function openSmileCaptureModal() {
  const modal = document.getElementById('smileCaptureModal');
  if (modal) {
    modal.removeAttribute('hidden');
    showCameraScreen('permission');
  }
}

function closeSmileCaptureModal() {
  const modal = document.getElementById('smileCaptureModal');
  if (modal) {
    modal.setAttribute('hidden', '');
  }
  stopCamera();
  resetCameraModal();
}

function showCameraScreen(screen) {
  // Hide all screens
  const screens = ['cameraPermissionScreen', 'cameraViewScreen', 'photoPreviewScreen', 'cameraErrorScreen'];
  screens.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.display = 'none';
    }
  });
  
  // Show requested screen (map short names to full IDs)
  const screenMap = {
    'permission': 'cameraPermissionScreen',
    'cameraView': 'cameraViewScreen',
    'photoPreview': 'photoPreviewScreen',
    'cameraError': 'cameraErrorScreen'
  };
  
  const targetScreenId = screenMap[screen] || screen + 'Screen';
  const targetScreen = document.getElementById(targetScreenId);
  if (targetScreen) {
    targetScreen.style.display = 'block';
  }
}

function resetCameraModal() {
  capturedPhotoDataURL = null;
  showCameraScreen('permission');
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const video = document.getElementById('cameraVideo');
  if (video) {
    video.srcObject = null;
  }
}

async function startCamera() {
  try {
    const video = document.getElementById('cameraVideo');
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } 
    });
    
    video.srcObject = cameraStream;
    showCameraScreen('cameraView');
    
    // Auto-capture after countdown
    setTimeout(() => startCountdown(), 1000);
    
  } catch (error) {
    console.error('Camera access error:', error);
    const errorMsg = document.getElementById('cameraErrorMessage');
    if (errorMsg) {
      if (error.name === 'NotAllowedError') {
        errorMsg.textContent = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg.textContent = 'No camera found on your device.';
      } else {
        errorMsg.textContent = 'Unable to access camera: ' + error.message;
      }
    }
    showCameraScreen('cameraError');
  }
}

function startCountdown() {
  const overlay = document.getElementById('countdownOverlay');
  if (!overlay) return;
  
  let count = 3;
  overlay.style.display = 'block';
  overlay.textContent = count;
  
  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      overlay.textContent = count;
    } else {
      clearInterval(countdownInterval);
      overlay.textContent = '📸';
      setTimeout(() => {
        overlay.style.display = 'none';
        capturePhoto();
      }, 300);
    }
  }, 1000);
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('photoCanvas');
  
  if (!video || !canvas) return;
  
  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get image data (but don't store it permanently)
  capturedPhotoDataURL = canvas.toDataURL('image/jpeg', 0.8);
  
  // Stop camera
  stopCamera();
  
  // Show preview
  showCameraScreen('photoPreview');
}

function proceedToStep4() {
  // Copy credit values to Step 4
  const finalCreditLimit = document.getElementById('finalCreditLimit');
  const finalAPR = document.getElementById('finalAPR');
  
  if (finalCreditLimit && window.pendingCreditLimit) {
    finalCreditLimit.textContent = window.pendingCreditLimit;
  }
  if (finalAPR && window.pendingAPR) {
    finalAPR.textContent = window.pendingAPR;
  }
  
  // Close modal
  closeSmileCaptureModal();
  
  // Navigate to step 4
  goToStep(4);
  
  // Speech feedback
  speak('Verification complete! Your credit line is now active!');
  
  // Confetti effect
  setTimeout(() => {
    document.body.style.background = 'linear-gradient(135deg, #f6f8fb 0%, #e8f5e9 100%)';
    setTimeout(() => {
      document.body.style.background = '';
      // Clear temporary photo data
      capturedPhotoDataURL = null;
    }, 3000);
  }, 500);
}

// Camera Modal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Start Camera button
  const startCameraBtn = document.getElementById('startCameraBtn');
  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
  }
  
  // Cancel Camera button
  const cancelCameraBtn = document.getElementById('cancelCameraBtn');
  if (cancelCameraBtn) {
    cancelCameraBtn.addEventListener('click', closeSmileCaptureModal);
  }
  
  // Retake Photo button
  const retakePhotoBtn = document.getElementById('retakePhotoBtn');
  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener('click', () => {
      capturedPhotoDataURL = null;
      showCameraScreen('permission');
    });
  }
  
  // Confirm Photo button
  const confirmPhotoBtn = document.getElementById('confirmPhotoBtn');
  if (confirmPhotoBtn) {
    confirmPhotoBtn.addEventListener('click', proceedToStep4);
  }
  
  // Close modal button
  const closeSmileModal = document.getElementById('closeSmileModal');
  if (closeSmileModal) {
    closeSmileModal.addEventListener('click', closeSmileCaptureModal);
  }
  
  // Retry Camera button (from error screen)
  const retryCameraBtn = document.getElementById('retryCameraBtn');
  if (retryCameraBtn) {
    retryCameraBtn.addEventListener('click', () => {
      showCameraScreen('permission');
    });
  }
  
  // Skip Camera button (from error screen)
  const skipCameraBtn = document.getElementById('skipCameraBtn');
  if (skipCameraBtn) {
    skipCameraBtn.addEventListener('click', () => {
      // Allow proceeding without photo
      proceedToStep4();
    });
  }
});

