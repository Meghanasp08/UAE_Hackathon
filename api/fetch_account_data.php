<?php
/**
 * Fetch Complete Account Data via Open Finance APIs
 * 
 * This script calls all 5 Open Banking APIs after OAuth authentication:
 * 1. Multi Accounts (list all accounts)
 * 2. Account Info (specific account details)
 * 3. Balance (account balances)
 * 4. Transactions (transaction history)
 * 5. Beneficiaries (account beneficiaries)
 * 
 * Called via AJAX from accounts.js
 */

session_start();

// Set JSON response header
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in response

// Check if access token exists and is valid
if (!isset($_SESSION['access_token'], $_SESSION['access_token_expiry']) ||
    !$_SESSION['access_token'] ||
    $_SESSION['access_token_expiry'] <= time()) {
    echo json_encode([
        'success' => false,
        'error' => 'No valid access token found. Please reconnect your bank account.',
        'error_code' => 'NO_TOKEN'
    ]);
    exit;
}

$accessToken = $_SESSION['access_token'];

// Configuration
$baseHeaders = [
    "Content-Type: application/json",
    "Accept: application/jwt",
    "Authorization: Bearer $accessToken",
    "x-fapi-financial-id: CHANGEME0000000000",
    "x-fapi-interaction-id: " . uniqid()
];

$accountId = 'ACC_2SYVOW0YFS'; // Default account ID
$baseUrl = "https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/account-information/v1.2/accounts/";

// SSL certificates
$private_key_path = dirname(__DIR__, 2) . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
$certificate_path = dirname(__DIR__, 2) . "/certi2703/open_finance_crt.pem";

// Verify certificate files exist
if (!file_exists($private_key_path)) {
    echo json_encode([
        'success' => false,
        'error' => 'SSL private key not found',
        'error_code' => 'CERT_ERROR'
    ]);
    exit;
}

if (!file_exists($certificate_path)) {
    echo json_encode([
        'success' => false,
        'error' => 'SSL certificate not found',
        'error_code' => 'CERT_ERROR'
    ]);
    exit;
}

/**
 * Decode JWT response
 */
function decodeJwt($jwt) {
    if (!$jwt) return null;
    
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    $payload = $parts[1];
    $remainder = strlen($payload) % 4;
    if ($remainder) {
        $payload .= str_repeat('=', 4 - $remainder);
    }
    $decoded = base64_decode(strtr($payload, '-_', '+/'));
    return json_decode($decoded, true);
}

/**
 * Call Open Banking API
 */
function callOpenBankingAPI($url, $headers, $certPath, $keyPath) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSLCERT, $certPath);
    curl_setopt($ch, CURLOPT_SSLKEY, $keyPath);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'response' => $response,
        'error' => $curlError ?: null
    ];
}

/**
 * Format API result
 */
function formatApiResult($result, $endpointName) {
    if ($result['status'] >= 200 && $result['status'] < 300) {
        $decodedData = decodeJwt($result['response']);
        return [
            'success' => true,
            'status' => $result['status'],
            'data' => $decodedData ?: ['raw' => $result['response']],
            'error' => null,
            'endpoint' => $endpointName
        ];
    } else {
        return [
            'success' => false,
            'status' => $result['status'],
            'data' => null,
            'error' => "HTTP {$result['status']}: " . ($result['error'] ?: 'Request failed'),
            'endpoint' => $endpointName
        ];
    }
}

// Initialize response array
$accountData = [
    'success' => true,
    'fetched_at' => time(),
    'timestamp' => date('Y-m-d H:i:s'),
    'accounts' => [],
    'apis' => []
];

try {
    // 1. MULTI ACCOUNTS - Fetch all accounts first
    $result = callOpenBankingAPI($baseUrl, $baseHeaders, $certificate_path, $private_key_path);
    $accountData['apis']['multiaccounts'] = formatApiResult($result, 'Multi Accounts');
    
    // Extract all account IDs from the response
    $accountIds = [];
    if ($accountData['apis']['multiaccounts']['success']) {
        $multiData = $accountData['apis']['multiaccounts']['data'];
        if (isset($multiData['message']['Data']['Account']) && is_array($multiData['message']['Data']['Account'])) {
            foreach ($multiData['message']['Data']['Account'] as $account) {
                if (isset($account['AccountId'])) {
                    $accountIds[] = $account['AccountId'];
                }
            }
        }
    }
    
    // If no accounts found, use default
    if (empty($accountIds)) {
        $accountIds = [$accountId];
    }
    
    // Store total account count
    $accountData['total_accounts'] = count($accountIds);
    $accountData['account_ids'] = $accountIds;
    
    // 2. Fetch data for ALL accounts
    foreach ($accountIds as $index => $currentAccountId) {
        error_log("Fetching data for account: $currentAccountId");
        
        $accountDetails = [
            'account_id' => $currentAccountId,
            'account_index' => $index,
            'apis' => []
        ];
        
        // ACCOUNT INFO
        $result = callOpenBankingAPI($baseUrl . $currentAccountId, $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['accountinfo'] = formatApiResult($result, 'Account Info');
        
        // BALANCE
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/balances", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['balance'] = formatApiResult($result, 'Balance');
        
        // TRANSACTIONS
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/transactions", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['transactions'] = formatApiResult($result, 'Transactions');
        
        // BENEFICIARIES
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/beneficiaries", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['beneficiaries'] = formatApiResult($result, 'Beneficiaries');
        
        // SCHEDULED PAYMENTS
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/scheduled-payments", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['scheduled_payments'] = formatApiResult($result, 'Scheduled Payments');
        
        // STANDING ORDERS
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/standing-orders", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['standing_orders'] = formatApiResult($result, 'Standing Orders');
        
        // DIRECT DEBITS
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/direct-debits", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['direct_debits'] = formatApiResult($result, 'Direct Debits');
        
        // PARTIES
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/parties", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['parties'] = formatApiResult($result, 'Parties');
        
        // PRODUCTS
        $result = callOpenBankingAPI($baseUrl . $currentAccountId . "/product", $baseHeaders, $certificate_path, $private_key_path);
        $accountDetails['apis']['products'] = formatApiResult($result, 'Products');
        
        // Store account data
        $accountData['accounts'][$currentAccountId] = $accountDetails;
    }
    
    // For backward compatibility, also set the first account's data in the main 'apis' section
    if (!empty($accountIds)) {
        $firstAccountId = $accountIds[0];
        if (isset($accountData['accounts'][$firstAccountId])) {
            $accountData['apis'] = array_merge(
                $accountData['apis'],
                $accountData['accounts'][$firstAccountId]['apis']
            );
            $accountData['account_id'] = $firstAccountId; // Default to first account
        }
    }
    
    // Check if all API calls failed
    $allFailed = true;
    foreach ($accountData['accounts'] as $accData) {
        foreach ($accData['apis'] as $api) {
            if ($api['success']) {
                $allFailed = false;
                break 2;
            }
        }
    }
    
    if ($allFailed && empty($accountData['apis']['multiaccounts']['success'])) {
        $accountData['success'] = false;
        $accountData['error'] = 'All API calls failed. Please check your connection and try again.';
    }
    
    // Store in session for future use
    $_SESSION['banking_data'] = $accountData;
    $_SESSION['banking_data_fetched_at'] = time();
    
    // Return success response
    echo json_encode($accountData);
    
} catch (Exception $e) {
    // Handle any unexpected errors
    echo json_encode([
        'success' => false,
        'error' => 'An unexpected error occurred: ' . $e->getMessage(),
        'error_code' => 'EXCEPTION',
        'fetched_at' => time()
    ]);
}
