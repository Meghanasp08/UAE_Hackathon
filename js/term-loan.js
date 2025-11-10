/**
 * Term Loan Manager - Handles all term loan operations
 * Integrates with existing credit line system while maintaining separation from BNPL
 */

const TermLoanManager = {
    // Configuration
    config: {
        maxLoanToLimitRatio: 2.4,  // Up to 240% of credit limit
        minLoanAmount: 1000,       // Minimum AED 1,000
        maxTermMonths: 60,         // Maximum 60 months
        interestRates: {
            12: 0.08,   // 8% for 12 months
            24: 0.095,  // 9.5% for 24 months
            36: 0.11,   // 11% for 36 months
            48: 0.125,  // 12.5% for 48 months
            60: 0.14    // 14% for 60 months
        },
        processingFeeRate: 0.025   // 2.5% processing fee
    },

    // Check eligibility for term loan
    checkEligibility(creditLimit, currentBalance, existingTermLoans = []) {
        try {
            // Get current utilization
            const currentUtilization = (currentBalance / creditLimit) * 100;
            
            // Calculate existing term loan debt
            const existingTermLoanDebt = existingTermLoans.reduce((total, loan) => {
                return total + (loan.remainingBalance || 0);
            }, 0);
            
            // Calculate maximum available loan amount
            const maxPossibleLoan = creditLimit * this.config.maxLoanToLimitRatio;
            const availableAmount = maxPossibleLoan - currentBalance - existingTermLoanDebt;
            
            // Eligibility criteria
            const isEligible = availableAmount >= this.config.minLoanAmount;
            const utilizationCheck = currentUtilization <= 80; // Max 80% current utilization
            
            return {
                eligible: isEligible && utilizationCheck,
                maxLoanAmount: Math.max(0, Math.floor(availableAmount)),
                currentUtilization,
                existingTermLoanDebt,
                reasons: this._getEligibilityReasons(isEligible, utilizationCheck, availableAmount)
            };
        } catch (error) {
            console.error('Error checking term loan eligibility:', error);
            return {
                eligible: false,
                maxLoanAmount: 0,
                currentUtilization: 0,
                existingTermLoanDebt: 0,
                reasons: ['System error. Please try again.']
            };
        }
    },

    // Get eligibility reasons
    _getEligibilityReasons(isEligible, utilizationCheck, availableAmount) {
        const reasons = [];
        
        if (!utilizationCheck) {
            reasons.push('Current credit utilization is too high (max 80%)');
        }
        
        if (availableAmount < this.config.minLoanAmount) {
            reasons.push(`Minimum loan amount is AED ${this.config.minLoanAmount.toLocaleString()}`);
        }
        
        if (isEligible && utilizationCheck) {
            reasons.push('You are eligible for a term loan');
        }
        
        return reasons;
    },

    // Calculate loan details
    calculateLoan(loanAmount, termMonths) {
        try {
            // Validate inputs
            if (!loanAmount || loanAmount < this.config.minLoanAmount) {
                throw new Error(`Minimum loan amount is AED ${this.config.minLoanAmount}`);
            }
            
            if (!this.config.interestRates[termMonths]) {
                throw new Error('Invalid term selected');
            }
            
            const annualRate = this.config.interestRates[termMonths];
            const monthlyRate = annualRate / 12;
            const processingFee = loanAmount * this.config.processingFeeRate;
            
            // Calculate EMI using amortization formula
            const emi = this._calculateEMI(loanAmount, monthlyRate, termMonths);
            
            // Calculate total amounts
            const totalInterest = (emi * termMonths) - loanAmount;
            const totalAmount = loanAmount + totalInterest;
            const totalCost = totalAmount + processingFee;
            
            return {
                loanAmount,
                termMonths,
                annualRate,
                monthlyRate,
                emi: Math.round(emi * 100) / 100,
                processingFee: Math.round(processingFee * 100) / 100,
                totalInterest: Math.round(totalInterest * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100,
                effectiveAPR: this._calculateAPR(loanAmount, emi, termMonths, processingFee)
            };
        } catch (error) {
            console.error('Error calculating loan:', error);
            throw error;
        }
    },

    // Calculate EMI using standard amortization formula
    _calculateEMI(principal, monthlyRate, termMonths) {
        if (monthlyRate === 0) {
            return principal / termMonths;
        }
        
        const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths);
        const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
        
        return numerator / denominator;
    },

    // Calculate APR including processing fee
    _calculateAPR(loanAmount, emi, termMonths, processingFee) {
        const totalPaid = (emi * termMonths) + processingFee;
        const totalCost = totalPaid - loanAmount;
        const apr = (totalCost / loanAmount) * (12 / termMonths);
        
        return Math.round(apr * 10000) / 100; // Return as percentage with 2 decimal places
    },

    // Generate amortization schedule
    generateAmortizationSchedule(loanAmount, termMonths, monthlyRate) {
        const schedule = [];
        let remainingBalance = loanAmount;
        const emi = this._calculateEMI(loanAmount, monthlyRate, termMonths);
        
        for (let month = 1; month <= termMonths; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = emi - interestPayment;
            remainingBalance -= principalPayment;
            
            // Ensure remaining balance doesn't go negative due to rounding
            if (remainingBalance < 0.01) remainingBalance = 0;
            
            schedule.push({
                month,
                emi: Math.round(emi * 100) / 100,
                principalPayment: Math.round(principalPayment * 100) / 100,
                interestPayment: Math.round(interestPayment * 100) / 100,
                remainingBalance: Math.round(remainingBalance * 100) / 100
            });
        }
        
        return schedule;
    },

    // Create new term loan
    createTermLoan(loanDetails, userInfo = {}) {
        try {
            const termLoan = {
                id: 'TL' + Date.now() + Math.random().toString(36).substr(2, 5),
                ...loanDetails,
                status: 'active',
                createdAt: new Date().toISOString(),
                disbursedAt: new Date().toISOString(),
                nextDueDate: this._calculateNextDueDate(),
                remainingBalance: loanDetails.loanAmount,
                remainingTerms: loanDetails.termMonths,
                paymentsMade: 0,
                totalPaid: 0,
                userInfo: {
                    name: userInfo.name || 'Customer',
                    email: userInfo.email || '',
                    phone: userInfo.phone || ''
                }
            };
            
            // Generate and store amortization schedule
            termLoan.amortizationSchedule = this.generateAmortizationSchedule(
                loanDetails.loanAmount,
                loanDetails.termMonths,
                loanDetails.monthlyRate
            );
            
            // Save to localStorage
            this._saveTermLoan(termLoan);
            
            return termLoan;
        } catch (error) {
            console.error('Error creating term loan:', error);
            throw error;
        }
    },

    // Calculate next due date (first day of next month)
    _calculateNextDueDate() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        return nextMonth.toISOString().split('T')[0];
    },

    // Save term loan to localStorage
    _saveTermLoan(termLoan) {
        try {
            const existingLoans = this.getAllTermLoans();
            existingLoans.push(termLoan);
            localStorage.setItem('termLoans', JSON.stringify(existingLoans));
            
            // Also save to user's profile if available
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            if (!userProfile.termLoans) userProfile.termLoans = [];
            userProfile.termLoans.push(termLoan.id);
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            
        } catch (error) {
            console.error('Error saving term loan:', error);
            throw error;
        }
    },

    // Get all term loans
    getAllTermLoans() {
        try {
            return JSON.parse(localStorage.getItem('termLoans') || '[]');
        } catch (error) {
            console.error('Error retrieving term loans:', error);
            return [];
        }
    },

    // Get term loan by ID
    getTermLoanById(loanId) {
        const loans = this.getAllTermLoans();
        return loans.find(loan => loan.id === loanId);
    },

    // Get active term loans
    getActiveTermLoans() {
        return this.getAllTermLoans().filter(loan => loan.status === 'active');
    },

    // Make payment on term loan
    makePayment(loanId, paymentAmount, paymentType = 'regular') {
        try {
            const loans = this.getAllTermLoans();
            const loanIndex = loans.findIndex(loan => loan.id === loanId);
            
            if (loanIndex === -1) {
                throw new Error('Term loan not found');
            }
            
            const loan = loans[loanIndex];
            
            if (loan.status !== 'active') {
                throw new Error('Loan is not active');
            }
            
            // Process payment
            const payment = {
                id: 'PAY' + Date.now(),
                amount: paymentAmount,
                type: paymentType,
                date: new Date().toISOString(),
                appliedTo: this._applyPayment(loan, paymentAmount)
            };
            
            // Update loan
            loan.totalPaid += paymentAmount;
            loan.remainingBalance -= payment.appliedTo.principal;
            loan.paymentsMade += 1;
            loan.remainingTerms -= (paymentType === 'regular' ? 1 : 0);
            
            // Check if loan is paid off
            if (loan.remainingBalance <= 0.01) {
                loan.status = 'completed';
                loan.completedAt = new Date().toISOString();
                loan.remainingBalance = 0;
                loan.remainingTerms = 0;
            }
            
            // Add payment to history
            if (!loan.paymentHistory) loan.paymentHistory = [];
            loan.paymentHistory.push(payment);
            
            // Update next due date for regular payments
            if (paymentType === 'regular' && loan.status === 'active') {
                loan.nextDueDate = this._calculateNextDueDate();
            }
            
            // Save updated loans
            localStorage.setItem('termLoans', JSON.stringify(loans));
            
            return {
                success: true,
                payment,
                updatedLoan: loan
            };
            
        } catch (error) {
            console.error('Error making payment:', error);
            throw error;
        }
    },

    // Apply payment to principal and interest
    _applyPayment(loan, paymentAmount) {
        const currentScheduleItem = loan.amortizationSchedule[loan.paymentsMade] || {};
        const scheduledInterest = currentScheduleItem.interestPayment || 0;
        
        let interestPayment = Math.min(paymentAmount, scheduledInterest);
        let principalPayment = Math.max(0, paymentAmount - interestPayment);
        
        // Ensure we don't pay more principal than remaining balance
        principalPayment = Math.min(principalPayment, loan.remainingBalance);
        
        return {
            interest: interestPayment,
            principal: principalPayment,
            total: interestPayment + principalPayment
        };
    },

    // Get loan summary for dashboard
    getLoanSummary() {
        const activeLoans = this.getActiveTermLoans();
        
        const summary = {
            totalLoans: activeLoans.length,
            totalOutstanding: 0,
            totalMonthlyPayments: 0,
            nextPaymentDue: null,
            loans: []
        };
        
        activeLoans.forEach(loan => {
            summary.totalOutstanding += loan.remainingBalance;
            summary.totalMonthlyPayments += loan.emi;
            
            // Find earliest due date
            if (!summary.nextPaymentDue || loan.nextDueDate < summary.nextPaymentDue) {
                summary.nextPaymentDue = loan.nextDueDate;
            }
            
            summary.loans.push({
                id: loan.id,
                amount: loan.loanAmount,
                remainingBalance: loan.remainingBalance,
                emi: loan.emi,
                remainingTerms: loan.remainingTerms,
                nextDueDate: loan.nextDueDate
            });
        });
        
        return summary;
    }
};

// Create sample loans for demo purposes
TermLoanManager.createSampleLoans = function() {
    // Check if sample loans already exist
    const existingLoans = this.getAllTermLoans();
    if (existingLoans.length > 0) {
        return; // Don't create duplicates
    }
    
    // Create 3 sample term loans with different statuses
    const sampleLoans = [
        {
            id: 'TL' + Date.now() + 'w13',
            loanAmount: 2000,
            termMonths: 12,
            annualRate: 0.08,
            emi: 173.98,
            totalInterest: 87.76,
            totalAmount: 2087.76,
            processingFee: 50,
            remainingBalance: 1839.35,
            totalPaid: 210.65,
            paymentsMade: 1,
            remainingTerms: 11,
            status: 'active',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            paymentHistory: []
        },
        {
            id: 'TL' + (Date.now() + 1000) + 'geqjd',
            loanAmount: 2000,
            termMonths: 12,
            annualRate: 0.08,
            emi: 173.98,
            totalInterest: 87.76,
            totalAmount: 2087.76,
            processingFee: 50,
            remainingBalance: 2000,
            totalPaid: 50, // Only processing fee paid
            paymentsMade: 0,
            remainingTerms: 12,
            status: 'active',
            createdAt: new Date().toISOString(),
            nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            paymentHistory: []
        },
        {
            id: 'TL' + (Date.now() + 2000) + 'qnsnp',
            loanAmount: 5000,
            termMonths: 24,
            annualRate: 0.095,
            emi: 229.57,
            totalInterest: 509.68,
            totalAmount: 5509.68,
            processingFee: 125,
            remainingBalance: 5000,
            totalPaid: 125, // Only processing fee paid
            paymentsMade: 0,
            remainingTerms: 24,
            status: 'active',
            createdAt: new Date().toISOString(),
            nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            paymentHistory: []
        }
    ];
    
    // Save to localStorage
    try {
        localStorage.setItem('termLoans', JSON.stringify(sampleLoans));
        console.log('Sample term loans created:', sampleLoans.length);
    } catch (error) {
        console.error('Error creating sample loans:', error);
    }
};

// Auto-create sample loans when the module loads (for demo purposes)
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure everything is loaded
    setTimeout(() => {
        if (typeof TermLoanManager !== 'undefined') {
            TermLoanManager.createSampleLoans();
        }
    }, 100);
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TermLoanManager = TermLoanManager;
}
