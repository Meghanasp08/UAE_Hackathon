<?php
session_start();

/**
 * Auto-Sweep Payment Consent Initiation Script
 * 
 * This script initiates a multi-payment consent flow for auto-sweep functionality
 * using the VariableOnDemand payment schedule variant.
 * 
 * Flow:
 * 1. Generate code verifier and challenge
 * 2. Prepare encrypted PII with creditor details
 * 3. Create JWT for PAR endpoint (multi-payment VariableOnDemand)
 * 4. Generate client assertion JWT
 * 5. Call PAR endpoint to get request_uri
 * 6. Redirect to authorization URL
 * 7. User authorizes, returns to index.php
 * 8. index.php detects autosweep consent type and processes accordingly
 */

// Helper functions
function generateCodeVerifier() {
    $uuid1 = generateGuid();
    $uuid2 = generateGuid();
    return $uuid1 . $uuid2;
}

function generateCodeChallenge($codeVerifier) {
    $hashed = hash('sha256', $codeVerifier, true);
    $base64Url = rtrim(strtr(base64_encode($hashed), '+/', '-_'), '=');
    return $base64Url;
}

function generateGuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function getPrivateSignKeyPem($path) {
    if (!file_exists($path)) {
        error_log("Private key file not found: " . $path);
        return false;
    }
    return file_get_contents($path);
}

function makeCurlRequest($url, $payload, $headers, $private_key_path, $certificate_path, $method = 'GET') {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    } elseif ($method === 'GET' && $payload) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSLCERT, $certificate_path);
    curl_setopt($ch, CURLOPT_SSLKEY, $private_key_path);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception("cURL Error: $error");
    }

    return $response;
}

// Certificate paths - matching index.php structure
$private_key_path = __DIR__ . "/../../certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
$certificate_path = __DIR__ . "/../../certi2703/open_finance_crt.pem";
$privateSignKeyPath = __DIR__ . "/../../certi2703/782e83a7-e129-4841-95c1-f89c2d4f9739-opf_uae_client_signing.key";

// Verify certificate files exist
if (!file_exists($private_key_path)) {
    throw new Exception("Transport key not found: " . $private_key_path);
}
if (!file_exists($certificate_path)) {
    throw new Exception("Certificate not found: " . $certificate_path);
}
if (!file_exists($privateSignKeyPath)) {
    error_log("Warning: Signing key not found, using transport key as fallback");
    $privateSignKeyPath = $private_key_path;
}

try {
    // Set consent type in session for index.php to detect
    $_SESSION['consent_type'] = 'autosweep';
    
    // Set redirect URL to return to credit-line.php after OAuth
    $_SESSION['redirect_after_oauth'] = 'https://mercurypay.ariticapp.com/mercurypay/v1/credit-line.php';
    
    // Generate code verifier and challenge
    $codeVerifier = generateCodeVerifier();
    $_SESSION['code_verifier'] = $codeVerifier;
    $codeChallenge = generateCodeChallenge($codeVerifier);
    
    // Generate unique consent ID
    $consentId = generateGuid();
    $_SESSION['consentId'] = $consentId;
    
    // Timestamps
    $now = time();
    $exp_pii = $now + 600;
    
    // Step 1: Prepare encrypted PII for creditor details
    error_log("Step 1: Preparing encrypted PII for auto-sweep consent");
    
    $encryptionPayload = json_encode([
        "header" => [
            "alg" => "PS256",
            "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
        ],
        "body" => [
            "aud" => "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
            "exp" => $exp_pii,
            "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "sub" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "jti" => generateGuid(),
            "iat" => $now,
            "Initiation" => [
                "Creditor" => [
                    [
                        "CreditorAgent" => [
                            "SchemeName" => "BICFI",
                            "Identification" => "10000109010101",
                            "Name" => "Shukria Financial Services",
                            "PostalAddress" => [
                                [
                                    "AddressType" => "Business",
                                    "Country" => "AE"
                                ]
                            ]
                        ],
                        "Creditor" => [
                            "Name" => "Shukria Financial Services"
                        ],
                        "CreditorAccount" => [
                            "SchemeName" => "AccountNumber",
                            "Identification" => "10000109010101",
                            "Name" => [
                                "en" => "Shukria Auto-Sweep"
                            ]
                        ]
                    ]
                ]
            ],
            "Risk" => [
                "DebtorIndicators" => [
                    "UserName" => ["en" => "Auto-Sweep User"]
                ],
                "CreditorIndicators" => [
                    "AccountType" => "Retail",
                    "IsCreditorConfirmed" => true,
                    "IsCreditorPrePopulated" => true,
                    "TradingName" => "Shukria"
                ]
            ]
        ],
        "signingKeyPEM" => getPrivateSignKeyPem($privateSignKeyPath),
        "jwksUrl" => "https://keystore.sandbox.directory.openfinance.ae/233bcd1d-4216-4b3c-a362-9e4a9282bba7/application.jwks"
    ]);

    $encryptionHeaders = [
        'Content-Type: application/json',
        'x-fapi-interaction-id: ' . generateGuid()
    ];

    $encryptedPII = makeCurlRequest(
        'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-encryption',
        $encryptionPayload,
        $encryptionHeaders,
        $private_key_path,
        $certificate_path,
        'GET'
    );

    error_log("Encrypted PII generated: " . substr($encryptedPII, 0, 50) . "...");

    // Step 2: Prepare request object JWT for PAR endpoint with VariableOnDemand schedule
    error_log("Step 2: Preparing request object JWT for PAR endpoint (VariableOnDemand)");
    
    // Calculate future dates for subscription
    $futureDate = date('Y-m-d', strtotime('+365 days')); // 1 year subscription
    $tomorrowsDate = date('Y-m-d', strtotime('+1 day'));
    
    $requestPayload = json_encode([
        "header" => [
            "alg" => "PS256",
            "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
        ],
        "body" => [
            "aud" => "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
            "exp" => $now + 600,
            "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "scope" => "payments openid",
            "redirect_uri" => "https://mercurypay.ariticapp.com/mercurypay",
            "client_id" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "nonce" => generateGuid(),
            "state" => generateGuid(),
            "nbf" => $now,
            "response_type" => "code",
            "code_challenge_method" => "S256",
            "code_challenge" => $codeChallenge,
            "max_age" => 3600,
            "authorization_details" => [
                [
                    "type" => "urn:openfinanceuae:service-initiation-consent:v1.2",
                    "consent" => [
                        "ConsentId" => $consentId,
                        "IsSingleAuthorization" => true,
                        "ExpirationDateTime" => $futureDate . "T00:00:00.000Z",
                        "ControlParameters" => [
                            "IsDelegatedAuthentication" => false,
                            "ConsentSchedule" => [
                                "MultiPayment" => [
                                    "MaximumCumulativeNumberOfPayments" => 2,
                                    "MaximumCumulativeValueOfPayments" => [
                                        "Amount" => "500.00",
                                        "Currency" => "AED"
                                    ],
                                    "PeriodicSchedule" => [
                                        "Type" => "VariableOnDemand",
                                        "PeriodType" => "Week",
                                        "PeriodStartDate" => $tomorrowsDate,
                                        "Controls" => [
                                            "MaximumIndividualAmount" => [
                                                "Amount" => "200.00",
                                                "Currency" => "AED"
                                            ],
                                            "MaximumCumulativeNumberOfPaymentsPerPeriod" => 2,
                                            "MaximumCumulativeValueOfPaymentsPerPeriod" => [
                                                "Amount" => "200.00",
                                                "Currency" => "AED"
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        "PersonalIdentifiableInformation" => $encryptedPII,
                        "DebtorReference" => "TPP=338343a2-4a9b-482b-bf46-4437d869ddc2,Merchant=SHK-SHUK-TL002-2024,BIC=DEUTDEFFXXX",
                        "PaymentPurposeCode" => "ACM",
                        "SponsoredTPPInformation" => [
                            "Name" => "string",
                            "Identification" => "string"
                        ]
                    ],
                    "subscription" => [
                        "Webhook" => [
                            "Url" => "http://localhost:4700/mock-event-receiver",
                            "IsActive" => false
                        ]
                    ]
                ]
            ]
        ],
        "signingKeyPEM" => getPrivateSignKeyPem($privateSignKeyPath)
    ]);

    $requestHeaders = [
        'Content-Type: application/json'
    ];

    $requestObjectJwt = makeCurlRequest(
        'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
        $requestPayload,
        $requestHeaders,
        $private_key_path,
        $certificate_path,
        'GET'
    );

    error_log("Request object JWT generated: " . substr($requestObjectJwt, 0, 50) . "...");

    // Step 3: Prepare client assertion JWT
    error_log("Step 3: Preparing client assertion JWT");
    
    $clientAssertionPayload = json_encode([
        "header" => [
            "alg" => "PS256",
            "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
        ],
        "body" => [
            "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "sub" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "aud" => "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
            "jti" => generateGuid(),
            "exp" => $now + 600,
            "nbf" => $now,
            "iat" => $now
        ],
        "signingKeyPEM" => getPrivateSignKeyPem($privateSignKeyPath)
    ]);

    $clientAssertionJwt = makeCurlRequest(
        'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
        $clientAssertionPayload,
        $requestHeaders,
        $private_key_path,
        $certificate_path,
        'GET'
    );

    $_SESSION['clientAssertionJwt'] = $clientAssertionJwt;
    error_log("Client assertion JWT generated and stored in session");

    // Step 4: Call PAR endpoint to get request_uri
    error_log("Step 4: Calling PAR endpoint");
    
    $parData = [
        'client_id' => 'https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2',
        'request' => $requestObjectJwt,
        'client_assertion_type' => 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        'client_assertion' => $clientAssertionJwt
    ];

    $parCurl = curl_init();
    curl_setopt_array($parCurl, [
        CURLOPT_URL => 'https://as1.altareq1.sandbox.apihub.openfinance.ae/par',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($parData),
        CURLOPT_SSLCERT => $certificate_path,
        CURLOPT_SSLKEY => $private_key_path,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
    ]);

    $parResponse = curl_exec($parCurl);
    
    if (curl_errno($parCurl)) {
        throw new Exception('PAR cURL error: ' . curl_error($parCurl));
    }
    
    curl_close($parCurl);

    $parResponseData = json_decode($parResponse, true);
    
    if (!isset($parResponseData['request_uri'])) {
        throw new Exception('PAR endpoint did not return request_uri. Response: ' . $parResponse);
    }

    $requestUri = $parResponseData['request_uri'];
    error_log("PAR request_uri obtained for auto-sweep: " . $requestUri);

    // Step 5: Build authorization URL and redirect
    $clientId = urlencode("https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2");
    $responseType = "code";
    $scope = urlencode("payments openid");
    
    $authUrl = "https://auth1.altareq1.sandbox.apihub.openfinance.ae/auth?client_id=$clientId&response_type=$responseType&scope=$scope&request_uri=$requestUri";

    error_log("Redirecting to authorization URL for auto-sweep consent");
    
    // Redirect to authorization
    header("Location: $authUrl");
    exit;

} catch (Exception $e) {
    error_log("Auto-sweep consent initiation error: " . $e->getMessage());
    
    // Redirect back to credit-line.php with error
    $_SESSION['autosweep_consent_error'] = $e->getMessage();
    header('Location: ../credit-line.php?error=autosweep_consent_failed');
    exit;
}
