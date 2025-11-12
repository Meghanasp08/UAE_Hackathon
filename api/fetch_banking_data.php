<?php
/**
 * Fetch Banking Data via Open Finance APIs
 * 
 * This script calls multiple Open Banking APIs after OAuth authentication
 * and stores the responses in the session for later use.
 * 
 * Called via AJAX from apply.js after successful OAuth flow
 */

session_start();

// Set JSON response header
header('Content-Type: application/json');

// Check if access token exists and is valid
if (!isset($_SESSION['access_token'], $_SESSION['access_token_expiry']) ||
    !$_SESSION['access_token'] ||
    $_SESSION['access_token_expiry'] <= time()) {
    echo json_encode([
        'success' => false,
        'error' => 'No valid access token found. Please reconnect your bank account.'
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

/**
 * Decode JWT response
 */
function decodeJwt($jwt) {
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

// Initialize response array
$bankingData = [
    'multiaccounts' => null,
    'accountinfo' => null,
    'balance' => null,
    'transactions' => null,
    'fetched_at' => time(),
    'account_id' => $accountId
];

try {
    // 1. Fetch all accounts (to get the correct Account ID)
    $result = callOpenBankingAPI($baseUrl, $baseHeaders, $certificate_path, $private_key_path);
    if ($result['status'] >= 200 && $result['status'] < 300) {
        $decodedData = decodeJwt($result['response']);
        $bankingData['multiaccounts'] = [
            'status' => $result['status'],
            'data' => $decodedData ?: $result['response'],
            'error' => null
        ];
        
        // Try to extract the first valid Account ID from the response
        if ($decodedData && isset($decodedData['message']['Data']['Account'][0]['AccountId'])) {
            $accountId = $decodedData['message']['Data']['Account'][0]['AccountId'];
            $bankingData['account_id'] = $accountId;
        }
    } else {
        $bankingData['multiaccounts'] = [
            'status' => $result['status'],
            'data' => null,
            'error' => "HTTP {$result['status']}: {$result['error']}"
        ];
    }
    
    // 2. Fetch specific account info
    $result = callOpenBankingAPI($baseUrl . $accountId, $baseHeaders, $certificate_path, $private_key_path);
    if ($result['status'] >= 200 && $result['status'] < 300) {
        $bankingData['accountinfo'] = [
            'status' => $result['status'],
            'data' => decodeJwt($result['response']) ?: $result['response'],
            'error' => null
        ];
    } else {
        $bankingData['accountinfo'] = [
            'status' => $result['status'],
            'data' => null,
            'error' => "HTTP {$result['status']}: {$result['error']}"
        ];
    }
    
    // 3. Fetch account balance
    $result = callOpenBankingAPI($baseUrl . $accountId . "/balances", $baseHeaders, $certificate_path, $private_key_path);
    if ($result['status'] >= 200 && $result['status'] < 300) {
        $bankingData['balance'] = [
            'status' => $result['status'],
            'data' => decodeJwt($result['response']) ?: $result['response'],
            'error' => null
        ];
    } else {
        $bankingData['balance'] = [
            'status' => $result['status'],
            'data' => null,
            'error' => "HTTP {$result['status']}: {$result['error']}"
        ];
    }
    
    // 4. Fetch transactions
    $result = callOpenBankingAPI($baseUrl . $accountId . "/transactions", $baseHeaders, $certificate_path, $private_key_path);
    if ($result['status'] >= 200 && $result['status'] < 300) {
        $bankingData['transactions'] = [
            'status' => $result['status'],
            'data' => decodeJwt($result['response']) ?: $result['response'],
            'error' => null
        ];
    } else {
        $bankingData['transactions'] = [
            'status' => $result['status'],
            'data' => null,
            'error' => "HTTP {$result['status']}: {$result['error']}"
        ];
    }
    
    // Store in session
    $_SESSION['open_banking_data'] = $bankingData;
    
    // Prepare summary for frontend
    $summary = [
        'success' => true,
        'message' => 'Banking data fetched successfully',
        'summary' => [
            'accounts_count' => 0,
            'total_balance' => 'N/A',
            'transactions_count' => 0,
            'account_name' => 'N/A',
            'currency' => 'AED'
        ]
    ];
    
    // Extract summary data from responses
    // Parse multiaccounts response (structure: message->Data->Account[])
    if ($bankingData['multiaccounts']['data']) {
        $accountsData = $bankingData['multiaccounts']['data'];
        if (isset($accountsData['message']['Data']['Account']) && is_array($accountsData['message']['Data']['Account'])) {
            $summary['summary']['accounts_count'] = count($accountsData['message']['Data']['Account']);
        }
    }
    
    // Parse balance response - NOTE: This may have errors if account ID is invalid
    if ($bankingData['balance']['data']) {
        $balanceData = $bankingData['balance']['data'];
        // Check for errors first
        if (isset($balanceData['Errors'])) {
            // Balance API returned error, try to get from account info instead
            $summary['summary']['total_balance'] = 'N/A';
        } elseif (isset($balanceData['message']['Data']['Balance'][0]['Amount']['Amount'])) {
            $summary['summary']['total_balance'] = number_format($balanceData['message']['Data']['Balance'][0]['Amount']['Amount'], 2);
            if (isset($balanceData['message']['Data']['Balance'][0]['Amount']['Currency'])) {
                $summary['summary']['currency'] = $balanceData['message']['Data']['Balance'][0]['Amount']['Currency'];
            }
        }
    }
    
    // Parse transactions response (structure: message->Data->Transaction[])
    if ($bankingData['transactions']['data']) {
        $transData = $bankingData['transactions']['data'];
        if (isset($transData['message']['Data']['Transaction']) && is_array($transData['message']['Data']['Transaction'])) {
            $summary['summary']['transactions_count'] = count($transData['message']['Data']['Transaction']);
        }
    }
    
    // Parse account info response (structure: message->Data->Account->AccountHolderName)
    if ($bankingData['accountinfo']['data']) {
        $accInfo = $bankingData['accountinfo']['data'];
        if (isset($accInfo['message']['Data']['Account']['AccountHolderName'])) {
            $summary['summary']['account_name'] = $accInfo['message']['Data']['Account']['AccountHolderName'];
        }
    }
    
    echo json_encode($summary);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
