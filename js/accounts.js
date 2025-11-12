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
      
      try {
        let url = `api/generate_account_statement.php?format=${format}&range=${period}`;
        if (period === 'custom' && startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        if (format === 'html') {
          // Open in new window for HTML preview
          window.open(url, '_blank', 'width=900,height=700');
        } else if (format === 'csv') {
          // Trigger download for CSV
          window.location.href = url;
        } else if (format === 'pdf') {
          // Open PDF in new window (will trigger print dialog)
          window.open(url, '_blank');
        }
        
        // Show success message
        const preview = document.getElementById('statementPreview');
        if (preview && format === 'html') {
          preview.innerHTML = `
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 2rem; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
              <h4 style="color: #15803d; margin: 0 0 0.5rem 0;">Statement Generated Successfully!</h4>
              <p style="color: #166534; margin: 0;">Your statement has been opened in a new window.</p>
            </div>
          `;
        }
        
      } catch (error) {
        console.error('Error generating statement:', error);
        alert('Failed to generate statement. Please try again.');
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Statement';
      }
    });
  }
}

/**
 * Setup account analysis
 */
function setupAccountAnalysis() {
  const runAnalysisBtn = document.getElementById('runAnalysisBtn');
  
  if (runAnalysisBtn) {
    runAnalysisBtn.addEventListener('click', async () => {
      console.log('Running account analysis...');
      await runAccountAnalysis();
    });
  }
}

/**
 * Run account analysis
 */
async function runAccountAnalysis() {
  const loadingDiv = document.getElementById('analysisLoading');
  const resultsDiv = document.getElementById('analysisResults');
  const runBtn = document.getElementById('runAnalysisBtn');
  
  if (loadingDiv) loadingDiv.style.display = 'block';
  if (resultsDiv) resultsDiv.style.display = 'none';
  if (runBtn) runBtn.disabled = true;
  
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
  } finally {
    if (runBtn) runBtn.disabled = false;
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

