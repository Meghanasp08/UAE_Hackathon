# Auto-Sweep Payment Consent Implementation Guide

## Overview
This implementation enables automatic payment authorization for the credit line auto-sweep feature using Open Finance UAE multi-payment consent flow.

## Architecture Flow

```
User enables Auto-Sweep Toggle
         ↓
Check if Payment Consent exists (AJAX to check_payment_consent.php)
         ↓
    ┌────┴────┐
    NO       YES
    ↓         ↓
Redirect   Enable Auto-Sweep
to OAuth   Immediately
    ↓
initiate_payment_consent.php
    ↓
Generate encrypted PII + JWT
    ↓
Call PAR endpoint
    ↓
Redirect to Open Finance Authorization
    ↓
User authorizes payment
    ↓
Callback to index.php?code=xxx
    ↓
index.php detects consent_type=payment
    ↓
Exchange code for payment tokens
    ↓
Store in session:
- payment_access_token
- payment_consent_id
- payment_token_expiry
    ↓
Redirect to v1/credit-line.php?oauth_success=1&consent_type=payment
    ↓
Show success message + auto-enable toggle
```

## Files Created/Modified

### ✅ Created Files

1. **`v1/api/initiate_payment_consent.php`**
   - Initiates multi-payment consent flow
   - Generates encrypted PII with creditor details
   - Creates JWT for PAR endpoint
   - Sets session variables for callback routing
   - Redirects to Open Finance authorization

2. **`v1/api/check_payment_consent.php`**
   - REST API endpoint to check if payment consent exists
   - Returns JSON: `{hasConsent: true/false, consentId: "...", expiresAt: timestamp}`
   - Used by JavaScript to determine if OAuth flow is needed

### ✅ Modified Files

1. **`index.php`**
   - Added `$scope` parameter to `getAccessTokenFromCode()` function
   - Detects `consent_type` from session (accounts vs payment)
   - Routes token storage based on consent type:
     - Accounts → `access_token`, `id_token`, `refresh_token`
     - Payment → `payment_access_token`, `payment_id_token`, `payment_refresh_token`, `payment_consent_id`
   - Includes `consent_type` in redirect URL

2. **`v1/credit-line.php`**
   - Checks for OAuth success parameters
   - Shows success/error alerts for payment consent
   - Auto-enables toggle after successful consent
   - Auto-hides success alert after 8 seconds

3. **`v1/js/credit-line.js`**
   - Updated auto-sweep toggle to async function
   - Checks payment consent before enabling
   - Redirects to consent flow if needed
   - Added `checkPaymentConsent()` helper function

## Session Variables

### Account Consent (Existing)
```php
$_SESSION['access_token']         // Account access token
$_SESSION['id_token']             // Account ID token
$_SESSION['refresh_token']        // Account refresh token
$_SESSION['access_token_expiry']  // Expiry timestamp
```

### Payment Consent (New)
```php
$_SESSION['payment_access_token']    // Payment access token
$_SESSION['payment_id_token']        // Payment ID token
$_SESSION['payment_refresh_token']   // Payment refresh token
$_SESSION['payment_consent_id']      // Consent ID from PAR flow
$_SESSION['payment_token_expiry']    // Expiry timestamp
$_SESSION['consent_type']            // "payment" or "accounts" (routing flag)
$_SESSION['redirect_after_oauth']    // URL to redirect after OAuth
$_SESSION['code_verifier']           // PKCE code verifier
$_SESSION['consentId']               // Generated consent ID
$_SESSION['clientAssertionJwt']      // Client assertion JWT
```

## Payment Consent Details

### Multi-Payment Subscription Configuration
```json
{
  "Frequency": "EvryDay",
  "FirstPaymentDateTime": "tomorrow at 09:00",
  "FinalPaymentDateTime": "1 year from now",
  "NumberOfPayments": 365,
  "ControlParameters": {
    "VRPType": ["Sweeping"],
    "MaximumIndividualAmount": "5000.00 AED",
    "PeriodicLimits": [{
      "Amount": "50000.00 AED",
      "PeriodType": "Month"
    }]
  }
}
```

### Creditor Details
- **Name**: Shukria Financial Services
- **Account**: 10000109010101
- **Payment Purpose**: CLPR (Credit Line Payment Repayment)
- **Billing Type**: Collection

## Testing Flow

### Step 1: Enable Auto-Sweep (First Time)
1. Go to `v1/credit-line.php`
2. Toggle "Auto-Sweep" to ON
3. System checks for payment consent → NOT FOUND
4. Voice feedback: "To enable auto-sweep, we need your authorization..."
5. Redirects to `api/initiate_payment_consent.php`

### Step 2: OAuth Authorization
1. Encrypted PII generated
2. JWT signed with private key
3. PAR endpoint returns `request_uri`
4. Redirect to Open Finance authorization page
5. User authorizes multi-payment consent

### Step 3: Callback Processing
1. Returns to `index.php?code=XXXXX`
2. `index.php` detects `consent_type=payment` from session
3. Exchanges code for tokens with scope `payments openid`
4. Stores payment tokens separately
5. Redirects to `v1/credit-line.php?oauth_success=1&consent_type=payment`

### Step 4: Success Confirmation
1. Green success alert appears
2. Auto-sweep toggle auto-enables
3. Sweep settings panel opens
4. Alert auto-hides after 8 seconds

### Step 5: Enable Auto-Sweep (Subsequent Times)
1. Toggle "Auto-Sweep" to ON
2. System checks for payment consent → FOUND
3. Immediately enables auto-sweep (no redirect)
4. Sweep settings panel opens

## Error Handling

### Payment Consent Initiation Errors
- Missing certificate files → Logged + redirect to credit-line.php with error
- PAR endpoint failure → Exception caught + redirect with error message
- Encryption service failure → Exception caught + redirect with error

### OAuth Callback Errors
- Token exchange failure → Redirect to credit-line.php with `oauth_error` parameter
- Missing code verifier → Token exchange fails
- Expired consent → Re-initiate flow

### Session Checks
- Payment consent expiry checked on every toggle
- Expired tokens require re-authorization
- Session variables cleared after processing

## Security Features

1. **PKCE Flow**: Code verifier/challenge for secure authorization
2. **Mutual TLS**: Client certificate authentication
3. **JWT Signing**: All requests signed with private key
4. **Encrypted PII**: Sensitive data encrypted before transmission
5. **Session-based State**: Prevents CSRF attacks
6. **Token Expiry**: Automatic expiration handling

## Integration with Existing System

### Reuses Existing Infrastructure
- ✅ Same certificate files from `certi2703/`
- ✅ Same OAuth callback URL: `index.php`
- ✅ Same session-based routing pattern
- ✅ Same Open Finance endpoints

### Separates Consent Types
- ✅ Account consent ≠ Payment consent
- ✅ Different tokens stored separately
- ✅ Different scopes: `accounts` vs `payments openid`
- ✅ Both can coexist in same session

## Next Steps for Production

1. **Token Refresh**: Implement refresh token flow for expired payment tokens
2. **Database Storage**: Persist payment consent to database (not just session)
3. **Webhook Handling**: Listen for payment status updates
4. **Actual Payment Execution**: Use `payment_call.php` logic to execute sweeps
5. **Error Recovery**: Better handling of partial failures
6. **User Notifications**: Email/SMS confirmation of consent
7. **Revocation Flow**: Allow users to revoke payment consent
8. **Audit Logging**: Track all payment consent events

## Debugging

### Check Payment Consent Status
```javascript
fetch('api/check_payment_consent.php')
  .then(r => r.json())
  .then(console.log);
```

### View Session Data (PHP)
```php
var_dump($_SESSION['payment_consent_id']);
var_dump($_SESSION['payment_access_token']);
var_dump($_SESSION['payment_token_expiry']);
```

### Check Logs
```bash
tail -f /var/log/apache2/error.log | grep "Payment consent"
```

## Support

For issues or questions:
1. Check error logs in Apache/PHP error log
2. Verify certificate files exist in `certi2703/`
3. Ensure session is started before accessing session variables
4. Test OAuth flow manually using browser dev tools
5. Verify Open Finance sandbox endpoints are accessible

---

**Implementation Date**: November 12, 2025  
**Status**: ✅ Complete and Ready for Testing
