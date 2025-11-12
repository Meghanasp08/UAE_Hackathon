<?php
session_start();

// Handle OAuth return from index.php
$oauthSuccess = false;
$oauthError = false;
$bankConnected = false;

// Check for OAuth return parameters
if (isset($_GET['oauth_success']) && $_GET['oauth_success'] === '1') {
  $oauthSuccess = true;
}

if (isset($_GET['oauth_error'])) {
  $oauthError = $_GET['oauth_error'];
}

// Check if bank is already connected via session
if (isset($_SESSION['access_token']) && 
    isset($_SESSION['access_token_expiry']) && 
    $_SESSION['access_token_expiry'] > time()) {
  $bankConnected = true;
}

// Set redirect URL for after OAuth completion
if (!$bankConnected && !$oauthSuccess) {
  $_SESSION['redirect_after_oauth'] = 'https://mercurypay.ariticapp.com/mercurypay/v1/accounts.php';
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Account Information - Smart Credit</title>
  <link rel="stylesheet" href="css/style.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    .accounts-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .connection-banner {
      background: linear-gradient(135deg, #7B2687 0%, #B83280 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .connection-banner h3 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    
    .connection-banner p {
      margin: 0 0 1.5rem 0;
      opacity: 0.95;
    }
    
    .btn-connect {
      background: white;
      color: #7B2687;
      padding: 0.875rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-connect:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .data-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    
    .data-section h3 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .data-section.collapsed .data-content {
      display: none;
    }
    
    .data-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    
    .toggle-icon {
      transition: transform 0.3s;
      font-size: 1.2rem;
    }
    
    .data-section.collapsed .toggle-icon {
      transform: rotate(-90deg);
    }
    
    .data-content {
      margin-top: 1rem;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .summary-card {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .summary-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    
    .summary-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #7B2687;
    }
    
    .json-viewer {
      background: #1e293b;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .loading-skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 8px;
      height: 100px;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .success-banner {
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #15803d;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .refresh-btn {
      background: #7B2687;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .refresh-btn:hover {
      background: #B83280;
      transform: translateY(-1px);
    }
    
    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
    }
    
    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: #64748b;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: -2px;
    }
    
    .tab:hover {
      color: #7B2687;
    }
    
    .tab.active {
      color: #7B2687;
      border-bottom-color: #7B2687;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .account-item {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }
    
    .account-item h4 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
    }
    
    .account-detail {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .account-detail:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      color: #64748b;
      font-size: 0.875rem;
    }
    
    .detail-value {
      color: #1e293b;
      font-weight: 500;
    }
  </style>
  <script>
    // Pass PHP variables to JavaScript
    window.phpData = {
      oauthSuccess: <?php echo json_encode($oauthSuccess); ?>,
      oauthError: <?php echo json_encode($oauthError); ?>,
      bankConnected: <?php echo json_encode($bankConnected); ?>
    };

    // Redirect to login if not authenticated
    (function() {
      const token = localStorage.getItem('authToken');
      const loginTime = localStorage.getItem('loginTime');
      
      if (!token || !loginTime) {
        window.location.href = 'login.html';
        return;
      }
      
      // Check session expiry (24 hours)
      const sessionDuration = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - parseInt(loginTime);
      
      if (elapsed > sessionDuration) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('loginTime');
        window.location.href = 'login.html';
      }
    })();
  </script>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <img src="assets/shukria-logo.png" alt="Shukria Logo" class="logo" onerror="this.style.display='none'"/>
    </div>
    <nav class="nav-links">
      <a href="index.html" class="nav-link" title="Dashboard" aria-label="Dashboard">
        <div class="nav-item">
          <img src="assets/nav-dashboard.svg" alt="Dashboard" style="height:28px;width:28px;"/>
          <span class="nav-label">Dashboard</span>
        </div>
      </a>
      <a href="credit-line.html" class="nav-link" title="Credit Line" aria-label="Credit Line">
        <div class="nav-item">
          <img src="assets/nav-credit-line.svg" alt="Credit Line" style="height:28px;width:28px;"/>
          <span class="nav-label">Credit Line</span>
        </div>
      </a>
      <a href="apply.php" class="nav-link" title="Apply" aria-label="Apply">
        <div class="nav-item">
          <img src="assets/nav-apply.svg" alt="Apply" style="height:28px;width:28px;"/>
          <span class="nav-label">Apply</span>
        </div>
      </a>
      <a href="accounts.php" class="nav-link active" title="Accounts" aria-label="Accounts">
        <div class="nav-item">
          <img src="assets/nav-transactions.svg" alt="Accounts" style="height:28px;width:28px;"/>
          <span class="nav-label">Accounts</span>
        </div>
      </a>
      <a href="transactions.html" class="nav-link" title="Transactions" aria-label="Transactions">
        <div class="nav-item">
          <img src="assets/nav-transactions.svg" alt="Transactions" style="height:28px;width:28px;"/>
          <span class="nav-label">Transactions</span>
        </div>
      </a>
    </nav>
    <div class="user-section">
      <div class="user">Hello, Priya Sharma</div>
      <button class="logout-btn" id="logoutBtn" onclick="if(typeof logout === 'function') logout();" title="Logout">➜]</button>
    </div>
  </header>

  <main class="container accounts-container">
    <section class="apply-header" style="margin-bottom: 2rem;">
      <h2>Account Information</h2>
      <p style="color: #64748b; margin-top: 0.5rem;">View comprehensive details about your connected bank accounts via Nebras Open Banking</p>
    </section>

    <?php if ($oauthSuccess): ?>
    <div class="success-banner">
      <span style="font-size: 1.2rem;">✅</span>
      <span>Bank connection successful! Loading your account data...</span>
    </div>
    <?php endif; ?>

    <?php if ($oauthError): ?>
    <div class="error-banner">
      <span style="font-size: 1.2rem;">❌</span>
      <span>Bank connection failed: <?php echo htmlspecialchars($oauthError); ?>. Please try again.</span>
    </div>
    <?php endif; ?>

    <?php if (!$bankConnected): ?>
    <!-- Connection Banner -->
    <div class="connection-banner">
      <h3>🏦 Connect Your Bank Account</h3>
      <p>Connect your account securely through Nebras (UAE's Open Banking platform) to view your account information.</p>
      <button class="btn-connect" onclick="window.location.href='https://mercurypay.ariticapp.com/mercurypay/callOpenFinanceClient.php'">
        🔐 Connect Bank Account
      </button>
    </div>
    <?php else: ?>
    
    <!-- Action Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div>
        <p style="margin: 0; color: #64748b;">
          <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
            Connected to Nebras Open Banking
          </span>
        </p>
      </div>
      <button class="refresh-btn" id="refreshBtn">
        <span>🔄</span>
        <span>Refresh Data</span>
      </button>
    </div>

    <!-- Loading Indicator -->
    <div id="loadingIndicator" style="display: none;">
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="spinner"></div>
          <div>
            <h4 style="margin: 0 0 0.5rem 0; color: #0369a1;">📊 Fetching Account Data...</h4>
            <p style="margin: 0; color: #0c4a6e; font-size: 0.875rem;" id="loadingStatus">Initializing...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Summary -->
    <div id="quickSummary" style="display: none;">
      <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Quick Overview</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">📂 Total Accounts</div>
          <div class="summary-value" id="totalAccounts">-</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">💰 Total Balance</div>
          <div class="summary-value" id="totalBalance">-</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">📊 Transactions</div>
          <div class="summary-value" id="totalTransactions">-</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">👥 Beneficiaries</div>
          <div class="summary-value" id="totalBeneficiaries">-</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div id="dataTabs" style="display: none;">
      <div class="tabs">
        <button class="tab active" data-tab="all-accounts">📂 All Accounts</button>
        <button class="tab" data-tab="account-details">📄 Account Details</button>
        <button class="tab" data-tab="balance">💰 Balance</button>
        <button class="tab" data-tab="transactions">📊 Transactions</button>
        <button class="tab" data-tab="beneficiaries">👥 Beneficiaries</button>
        <button class="tab" data-tab="statement">📄 Statement</button>
        <button class="tab" data-tab="analysis">📈 Analysis</button>
      </div>

      <!-- Tab: All Accounts -->
      <div class="tab-content active" id="tab-all-accounts">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>📂 All Accounts</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div id="multiaccountsData">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Account Details -->
      <div class="tab-content" id="tab-account-details">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>📄 Account Details</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div id="accountinfoData">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Balance -->
      <div class="tab-content" id="tab-balance">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>💰 Balance Information</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div id="balanceData">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Transactions -->
      <div class="tab-content" id="tab-transactions">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>📊 Transaction History</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div id="transactionsData">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Beneficiaries -->
      <div class="tab-content" id="tab-beneficiaries">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>👥 Beneficiaries</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div id="beneficiariesData">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Statement -->
      <div class="tab-content" id="tab-statement">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>📄 Account Statement</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div class="statement-controls" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Generate Statement</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: end;">
                <div>
                  <label for="statementPeriod" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569;">Period</label>
                  <select id="statementPeriod" style="width: 100%; padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label for="statementFormat" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569;">Format</label>
                  <select id="statementFormat" style="width: 100%; padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <option value="html">View Online</option>
                    <option value="pdf">Download PDF</option>
                    <option value="csv">Export CSV</option>
                  </select>
                </div>
                <div id="customDateRange" style="display: none;">
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569;">Date Range</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <input type="date" id="startDate" style="padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <input type="date" id="endDate" style="padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                  </div>
                </div>
                <div>
                  <button id="generateStatementBtn" class="btn-primary" style="padding: 0.625rem 1.5rem; background: #7B2687; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Generate Statement
                  </button>
                </div>
              </div>
            </div>
            
            <div id="statementPreview" style="min-height: 200px;">
              <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <p>Select period and format, then click "Generate Statement" to view or download your account statement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Analysis -->
      <div class="tab-content" id="tab-analysis">
        <div class="data-section">
          <div class="data-header" onclick="toggleSection(this)">
            <h3>📈 Account Analysis</h3>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="data-content">
            <div style="text-align: center; padding: 2rem;">
              <button id="runAnalysisBtn" class="btn-primary" style="padding: 0.875rem 2rem; background: #7B2687; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                🔍 Run Financial Analysis
              </button>
            </div>
            
            <div id="analysisLoading" style="display: none;">
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div class="spinner"></div>
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #0369a1;">Analyzing Your Account...</h4>
                    <p style="margin: 0; color: #0c4a6e; font-size: 0.875rem;">Processing transactions and generating insights</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="analysisResults" style="display: none;">
              <!-- Financial Health Score -->
              <div class="health-score-card" style="background: linear-gradient(135deg, #7B2687 0%, #B83280 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Financial Health Score</div>
                <div style="font-size: 4rem; font-weight: bold; margin: 1rem 0;" id="healthScore">--</div>
                <div style="font-size: 1.25rem; opacity: 0.95;" id="healthRating">Calculating...</div>
                
                <div id="scoreBreakdown" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem; text-align: center;">
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;">Balance</div>
                    <div style="font-size: 1.5rem; font-weight: bold;" id="balanceScoreValue">--</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;">Cash Flow</div>
                    <div style="font-size: 1.5rem; font-weight: bold;" id="cashFlowScoreValue">--</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;">Income Stability</div>
                    <div style="font-size: 1.5rem; font-weight: bold;" id="incomeStabilityValue">--</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;">Spending Discipline</div>
                    <div style="font-size: 1.5rem; font-weight: bold;" id="spendingDisciplineValue">--</div>
                  </div>
                </div>
              </div>
              
              <!-- Charts Section -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div class="chart-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h4 style="margin: 0 0 1rem 0; color: #1e293b;">💸 Spending by Category</h4>
                  <canvas id="spendingChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h4 style="margin: 0 0 1rem 0; color: #1e293b;">📈 Income vs Expenses</h4>
                  <canvas id="cashFlowChart" style="max-height: 300px;"></canvas>
                </div>
              </div>
              
              <!-- Insights -->
              <div class="insights-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">💡 Smart Insights</h4>
                <div id="insightsList"></div>
              </div>
              
              <!-- Recommendations -->
              <div class="recommendations-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">🎯 Personalized Recommendations</h4>
                <div id="recommendationsList"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div id="errorDisplay" style="display: none;">
      <div class="error-banner">
        <span style="font-size: 1.2rem;">❌</span>
        <span id="errorMessage">Failed to fetch account data. Please try again.</span>
      </div>
    </div>

    <?php endif; ?>
  </main>

  <script>
    function toggleSection(header) {
      const section = header.closest('.data-section');
      section.classList.toggle('collapsed');
    }
  </script>

  <script src="js/main.js?v=<?php echo time(); ?>"></script>
  <script src="js/accounts.js?v=<?php echo time(); ?>"></script>
</body>
</html>
