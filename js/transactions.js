// Transactions.js - Filter and display transactions with voice read

let allTransactions = [];
let filteredTransactions = [];

// Real transaction data from CSV account statement
const realTransactions = [
  { id: 1, date: '2025-11-03 17:12', merchant: 'LocalBankTransfer - Credit', amount: 14214.45, category: 'Transfer', icon: '💰', description: 'Local bank transfer credit', type: 'credit', txnId: 'DKUO7TXOLWRZ3T8' },
  { id: 2, date: '2025-11-03 00:32', merchant: 'Deposit Reversal', amount: -17369.94, category: 'Other', icon: '🔄', description: 'Deposit reversal', type: 'debit', txnId: 'PSIIVQIYV7KMKE3' },
  { id: 3, date: '2025-11-02 14:54', merchant: 'POS Purchase', amount: -21855.23, category: 'Shopping', icon: '🛒', description: 'E-commerce refund', type: 'debit', txnId: 'EGHWG38UAUTOO80' },
  { id: 4, date: '2025-11-01 21:42', merchant: 'E-Commerce Purchase', amount: 3721.12, category: 'Shopping', icon: '🛒', description: 'E-commerce reversal credit', type: 'credit', txnId: 'IYVWAZQEG7XN3K6' },
  { id: 5, date: '2025-11-01 07:18', merchant: 'Money Transfer', amount: 16142.26, category: 'Transfer', icon: '💸', description: 'Bill payments money transfer', type: 'credit', txnId: 'TRB9JTAFCNYWIBN' },
  { id: 6, date: '2025-10-31 20:41', merchant: 'POS Transaction', amount: -8465.51, category: 'Shopping', icon: '💳', description: 'POS transaction', type: 'debit', txnId: 'S8R2NL1LTLQO0UY' },
  { id: 7, date: '2025-10-31 08:28', merchant: 'Bank Transfer - Withdrawal', amount: 30586.55, category: 'Transfer', icon: '🏦', description: 'Local bank transfer withdrawal credit', type: 'credit', txnId: 'LFVUEFZRIAFNPEY' },
  { id: 8, date: '2025-10-31 06:23', merchant: 'International Transfer', amount: -2247.79, category: 'Transfer', icon: '🌍', description: 'International transfer deposit', type: 'debit', txnId: '51IBNQFPVW6CNB8' },
  { id: 9, date: '2025-10-30 20:47', merchant: 'Bill Payment', amount: -36006.26, category: 'Bills', icon: '📄', description: 'Bill payments money transfer', type: 'debit', txnId: 'QTXOB23DCMHDTLL' },
  { id: 10, date: '2025-10-28 20:58', merchant: 'POS Withdrawal', amount: 44275.89, category: 'ATM', icon: '🏧', description: 'POS withdrawal credit', type: 'credit', txnId: 'ZUHWREDIJOYNPJG' },
  { id: 11, date: '2025-10-28 12:16', merchant: 'Money Transfer Service', amount: 21855.23, category: 'Transfer', icon: '💸', description: 'Bill payments money transfer', type: 'credit', txnId: 'AC9TVKIVQD254VB' },
  { id: 12, date: '2025-10-28 01:08', merchant: 'E-Commerce Store', amount: -22030.92, category: 'Shopping', icon: '🛒', description: 'E-commerce purchase', type: 'debit', txnId: 'EXCHLNJC7OQWKQS' },
  { id: 13, date: '2025-10-27 01:12', merchant: 'POS Deposit Reversal', amount: -38879.38, category: 'Other', icon: '🔄', description: 'POS deposit reversal', type: 'debit', txnId: 'UUDSRIAFRL7ZQHK' },
  { id: 14, date: '2025-10-26 21:36', merchant: 'Same Bank Transfer', amount: 26560.79, category: 'Transfer', icon: '🏦', description: 'Same bank money transfer', type: 'credit', txnId: 'X0FYE8PCMX6J8C7' },
  { id: 15, date: '2025-10-26 11:40', merchant: 'International Wire', amount: 26160.66, category: 'Transfer', icon: '🌍', description: 'International transfer', type: 'credit', txnId: 'KZ74SUPKA00W09K' }
];

document.addEventListener('DOMContentLoaded', () => {
  allTransactions = realTransactions;
  filteredTransactions = realTransactions;

  // Update summary cards with real data
  updateSummaryCards();

  // Filter controls
  const dateFilter = document.getElementById('dateFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const esgFilter = document.getElementById('esgFilter');
  const searchFilter = document.getElementById('searchFilter');
  const clearFilters = document.getElementById('clearFilters');

  // Track active BNPL plans
  let activeBNPLPlans = JSON.parse(localStorage.getItem('activeBNPLPlans') || '[]');
  const MAX_BNPL_PLANS = 3;

  // Add demo BNPL plans if none exist to showcase the feature
  if (activeBNPLPlans.length === 0) {
    const demoBNPLPlans = [
      {
        id: Date.now() - 1000,
        originalTransactionId: 3,
        merchant: 'POS Purchase',
        totalAmount: 21855.23,
        installmentAmount: 5463.81,
        transactionId: 'EGHWG38UAUTOO80',
        createdDate: '2025-11-08T10:00:00.000Z',
        status: 'active',
        installments: [
          {
            installmentNumber: 1,
            amount: 5463.81,
            dueDate: '2025-11-08T10:00:00.000Z',
            status: 'paid',
            paidDate: '2025-11-08T10:00:00.000Z'
          },
          {
            installmentNumber: 2,
            amount: 5463.81,
            dueDate: '2025-12-08T10:00:00.000Z',
            status: 'pending',
            paidDate: null
          },
          {
            installmentNumber: 3,
            amount: 5463.81,
            dueDate: '2026-01-08T10:00:00.000Z',
            status: 'pending',
            paidDate: null
          },
          {
            installmentNumber: 4,
            amount: 5463.80,
            dueDate: '2026-02-08T10:00:00.000Z',
            status: 'pending',
            paidDate: null
          }
        ]
      },
      {
        id: Date.now() - 2000,
        originalTransactionId: 12,
        merchant: 'E-Commerce Store',
        totalAmount: 22030.92,
        installmentAmount: 5507.73,
        transactionId: 'EXCHLNJC7OQWKQS',
        createdDate: '2025-11-05T14:30:00.000Z',
        status: 'active',
        installments: [
          {
            installmentNumber: 1,
            amount: 5507.73,
            dueDate: '2025-11-05T14:30:00.000Z',
            status: 'paid',
            paidDate: '2025-11-05T14:30:00.000Z'
          },
          {
            installmentNumber: 2,
            amount: 5507.73,
            dueDate: '2025-12-05T14:30:00.000Z',
            status: 'paid',
            paidDate: '2025-12-01T09:15:00.000Z'
          },
          {
            installmentNumber: 3,
            amount: 5507.73,
            dueDate: '2026-01-05T14:30:00.000Z',
            status: 'pending',
            paidDate: null
          },
          {
            installmentNumber: 4,
            amount: 5507.73,
            dueDate: '2026-02-05T14:30:00.000Z',
            status: 'pending',
            paidDate: null
          }
        ]
      }
    ];
    
    activeBNPLPlans = demoBNPLPlans;
    localStorage.setItem('activeBNPLPlans', JSON.stringify(activeBNPLPlans));
  }

  // Display active BNPL plans
  displayActiveBNPLPlans();

  // Dynamically generate transaction items from real data
  const transactionsList = document.querySelector('.transactions-list');
  if (transactionsList) {
    // Clear existing static transactions
    transactionsList.innerHTML = '';
    
    // Generate dynamic transactions from real data
    realTransactions.forEach(txn => {
      const isEligibleForBNPL = txn.type === 'debit' && Math.abs(txn.amount) > 500 && activeBNPLPlans.length < MAX_BNPL_PLANS;
      
      // Debug logging
      if (txn.type === 'debit') {
        console.log(`Transaction ${txn.merchant}: ${Math.abs(txn.amount)} AED - BNPL Eligible: ${isEligibleForBNPL}`);
      }
      
      const transactionItem = document.createElement('div');
      transactionItem.className = 'transaction-item';
      transactionItem.dataset.id = txn.id;
      transactionItem.dataset.carbon = 'medium'; // Default ESG rating
      
      transactionItem.innerHTML = `
        <div class="transaction-icon">${txn.icon}</div>
        <div class="transaction-details">
          <div class="transaction-main">
            <span class="merchant">${txn.merchant}</span>
            <span class="amount ${txn.type === 'credit' ? 'positive' : ''}">${txn.type === 'credit' ? '+' : '-'}AED ${Math.abs(txn.amount).toLocaleString('en-AE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div class="transaction-meta">
            <span class="date">${formatTransactionDate(txn.date)}</span>
            <span class="category">${txn.category}</span>
            <span class="esg-badge medium">Medium Impact</span>
          </div>
        </div>
        ${isEligibleForBNPL ? '<button class="bnpl-btn" data-bnpl="true" style="display: inline-block;">Convert to BNPL</button>' : ''}
        <button class="transaction-expand" aria-label="View details">›</button>
      `;
      
      transactionsList.appendChild(transactionItem);
      
      // Add BNPL click handler if eligible
      if (isEligibleForBNPL) {
        const bnplBtn = transactionItem.querySelector('.bnpl-btn');
        bnplBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showBnplModal({
            merchant: txn.merchant,
            amount: Math.abs(txn.amount),
            date: txn.date,
            txnId: txn.txnId,
            id: txn.id
          });
        });
      }
      
      // Add transaction detail click handler
      transactionItem.addEventListener('click', () => {
        showTransactionDetail(txn);
      });
    });
  }

  // Helper function to format transaction date
  function formatTransactionDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Update summary cards with real transaction data
  function updateSummaryCards() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter transactions for current month
    const thisMonthTransactions = realTransactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });
    
    // Calculate total spent (debit transactions only)
    const totalSpent = thisMonthTransactions
      .filter(txn => txn.type === 'debit')
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    
    // Count transactions
    const transactionCount = thisMonthTransactions.length;
    
    // Count eco-friendly transactions (transfers, public transport, etc.)
    const ecoFriendlyCount = thisMonthTransactions
      .filter(txn => txn.category === 'Transfer' || txn.merchant.toLowerCase().includes('metro') || txn.merchant.toLowerCase().includes('electric'))
      .length;
    
    // Update the summary cards
    const totalSpentEl = document.querySelector('.summary-card .summary-value');
    const transactionCountEl = document.querySelectorAll('.summary-card .summary-value')[1];
    const ecoFriendlyEl = document.querySelectorAll('.summary-card .summary-value')[2];
    
    if (totalSpentEl) {
      totalSpentEl.textContent = `AED ${totalSpent.toLocaleString('en-AE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    }
    if (transactionCountEl) {
      transactionCountEl.textContent = transactionCount.toString();
    }
    if (ecoFriendlyEl) {
      ecoFriendlyEl.textContent = ecoFriendlyCount.toString();
    }
  }

  // Display active BNPL plans
  function displayActiveBNPLPlans() {
    const bnplSection = document.getElementById('bnplPlansSection');
    const bnplPlansList = document.getElementById('bnplPlansList');
    
    if (!bnplSection || !bnplPlansList) return;
    
    // Always show the section if we have plans or want to demo the feature
    bnplSection.style.display = 'block';
    bnplPlansList.innerHTML = '';
    
    if (activeBNPLPlans.length === 0) {
      bnplPlansList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
          <h4>No Active BNPL Plans</h4>
          <p>Convert eligible transactions (>AED 500) to installment plans below.</p>
        </div>
      `;
      return;
    }
    
    activeBNPLPlans.forEach(plan => {
      const planCard = document.createElement('div');
      planCard.className = 'bnpl-plan-card';
      planCard.dataset.planId = plan.id;
      
      // Calculate remaining amount
      const paidInstallments = plan.installments.filter(inst => inst.status === 'paid').length;
      const remainingAmount = (plan.totalAmount - (paidInstallments * plan.installmentAmount)).toFixed(2);
      
      // Generate installment schedule
      let installmentsHtml = '';
      plan.installments.forEach((installment, index) => {
        const dueDate = new Date(installment.dueDate);
        const isOverdue = installment.status === 'pending' && dueDate < new Date();
        const statusClass = installment.status === 'paid' ? 'paid' : (isOverdue ? 'overdue' : 'pending');
        
        installmentsHtml += `
          <div class="installment-item ${statusClass}">
            <div class="installment-info">
              <span class="installment-number">Payment ${installment.installmentNumber}</span>
              <span class="installment-amount">AED ${installment.amount.toFixed(2)}</span>
            </div>
            <div class="installment-meta">
              <span class="due-date">Due: ${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span class="status-badge ${statusClass}">${installment.status === 'paid' ? '✓ Paid' : (isOverdue ? '⚠ Overdue' : '⏳ Pending')}</span>
            </div>
          </div>
        `;
      });
      
      const createdDate = new Date(plan.createdDate);
      const nextDueInstallment = plan.installments.find(inst => inst.status === 'pending');
      
      planCard.innerHTML = `
        <div class="plan-header">
          <div class="plan-merchant">
            <h4>💳 ${plan.merchant}</h4>
            <span class="plan-id">Created: ${createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • TXN: ${plan.transactionId}</span>
          </div>
          <div class="plan-amount">
            <div class="total-amount">AED ${plan.totalAmount.toLocaleString('en-AE', {minimumFractionDigits: 2})}</div>
            <div class="remaining-amount">Remaining: AED ${remainingAmount}</div>
          </div>
        </div>
        <div class="plan-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(paidInstallments / 4) * 100}%"></div>
          </div>
          <span class="progress-text">${paidInstallments}/4 payments completed • ${nextDueInstallment ? 'Next due: ' + new Date(nextDueInstallment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Plan completed!'}</span>
        </div>
        <div class="plan-installments">
          ${installmentsHtml}
        </div>
        <div class="plan-actions">
          <button class="btn-outline view-plan-details" data-plan-id="${plan.id}">📊 View Details</button>
          ${paidInstallments < 4 ? '<button class="btn-primary pay-installment" data-plan-id="' + plan.id + '">💰 Pay Next (AED ' + (nextDueInstallment ? nextDueInstallment.amount.toFixed(0) : '0') + ')</button>' : '<button class="btn-success" disabled>✅ Completed</button>'}
        </div>
      `;
      
      bnplPlansList.appendChild(planCard);
    });
    
    // Add event listeners for plan actions
    document.querySelectorAll('.view-plan-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.target.dataset.planId;
        showPlanDetails(planId);
      });
    });
    
    document.querySelectorAll('.pay-installment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.target.dataset.planId;
        payNextInstallment(planId);
      });
    });
  }
  
  // Show plan details modal
  function showPlanDetails(planId) {
    const plan = activeBNPLPlans.find(p => p.id == planId);
    if (!plan) return;
    
    alert(`BNPL Plan Details:\n\n` +
          `Merchant: ${plan.merchant}\n` +
          `Total Amount: AED ${plan.totalAmount.toFixed(2)}\n` +
          `Created: ${new Date(plan.createdDate).toLocaleDateString('en-GB')}\n` +
          `Status: ${plan.status}\n` +
          `Transaction ID: ${plan.transactionId}`);
  }
  
  // Pay next installment
  function payNextInstallment(planId) {
    const planIndex = activeBNPLPlans.findIndex(p => p.id == planId);
    if (planIndex === -1) return;
    
    const plan = activeBNPLPlans[planIndex];
    const nextInstallment = plan.installments.find(inst => inst.status === 'pending');
    
    if (!nextInstallment) {
      alert('No pending installments found.');
      return;
    }
    
    if (confirm(`Pay installment ${nextInstallment.installmentNumber} of AED ${nextInstallment.amount.toFixed(2)}?`)) {
      // Mark installment as paid
      nextInstallment.status = 'paid';
      nextInstallment.paidDate = new Date().toISOString();
      
      // Check if plan is completed
      const remainingInstallments = plan.installments.filter(inst => inst.status === 'pending');
      if (remainingInstallments.length === 0) {
        plan.status = 'completed';
        // Remove from active plans
        activeBNPLPlans.splice(planIndex, 1);
      }
      
      // Update localStorage
      localStorage.setItem('activeBNPLPlans', JSON.stringify(activeBNPLPlans));
      
      alert(`✅ Payment Successful!\n\nInstallment ${nextInstallment.installmentNumber} paid: AED ${nextInstallment.amount.toFixed(2)}`);
      
      // Refresh display
      displayActiveBNPLPlans();
    }
  }

  // BNPL Modal logic
  const bnplModal = document.getElementById('bnplModal');
  const bnplPlanDetail = document.getElementById('bnplPlanDetail');
  const closeBnplModal = document.getElementById('closeBnplModal');
  const confirmBnplPlan = document.getElementById('confirmBnplPlan');

  function showBnplModal(txn) {
    if (!bnplModal || !bnplPlanDetail) return;
    
    // Calculate 4 equal installments
    const installment = (txn.amount / 4).toFixed(2);
    const today = new Date();
    let scheduleHtml = '<h4>4-Payment Installment Plan</h4><div style="background:#f8f9fa;padding:1rem;border-radius:8px;margin:1rem 0;"><ul style="list-style:none;padding:0;margin:0;">';
    
    for (let i = 0; i < 4; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i);
      const isFirstPayment = i === 0;
      scheduleHtml += `
        <li style="padding:0.75rem 0;border-bottom:${i < 3 ? '1px solid #dee2e6' : 'none'};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span><strong>Payment ${i+1}</strong></span>
            <span style="font-weight:bold;color:${isFirstPayment ? '#28a745' : '#007bff'};">AED ${installment}</span>
          </div>
          <div style="font-size:0.9em;color:#6c757d;margin-top:0.25rem;">
            Due: ${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            ${isFirstPayment ? ' <span style="color:#28a745;font-weight:bold;">(Paid immediately)</span>' : ''}
          </div>
        </li>
      `;
    }
    scheduleHtml += '</ul></div>';
    
    bnplPlanDetail.innerHTML = `
      <div style="margin-bottom:1.5rem;padding:1rem;background:#e8f4fd;border-radius:8px;">
        <div style="display:flex;align-items:center;margin-bottom:0.5rem;">
          <span style="font-size:1.5rem;margin-right:0.5rem;">💳</span>
          <strong style="font-size:1.1em;">${txn.merchant}</strong>
        </div>
        <div style="font-size:1.2em;color:#007bff;font-weight:bold;">
          Total: AED ${txn.amount.toLocaleString('en-AE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        <div style="font-size:0.9em;color:#6c757d;margin-top:0.25rem;">
          Transaction ID: ${txn.txnId}
        </div>
      </div>
      ${scheduleHtml}
      <div style="margin-top:1rem;padding:0.75rem;background:#fff3cd;border-radius:6px;font-size:0.9em;color:#856404;">
        <strong>Note:</strong> First payment will be processed immediately. Maximum 3 active BNPL plans allowed per user.
      </div>
    `;
    
    bnplModal.removeAttribute('hidden');
    
    // Store transaction data for confirmation
    bnplModal.dataset.txnAmount = txn.amount;
    bnplModal.dataset.txnMerchant = txn.merchant;
    bnplModal.dataset.txnId = txn.txnId;
    bnplModal.dataset.originalTxnId = txn.id;
  }

  if (closeBnplModal) {
    closeBnplModal.addEventListener('click', () => {
      bnplModal.setAttribute('hidden', '');
    });
  }
  if (confirmBnplPlan) {
    confirmBnplPlan.addEventListener('click', () => {
      const amount = parseFloat(bnplModal.dataset.txnAmount);
      const merchant = bnplModal.dataset.txnMerchant;
      const txnId = bnplModal.dataset.txnId;
      const originalTxnId = bnplModal.dataset.originalTxnId;
      
      // Create BNPL plan
      const bnplPlan = {
        id: Date.now(), // Simple ID generation
        originalTransactionId: originalTxnId,
        merchant: merchant,
        totalAmount: amount,
        installmentAmount: (amount / 4).toFixed(2),
        transactionId: txnId,
        createdDate: new Date().toISOString(),
        status: 'active',
        installments: []
      };
      
      // Generate 4 installments
      const today = new Date();
      for (let i = 0; i < 4; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);
        
        bnplPlan.installments.push({
          installmentNumber: i + 1,
          amount: parseFloat((amount / 4).toFixed(2)),
          dueDate: dueDate.toISOString(),
          status: i === 0 ? 'paid' : 'pending', // First payment is automatic
          paidDate: i === 0 ? new Date().toISOString() : null
        });
      }
      
      // Store BNPL plan
      activeBNPLPlans.push(bnplPlan);
      localStorage.setItem('activeBNPLPlans', JSON.stringify(activeBNPLPlans));
      
      // Close modal and show success
      bnplModal.setAttribute('hidden', '');
      
      // Show success message with details
      const firstPayment = bnplPlan.installmentAmount;
      alert(`✅ BNPL Plan Created Successfully!\n\n` +
            `Merchant: ${merchant}\n` +
            `Total Amount: AED ${amount.toLocaleString('en-AE', {minimumFractionDigits: 2})}\n` +
            `First Payment: AED ${firstPayment} (Processed)\n` +
            `Remaining: 3 monthly payments of AED ${firstPayment} each\n\n` +
            `Active BNPL Plans: ${activeBNPLPlans.length}/${MAX_BNPL_PLANS}`);
      
      // Refresh the transaction list to update BNPL button visibility
      location.reload();
    });
  }

  // Detail modal
  const detailModal = document.getElementById('detailModal');
  const voiceRead = document.getElementById('voiceRead');
  const downloadReceipt = document.getElementById('downloadReceipt');

  // Load more
  const loadMore = document.getElementById('loadMore');

  // Apply filters
  const applyFilters = () => {
    filteredTransactions = allTransactions.filter(txn => {
      // Date filter
      const dateValue = dateFilter?.value;
      if (dateValue && dateValue !== 'all') {
        const daysAgo = parseInt(dateValue);
        const txnDate = new Date(txn.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        if (txnDate < cutoffDate) return false;
      }

      // Category filter
      const categoryValue = categoryFilter?.value;
      if (categoryValue && categoryValue !== 'all') {
        if (!txn.category.toLowerCase().includes(categoryValue.toLowerCase())) return false;
      }

      // ESG filter
      const esgValue = esgFilter?.value;
      if (esgValue && esgValue !== 'all') {
        if (txn.carbon !== esgValue) return false;
      }

      // Search filter
      const searchValue = searchFilter?.value.toLowerCase();
      if (searchValue) {
        if (!txn.merchant.toLowerCase().includes(searchValue)) return false;
      }

      return true;
    });

    console.log(`Filtered: ${filteredTransactions.length} of ${allTransactions.length} transactions`);
    updateTransactionDisplay();
  };

  // Update display (in real app would re-render list)
  const updateTransactionDisplay = () => {
    const transactionsList = document.querySelector('.transactions-list');
    if (!transactionsList) return;

    // Hide all transactions first
    const allItems = transactionsList.querySelectorAll('.transaction-item');
    allItems.forEach(item => item.style.display = 'none');

    // Show filtered transactions
    filteredTransactions.forEach(txn => {
      const item = Array.from(allItems).find(el => el.dataset.id === txn.id.toString());
      if (item) {
        item.style.display = 'flex';
      }
    });

    speak(`Showing ${filteredTransactions.length} transactions.`, false);
  };

  // Filter event listeners
  if (dateFilter) {
    dateFilter.addEventListener('change', applyFilters);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
  if (esgFilter) {
    esgFilter.addEventListener('change', applyFilters);
  }
  if (searchFilter) {
    searchFilter.addEventListener('input', applyFilters);
  }

  // Clear filters
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '30';
      if (categoryFilter) categoryFilter.value = 'all';
      if (esgFilter) esgFilter.value = 'all';
      if (searchFilter) searchFilter.value = '';
      
      filteredTransactions = allTransactions;
      updateTransactionDisplay();
      speak('Filters cleared.', false);
    });
  }

  // Transaction click handlers
  transactionItems.forEach(item => {
    item.addEventListener('click', () => {
      const txnId = item.dataset.id;
      const transaction = mockTransactions.find(t => t.id === parseInt(txnId));
      
      if (transaction) {
        showTransactionDetail(transaction);
      }
    });
  });

  // Voice read transaction
  if (voiceRead) {
    voiceRead.addEventListener('click', () => {
      const detailEl = document.getElementById('transactionDetail');
      if (detailEl) {
        const text = detailEl.textContent.replace(/\s+/g, ' ').trim();
        speak(text, true);
      }
    });
  }

  // Download receipt
  if (downloadReceipt) {
    downloadReceipt.addEventListener('click', () => {
      speak('Receipt downloaded successfully.');
      console.log('Downloading receipt...');
    });
  }

  // Load more
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      speak('Loading more transactions.', false);
      // In real app, would fetch more from API
      setTimeout(() => {
        speak('All transactions loaded.', false);
        loadMore.style.display = 'none';
      }, 1000);
    });
  }
});

// Show transaction detail modal
const showTransactionDetail = (transaction) => {
  const modal = document.getElementById('detailModal');
  const detailDiv = document.getElementById('transactionDetail');

  if (!modal || !detailDiv) return;

  const isCredit = transaction.type === 'credit';
  const amountColor = isCredit ? '#28a745' : '#dc3545';

  const html = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 3rem;">${transaction.icon}</div>
      <h4 style="margin: 0.5rem 0;">${transaction.merchant}</h4>
    </div>
    <div class="detail-row">
      <span>Amount</span>
      <strong style="font-size: 1.3rem; color: ${amountColor}">
        ${isCredit ? '+' : '-'}AED ${Math.abs(transaction.amount).toLocaleString('en-AE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
      </strong>
    </div>
    <div class="detail-row">
      <span>Date & Time</span>
      <strong>${formatTransactionDate(transaction.date)}</strong>
    </div>
    <div class="detail-row">
      <span>Category</span>
      <strong>${transaction.category}</strong>
    </div>
    <div class="detail-row">
      <span>Transaction ID</span>
      <strong>${transaction.txnId}</strong>
    </div>
    <div class="detail-row">
      <span>Type</span>
      <strong>${transaction.type === 'credit' ? 'Credit' : 'Debit'}</strong>
    </div>
    <div class="detail-row" style="border-bottom: none;">
      <span>Description</span>
      <strong style="text-align: right;">${transaction.description}</strong>
    </div>
  `;

  detailDiv.innerHTML = html;
  modal.removeAttribute('hidden');

  // Use the speak function if available
  if (typeof speak !== 'undefined') {
    speak(`Transaction details for ${transaction.merchant}. Amount ${Math.abs(transaction.amount)} dirhams.`, false);
  }
};

// Helper functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

