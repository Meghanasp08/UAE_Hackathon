<?php
/**
 * Notification Subscribe API
 * Handles push notification subscription registration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['subscription']) || !isset($data['userId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$subscription = $data['subscription'];
$userId = $data['userId'];
$endpoint = $subscription['endpoint'] ?? null;
$keys = $subscription['keys'] ?? null;

if (!$endpoint || !$keys) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid subscription format']);
    exit;
}

// In production, store subscription in database
// For demo, store in JSON file
$subscriptionsFile = __DIR__ . '/../data/push_subscriptions.json';
$subscriptionsDir = dirname($subscriptionsFile);

// Create directory if not exists
if (!is_dir($subscriptionsDir)) {
    mkdir($subscriptionsDir, 0777, true);
}

// Load existing subscriptions
$subscriptions = [];
if (file_exists($subscriptionsFile)) {
    $subscriptions = json_decode(file_get_contents($subscriptionsFile), true) ?: [];
}

// Add or update subscription
$subscriptionData = [
    'userId' => $userId,
    'endpoint' => $endpoint,
    'keys' => $keys,
    'subscribedAt' => date('Y-m-d H:i:s'),
    'preferences' => [
        'financial' => true,
        'esg' => true,
        'smartpay' => true,
        'security' => true,
        'achievement' => true
    ]
];

// Check if subscription already exists
$found = false;
foreach ($subscriptions as $key => $sub) {
    if ($sub['userId'] === $userId && $sub['endpoint'] === $endpoint) {
        $subscriptions[$key] = $subscriptionData;
        $found = true;
        break;
    }
}

if (!$found) {
    $subscriptions[] = $subscriptionData;
}

// Save subscriptions
file_put_contents($subscriptionsFile, json_encode($subscriptions, JSON_PRETTY_PRINT));

// Log subscription
error_log("[Notification] User $userId subscribed to push notifications");

echo json_encode([
    'success' => true,
    'message' => 'Subscription registered successfully',
    'userId' => $userId,
    'subscribedAt' => $subscriptionData['subscribedAt']
]);
