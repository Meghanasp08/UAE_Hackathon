# OAuth Redirect Flow Implementation

## 🔄 Complete Flow (No Popup Window)

This document describes the inline OAuth flow where the user stays in the same browser tab throughout the entire process.

---

## 📋 Flow Diagram

```
User fills application form (Step 1)
         ↓
Clicks "Next: Connect Account"
         ↓
Application data stored in sessionStorage
         ↓
Redirect to callOpenFinanceClient.php
         ↓
Creates PAR (Pushed Authorization Request)
         ↓
Redirect to Bank Authorization Server
         ↓
User selects bank & authenticates
         ↓
Bank redirects to accounts_callback.php with auth code
         ↓
Exchange auth code for access token
         ↓
Store tokens in session & localStorage
         ↓
Redirect back to apply.html with success flag
         ↓
JavaScript detects OAuth return
         ↓
Restore application data from sessionStorage
         ↓
Show success modal
         ↓
User proceeds to Step 3 (Credit Assessment)
```

---

## 🔧 Technical Implementation

### **1. Starting OAuth Flow** (`apply.js`)

When user clicks "Next: Connect Account":

```javascript
// Store application state
const applicationData = {
  fullName: '...',
  emiratesID: '...',
  email: '...',
  phone: '...',
  monthlyIncome: '...',
  step: 1,
  timestamp: Date.now()
};
sessionStorage.setItem('applicationData', JSON.stringify(applicationData));
sessionStorage.setItem('applicationInProgress', 'true');
sessionStorage.setItem('returnToStep', '2');

// Redirect to OAuth initiation
window.location.href = 'https://testapp.ariticapp.com/mercurypay/callOpenFinanceClient.php';
```

**Why sessionStorage?**
- Survives page navigation (unlike regular variables)
- Cleared when tab is closed (security)
- Not sent to server (unlike cookies)

---

### **2. OAuth Initiation** (`callOpenFinanceClient.php`)

```php
// Create PAR request
$client = new AltareqOpenFinanceClient(...);
$requestUri = $client->createParRequest();

// Redirect to bank authorization
$authUrl = "https://auth1.altareq1.sandbox.apihub.openfinance.ae/auth?" .
           "client_id=$clientId&" .
           "response_type=code&" .
           "scope=accounts openid&" .
           "request_uri=$requestUri";

header("Location: $authUrl");
```

**Important Settings:**
- `redirect_uri`: `https://testapp.ariticapp.com/mercurypay/v1/accounts_callback.php`
- `response_type`: `code` (Authorization Code Flow)
- `scope`: `accounts openid`

---

### **3. User Bank Authentication**

User is now on bank's website:
1. Selects their bank
2. Logs in with credentials
3. Approves data sharing consent
4. Bank redirects back with authorization code

**Callback URL:**
```
https://testapp.ariticapp.com/mercurypay/v1/accounts_callback.php?code=AUTH_CODE_123...
```

---

### **4. Token Exchange** (`v1/accounts_callback.php`)

```php
// Receive authorization code
$code = $_GET['code'];

// Exchange for access token
$tokenResponse = getAccessTokenFromCode(
    $code,
    $redirectUri,
    $codeVerifier,
    $clientAssertion,
    $tokenEndpoint
);

// Store tokens in session
$_SESSION['access_token'] = $tokenResponse['access_token'];
$_SESSION['id_token'] = $tokenResponse['id_token'];
$_SESSION['refresh_token'] = $tokenResponse['refresh_token'];
$_SESSION['access_token_expiry'] = time() + $expiresIn - 60;

// Redirect back to apply page
$redirectUrl = 'apply.html?' . http_build_query([
    'oauth_success' => 'true',
    'access_token' => $accessToken,
    'expires_in' => $expiresIn,
    'bank_name' => 'Connected Bank',
    'timestamp' => time()
]);

header("Location: $redirectUrl");
```

**Token Storage:**
- **Server-side** (PHP session): Long-term storage, secure
- **Client-side** (URL params): Temporary, for JavaScript to capture
- **Client-side** (localStorage): Persistent, for API calls

---

### **5. Returning to Application** (`apply.js`)

```javascript
function checkOAuthReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const oauthSuccess = urlParams.get('oauth_success');
  
  if (oauthSuccess === 'true') {
    // 1. Restore application data
    const savedData = sessionStorage.getItem('applicationData');
    const data = JSON.parse(savedData);
    
    // Fill form fields
    document.getElementById('fullName').value = data.fullName;
    document.getElementById('emiratesID').value = data.emiratesID;
    // ... etc
    
    // 2. Store tokens from URL
    const accessToken = urlParams.get('access_token');
    const bankingTokens = {
      accessToken: accessToken,
      expiresIn: urlParams.get('expires_in'),
      bankName: urlParams.get('bank_name'),
      timestamp: Date.now()
    };
    localStorage.setItem('bankingTokens', JSON.stringify(bankingTokens));
    
    // 3. Clean URL (remove tokens from address bar)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 4. Mark consent as given
    document.getElementById('consentCheckbox').checked = true;
    
    // 5. Show success notification
    showTokenStorageNotification(bankingTokens);
    
    // 6. Clean up session storage
    sessionStorage.removeItem('applicationInProgress');
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkOAuthReturn);
```

---

### **6. Success Notification**

Beautiful modal appears with:
- 🎉 Celebration animation
- ✅ Success confirmation
- "Proceed to Credit Assessment" button

When user clicks "Proceed":
```javascript
// Move to Step 3
goToStep(3);

// Simulate bank connection
await simulateConnection(statusText);

// Run credit assessment
await simulateCreditAssessment();

// Show pre-approval result
// Credit Limit: AED 15,250
// APR: 8.9%
```

---

## 🔐 Security Features

### **1. PKCE (Proof Key for Code Exchange)**
```javascript
codeVerifier = generateRandomString(128);
codeChallenge = base64url(sha256(codeVerifier));
```

### **2. State Parameter**
Prevents CSRF attacks:
```javascript
state = generateUUID();
sessionStorage.setItem('oauth_state', state);
```

### **3. Client Assertion JWT**
Proves client identity:
```php
$clientAssertionBody = [
    "aud" => $aud,
    "iss" => $clientId,
    "sub" => $clientId,
    "jti" => generateUUID(),
    "exp" => time() + 3600
];
$jwt = signWithPrivateKey($clientAssertionBody);
```

### **4. mTLS (Mutual TLS)**
Uses client certificates:
```php
curl_setopt($ch, CURLOPT_SSLCERT, $certificate_path);
curl_setopt($ch, CURLOPT_SSLKEY, $private_key_path);
```

---

## 📁 File Structure

```
mercurypay/
├── callOpenFinanceClient.php          # OAuth initiation
├── AltareqOpenFinanceClient.php       # PAR creation & JWT signing
├── v1/
│   ├── apply.html                     # Application form
│   ├── accounts_callback.php          # OAuth callback handler (NEW)
│   └── js/
│       └── apply.js                   # Flow orchestration
└── certi2703/
    ├── opf_uae_client_transport.key   # Private key for mTLS
    └── open_finance_crt.pem           # Certificate for mTLS
```

---

## 🎯 Key Differences from Popup Flow

| Aspect | Popup Flow | Redirect Flow |
|--------|-----------|---------------|
| Window | Opens new window | Same window |
| State Management | postMessage | sessionStorage + URL params |
| User Experience | Can be confusing | Seamless, familiar |
| Popup Blockers | Can be blocked | No issues |
| Mobile Friendly | Poor | Excellent |
| Back Button | Doesn't work | Works naturally |

---

## 🧪 Testing Checklist

- [ ] User can fill form and click "Next"
- [ ] Application data persists through OAuth flow
- [ ] Bank selection page loads correctly
- [ ] After bank auth, returns to apply.html
- [ ] Form fields are restored with user's data
- [ ] Success modal appears
- [ ] Tokens are stored in localStorage
- [ ] Can proceed to Step 3
- [ ] Credit assessment runs successfully
- [ ] Error handling works (if OAuth fails)
- [ ] Back button doesn't break the flow
- [ ] Page refresh doesn't trigger OAuth again

---

## 🐛 Debugging Tips

### Check sessionStorage:
```javascript
console.log(sessionStorage.getItem('applicationData'));
console.log(sessionStorage.getItem('applicationInProgress'));
```

### Check localStorage:
```javascript
console.log(localStorage.getItem('bankingTokens'));
```

### Check PHP session:
```php
error_log(print_r($_SESSION, true));
```

### Check URL parameters:
```javascript
console.log(window.location.search);
console.log(new URLSearchParams(window.location.search).get('oauth_success'));
```

### Check network requests:
Open browser DevTools → Network tab → Look for:
- callOpenFinanceClient.php
- PAR endpoint
- Token endpoint
- accounts_callback.php

---

## 🚀 Deployment Checklist

1. **Update redirect URIs** in bank portal configuration:
   - Add: `https://testapp.ariticapp.com/mercurypay/v1/accounts_callback.php`
   - Whitelist in CORS if needed

2. **SSL Certificates**:
   - Ensure certificates are valid
   - Check certificate paths in code

3. **Session Configuration**:
   - Set appropriate session timeout
   - Configure session storage (Redis recommended)

4. **Error Logging**:
   - Enable error logs
   - Monitor for OAuth failures

5. **Testing**:
   - Test with multiple banks
   - Test error scenarios
   - Test on mobile devices

---

## 📞 Support

For issues:
1. Check browser console for JavaScript errors
2. Check server error logs for PHP errors
3. Verify OAuth configuration with bank
4. Test certificates are valid and accessible

---

**Last Updated:** November 11, 2025
