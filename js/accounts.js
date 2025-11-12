// accounts.js - Handle account data display and OAuth flow

let accountDataCache = null;
let isRefreshing = false;

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
  
  // Setup tab switching
  setupTabs();
  
  // Setup refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (!isRefreshing) {
        fetchAccountData(true);
      }
    });
  }
});

/**
 * Check if returning from OAuth flow
 */
function checkOAuthReturn() {
  const phpData = window.phpData || {};
  
  console.log('🔍 Checking OAuth return status...', phpData);
  
  // If bank is already connected and we haven't fetched data yet
  if (phpData.bankConnected && !accountDataCache) {
    console.log('✅ Bank connected - fetching account data...');
    fetchAccountData();
  }
  
  // If just returned from successful OAuth
  if (phpData.oauthSuccess) {
    console.log('✅ Returning from successful OAuth flow - fetching account data...');
    
    // Clean up URL
    if (window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // Fetch account data
    fetchAccountData();
  }
  
  // If OAuth error occurred
  if (phpData.oauthError) {
    console.error('❌ OAuth error:', phpData.oauthError);
    showError('Authentication failed: ' + phpData.oauthError);
  }
}

/**
 * Fetch account data from all APIs
 */
async function fetchAccountData(forceRefresh = false) {
  if (isRefreshing) {
    console.log('⏳ Already refreshing, skipping...');
    return;
  }
  
  isRefreshing = true;
  
  // Show loading indicator
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorDisplay = document.getElementById('errorDisplay');
  const dataTabs = document.getElementById('dataTabs');
  const quickSummary = document.getElementById('quickSummary');
  const refreshBtn = document.getElementById('refreshBtn');
  
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorDisplay) errorDisplay.style.display = 'none';
  if (dataTabs) dataTabs.style.display = 'none';
  if (quickSummary) quickSummary.style.display = 'none';
  if (refreshBtn) refreshBtn.disabled = true;
  
  updateLoadingStatus('Connecting to Nebras Open Banking...');
  
  try {
    console.log('🚀 Fetching account data from API...');
    
    const response = await fetch('api/fetch_account_data.php', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📦 Received account data:', data);
    
    if (data.success) {
      // Cache the data
      accountDataCache = data;
      
      // Update loading status
      updateLoadingStatus('Processing account information...');
      
      // Wait a bit for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Display the data
      displayAccountData(data);
      
      // Hide loading, show data
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (dataTabs) dataTabs.style.display = 'block';
      if (quickSummary) quickSummary.style.display = 'block';
      
      console.log('✅ Account data displayed successfully');
      
    } else {
      throw new Error(data.error || 'Failed to fetch account data');
    }
    
  } catch (error) {
    console.error('❌ Error fetching account data:', error);
    
    // Hide loading
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Show error
    showError(error.message || 'Failed to fetch account data. Please try again.');
    
  } finally {
    isRefreshing = false;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

/**
 * Update loading status message
 */
function updateLoadingStatus(message) {
  const statusElement = document.getElementById('loadingStatus');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

/**
 * Display account data in the UI
 */
function displayAccountData(data) {
  console.log('🎨 Displaying account data...');
  
  // Update quick summary
  updateQuickSummary(data);
  
  // Display each API response
  if (data.apis) {
    if (data.apis.multiaccounts) {
      displayMultiAccounts(data.apis.multiaccounts);
    }
    
    if (data.apis.accountinfo) {
      displayAccountInfo(data.apis.accountinfo);
    }
    
    if (data.apis.balance) {
      displayBalance(data.apis.balance);
    }
    
    if (data.apis.transactions) {
      displayTransactions(data.apis.transactions);
    }
    
    if (data.apis.beneficiaries) {
      displayBeneficiaries(data.apis.beneficiaries);
    }
  }
}

/**
 * Update quick summary section
 */
function updateQuickSummary(data) {
  let totalAccounts = 0;
  let totalBalance = 'N/A';
  let totalTransactions = 0;
  let totalBeneficiaries = 0;
  
  // Count accounts
  if (data.apis?.multiaccounts?.success && data.apis.multiaccounts.data?.message?.Data?.Account) {
    totalAccounts = data.apis.multiaccounts.data.message.Data.Account.length;
  }
  
  // Get balance
  if (data.apis?.balance?.success && data.apis.balance.data?.message?.Data?.Balance) {
    const balances = data.apis.balance.data.message.Data.Balance;
    if (balances.length > 0 && balances[0].Amount) {
      totalBalance = `${balances[0].Amount.Currency} ${parseFloat(balances[0].Amount.Amount).toLocaleString()}`;
    }
  }
  
  // Count transactions
  if (data.apis?.transactions?.success && data.apis.transactions.data?.message?.Data?.Transaction) {
    totalTransactions = data.apis.transactions.data.message.Data.Transaction.length;
  }
  
  // Count beneficiaries
  if (data.apis?.beneficiaries?.success && data.apis.beneficiaries.data?.message?.Data?.Beneficiary) {
    totalBeneficiaries = data.apis.beneficiaries.data.message.Data.Beneficiary.length;
  }
  
  // Update DOM
  const totalAccountsEl = document.getElementById('totalAccounts');
  const totalBalanceEl = document.getElementById('totalBalance');
  const totalTransactionsEl = document.getElementById('totalTransactions');
  const totalBeneficiariesEl = document.getElementById('totalBeneficiaries');
  
  if (totalAccountsEl) totalAccountsEl.textContent = totalAccounts;
  if (totalBalanceEl) totalBalanceEl.textContent = totalBalance;
  if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions;
  if (totalBeneficiariesEl) totalBeneficiariesEl.textContent = totalBeneficiaries;
}

/**
 * Display Multi Accounts data
 */
function displayMultiAccounts(apiData) {
  const container = document.getElementById('multiaccountsData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch accounts'}</span>
      </div>
    `;
    return;
  }
  
  const accounts = apiData.data?.message?.Data?.Account || [];
  
  if (accounts.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">No accounts found.</p>';
    return;
  }
  
  let html = '';
  
  accounts.forEach((account, index) => {
    html += `
      <div class="account-item">
        <h4>Account ${index + 1}: ${account.Nickname || account.AccountId}</h4>
        <div class="account-detail">
          <span class="detail-label">Account ID</span>
          <span class="detail-value">${account.AccountId || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Account Type</span>
          <span class="detail-value">${account.AccountType || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Account Subtype</span>
          <span class="detail-value">${account.AccountSubType || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Currency</span>
          <span class="detail-value">${account.Currency || 'N/A'}</span>
        </div>
        ${account.Account ? `
          <div class="account-detail">
            <span class="detail-label">Account Number</span>
            <span class="detail-value">${account.Account[0]?.Identification || 'N/A'}</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  html += `
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; color: #7B2687; font-weight: 600; padding: 0.5rem;">
        View Raw JSON Data
      </summary>
      <div class="json-viewer">${JSON.stringify(apiData.data, null, 2)}</div>
    </details>
  `;
  
  container.innerHTML = html;
}

/**
 * Display Account Info data
 */
function displayAccountInfo(apiData) {
  const container = document.getElementById('accountinfoData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch account info'}</span>
      </div>
    `;
    return;
  }
  
  const accountData = apiData.data?.message?.Data?.Account || {};
  
  let html = `
    <div class="account-item">
      <h4>${accountData.Nickname || 'Account Details'}</h4>
      <div class="account-detail">
        <span class="detail-label">Account ID</span>
        <span class="detail-value">${accountData.AccountId || 'N/A'}</span>
      </div>
      <div class="account-detail">
        <span class="detail-label">Status</span>
        <span class="detail-value">${accountData.Status || 'N/A'}</span>
      </div>
      <div class="account-detail">
        <span class="detail-label">Status Update Time</span>
        <span class="detail-value">${accountData.StatusUpdateDateTime || 'N/A'}</span>
      </div>
      <div class="account-detail">
        <span class="detail-label">Currency</span>
        <span class="detail-value">${accountData.Currency || 'N/A'}</span>
      </div>
      <div class="account-detail">
        <span class="detail-label">Account Type</span>
        <span class="detail-value">${accountData.AccountType || 'N/A'}</span>
      </div>
      <div class="account-detail">
        <span class="detail-label">Account Subtype</span>
        <span class="detail-value">${accountData.AccountSubType || 'N/A'}</span>
      </div>
    </div>
    
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; color: #7B2687; font-weight: 600; padding: 0.5rem;">
        View Raw JSON Data
      </summary>
      <div class="json-viewer">${JSON.stringify(apiData.data, null, 2)}</div>
    </details>
  `;
  
  container.innerHTML = html;
}

/**
 * Display Balance data
 */
function displayBalance(apiData) {
  const container = document.getElementById('balanceData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch balance'}</span>
      </div>
    `;
    return;
  }
  
  const balances = apiData.data?.message?.Data?.Balance || [];
  
  if (balances.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">No balance information available.</p>';
    return;
  }
  
  let html = '';
  
  balances.forEach((balance, index) => {
    const amount = balance.Amount || {};
    const creditLine = balance.CreditLine || [];
    
    html += `
      <div class="account-item">
        <h4>Balance ${index + 1}: ${balance.Type || 'N/A'}</h4>
        <div class="account-detail">
          <span class="detail-label">Amount</span>
          <span class="detail-value" style="font-size: 1.5rem; font-weight: bold; color: #7B2687;">
            ${amount.Currency || ''} ${amount.Amount ? parseFloat(amount.Amount).toLocaleString() : 'N/A'}
          </span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Credit/Debit Indicator</span>
          <span class="detail-value">${balance.CreditDebitIndicator || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${balance.DateTime || 'N/A'}</span>
        </div>
        ${creditLine.length > 0 ? `
          <div class="account-detail">
            <span class="detail-label">Credit Line</span>
            <span class="detail-value">
              ${creditLine[0].Amount?.Currency || ''} ${creditLine[0].Amount?.Amount ? parseFloat(creditLine[0].Amount.Amount).toLocaleString() : 'N/A'}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  html += `
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; color: #7B2687; font-weight: 600; padding: 0.5rem;">
        View Raw JSON Data
      </summary>
      <div class="json-viewer">${JSON.stringify(apiData.data, null, 2)}</div>
    </details>
  `;
  
  container.innerHTML = html;
}

/**
 * Display Transactions data
 */
function displayTransactions(apiData) {
  const container = document.getElementById('transactionsData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch transactions'}</span>
      </div>
    `;
    return;
  }
  
  const transactions = apiData.data?.message?.Data?.Transaction || [];
  
  if (transactions.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">No transactions found.</p>';
    return;
  }
  
  let html = '<div style="margin-bottom: 1rem;">';
  html += `<p style="color: #64748b; font-size: 0.875rem;">Showing ${transactions.length} transaction(s)</p>`;
  html += '</div>';
  
  transactions.slice(0, 20).forEach((txn, index) => {
    const amount = txn.Amount || {};
    const isCredit = txn.CreditDebitIndicator === 'Credit';
    
    html += `
      <div class="account-item" style="border-left: 4px solid ${isCredit ? '#10b981' : '#ef4444'};">
        <h4 style="display: flex; justify-content: space-between; align-items: center;">
          <span>Transaction ${index + 1}</span>
          <span style="font-size: 1.25rem; font-weight: bold; color: ${isCredit ? '#10b981' : '#ef4444'};">
            ${isCredit ? '+' : '-'} ${amount.Currency || ''} ${amount.Amount ? parseFloat(amount.Amount).toLocaleString() : 'N/A'}
          </span>
        </h4>
        <div class="account-detail">
          <span class="detail-label">Type</span>
          <span class="detail-value">${txn.CreditDebitIndicator || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Status</span>
          <span class="detail-value">${txn.Status || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Booking Date</span>
          <span class="detail-value">${txn.BookingDateTime || 'N/A'}</span>
        </div>
        ${txn.TransactionInformation ? `
          <div class="account-detail">
            <span class="detail-label">Information</span>
            <span class="detail-value">${txn.TransactionInformation}</span>
          </div>
        ` : ''}
        ${txn.TransactionReference ? `
          <div class="account-detail">
            <span class="detail-label">Reference</span>
            <span class="detail-value">${txn.TransactionReference}</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  if (transactions.length > 20) {
    html += `<p style="color: #64748b; font-style: italic; text-align: center; margin-top: 1rem;">
      Showing first 20 of ${transactions.length} transactions
    </p>`;
  }
  
  html += `
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; color: #7B2687; font-weight: 600; padding: 0.5rem;">
        View Raw JSON Data
      </summary>
      <div class="json-viewer">${JSON.stringify(apiData.data, null, 2)}</div>
    </details>
  `;
  
  container.innerHTML = html;
}

/**
 * Display Beneficiaries data
 */
function displayBeneficiaries(apiData) {
  const container = document.getElementById('beneficiariesData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch beneficiaries'}</span>
      </div>
    `;
    return;
  }
  
  const beneficiaries = apiData.data?.message?.Data?.Beneficiary || [];
  
  if (beneficiaries.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">No beneficiaries found.</p>';
    return;
  }
  
  let html = '';
  
  beneficiaries.forEach((beneficiary, index) => {
    html += `
      <div class="account-item">
        <h4>👤 Beneficiary ${index + 1}</h4>
        <div class="account-detail">
          <span class="detail-label">Beneficiary ID</span>
          <span class="detail-value">${beneficiary.BeneficiaryId || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Account ID</span>
          <span class="detail-value">${beneficiary.AccountId || 'N/A'}</span>
        </div>
        ${beneficiary.Reference ? `
          <div class="account-detail">
            <span class="detail-label">Reference</span>
            <span class="detail-value">${beneficiary.Reference}</span>
          </div>
        ` : ''}
        ${beneficiary.CreditorAccount ? `
          <div class="account-detail">
            <span class="detail-label">Creditor Account</span>
            <span class="detail-value">${beneficiary.CreditorAccount.Identification || 'N/A'}</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  html += `
    <details style="margin-top: 1rem;">
      <summary style="cursor: pointer; color: #7B2687; font-weight: 600; padding: 0.5rem;">
        View Raw JSON Data
      </summary>
      <div class="json-viewer">${JSON.stringify(apiData.data, null, 2)}</div>
    </details>
  `;
  
  container.innerHTML = html;
}

/**
 * Show error message
 */
function showError(message) {
  const errorDisplay = document.getElementById('errorDisplay');
  const errorMessage = document.getElementById('errorMessage');
  
  if (errorDisplay && errorMessage) {
    errorMessage.textContent = message;
    errorDisplay.style.display = 'block';
  }
}

/**
 * Setup tab switching functionality
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.getElementById('tab-' + targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}
