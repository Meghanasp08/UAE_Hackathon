<?php

session_start();

$private_key_path = __DIR__ . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
$certificate_path = __DIR__ . "/certi2703/open_finance_crt.pem";
$privateSignKeyPath = __DIR__ . "/certi2703/client_signing_private_key.pem";

$clientId = "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2";

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

// Display request and response logs on the page
function displayLog($title, $data) {
    echo "<h3>$title</h3>";
    echo "<pre style='background: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 5px;'>";
    echo htmlspecialchars($data);
    echo "</pre>";
}

//1002: O3 Util: Prepare private key JWT

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/o3/v1.0/message-signature',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
));

// Add request headers and payload for the first call
$requestHeaders = [
    'content-type: application/json'
];

$requestPayload = json_encode([
    "header" => [
        "alg" => "PS256",
        "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
    ],
    "body" => [
        "aud" => "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
        "exp" => time() + 3600, // Set expiration time dynamically
        "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "sub" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "jti" => generateGuid(),
        "iat" => time()
    ],
    "signingKeyPEM" => getPrivateSignKeyPem($privateSignKeyPath)
]);

// Log the request headers and payload
error_log("Request Headers: " . json_encode($requestHeaders));
error_log("Request Payload: " . $requestPayload);

displayLog("Request Headers", json_encode($requestHeaders, JSON_PRETTY_PRINT));
displayLog("Request Payload", $requestPayload);

// Add the headers and payload to the cURL call
curl_setopt($curl, CURLOPT_HTTPHEADER, $requestHeaders);
curl_setopt($curl, CURLOPT_POSTFIELDS, $requestPayload);

$requestHeaders = json_encode(array(
    'content-type: application/json'
), JSON_PRETTY_PRINT);
$requestPayload = json_encode(array(
    "header" => [
        "alg" => "PS256",
        "kid" => "VK7K1bjMaGj08N2TNa3AHeVtbcS4DQ84_0pIf0XS8lg"
    ],
    "body" => [
        "aud" => "https://auth1.altareq1.sandbox.apihub.openfinance.ae",
        "exp" => 1746342504.936,
        "iss" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "sub" => "https://rp.sandbox.directory.openfinance.ae/openid_relying_party/338343a2-4a9b-482b-bf46-4437d869ddc2",
        "jti" => "165e6cd4-8cf9-43d1-a8fe-a51d427dc810",
        "iat" => 1746342194.936
    ],
    "signingKeyPEM" => "-----BEGIN PRIVATE KEY-----MIIEvQIBADAN...END PRIVATE KEY-----"
), JSON_PRETTY_PRINT);

error_log("Request to /o3/v1.0/message-signature:");
error_log("Headers: " . $requestHeaders);
error_log("Payload: " . $requestPayload);

displayLog("Request to /o3/v1.0/message-signature - Headers", $requestHeaders);
displayLog("Request to /o3/v1.0/message-signature - Payload", $requestPayload);

$private_key_jwt = curl_exec($curl);
$response = $private_key_jwt; // Assuming this is the response from the cURL call
error_log("Response: " . $response);
displayLog("Response from /o3/v1.0/message-signature", $response);

// Decode the JWT response if applicable
if (isset($response) && !empty($response)) {
    $decodedResponse = decodeJwt($response);
    if ($decodedResponse) {
        displayLog("Decoded JWT Response", json_encode($decodedResponse, JSON_PRETTY_PRINT));
    } else {
        displayLog("Decoded JWT Response", "Unable to decode JWT.");
    }
}

curl_close($curl);
echo "<br>";
echo $private_key_jwt;   
echo "<br>";

// Retrieve data from session and format it properly
$code = $_SESSION['code'] ?? '';
$redirectUri = $_SESSION['redirect_uri'] ?? '';
$clientAssertion =  $_SESSION['clientAssertionJwt'] ?? '';
$codeVerifier = $_SESSION['code_verifier'] ?? '';

// Log the retrieved session data for debugging
error_log("Session Data:");
error_log("Code: " . $code);
error_log("Redirect URI: " . $redirectUri);
error_log("Client Assertion: " . $clientAssertion);
error_log("Code Verifier: " . $codeVerifier);

// Format the data for use in the token request
$tokenRequestData = [
    'grant_type' => 'client_credentials',
    'scope' => 'openid payments',
    'code' => $code,
    'redirect_uri' => $redirectUri,
    'code_verifier' => $codeVerifier,
    'client_assertion_type' => 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    'client_assertion' => $clientAssertion
];

// Log the formatted token request data
error_log("Formatted Token Request Data:");
error_log(json_encode($tokenRequestData, JSON_PRETTY_PRINT));

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://as1.altareq1.sandbox.apihub.openfinance.ae/token',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSLCERT => $certificate_path,
    CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_POSTFIELDS => http_build_query($tokenRequestData),
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/x-www-form-urlencoded'
  ),
));

$tokenRequestPayload = http_build_query($tokenRequestData);
error_log("Request to /token endpoint:");
error_log("Headers: Content-Type: application/x-www-form-urlencoded");
error_log("Payload: " . $tokenRequestPayload);

displayLog("Request to /token endpoint - Headers", "Content-Type: application/x-www-form-urlencoded");
displayLog("Request to /token endpoint - Payload", $tokenRequestPayload);

$response = curl_exec($curl);
$tokenResponse = json_decode($response, true);
$accessToken = $tokenResponse['access_token'];
$idToken = $tokenResponse['id_token'];
$refreshToken = $tokenResponse['refresh_token'];

error_log("Response: " . $response);
displayLog("Response from /token endpoint", $response);

// Decode the JWT response if applicable
if (isset($response) && !empty($response)) {
    $decodedResponse = decodeJwt($response);
    if ($decodedResponse) {
        displayLog("Decoded JWT Response", json_encode($decodedResponse, JSON_PRETTY_PRINT));
    } else {
        displayLog("Decoded JWT Response", "Unable to decode JWT.");
    }
}

curl_close($curl);
echo $response;


 // Get the client IP address dynamically
 $clientIpAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
// Use PaymentId from the session in the status call
if (isset($_SESSION['paymentId'])) {
    $paymentId = $_SESSION['paymentId'];
    $url = "https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/payment/v1.2/payments/" . $paymentId;
    curl_setopt($curl, CURLOPT_URL, $url);
    error_log("Using PaymentId from session: " . $paymentId);
    echo "Using PaymentId from session: " . $paymentId;
    echo "Using PaymentId from session: " . $url;
} else {
    echo '<div class="alert alert-danger">PaymentId not found in session.</div>';
    $paymentId = '430704fd421c49639e55a2e42573d0b9';
    $url = "https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/payment/v1.2/payments/" . $paymentId;
    curl_setopt($curl, CURLOPT_URL, $url);
    echo "Using PaymentId from session: " . $paymentId;
    echo "Using PaymentId from session: " . $url;
 //   exit;
}

$curl = curl_init();

curl_setopt_array($curl, array(
//  CURLOPT_URL => 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/payment/v1.2/payments/d5e451ab98644eea8fc696edc86c1683',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_SSLCERT => $certificate_path,
  CURLOPT_SSLKEY => $private_key_path,
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/jwt',
    'x-fapi-financial-id: CHANGEME0000000000',
    'x-fapi-customer-ip-address: '. $clientIpAddress,
    'x-fapi-interaction-id: 7513ef11-ef9c-4a8e-9cfc-8e1badabfedb',
    'Authorization: Bearer '. $accessToken,
  ),
));

$paymentStatusHeaders = json_encode(array(
    'Content-Type: application/jwt',
    'x-fapi-financial-id: CHANGEME0000000000',
    'x-fapi-customer-ip-address: ' . $clientIpAddress,
    'x-fapi-interaction-id: 7513ef11-ef9c-4a8e-9cfc-8e1badabfedb',
    'Authorization: Bearer ' . $accessToken
), JSON_PRETTY_PRINT);

error_log("Request to /open-finance/payment/v1.2/payments/{paymentId}:");
error_log("Headers: " . $paymentStatusHeaders);

$response = curl_exec($curl);

error_log("Response: " . $response);

displayLog("Request to /open-finance/payment/v1.2/payments/{paymentId} - Headers", $paymentStatusHeaders);
displayLog("Response from /open-finance/payment/v1.2/payments/{paymentId}", $response);

// Decode the JWT response if applicable
if (isset($response) && !empty($response)) {
    $decodedResponse = decodeJwt($response);
    if ($decodedResponse) {
        displayLog("Decoded JWT Response", json_encode($decodedResponse, JSON_PRETTY_PRINT));
    } else {
        displayLog("Decoded JWT Response", "Unable to decode JWT.");
    }
}

curl_close($curl);
echo $response;





