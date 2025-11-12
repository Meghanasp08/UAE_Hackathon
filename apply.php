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

// Handle application state restoration
$applicationData = [];
if (isset($_SESSION['application_data'])) {
  $applicationData = $_SESSION['application_data'];
}

// Store application data if submitted via POST
if ($_POST && !$oauthSuccess) {
  $_SESSION['application_data'] = [
    'fullName' => $_POST['fullName'] ?? '',
    'emiratesID' => $_POST['emiratesID'] ?? '',
    'email' => $_POST['email'] ?? '',
    'phone' => $_POST['phone'] ?? '',
    'monthlyIncome' => $_POST['monthlyIncome'] ?? '',
    'timestamp' => time()
  ];
  // Set redirect URL for after OAuth completion
  $_SESSION['redirect_after_oauth'] = 'https://mercurypay.ariticapp.com/mercurypay/v1/apply.php';
  $applicationData = $_SESSION['application_data'];
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Apply for Smart Credit</title>
  <link rel="stylesheet" href="css/style.css"/>
  <script>
    // Pass PHP variables to JavaScript
    window.phpData = {
      oauthSuccess: <?php echo json_encode($oauthSuccess); ?>,
      oauthError: <?php echo json_encode($oauthError); ?>,
      bankConnected: <?php echo json_encode($bankConnected); ?>,
      applicationData: <?php echo json_encode($applicationData); ?>
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
      <a href="credit-line.php" class="nav-link" title="Credit Line" aria-label="Credit Line">
        <div class="nav-item">
          <img src="assets/nav-credit-line.svg" alt="Credit Line" style="height:28px;width:28px;"/>
          <span class="nav-label">Credit Line</span>
        </div>
      </a>
      <a href="apply.php" class="nav-link active" title="Apply" aria-label="Apply">
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

  <main class="container">
    <section class="apply-header">
      <h2>Apply for Smart Credit</h2>
    </section>

    <?php if ($oauthSuccess): ?>
    <div class="alert alert-success" style="background: #10b981; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span style="font-size: 1.2rem;">✅</span>
      <span>Bank connection successful! You can now proceed to credit assessment.</span>
    </div>
    <?php endif; ?>

    <?php if ($oauthError): ?>
    <div class="alert alert-error" style="background: #dc2626; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span style="font-size: 1.2rem;">❌</span>
      <span>Bank connection failed: <?php echo htmlspecialchars($oauthError); ?>. Please try again.</span>
    </div>
    <?php endif; ?>

    <!-- Progress indicator -->
    <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-step active" data-step="1">
        <div class="step-circle">1</div>
        <span class="step-label">Personal Info</span>
      </div>
      <div class="progress-step" data-step="2">
        <div class="step-circle">2</div>
        <span class="step-label">Account Connect</span>
      </div>
      <div class="progress-step" data-step="3">
        <div class="step-circle">3</div>
        <span class="step-label">Credit Check</span>
      </div>
      <div class="progress-step" data-step="4">
        <div class="step-circle">4</div>
        <span class="step-label">Approval</span>
      </div>
    </div>

    <!-- Application Form -->
    <form id="applicationForm" class="application-form" method="post">
      <!-- Step 1: Personal Information -->
      <section id="step1" class="form-section active">
        <h3>Personal Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="fullName">Full Name *</label>
            <input type="text" id="fullName" name="fullName" required aria-required="true" 
                   value="<?php echo htmlspecialchars($applicationData['fullName'] ?? 'Priya Sharma'); ?>"/>
          </div>
          <div class="form-group">
            <label for="emiratesID">Emirates ID *</label>
            <input type="text" id="emiratesID" name="emiratesID" required aria-required="true" 
                   value="<?php echo htmlspecialchars($applicationData['emiratesID'] ?? '784-1992-9876543-2'); ?>"/>
          </div>
          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required aria-required="true" 
                   value="<?php echo htmlspecialchars($applicationData['email'] ?? 'priya.sharma@shukria.com'); ?>"/>
          </div>
          <div class="form-group">
            <label for="phone">Phone Number *</label>
            <input type="tel" id="phone" name="phone" required aria-required="true" 
                   value="<?php echo htmlspecialchars($applicationData['phone'] ?? '+971 55 987 6543'); ?>"/>
          </div>
          <div class="form-group full-width">
            <label for="monthlyIncome">Monthly Income (AED)</label>
            <input type="number" id="monthlyIncome" name="monthlyIncome" 
                   value="<?php echo htmlspecialchars($applicationData['monthlyIncome'] ?? '22000'); ?>"/>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-primary" id="nextStep1">Next: Connect Account</button>
          <button type="button" class="btn-outline" id="voiceApply">🎤 Start with Voice</button>
        </div>
      </section>

      <!-- Step 2: Account Connection -->
      <section id="step2" class="form-section">
        <h3>Connect Your Bank Account</h3>
        <p>We'll securely access your account data through Nebras (UAE's Open Banking platform) to assess your credit eligibility.</p>
        
        <?php if ($bankConnected): ?>
        <div class="connection-success" style="background: #10b981; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          ✅ Bank Account Connected Successfully
          <br><small>Your account data is ready for credit assessment</small>
        </div>
        <?php endif; ?>
        
        <div class="consent-box">
          <h4>Data Consent Required</h4>
          <p>By connecting your account, you consent to:</p>
          <ul>
            <li>Read-only access to account balances</li>
            <li>Transaction history (last 6 months)</li>
            <li>Account holder information verification</li>
          </ul>
          <label class="checkbox-label">
            <input type="checkbox" id="consentCheckbox" <?php echo $bankConnected ? 'checked' : ''; ?> required/>
            <span>I consent to share my account data via Nebras Open Banking</span>
          </label>
        </div>

        <!-- Fetching Banking Data Progress -->
        <div id="fetchingDataProgress" class="fetching-data-progress" hidden style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div class="spinner"></div>
            <h4 style="margin: 0; color: #0369a1;">📊 Fetching Your Account Data...</h4>
          </div>
          <p style="color: #0c4a6e; margin-bottom: 1rem;">Please wait while we securely retrieve your banking information.</p>
          <div class="fetch-progress-items" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div id="fetchStep1" class="fetch-step" style="display: flex; align-items: center; gap: 0.5rem; color: #64748b;">
              <span class="fetch-icon">⏳</span>
              <span>Retrieving accounts...</span>
            </div>
            <div id="fetchStep2" class="fetch-step" style="display: flex; align-items: center; gap: 0.5rem; color: #64748b;">
              <span class="fetch-icon">⏳</span>
              <span>Fetching account details...</span>
            </div>
            <div id="fetchStep3" class="fetch-step" style="display: flex; align-items: center; gap: 0.5rem; color: #64748b;">
              <span class="fetch-icon">⏳</span>
              <span>Loading balance information...</span>
            </div>
            <div id="fetchStep4" class="fetch-step" style="display: flex; align-items: center; gap: 0.5rem; color: #64748b;">
              <span class="fetch-icon">⏳</span>
              <span>Analyzing transactions...</span>
            </div>
          </div>
        </div>

        <!-- Banking Data Summary (shown after successful fetch) -->
        <div id="bankingDataSummary" class="banking-data-summary" hidden style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">✅</span>
            <h4 style="margin: 0; color: #15803d;">Account Data Retrieved Successfully!</h4>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="background: white; padding: 1rem; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.875rem; color: #166534; margin-bottom: 0.25rem;">📂 Accounts Found</div>
              <div id="summaryAccountsCount" style="font-size: 1.5rem; font-weight: bold; color: #15803d;">-</div>
            </div>
            <div style="background: white; padding: 1rem; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.875rem; color: #166534; margin-bottom: 0.25rem;">💰 Total Balance</div>
              <div id="summaryBalance" style="font-size: 1.5rem; font-weight: bold; color: #15803d;">-</div>
            </div>
            <div style="background: white; padding: 1rem; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.875rem; color: #166534; margin-bottom: 0.25rem;">📊 Transactions</div>
              <div id="summaryTransactions" style="font-size: 1.5rem; font-weight: bold; color: #15803d;">-</div>
            </div>
          </div>
        </div>

        <!-- Fetch Error Display -->
        <div id="fetchErrorDisplay" class="fetch-error-display" hidden style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626;">
            <span style="font-size: 1.2rem;">❌</span>
            <span id="fetchErrorMessage" style="font-weight: 500;">Failed to fetch banking data. Please try again.</span>
          </div>
        </div>

        <div id="connectionStatus" class="connection-status" hidden>
          <div class="spinner"></div>
          <p id="statusText">Connecting to your bank...</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-outline" id="backStep2">← Back</button>
          <button type="button" class="btn-primary" id="nextStep2" <?php echo $bankConnected ? '' : 'disabled'; ?>>Next: Credit Check</button>
        </div>
      </section>

      <!-- Step 3: Credit Assessment -->
      <section id="step3" class="form-section">
        <h3>Credit Assessment</h3>
        <p>Analyzing your financial profile...</p>
        
        <div class="assessment-progress">
          <div class="assessment-item" id="assess1">
            <div class="spinner small"></div>
            <span>Verifying account data...</span>
          </div>
          <div class="assessment-item" id="assess2">
            <div class="spinner small"></div>
            <span>Calculating credit score...</span>
          </div>
          <div class="assessment-item" id="assess3">
            <div class="spinner small"></div>
            <span>Evaluating ESG compatibility...</span>
          </div>
        </div>

        <!-- Credit Score Breakdown -->
        <div id="scoreBreakdown" class="score-breakdown" hidden style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
          <h4 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
            📊 Your Credit Score Breakdown
          </h4>
          
          <!-- Overall Score -->
          <div style="background: linear-gradient(135deg, #7B2687 0%, #B83280 100%); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Overall Credit Score</div>
            <div style="font-size: 3rem; font-weight: bold;" id="overallScore">--</div>
            <div style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.5rem;" id="scoreRating">Calculating...</div>
          </div>
          
          <!-- Score Components -->
          <div style="display: grid; gap: 1rem; margin-bottom: 1rem;">
            <!-- Balance Score -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
                  💰 Account Balance Score
                </span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #7B2687;" id="balanceScoreValue">--</span>
              </div>
              <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
                <div id="balanceScoreBar" style="background: linear-gradient(90deg, #7B2687, #B83280); height: 100%; width: 0%; transition: width 1s ease;"></div>
              </div>
              <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;" id="balanceScoreDesc">
                Based on your total account balance
              </div>
            </div>
            
            <!-- Transaction Score -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
                  📈 Transaction Activity Score
                </span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #7B2687;" id="transactionScoreValue">--</span>
              </div>
              <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
                <div id="transactionScoreBar" style="background: linear-gradient(90deg, #7B2687, #B83280); height: 100%; width: 0%; transition: width 1s ease;"></div>
              </div>
              <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;" id="transactionScoreDesc">
                Based on your transaction history
              </div>
            </div>
            
            <!-- Cash Flow Score -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
                  💸 Cash Flow Score
                </span>
                <span style="font-size: 1.5rem; font-weight: bold;" id="cashFlowScoreValue" style="color: #7B2687;">--</span>
              </div>
              <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
                <div id="cashFlowScoreBar" style="background: linear-gradient(90deg, #7B2687, #B83280); height: 100%; width: 0%; transition: width 1s ease;"></div>
              </div>
              <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;" id="cashFlowScoreDesc">
                Income vs expenses analysis
              </div>
            </div>
            
            <!-- Income Multiplier -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
                  💼 Income Multiplier
                </span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #7B2687;" id="incomeMultiplierValue">--</span>
              </div>
              <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
                <div id="incomeMultiplierBar" style="background: linear-gradient(90deg, #7B2687, #B83280); height: 100%; width: 0%; transition: width 1s ease;"></div>
              </div>
              <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;" id="incomeMultiplierDesc">
                Based on declared monthly income: <span id="monthlyIncomeDisplay">AED --</span>
              </div>
            </div>
          </div>
          
          <!-- Assessment Reason -->
          <div id="assessmentReason" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
            <div style="font-size: 0.875rem; font-weight: 600; color: #1e40af; margin-bottom: 0.25rem;">Assessment Summary</div>
            <div style="font-size: 0.875rem; color: #1e3a8a;" id="assessmentReasonText">Analyzing your profile...</div>
          </div>
        </div>

        <div id="creditResult" class="credit-result" hidden>
          <div class="result-success">
            <span class="result-icon">✅</span>
            <h4>Congratulations! You're Pre-Approved</h4>
            <div class="credit-offer">
              <div class="offer-item">
                <span class="offer-label">Credit Limit</span>
                <span class="offer-value" id="offerCreditLimit">AED 15,250</span>
              </div>
              <div class="offer-item">
                <span class="offer-label">APR</span>
                <span class="offer-value" id="offerAPR">8.9%</span>
              </div>
              <div class="offer-item">
                <span class="offer-label">Setup Fee</span>
                <span class="offer-value" id="offerSetupFee">AED 0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-outline" id="backStep3">← Back</button>
          <button type="button" class="btn-primary" id="acceptOffer" disabled>Accept & Activate</button>
        </div>
      </section>

      <!-- Step 4: Success -->
      <section id="step4" class="form-section">
        <div class="success-screen">
          <span class="success-icon">🎉</span>
          <h3>Your Smart Credit Line is Active!</h3>
          <p>Your credit line has been activated and is ready to use.</p>
          
          <div class="credit-summary">
            <div class="summary-item">
              <span class="summary-label">Available Credit</span>
              <span class="summary-value" id="finalCreditLimit">AED 15,250</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Interest Rate</span>
              <span class="summary-value" id="finalAPR">8.9% APR</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-primary" onclick="location.href='credit-line.php'">
              Set Up SmartPay Rules
            </button>
            <button type="button" class="btn-outline" onclick="location.href='index.html'">
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>
    </form>
  </main>

  <!-- Floating voice button -->
  <button id="voiceBtn" class="voice-btn" aria-label="Activate voice commands" title="Voice commands">
    🎤
  </button>

  <!-- Voice feedback live region -->
  <div id="voiceFeedback" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

  <!-- Consent Modal -->
  <div id="consentModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="consentTitle" hidden>
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="consentTitle">Nebras Open Banking Consent</h3>
        <button class="modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>You are about to share your financial data securely through Nebras.</strong></p>
        <p>Mercury Smart Credit will access:</p>
        <ul>
          <li>Account balances (read-only)</li>
          <li>Transaction history (6 months)</li>
          <li>Account holder verification</li>
        </ul>
        <p>Your data is encrypted and will only be used for credit assessment purposes.</p>
        <div class="form-actions">
          <button class="btn-primary" id="confirmConsent">Authorize Access</button>
          <button class="btn-outline" id="cancelConsent">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <script src="js/main.js?v=<?php echo time(); ?>"></script>
  <script src="js/apply.js?v=<?php echo time(); ?>"></script>
</body>
</html>