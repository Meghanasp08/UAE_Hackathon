// Credit-line.js - SmartPay rules and credit management

document.addEventListener('DOMContentLoaded', () => {
  // Auto-sweep toggle
  const autoSweepToggle = document.getElementById('autoSweepToggle');
  const sweepSettings = document.getElementById('sweepSettings');
  const saveSweepSettings = document.getElementById('saveSweepSettings');

  // Transaction buttons
  const withdrawBtn = document.getElementById('withdrawBtn');
  const repayBtn = document.getElementById('repayBtn');
  const transferBtn = document.getElementById('transferBtn');

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
        speak('Auto-sweep enabled. Set your preferences below.', false);
      } else {
        sweepSettings?.setAttribute('hidden', '');
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
