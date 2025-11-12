<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Response - Open Finance Demo</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .container { max-width: 900px; margin-top: 40px; }
        .jwt-box { word-break: break-all; font-size: 0.95em; }
        .back-link { margin-bottom: 1.5rem; display: inline-block; }
    </style>
</head>
<body>
<div class="container">
    <a href="accounts_callback.php" class="btn btn-link back-link">&larr; Back to Main Page</a>
    <h1 class="mb-4 text-primary">API Response</h1>
    <?php
    session_start();
    if (!isset($_SESSION['access_token'], $_SESSION['access_token_expiry']) ||
        !$_SESSION['access_token'] ||
        $_SESSION['access_token_expiry'] <= time()) {
        // No valid token, redirect to index.php to trigger re-auth
        header('Location: index.php');
        exit;
    }
    $accessToken = $_SESSION['access_token'];

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo '<div class="alert alert-danger">Only POST allowed.</div>';
        exit;
    }

    $endpoint = $_POST['endpoint'] ?? '';

    $baseHeaders = [
        "Content-Type: application/json",
        "Accept: application/jwt",
        "Authorization: Bearer $accessToken",
        "x-fapi-financial-id: CHANGEME0000000000",
        "x-fapi-interaction-id: " . uniqid()
    ];

    $accountId = '100004000000000000000002'; // Replace with dynamic account if needed
    $baseUrl = "https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/account-information/v1.2/accounts/";

    switch ($endpoint) {
        case 'multiaccounts':
            $url = $baseUrl;
            break;
        case 'accountinfo':
            $url = $baseUrl . $accountId;
            break;
        case 'balance':
            $url = $baseUrl . $accountId . "/balances";
            break;
        case 'transactions':
            $url = $baseUrl . $accountId . "/transactions";
            break;
        case 'beneficiaries':
            $url = $baseUrl . $accountId . "/beneficiaries";
            break;
        case 'directdebits':
            $url = $baseUrl . $accountId . "/direct-debits";
            break;
        case 'scheduledpayments':
            $url = $baseUrl . $accountId . "/scheduled-payments";
            break;
        case 'standingorders':
            $url = $baseUrl . $accountId . "/standing-orders";
            break;
        case 'products':
            $url = $baseUrl . $accountId . "/product";
            break;
        case 'parties':
            $url = 'https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/account-information/v1.2/' . "parties";
            break;
        case 'accountparties':
            $url = $baseUrl . $accountId . "/parties";
            break;
        default:
            echo '<div class="alert alert-danger">❌ Unknown endpoint.</div>';
            exit;
    }

    $private_key_path = __DIR__ . "/certi2703/0b18eb32-778d-4df0-ab79-c09fb2e2e24e-opf_uae_client_transport.key";
    $certificate_path = __DIR__ . "/certi2703/open_finance_crt.pem";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $baseHeaders);
    curl_setopt($ch, CURLOPT_SSLCERT, $certificate_path);
    curl_setopt($ch, CURLOPT_SSLKEY, $private_key_path);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    // curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

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

    function generateCodeVerifier() {
        // Generate two UUIDs and concatenate them to form the code_verifier
        $uuid1 = generateUuid();
        $uuid2 = generateUuid();
        return $uuid1 . $uuid2;
    }

    function generateCodeChallenge($codeVerifier) {
        // Hash the code_verifier using SHA-256
        $hashed = hash('sha256', $codeVerifier, true);

        // Convert the hash to a Base64-URL encoded string
        $base64Url = rtrim(strtr(base64_encode($hashed), '+/', '-_'), '=');

        return $base64Url;
    }

    function generateUuid() {
        // Generate a random UUID (v4)
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    echo '<div class="card mb-3">';
    echo '<div class="card-header bg-light">🔗 <strong>Endpoint:</strong> ' . htmlspecialchars($url) . '</div>';
    echo '<div class="card-body">';
    echo '<p><strong>HTTP Status:</strong> <span class="badge bg-'.($httpCode>=200&&$httpCode<300?'success':'danger').'">' . $httpCode . '</span></p>';
    $decoded = decodeJwt($response);
    if ($decoded) {
        echo '<h6>Decoded JWT Response:</h6>';
        echo '<pre class="bg-light p-3 rounded">' . htmlspecialchars(print_r($decoded, true)) . '</pre>';
    } else {
        echo '<h6>Raw Response:</h6>';
        echo '<pre class="bg-light p-3 rounded">' . htmlspecialchars($response) . '</pre>';
    }
    echo '</div></div>';
    ?>
</div>
</body>
</html>


