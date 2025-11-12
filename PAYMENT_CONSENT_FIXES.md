# Payment Consent Structure Fixes

## Issue
"Invalid structure or data in authenticator side" error when initiating payment consent.

## Root Causes
The payment consent structure didn't match the Open Finance UAE specification used in the working multipayment file.

## Key Fixes Applied

### 1. PII Creditor Structure (Step 1)
**Before:**
```php
"Initiation" => [
    "CreditorAgent" => [...],
    "Creditor" => [...],
    "CreditorAccount" => [...]
]
```

**After (Correct):**
```php
"Initiation" => [
    "Creditor" => [
        [
            "CreditorAgent" => [...],
            "Creditor" => [...],
            "CreditorAccount" => [...]
        ]
    ]
]
```
**Reason:** Open Finance UAE requires `Creditor` to be an array of objects, not separate sibling properties.

### 2. Request Object JWT Structure (Step 2)
**Before:**
```php
"body" => [
    "aud" => ["https://auth1..."], // Array
    "claims" => [...],
    "message" => [
        "Data" => [...]
    ]
]
```

**After (Correct):**
```php
"body" => [
    "aud" => "https://auth1...", // String
    "authorization_details" => [
        [
            "type" => "urn:openfinanceuae:service-initiation-consent:v1.2",
            "consent" => [...],
            "subscription" => [...]
        ]
    ]
]
```

**Reasons:**
- `aud` must be a **string**, not array
- Use `authorization_details` (OAuth 2.0 Rich Authorization Requests), not `message`
- Removed `claims` - not needed with authorization_details
- Added proper `type` field for Open Finance UAE consent type
- Added `subscription` with webhook configuration

### 3. Multi-Payment Parameters (CRITICAL SCHEMA FIX)
**Before (Incorrect):**
```php
"MultiPayment" => [
    "MaximumCumulativeAmount" => [...],      // ❌ Not allowed
    "MaximumIndividualAmount" => [...],      // ❌ Not allowed
    "PeriodicLimits" => [...],               // ❌ Not allowed
    "ValidFromDateTime" => "...",            // ❌ Not allowed
    "ValidToDateTime" => "..."               // ❌ Not allowed
]
```

**After (Correct per Open Finance UAE Schema):**
```php
"MultiPayment" => [
    "MaximumCumulativeNumberOfPayments" => 365,
    "MaximumCumulativeValueOfPayments" => [  // ✅ Correct field name
        "Amount" => "100000.00",
        "Currency" => "AED"
    ],
    "PeriodicSchedule" => [                  // ✅ Required field
        "Type" => "FixedPeriodicSchedule",
        "PeriodType" => "Day",
        "PeriodStartDate" => "2025-11-13",  // YYYY-MM-DD format
        "Amount" => [
            "Amount" => "5000.00",
            "Currency" => "AED"
        ]
    ]
]
```

**Schema Requirements:**
- ✅ `MaximumCumulativeNumberOfPayments` - Total number of payments allowed
- ✅ `MaximumCumulativeValueOfPayments` - NOT `MaximumCumulativeAmount`
- ✅ `PeriodicSchedule` - **REQUIRED** field with schedule details
- ❌ Remove: `MaximumIndividualAmount`, `PeriodicLimits`, `ValidFromDateTime`, `ValidToDateTime`

### 4. Debtor Reference Pattern (CRITICAL REGEX)
**Before (Invalid):**
```php
"DebtorReference" => "TPP=338343a2-4a9b-482b-bf46-4437d869ddc2,Merchant=SHUKRIA-AUTO-SWEEP-2024"
```
❌ Missing required BIC field
❌ Merchant format doesn't match pattern `[A-Z0-9]{3}-[A-Z]{4}-TL.+-[0-9]{4}`

**After (Valid):**
```php
"DebtorReference" => "TPP=338343a2-4a9b-482b-bf46-4437d869ddc2,Merchant=SHK-SHUK-TL001-2024,BIC=DEUTDEFFXXX"
```
✅ BIC format: `[A-Z0-9]{4}[A-Z0-9]{2}[A-Z0-9]{2}([A-Z0-9]{3})?`
✅ Merchant format: `XXX-XXXX-TLnnn-YYYY`

**Required Pattern:**
```regex
^TPP=[UUID],(Merchant=[A-Z0-9]{3}-[A-Z]{4}-TL.+-[0-9]{4}|),BIC=[A-Z0-9]{4}[A-Z0-9]{2}[A-Z0-9]{2}([A-Z0-9]{3}){0,1}($|,.+$)
```

### 5. Payment Purpose Code
**Changed:** `"CLPR"` → `"ACM"` (Account Management)

### 6. Date Format
**PeriodStartDate:** Use `YYYY-MM-DD` format (NOT ISO 8601 with time)
- ✅ `"2025-11-13"`
- ❌ `"2025-11-13T09:00:00.000Z"`

## Summary of Critical Fixes
After these changes, retry the auto-sweep toggle to initiate payment consent. The authenticator should now accept the properly structured request.

## Reference Files
- Working example: `v1/api/multipayment_fixed_period_subscriptoin.php`
- Token exchange: `v1/api/old_index_usedinpayment.php`
- Updated file: `v1/api/initiate_payment_consent.php`
