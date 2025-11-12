<?php
/**
 * Account Analysis Engine
 * 
 * Performs comprehensive financial analysis on account data:
 * - Spending patterns and categorization
 * - Income detection and stability
 * - Cash flow analysis
 * - Behavior pattern detection
 * - Financial health scoring
 * - Personalized recommendations
 * 
 * Called via AJAX from accounts.js
 */

session_start();
header('Content-Type: application/json');

// Check if banking data exists in session
if (!isset($_SESSION['banking_data'])) {
    echo json_encode([
        'success' => false,
        'error' => 'No banking data available. Please fetch account data first.'
    ]);
    exit;
}

$bankingData = $_SESSION['banking_data'];

class AccountAnalyzer {
    private $transactions = [];
    private $balance = 0;
    private $standingOrders = [];
    private $directDebits = [];
    private $scheduledPayments = [];
    private $accountInfo = [];
    private $currency = 'AED';
    
    public function __construct($bankingData) {
        $this->extractData($bankingData);
    }
    
    private function extractData($bankingData) {
        // Extract transactions
        if (isset($bankingData['apis']['transactions']['success']) && $bankingData['apis']['transactions']['success']) {
            $txnData = $bankingData['apis']['transactions']['data'];
            if (isset($txnData['message']['Data']['Transaction'])) {
                $this->transactions = $txnData['message']['Data']['Transaction'];
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
                foreach ($balances as $bal) {
                    if ($bal['Type'] === 'ClosingAvailable' || $bal['Type'] === 'InterimAvailable') {
                        $this->balance = floatval($bal['Amount']['Amount']);
                        $this->currency = $bal['Amount']['Currency'] ?? 'AED';
                        break;
                    }
                }
            }
        }
        
        // Extract standing orders
        if (isset($bankingData['apis']['standing_orders']['success']) && $bankingData['apis']['standing_orders']['success']) {
            $soData = $bankingData['apis']['standing_orders']['data'];
            if (isset($soData['message']['Data']['StandingOrder'])) {
                $this->standingOrders = $soData['message']['Data']['StandingOrder'];
                if (!isset($this->standingOrders[0])) {
                    $this->standingOrders = [$this->standingOrders];
                }
            }
        }
        
        // Extract direct debits
        if (isset($bankingData['apis']['direct_debits']['success']) && $bankingData['apis']['direct_debits']['success']) {
            $ddData = $bankingData['apis']['direct_debits']['data'];
            if (isset($ddData['message']['Data']['DirectDebit'])) {
                $this->directDebits = $ddData['message']['Data']['DirectDebit'];
                if (!isset($this->directDebits[0])) {
                    $this->directDebits = [$this->directDebits];
                }
            }
        }
        
        // Extract scheduled payments
        if (isset($bankingData['apis']['scheduled_payments']['success']) && $bankingData['apis']['scheduled_payments']['success']) {
            $spData = $bankingData['apis']['scheduled_payments']['data'];
            if (isset($spData['message']['Data']['ScheduledPayment'])) {
                $this->scheduledPayments = $spData['message']['Data']['ScheduledPayment'];
                if (!isset($this->scheduledPayments[0])) {
                    $this->scheduledPayments = [$this->scheduledPayments];
                }
            }
        }
        
        // Extract account info
        if (isset($bankingData['apis']['accountinfo']['success']) && $bankingData['apis']['accountinfo']['success']) {
            $accData = $bankingData['apis']['accountinfo']['data'];
            if (isset($accData['message']['Data']['Account'][0])) {
                $this->accountInfo = $accData['message']['Data']['Account'][0];
            }
        }
    }
    
    public function analyze() {
        return [
            'success' => true,
            'analysis' => [
                'spending_analysis' => $this->analyzeSpending(),
                'income_analysis' => $this->analyzeIncome(),
                'cash_flow_analysis' => $this->analyzeCashFlow(),
                'behavior_patterns' => $this->detectPatterns(),
                'merchant_analysis' => $this->analyzeMerchants(),
                'financial_health' => $this->calculateHealthScore(),
                'insights' => $this->generateInsights(),
                'recommendations' => $this->generateRecommendations()
            ],
            'metadata' => [
                'analyzed_at' => date('Y-m-d H:i:s'),
                'transaction_count' => count($this->transactions),
                'currency' => $this->currency
            ]
        ];
    }
    
    private function analyzeSpending() {
        $totalSpending = 0;
        $spendingByCategory = [];
        $monthlySpending = [];
        $largestExpenses = [];
        
        foreach ($this->transactions as $txn) {
            if (($txn['CreditDebitIndicator'] ?? '') === 'Debit') {
                $amount = floatval($txn['Amount']['Amount'] ?? 0);
                $totalSpending += $amount;
                
                // Categorize (basic categorization based on description)
                $category = $this->categorizeTransaction($txn);
                if (!isset($spendingByCategory[$category])) {
                    $spendingByCategory[$category] = 0;
                }
                $spendingByCategory[$category] += $amount;
                
                // Monthly breakdown
                $date = $txn['BookingDateTime'] ?? $txn['ValueDateTime'] ?? '';
                $month = date('Y-m', strtotime($date));
                if (!isset($monthlySpending[$month])) {
                    $monthlySpending[$month] = 0;
                }
                $monthlySpending[$month] += $amount;
                
                // Track large expenses
                $largestExpenses[] = [
                    'amount' => $amount,
                    'description' => $txn['TransactionInformation'] ?? 'Unknown',
                    'date' => date('M d, Y', strtotime($date))
                ];
            }
        }
        
        // Sort and limit largest expenses
        usort($largestExpenses, function($a, $b) {
            return $b['amount'] <=> $a['amount'];
        });
        $largestExpenses = array_slice($largestExpenses, 0, 5);
        
        // Calculate average daily/monthly spend
        $daysCovered = $this->calculateDaysCovered();
        $avgDailySpend = $daysCovered > 0 ? $totalSpending / $daysCovered : 0;
        $avgMonthlySpend = $avgDailySpend * 30;
        
        // Spending trend (increasing/decreasing)
        $trend = $this->calculateSpendingTrend($monthlySpending);
        
        return [
            'total_spending' => round($totalSpending, 2),
            'avg_daily_spend' => round($avgDailySpend, 2),
            'avg_monthly_spend' => round($avgMonthlySpend, 2),
            'spending_by_category' => $spendingByCategory,
            'monthly_breakdown' => $monthlySpending,
            'largest_expenses' => $largestExpenses,
            'trend' => $trend
        ];
    }
    
    private function analyzeIncome() {
        $totalIncome = 0;
        $incomeTransactions = [];
        $monthlyIncome = [];
        $regularIncome = [];
        
        foreach ($this->transactions as $txn) {
            if (($txn['CreditDebitIndicator'] ?? '') === 'Credit') {
                $amount = floatval($txn['Amount']['Amount'] ?? 0);
                $totalIncome += $amount;
                
                $date = $txn['BookingDateTime'] ?? $txn['ValueDateTime'] ?? '';
                $month = date('Y-m', strtotime($date));
                
                if (!isset($monthlyIncome[$month])) {
                    $monthlyIncome[$month] = 0;
                }
                $monthlyIncome[$month] += $amount;
                
                $incomeTransactions[] = [
                    'amount' => $amount,
                    'description' => $txn['TransactionInformation'] ?? 'Income',
                    'date' => $date
                ];
            }
        }
        
        // Detect regular income (salary pattern)
        $regularIncome = $this->detectRegularIncome($incomeTransactions);
        
        // Calculate averages
        $monthCount = count($monthlyIncome);
        $avgMonthlyIncome = $monthCount > 0 ? $totalIncome / $monthCount : 0;
        
        // Income stability score (0-100)
        $stabilityScore = $this->calculateIncomeStability($monthlyIncome);
        
        return [
            'total_income' => round($totalIncome, 2),
            'avg_monthly_income' => round($avgMonthlyIncome, 2),
            'monthly_breakdown' => $monthlyIncome,
            'regular_income' => $regularIncome,
            'stability_score' => $stabilityScore,
            'income_sources' => count($incomeTransactions)
        ];
    }
    
    private function analyzeCashFlow() {
        $monthlyFlow = [];
        $positiveMonths = 0;
        $negativeMonths = 0;
        
        foreach ($this->transactions as $txn) {
            $amount = floatval($txn['Amount']['Amount'] ?? 0);
            $date = $txn['BookingDateTime'] ?? $txn['ValueDateTime'] ?? '';
            $month = date('Y-m', strtotime($date));
            
            if (!isset($monthlyFlow[$month])) {
                $monthlyFlow[$month] = ['credits' => 0, 'debits' => 0, 'net' => 0];
            }
            
            if (($txn['CreditDebitIndicator'] ?? '') === 'Credit') {
                $monthlyFlow[$month]['credits'] += $amount;
            } else {
                $monthlyFlow[$month]['debits'] += $amount;
            }
            
            $monthlyFlow[$month]['net'] = $monthlyFlow[$month]['credits'] - $monthlyFlow[$month]['debits'];
        }
        
        // Count positive/negative months
        foreach ($monthlyFlow as $flow) {
            if ($flow['net'] > 0) {
                $positiveMonths++;
            } elseif ($flow['net'] < 0) {
                $negativeMonths++;
            }
        }
        
        // Calculate volatility
        $netFlows = array_column($monthlyFlow, 'net');
        $volatility = count($netFlows) > 0 ? $this->calculateStandardDeviation($netFlows) : 0;
        
        // Overall net cash flow
        $totalNet = array_sum($netFlows);
        
        return [
            'monthly_cash_flow' => $monthlyFlow,
            'total_net_flow' => round($totalNet, 2),
            'positive_months' => $positiveMonths,
            'negative_months' => $negativeMonths,
            'volatility_index' => round($volatility, 2),
            'avg_monthly_net' => count($netFlows) > 0 ? round(array_sum($netFlows) / count($netFlows), 2) : 0
        ];
    }
    
    private function detectPatterns() {
        // Detect recurring payments from transactions
        $recurringPayments = $this->detectRecurringPayments();
        
        // Savings calculation
        $savingsRate = $this->calculateSavingsRate();
        
        // Count standing orders and direct debits
        $totalRecurring = count($this->standingOrders) + count($this->directDebits);
        
        return [
            'recurring_payments' => $recurringPayments,
            'standing_orders_count' => count($this->standingOrders),
            'direct_debits_count' => count($this->directDebits),
            'total_recurring' => $totalRecurring,
            'savings_rate' => $savingsRate,
            'scheduled_payments_count' => count($this->scheduledPayments)
        ];
    }
    
    private function analyzeMerchants() {
        $merchantSpending = [];
        
        foreach ($this->transactions as $txn) {
            if (($txn['CreditDebitIndicator'] ?? '') === 'Debit') {
                $merchant = $this->extractMerchantName($txn);
                $amount = floatval($txn['Amount']['Amount'] ?? 0);
                
                if (!isset($merchantSpending[$merchant])) {
                    $merchantSpending[$merchant] = ['total' => 0, 'count' => 0];
                }
                
                $merchantSpending[$merchant]['total'] += $amount;
                $merchantSpending[$merchant]['count']++;
            }
        }
        
        // Sort by spending
        uasort($merchantSpending, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });
        
        // Get top 10 merchants
        $topMerchants = array_slice($merchantSpending, 0, 10, true);
        
        return [
            'top_merchants' => $topMerchants,
            'unique_merchants' => count($merchantSpending)
        ];
    }
    
    private function calculateHealthScore() {
        $score = 0;
        $maxScore = 100;
        $breakdown = [];
        
        // 1. Balance Score (25 points)
        if ($this->balance >= 50000) {
            $balanceScore = 25;
        } elseif ($this->balance >= 30000) {
            $balanceScore = 20;
        } elseif ($this->balance >= 20000) {
            $balanceScore = 15;
        } elseif ($this->balance >= 10000) {
            $balanceScore = 10;
        } else {
            $balanceScore = 5;
        }
        $breakdown['balance'] = $balanceScore;
        $score += $balanceScore;
        
        // 2. Cash Flow Score (25 points)
        $cashFlow = $this->analyzeCashFlow();
        if ($cashFlow['total_net_flow'] > 20000) {
            $cashFlowScore = 25;
        } elseif ($cashFlow['total_net_flow'] > 10000) {
            $cashFlowScore = 20;
        } elseif ($cashFlow['total_net_flow'] > 0) {
            $cashFlowScore = 15;
        } elseif ($cashFlow['total_net_flow'] > -5000) {
            $cashFlowScore = 10;
        } else {
            $cashFlowScore = 5;
        }
        $breakdown['cash_flow'] = $cashFlowScore;
        $score += $cashFlowScore;
        
        // 3. Income Stability (25 points)
        $income = $this->analyzeIncome();
        $breakdown['income_stability'] = round($income['stability_score'] * 0.25);
        $score += $breakdown['income_stability'];
        
        // 4. Spending Discipline (25 points)
        $spending = $this->analyzeSpending();
        if ($spending['total_spending'] > 0 && $income['total_income'] > 0) {
            $spendingRatio = $spending['total_spending'] / $income['total_income'];
            if ($spendingRatio < 0.5) {
                $disciplineScore = 25;
            } elseif ($spendingRatio < 0.7) {
                $disciplineScore = 20;
            } elseif ($spendingRatio < 0.9) {
                $disciplineScore = 15;
            } else {
                $disciplineScore = 10;
            }
        } else {
            $disciplineScore = 10;
        }
        $breakdown['spending_discipline'] = $disciplineScore;
        $score += $disciplineScore;
        
        // Determine rating
        if ($score >= 80) {
            $rating = 'Excellent';
            $color = '#059669';
        } elseif ($score >= 60) {
            $rating = 'Good';
            $color = '#0891b2';
        } elseif ($score >= 40) {
            $rating = 'Fair';
            $color = '#f59e0b';
        } else {
            $rating = 'Needs Improvement';
            $color = '#dc2626';
        }
        
        return [
            'score' => min($score, $maxScore),
            'max_score' => $maxScore,
            'rating' => $rating,
            'color' => $color,
            'breakdown' => $breakdown
        ];
    }
    
    private function generateInsights() {
        $insights = [];
        $spending = $this->analyzeSpending();
        $income = $this->analyzeIncome();
        $cashFlow = $this->analyzeCashFlow();
        
        // Spending insights
        if ($spending['trend'] === 'increasing') {
            $insights[] = [
                'type' => 'warning',
                'icon' => '⚠️',
                'message' => 'Your spending has been increasing over recent months'
            ];
        } elseif ($spending['trend'] === 'decreasing') {
            $insights[] = [
                'type' => 'success',
                'icon' => '✅',
                'message' => 'Great job! Your spending is trending downward'
            ];
        }
        
        // Cash flow insights
        if ($cashFlow['total_net_flow'] > 0) {
            $insights[] = [
                'type' => 'success',
                'icon' => '💰',
                'message' => 'Positive cash flow of ' . $this->currency . ' ' . number_format($cashFlow['total_net_flow'], 0)
            ];
        } else {
            $insights[] = [
                'type' => 'warning',
                'icon' => '📉',
                'message' => 'Negative cash flow detected. Consider reviewing expenses'
            ];
        }
        
        // Income stability
        if ($income['stability_score'] > 80) {
            $insights[] = [
                'type' => 'info',
                'icon' => '📊',
                'message' => 'Your income is very stable and consistent'
            ];
        }
        
        // Savings rate
        $patterns = $this->detectPatterns();
        if ($patterns['savings_rate'] > 20) {
            $insights[] = [
                'type' => 'success',
                'icon' => '🎯',
                'message' => 'Excellent savings rate of ' . round($patterns['savings_rate']) . '%'
            ];
        } elseif ($patterns['savings_rate'] < 10) {
            $insights[] = [
                'type' => 'warning',
                'icon' => '💡',
                'message' => 'Low savings rate. Try to save at least 20% of income'
            ];
        }
        
        // Upcoming payments reminder
        if (count($this->scheduledPayments) > 0) {
            $insights[] = [
                'type' => 'info',
                'icon' => '📅',
                'message' => count($this->scheduledPayments) . ' upcoming scheduled payment(s)'
            ];
        }
        
        return $insights;
    }
    
    private function generateRecommendations() {
        $recommendations = [];
        $spending = $this->analyzeSpending();
        $income = $this->analyzeIncome();
        $cashFlow = $this->analyzeCashFlow();
        $health = $this->calculateHealthScore();
        
        // Budget recommendation
        if ($income['avg_monthly_income'] > 0) {
            $recommendedBudget = [
                'essentials' => round($income['avg_monthly_income'] * 0.5, 0),
                'discretionary' => round($income['avg_monthly_income'] * 0.3, 0),
                'savings' => round($income['avg_monthly_income'] * 0.2, 0)
            ];
            $recommendations[] = [
                'title' => '50/30/20 Budget Rule',
                'description' => 'Allocate 50% to essentials, 30% to wants, 20% to savings',
                'data' => $recommendedBudget
            ];
        }
        
        // Category-specific recommendations
        if (isset($spending['spending_by_category'])) {
            arsort($spending['spending_by_category']);
            $topCategory = array_key_first($spending['spending_by_category']);
            if ($topCategory && $spending['spending_by_category'][$topCategory] > $income['avg_monthly_income'] * 0.3) {
                $recommendations[] = [
                    'title' => 'Reduce ' . ucfirst($topCategory) . ' Spending',
                    'description' => 'Your ' . $topCategory . ' expenses are higher than recommended',
                    'data' => null
                ];
            }
        }
        
        // Emergency fund
        if ($this->balance < $income['avg_monthly_income'] * 3) {
            $recommendations[] = [
                'title' => 'Build Emergency Fund',
                'description' => 'Aim for 3-6 months of expenses in savings',
                'data' => ['target' => round($income['avg_monthly_income'] * 3, 0)]
            ];
        }
        
        // Improve health score
        if ($health['score'] < 70) {
            $lowestComponent = array_keys($health['breakdown'], min($health['breakdown']))[0];
            $recommendations[] = [
                'title' => 'Improve ' . ucwords(str_replace('_', ' ', $lowestComponent)),
                'description' => 'This is your lowest scoring financial health component',
                'data' => null
            ];
        }
        
        return $recommendations;
    }
    
    // Helper methods
    
    private function categorizeTransaction($txn) {
        $description = strtolower($txn['TransactionInformation'] ?? '');
        
        // Simple keyword-based categorization
        $categories = [
            'food' => ['restaurant', 'cafe', 'food', 'grocery', 'supermarket'],
            'transport' => ['uber', 'taxi', 'fuel', 'parking', 'metro'],
            'shopping' => ['mall', 'store', 'shop', 'retail'],
            'entertainment' => ['cinema', 'netflix', 'spotify', 'game'],
            'utilities' => ['electric', 'water', 'gas', 'internet', 'phone'],
            'healthcare' => ['hospital', 'pharmacy', 'clinic', 'doctor'],
            'education' => ['school', 'university', 'course', 'book']
        ];
        
        foreach ($categories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($description, $keyword) !== false) {
                    return $category;
                }
            }
        }
        
        return 'other';
    }
    
    private function calculateDaysCovered() {
        if (empty($this->transactions)) return 0;
        
        $dates = [];
        foreach ($this->transactions as $txn) {
            $date = $txn['BookingDateTime'] ?? $txn['ValueDateTime'] ?? '';
            if ($date) {
                $dates[] = strtotime($date);
            }
        }
        
        if (empty($dates)) return 0;
        
        $minDate = min($dates);
        $maxDate = max($dates);
        
        return ($maxDate - $minDate) / 86400; // Convert to days
    }
    
    private function calculateSpendingTrend($monthlySpending) {
        if (count($monthlySpending) < 2) return 'stable';
        
        $values = array_values($monthlySpending);
        $recent = array_slice($values, -3); // Last 3 months
        
        if (count($recent) < 2) return 'stable';
        
        $trend = 0;
        for ($i = 1; $i < count($recent); $i++) {
            $trend += ($recent[$i] - $recent[$i-1]);
        }
        
        if ($trend > 1000) return 'increasing';
        if ($trend < -1000) return 'decreasing';
        return 'stable';
    }
    
    private function detectRegularIncome($incomeTransactions) {
        // Group by similar amounts (within 10% variance)
        $groups = [];
        
        foreach ($incomeTransactions as $txn) {
            $amount = $txn['amount'];
            $found = false;
            
            foreach ($groups as $key => $group) {
                $avgAmount = $group['avg_amount'];
                if (abs($amount - $avgAmount) / $avgAmount < 0.1) {
                    $groups[$key]['transactions'][] = $txn;
                    $groups[$key]['avg_amount'] = array_sum(array_column($groups[$key]['transactions'], 'amount')) / count($groups[$key]['transactions']);
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                $groups[] = [
                    'avg_amount' => $amount,
                    'transactions' => [$txn]
                ];
            }
        }
        
        // Find groups with multiple occurrences (regular income)
        $regularIncome = [];
        foreach ($groups as $group) {
            if (count($group['transactions']) >= 2) {
                $regularIncome[] = [
                    'amount' => round($group['avg_amount'], 2),
                    'frequency' => count($group['transactions']),
                    'description' => $group['transactions'][0]['description']
                ];
            }
        }
        
        return $regularIncome;
    }
    
    private function calculateIncomeStability($monthlyIncome) {
        if (count($monthlyIncome) < 2) return 50;
        
        $values = array_values($monthlyIncome);
        $avg = array_sum($values) / count($values);
        $stdDev = $this->calculateStandardDeviation($values);
        
        if ($avg == 0) return 0;
        
        $coefficientOfVariation = ($stdDev / $avg) * 100;
        
        // Lower CV = higher stability
        if ($coefficientOfVariation < 10) return 100;
        if ($coefficientOfVariation < 20) return 80;
        if ($coefficientOfVariation < 30) return 60;
        if ($coefficientOfVariation < 40) return 40;
        return 20;
    }
    
    private function calculateStandardDeviation($values) {
        if (count($values) < 2) return 0;
        
        $avg = array_sum($values) / count($values);
        $variance = 0;
        
        foreach ($values as $value) {
            $variance += pow($value - $avg, 2);
        }
        
        $variance /= count($values);
        
        return sqrt($variance);
    }
    
    private function detectRecurringPayments() {
        // Group transactions by similar amounts and descriptions
        $recurring = [];
        $processed = [];
        
        foreach ($this->transactions as $i => $txn1) {
            if (isset($processed[$i]) || ($txn1['CreditDebitIndicator'] ?? '') !== 'Debit') continue;
            
            $amount1 = floatval($txn1['Amount']['Amount'] ?? 0);
            $desc1 = strtolower($txn1['TransactionInformation'] ?? '');
            
            $matches = [];
            foreach ($this->transactions as $j => $txn2) {
                if ($i === $j || isset($processed[$j]) || ($txn2['CreditDebitIndicator'] ?? '') !== 'Debit') continue;
                
                $amount2 = floatval($txn2['Amount']['Amount'] ?? 0);
                $desc2 = strtolower($txn2['TransactionInformation'] ?? '');
                
                // Check if amounts are similar (within 5%) and descriptions are similar
                if (abs($amount1 - $amount2) / $amount1 < 0.05 && similar_text($desc1, $desc2) > 70) {
                    $matches[] = $txn2;
                    $processed[$j] = true;
                }
            }
            
            if (count($matches) >= 1) { // At least 2 occurrences
                $recurring[] = [
                    'description' => $txn1['TransactionInformation'] ?? 'Recurring Payment',
                    'amount' => round($amount1, 2),
                    'frequency' => count($matches) + 1
                ];
                $processed[$i] = true;
            }
        }
        
        return $recurring;
    }
    
    private function calculateSavingsRate() {
        $income = $this->analyzeIncome();
        $spending = $this->analyzeSpending();
        
        if ($income['total_income'] == 0) return 0;
        
        $savings = $income['total_income'] - $spending['total_spending'];
        $savingsRate = ($savings / $income['total_income']) * 100;
        
        return max(0, min(100, $savingsRate)); // Clamp between 0-100
    }
    
    private function extractMerchantName($txn) {
        $description = $txn['TransactionInformation'] ?? 'Unknown Merchant';
        
        // Try to extract merchant name (basic logic)
        // In production, you'd use more sophisticated NLP
        $words = explode(' ', $description);
        return count($words) > 0 ? ucfirst(strtolower($words[0])) : 'Unknown';
    }
}

// Main execution
try {
    $analyzer = new AccountAnalyzer($bankingData);
    $analysis = $analyzer->analyze();
    
    // Store analysis in session
    $_SESSION['account_analysis'] = $analysis;
    $_SESSION['account_analysis_timestamp'] = time();
    
    echo json_encode($analysis);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Analysis failed: ' . $e->getMessage()
    ]);
}
