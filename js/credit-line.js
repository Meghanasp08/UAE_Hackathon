// Credit-line.js - SmartPay rules and credit management

document.addEventListener('DOMContentLoaded', () => {
  // Check URL parameters for automatic modal opening
  const urlParams = new URLSearchParams(window.location.search);
  const shouldOpenTermLoan = urlParams.get('openTermLoan');
  
  if (shouldOpenTermLoan === 'true') {
    // Wait a bit for the page to fully load, then open modal
    setTimeout(() => {
      openTermLoanModal();
    }, 500);
  }
  // Auto-sweep toggle
  const autoSweepToggle = document.getElementById('autoSweepToggle');
  const sweepSettings = document.getElementById('sweepSettings');
  const saveSweepSettings = document.getElementById('saveSweepSettings');

  // Transaction buttons
  const withdrawBtn = document.getElementById('withdrawBtn');
  const repayBtn = document.getElementById('repayBtn');
  const transferBtn = document.getElementById('transferBtn');
  const termLoanBtn = document.getElementById('termLoanBtn');

  // Rule modal
  const addRuleBtn = document.getElementById('addRuleBtn');
  const ruleModal = document.getElementById('ruleModal');
  const ruleForm = document.getElementById('ruleForm');
  const cancelRule = document.getElementById('cancelRule');
  const triggerType = document.getElementById('triggerType');
  const actionType = document.getElementById('actionType');

  // Auto-sweep toggle handler
  if (autoSweepToggle) {
    autoSweepToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        sweepSettings?.removeAttribute('hidden');
        const sweepBenefits = document.getElementById('sweepBenefits');
        if (sweepBenefits) {
          sweepBenefits.style.display = 'block';
          // Initialize benefits calculator with demo data if needed
          if (window.autoSweepBenefits) {
            window.autoSweepBenefits.initializeWithDemoData();
          }
        }
        speak('Auto-sweep enabled. Set your preferences below.', false);
      } else {
        sweepSettings?.setAttribute('hidden', '');
        const sweepBenefits = document.getElementById('sweepBenefits');
        if (sweepBenefits) {
          sweepBenefits.style.display = 'none';
        }
        speak('Auto-sweep disabled.');
      }
    });
  }

  // Save sweep settings
  if (saveSweepSettings) {
    saveSweepSettings.addEventListener('click', () => {
      const threshold = document.getElementById('sweepThreshold')?.value;
      const schedule = document.getElementById('sweepSchedule')?.value;

      speak(`Auto-sweep settings saved. Will trigger when balance exceeds ${threshold} dirhams.`);
      
      // Simulate a new auto-sweep transaction for demo
      if (window.autoSweepBenefits) {
        window.autoSweepBenefits.addSweepTransaction(
          parseFloat(threshold),
          new Date()
        );
      }
      
      console.log('Sweep settings:', { threshold, schedule });
    });
  }

  // Transaction buttons
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => openTransactionModal('withdraw'));
  }
  if (repayBtn) {
    repayBtn.addEventListener('click', () => openTransactionModal('repay'));
  }
  if (transferBtn) {
    transferBtn.addEventListener('click', () => openTransactionModal('transfer'));
  }
  if (termLoanBtn) {
    termLoanBtn.addEventListener('click', () => openTermLoanModal());
  }

  // Add rule button
  if (addRuleBtn) {
    addRuleBtn.addEventListener('click', () => {
      if (ruleModal) {
        ruleModal.removeAttribute('hidden');
        speak('Create a new SmartPay rule.', false);
      }
    });
  }

  // Cancel rule
  if (cancelRule) {
    cancelRule.addEventListener('click', () => {
      if (ruleModal) {
        ruleModal.setAttribute('hidden', '');
        ruleForm?.reset();
      }
    });
  }

  // Dynamic trigger details
  if (triggerType) {
    triggerType.addEventListener('change', (e) => {
      const triggerDetails = document.getElementById('triggerDetails');
      if (!triggerDetails) return;

      let html = '';
      
      switch(e.target.value) {
        case 'balance':
          html = `
            <label>When balance exceeds</label>
            <input type="number" id="triggerValue" placeholder="5000" required/>
            <span>AED</span>
          `;
          break;
        case 'credit':
          html = `
            <label>When credit usage exceeds</label>
            <input type="number" id="triggerValue" placeholder="50" required/>
            <span>%</span>
          `;
          break;
        case 'schedule':
          html = `
            <label>Schedule</label>
            <select id="triggerValue" required>
              <option value="daily">Daily at specific time</option>
              <option value="weekly">Weekly on specific day</option>
              <option value="monthly">Monthly on specific date</option>
            </select>
          `;
          break;
        case 'transaction':
          html = `
            <label>When transaction from</label>
            <select id="triggerValue" required>
              <option value="any">Any merchant</option>
              <option value="category">Specific category</option>
              <option value="merchant">Specific merchant</option>
            </select>
          `;
          break;
      }

      if (html) {
        triggerDetails.innerHTML = html;
        triggerDetails.removeAttribute('hidden');
      } else {
        triggerDetails.setAttribute('hidden', '');
      }
    });
  }

  // Dynamic action details
  if (actionType) {
    actionType.addEventListener('change', (e) => {
      const actionDetails = document.getElementById('actionDetails');
      if (!actionDetails) return;

      let html = '';
      
      switch(e.target.value) {
        case 'repay':
          html = `
            <label>Repayment amount</label>
            <select id="actionValue" required>
              <option value="percentage">Percentage of balance</option>
              <option value="fixed">Fixed amount</option>
              <option value="full">Full outstanding balance</option>
            </select>
            <input type="number" id="actionAmount" placeholder="50" class="mt-2"/>
          `;
          break;
        case 'transfer':
          html = `
            <label>Transfer to</label>
            <select id="actionValue" required>
              <option value="savings">Savings account</option>
              <option value="checking">Checking account</option>
            </select>
            <label>Amount</label>
            <input type="number" id="actionAmount" placeholder="Amount" required/>
          `;
          break;
        case 'limit':
          html = `
            <label>Adjust limit by</label>
            <select id="actionValue" required>
              <option value="increase">Increase limit</option>
              <option value="decrease">Decrease limit</option>
            </select>
            <input type="number" id="actionAmount" placeholder="Amount" required class="mt-2"/>
          `;
          break;
      }

      if (html) {
        actionDetails.innerHTML = html;
        actionDetails.removeAttribute('hidden');
      } else {
        actionDetails.setAttribute('hidden', '');
      }
    });
  }

  // Rule form submission
  if (ruleForm) {
    ruleForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ruleName = document.getElementById('ruleName')?.value;
      const trigger = triggerType?.value;
      const action = actionType?.value;
      const priority = document.getElementById('rulePriority')?.value;

      const newRule = {
        name: ruleName,
        trigger,
        action,
        priority,
        status: 'active'
      };

      console.log('Creating rule:', newRule);

      // Call mock API
      const result = await mockAPI.createRule(newRule);
      console.log('Rule created:', result);

      speak(`Rule "${ruleName}" created successfully.`);

      // Close modal and reset form
      ruleModal?.setAttribute('hidden', '');
      ruleForm.reset();
      document.getElementById('triggerDetails')?.setAttribute('hidden', '');
      document.getElementById('actionDetails')?.setAttribute('hidden', '');

      // Add rule to list (in real app, would refresh from API)
      addRuleToList(result);
    });
  }

  // Rule action buttons (edit/delete)
  document.querySelectorAll('.rule-card').forEach(card => {
    const editBtn = card.querySelector('.btn-icon[aria-label="Edit rule"]');
    const deleteBtn = card.querySelector('.btn-icon[aria-label="Delete rule"]');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const ruleName = card.querySelector('h4')?.textContent;
        speak(`Editing rule: ${ruleName}`, false);
        // In real app, would populate form with rule data
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const ruleName = card.querySelector('h4')?.textContent;
        if (confirm(`Delete rule "${ruleName}"?`)) {
          card.remove();
          speak(`Rule "${ruleName}" deleted.`);
        }
      });
    }
  });
});

// Open transaction modal
const openTransactionModal = (type) => {
  const modal = document.getElementById('transactionModal');
  const modalTitle = document.getElementById('transactionTitle');
  const transactionForm = document.getElementById('transactionForm');
  const confirmBtn = document.getElementById('confirmTransaction');
  const cancelBtn = document.getElementById('cancelTransaction');

  if (!modal) return;

  const titles = {
    withdraw: 'Withdraw from Credit Line',
    repay: 'Repay Credit',
    transfer: 'Transfer to Account'
  };

  if (modalTitle) {
    modalTitle.textContent = titles[type] || 'Transaction';
  }

  modal.removeAttribute('hidden');

  // Focus on amount input
  const amountInput = document.getElementById('transactionAmount');
  if (amountInput) {
    amountInput.focus();
    amountInput.value = '';
  }

  // Clear previous listeners
  const newConfirmBtn = confirmBtn?.cloneNode(true);
  confirmBtn?.parentNode?.replaceChild(newConfirmBtn, confirmBtn);

  // Add submit handler
  if (newConfirmBtn) {
    newConfirmBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const amount = document.getElementById('transactionAmount')?.value;
      const note = document.getElementById('transactionNote')?.value;

      if (!amount || amount <= 0) {
        speak('Please enter a valid amount.', false);
        return;
      }

      closeModal();

      speak(`Processing ${type} of ${amount} dirhams.`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (type === 'withdraw') {
        updateCreditDisplay(-parseFloat(amount));
      } else if (type === 'repay') {
        updateCreditDisplay(parseFloat(amount));
      }

      speak(`${type} of ${amount} dirhams completed successfully.`);
    });
  }

  // Cancel handler
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeModal();
    });
  }
};

// Update credit display
const updateCreditDisplay = (amount) => {
  const creditUsageCircle = document.getElementById('creditUsageCircle');
  const availableCredit = document.querySelector('.credit-value.highlight');
  const usedCredit = document.querySelector('.credit-row:nth-child(3) .credit-value');

  if (availableCredit && usedCredit) {
    const currentAvailable = parseFloat(availableCredit.textContent.replace(/[^0-9.]/g, ''));
    const currentUsed = parseFloat(usedCredit.textContent.replace(/[^0-9.]/g, ''));

    const newAvailable = currentAvailable + amount;
    const newUsed = currentUsed - amount;

    availableCredit.textContent = `AED ${newAvailable.toLocaleString()}`;
    usedCredit.textContent = `AED ${newUsed.toLocaleString()}`;

    // Update circle (15,250 is total limit)
    const utilizationPercent = (newUsed / 15250) * 100;
    const circumference = 565.48;
    const offset = circumference - (utilizationPercent / 100) * circumference;
    
    if (creditUsageCircle) {
      creditUsageCircle.style.strokeDashoffset = offset;
    }

    // Update percentage text
    const percentText = document.querySelector('.credit-circle text:first-child');
    if (percentText) {
      percentText.textContent = Math.round(utilizationPercent) + '%';
    }
  }
};

// Add rule to list
const addRuleToList = (rule) => {
  const rulesList = document.getElementById('rulesList');
  if (!rulesList) return;

  const ruleCard = document.createElement('div');
  ruleCard.className = 'rule-card';
  ruleCard.innerHTML = `
    <div class="rule-header">
      <div class="rule-info">
        <h4>${rule.name}</h4>
        <span class="rule-status active">Active</span>
      </div>
      <div class="rule-actions">
        <button class="btn-icon" aria-label="Edit rule">✏️</button>
        <button class="btn-icon" aria-label="Delete rule">🗑️</button>
      </div>
    </div>
    <div class="rule-body">
      <p><strong>Trigger:</strong> ${rule.trigger}</p>
      <p><strong>Action:</strong> ${rule.action}</p>
      <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
  `;

  rulesList.appendChild(ruleCard);
};

// Term Loan Modal Functionality
let currentStep = 1;
let loanCalculation = null;

const openTermLoanModal = () => {
  const modal = document.getElementById('termLoanModal');
  if (!modal) return;

  // Reset modal state
  currentStep = 1;
  loanCalculation = null;
  
  // Show modal
  modal.removeAttribute('hidden');
  
  // Initialize first step
  showStep(1);
  checkEligibility();
  
  speak('Opening term loan application. Let me check your eligibility.', false);
  
  // Setup event listeners
  setupTermLoanListeners();
};

const setupTermLoanListeners = () => {
  // Navigation buttons
  const nextBtn = document.getElementById('termLoanNext');
  const prevBtn = document.getElementById('termLoanPrev');
  const cancelBtn = document.getElementById('cancelTermLoan');
  const confirmBtn = document.getElementById('confirmTermLoan');
  
  // Calculator form
  const calculateBtn = document.getElementById('calculateLoan');
  const loanAmount = document.getElementById('loanAmount');
  const loanTerm = document.getElementById('loanTerm');
  
  // Modal close
  const closeBtn = document.querySelector('#termLoanModal .modal-close');

  // Remove existing listeners to prevent duplicates
  [nextBtn, prevBtn, cancelBtn, confirmBtn, calculateBtn, closeBtn].forEach(btn => {
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    }
  });

  // Re-get elements after cloning
  const newNextBtn = document.getElementById('termLoanNext');
  const newPrevBtn = document.getElementById('termLoanPrev');
  const newCancelBtn = document.getElementById('cancelTermLoan');
  const newConfirmBtn = document.getElementById('confirmTermLoan');
  const newCalculateBtn = document.getElementById('calculateLoan');
  const newCloseBtn = document.querySelector('#termLoanModal .modal-close');

  // Next button
  if (newNextBtn) {
    newNextBtn.addEventListener('click', () => {
      if (currentStep < 3) {
        if (currentStep === 2) {
          showConfirmation();
        }
        showStep(currentStep + 1);
      }
    });
  }

  // Previous button
  if (newPrevBtn) {
    newPrevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    });
  }

  // Calculate button
  if (newCalculateBtn) {
    newCalculateBtn.addEventListener('click', () => {
      calculateTermLoan();
    });
  }

  // Confirm button
  if (newConfirmBtn) {
    newConfirmBtn.addEventListener('click', () => {
      confirmTermLoan();
    });
  }

  // Cancel/Close buttons
  [newCancelBtn, newCloseBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        closeTermLoanModal();
      });
    }
  });

  // Real-time loan amount validation
  if (loanAmount) {
    loanAmount.addEventListener('input', (e) => {
      validateLoanAmount(e.target.value);
    });
  }
};

const showStep = (stepNumber) => {
  currentStep = stepNumber;
  
  // Update step progress
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`step${i}`);
    const stepDiv = document.getElementById(i === 1 ? 'eligibilityStep' : i === 2 ? 'calculatorStep' : 'confirmationStep');
    
    if (step) {
      if (i === stepNumber) {
        step.classList.add('active');
      } else if (i < stepNumber) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else {
        step.classList.remove('active', 'completed');
      }
    }
    
    if (stepDiv) {
      if (i === stepNumber) {
        stepDiv.classList.add('active');
        stepDiv.removeAttribute('hidden');
      } else {
        stepDiv.classList.remove('active');
        stepDiv.setAttribute('hidden', '');
      }
    }
  }
  
  // Update navigation buttons
  const nextBtn = document.getElementById('termLoanNext');
  const prevBtn = document.getElementById('termLoanPrev');
  const confirmBtn = document.getElementById('confirmTermLoan');
  
  if (nextBtn) {
    if (stepNumber === 3) {
      nextBtn.setAttribute('hidden', '');
    } else {
      nextBtn.removeAttribute('hidden');
      nextBtn.disabled = (stepNumber === 2 && !loanCalculation);
    }
  }
  
  if (prevBtn) {
    if (stepNumber === 1) {
      prevBtn.setAttribute('hidden', '');
    } else {
      prevBtn.removeAttribute('hidden');
    }
  }
  
  if (confirmBtn) {
    if (stepNumber === 3) {
      confirmBtn.removeAttribute('hidden');
    } else {
      confirmBtn.setAttribute('hidden', '');
    }
  }
};

const checkEligibility = async () => {
  const eligibilityResult = document.getElementById('eligibilityResult');
  const loading = document.getElementById('eligibilityLoading');
  
  if (loading) {
    loading.style.display = 'block';
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Get current credit data (from page or mock data)
  const creditLimit = 15250;  // From the page
  const currentBalance = 2750; // From the page
  const existingTermLoans = TermLoanManager.getActiveTermLoans();
  
  const eligibility = TermLoanManager.checkEligibility(creditLimit, currentBalance, existingTermLoans);
  
  if (eligibilityResult) {
    eligibilityResult.innerHTML = `
      <div class="eligibility-card ${eligibility.eligible ? 'eligible' : 'not-eligible'}">
        <div class="eligibility-status">
          <span class="status-icon">${eligibility.eligible ? '✅' : '❌'}</span>
          <h5>${eligibility.eligible ? 'You are eligible!' : 'Not eligible'}</h5>
        </div>
        
        <div class="eligibility-details">
          ${eligibility.eligible ? `
            <div class="detail-row">
              <span>Maximum loan amount:</span>
              <span class="highlight">AED ${eligibility.maxLoanAmount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span>Current utilization:</span>
            <span>${eligibility.currentUtilization.toFixed(1)}%</span>
          </div>
          ${eligibility.existingTermLoanDebt > 0 ? `
            <div class="detail-row">
              <span>Existing term loan debt:</span>
              <span>AED ${eligibility.existingTermLoanDebt.toLocaleString()}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="eligibility-reasons">
          ${eligibility.reasons.map(reason => `<p class="reason">• ${reason}</p>`).join('')}
        </div>
        
        ${eligibility.eligible ? `
          <div class="next-step">
            <p>Ready to proceed with your term loan application!</p>
          </div>
        ` : `
          <div class="improve-eligibility">
            <p>To improve eligibility, consider:</p>
            <ul>
              <li>Reducing current credit usage</li>
              <li>Making payments on existing loans</li>
              <li>Building credit history</li>
            </ul>
          </div>
        `}
      </div>
    `;
  }
  
  // Update loan amount max in step 2
  const loanAmountInput = document.getElementById('loanAmount');
  const amountNote = document.getElementById('amountNote');
  
  if (loanAmountInput && eligibility.eligible) {
    loanAmountInput.max = eligibility.maxLoanAmount;
    loanAmountInput.placeholder = `Max: AED ${eligibility.maxLoanAmount.toLocaleString()}`;
  }
  
  if (amountNote && eligibility.eligible) {
    amountNote.textContent = `Minimum: AED 1,000 | Maximum: AED ${eligibility.maxLoanAmount.toLocaleString()}`;
  }
  
  // Enable/disable next button based on eligibility
  const nextBtn = document.getElementById('termLoanNext');
  if (nextBtn) {
    nextBtn.disabled = !eligibility.eligible;
    if (!eligibility.eligible) {
      nextBtn.textContent = 'Not Eligible';
    } else {
      nextBtn.textContent = 'Next';
    }
  }
  
  speak(eligibility.eligible ? 
    `Great news! You're eligible for a term loan up to ${eligibility.maxLoanAmount} dirhams.` : 
    'Unfortunately, you are not currently eligible for a term loan.', false);
};

const validateLoanAmount = (amount) => {
  const amountInput = document.getElementById('loanAmount');
  const calculateBtn = document.getElementById('calculateLoan');
  const amountNote = document.getElementById('amountNote');
  
  const numAmount = parseFloat(amount);
  const maxAmount = parseFloat(amountInput?.max || 0);
  
  let valid = true;
  let message = '';
  
  if (!amount || numAmount < 1000) {
    valid = false;
    message = 'Minimum: AED 1,000';
  } else if (numAmount > maxAmount) {
    valid = false;
    message = `Maximum: AED ${maxAmount.toLocaleString()}`;
  } else {
    message = `Valid amount (AED 1,000 - ${maxAmount.toLocaleString()})`;
  }
  
  if (amountNote) {
    amountNote.textContent = message;
    amountNote.className = `field-note ${valid ? 'valid' : 'invalid'}`;
  }
  
  if (calculateBtn) {
    calculateBtn.disabled = !valid || !document.getElementById('loanTerm')?.value;
  }
  
  return valid;
};

const calculateTermLoan = () => {
  const loanAmount = parseFloat(document.getElementById('loanAmount')?.value);
  const loanTerm = parseInt(document.getElementById('loanTerm')?.value);
  const resultsDiv = document.getElementById('loanResults');
  
  if (!loanAmount || !loanTerm) {
    speak('Please enter both loan amount and term.', false);
    return;
  }
  
  try {
    loanCalculation = TermLoanManager.calculateLoan(loanAmount, loanTerm);
    
    // Update results display
    document.getElementById('monthlyEmi').textContent = `AED ${loanCalculation.emi.toLocaleString()}`;
    document.getElementById('totalInterest').textContent = `AED ${loanCalculation.totalInterest.toLocaleString()}`;
    document.getElementById('processingFee').textContent = `AED ${loanCalculation.processingFee.toLocaleString()}`;
    document.getElementById('totalCost').textContent = `AED ${loanCalculation.totalCost.toLocaleString()}`;
    document.getElementById('effectiveApr').textContent = `${loanCalculation.effectiveAPR}%`;
    
    // Show results
    if (resultsDiv) {
      resultsDiv.removeAttribute('hidden');
    }
    
    // Enable next button
    const nextBtn = document.getElementById('termLoanNext');
    if (nextBtn) {
      nextBtn.disabled = false;
    }
    
    speak(`Your monthly payment would be ${loanCalculation.emi} dirhams for ${loanTerm} months.`, false);
    
  } catch (error) {
    speak('Error calculating loan. Please check your inputs.', false);
    console.error('Loan calculation error:', error);
  }
};

const showConfirmation = () => {
  if (!loanCalculation) return;
  
  // Update confirmation summary
  document.getElementById('confirmAmount').textContent = `AED ${loanCalculation.loanAmount.toLocaleString()}`;
  document.getElementById('confirmTerm').textContent = `${loanCalculation.termMonths} months`;
  document.getElementById('confirmEmi').textContent = `AED ${loanCalculation.emi.toLocaleString()}`;
  document.getElementById('confirmInterest').textContent = `AED ${loanCalculation.totalInterest.toLocaleString()}`;
  document.getElementById('confirmProcessingFee').textContent = `AED ${loanCalculation.processingFee.toLocaleString()}`;
  document.getElementById('confirmTotal').textContent = `AED ${loanCalculation.totalCost.toLocaleString()}`;
};

const confirmTermLoan = async () => {
  const acceptTerms = document.getElementById('acceptTerms');
  
  if (!acceptTerms?.checked) {
    speak('Please accept the terms and conditions to proceed.', false);
    return;
  }
  
  if (!loanCalculation) {
    speak('No loan calculation found. Please go back and calculate your loan.', false);
    return;
  }
  
  try {
    speak('Processing your term loan application. Please wait.', false);
    
    // Create the term loan
    const termLoan = TermLoanManager.createTermLoan(loanCalculation, {
      name: 'Meghana', // In real app, get from user profile
      email: 'meghana@example.com',
      phone: '+971501234567'
    });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Close modal
    closeTermLoanModal();
    
    // Show success message
    speak(`Congratulations! Your term loan of ${loanCalculation.loanAmount} dirhams has been approved and disbursed. Your loan ID is ${termLoan.id}.`);
    
    // Update credit display (reduce available credit)
    updateCreditDisplay(-loanCalculation.loanAmount);
    
    // Show success notification
    showSuccessNotification(termLoan);
    
  } catch (error) {
    speak('Error processing your loan application. Please try again.', false);
    console.error('Term loan creation error:', error);
  }
};

const showSuccessNotification = (termLoan) => {
  // Create and show a success notification
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <h4>✅ Term Loan Approved!</h4>
      <p>Loan ID: <strong>${termLoan.id}</strong></p>
      <p>Amount: <strong>AED ${termLoan.loanAmount.toLocaleString()}</strong></p>
      <p>Monthly Payment: <strong>AED ${termLoan.emi.toLocaleString()}</strong></p>
      <p>Next Payment Due: <strong>${new Date(termLoan.nextDueDate).toLocaleDateString()}</strong></p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
};

const closeTermLoanModal = () => {
  const modal = document.getElementById('termLoanModal');
  if (modal) {
    modal.setAttribute('hidden', '');
  }
  
  // Reset form states
  currentStep = 1;
  loanCalculation = null;
  
  // Clear form inputs
  const form = modal?.querySelector('form');
  if (form) {
    form.reset();
  }
  
  // Clear results
  const results = document.getElementById('loanResults');
  if (results) {
    results.setAttribute('hidden', '');
  }
  
  // Uncheck terms
  const acceptTerms = document.getElementById('acceptTerms');
  if (acceptTerms) {
    acceptTerms.checked = false;
  }
};
