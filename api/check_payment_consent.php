<?php
session_start();

/**
 * Check Payment Consent API
 * 
 * Returns whether the user has an active payment consent
 * Supports different consent types: autosweep, payment (termloan)
 */

header('Content-Type: application/json');

// Get consent type from query parameter (default to 'payment' for backward compatibility)
$consentType = $_GET['type'] ?? 'payment';

// Check consent based on type
if ($consentType === 'autosweep') {
    // Check auto-sweep specific consent
    $hasConsent = isset($_SESSION['autosweep_consent_id']) && 
                  isset($_SESSION['autosweep_access_token']) && 
                  isset($_SESSION['autosweep_token_expiry']) &&
                  $_SESSION['autosweep_token_expiry'] > time();
    
    error_log("Auto-sweep consent check: " . ($hasConsent ? "YES" : "NO"));
    
    if ($hasConsent) {
        error_log("Auto-sweep consent ID: " . $_SESSION['autosweep_consent_id']);
        error_log("Token expiry: " . date('Y-m-d H:i:s', $_SESSION['autosweep_token_expiry']));
    }
    
    echo json_encode([
        'success' => true,
        'hasConsent' => $hasConsent,
        'consentType' => 'autosweep',
        'consentId' => $hasConsent ? $_SESSION['autosweep_consent_id'] : null,
        'expiresAt' => $hasConsent ? $_SESSION['autosweep_token_expiry'] : null
    ]);
} else {
    // Check payment/term loan consent
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
        'consentType' => 'payment',
        'consentId' => $hasConsent ? $_SESSION['payment_consent_id'] : null,
        'expiresAt' => $hasConsent ? $_SESSION['payment_token_expiry'] : null
    ]);
}
