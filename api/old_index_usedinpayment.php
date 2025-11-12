<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Finance Demo</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .container { max-width: 800px; margin-top: 40px; }
        .jwt-box { word-break: break-all; font-size: 0.95em; }
        .api-btns button { margin: 0.25rem 0.5rem 0.25rem 0; }
        .sso-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        .sso-user-info {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        .timeline {
            max-height: 200px;
            overflow-y: auto;
        }
        .timeline::-webkit-scrollbar {
            width: 4px;
        }
        .timeline::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .timeline::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 2px;
        }
    </style>
</head>
<body>
<div class="container">
    <h1 class="mb-4 text-primary">Open Finance Demo</h1>
    
    <?php
    // Display SSO messages
    if (isset($_GET['sso_success'])) {
        echo '<div class="alert alert-success alert-dismissible fade show" role="alert">';
        echo '<i class="fas fa-check-circle me-2"></i>SSO authentication successful! You are now logged in.';
        echo '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        echo '</div>';
    }
    
    if (isset($_GET['sso_logout'])) {
        echo '<div class="alert alert-info alert-dismissible fade show" role="alert">';
        echo '<i class="fas fa-sign-out-alt me-2"></i>SSO logout successful.';
        echo '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        echo '</div>';
    }
    
    if (isset($_GET['sso_error'])) {
        echo '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
        echo '<i class="fas fa-exclamation-triangle me-2"></i>' . htmlspecialchars(urldecode($_GET['sso_error']));
        echo '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        echo '</div>';
    }
    ?>
    
    <div class="d-flex justify-content-end mb-3">
        <?php
        $hasToken = isset($_SESSION['access_token'], $_SESSION['access_token_expiry']) &&
            $_SESSION['access_token'] &&
            $_SESSION['access_token_expiry'] > time();
        $authLabel = $hasToken ? 'Re-Authorize' : 'Authorize';
        
        $hasSSOToken = isset($_SESSION['sso_access_token'], $_SESSION['sso_token_expiry']) &&
            $_SESSION['sso_access_token'] &&
            $_SESSION['sso_token_expiry'] > time();
        $ssoLabel = $hasSSOToken ? 'SSO Re-Login' : 'SSO Login';
        ?>
        <a href="callOpenFinanceClient.php" id="authBtn" class="btn btn-warning position-relative me-2">
            <span id="authBtnText"><?php echo $authLabel; ?></span>
            <span id="authBtnSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status" aria-hidden="true"></span>
        </a>
        <button onclick="initiateSSO()" id="ssoBtn" class="btn btn-primary position-relative me-2">
            <i class="fas fa-sign-in-alt me-2"></i>
            <span id="ssoBtnText"><?php echo $ssoLabel; ?></span>
            <span id="ssoBtnSpinner" class="spinner-border spinner-border-sm ms-2 d-none" role="status" aria-hidden="true"></span>
        </button>
        <a href="sso_status.php" class="btn btn-outline-info btn-sm">
            <i class="fas fa-info-circle me-1"></i>SSO Status
        </a>
        <a href="sso_test.php" class="btn btn-outline-secondary btn-sm ms-2" title="Test SSO Configuration">
            <i class="fas fa-cog"></i>
        </a>
        <a href="sso_certificate_test.php" class="btn btn-outline-warning btn-sm ms-1" title="Test SSO Certificates">
            <i class="fas fa-certificate"></i>
        </a>
        <a href="sso_logs.php" class="btn btn-outline-info btn-sm ms-1 position-relative" title="View SSO Debug Logs">
            <i class="fas fa-bug"></i>
            <?php 
            $logCount = isset($_SESSION['sso_logs']) ? count($_SESSION['sso_logs']) : 0;
            if ($logCount > 0) {
                echo '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">';
                echo $logCount > 99 ? '99+' : $logCount;
                echo '</span>';
            }
            ?>
        </a>
        <a href="sso_flow.php" class="btn btn-outline-success btn-sm ms-1" title="View SSO Flow Diagram">
            <i class="fas fa-sitemap"></i>
        </a>
    </div>
    <script>
        const authBtn = document.getElementById('authBtn');
        const authBtnText = document.getElementById('authBtnText');
        const authBtnSpinner = document.getElementById('authBtnSpinner');
        const ssoBtn = document.getElementById('ssoBtn');
        const ssoBtnText = document.getElementById('ssoBtnText');
        const ssoBtnSpinner = document.getElementById('ssoBtnSpinner');
        
        if (authBtn) {
            authBtn.addEventListener('click', function(e) {
                authBtnSpinner.classList.remove('d-none');
                authBtnText.textContent = authBtnText.textContent.includes('Re-') ? 'Re-Authorizing...' : 'Authorizing...';
                authBtn.classList.add('disabled');
            });
        }

        async function initiateSSO() {
            ssoBtnSpinner.classList.remove('d-none');
            ssoBtnText.textContent = 'Initiating SSO...';
            ssoBtn.classList.add('disabled');
            
            try {
                // Start SSO flow by calling our SSO handler
                window.location.href = 'sso_handler.php?action=initiate';
            } catch (error) {
                console.error('SSO initiation failed:', error);
                alert('Failed to initiate SSO. Please try again.');
                resetSSOButton();
            }
        }

        function resetSSOButton() {
            ssoBtnSpinner.classList.add('d-none');
            ssoBtnText.textContent = 'SSO Login';
            ssoBtn.classList.remove('disabled');
        }

        // Generate PKCE verifier and challenge
        function generateCodeVerifier() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return btoa(String.fromCharCode.apply(null, array))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }

        async function generateCodeChallenge(verifier) {
            const encoder = new TextEncoder();
            const data = encoder.encode(verifier);
            const digest = await crypto.subtle.digest('SHA-256', data);
            return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }
    </script>
    <?php
    session_start();

    // Display SSO user information if available
    if (isset($_SESSION['sso_user_info']) && isset($_SESSION['sso_access_token'])) {
        $userInfo = $_SESSION['sso_user_info'];
        echo '<div class="sso-section">';
        echo '<h3><i class="fas fa-user-shield me-2"></i>SSO Authentication Active</h3>';
        echo '<div class="sso-user-info">';
        echo '<div class="row">';
        echo '<div class="col-md-6">';
        echo '<h6><i class="fas fa-user me-2"></i>User Information</h6>';
        if (isset($userInfo['name'])) echo '<p><strong>Name:</strong> ' . htmlspecialchars($userInfo['name']) . '</p>';
        if (isset($userInfo['email'])) echo '<p><strong>Email:</strong> ' . htmlspecialchars($userInfo['email']) . '</p>';
        if (isset($userInfo['sub'])) echo '<p><strong>Subject:</strong> ' . htmlspecialchars($userInfo['sub']) . '</p>';
        echo '</div>';
        echo '<div class="col-md-6">';
        echo '<h6><i class="fas fa-building me-2"></i>Organization Details</h6>';
        if (isset($userInfo['trust_framework_profile']['org_access_details'])) {
            foreach ($userInfo['trust_framework_profile']['org_access_details'] as $orgId => $orgInfo) {
                echo '<p><strong>Organization:</strong> ' . htmlspecialchars($orgInfo['organisation_name']) . '</p>';
                echo '<p><strong>Registration:</strong> ' . htmlspecialchars($orgInfo['org_registration_number']) . '</p>';
                echo '<p><strong>Admin:</strong> ' . ($orgInfo['org_admin'] ? 'Yes' : 'No') . '</p>';
                break; // Show first org only
            }
        }
        echo '</div>';
        echo '</div>';
        echo '<div class="mt-3">';
        echo '<a href="sso_handler.php?action=logout" class="btn btn-light btn-sm"><i class="fas fa-sign-out-alt me-2"></i>SSO Logout</a>';
        echo '</div>';
        echo '</div>';
        echo '</div>';
    }

    // Display recent SSO logs for debugging
    if (isset($_SESSION['sso_logs']) && !empty($_SESSION['sso_logs'])) {
        $recentLogs = array_slice($_SESSION['sso_logs'], -5); // Last 5 logs
        echo '<div class="card mb-3">';
        echo '<div class="card-header d-flex justify-content-between align-items-center">';
        echo '<h6 class="mb-0"><i class="fas fa-list me-2"></i>Recent SSO Activity</h6>';
        echo '<a href="sso_logs.php" class="btn btn-outline-primary btn-sm">View All Logs</a>';
        echo '</div>';
        echo '<div class="card-body">';
        echo '<div class="timeline">';
        
        foreach (array_reverse($recentLogs) as $log) {
            $typeClass = $log['type'] ?? 'info';
            $typeIcon = [
                'info' => 'fas fa-info-circle text-primary',
                'success' => 'fas fa-check-circle text-success',
                'warning' => 'fas fa-exclamation-triangle text-warning',
                'error' => 'fas fa-times-circle text-danger'
            ][$typeClass] ?? 'fas fa-info-circle text-primary';
            
            echo '<div class="d-flex align-items-start mb-2">';
            echo '<i class="' . $typeIcon . ' me-2 mt-1"></i>';
            echo '<div class="flex-grow-1">';
            echo '<small class="text-muted">' . htmlspecialchars($log['timestamp']) . '</small>';
            echo '<div><strong>' . htmlspecialchars($log['step']) . ':</strong> ' . htmlspecialchars($log['message']) . '</div>';
            echo '</div>';
            echo '</div>';
        }
        
        echo '</div>';
        echo '</div>';
        echo '</div>';
    }

    // Check for valid access token in session
    if (
        isset($_SESSION['access_token'], $_SESSION['access_token_expiry']) &&
        $_SESSION['access_token'] &&
        $_SESSION['access_token_expiry'] > time()
    ) {
        // Token is valid, show API buttons
        $accessToken = $_SESSION['access_token'];
        echo '<div class="alert alert-success">Access token is active.</div>';
	 echo '<div class="card mb-3"><div class="card-body">';
        echo '<h5 class="card-title text-success">✅ Access Token</h5>';
        echo '<div class="jwt-box">' . htmlspecialchars($accessToken) . '</div>';
        echo '</div></div>';

        echo '<h3 class="mt-4">🔘 Call Open Finance APIs</h3>';
        ?>
        <form method="post" action="call_api.php" class="api-btns mb-4">
            <button type="submit" class="btn btn-outline-primary" name="endpoint" value="multiaccounts">📂 Get All Accounts</button>
            <button type="submit" class="btn btn-outline-secondary" name="endpoint" value="accountinfo">📄 Get Account Info</button>
            <button type="submit" class="btn btn-outline-success" name="endpoint" value="balance">💰 Get Account Balance</button>
            <button type="submit" class="btn btn-outline-info" name="endpoint" value="transactions">📊 Get Transactions</button>
            <button type="submit" class="btn btn-outline-dark" name="endpoint" value="beneficiaries">👥 Get Beneficiaries</button>
        </form>
        <form method="post" action="payment_call.php" class="api-btns mb-4">
            <!-- Radio buttons to choose payment type -->
            <div class="mb-2">
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="payment_type" id="payment_single" value="single" checked>
                    <label class="form-check-label" for="payment_single">Single Payment</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="payment_type" id="payment_subscription" value="subscription">
                    <label class="form-check-label" for="payment_subscription">Subscription</label>
                </div>
            </div>
            <button type="submit" class="btn btn-outline-danger" name="endpoint" value="payment">
                💳 Make Payment
            </button>
        </form>

        <?php
        exit;
    }

    // Show the stored JWT
    if (isset($_SESSION['clientAssertionJwt'])) {
        echo '<div class="alert alert-info"><strong>Stored JWT:</strong><div class="jwt-box">' . $_SESSION['clientAssertionJwt'] . '</div></div>';
    } else {
        echo '<div class="alert alert-warning">No JWT found in session.</div>';
    }

    // Log incoming POST data if present
    $body = file_get_contents('php://input');
    if (!empty($body)) {
        error_log("Received raw data:");
        error_log(print_r(json_decode($body, true), true));
    }

    /**
     * Function to exchange authorization code for access token
     */
    function getAccessTokenFromCode($code, $redirectUri, $codeVerifier, $clientAssertion, $tokenEndpoint)
    {
        $postData = [
            'grant_type' => 'authorization_code',
            'scope' => 'accounts',
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'code_verifier' => $codeVerifier,
            'client_assertion_type' => 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            'client_assertion' => $clientAssertion
        ];

        $curl = curl_init();

        $private_key_path = __DIR__ . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
        $certificate_path = __DIR__ . "/certi2703/open_finance_crt.pem";

        curl_setopt_array($curl, [
            CURLOPT_URL => $tokenEndpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSLCERT => $certificate_path,
            CURLOPT_SSLKEY => $private_key_path,
        ]);

        $response = curl_exec($curl);

        if (curl_errno($curl)) {
            throw new Exception('Curl error: ' . curl_error($curl));
        }

        $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($http_status >= 200 && $http_status < 300) {
            return json_decode($response, true);
        } else {
            throw new Exception("Failed to get token. HTTP Status: $http_status. Response: $response");
        }
    }

    // ==== MAIN PROCESSING ====
    try {
        if (!isset($_GET['code'])) {
            // No code and no valid token, start auth flow
            header('Location: callOpenFinanceClient.php');
            exit;
        }
        $code = $_GET['code'];
	$_SESSION['code'] = $code;
        echo '<div class="alert alert-secondary"><strong>Authorization Code:</strong> ' . htmlspecialchars($code) . '</div>';

        $redirectUri = 'https://testapp.ariticapp.com/mercurypay';
        $codeVerifier = '62413b56-d031-49e6-85d4-9f871e22333acb065b52-e3b2-4723-a717-1dae836da4c8';
	 $codeVerifier = $_SESSION['code_verifier']? $_SESSION['code_verifier'] : '62413b56-d031-49e6-85d4-9f871e22333acb065b52-e3b2-4723-a717-1dae836da4c8';
	//$codeVerifier = $_SESSION['code_verifier'];
	echo "Code Verifier:" .  $codeVerifier ;
        $clientAssertion = $_SESSION['clientAssertionJwt'];
        $tokenEndpoint = 'https://as1.altareq1.sandbox.apihub.openfinance.ae/token';
	$_SESSION['redirect_uri'] =  $redirectUri;
        $tokenResponse = getAccessTokenFromCode($code, $redirectUri, $codeVerifier, $clientAssertion, $tokenEndpoint);
        $accessToken = $tokenResponse['access_token'];
	echo $accessToken;
        $idToken = $tokenResponse['id_token'];
        $refreshToken = $tokenResponse['refresh_token'];
        // Store access token and expiry in session
        $_SESSION['access_token'] = $accessToken;
        $_SESSION['access_token_expiry'] = time() + $tokenResponse['expires_in'] - 60; // 60s buffer

        echo '<div class="card mb-3"><div class="card-body">';
        echo '<h5 class="card-title text-success">✅ Access Token</h5>';
        echo '<div class="jwt-box">' . htmlspecialchars($accessToken) . '</div>';
        echo '</div></div>';
        echo '<div class="card mb-3"><div class="card-body">';
        echo '<h6 class="card-title">ID Token</h6>';
        echo '<div class="jwt-box">' . htmlspecialchars($idToken) . '</div>';
        echo '</div></div>';
        echo '<div class="card mb-3"><div class="card-body">';
        echo '<h6 class="card-title">Refresh Token</h6>';
        echo '<div class="jwt-box">' . htmlspecialchars($refreshToken) . '</div>';
        echo '</div></div>';

        // Show buttons to call APIs using this token
        echo '<h3 class="mt-4">🔘 Call Open Finance APIs</h3>';
        ?>
        <form method="post" action="call_api.php" class="api-btns mb-4">
            <button type="submit" class="btn btn-outline-primary" name="endpoint" value="multiaccounts">📂 Get All Accounts</button>
            <button type="submit" class="btn btn-outline-secondary" name="endpoint" value="accountinfo">📄 Get Account Info</button>
            <button type="submit" class="btn btn-outline-success" name="endpoint" value="balance">💰 Get Account Balance</button>
            <button type="submit" class="btn btn-outline-info" name="endpoint" value="transactions">📊 Get Transactions</button>
            <button type="submit" class="btn btn-outline-dark" name="endpoint" value="beneficiaries">👥 Get Beneficiaries</button>
        </form>
            <form method="post" action="payment_call.php" class="api-btns mb-4">
                <!-- Radio buttons to choose payment type -->
                <div class="mb-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="payment_type" id="payment_single_2" value="single" checked>
                        <label class="form-check-label" for="payment_single_2">Single Payment</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="payment_type" id="payment_subscription_2" value="subscription">
                        <label class="form-check-label" for="payment_subscription_2">Subscription</label>
                    </div>
                </div>
                <button type="submit" class="btn btn-outline-danger" name="endpoint" value="payment">
                    💳 Make Payment
                </button>
            </form>
        <?php
        exit;
    } catch (Exception $e) {
        echo '<div class="alert alert-danger">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
    }
    ?>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>


