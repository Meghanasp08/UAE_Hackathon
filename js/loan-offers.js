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

document.addEventListener('DOMContentLoaded', renderLoanOffers);
