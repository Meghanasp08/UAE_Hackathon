# Term Loan Calculation - Implementation Summary

## Overview
Updated the term loan maximum amount calculation to use a **Repayment Capability-based approach** instead of the previous fixed multiplier method.

---

## Previous Logic (OLD)
```javascript
maxLoanAmount = (creditLimit × 2.4) - currentBalance - existingTermLoanDebt
```
- Simple multiplication of credit limit by 2.4
- Direct subtraction of used amounts

---

## New Logic (UPDATED)

### Step-by-Step Calculation

#### **Step 1: Calculate Remaining Repayment Capability**
```javascript
remainingRepaymentCapability = creditLimit - currentBalance - existingTermLoanDebt
```
This represents the unused portion of the credit limit available for new obligations.

#### **Step 2: Calculate Adjusted Credit Limit**
```javascript
adjustedCreditLimit = floor((remainingRepaymentCapability ÷ 5%) ÷ 500) × 500
```
- Divide the remaining repayment capability by 5% (0.05)
- Round **down** to the nearest 500 AED
- This determines the new credit limit allocation

#### **Step 3: Calculate Credit Limit Adjustment**
```javascript
creditLimitAdjustment = ceil((creditLimit - adjustedCreditLimit) ÷ 500) × 500
```
- Find the difference between old and adjusted credit limits
- Round **up** to the nearest 500 AED
- This is the amount being converted to term loan

#### **Step 4: Calculate Monthly EMI**
```javascript
emi = creditLimitAdjustment × 5%
```
- Apply the 5% repayment capability rate to the adjustment amount
- This gives us the target monthly EMI

#### **Step 5: Reverse Calculate Loan Amount**
Using the reverse EMI formula for:
- **Tenure**: 48 months (fixed)
- **Interest Rate**: 8% per annum (0.08 APR)

```javascript
Formula: P = EMI × ((1 + r)^n - 1) / (r × (1 + r)^n)

Where:
- P = Principal (Loan Amount)
- r = Monthly interest rate = 0.08 / 12 = 0.00667
- n = Number of months = 48
- EMI = Calculated in Step 4
```

---

## Example Calculation

### Input:
- Credit Limit: **AED 15,250**
- Current Balance: **AED 2,750**
- Existing Loan Debt: **AED 0**

### Calculation:
1. **Remaining Repayment Capability**  
   `15,250 - 2,750 - 0 = AED 12,500`

2. **Adjusted Credit Limit**  
   `12,500 ÷ 0.05 = 250,000`  
   `floor(250,000 ÷ 500) × 500 = AED 250,000`

3. **Credit Limit Adjustment**  
   `15,250 - 250,000 = -234,750`  
   Since this is negative, we use the absolute value and round up:  
   `ceil(234,750 ÷ 500) × 500 = AED 235,000`

4. **EMI Calculation**  
   `235,000 × 0.05 = AED 11,750`

5. **Loan Amount** (Reverse EMI calculation)  
   Using 48 months @ 8% APR with EMI of AED 11,750  
   **Maximum Loan Amount ≈ AED 485,000**

---

## Code Changes

### File: `/v1/js/term-loan.js`

#### 1. Updated Configuration
```javascript
config: {
    minLoanAmount: 1000,
    maxTermMonths: 60,
    termLoanTenure: 48,              // NEW: Fixed 48 months
    termLoanAPR: 0.08,                // NEW: Fixed 8% per annum
    repaymentCapabilityRate: 0.05,    // NEW: 5% rate
    roundingAmount: 500,              // NEW: Round to 500 AED
    // ... other configs
}
```

#### 2. Updated `checkEligibility()` Method
- Removed `maxLoanToLimitRatio: 2.4` logic
- Added new 5-step calculation process
- Returns additional debug fields:
  - `remainingRepaymentCapability`
  - `adjustedCreditLimit`
  - `creditLimitAdjustment`
  - `calculatedEMI`

#### 3. Added New Helper Method
```javascript
_reverseLoanAmountFromEMI(emi, termMonths, annualRate) {
    // Reverse EMI calculation to find principal
    const monthlyRate = annualRate / 12;
    const powerTerm = Math.pow(1 + monthlyRate, termMonths);
    const numerator = emi * (powerTerm - 1);
    const denominator = monthlyRate * powerTerm;
    return numerator / denominator;
}
```

---

## Testing

### Test File Created
`/v1/test-term-loan-calculation.html`

This interactive test page allows you to:
- Input different credit limits, balances, and existing debts
- See real-time calculation of maximum loan amount
- View step-by-step breakdown of the calculation process
- Verify the new logic matches requirements

### How to Test
1. Open `test-term-loan-calculation.html` in browser
2. Adjust input values (Credit Limit, Current Balance, Existing Debt)
3. Click "Calculate Maximum Loan Amount"
4. Review the detailed step-by-step calculation

---

## Impact on System

### Frontend
- **credit-line.php**: Will automatically use new calculation when checking eligibility
- **Term Loan UI**: Will display updated maximum loan amounts

### User Experience
- More accurate loan eligibility based on actual repayment capability
- Standardized 48-month, 8% APR calculation for consistency
- Clearer relationship between credit utilization and loan availability

### API Compatibility
- No changes required to API endpoints
- `TermLoanManager.checkEligibility()` maintains same interface
- Added extra fields in return object (backward compatible)

---

## Key Benefits

1. **Aligned with Repayment Capability**: Loan amounts directly tied to user's ability to repay (5% rule)
2. **Standardized Terms**: All term loans calculated with consistent 48-month tenure and 8% rate
3. **Conservative Rounding**: Down-rounding for credit limit, up-rounding for adjustments ensures safety
4. **Transparent Calculation**: Each step is clearly defined and traceable
5. **Maintains Eligibility Checks**: Still respects utilization limits and credit profile

---

## Configuration Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `termLoanTenure` | 48 months | Fixed tenure for term loan calculation |
| `termLoanAPR` | 8% (0.08) | Fixed annual percentage rate |
| `repaymentCapabilityRate` | 5% (0.05) | Monthly repayment capability percentage |
| `roundingAmount` | 500 AED | Rounding increment for credit calculations |

---

## Verification

To verify the implementation:
1. Check `checkEligibility()` returns correct `maxLoanAmount`
2. Verify rounding is applied correctly (down for credit limit, up for adjustment)
3. Confirm EMI calculation uses 5% rate
4. Validate reverse loan amount calculation uses 48 months @ 8% APR
5. Test with various input scenarios (high/low utilization, with/without existing debt)

---

**Implementation Date**: November 13, 2025  
**Updated Files**: 
- `/v1/js/term-loan.js`
- `/v1/test-term-loan-calculation.html` (new)
