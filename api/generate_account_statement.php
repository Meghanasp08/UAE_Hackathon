<?php
/**
 * Generate Account Statement
 * 
 * Creates formatted account statements in multiple formats:
 * - HTML (for online viewing and printing)
 * - PDF (downloadable)
 * - CSV (for Excel/spreadsheet import)
 * 
 * Called via AJAX from accounts.js
 */

session_start();

// Set appropriate headers based on format
$format = $_GET['format'] ?? 'html';
$dateRange = intval($_GET['range'] ?? 30);
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;

// Check if banking data exists in session
if (!isset($_SESSION['banking_data']) || !isset($_SESSION['access_token'])) {
    if ($format === 'json') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'No banking data available. Please fetch account data first.'
        ]);
    } else {
        echo "Error: No banking data available.";
    }
    exit;
}

$bankingData = $_SESSION['banking_data'];
$accountId = $bankingData['account_id'] ?? 'Unknown';

/**
 * Extract and process data from banking API responses
 */
function extractStatementData($bankingData, $dateRange, $startDate = null, $endDate = null) {
    $statementData = [
        'account_id' => $bankingData['account_id'] ?? 'Unknown',
        'account_holder' => '',
        'account_type' => '',
        'currency' => 'AED',
        'opening_balance' => 0,
        'closing_balance' => 0,
        'total_credits' => 0,
        'total_debits' => 0,
        'transaction_count' => 0,
        'transactions' => [],
        'standing_orders' => [],
        'direct_debits' => [],
        'scheduled_payments' => [],
        'statement_period' => '',
        'generated_at' => date('Y-m-d H:i:s')
    ];
    
    // Calculate date range
    if ($startDate && $endDate) {
        $statementData['statement_period'] = date('M d, Y', strtotime($startDate)) . ' - ' . date('M d, Y', strtotime($endDate));
        $filterStartDate = strtotime($startDate);
        $filterEndDate = strtotime($endDate);
    } else {
        $filterEndDate = time();
        $filterStartDate = strtotime("-{$dateRange} days");
        $statementData['statement_period'] = date('M d, Y', $filterStartDate) . ' - ' . date('M d, Y', $filterEndDate);
    }
    
    // Extract account info (including holder name and account type)
    if (isset($bankingData['apis']['accountinfo']['success']) && $bankingData['apis']['accountinfo']['success']) {
        $accountInfo = $bankingData['apis']['accountinfo']['data'];
        if (isset($accountInfo['message']['Data']['Account'])) {
            $account = $accountInfo['message']['Data']['Account'];
            // Extract account holder name
            $statementData['account_holder'] = $account['AccountHolderName'] ?? ($account['AccountHolderShortName'] ?? '');
            // Extract account type
            $statementData['account_type'] = $account['AccountType'] ?? 'Current';
            // Extract currency
            if (isset($account['Currency'])) {
                $statementData['currency'] = $account['Currency'];
            }
        }
    }
    
    // Extract balance
    if (isset($bankingData['apis']['balance']['success']) && $bankingData['apis']['balance']['success']) {
        $balanceData = $bankingData['apis']['balance']['data'];
        if (isset($balanceData['message']['Data']['Balance'])) {
            $balances = $balanceData['message']['Data']['Balance'];
            if (!isset($balances[0])) {
                $balances = [$balances];
            }
            foreach ($balances as $balance) {
                if ($balance['Type'] === 'ClosingAvailable' || $balance['Type'] === 'InterimAvailable') {
                    $statementData['closing_balance'] = floatval($balance['Amount']['Amount']);
                    break;
                }
            }
        }
    }
    
    // Extract and filter transactions
    if (isset($bankingData['apis']['transactions']['success']) && $bankingData['apis']['transactions']['success']) {
        $transactionData = $bankingData['apis']['transactions']['data'];
        if (isset($transactionData['message']['Data']['Transaction'])) {
            $allTransactions = $transactionData['message']['Data']['Transaction'];
            
            foreach ($allTransactions as $txn) {
                $txnDate = strtotime($txn['BookingDateTime'] ?? $txn['ValueDateTime'] ?? '');
                
                // Filter by date range
                if ($txnDate >= $filterStartDate && $txnDate <= $filterEndDate) {
                    $amount = floatval($txn['Amount']['Amount'] ?? 0);
                    $creditDebit = $txn['CreditDebitIndicator'] ?? 'Debit';
                    
                    $transaction = [
                        'date' => date('Y-m-d', $txnDate),
                        'display_date' => date('M d, Y', $txnDate),
                        'description' => $txn['TransactionInformation'] ?? 'Transaction',
                        'reference' => $txn['TransactionReference'] ?? '',
                        'amount' => $amount,
                        'type' => $creditDebit,
                        'debit' => ($creditDebit === 'Debit') ? $amount : 0,
                        'credit' => ($creditDebit === 'Credit') ? $amount : 0,
                        'balance' => 0 // Will be calculated later
                    ];
                    
                    $statementData['transactions'][] = $transaction;
                    
                    if ($creditDebit === 'Credit') {
                        $statementData['total_credits'] += $amount;
                    } else {
                        $statementData['total_debits'] += $amount;
                    }
                }
            }
            
            // Sort transactions by date (oldest first)
            usort($statementData['transactions'], function($a, $b) {
                return strcmp($a['date'], $b['date']);
            });
            
            // Calculate running balance
            $runningBalance = $statementData['closing_balance'] - $statementData['total_credits'] + $statementData['total_debits'];
            $statementData['opening_balance'] = $runningBalance;
            
            foreach ($statementData['transactions'] as &$txn) {
                if ($txn['type'] === 'Credit') {
                    $runningBalance += $txn['amount'];
                } else {
                    $runningBalance -= $txn['amount'];
                }
                $txn['balance'] = $runningBalance;
            }
            
            $statementData['transaction_count'] = count($statementData['transactions']);
        }
    }
    
    // Extract standing orders
    if (isset($bankingData['apis']['standing_orders']['success']) && $bankingData['apis']['standing_orders']['success']) {
        $soData = $bankingData['apis']['standing_orders']['data'];
        if (isset($soData['message']['Data']['StandingOrder'])) {
            $standingOrders = $soData['message']['Data']['StandingOrder'];
            if (!isset($standingOrders[0])) {
                $standingOrders = [$standingOrders];
            }
            foreach ($standingOrders as $so) {
                // Try to get reference from multiple possible fields
                $reference = $so['Reference'] ?? $so['StandingOrderId'] ?? '';
                
                // If still empty, try to get beneficiary name
                if (empty($reference) && isset($so['CreditorAccount']['Name'])) {
                    $reference = $so['CreditorAccount']['Name'];
                } elseif (empty($reference) && isset($so['CreditorAccount'][0]['Name'])) {
                    $reference = $so['CreditorAccount'][0]['Name'];
                }
                
                $statementData['standing_orders'][] = [
                    'reference' => $reference,
                    'amount' => floatval($so['FirstPaymentAmount']['Amount'] ?? 0),
                    'currency' => $so['FirstPaymentAmount']['Currency'] ?? 'AED',
                    'frequency' => $so['Frequency'] ?? 'Unknown',
                    'next_payment' => $so['NextPaymentDateTime'] ?? 'N/A'
                ];
            }
        }
    }
    
    // Extract direct debits
    if (isset($bankingData['apis']['direct_debits']['success']) && $bankingData['apis']['direct_debits']['success']) {
        $ddData = $bankingData['apis']['direct_debits']['data'];
        if (isset($ddData['message']['Data']['DirectDebit'])) {
            $directDebits = $ddData['message']['Data']['DirectDebit'];
            if (!isset($directDebits[0])) {
                $directDebits = [$directDebits];
            }
            foreach ($directDebits as $dd) {
                $statementData['direct_debits'][] = [
                    'name' => $dd['Name'] ?? 'Direct Debit',
                    'reference' => $dd['DirectDebitId'] ?? '',
                    'status' => $dd['Status'] ?? 'Active'
                ];
            }
        }
    }
    
    // Extract scheduled payments
    if (isset($bankingData['apis']['scheduled_payments']['success']) && $bankingData['apis']['scheduled_payments']['success']) {
        $spData = $bankingData['apis']['scheduled_payments']['data'];
        if (isset($spData['message']['Data']['ScheduledPayment'])) {
            $scheduledPayments = $spData['message']['Data']['ScheduledPayment'];
            if (!isset($scheduledPayments[0])) {
                $scheduledPayments = [$scheduledPayments];
            }
            foreach ($scheduledPayments as $sp) {
                // Try to get reference from multiple possible fields
                $reference = $sp['Reference'] ?? $sp['DebtorReference'] ?? $sp['ScheduledPaymentId'] ?? '';
                
                // If still empty, try to get creditor/beneficiary name
                if (empty($reference) && isset($sp['CreditorAccount']['Name'])) {
                    $reference = $sp['CreditorAccount']['Name'];
                } elseif (empty($reference) && isset($sp['CreditorAccount'][0]['Name'])) {
                    $reference = $sp['CreditorAccount'][0]['Name'];
                }
                
                $statementData['scheduled_payments'][] = [
                    'reference' => $reference,
                    'amount' => floatval($sp['InstructedAmount']['Amount'] ?? 0),
                    'currency' => $sp['InstructedAmount']['Currency'] ?? 'AED',
                    'scheduled_date' => $sp['ScheduledPaymentDateTime'] ?? 'N/A'
                ];
            }
        }
    }
    
    return $statementData;
}

/**
 * Generate HTML statement
 */
function generateHTML($data) {
    $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Statement - ' . htmlspecialchars($data['account_id']) . '</title>
    <style>
        @media print {
            .no-print { display: none; }
            body { margin: 0; padding: 20px; }
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .statement-container {
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #7B2687;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #7B2687;
            margin: 0 0 10px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .info-block {
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #7B2687;
        }
        .info-block label {
            font-weight: bold;
            color: #666;
            font-size: 0.9em;
        }
        .info-block .value {
            font-size: 1.1em;
            margin-top: 5px;
        }
        .summary {
            background: linear-gradient(135deg, #7B2687 0%, #B83280 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            text-align: center;
        }
        .summary-item h3 {
            margin: 0 0 5px 0;
            font-size: 0.9em;
            opacity: 0.9;
        }
        .summary-item .amount {
            font-size: 1.5em;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #7B2687;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .credit {
            color: #059669;
            font-weight: 600;
        }
        .debit {
            color: #dc2626;
            font-weight: 600;
        }
        .text-right {
            text-align: right;
        }
        .section-title {
            color: #7B2687;
            border-bottom: 2px solid #7B2687;
            padding-bottom: 10px;
            margin: 30px 0 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .no-print {
            margin: 20px 0;
            text-align: center;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 0 5px;
            background: #7B2687;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
        }
        .btn:hover {
            background: #5a1d64;
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="btn" onclick="window.print()">🖨️ Print Statement</button>
        <a class="btn" href="?format=pdf&range=' . $GLOBALS['dateRange'] . '">📄 Download PDF</a>
        <a class="btn" href="?format=csv&range=' . $GLOBALS['dateRange'] . '">📊 Export CSV</a>
        <button class="btn" onclick="window.close()">✕ Close</button>
    </div>
    
    <div class="statement-container">
        <div class="header">
            <h1>ACCOUNT STATEMENT</h1>
            <p style="margin: 5px 0;">Shukria Smart Credit</p>
        </div>
        
        <div class="info-grid">
            <div class="info-block">
                <label>Account Number</label>
                <div class="value">' . htmlspecialchars($data['account_id']) . '</div>
            </div>
            <div class="info-block">
                <label>Account Holder</label>
                <div class="value">' . htmlspecialchars($data['account_holder'] ?: 'N/A') . '</div>
            </div>
            <div class="info-block">
                <label>Account Type</label>
                <div class="value">' . htmlspecialchars($data['account_type']) . '</div>
            </div>
            <div class="info-block">
                <label>Statement Period</label>
                <div class="value">' . htmlspecialchars($data['statement_period']) . '</div>
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <h3>Opening Balance</h3>
                    <div class="amount">' . $data['currency'] . ' ' . number_format($data['opening_balance'], 2) . '</div>
                </div>
                <div class="summary-item">
                    <h3>Total Credits</h3>
                    <div class="amount">+' . $data['currency'] . ' ' . number_format($data['total_credits'], 2) . '</div>
                </div>
                <div class="summary-item">
                    <h3>Total Debits</h3>
                    <div class="amount">-' . $data['currency'] . ' ' . number_format($data['total_debits'], 2) . '</div>
                </div>
                <div class="summary-item">
                    <h3>Closing Balance</h3>
                    <div class="amount">' . $data['currency'] . ' ' . number_format($data['closing_balance'], 2) . '</div>
                </div>
            </div>
        </div>
        
        <h2 class="section-title">Transaction History (' . $data['transaction_count'] . ' transactions)</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th class="text-right">Debit</th>
                    <th class="text-right">Credit</th>
                    <th class="text-right">Balance</th>
                </tr>
            </thead>
            <tbody>';
    
    if (count($data['transactions']) > 0) {
        foreach ($data['transactions'] as $txn) {
            $html .= '<tr>
                <td>' . htmlspecialchars($txn['display_date']) . '</td>
                <td>' . htmlspecialchars($txn['description']) . '</td>
                <td style="font-size: 0.9em; color: #666;">' . htmlspecialchars($txn['reference']) . '</td>
                <td class="text-right debit">' . ($txn['debit'] > 0 ? number_format($txn['debit'], 2) : '-') . '</td>
                <td class="text-right credit">' . ($txn['credit'] > 0 ? number_format($txn['credit'], 2) : '-') . '</td>
                <td class="text-right">' . number_format($txn['balance'], 2) . '</td>
            </tr>';
        }
    } else {
        $html .= '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No transactions in selected period</td></tr>';
    }
    
    $html .= '</tbody>
        </table>';
    
    // Standing Orders
    if (count($data['standing_orders']) > 0) {
        $html .= '<h2 class="section-title">Standing Orders</h2>
        <table>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                    <th>Next Payment</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($data['standing_orders'] as $so) {
            $html .= '<tr>
                <td>' . htmlspecialchars($so['reference']) . '</td>
                <td>' . $so['currency'] . ' ' . number_format($so['amount'], 2) . '</td>
                <td>' . htmlspecialchars($so['frequency']) . '</td>
                <td>' . htmlspecialchars($so['next_payment']) . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    
    // Direct Debits
    if (count($data['direct_debits']) > 0) {
        $html .= '<h2 class="section-title">Direct Debits</h2>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Reference</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($data['direct_debits'] as $dd) {
            $html .= '<tr>
                <td>' . htmlspecialchars($dd['name']) . '</td>
                <td>' . htmlspecialchars($dd['reference']) . '</td>
                <td>' . htmlspecialchars($dd['status']) . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    
    // Scheduled Payments
    if (count($data['scheduled_payments']) > 0) {
        $html .= '<h2 class="section-title">Scheduled Payments</h2>
        <table>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Scheduled Date</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($data['scheduled_payments'] as $sp) {
            $html .= '<tr>
                <td>' . htmlspecialchars($sp['reference']) . '</td>
                <td>' . $sp['currency'] . ' ' . number_format($sp['amount'], 2) . '</td>
                <td>' . htmlspecialchars($sp['scheduled_date']) . '</td>
            </tr>';
        }
        $html .= '</tbody></table>';
    }
    
    $html .= '
        <div class="footer">
            <p><strong>Statement generated on:</strong> ' . htmlspecialchars($data['generated_at']) . '</p>
            <p>This statement is generated from Open Banking data via Nebras UAE</p>
            <p style="font-size: 0.8em; margin-top: 10px;">For questions or concerns, please contact support@shukria.com</p>
        </div>
    </div>
</body>
</html>';
    
    return $html;
}

/**
 * Generate mobile-friendly in-page HTML
 */
function generateMobileFriendlyHTML($data) {
    $html = '<div class="statement-preview-container">
    <!-- Summary Cards -->
    <div class="statement-summary">
        <h3 class="statement-title">📄 Account Statement</h3>
        <p class="statement-period">' . htmlspecialchars($data['statement_period']) . '</p>
        
        <div class="summary-cards-grid">
            <div class="summary-card">
                <div class="summary-label">Opening Balance</div>
                <div class="summary-amount">' . $data['currency'] . ' ' . number_format($data['opening_balance'], 2) . '</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Credits</div>
                <div class="summary-amount credit">+' . $data['currency'] . ' ' . number_format($data['total_credits'], 2) . '</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Debits</div>
                <div class="summary-amount debit">-' . $data['currency'] . ' ' . number_format($data['total_debits'], 2) . '</div>
            </div>
            <div class="summary-card highlight">
                <div class="summary-label">Closing Balance</div>
                <div class="summary-amount">' . $data['currency'] . ' ' . number_format($data['closing_balance'], 2) . '</div>
            </div>
        </div>
    </div>
    
    <!-- Account Info (Mobile Hidden, Desktop Visible) -->
    <div class="account-info-section desktop-only">
        <div class="info-row">
            <span class="info-label">Account Number:</span>
            <span class="info-value">' . htmlspecialchars($data['account_id']) . '</span>
        </div>
        <div class="info-row">
            <span class="info-label">Account Holder:</span>
            <span class="info-value">' . htmlspecialchars($data['account_holder'] ?: 'N/A') . '</span>
        </div>
        <div class="info-row">
            <span class="info-label">Account Type:</span>
            <span class="info-value">' . htmlspecialchars($data['account_type']) . '</span>
        </div>
    </div>
    
    <!-- Transactions Section -->
    <div class="transactions-section">
        <h4 class="section-header">
            <span>Transactions</span>
            <span class="transaction-count">' . $data['transaction_count'] . ' total</span>
        </h4>
        
        <!-- Desktop Table View -->
        <div class="desktop-only">
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Reference</th>
                        <th class="text-right">Debit</th>
                        <th class="text-right">Credit</th>
                        <th class="text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>';
    
    if (count($data['transactions']) > 0) {
        foreach ($data['transactions'] as $txn) {
            $html .= '<tr>
                <td>' . htmlspecialchars($txn['display_date']) . '</td>
                <td>' . htmlspecialchars($txn['description']) . '</td>
                <td class="text-muted">' . htmlspecialchars($txn['reference']) . '</td>
                <td class="text-right debit">' . ($txn['debit'] > 0 ? number_format($txn['debit'], 2) : '-') . '</td>
                <td class="text-right credit">' . ($txn['credit'] > 0 ? number_format($txn['credit'], 2) : '-') . '</td>
                <td class="text-right">' . number_format($txn['balance'], 2) . '</td>
            </tr>';
        }
    } else {
        $html .= '<tr><td colspan="6" class="text-center text-muted">No transactions in selected period</td></tr>';
    }
    
    $html .= '</tbody>
            </table>
        </div>
        
        <!-- Mobile Card View -->
        <div class="mobile-only transaction-cards">';
    
    if (count($data['transactions']) > 0) {
        foreach ($data['transactions'] as $txn) {
            $typeClass = $txn['type'] === 'Credit' ? 'credit' : 'debit';
            $icon = $txn['type'] === 'Credit' ? '↓' : '↑';
            
            $html .= '<div class="transaction-card ' . $typeClass . '">
                <div class="txn-header">
                    <span class="txn-date">' . htmlspecialchars($txn['display_date']) . '</span>
                    <span class="txn-amount ' . $typeClass . '">' . 
                        ($txn['type'] === 'Credit' ? '+' : '-') . 
                        $data['currency'] . ' ' . number_format($txn['amount'], 2) . 
                    '</span>
                </div>
                <div class="txn-body">
                    <div class="txn-description">' . htmlspecialchars($txn['description']) . '</div>
                    <div class="txn-footer">
                        <span class="txn-reference">' . htmlspecialchars($txn['reference']) . '</span>
                        <span class="txn-balance">Balance: ' . $data['currency'] . ' ' . number_format($txn['balance'], 2) . '</span>
                    </div>
                </div>
            </div>';
        }
    } else {
        $html .= '<div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No transactions found in the selected period</p>
        </div>';
    }
    
    $html .= '</div>
    </div>';
    
    // Standing Orders
    if (count($data['standing_orders']) > 0) {
        $html .= '<div class="additional-section">
            <h4 class="section-header">Standing Orders</h4>
            <div class="info-cards">';
        foreach ($data['standing_orders'] as $so) {
            $html .= '<div class="info-card">
                <div class="card-row">
                    <span class="card-label">Reference:</span>
                    <span class="card-value">' . htmlspecialchars($so['reference']) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Amount:</span>
                    <span class="card-value">' . $so['currency'] . ' ' . number_format($so['amount'], 2) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Frequency:</span>
                    <span class="card-value">' . htmlspecialchars($so['frequency']) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Next Payment:</span>
                    <span class="card-value">' . htmlspecialchars($so['next_payment']) . '</span>
                </div>
            </div>';
        }
        $html .= '</div></div>';
    }
    
    // Direct Debits
    if (count($data['direct_debits']) > 0) {
        $html .= '<div class="additional-section">
            <h4 class="section-header">Direct Debits</h4>
            <div class="info-cards">';
        foreach ($data['direct_debits'] as $dd) {
            $html .= '<div class="info-card">
                <div class="card-row">
                    <span class="card-label">Name:</span>
                    <span class="card-value">' . htmlspecialchars($dd['name']) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Reference:</span>
                    <span class="card-value">' . htmlspecialchars($dd['reference']) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Status:</span>
                    <span class="card-value badge ' . strtolower($dd['status']) . '">' . htmlspecialchars($dd['status']) . '</span>
                </div>
            </div>';
        }
        $html .= '</div></div>';
    }
    
    // Scheduled Payments
    if (count($data['scheduled_payments']) > 0) {
        $html .= '<div class="additional-section">
            <h4 class="section-header">Scheduled Payments</h4>
            <div class="info-cards">';
        foreach ($data['scheduled_payments'] as $sp) {
            $html .= '<div class="info-card">
                <div class="card-row">
                    <span class="card-label">Reference:</span>
                    <span class="card-value">' . htmlspecialchars($sp['reference']) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Amount:</span>
                    <span class="card-value">' . $sp['currency'] . ' ' . number_format($sp['amount'], 2) . '</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Scheduled Date:</span>
                    <span class="card-value">' . htmlspecialchars($sp['scheduled_date']) . '</span>
                </div>
            </div>';
        }
        $html .= '</div></div>';
    }
    
    // Footer
    $html .= '<div class="statement-footer">
        <p><small>Generated on: ' . htmlspecialchars($data['generated_at']) . '</small></p>
        <p><small>Powered by Nebras Open Banking UAE</small></p>
    </div>
</div>';
    
    return $html;
}

/**
 * Generate CSV statement
 */
function generateCSV($data) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="statement_' . $data['account_id'] . '_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Header info
    fputcsv($output, ['Account Statement']);
    fputcsv($output, ['Account Number', $data['account_id']]);
    fputcsv($output, ['Account Holder', $data['account_holder']]);
    fputcsv($output, ['Statement Period', $data['statement_period']]);
    fputcsv($output, ['Generated', $data['generated_at']]);
    fputcsv($output, []);
    
    // Summary
    fputcsv($output, ['Summary']);
    fputcsv($output, ['Opening Balance', $data['opening_balance']]);
    fputcsv($output, ['Total Credits', $data['total_credits']]);
    fputcsv($output, ['Total Debits', $data['total_debits']]);
    fputcsv($output, ['Closing Balance', $data['closing_balance']]);
    fputcsv($output, []);
    
    // Transactions
    fputcsv($output, ['Transactions']);
    fputcsv($output, ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']);
    foreach ($data['transactions'] as $txn) {
        fputcsv($output, [
            $txn['display_date'],
            $txn['description'],
            $txn['reference'],
            $txn['debit'],
            $txn['credit'],
            $txn['balance']
        ]);
    }
    
    fclose($output);
    exit;
}

/**
 * Generate PDF statement (requires TCPDF or similar library)
 * For now, we'll generate HTML and suggest using browser's print-to-PDF
 */
function generatePDF($data) {
    // For production, install TCPDF: composer require tecnickcom/tcpdf
    // For now, redirect to HTML with print dialog
    header('Content-Type: text/html');
    $html = generateHTML($data);
    echo $html;
    echo '<script>window.print();</script>';
    exit;
}

// Main execution
try {
    $statementData = extractStatementData($bankingData, $dateRange, $startDate, $endDate);
    
    switch ($format) {
        case 'csv':
            generateCSV($statementData);
            break;
        case 'pdf':
            generatePDF($statementData);
            break;
        case 'json':
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => $statementData,
                'html' => generateMobileFriendlyHTML($statementData)
            ]);
            break;
        case 'inline':
            // Return just the mobile-friendly HTML for in-page display
            echo generateMobileFriendlyHTML($statementData);
            break;
        case 'html':
        default:
            echo generateHTML($statementData);
            break;
    }
} catch (Exception $e) {
    if ($format === 'json') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    } else {
        echo "Error generating statement: " . htmlspecialchars($e->getMessage());
    }
}
