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
    
    if (data.apis.products) {
      displayProducts(data.apis.products);
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
  const accountId = apiData.data?.message?.Data?.AccountId || 'N/A';
  
  let html = `
    <div class="account-item">
      <h4>${accountData.Nickname || 'Account Details'}</h4>
      <div class="account-detail">
        <span class="detail-label">Account ID</span>
        <span class="detail-value">${accountId}</span>
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
  const accountId = apiData.data?.message?.Data?.AccountId || 'N/A';
  
  if (beneficiaries.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">No beneficiaries found.</p>';
    return;
  }
  
  let html = `
    <div class="account-item" style="background: linear-gradient(135deg, #7B2687 0%, #B83280 100%); color: white; border: none;">
      <h4 style="color: white; margin: 0 0 0.5rem 0;">🏦 Account Information</h4>
      <div class="account-detail" style="border-bottom-color: rgba(255,255,255,0.2);">
        <span class="detail-label" style="color: rgba(255,255,255,0.9);">Account ID</span>
        <span class="detail-value" style="color: white; font-weight: 600;">${accountId}</span>
      </div>
      <div class="account-detail" style="border-bottom: none;">
        <span class="detail-label" style="color: rgba(255,255,255,0.9);">Total Beneficiaries</span>
        <span class="detail-value" style="color: white; font-weight: 600;">${beneficiaries.length}</span>
      </div>
    </div>
  `;
  
  beneficiaries.forEach((beneficiary, index) => {
    html += `
      <div class="account-item">
        <h4>👤 Beneficiary ${index + 1}</h4>
        <div class="account-detail">
          <span class="detail-label">Beneficiary ID</span>
          <span class="detail-value">${beneficiary.BeneficiaryId || 'N/A'}</span>
        </div>
        <div class="account-detail">
          <span class="detail-label">Type</span>
          <span class="detail-value">${beneficiary.BeneficiaryType || 'N/A'}</span>
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
 * Convert ISO 8601 duration to human-readable format
 * P1D = Daily, P7D = Weekly, P30D = Monthly, P24W = Every 24 weeks
 */
function formatFrequency(duration) {
  if (!duration) return 'N/A';
  
  const regex = /P(\d+)([DWMY])/;
  const match = duration.match(regex);
  
  if (!match) return duration;
  
  const value = match[1];
  const unit = match[2];
  
  const units = {
    'D': value == 1 ? 'Daily' : `Every ${value} days`,
    'W': value == 1 ? 'Weekly' : `Every ${value} weeks`,
    'M': value == 1 ? 'Monthly' : `Every ${value} months`,
    'Y': value == 1 ? 'Yearly' : `Every ${value} years`
  };
  
  return units[unit] || duration;
}

/**
 * Display Products data with detailed charges and deposit rates
 */
function displayProducts(apiData) {
  const container = document.getElementById('productsData');
  if (!container) return;
  
  if (!apiData.success) {
    container.innerHTML = `
      <div class="error-banner">
        <span>❌</span>
        <span>${apiData.error || 'Failed to fetch product information'}</span>
      </div>
    `;
    return;
  }
  
  const productData = apiData.data?.message?.Data?.Product || null;
  
  if (!productData || (Array.isArray(productData) && productData.length === 0)) {
    container.innerHTML = '<p style="color: #64748b;">No product information available.</p>';
    return;
  }
  
  // Handle both single product object and array of products
  const products = Array.isArray(productData) ? productData : [productData];
  
  let html = '';
  
  products.forEach((product, index) => {
    // Main product card with gradient background
    html += `
      <div class="account-item" style="background: linear-gradient(135deg, #7B2687 0%, #B83280 100%); color: white; border: none; margin-bottom: 1.5rem;">
        <h4 style="color: white; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
          🏦 ${product.ProductName || 'Product ' + (index + 1)}
          ${product.IsIslamic ? '<span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; margin-left: 0.5rem;">☪️ Islamic</span>' : ''}
        </h4>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          ${product.ProductType ? `
            <div>
              <div style="font-size: 0.875rem; opacity: 0.9;">Product Type</div>
              <div style="font-weight: 600; font-size: 1.125rem;">${product.ProductType}</div>
            </div>
          ` : ''}
          
          ${product.ProductId ? `
            <div>
              <div style="font-size: 0.875rem; opacity: 0.9;">Product ID</div>
              <div style="font-weight: 600; font-size: 1.125rem;">${product.ProductId}</div>
            </div>
          ` : ''}
          
          ${product.AccountId ? `
            <div>
              <div style="font-size: 0.875rem; opacity: 0.9;">Account ID</div>
              <div style="font-weight: 600; font-size: 1.125rem;">${product.AccountId}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Charges Section (Fees)
    const charges = product.Charges || [];
    if (charges.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h5 style="color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            💳 Fees & Charges
            <span style="background: #fee2e2; color: #dc2626; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${charges.length} Fee(s)</span>
          </h5>
      `;
      
      charges.forEach((charge, chargeIndex) => {
        const amount = charge.Amount || {};
        html += `
          <div style="background: #fff3f3; border-left: 4px solid #ef4444; padding: 1rem; margin-bottom: 0.75rem; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div>
                <strong style="color: #1e293b; font-size: 1rem;">${charge.Name || 'Charge ' + (chargeIndex + 1)}</strong>
                ${charge.ChargeType ? `<span style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">${charge.ChargeType}</span>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: bold; color: #ef4444;">
                  ${amount.Currency || ''} ${amount.Amount ? parseFloat(amount.Amount).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
            ${charge.Frequency ? `
              <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">
                <strong>Frequency:</strong> ${formatFrequency(charge.Frequency)}
              </div>
            ` : ''}
          </div>
        `;
      });
      
      html += `</div>`;
    }
    
    // Deposit Rates Section (Interest Rates)
    const depositRates = product.DepositRates || [];
    if (depositRates.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h5 style="color: #1e293b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            📊 Interest Rates
            <span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${depositRates.length} Rate(s)</span>
          </h5>
      `;
      
      depositRates.forEach((rate, rateIndex) => {
        html += `
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 0.75rem; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div>
                <strong style="color: #1e293b; font-size: 1rem;">${rate.DepositRateType || 'Rate ' + (rateIndex + 1)}</strong>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">
                  ${rate.Rate ? parseFloat(rate.Rate).toFixed(2) : 'N/A'}%
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
              ${rate.CalculationFrequency ? `
                <div style="font-size: 0.875rem; color: #64748b;">
                  <strong>Calculation:</strong> ${formatFrequency(rate.CalculationFrequency)}
                </div>
              ` : ''}
              
              ${rate.ApplicationFrequency ? `
                <div style="font-size: 0.875rem; color: #64748b;">
                  <strong>Applied:</strong> ${formatFrequency(rate.ApplicationFrequency)}
                </div>
              ` : ''}
            </div>
            
            ${rate.Notes ? `
              <div style="font-size: 0.875rem; color: #64748b; font-style: italic; margin-top: 0.75rem; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 4px;">
                📝 ${rate.Notes}
              </div>
            ` : ''}
          </div>
        `;
      });
      
      html += `</div>`;
    }
    
    // Display other product details if available
    if (product.MarketingStateId || product.SecondaryProductId || product.OtherProductDetails) {
      html += `
        <div class="account-item" style="margin-bottom: 1.5rem;">
          <h5 style="color: #7B2687; margin-bottom: 0.75rem;">Additional Information</h5>
      `;
      
      if (product.MarketingStateId) {
        html += `
          <div class="account-detail">
            <span class="detail-label">Marketing State</span>
            <span class="detail-value">${product.MarketingStateId}</span>
          </div>
        `;
      }
      
      if (product.SecondaryProductId) {
        html += `
          <div class="account-detail">
            <span class="detail-label">Secondary Product ID</span>
            <span class="detail-value">${product.SecondaryProductId}</span>
          </div>
        `;
      }
      
      if (product.OtherProductDetails) {
        html += `
          <div class="account-detail">
            <span class="detail-label">Other Details</span>
            <span class="detail-value">${product.OtherProductDetails}</span>
          </div>
        `;
      }
      
      html += `</div>`;
    }
    
    // Display PCA (Personal Current Account) features if available
    if (product.PCA) {
      html += `
        <div class="account-item" style="margin-bottom: 1.5rem;">
          <h5 style="color: #7B2687; margin-bottom: 0.75rem;">Account Features</h5>
      `;
      
      if (product.PCA.Overdraft) {
        const overdraft = product.PCA.Overdraft;
        html += `
          <div class="account-detail">
            <span class="detail-label">Overdraft Available</span>
            <span class="detail-value">${overdraft.OverdraftEnabled ? 'Yes' : 'No'}</span>
          </div>
        `;
        
        if (overdraft.OverdraftLimit) {
          html += `
            <div class="account-detail">
              <span class="detail-label">Overdraft Limit</span>
              <span class="detail-value">${overdraft.OverdraftLimit}</span>
            </div>
          `;
        }
      }
      
      html += `</div>`;
    }
    
    // Display Credit Interest if available
    if (product.CreditInterest && product.CreditInterest.TierBandSet) {
      html += `
        <div class="account-item" style="margin-bottom: 1.5rem;">
          <h5 style="color: #7B2687; margin-bottom: 0.75rem;">Credit Interest Information</h5>
          <p style="font-size: 0.875rem; color: #64748b;">Credit interest details available</p>
        </div>
      `;
    }
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
      
      // Auto-trigger analysis when Analysis tab is clicked
      if (targetTab === 'analysis') {
        const analysisResults = document.getElementById('analysisResults');
        // Only run analysis if results haven't been generated yet
        if (analysisResults && analysisResults.style.display === 'none') {
          runAccountAnalysis();
        }
      }
    });
  });
}

/**
 * Setup statement generation
 */
function setupStatementGeneration() {
  const periodSelect = document.getElementById('statementPeriod');
  const formatSelect = document.getElementById('statementFormat');
  const generateBtn = document.getElementById('generateStatementBtn');
  const customDateRange = document.getElementById('customDateRange');
  
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom' && customDateRange) {
        customDateRange.style.display = 'block';
      } else if (customDateRange) {
        customDateRange.style.display = 'none';
      }
    });
  }
  
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const period = periodSelect?.value || '30';
      const format = formatSelect?.value || 'html';
      const startDate = document.getElementById('startDate')?.value;
      const endDate = document.getElementById('endDate')?.value;
      
      console.log('Generating statement:', { period, format, startDate, endDate });
      
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
      
      const preview = document.getElementById('statementPreview');
      const actionsDiv = document.getElementById('statementActions');
      
      try {
        let url = `api/generate_account_statement.php?range=${period}`;
        if (period === 'custom' && startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        // For PDF and CSV, trigger direct download
        if (format === 'pdf' || format === 'csv') {
          window.location.href = url + `&format=${format}`;
          
          if (preview) {
            preview.innerHTML = `
              <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 2rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📥</div>
                <h4 style="color: #1e40af; margin: 0 0 0.5rem 0;">Download Started</h4>
                <p style="color: #1e3a8a; margin: 0;">Your ${format.toUpperCase()} file should download shortly.</p>
              </div>
            `;
          }
        } else {
          // For HTML, fetch and display inline
          if (preview) {
            preview.innerHTML = `
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #0369a1; margin: 0;">Generating your statement...</p>
              </div>
            `;
          }
          
          const response = await fetch(url + '&format=inline');
          const html = await response.text();
          
          if (preview) {
            preview.innerHTML = html;
            
            // Show action buttons
            if (actionsDiv) {
              actionsDiv.style.display = 'flex';
            }
            
            // Scroll to preview
            preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        
      } catch (error) {
        console.error('Error generating statement:', error);
        if (preview) {
          preview.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 2rem; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
              <h4 style="color: #dc2626; margin: 0 0 0.5rem 0;">Failed to Generate Statement</h4>
              <p style="color: #991b1b; margin: 0;">${error.message || 'Please try again.'}</p>
            </div>
          `;
        }
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Statement';
      }
    });
  }
}

/**
 * Print statement
 */
function printStatement() {
  const statementContent = document.getElementById('statementPreview');
  if (!statementContent || !statementContent.innerHTML.trim()) {
    alert('Please generate a statement first');
    return;
  }
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  const printStyles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .statement-preview-container { max-width: 100%; }
      .summary-cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0; }
      .summary-card { padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
      .summary-label { font-size: 0.875rem; color: #666; }
      .summary-amount { font-size: 1.25rem; font-weight: bold; margin-top: 0.5rem; }
      .transactions-table { width: 100%; border-collapse: collapse; }
      .transactions-table th, .transactions-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
      .transactions-table th { background: #7B2687; color: white; }
      .credit { color: #059669; }
      .debit { color: #dc2626; }
      .statement-mobile { display: none; }
      .statement-table { display: table; }
      #statementActions, .btn-action, button { display: none !important; }
      @media print {
        body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  `;
  
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Account Statement</title>
      ${printStyles}
    </head>
    <body>
      ${statementContent.innerHTML}
    </body>
    </html>
  `);
  iframeDoc.close();
  
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    } catch (error) {
      console.error('Print failed:', error);
      document.body.removeChild(iframe);
      alert('Failed to open print dialog. Please try again.');
    }
  }, 250);
}

/**
 * Download statement as PDF (using print dialog in hidden iframe)
 */
function downloadStatementPDF() {
  const statementPreview = document.getElementById('statementPreview');
  
  if (!statementPreview || !statementPreview.innerHTML.trim()) {
    alert('Please generate a statement first');
    return;
  }
  
  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  // Get the statement HTML
  const statementHTML = statementPreview.innerHTML;
  
  // Get print-optimized styles
  const printStyles = `
    <style>
      @page {
        size: A4;
        margin: 15mm;
      }
      
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      
      .statement-header {
        border-bottom: 3px solid #7B2687;
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      
      .statement-header h1 {
        color: #7B2687;
        margin: 0 0 8px 0;
        font-size: 24px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 15px 0;
      }
      
      .info-block {
        padding: 12px;
        background: #f8f9fa;
        border-left: 4px solid #7B2687;
      }
      
      .info-block label {
        font-weight: bold;
        color: #666;
        font-size: 11px;
        display: block;
        margin-bottom: 4px;
      }
      
      .info-block .value {
        font-size: 13px;
      }
      
      .summary-section {
        background: linear-gradient(135deg, #7B2687 0%, #B83280 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        text-align: center;
      }
      
      .summary-item h3 {
        margin: 0 0 4px 0;
        font-size: 11px;
        opacity: 0.9;
      }
      
      .summary-item .amount {
        font-size: 18px;
        font-weight: bold;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 11px;
      }
      
      th {
        background: #7B2687;
        color: white;
        padding: 10px 8px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
      }
      
      td {
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .credit {
        color: #059669;
        font-weight: 600;
      }
      
      .debit {
        color: #dc2626;
        font-weight: 600;
      }
      
      .text-right {
        text-align: right;
      }
      
      .section-title {
        color: #7B2687;
        border-bottom: 2px solid #7B2687;
        padding-bottom: 8px;
        margin: 20px 0 15px 0;
        font-size: 16px;
      }
      
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 2px solid #e0e0e0;
        text-align: center;
        color: #666;
        font-size: 10px;
      }
      
      /* Hide mobile-only elements */
      .statement-mobile {
        display: none;
      }
      
      /* Show desktop table */
      .statement-table {
        display: table;
      }
      
      /* Hide action buttons */
      #statementActions,
      .btn-action,
      button {
        display: none !important;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    </style>
  `;
  
  // Write content to iframe
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Account Statement - ${new Date().toISOString().split('T')[0]}</title>
      ${printStyles}
    </head>
    <body>
      ${statementHTML}
    </body>
    </html>
  `);
  iframeDoc.close();
  
  // Wait for content to load, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      console.error('Print failed:', error);
      document.body.removeChild(iframe);
      alert('Failed to open print dialog. Please try again.');
    }
  }, 250);
}

/**
 * Download statement as CSV
 */
function downloadStatementCSV() {
  const period = document.getElementById('statementPeriod')?.value || '30';
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  let url = `api/generate_account_statement.php?format=csv&range=${period}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  
  window.location.href = url;
}

/**
 * Clear statement preview
 */
function clearStatement() {
  const preview = document.getElementById('statementPreview');
  const actionsDiv = document.getElementById('statementActions');
  
  if (preview) {
    preview.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #94a3b8;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <p>Select period and format, then click "Generate Statement" to view or download your account statement</p>
      </div>
    `;
  }
  
  if (actionsDiv) {
    actionsDiv.style.display = 'none';
  }
}

/**
 * Setup account analysis
 */
function setupAccountAnalysis() {
  // Analysis is now auto-triggered when tab is clicked
  // Check if we should run it on page load (if Analysis tab is active by default)
  const analysisTab = document.querySelector('.tab[data-tab="analysis"]');
  const analysisResults = document.getElementById('analysisResults');
  
  if (analysisTab && analysisTab.classList.contains('active')) {
    // Run analysis on page load if Analysis is the default active tab
    if (analysisResults && analysisResults.style.display === 'none') {
      setTimeout(() => runAccountAnalysis(), 500);
    }
  }
}

/**
 * Run account analysis
 */
async function runAccountAnalysis() {
  const loadingDiv = document.getElementById('analysisLoading');
  const resultsDiv = document.getElementById('analysisResults');
  
  if (loadingDiv) loadingDiv.style.display = 'block';
  if (resultsDiv) resultsDiv.style.display = 'none';
  
  try {
    const response = await fetch('api/analyze_account.php');
    const data = await response.json();
    
    console.log('Analysis response:', data);
    
    if (data.success) {
      displayAnalysisResults(data.analysis);
      if (loadingDiv) loadingDiv.style.display = 'none';
      if (resultsDiv) resultsDiv.style.display = 'block';
    } else {
      throw new Error(data.error || 'Analysis failed');
    }
    
  } catch (error) {
    console.error('Error running analysis:', error);
    if (loadingDiv) loadingDiv.style.display = 'none';
    alert('Failed to run analysis: ' + error.message);
  }
}

/**
 * Display analysis results
 */
function displayAnalysisResults(analysis) {
  // Financial Health Score
  const healthScore = document.getElementById('healthScore');
  const healthRating = document.getElementById('healthRating');
  const balanceScoreValue = document.getElementById('balanceScoreValue');
  const cashFlowScoreValue = document.getElementById('cashFlowScoreValue');
  const incomeStabilityValue = document.getElementById('incomeStabilityValue');
  const spendingDisciplineValue = document.getElementById('spendingDisciplineValue');
  
  if (healthScore) healthScore.textContent = analysis.financial_health.score;
  if (healthRating) healthRating.textContent = analysis.financial_health.rating;
  if (balanceScoreValue) balanceScoreValue.textContent = analysis.financial_health.breakdown.balance;
  if (cashFlowScoreValue) cashFlowScoreValue.textContent = analysis.financial_health.breakdown.cash_flow;
  if (incomeStabilityValue) incomeStabilityValue.textContent = analysis.financial_health.breakdown.income_stability;
  if (spendingDisciplineValue) spendingDisciplineValue.textContent = analysis.financial_health.breakdown.spending_discipline;
  
  // Spending Chart (Pie)
  createSpendingChart(analysis.spending_analysis);
  
  // Cash Flow Chart (Bar)
  createCashFlowChart(analysis.cash_flow_analysis);
  
  // Insights
  displayInsights(analysis.insights);
  
  // Recommendations
  displayRecommendations(analysis.recommendations);
}

/**
 * Create spending pie chart
 */
function createSpendingChart(spendingData) {
  const canvas = document.getElementById('spendingChart');
  if (!canvas) return;
  
  // Destroy existing chart if it exists
  if (window.spendingChartInstance) {
    window.spendingChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  const categories = Object.keys(spendingData.spending_by_category);
  const amounts = Object.values(spendingData.spending_by_category);
  
  const colors = [
    '#7B2687', '#B83280', '#059669', '#0891b2', '#f59e0b',
    '#dc2626', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'
  ];
  
  window.spendingChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
      datasets: [{
        data: amounts,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: AED ${value.toFixed(0)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Create cash flow bar chart
 */
function createCashFlowChart(cashFlowData) {
  const canvas = document.getElementById('cashFlowChart');
  if (!canvas) return;
  
  // Destroy existing chart if it exists
  if (window.cashFlowChartInstance) {
    window.cashFlowChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  const months = Object.keys(cashFlowData.monthly_cash_flow);
  const credits = months.map(m => cashFlowData.monthly_cash_flow[m].credits);
  const debits = months.map(m => cashFlowData.monthly_cash_flow[m].debits);
  
  window.cashFlowChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => {
        const date = new Date(m + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [
        {
          label: 'Income',
          data: credits,
          backgroundColor: '#059669',
          borderRadius: 4
        },
        {
          label: 'Expenses',
          data: debits,
          backgroundColor: '#dc2626',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'AED ' + value.toLocaleString();
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': AED ' + context.parsed.y.toFixed(0);
            }
          }
        }
      }
    }
  });
}

/**
 * Display insights
 */
function displayInsights(insights) {
  const container = document.getElementById('insightsList');
  if (!container) return;
  
  if (!insights || insights.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8;">No insights available at this time.</p>';
    return;
  }
  
  const html = insights.map(insight => {
    const bgColor = insight.type === 'success' ? '#f0fdf4' :
                    insight.type === 'warning' ? '#fef3c7' : '#eff6ff';
    const borderColor = insight.type === 'success' ? '#86efac' :
                        insight.type === 'warning' ? '#fcd34d' : '#93c5fd';
    
    return `
      <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 1rem; border-radius: 4px; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.25rem;">${insight.icon}</span>
        <span style="color: #1e293b;">${insight.message}</span>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

/**
 * Display recommendations
 */
function displayRecommendations(recommendations) {
  const container = document.getElementById('recommendationsList');
  if (!container) return;
  
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8;">No recommendations available at this time.</p>';
    return;
  }
  
  const html = recommendations.map(rec => `
    <div style="background: #f8f9fa; padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #7B2687;">
      <h5 style="margin: 0 0 0.5rem 0; color: #1e293b;">${rec.title}</h5>
      <p style="margin: 0; color: #475569; font-size: 0.875rem;">${rec.description}</p>
      ${rec.data ? `<div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 4px; font-size: 0.875rem;">
        ${JSON.stringify(rec.data, null, 2).replace(/[{}"]/g, '').split('\n').filter(l => l.trim()).join('<br>')}
      </div>` : ''}
    </div>
  `).join('');
  
  container.innerHTML = html;
}

// Initialize statement and analysis features when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupStatementGeneration();
    setupAccountAnalysis();
  });
} else {
  setupStatementGeneration();
  setupAccountAnalysis();
}

