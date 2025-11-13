<?php
/**
 * Notification Send API
 * Sends push notifications to subscribed users
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

if (!$data || !isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: title, message']);
    exit;
}

$title = $data['title'];
$message = $data['message'];
$userId = $data['userId'] ?? 'all'; // 'all' for broadcast
$category = $data['category'] ?? 'general';
$priority = $data['priority'] ?? 'normal';
$actionUrl = $data['actionUrl'] ?? null;
$icon = $data['icon'] ?? null;

// Load subscriptions
$subscriptionsFile = __DIR__ . '/../data/push_subscriptions.json';
if (!file_exists($subscriptionsFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'No subscriptions found']);
    exit;
}

$subscriptions = json_decode(file_get_contents($subscriptionsFile), true);
if (empty($subscriptions)) {
    http_response_code(404);
    echo json_encode(['error' => 'No active subscriptions']);
    exit;
}

// Filter subscriptions by user and category preference
$targetSubscriptions = [];
foreach ($subscriptions as $sub) {
    // Check if targeting specific user or broadcasting
    if ($userId !== 'all' && $sub['userId'] !== $userId) {
        continue;
    }
    
    // Check category preference
    if (isset($sub['preferences'][$category]) && $sub['preferences'][$category] === false) {
        continue;
    }
    
    $targetSubscriptions[] = $sub;
}

if (empty($targetSubscriptions)) {
    echo json_encode([
        'success' => true,
        'message' => 'No matching subscriptions for this notification',
        'sent' => 0
    ]);
    exit;
}

// Prepare notification payload
$payload = [
    'title' => $title,
    'message' => $message,
    'body' => $message,
    'category' => $category,
    'priority' => $priority,
    'actionUrl' => $actionUrl,
    'icon' => $icon,
    'id' => uniqid('notif_'),
    'timestamp' => time()
];

// In production, use Web Push library to send actual push notifications
// For demo, we'll simulate sending and log the action
$sentCount = 0;
$failedCount = 0;

foreach ($targetSubscriptions as $subscription) {
    try {
        // Here you would use a library like minishlink/web-push to send actual notifications
        // For now, we'll just log it
        error_log("[Notification] Sending to user: {$subscription['userId']}");
        error_log("[Notification] Payload: " . json_encode($payload));
        
        // Simulate sending (in production, call actual Web Push API)
        // $webPush->sendNotification($subscription, json_encode($payload));
        
        $sentCount++;
    } catch (Exception $e) {
        error_log("[Notification] Failed to send: " . $e->getMessage());
        $failedCount++;
    }
}

// Save notification to history (for in-app notifications)
$notificationsFile = __DIR__ . '/../data/notification_history.json';
$history = [];
if (file_exists($notificationsFile)) {
    $history = json_decode(file_get_contents($notificationsFile), true) ?: [];
}

$notificationRecord = [
    'id' => $payload['id'],
    'title' => $title,
    'message' => $message,
    'category' => $category,
    'priority' => $priority,
    'actionUrl' => $actionUrl,
    'icon' => $icon,
    'userId' => $userId,
    'sentAt' => date('Y-m-d H:i:s'),
    'sentCount' => $sentCount,
    'failedCount' => $failedCount
];

$history[] = $notificationRecord;

// Keep only last 100 notifications
if (count($history) > 100) {
    $history = array_slice($history, -100);
}

file_put_contents($notificationsFile, json_encode($history, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Notification sent successfully',
    'sent' => $sentCount,
    'failed' => $failedCount,
    'notificationId' => $payload['id']
]);
