<?php
/**
 * OAuth Callback Handler for Apply Flow
 * 
 * This file handles the OAuth callback from the bank authorization server
 * and redirects back to apply.html with the tokens
 */

session_start();

// Enable error logging
error_log("=== OAuth Callback Handler Started ===");
error_log("GET params: " . print_r($_GET, true));
error_log("Session data: " . print_r($_SESSION, true));

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

    $private_key_path = dirname(__DIR__) . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
    $certificate_path = dirname(__DIR__) . "/certi2703/open_finance_crt.pem";

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
        $error = curl_error($curl);
        curl_close($curl);
        throw new Exception('Curl error: ' . $error);
    }

    $http_status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    error_log("Token exchange HTTP status: $http_status");
    error_log("Token exchange response: $response");

    if ($http_status >= 200 && $http_status < 300) {
        return json_decode($response, true);
    } else {
        throw new Exception("Failed to get token. HTTP Status: $http_status. Response: $response");
    }
}

try {
    // Check for authorization code
    if (!isset($_GET['code'])) {
        throw new Exception('No authorization code received');
    }

    $code = $_GET['code'];
    error_log("Authorization code received: $code");

    // Get client assertion from session
    if (!isset($_SESSION['clientAssertionJwt'])) {
        throw new Exception('Client assertion not found in session');
    }

    $redirectUri = 'https://testapp.ariticapp.com/mercurypay/v1/accounts_callback.php';
    $codeVerifier = '62413b56-d031-49e6-85d4-9f871e22333acb065b52-e3b2-4723-a717-1dae836da4c8';
    $clientAssertion = $_SESSION['clientAssertionJwt'];
    $tokenEndpoint = 'https://as1.altareq1.sandbox.apihub.openfinance.ae/token';

    error_log("Exchanging code for token...");
    
    // Exchange code for tokens
    $tokenResponse = getAccessTokenFromCode($code, $redirectUri, $codeVerifier, $clientAssertion, $tokenEndpoint);
    
    if (!isset($tokenResponse['access_token'])) {
        throw new Exception('No access token in response');
    }

    $accessToken = $tokenResponse['access_token'];
    $idToken = $tokenResponse['id_token'] ?? null;
    $refreshToken = $tokenResponse['refresh_token'] ?? null;
    $expiresIn = $tokenResponse['expires_in'] ?? 3600;

    error_log("Tokens received successfully");

    // Store tokens in session
    $_SESSION['access_token'] = $accessToken;
    $_SESSION['id_token'] = $idToken;
    $_SESSION['refresh_token'] = $refreshToken;
    $_SESSION['access_token_expiry'] = time() + $expiresIn - 60; // 60s buffer
    $_SESSION['token_received_at'] = time();

    // Build redirect URL back to apply.html with success flag
    $applyUrl = 'https://testapp.ariticapp.com/mercurypay/v1/apply.html';
    
    // Add tokens as URL parameters (will be captured by JavaScript)
    $redirectUrl = $applyUrl . '?' . http_build_query([
        'oauth_success' => 'true',
        'access_token' => $accessToken,
        'expires_in' => $expiresIn,
        'bank_name' => 'Connected Bank',
        'timestamp' => time()
    ]);

    error_log("Redirecting to: $redirectUrl");

    // Redirect back to apply page
    header("Location: $redirectUrl");
    exit;

} catch (Exception $e) {
    error_log("OAuth callback error: " . $e->getMessage());
    
    // Redirect back to apply page with error
    $applyUrl = 'https://testapp.ariticapp.com/mercurypay/v1/apply.html';
    $redirectUrl = $applyUrl . '?' . http_build_query([
        'oauth_error' => 'token_exchange_failed',
        'error_description' => $e->getMessage()
    ]);
    
    header("Location: $redirectUrl");
    exit;
}
