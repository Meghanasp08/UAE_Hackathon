<?php
session_start();

/**
 * Check Payment Consent API
 * 
 * Returns whether the user has an active payment consent for auto-sweep functionality
 */

header('Content-Type: application/json');

// Check if payment consent exists in session
$hasConsent = isset($_SESSION['payment_consent_id']) && 
              isset($_SESSION['payment_access_token']) && 
              isset($_SESSION['payment_token_expiry']) &&
              $_SESSION['payment_token_expiry'] > time();

// Log for debugging
error_log("Payment consent check: " . ($hasConsent ? "YES" : "NO"));

if ($hasConsent) {
    error_log("Payment consent ID: " . $_SESSION['payment_consent_id']);
    error_log("Token expiry: " . date('Y-m-d H:i:s', $_SESSION['payment_token_expiry']));
}

echo json_encode([
    'success' => true,
    'hasConsent' => $hasConsent,
    'consentId' => $hasConsent ? $_SESSION['payment_consent_id'] : null,
    'expiresAt' => $hasConsent ? $_SESSION['payment_token_expiry'] : null
]);
