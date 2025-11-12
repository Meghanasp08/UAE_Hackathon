<?php
session_start();
header('Content-Type: application/json');

// Check if user is authenticated
if (!isset($_SESSION['access_token']) || !isset($_SESSION['open_banking_data'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Banking data not available. Please connect your account first.'
    ]);
    exit;
}

$bankingData = $_SESSION['open_banking_data'];
$applicationData = $_SESSION['application_data'] ?? [];

// Log the banking data for debugging
error_log('=== CREDIT SCORE CALCULATION DEBUG ===');
error_log('Banking Data Structure: ' . print_r($bankingData, true));
error_log('Application Data: ' . print_r($applicationData, true));

// Extract monthly income from application data
$monthlyIncome = floatval($applicationData['monthlyIncome'] ?? 0);
error_log('Monthly Income: ' . $monthlyIncome);

// Initialize scoring variables
$balanceScore = 0;
$transactionScore = 0;
$cashFlowScore = 0;
$incomeMultiplier = 1.0;

// 1. BALANCE SCORE (25-100 points)
// Based on total available balance across all accounts
$totalBalance = 0; // Initialize outside the if block for later use

if (isset($bankingData['balance']['status']) && $bankingData['balance']['status'] == 200) {
    $balanceData = $bankingData['balance']['data'];
    error_log('Balance Data Found: ' . print_r($balanceData, true));
    
    // Calculate total balance from all accounts
    if (isset($balanceData['message']['Data']['Balance'])) {
        $balances = $balanceData['message']['Data']['Balance'];
        error_log('Balances Array: ' . print_r($balances, true));
        
        if (!isset($balances[0])) {
            $balances = [$balances]; // Single balance
            error_log('Single balance converted to array');
        }
        
        foreach ($balances as $index => $balance) {
            error_log("Balance #$index: " . print_r($balance, true));
            if (isset($balance['Amount']['Amount'])) {
                $amount = floatval($balance['Amount']['Amount']);
                error_log("Adding balance amount: $amount");
                $totalBalance += $amount;
            } else {
                error_log("No Amount->Amount found in balance #$index");
            }
        }
    } else {
        error_log('No Balance data found in message->Data->Balance path');
        error_log('Available keys in balanceData: ' . print_r(array_keys($balanceData), true));
        if (isset($balanceData['message'])) {
            error_log('Available keys in message: ' . print_r(array_keys($balanceData['message']), true));
            if (isset($balanceData['message']['Data'])) {
                error_log('Available keys in Data: ' . print_r(array_keys($balanceData['message']['Data']), true));
            }
        }
    }
    
    error_log("Total Balance Calculated: $totalBalance");
    error_log("Total Balance Calculated: $totalBalance");
    
    // Score calculation based on balance thresholds
    if ($totalBalance >= 50000) {
        $balanceScore = 100;
    } elseif ($totalBalance >= 30000) {
        $balanceScore = 80;
    } elseif ($totalBalance >= 20000) {
        $balanceScore = 65;
    } elseif ($totalBalance >= 10000) {
        $balanceScore = 50;
    } elseif ($totalBalance >= 5000) {
        $balanceScore = 35;
    } else {
        $balanceScore = 25;
    }
    
    error_log("Balance Score Assigned: $balanceScore (for balance: $totalBalance)");
} else {
    error_log('Balance data not available or status not success');
    error_log('Balance status: ' . ($bankingData['balance']['status'] ?? 'NOT SET'));
}

// 2. TRANSACTION SCORE (5-20 points)
// Based on transaction count and diversity
if (isset($bankingData['transactions']['status']) && $bankingData['transactions']['status'] == 200) {
    $transactionData = $bankingData['transactions']['data'];
    error_log('Transaction Data Found');
    
    if (isset($transactionData['message']['Data']['Transaction'])) {
        $transactions = $transactionData['message']['Data']['Transaction'];
        $transactionCount = count($transactions);
        error_log("Transaction Count: $transactionCount");
        
        // Score based on transaction activity
        if ($transactionCount >= 100) {
            $transactionScore = 20;
        } elseif ($transactionCount >= 50) {
            $transactionScore = 15;
        } elseif ($transactionCount >= 20) {
            $transactionScore = 10;
        } else {
            $transactionScore = 5;
        }
        
        error_log("Transaction Score Assigned: $transactionScore");
    } else {
        error_log('No Transaction data found in message->Data->Transaction path');
    }
} else {
    error_log('Transaction data not available or status not success');
    error_log('Transaction status: ' . ($bankingData['transactions']['status'] ?? 'NOT SET'));
}

// 3. CASH FLOW SCORE (-5 to +15 points)
// Analyze income vs expenses from transactions
if (isset($bankingData['transactions']['status']) && $bankingData['transactions']['status'] == 200) {
    $transactionData = $bankingData['transactions']['data'];
    
    if (isset($transactionData['message']['Data']['Transaction'])) {
        $transactions = $transactionData['message']['Data']['Transaction'];
        $totalCredits = 0;
        $totalDebits = 0;
        
        foreach ($transactions as $txn) {
            $amount = floatval($txn['Amount']['Amount'] ?? 0);
            $creditDebit = $txn['CreditDebitIndicator'] ?? '';
            
            if ($creditDebit === 'Credit') {
                $totalCredits += $amount;
            } elseif ($creditDebit === 'Debit') {
                $totalDebits += $amount;
            }
        }
        
        $netCashFlow = $totalCredits - $totalDebits;
        error_log("Cash Flow Analysis: Credits=$totalCredits, Debits=$totalDebits, Net=$netCashFlow");
        
        // Score based on cash flow
        if ($netCashFlow > 20000) {
            $cashFlowScore = 15;
        } elseif ($netCashFlow > 10000) {
            $cashFlowScore = 10;
        } elseif ($netCashFlow > 0) {
            $cashFlowScore = 5;
        } elseif ($netCashFlow > -5000) {
            $cashFlowScore = 0;
        } else {
            $cashFlowScore = -5;
        }
        
        error_log("Cash Flow Score Assigned: $cashFlowScore");
    }
}

// 4. INCOME MULTIPLIER (1.0-2.5x)
// Based on declared monthly income
if ($monthlyIncome >= 50000) {
    $incomeMultiplier = 2.5;
} elseif ($monthlyIncome >= 30000) {
    $incomeMultiplier = 2.0;
} elseif ($monthlyIncome >= 20000) {
    $incomeMultiplier = 1.7;
} elseif ($monthlyIncome >= 15000) {
    $incomeMultiplier = 1.4;
} elseif ($monthlyIncome >= 10000) {
    $incomeMultiplier = 1.2;
} else {
    $incomeMultiplier = 1.0;
}

error_log("Income Multiplier: $incomeMultiplier (for income: $monthlyIncome)");

// 5. CALCULATE FINAL CREDIT SCORE
$rawScore = $balanceScore + $transactionScore + $cashFlowScore;
$finalScore = $rawScore * $incomeMultiplier;

error_log("=== SCORE CALCULATION ===");
error_log("Balance Score: $balanceScore");
error_log("Transaction Score: $transactionScore");
error_log("Cash Flow Score: $cashFlowScore");
error_log("Raw Score (sum): $rawScore");
error_log("Income Multiplier: $incomeMultiplier");
error_log("Final Score: $finalScore");
error_log("=========================");

// 6. DETERMINE CREDIT LIMIT
// Base credit limit calculation: 30% of monthly income + score-based bonus
$baseLimit = $monthlyIncome * 0.3;
$scoreBonusMultiplier = 1 + ($finalScore / 100); // e.g., score 150 = 2.5x multiplier
$creditLimit = round($baseLimit * $scoreBonusMultiplier / 100) * 100; // Round to nearest 100

// Minimum and maximum limits
$creditLimit = max(5000, min($creditLimit, 100000));

// 7. DETERMINE APR
// Better scores get lower APR
if ($finalScore >= 200) {
    $apr = 6.9;
} elseif ($finalScore >= 150) {
    $apr = 7.9;
} elseif ($finalScore >= 120) {
    $apr = 8.9;
} elseif ($finalScore >= 100) {
    $apr = 9.9;
} elseif ($finalScore >= 80) {
    $apr = 11.9;
} else {
    $apr = 13.9;
}

// 8. APPROVAL DECISION
$approved = true;
$reason = 'Strong financial profile with positive cash flow';

// Rejection criteria
if ($finalScore < 50) {
    $approved = false;
    $reason = 'Insufficient financial activity or low account balance';
} elseif ($cashFlowScore < -5) {
    $approved = false;
    $reason = 'Negative cash flow indicates potential repayment risk';
} elseif ($monthlyIncome < 5000) {
    $approved = false;
    $reason = 'Monthly income below minimum requirement (AED 5,000)';
}

// 9. SETUP FEE CALCULATION
// No setup fee for high scores, small fee for lower scores
$setupFee = 0;
if ($finalScore < 100 && $approved) {
    $setupFee = 250;
} elseif ($finalScore < 120 && $approved) {
    $setupFee = 100;
}

// Store credit assessment in session for later use
$_SESSION['credit_assessment'] = [
    'approved' => $approved,
    'creditLimit' => $creditLimit,
    'apr' => $apr,
    'setupFee' => $setupFee,
    'score' => round($finalScore, 2),
    'balanceScore' => $balanceScore,
    'transactionScore' => $transactionScore,
    'cashFlowScore' => $cashFlowScore,
    'incomeMultiplier' => $incomeMultiplier,
    'reason' => $reason,
    'timestamp' => time()
];

// Return response
echo json_encode([
    'success' => true,
    'approved' => $approved,
    'creditLimit' => $creditLimit,
    'apr' => $apr,
    'setupFee' => $setupFee,
    'score' => round($finalScore, 2),
    'reason' => $reason,
    'details' => [
        'balanceScore' => $balanceScore,
        'transactionScore' => $transactionScore,
        'cashFlowScore' => $cashFlowScore,
        'incomeMultiplier' => $incomeMultiplier,
        'monthlyIncome' => $monthlyIncome,
        'totalBalance' => $totalBalance,
        'rawScore' => $rawScore
    ]
]);
