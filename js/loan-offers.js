// js/loan-offers.js
// Dynamically loads eligible loan offers based on transaction analysis

// Mock transaction data (replace with actual CSV parsing if needed)
const transactions = [
  { date: '2025-10-01', amount: 12000, type: 'credit', description: 'Sales Revenue' },
  { date: '2025-10-03', amount: -3500, type: 'debit', description: 'Supplier Payment' },
  { date: '2025-10-05', amount: -1200, type: 'debit', description: 'Utilities' },
  { date: '2025-10-10', amount: 8000, type: 'credit', description: 'Service Income' },
  { date: '2025-10-15', amount: -2000, type: 'debit', description: 'Payroll' },
  { date: '2025-10-20', amount: 5000, type: 'credit', description: 'Other Income' },
  { date: '2025-10-25', amount: -1000, type: 'debit', description: 'Misc Expense' }
];

// Simple eligibility logic: If net inflow > 10,000, show loan offers
function calculateEligibility(transactions) {
  const netInflow = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  return netInflow > 10000;
}

function getLoanOffers() {
  // Example offers
  return [
    {
      amount: 'AED 500,000',
      rate: '6.5%',
      term: '36 months',
      description: 'Business Expansion Loan'
    },
    {
      amount: 'AED 250,000',
      rate: '7.2%',
      term: '24 months',
      description: 'Working Capital Loan'
    },
    {
      amount: 'AED 1,000,000',
      rate: '5.9%',
      term: '48 months',
      description: 'Asset Purchase Loan'
    }
  ];
}

function renderLoanOffers() {
  const eligible = calculateEligibility(transactions);
  const container = document.getElementById('loanOffersList');
  container.innerHTML = '';
  if (!eligible) {
    container.innerHTML = '<div class="no-offers">You are not currently eligible for loan offers based on your recent transactions.</div>';
    return;
  }
  const offers = getLoanOffers();
  offers.forEach(offer => {
    const card = document.createElement('div');
    card.className = 'loan-offer-card';
    card.innerHTML = `
      <h3>${offer.description}</h3>
      <p><strong>Amount:</strong> ${offer.amount}</p>
      <p><strong>Rate:</strong> ${offer.rate}</p>
      <p><strong>Term:</strong> ${offer.term}</p>
      <button class="btn-primary" onclick="alert('Applied for ${offer.description}')">Apply Now</button>
    `;
    container.appendChild(card);
  });
}

// Term Loan Functionality
function checkTermLoanEligibility() {
  const eligibilityDiv = document.getElementById('termLoanEligibility');
  const maxAmountSpan = document.getElementById('termLoanMaxAmount');
  const applyBtn = document.getElementById('applyTermLoan');
  
  // Mock credit data (in real app, get from API)
  const creditLimit = 15250;
  const currentBalance = 2750;
  const existingTermLoans = TermLoanManager.getActiveTermLoans();
  
  // Check eligibility using TermLoanManager
  const eligibility = TermLoanManager.checkEligibility(creditLimit, currentBalance, existingTermLoans);
  
  if (eligibility.eligible) {
    eligibilityDiv.innerHTML = `
      <div class="eligibility-badge eligible">
        ✅ Eligible
      </div>
      <p class="eligibility-details">
        You can borrow up to <strong>AED ${eligibility.maxLoanAmount.toLocaleString()}</strong>
      </p>
    `;
    
    maxAmountSpan.textContent = `Up to AED ${eligibility.maxLoanAmount.toLocaleString()}`;
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply Now';
    
  } else {
    eligibilityDiv.innerHTML = `
      <div class="eligibility-badge not-eligible">
        ❌ Not Eligible
      </div>
      <div class="eligibility-reasons">
        ${eligibility.reasons.map(reason => `<p class="reason">• ${reason}</p>`).join('')}
      </div>
    `;
    
    applyBtn.disabled = true;
    applyBtn.textContent = 'Not Eligible';
  }
}

function setupTermLoanActions() {
  const applyBtn = document.getElementById('applyTermLoan');
  const learnMoreBtn = document.getElementById('learnMoreTermLoan');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      // Redirect to credit line page with term loan modal
      window.location.href = 'credit-line.html?openTermLoan=true';
    });
  }
  
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      showTermLoanInfo();
    });
  }
}

function showTermLoanInfo() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>About Term Loans</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="info-section">
          <h4>What is a Term Loan?</h4>
          <p>A term loan is a fixed-amount loan with regular monthly payments over a set period. Unlike a credit line, you receive the full amount upfront and pay it back in equal installments.</p>
        </div>
        
        <div class="info-section">
          <h4>Key Features</h4>
          <ul>
            <li>Fixed monthly payments (EMI)</li>
            <li>Competitive interest rates from 8.0% APR</li>
            <li>Flexible terms from 12 to 60 months</li>
            <li>Up to 240% of your credit limit</li>
            <li>Quick approval and disbursement</li>
          </ul>
        </div>
        
        <div class="info-section">
          <h4>Interest Rates</h4>
          <div class="rate-table">
            <div class="rate-row">
              <span>12 months</span>
              <span>8.0% APR</span>
            </div>
            <div class="rate-row">
              <span>24 months</span>
              <span>9.5% APR</span>
            </div>
            <div class="rate-row">
              <span>36 months</span>
              <span>11.0% APR</span>
            </div>
            <div class="rate-row">
              <span>48 months</span>
              <span>12.5% APR</span>
            </div>
            <div class="rate-row">
              <span>60 months</span>
              <span>14.0% APR</span>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <h4>How to Apply</h4>
          <p>Click "Apply Now" to start your application. You'll go through a simple 3-step process:</p>
          <ol>
            <li><strong>Eligibility Check</strong> - We'll verify your qualification</li>
            <li><strong>Loan Calculator</strong> - Choose your amount and term</li>
            <li><strong>Confirmation</strong> - Review and confirm your loan</li>
          </ol>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" onclick="this.closest('.modal').remove()">Got It</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-close')) {
      modal.remove();
    }
  });
  
  document.body.appendChild(modal);
}

document.addEventListener('DOMContentLoaded', () => {
  renderLoanOffers();
  
  // Initialize term loan functionality
  if (typeof TermLoanManager !== 'undefined') {
    checkTermLoanEligibility();
    setupTermLoanActions();
  } else {
    // Fallback if TermLoanManager not loaded
    setTimeout(() => {
      if (typeof TermLoanManager !== 'undefined') {
        checkTermLoanEligibility();
        setupTermLoanActions();
      }
    }, 100);
  }
});
