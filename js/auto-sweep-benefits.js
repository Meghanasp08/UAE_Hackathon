// Auto-sweep benefits calculator and display logic

class AutoSweepBenefits {
    constructor() {
        this.stats = {
            interestSaved: 0,
            autoPayments: 0,
            timeSaved: 0,
            cashEfficiency: 0,
            benefitsList: []
        };
        
        // Historical data for calculations
        this.sweepHistory = [];
        this.lastUpdate = new Date();
    }

    // Add a new auto-sweep transaction to history
    addSweepTransaction(amount, date) {
        this.sweepHistory.push({ amount, date });
        this.calculateBenefits();
        this.updateDisplay();
    }

    // Calculate all benefits based on sweep history
    calculateBenefits() {
        this.calculateInterestSavings();
        this.calculateAutoPayments();
        this.calculateTimeSavings();
        this.calculateCashEfficiency();
        this.generateBenefitsSummary();
    }

    // Calculate interest savings based on sweep amounts and timing
    calculateInterestSavings() {
        const APR = 0.089; // 8.9% annual interest rate
        let totalSaved = 0;
        
        this.sweepHistory.forEach(sweep => {
            const daysToNextPayment = 30; // Assuming monthly payment cycle
            const dailyRate = APR / 365;
            totalSaved += sweep.amount * dailyRate * daysToNextPayment;
        });

        this.stats.interestSaved = totalSaved;
    }

    // Count auto-payments in last 30 days
    calculateAutoPayments() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.stats.autoPayments = this.sweepHistory.filter(sweep => 
            new Date(sweep.date) >= thirtyDaysAgo
        ).length;
    }

    // Calculate time saved from manual payments
    calculateTimeSavings() {
        // Assume 10 minutes saved per manual payment avoided
        const minutesPerPayment = 10;
        this.stats.timeSaved = (this.stats.autoPayments * minutesPerPayment) / 60;
    }

    // Calculate cash efficiency improvement
    calculateCashEfficiency() {
        // Simplified calculation based on sweep frequency and timing
        const baseEfficiency = 70; // Base efficiency without auto-sweep
        const sweepBonus = Math.min(this.stats.autoPayments * 2, 20); // Max 20% improvement
        this.stats.cashEfficiency = baseEfficiency + sweepBonus;
    }

    // Generate dynamic benefits summary
    generateBenefitsSummary() {
        this.stats.benefitsList = [
            `Saved AED ${this.stats.interestSaved.toFixed(2)} in interest charges this month`,
            `Automated ${this.stats.autoPayments} payments in the last 30 days`,
            `Saved ${this.stats.timeSaved.toFixed(1)} hours in manual payment processing`,
            `Improved cash utilization by ${this.stats.cashEfficiency - 70}%`
        ];
    }

    // Update the display with new benefits data
    updateDisplay() {
        // Update interest saved
        const interestSavedEl = document.getElementById('interestSaved');
        if (interestSavedEl) {
            interestSavedEl.textContent = `AED ${this.stats.interestSaved.toFixed(2)}`;
        }

        // Update auto-payments count
        const autoPaymentsEl = document.getElementById('autoPayments');
        if (autoPaymentsEl) {
            autoPaymentsEl.textContent = this.stats.autoPayments;
        }

        // Update time saved
        const timeSavedEl = document.getElementById('timeSaved');
        if (timeSavedEl) {
            timeSavedEl.textContent = `${this.stats.timeSaved.toFixed(1)} hrs`;
        }

        // Update cash efficiency
        const cashEfficiencyEl = document.getElementById('cashEfficiency');
        if (cashEfficiencyEl) {
            cashEfficiencyEl.textContent = `${this.stats.cashEfficiency}%`;
        }

        // Update benefits list
        const benefitsListEl = document.getElementById('benefitsList');
        if (benefitsListEl) {
            benefitsListEl.innerHTML = this.stats.benefitsList
                .map(benefit => `<li>${benefit}</li>`)
                .join('');
        }
    }

    // Initialize with demo data
    initializeWithDemoData() {
        const today = new Date();
        const demoSweeps = [
            { amount: 5000, date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000) },
            { amount: 3500, date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000) },
            { amount: 4200, date: new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000) },
            { amount: 3800, date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) }
        ];

        demoSweeps.forEach(sweep => this.addSweepTransaction(sweep.amount, sweep.date));
    }
}

// Initialize benefits tracker
const autoSweepBenefits = new AutoSweepBenefits();

// Add to window for access from other scripts
window.autoSweepBenefits = autoSweepBenefits;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize with demo data
    autoSweepBenefits.initializeWithDemoData();

    // Set up auto-sweep toggle listener to show/hide benefits
    const autoSweepToggle = document.getElementById('autoSweepToggle');
    const sweepBenefits = document.getElementById('sweepBenefits');

    if (autoSweepToggle && sweepBenefits) {
        autoSweepToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                sweepBenefits.style.display = 'block';
            } else {
                sweepBenefits.style.display = 'none';
            }
        });
    }
});