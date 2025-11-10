// Main.js - Voice recognition + confirmation with "Shukria"
// Global voice functionality and shared utilities

// Voice feedback element
const voiceFeedbackEl = document.getElementById('voiceFeedback');

// Speak text with "Shukria" at the end
const speak = (text, addShukria = true) => {
  if ('speechSynthesis' in window) {
    const finalText = addShukria ? `${text} Shukria` : text;
    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.lang = 'en-GB';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    // Also update ARIA live region for screen readers
    if (voiceFeedbackEl) {
      voiceFeedbackEl.textContent = finalText;
    }
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
};

// Speech recognition wrapper
const startRecognition = async () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  // Visual feedback
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.style.background = '#dc2626';
    voiceBtn.textContent = '🎙️';
  }

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim().toLowerCase();
    console.log('Voice command heard:', command);
    
    // Reset button
    if (voiceBtn) {
      voiceBtn.style.background = '';
      voiceBtn.textContent = '🎤';
    }
    
    handleCommand(command);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Reset button
    if (voiceBtn) {
      voiceBtn.style.background = '';
      voiceBtn.textContent = '🎤';
    }
    
    if (event.error === 'no-speech') {
      speak('No speech detected. Please try again.', false);
    } else if (event.error === 'not-allowed') {
      alert('Microphone access denied. Please allow microphone permissions.');
    } else {
      speak('Sorry, I did not understand. Please try again.', false);
    }
  };

  recognition.onend = () => {
    // Reset button
    if (voiceBtn) {
      voiceBtn.style.background = '';
      voiceBtn.textContent = '🎤';
    }
  };

  try {
    recognition.start();
    speak('Listening for your command.', false);
  } catch (error) {
    console.error('Error starting recognition:', error);
  }
};

// Command handler - parses and executes voice commands
const handleCommand = (command) => {
  console.log('Processing command:', command);

  // Extract numbers from command
  const numberMatch = command.match(/\d+/);
  const amount = numberMatch ? parseInt(numberMatch[0]) : 0;

  // Navigation commands
  if (command.includes('dashboard') || command.includes('home')) {
    speak('Navigating to dashboard.');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  if (command.includes('apply') || command.includes('application')) {
    speak('Opening application page.');
    setTimeout(() => window.location.href = 'apply.html', 1000);
    return;
  }

  if (command.includes('credit line') || command.includes('credit control')) {
    speak('Opening credit line controls.');
    setTimeout(() => window.location.href = 'credit-line.html', 1000);
    return;
  }

  if (command.includes('transaction') || command.includes('statement')) {
    speak('Showing your transactions.');
    setTimeout(() => window.location.href = 'transactions.html', 1000);
    return;
  }

  if (command.includes('esg') || command.includes('score') || command.includes('carbon')) {
  speak('Showing your loan eligibility and offers.');
  setTimeout(() => window.location.href = 'loan-offers.html', 1000);
  return;
  }

  // Transaction commands
  if (command.includes('withdraw')) {
    if (amount > 0) {
      speak(`Withdrawing ${amount} dirhams from your credit line.`);
      // Simulate API call
      setTimeout(() => {
        updateCredit(-amount);
        speak(`Withdrawal of ${amount} dirhams completed successfully.`);
      }, 1500);
    } else {
      speak('Please specify the amount to withdraw. For example, say withdraw 500 dirhams.');
    }
    return;
  }

  if (command.includes('repay') || command.includes('pay')) {
    if (amount > 0) {
      speak(`Processing repayment of ${amount} dirhams.`);
      // Simulate API call
      setTimeout(() => {
        updateCredit(amount);
        speak(`Payment of ${amount} dirhams received and processed.`);
      }, 1500);
    } else {
      speak('Please specify the amount to repay. For example, say repay 500 dirhams.');
    }
    return;
  }

  // Term loan commands
  if (command.includes('term loan') || command.includes('personal loan') || 
      command.includes('apply for loan') || command.includes('loan application')) {
    speak('Opening term loan application.');
    setTimeout(() => {
      if (window.location.pathname.includes('credit-line.html')) {
        // If already on credit line page, open modal
        if (typeof openTermLoanModal === 'function') {
          openTermLoanModal();
        }
      } else {
        // Navigate to credit line page
        window.location.href = 'credit-line.html?openTermLoan=true';
      }
    }, 1000);
    return;
  }

  if (command.includes('loan eligibility') || command.includes('check eligibility')) {
    speak('Checking your term loan eligibility.');
    if (typeof TermLoanManager !== 'undefined') {
      const creditLimit = 15250;
      const currentBalance = 2750;
      const existingLoans = TermLoanManager.getActiveTermLoans();
      const eligibility = TermLoanManager.checkEligibility(creditLimit, currentBalance, existingLoans);
      
      if (eligibility.eligible) {
        speak(`Great news! You are eligible for a term loan up to ${eligibility.maxLoanAmount} dirhams.`);
      } else {
        speak('Unfortunately, you are not currently eligible for a term loan.');
      }
    } else {
      speak('Please navigate to the loan offers page to check your eligibility.');
    }
    return;
  }

  if (command.includes('loan calculator') || command.includes('calculate loan')) {
    speak('Let me help you calculate loan payments. Please specify the amount and term.');
    if (amount > 0) {
      if (typeof TermLoanManager !== 'undefined') {
        try {
          const calculation = TermLoanManager.calculateLoan(amount, 36); // Default 36 months
          speak(`For a loan of ${amount} dirhams over 36 months, your monthly payment would be ${Math.round(calculation.emi)} dirhams.`);
        } catch (error) {
          speak('Please check the loan amount and try again.');
        }
      }
    } else {
      speak('Please specify the loan amount. For example, say calculate loan for 10000 dirhams.');
    }
    return;
  }

  if (command.includes('my loans') || command.includes('existing loans') || 
      command.includes('loan status')) {
    speak('Checking your existing term loans.');
    if (typeof TermLoanManager !== 'undefined') {
      const activeLoans = TermLoanManager.getActiveTermLoans();
      if (activeLoans.length === 0) {
        speak('You currently have no active term loans.');
      } else {
        const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
        const totalEmi = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);
        speak(`You have ${activeLoans.length} active term loan${activeLoans.length > 1 ? 's' : ''} with a total outstanding of ${Math.round(totalOutstanding)} dirhams and monthly payments of ${Math.round(totalEmi)} dirhams.`);
      }
    } else {
      speak('Please navigate to the credit line page to view your loans.');
    }
    return;
  }

  if (command.includes('loan rates') || command.includes('interest rates')) {
    speak('Current term loan rates start from 8 percent APR for 12 months, 9.5 percent for 24 months, 11 percent for 36 months, 12.5 percent for 48 months, and 14 percent for 60 months.');
    return;
  }

  // Auto-sweep commands
  if (command.includes('enable auto sweep') || command.includes('enable autosweep') || 
      command.includes('turn on auto sweep')) {
    speak('Enabling auto sweep.');
    setTimeout(() => {
      const toggle = document.getElementById('autoSweepToggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
      speak('Auto sweep has been enabled successfully.');
    }, 1000);
    return;
  }

  if (command.includes('disable auto sweep') || command.includes('disable autosweep') || 
      command.includes('turn off auto sweep')) {
    speak('Disabling auto sweep.');
    setTimeout(() => {
      const toggle = document.getElementById('autoSweepToggle');
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      }
      speak('Auto sweep has been disabled.');
    }, 1000);
    return;
  }

  // Status queries
  if (command.includes('balance') || command.includes('available credit')) {
    const availableEl = document.getElementById('availableCredit');
    if (availableEl) {
      const balance = availableEl.textContent;
      speak(`Your available credit is ${balance}.`);
    } else {
      speak('Your available credit is 12,500 dirhams.');
    }
    return;
  }

  if (command.includes('esg score') || command.includes('my score')) {
    const eligibleEl = document.getElementById('loanEligible');
    if (eligibleEl) {
      const eligible = eligibleEl.textContent;
      speak(`You are eligible for loan offers up to ${eligible}.`);
    } else {
      speak('You are eligible for loan offers.');
    }
    return;
  }

  // Default response
  speak('Command received. Please check the screen for details.');
};

// Mock function to update credit display
const updateCredit = (amount) => {
  const availableEl = document.getElementById('availableCredit');
  const usedEl = document.getElementById('usedCredit');
  
  if (availableEl && usedEl) {
    const currentAvailable = parseFloat(availableEl.textContent.replace(/[^0-9.]/g, ''));
    const currentUsed = parseFloat(usedEl.textContent.replace(/[^0-9.]/g, ''));
    
    const newAvailable = currentAvailable + amount;
    const newUsed = currentUsed - amount;
    
    availableEl.textContent = `AED ${newAvailable.toLocaleString()}`;
    usedEl.textContent = `AED ${newUsed.toLocaleString()}`;
  }
};

// Initialize voice button
document.addEventListener('DOMContentLoaded', () => {
  const voiceBtn = document.getElementById('voiceBtn');
  
  if (voiceBtn) {
    voiceBtn.addEventListener('click', startRecognition);
  }

  // Initialize tabs if on dashboard
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
    initializeTabs();
    
    // Load initial content
    loadTermLoans();
    
    // Auto-show term loans section if there are active loans
    if (typeof TermLoanManager !== 'undefined') {
      const activeLoans = TermLoanManager.getActiveTermLoans();
      if (activeLoans && activeLoans.length > 0) {
        const financeSection = document.querySelector('.finance-products-section');
        if (financeSection) {
          financeSection.style.display = 'block';
        }
      }
    }
  }

  // Quick action handlers on dashboard
  const quickWithdraw = document.getElementById('quickWithdraw');
  const quickRepay = document.getElementById('quickRepay');
  const quickTransfer = document.getElementById('quickTransfer');
  const quickAutoSweep = document.getElementById('quickAutoSweep');

  if (quickWithdraw) {
    quickWithdraw.addEventListener('click', () => openQuickAction('withdraw'));
  }
  if (quickRepay) {
    quickRepay.addEventListener('click', () => openQuickAction('repay'));
  }
  if (quickTransfer) {
    quickTransfer.addEventListener('click', () => openQuickAction('transfer'));
  }
  if (quickAutoSweep) {
    quickAutoSweep.addEventListener('click', () => {
      window.location.href = 'credit-line.html';
    });
  }

  // Modal close handlers
  const modalCloseButtons = document.querySelectorAll('.modal-close');
  modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Close modal on background click
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
});

// Quick action modal
const openQuickAction = (actionType) => {
  const modal = document.getElementById('actionModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (!modal) return;

  const actions = {
    withdraw: {
      title: 'Quick Withdraw',
      content: `
        <form id="quickActionForm">
          <div class="form-group">
            <label for="actionAmount">Amount (AED)</label>
            <input type="number" id="actionAmount" required min="1" step="0.01" placeholder="500" autofocus/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Withdraw</button>
            <button type="button" class="btn-outline" onclick="closeModal()">Cancel</button>
          </div>
        </form>
      `
    },
    repay: {
      title: 'Quick Repayment',
      content: `
        <form id="quickActionForm">
          <div class="form-group">
            <label for="actionAmount">Amount (AED)</label>
            <input type="number" id="actionAmount" required min="1" step="0.01" placeholder="500" autofocus/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Repay</button>
            <button type="button" class="btn-outline" onclick="closeModal()">Cancel</button>
          </div>
        </form>
      `
    },
    transfer: {
      title: 'Transfer to Account',
      content: `
        <form id="quickActionForm">
          <div class="form-group">
            <label for="actionAmount">Amount (AED)</label>
            <input type="number" id="actionAmount" required min="1" step="0.01" placeholder="500" autofocus/>
          </div>
          <div class="form-group">
            <label for="accountSelect">To Account</label>
            <select id="accountSelect" required>
              <option value="savings">Savings Account (****1234)</option>
              <option value="checking">Checking Account (****5678)</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Transfer</button>
            <button type="button" class="btn-outline" onclick="closeModal()">Cancel</button>
          </div>
        </form>
      `
    }
  };

  const action = actions[actionType];
  if (action) {
    modalTitle.textContent = action.title;
    modalBody.innerHTML = action.content;

    // Add form handler
    const form = document.getElementById('quickActionForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = document.getElementById('actionAmount').value;
        
        closeModal();
        speak(`Processing ${actionType} of ${amount} dirhams.`);
        
        setTimeout(() => {
          if (actionType === 'withdraw') {
            updateCredit(-parseFloat(amount));
          } else if (actionType === 'repay') {
            updateCredit(parseFloat(amount));
          }
          speak(`${actionType} of ${amount} dirhams completed successfully.`);
        }, 1500);
      });
    }

    modal.removeAttribute('hidden');
    
    // Focus management
    const firstInput = modal.querySelector('input, select, button');
    if (firstInput) firstInput.focus();
  }
};

// Close modal
const closeModal = () => {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.setAttribute('hidden', '');
  });
};

// Mock API functions
const mockAPI = {
  // Consent flow
  requestConsent: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ consentId: 'consent_' + Date.now(), status: 'approved' });
      }, 1000);
    });
  },

  // Get account transactions (AIS)
  getTransactions: async (accountId) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 1, date: '2025-11-05', merchant: 'ABC Trading', amount: 12000, category: 'Sales' },
          { id: 2, date: '2025-11-04', merchant: 'XYZ Supplies', amount: -3500, category: 'Supplies' },
          { id: 3, date: '2025-11-03', merchant: 'Utilities', amount: -1200, category: 'Utilities' }
        ]);
      }, 800);
    });
  },

  // Credit evaluation
  evaluateCredit: async (data) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          eligible: true,
          limit: 1000000,
          apr: 6.5,
          fee: 0
        });
      }, 2000);
    });
  },

  // Payment initiation (PIS)
  initiateSweep: async (amount) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ transactionId: 'txn_' + Date.now(), status: 'completed', amount });
      }, 1200);
    });
  },

  // ESG data

  // Create SmartPay rule
  createRule: async (rule) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ruleId: 'rule_' + Date.now(), status: 'active', ...rule });
      }, 800);
    });
  },

  // Get rules
  getRules: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 'rule_1', name: 'Monthly Auto-Repay', status: 'active', trigger: 'schedule', action: 'repay' },
          { id: 'rule_2', name: 'High Balance Transfer', status: 'active', trigger: 'balance', action: 'transfer' }
        ]);
      }, 600);
    });
  }
};

// Tab functionality for dashboard
const initializeTabs = () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Remove active class from all buttons and panels
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked button and corresponding panel
      button.classList.add('active');
      const targetPanel = document.getElementById(targetTab + 'Content');
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
      
      // Voice feedback
      const tabName = button.textContent.trim();
      speak(`Switched to ${tabName} tab.`, false);
      
      // Load content for the tab
      if (targetTab === 'bnpl') {
        loadBNPLPlans();
      } else if (targetTab === 'termLoans') {
        loadTermLoans();
      }
    });
  });
};

// Mock BNPL data
const mockBNPLPlans = [
  {
    id: 'bnpl_1',
    merchant: 'Apple Store',
    totalAmount: 2999,
    remainingAmount: 1499.50,
    installments: 4,
    paidInstallments: 2,
    nextPayment: '2025-12-01',
    monthlyAmount: 749.75,
    status: 'active'
  },
  {
    id: 'bnpl_2',
    merchant: 'IKEA',
    totalAmount: 1200,
    remainingAmount: 400,
    installments: 3,
    paidInstallments: 2,
    nextPayment: '2025-11-25',
    monthlyAmount: 400,
    status: 'active'
  },
  {
    id: 'bnpl_3',
    merchant: 'Nike Store',
    totalAmount: 899,
    remainingAmount: 0,
    installments: 4,
    paidInstallments: 4,
    nextPayment: null,
    monthlyAmount: 224.75,
    status: 'completed'
  }
];

// Load BNPL plans
const loadBNPLPlans = () => {
  const bnplList = document.getElementById('bnplPlansList');
  const noBnplPlans = document.getElementById('noBnplPlans');
  
  if (!bnplList || !noBnplPlans) return;
  
  const activePlans = mockBNPLPlans.filter(plan => plan.status === 'active');
  
  if (activePlans.length === 0) {
    bnplList.style.display = 'none';
    noBnplPlans.style.display = 'block';
    return;
  }
  
  bnplList.style.display = 'grid';
  noBnplPlans.style.display = 'none';
  
  bnplList.innerHTML = activePlans.map(plan => {
    const progress = (plan.paidInstallments / plan.installments) * 100;
    
    return `
      <div class="bnpl-plan-card">
        <div class="bnpl-header">
          <h4>${plan.merchant}</h4>
          <span class="bnpl-status ${plan.status}">${plan.status.toUpperCase()}</span>
        </div>
        
        <div class="bnpl-details">
          <div class="bnpl-row">
            <span>Total Amount:</span>
            <span>AED ${plan.totalAmount.toLocaleString()}</span>
          </div>
          <div class="bnpl-row">
            <span>Remaining:</span>
            <span class="highlight">AED ${plan.remainingAmount.toLocaleString()}</span>
          </div>
          <div class="bnpl-row">
            <span>Monthly Payment:</span>
            <span>AED ${plan.monthlyAmount.toLocaleString()}</span>
          </div>
          <div class="bnpl-row">
            <span>Next Payment:</span>
            <span>${plan.nextPayment || 'N/A'}</span>
          </div>
          <div class="bnpl-row">
            <span>Progress:</span>
            <span>${plan.paidInstallments}/${plan.installments} installments</span>
          </div>
        </div>
        
        <div class="bnpl-progress">
          <div class="bnpl-progress-bar">
            <div class="bnpl-progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        
        <div class="bnpl-actions">
          <button class="btn-outline small" onclick="viewBNPLDetails('${plan.id}')">
            View Details
          </button>
          <button class="btn-primary small" onclick="payBNPLInstallment('${plan.id}')" 
                  ${plan.remainingAmount === 0 ? 'disabled' : ''}>
            Pay Now
          </button>
        </div>
      </div>
    `;
  }).join('');
};

// Load term loans (use existing TermLoanManager if available)
const loadTermLoans = () => {
  if (typeof TermLoanManager !== 'undefined' && TermLoanManager.renderDashboard) {
    TermLoanManager.renderDashboard();
  } else {
    // Fallback if TermLoanManager is not available
    const termLoansList = document.getElementById('termLoansList');
    const noTermLoans = document.getElementById('noTermLoans');
    
    if (termLoansList && noTermLoans) {
      termLoansList.style.display = 'none';
      noTermLoans.style.display = 'block';
    }
  }
};

// BNPL action handlers
window.viewBNPLDetails = (planId) => {
  const plan = mockBNPLPlans.find(p => p.id === planId);
  if (plan) {
    speak(`Showing details for ${plan.merchant} BNPL plan.`, false);
    // Could open a modal or navigate to details page
    window.location.href = `transactions.html#${planId}`;
  }
};

window.payBNPLInstallment = (planId) => {
  const plan = mockBNPLPlans.find(p => p.id === planId);
  if (plan && plan.remainingAmount > 0) {
    speak(`Processing payment of ${plan.monthlyAmount} dirhams for ${plan.merchant}.`, false);
    
    // Simulate payment processing
    setTimeout(() => {
      plan.paidInstallments++;
      plan.remainingAmount = Math.max(0, plan.remainingAmount - plan.monthlyAmount);
      
      if (plan.remainingAmount === 0) {
        plan.status = 'completed';
        speak(`BNPL plan for ${plan.merchant} has been completed successfully.`);
      } else {
        speak(`Payment successful. Remaining balance is ${plan.remainingAmount} dirhams.`);
      }
      
      // Reload BNPL plans
      loadBNPLPlans();
    }, 2000);
  }
};

// Tab initialization is handled in the main DOMContentLoaded event above

// Authentication Helper Functions
const checkAuth = () => {
  const token = localStorage.getItem('authToken');
  const loginTime = localStorage.getItem('loginTime');
  
  if (!token || !loginTime) {
    return false;
  }
  
  // Check if session expired (24 hours)
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  const elapsed = Date.now() - parseInt(loginTime);
  
  if (elapsed > sessionDuration) {
    // Session expired
    logout();
    return false;
  }
  
  return true;
};

const requireAuth = () => {
  if (!checkAuth()) {
    // Redirect to login page
    window.location.href = 'login.html';
  }
};

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('loginTime');
  
  speak('Logged out successfully. See you soon!', false);
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
};

const getUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

const updateUserDisplay = () => {
  const user = getUser();
  if (user) {
    // Update all user display elements
    const userElements = document.querySelectorAll('.user, .user-name, [data-user-name]');
    userElements.forEach(el => {
      if (el.textContent.includes('Hello,') || el.textContent.includes('Hi,')) {
        el.textContent = `Hello, ${user.name.split(' ')[0]}`;
      } else {
        el.textContent = user.name;
      }
    });
  }
};

// Export for use in other scripts
window.mockAPI = mockAPI;
window.speak = speak;
window.closeModal = closeModal;
window.initializeTabs = initializeTabs;
window.loadBNPLPlans = loadBNPLPlans;
window.loadTermLoans = loadTermLoans;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.logout = logout;
window.getUser = getUser;
window.updateUserDisplay = updateUserDisplay;
