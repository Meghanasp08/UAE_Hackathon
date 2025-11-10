// Transactions.js - Filter and display transactions with voice read

let allTransactions = [];
let filteredTransactions = [];

// Mock transaction data
const mockTransactions = [
  { id: 1, date: '2025-11-05 14:30', merchant: 'ABC Trading', amount: 12000, category: 'Sales', icon: '�', description: 'Sales revenue' },
  { id: 2, date: '2025-11-04 18:45', merchant: 'XYZ Supplies', amount: -3500, category: 'Supplies', icon: '�', description: 'Supplier payment' },
  { id: 3, date: '2025-11-03 08:15', merchant: 'Utilities', amount: -1200, category: 'Utilities', icon: '�', description: 'Utility bill' },
  { id: 4, date: '2025-11-02 20:00', merchant: 'Payroll', amount: -2000, category: 'Payroll', icon: '👥', description: 'Monthly payroll' },
  { id: 5, date: '2025-11-01 10:00', merchant: 'Other Income', amount: 5000, category: 'Income', icon: '💸', description: 'Other income' }
];

document.addEventListener('DOMContentLoaded', () => {
  allTransactions = mockTransactions;
  filteredTransactions = mockTransactions;

  // Filter controls
  const dateFilter = document.getElementById('dateFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const esgFilter = document.getElementById('esgFilter');
  const searchFilter = document.getElementById('searchFilter');
  const clearFilters = document.getElementById('clearFilters');

  // Transaction items
  const transactionItems = document.querySelectorAll('.transaction-item');

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

  const html = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 3rem;">${transaction.icon}</div>
      <h4 style="margin: 0.5rem 0;">${transaction.merchant}</h4>
    </div>
    <div class="detail-row">
      <span>Amount</span>
      <strong style="font-size: 1.3rem; color: ${transaction.amount > 0 ? 'var(--success)' : 'var(--danger)'}">
        ${transaction.amount > 0 ? '+' : ''}AED ${Math.abs(transaction.amount).toFixed(2)}
      </strong>
    </div>
    <div class="detail-row">
      <span>Date & Time</span>
      <strong>${formatDate(transaction.date)}</strong>
    </div>
    <div class="detail-row">
      <span>Category</span>
      <strong>${transaction.category}</strong>
    </div>
    <div class="detail-row">
      <span>Transaction ID</span>
      <strong>TXN${transaction.id.toString().padStart(6, '0')}</strong>
    </div>
    <div class="detail-row" style="border-bottom: none;">
      <span>Description</span>
      <strong style="text-align: right;">${transaction.description}</strong>
    </div>
  `;

  detailDiv.innerHTML = html;
  modal.removeAttribute('hidden');

  speak(`Transaction details for ${transaction.merchant}. Amount ${Math.abs(transaction.amount)} dirhams.`, false);
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

