<?php
session_start();

// Check for OAuth success callback
$oauthSuccess = isset($_GET['oauth_success']) && $_GET['oauth_success'] == '1';
$consentType = $_GET['consent_type'] ?? '';
$paymentConsentSuccess = $oauthSuccess && $consentType === 'payment';

// Function to recalculate credit score from current banking data
function recalculateCreditScore() {
    // Check if we have banking data and application data in session
    if (!isset($_SESSION['open_banking_data']) || !isset($_SESSION['application_data'])) {
        return null;
    }
    
    // Simulate API call to calculate_credit_score.php logic
    // In production, you could include the calculation file or make an internal API call
    $apiUrl = 'api/calculate_credit_score.php';
    
    // Use cURL for internal API call
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id()); // Pass session
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $result = json_decode($response, true);
        if ($result && isset($result['success']) && $result['success']) {
            return $result;
        }
    }
    
    return null;
}

// Auto-recalculate credit score if banking data exists and assessment is older than 5 minutes
$shouldRecalculate = false;
if (isset($_SESSION['open_banking_data']) && isset($_SESSION['application_data'])) {
    $lastCalculation = $_SESSION['credit_assessment']['timestamp'] ?? 0;
    $recalculateInterval = 300; // 5 minutes
    
    if (time() - $lastCalculation > $recalculateInterval) {
        $shouldRecalculate = true;
    }
}

// Recalculate if needed
if ($shouldRecalculate) {
    $recalculatedData = recalculateCreditScore();
    if ($recalculatedData) {
        // Update session with fresh calculation
        $_SESSION['credit_assessment'] = [
            'approved' => $recalculatedData['approved'],
            'creditLimit' => $recalculatedData['creditLimit'],
            'apr' => $recalculatedData['apr'],
            'setupFee' => $recalculatedData['setupFee'],
            'score' => $recalculatedData['score'],
            'balanceScore' => $recalculatedData['details']['balanceScore'] ?? 0,
            'transactionScore' => $recalculatedData['details']['transactionScore'] ?? 0,
            'cashFlowScore' => $recalculatedData['details']['cashFlowScore'] ?? 0,
            'incomeMultiplier' => $recalculatedData['details']['incomeMultiplier'] ?? 1.0,
            'reason' => $recalculatedData['reason'],
            'timestamp' => time()
        ];
    }
}

// Get credit assessment from session (set in apply.php after credit calculation)
$creditData = $_SESSION['credit_assessment'] ?? null;

// Default values if no assessment done yet
$creditLimit = 15250;
$availableCredit = 12500;
$usedCredit = 2750;
$apr = 8.9;
$creditScore = 88;
$utilizationPercent = 18;

// Override with calculated values if available (using correct camelCase keys from calculate_credit_score.php)
if ($creditData && isset($creditData['creditLimit'])) {
    $creditLimit = $creditData['creditLimit'];
    $apr = $creditData['apr'];
    $creditScore = $creditData['score'] ?? 88;
    
    // Calculate used/available (can be from session or default 18% usage)
    $usedCredit = $_SESSION['credit_usage'] ?? ($creditLimit * 0.18);
    $availableCredit = $creditLimit - $usedCredit;
    $utilizationPercent = ($creditLimit > 0) ? round(($usedCredit / $creditLimit) * 100) : 0;
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Credit Line Controls</title>
  <link rel="stylesheet" href="css/style.css"/>
  <link rel="stylesheet" href="css/auto-sweep-benefits.css"/>
  <link rel="stylesheet" href="css/term-loan.css"/>
  <script>
    // Pass PHP credit data to JavaScript
    window.creditData = {
      creditLimit: <?php echo $creditLimit; ?>,
      availableCredit: <?php echo $availableCredit; ?>,
      usedCredit: <?php echo $usedCredit; ?>,
      apr: <?php echo $apr; ?>,
      utilizationPercent: <?php echo $utilizationPercent; ?>
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
      <a href="credit-line.php" class="nav-link active" title="Credit Line" aria-label="Credit Line">
        <div class="nav-item">
          <img src="assets/nav-credit-line.svg" alt="Credit Line" style="height:28px;width:28px;"/>
          <span class="nav-label">Credit Line</span>
        </div>
      </a>
      <a href="apply.html" class="nav-link" title="Apply" aria-label="Apply">
        <div class="nav-item">
          <img src="assets/nav-apply.svg" alt="Apply" style="height:28px;width:28px;"/>
          <span class="nav-label">Apply</span>
        </div>
      </a>
      <a href="accounts.php" class="nav-link" title="Accounts" aria-label="Accounts">
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
  </header>

  <main class="container">
    <?php if ($paymentConsentSuccess): ?>
    <!-- Payment Consent Success Alert -->
    <div class="alert alert-success" id="paymentConsentAlert" style="margin-bottom: 1.5rem; padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
      <strong>✅ Payment Authorization Successful!</strong>
      <p style="margin: 0.5rem 0 0 0;">Auto-sweep payment consent has been granted. You can now configure your auto-sweep settings below.</p>
    </div>
    <script>
      // Auto-enable the toggle after payment consent
      document.addEventListener('DOMContentLoaded', () => {
        const autoSweepToggle = document.getElementById('autoSweepToggle');
        if (autoSweepToggle) {
          autoSweepToggle.checked = true;
          autoSweepToggle.dispatchEvent(new Event('change'));
        }
        
        // Auto-hide alert after 8 seconds
        setTimeout(() => {
          const alert = document.getElementById('paymentConsentAlert');
          if (alert) {
            alert.style.transition = 'opacity 0.5s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
          }
        }, 8000);
      });
    </script>
    <?php endif; ?>
    
    <?php if (isset($_GET['error']) && $_GET['error'] === 'consent_failed'): ?>
    <!-- Payment Consent Error Alert -->
    <div class="alert alert-danger" style="margin-bottom: 1.5rem; padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
      <strong>❌ Payment Authorization Failed</strong>
      <p style="margin: 0.5rem 0 0 0;">
        <?php 
        echo isset($_SESSION['payment_consent_error']) 
          ? htmlspecialchars($_SESSION['payment_consent_error']) 
          : 'Unable to complete payment authorization. Please try again.';
        unset($_SESSION['payment_consent_error']);
        ?>
      </p>
    </div>
    <?php endif; ?>
    
    <section class="credit-header">
      <h2>Your Credit Line</h2>
    </section>

    <!-- Credit Line Summary -->
    <div class="credit-summary-card">
      <div class="credit-visual">
        <svg viewBox="0 0 200 200" class="credit-circle">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" stroke-width="20"/>
          <circle cx="100" cy="100" r="90" fill="none" stroke="#0f6ef3" stroke-width="20" 
                  stroke-dasharray="565.48" stroke-dashoffset="<?php echo 565.48 - (565.48 * $utilizationPercent / 100); ?>" stroke-linecap="round"
                  transform="rotate(-90 100 100)" id="creditUsageCircle"/>
          <text x="100" y="95" text-anchor="middle" font-size="24" font-weight="bold" fill="#111"><?php echo $utilizationPercent; ?>%</text>
          <text x="100" y="115" text-anchor="middle" font-size="12" fill="#6b7280">Used</text>
        </svg>
      </div>
      <div class="credit-details">
        <div class="credit-row">
          <span class="credit-label">Total Credit Limit</span>
          <span class="credit-value">AED <?php echo number_format($creditLimit, 0); ?></span>
        </div>
        <div class="credit-row">
          <span class="credit-label">Available Credit</span>
          <span class="credit-value highlight">AED <?php echo number_format($availableCredit, 0); ?></span>
        </div>
        <div class="credit-row">
          <span class="credit-label">Used</span>
          <span class="credit-value">AED <?php echo number_format($usedCredit, 0); ?></span>
        </div>
        <div class="credit-row">
          <span class="credit-label">Interest Rate (APR)</span>
          <span class="credit-value"><?php echo number_format($apr, 1); ?>%</span>
        </div>
        <div class="credit-row">
          <span class="credit-label">Pay-as-you-go Fee</span>
          <span class="credit-value">0.5% per transaction</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <section class="credit-actions">
      <button class="action-btn primary" id="withdrawBtn">
        <span class="btn-icon">💰</span>
        <span>Withdraw</span>
      </button>
      <button class="action-btn secondary" id="repayBtn">
        <span class="btn-icon">↩️</span>
        <span>Repay</span>
      </button>
      <button class="action-btn secondary" id="transferBtn">
        <span class="btn-icon">🔄</span>
        <span>Transfer to Account</span>
      </button>
      <button class="action-btn tertiary" id="termLoanBtn">
        <span class="btn-icon">📊</span>
        <span>Term Loan</span>
      </button>
    </section>

    <!-- SmartPay Rules -->
    <section class="smartpay-section">
      <div class="section-header">
        <h3>SmartPay Automation Rules</h3>
        <button class="btn-primary small" id="addRuleBtn">+ Add Rule</button>
      </div>

      <div class="auto-sweep-card">
        <div class="sweep-header">
          <div>
            <h4>⚡ Auto-Sweep</h4>
            <p>Automatically repay credit when your account balance exceeds threshold</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="autoSweepToggle"/>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div id="sweepSettings" class="sweep-settings" hidden>
          <div class="setting-row">
            <label>Trigger when balance exceeds</label>
            <input type="number" id="sweepThreshold" value="5000" placeholder="5000"/>
            <span>AED</span>
          </div>
          <div class="setting-row">
            <label>Sweep schedule</label>
            <select id="sweepSchedule">
              <option value="immediate">Immediate</option>
              <option value="daily">Daily at 9 AM</option>
              <option value="weekly">Weekly (Monday)</option>
            </select>
          </div>
          <button class="btn-outline small" id="saveSweepSettings">Save Settings</button>
        </div>
        
        <!-- Auto-sweep Benefits Section -->
        <div class="sweep-benefits" id="sweepBenefits" style="display:none;">
          <h4>💡 Smart Auto-Sweep Benefits</h4>
          <div class="benefits-grid">
            <div class="benefit-card">
              <span class="benefit-icon">💰</span>
              <h5>Interest Saved (Monthly)</h5>
              <p class="benefit-value" id="interestSaved">AED 0</p>
              <span class="benefit-trend positive" id="interestTrend">↗ Projected 12% annual savings</span>
            </div>
            <div class="benefit-card">
              <span class="benefit-icon">⚡</span>
              <h5>Auto-Payments Made</h5>
              <p class="benefit-value" id="autoPayments">0</p>
              <span class="benefit-meta">Last 30 days</span>
            </div>
            <div class="benefit-card">
              <span class="benefit-icon">⏱️</span>
              <h5>Time Saved</h5>
              <p class="benefit-value" id="timeSaved">0 hrs</p>
              <span class="benefit-meta">Manual payment time saved</span>
            </div>
            <div class="benefit-card">
              <span class="benefit-icon">📈</span>
              <h5>Cash Efficiency</h5>
              <p class="benefit-value" id="cashEfficiency">0%</p>
              <span class="benefit-meta">Improved cash utilization</span>
            </div>
          </div>
          <div class="benefits-summary">
            <h5>Smart Management Summary</h5>
            <ul class="benefits-list" id="benefitsList">
              <!-- Dynamically populated -->
            </ul>
          </div>
        </div>
      </div>

      <!-- Rules List -->
      <div id="rulesList" class="rules-list">
        <div class="rule-card">
          <div class="rule-header">
            <div class="rule-info">
              <h4>Monthly Auto-Repay</h4>
              <span class="rule-status active">Active</span>
            </div>
            <div class="rule-actions">
              <button class="btn-icon" aria-label="Edit rule">✏️</button>
              <button class="btn-icon" aria-label="Delete rule">🗑️</button>
            </div>
          </div>
          <div class="rule-body">
            <p><strong>Trigger:</strong> 1st of every month at 10:00 AM</p>
            <p><strong>Action:</strong> Repay 50% of outstanding balance</p>
            <p><strong>Last executed:</strong> Nov 1, 2025</p>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-header">
            <div class="rule-info">
              <h4>High Balance Transfer</h4>
              <span class="rule-status active">Active</span>
            </div>
            <div class="rule-actions">
              <button class="btn-icon" aria-label="Edit rule">✏️</button>
              <button class="btn-icon" aria-label="Delete rule">🗑️</button>
            </div>
          </div>
          <div class="rule-body">
            <p><strong>Trigger:</strong> When checking account balance > AED 10,000</p>
            <p><strong>Action:</strong> Transfer excess to savings (keep AED 8,000 buffer)</p>
            <p><strong>Last executed:</strong> Nov 3, 2025</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Rule Activity -->
    <section class="rule-activity">
      <h3>Recent Rule Executions</h3>
      <div class="activity-list">
        <div class="activity-item">
          <span class="activity-icon success">✓</span>
          <div class="activity-content">
            <p><strong>Monthly Auto-Repay</strong> executed successfully</p>
            <span class="activity-meta">Repaid AED 1,375 · Nov 1, 2025 10:00 AM</span>
          </div>
        </div>
        <div class="activity-item">
          <span class="activity-icon success">✓</span>
          <div class="activity-content">
            <p><strong>High Balance Transfer</strong> executed successfully</p>
            <span class="activity-meta">Transferred AED 2,000 to savings · Nov 3, 2025 3:45 PM</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Floating voice button -->
  <button id="voiceBtn" class="voice-btn" aria-label="Activate voice commands" title="Voice commands">
    🎤
  </button>

  <!-- Voice feedback live region -->
  <div id="voiceFeedback" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

  <!-- Add Rule Modal -->
  <div id="ruleModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="ruleModalTitle" hidden>
    <div class="modal-content large">
      <div class="modal-header">
        <h3 id="ruleModalTitle">Create SmartPay Rule</h3>
        <button class="modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="ruleForm">
          <div class="form-group">
            <label for="ruleName">Rule Name *</label>
            <input type="text" id="ruleName" required placeholder="e.g., Weekend Repayment"/>
          </div>

          <div class="form-group">
            <label>Trigger Condition *</label>
            <select id="triggerType" required>
              <option value="">Select trigger type</option>
              <option value="balance">Account balance threshold</option>
              <option value="balance">AI Agent</option>
              <option value="credit">Credit usage threshold</option>
              <option value="schedule">Scheduled time</option>
              <option value="transaction">On transaction</option>
            </select>
          </div>

          <div id="triggerDetails" class="form-group" hidden>
            <!-- Dynamic based on trigger type -->
          </div>

          <div class="form-group">
            <label>Action *</label>
            <select id="actionType" required>
              <option value="">Select action</option>
              <option value="repay">Repay credit</option>
              <option value="transfer">Transfer to savings</option>
              <option value="limit">Adjust credit limit</option>
            </select>
          </div>

          <div id="actionDetails" class="form-group" hidden>
            <!-- Dynamic based on action type -->
          </div>

          <div class="form-group">
            <label>Priority</label>
            <select id="rulePriority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Create Rule</button>
            <button type="button" class="btn-outline" id="cancelRule">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Transaction Modal -->
  <div id="transactionModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="transactionTitle" hidden>
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="transactionTitle">Quick Transaction</h3>
        <button class="modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="transactionForm">
          <div class="form-group">
            <label for="transactionAmount">Amount (AED) *</label>
            <input type="number" id="transactionAmount" required min="1" step="0.01" placeholder="500"/>
          </div>
          <div class="form-group" id="transactionNoteGroup">
            <label for="transactionNote">Note</label>
            <input type="text" id="transactionNote" placeholder="Optional note"/>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" id="confirmTransaction">Confirm</button>
            <button type="button" class="btn-outline" id="cancelTransaction">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Term Loan Modal -->
  <div id="termLoanModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="termLoanTitle" hidden>
    <div class="modal-content large">
      <div class="modal-header">
        <h3 id="termLoanTitle">Term Loan Application</h3>
        <button class="modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        
        <!-- Step Progress -->
        <div class="step-progress">
          <div class="step active" id="step1">
            <span class="step-number">1</span>
            <span class="step-label">Eligibility</span>
          </div>
          <div class="step" id="step2">
            <span class="step-number">2</span>
            <span class="step-label">Calculator</span>
          </div>
          <div class="step" id="step3">
            <span class="step-number">3</span>
            <span class="step-label">Confirmation</span>
          </div>
        </div>

        <!-- Step 1: Eligibility Check -->
        <div id="eligibilityStep" class="term-loan-step active">
          <h4>Check Your Eligibility</h4>
          <div id="eligibilityResult" class="eligibility-result">
            <div class="loading-spinner" id="eligibilityLoading">Checking eligibility...</div>
          </div>
        </div>

        <!-- Step 2: Loan Calculator -->
        <div id="calculatorStep" class="term-loan-step" hidden>
          <h4>Calculate Your Term Loan</h4>
          <div class="calculator-form">
            <div class="form-group">
              <label for="loanAmount">Loan Amount (AED)</label>
              <input type="number" id="loanAmount" min="1000" step="100" placeholder="Enter amount"/>
              <span class="field-note" id="amountNote">Minimum: AED 1,000</span>
            </div>
            
            <div class="form-group">
              <label for="loanTerm">Loan Term</label>
              <select id="loanTerm">
                <option value="">Select term</option>
                <option value="12">12 months (8.0% APR)</option>
                <option value="24">24 months (9.5% APR)</option>
                <option value="36">36 months (11.0% APR)</option>
                <option value="48">48 months (12.5% APR)</option>
                <option value="60">60 months (14.0% APR)</option>
              </select>
            </div>

            <button type="button" class="btn-primary" id="calculateLoan">Calculate</button>
          </div>

          <div id="loanResults" class="loan-results" hidden>
            <div class="results-grid">
              <div class="result-item">
                <span class="result-label">Monthly Payment (EMI)</span>
                <span class="result-value" id="monthlyEmi">AED 0</span>
              </div>
              <div class="result-item">
                <span class="result-label">Total Interest</span>
                <span class="result-value" id="totalInterest">AED 0</span>
              </div>
              <div class="result-item">
                <span class="result-label">Processing Fee (2.5%)</span>
                <span class="result-value" id="processingFee">AED 0</span>
              </div>
              <div class="result-item highlight">
                <span class="result-label">Total Cost</span>
                <span class="result-value" id="totalCost">AED 0</span>
              </div>
            </div>
            
            <div class="effective-apr">
              <span>Effective APR: <strong id="effectiveApr">0%</strong></span>
            </div>
          </div>
        </div>

        <!-- Step 3: Confirmation -->
        <div id="confirmationStep" class="term-loan-step" hidden>
          <h4>Confirm Your Term Loan</h4>
          <div class="confirmation-summary">
            <div class="summary-header">
              <h5>Loan Summary</h5>
            </div>
            <div class="summary-details">
              <div class="summary-row">
                <span>Loan Amount:</span>
                <span id="confirmAmount">AED 0</span>
              </div>
              <div class="summary-row">
                <span>Term:</span>
                <span id="confirmTerm">0 months</span>
              </div>
              <div class="summary-row">
                <span>Monthly Payment:</span>
                <span id="confirmEmi">AED 0</span>
              </div>
              <div class="summary-row">
                <span>Total Interest:</span>
                <span id="confirmInterest">AED 0</span>
              </div>
              <div class="summary-row">
                <span>Processing Fee:</span>
                <span id="confirmProcessingFee">AED 0</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount to Pay:</span>
                <span id="confirmTotal">AED 0</span>
              </div>
            </div>
            
            <div class="terms-acceptance">
              <label class="checkbox-wrapper">
                <input type="checkbox" id="acceptTerms" required>
                <span class="checkmark"></span>
                I agree to the <a href="#" target="_blank">Terms and Conditions</a> and <a href="#" target="_blank">Loan Agreement</a>
              </label>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button type="button" class="btn-outline" id="termLoanPrev" hidden>Previous</button>
          <button type="button" class="btn-primary" id="termLoanNext">Next</button>
          <button type="button" class="btn-success" id="confirmTermLoan" hidden>Confirm Loan</button>
          <button type="button" class="btn-outline" id="cancelTermLoan">Cancel</button>
        </div>

      </div>
    </div>
  </div>

  <script src="js/main.js?v=<?php echo time(); ?>"></script>
  <script src="js/term-loan.js?v=<?php echo time(); ?>"></script>
  <script src="js/credit-line.js?v=<?php echo time(); ?>"></script>
  <script src="js/auto-sweep-benefits.js?v=<?php echo time(); ?>"></script>
  
  <!-- Initialize credit circle with PHP values -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Get the credit circle element
      const creditUsageCircle = document.getElementById('creditUsageCircle');
      const percentText = document.querySelector('.credit-circle text:first-child');
      
      if (creditUsageCircle && window.creditData) {
        // Use the utilization percentage from PHP
        const utilizationPercent = window.creditData.utilizationPercent || 18;
        const circumference = 565.48;
        
        // Calculate stroke-dashoffset (higher offset = less visible circle)
        // For a circle that fills clockwise from 0% to 100%:
        const offset = circumference - (circumference * utilizationPercent / 100);
        
        // Apply the calculated offset using setAttribute (SVG attributes require setAttribute, not style)
        creditUsageCircle.setAttribute('stroke-dashoffset', offset);
        
        // Ensure percentage text matches
        if (percentText) {
          percentText.textContent = utilizationPercent + '%';
        }
        
        console.log('Credit circle initialized:', {
          utilizationPercent,
          offset,
          appliedOffset: creditUsageCircle.getAttribute('stroke-dashoffset'),
          creditLimit: window.creditData.creditLimit,
          usedCredit: window.creditData.usedCredit
        });
      }
    });
  </script>
</body>
</html>
