<?php
session_start();

$private_key_path = __DIR__ . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
$certificate_path = __DIR__ . "/certi2703/open_finance_crt.pem";
$privateSignKeyPath = __DIR__ . "/certi2703/client_signing_private_key.pem";

function getPrivateSignKeyPem($path) {
    if (!file_exists($path)) {
        error_log("Private key file not found: " . $path);
        return false; // Or handle error appropriately
    }
    return file_get_contents($path);
}

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

function makeCurlRequest($url, $payload, $headers, $private_key_path, $certificate_path) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET'); // Change POST to GET
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload); // Remove POST fields for GET requests
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

try {
    echo "<h1>Payment</h1>";

    // Step 1: O3 Util: Prepare encrypted PII
    echo "<h2>Step-1: O3 Util: Prepare encrypted PII</h2>";
    $now = time();
    $exp_pii = $now + 600;
    $guid_encrypt_pii = generateGuid();

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
                "CreditorAgent" => [
                    "SchemeName" => "BICFI",
                    "Identification" => "10000109010101",
		    "Name" => "Mario International",
		    "PostalAddress" =>
                        [
                            [
                            "AddressType" => "Business",
                            "Country" => "AE"
			    ]
                        ]
                ],
                "Creditor" => [
                    "Name" => "Mario International"
                ],
                "CreditorAccount" => [
                    "SchemeName" => "AccountNumber",
                    "Identification" => "10000109010101",
                    "Name" => ["en" => "Mario International"]
                ]
            ],
            "Risk" => [
                "DebtorIndicators" => [
                    "UserName" => ["en" => "xx"]
                ],
                "CreditorIndicators" => [
                    "AccountType" => "Retail",
                    "IsCreditorConfirmed" => true,
                    "IsCreditorPrePopulated" => true,
                    "TradingName" => "xxx"
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
    echo "<pre>";
    echo htmlspecialchars($encryptionPayload); 
    echo "</pre>"; 
    $encryptedPII = makeCurlRequest(
        'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-encryption',
        $encryptionPayload,
        $encryptionHeaders,
        $private_key_path,
        $certificate_path
    );

    // Log the request and response for debugging
    error_log("Request to /o3/v1.0/message-encryption:");
    error_log("Headers: " . json_encode($encryptionHeaders));
    error_log("Payload: " . $encryptionPayload);
    error_log("Response: " . $encryptedPII);

    echo $encryptedPII;

    // Step 2: O3 Util: Prepare request object
    echo "<h2>Step-2: O3 Util: Prepare request object</h2>";
    echo "consentid" . $_SESSION['consentId'] ;
    echo "</br>";
    $requestPayload = json_encode([
        "header" => [
            "alg" => "PS256",
            "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
        ],
        "body" => [
            "aud" => ["https://auth1.altareq1.sandbox.apihub.openfinance.ae"],
            "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
            "iat" => $now,
            "exp" => $now + 3600,
            "nbf" => 0,
            "message" => [
                "Data" => [
                    "ConsentId" => $_SESSION['consentId'] ,
                    "Instruction" => [
                        "Amount" => [
                            "Amount" => "400.00",
                            "Currency" => "AED"
                        ]
                    ],
                    "OpenFinanceBilling" => ["Type" => "Collection"],  //Allowed:   Collection, LargeValueCollection, PushP2P, PullP2P, Me2Me
                    "PersonalIdentifiableInformation" => $encryptedPII,
                    "PaymentPurposeCode" => "ACM",
                    "DebtorReference" => "TPP=a06154a7-fcb0-0472-be1c-21c8e5a74b6a,BIC=QW292P4TW8T",
                    "CreditorReference" => "TPP=a06154a7-fcb0-0472-be1c-21c8e5a74b6a,BIC=QW292P4TW8T"
                ]
            ]
        ],
        "signingKeyPEM" => getPrivateSignKeyPem($privateSignKeyPath),
    ]);

    $requestHeaders = [
        'Content-Type: application/json'
    ];

    $encrypted_response_jwks = makeCurlRequest(
        'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
        $requestPayload,
        $requestHeaders,
        $private_key_path,
        $certificate_path
    );

    // Log the request and response for debugging
    echo "Request to /o3/v1.0/message-signature:";
    error_log("Headers: " . json_encode($requestHeaders));
    error_log("Payload: " . $requestPayload);
    error_log("Response: " . $encrypted_response_jwks);

    echo $encrypted_response_jwks;

    // Get the client IP address dynamically
    $clientIpAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    // Generate a unique x-idempotency-key using UUID
    $idempotencyKey = generateGuid();

    // Step 3: Make payment request
    echo "<h2>Step-3: Make payment request</h2>";

    $curl = curl_init();

    curl_setopt_array($curl, array(
      CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/payment/v1.2/payments',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_SSLCERT => $certificate_path,
        CURLOPT_SSLKEY => $private_key_path,
       CURLOPT_SSL_VERIFYPEER => false,
      CURLOPT_POSTFIELDS => $encrypted_response_jwks,
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/jwt',
        'x-fapi-financial-id: CHANGEME0000000000',
        'x-fapi-customer-ip-address: ' . $clientIpAddress,
        'x-fapi-interaction-id: ce0a6916-e987-4004-a42f-c0ed19091037',
        'Authorization: Bearer '. $_SESSION['access_token'],
        'x-idempotency-key: ' . $idempotencyKey
      ),
    ));

    $response = curl_exec($curl);

     $error = curl_error($curl);
    curl_close($curl);

    if ($error) {
        throw new Exception("cURL Error: $error");
    }
     echo "Payment response".$response;

    //print $reponse by decoce JWT($response);
    $decodedResponse = decodeJwt($response);
    if ($decodedResponse) {
        echo "<h2>Decoded Response:</h2>";
        echo "<pre>";
        print_r($decodedResponse);
        echo "</pre>";
    } else {
        echo "<h2>Error Decoding JWT:</h2>";
        echo "<pre>";
        print_r($response);
        echo "</pre>";
    }

    // Parse PaymentId from the response and set it in the session
    $responseData = json_decode($response, true);
    if (isset($responseData['message']['Data']['PaymentId'])) {
        $_SESSION['paymentId'] = $responseData['message']['Data']['PaymentId'];
        error_log("PaymentId set in session: " . $_SESSION['paymentId']);
    }





} catch (Exception $e) {
    echo '<div class="alert alert-danger">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
}







?>

<form method="post" action="payment_status.php" class="api-btns mb-4">
            <button type="submit" class="btn btn-outline-danger" name="endpoint" value="payment">
                💳 Payment Status
            </button>
        </form>

