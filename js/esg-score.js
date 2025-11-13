// ESG-score.js - ESG scorecard and carbon tracking

document.addEventListener('DOMContentLoaded', () => {
  // Initialize ESG data
  loadESGData();

  // Buttons
  const requestDetailedReport = document.getElementById('requestDetailedReport');
  const viewDataSources = document.getElementById('viewDataSources');

  // Recommendation actions
  const recommendationActions = document.querySelectorAll('.recommendation-actions button');

  // Request detailed report
  if (requestDetailedReport) {
    requestDetailedReport.addEventListener('click', async () => {
      speak('Generating your detailed ESG report. This may take a moment.', false);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      speak('Your detailed ESG report is ready. Check your email for the download link.');
      
      // In real app, would call API
      console.log('Requesting detailed ESG report...');
    });
  }

  // View data sources
  if (viewDataSources) {
    viewDataSources.addEventListener('click', () => {
      speak('Opening data sources documentation.', false);
      
      // In real app, would open a modal or new page
      const sources = `
Data Sources for ESG Calculation:

Environmental Data:
- IPCC Emission Factors Database (2024)
- UAE Ministry of Climate Change & Environment
- Global Carbon Atlas
- International Energy Agency (IEA)

Social & Governance Data:
- B Corp Certification Database
- Fair Trade International
- UN Global Compact Participants
- Local Business Registry (UAE)

Merchant Carbon Footprint:
- Direct emissions from merchant reporting
- Industry-standard emission factors by MCC
- Supply chain transparency scores
- Third-party certifications and audits
      `;
      
      console.log(sources);
      alert('Data sources information logged to console');
    });
  }

  // Recommendation actions
  recommendationActions.forEach(btn => {
    btn.addEventListener('click', function() {
      const action = this.textContent.trim();
      const card = this.closest('.recommendation-card');
      const title = card?.querySelector('h4')?.textContent;

      if (action.includes('Dismiss') || action.includes('Not Interested')) {
        card?.remove();
        speak(`Recommendation dismissed.`, false);
      } else {
        speak(`Opening more information about ${title}`, false);
        console.log('Action:', action, 'for recommendation:', title);
      }
    });
  });

  // Animate progress bars and circles on page load
  animateESGVisuals();
});

// Load ESG data from mock API
const loadESGData = async () => {
  try {
    const data = await mockAPI.getESGData('account_123');
    console.log('ESG Data loaded:', data);
    
    // Update display with real data
    updateESGScore(data.score);
    updateCarbonData(data.carbonFootprint, data.carbonSaved);
    updateBreakdown(data.environmental, data.social, data.governance);
    updateCarbonChart(data.breakdown);
    
    // Update new carbon reduction features
    updatePointsDisplay(data);
    updatePersonalBest(data.personalBest);
    updateLeaderboard(data.leaderboard);
    updateTrendGraph(data.monthlyTrend);
    updateOffsetEquivalents(data.offsetEquivalents);
    updateChallenges(data.challenges);
    
  } catch (error) {
    console.error('Error loading ESG data:', error);
  }
};

// Update ESG score display
const updateESGScore = (score) => {
  const scoreText = document.querySelector('.score-circle text:first-child');
  const scoreCircle = document.querySelector('.score-circle circle:last-child');
  
  if (scoreText) {
    scoreText.textContent = score;
  }

  if (scoreCircle) {
    // Calculate stroke offset for circular progress
    const circumference = 502.65;
    const percent = score / 100;
    const offset = circumference - (percent * circumference);
    scoreCircle.style.strokeDashoffset = offset;
  }
};

// Update carbon data
const updateCarbonData = (current, saved) => {
  const currentEl = document.querySelector('.carbon-card:first-child .carbon-value');
  const savedEl = document.querySelector('.carbon-card:nth-child(2) .carbon-value');

  if (currentEl) {
    currentEl.textContent = `${current} kg CO₂e`;
  }
  if (savedEl) {
    savedEl.textContent = `${saved} kg CO₂e`;
  }
};

// Update ESG breakdown bars
const updateBreakdown = (environmental, social, governance) => {
  const bars = document.querySelectorAll('.breakdown-fill');
  const values = [environmental, social, governance];

  bars.forEach((bar, index) => {
    if (values[index]) {
      bar.style.width = `${values[index]}%`;
    }
  });

  const valueTexts = document.querySelectorAll('.breakdown-value');
  valueTexts.forEach((text, index) => {
    if (values[index]) {
      text.textContent = `${values[index]}/100`;
    }
  });
};

// Update carbon breakdown chart
const updateCarbonChart = (breakdown) => {
  if (!breakdown) return;

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Transport bar
  const transportBar = document.querySelector('.chart-bar:nth-child(1) .bar-fill');
  const transportValue = document.querySelector('.chart-bar:nth-child(1) .bar-label span:last-child');
  if (transportBar && breakdown.transport) {
    const percent = (breakdown.transport / total) * 100;
    transportBar.style.width = `${percent}%`;
    if (transportValue) {
      transportValue.textContent = `${breakdown.transport} kg CO₂e`;
    }
  }

  // Food bar
  const foodBar = document.querySelector('.chart-bar:nth-child(2) .bar-fill');
  const foodValue = document.querySelector('.chart-bar:nth-child(2) .bar-label span:last-child');
  if (foodBar && breakdown.food) {
    const percent = (breakdown.food / total) * 100;
    foodBar.style.width = `${percent}%`;
    if (foodValue) {
      foodValue.textContent = `${breakdown.food} kg CO₂e`;
    }
  }

  // Energy bar
  const energyBar = document.querySelector('.chart-bar:nth-child(3) .bar-fill');
  const energyValue = document.querySelector('.chart-bar:nth-child(3) .bar-label span:last-child');
  if (energyBar && breakdown.energy) {
    const percent = (breakdown.energy / total) * 100;
    energyBar.style.width = `${percent}%`;
    if (energyValue) {
      energyValue.textContent = `${breakdown.energy} kg CO₂e`;
    }
  }

  // Shopping bar
  const shoppingBar = document.querySelector('.chart-bar:nth-child(4) .bar-fill');
  const shoppingValue = document.querySelector('.chart-bar:nth-child(4) .bar-label span:last-child');
  if (shoppingBar && breakdown.shopping) {
    const percent = (breakdown.shopping / total) * 100;
    shoppingBar.style.width = `${percent}%`;
    if (shoppingValue) {
      shoppingValue.textContent = `${breakdown.shopping} kg CO₂e`;
    }
  }
};

// Animate ESG visuals on page load
const animateESGVisuals = () => {
  // Animate score circle
  const scoreCircle = document.querySelector('.score-circle circle:last-child');
  if (scoreCircle) {
    const finalOffset = scoreCircle.style.strokeDashoffset || '110.58';
    scoreCircle.style.strokeDashoffset = '565.48'; // Start at 0
    
    setTimeout(() => {
      scoreCircle.style.transition = 'stroke-dashoffset 1.5s ease-out';
      scoreCircle.style.strokeDashoffset = finalOffset;
    }, 100);
  }

  // Animate breakdown bars
  const breakdownBars = document.querySelectorAll('.breakdown-fill');
  breakdownBars.forEach((bar, index) => {
    const finalWidth = bar.style.width || '0%';
    bar.style.width = '0%';
    
    setTimeout(() => {
      bar.style.transition = 'width 1s ease-out';
      bar.style.width = finalWidth;
    }, 300 + (index * 100));
  });

  // Animate carbon chart bars
  const chartBars = document.querySelectorAll('.bar-fill');
  chartBars.forEach((bar, index) => {
    const finalWidth = bar.style.width || '0%';
    bar.style.width = '0%';
    
    setTimeout(() => {
      bar.style.transition = 'width 1s ease-out';
      bar.style.width = finalWidth;
    }, 600 + (index * 150));
  });

  // Animate timeline points
  const timelinePoints = document.querySelectorAll('.timeline-point');
  timelinePoints.forEach((point, index) => {
    point.style.opacity = '0';
    point.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      point.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      point.style.opacity = '1';
      point.style.transform = 'translateY(0)';
    }, 1000 + (index * 150));
  });
};

// Calculate potential savings (helper for recommendations)
const calculateSavings = (currentCarbon, recommendation) => {
  // Mock calculation
  const savingsPercent = {
    'public-transport': 0.55,
    'ev-charging': 0.75,
    'organic-food': 0.15
  };

  return Math.round(currentCarbon * (savingsPercent[recommendation] || 0.3));
};

// Export ESG report (future feature)
const exportESGReport = async () => {
  speak('Preparing your ESG report for export.', false);
  
  const reportData = {
    score: 78,
    environmental: 75,
    social: 82,
    governance: 77,
    carbonFootprint: 245,
    carbonSaved: 120,
    generatedAt: new Date().toISOString()
  };

  console.log('ESG Report:', reportData);
  
  // In real app, would generate PDF or CSV
  return reportData;
};

// Update points display
const updatePointsDisplay = (data) => {
  const pointsEl = document.getElementById('totalPoints');
  const tierBadgeEl = document.getElementById('currentTierBadge');
  
  if (pointsEl && data.totalPoints) {
    pointsEl.textContent = data.totalPoints;
  }
  
  if (tierBadgeEl && data.tier) {
    const tierClass = data.tier.name.toLowerCase();
    tierBadgeEl.className = `tier-badge ${tierClass}`;
    tierBadgeEl.style.marginTop = '12px';
    tierBadgeEl.style.fontSize = '1.125rem';
    tierBadgeEl.textContent = `${data.tier.icon} ${data.tier.name} Tier`;
  }
};

// Update personal best
const updatePersonalBest = (personalBest) => {
  if (!personalBest) return;
  
  const valueEl = document.getElementById('personalBestValue');
  const dateEl = document.getElementById('personalBestDate');
  
  if (valueEl) {
    valueEl.textContent = `${personalBest.reduction} kg`;
  }
  
  if (dateEl) {
    dateEl.textContent = personalBest.month;
  }
};

// Update leaderboard
const updateLeaderboard = (leaderboard) => {
  const listEl = document.getElementById('leaderboardList');
  if (!listEl || !leaderboard) return;
  
  listEl.innerHTML = leaderboard.map(user => `
    <div class="leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}">
      <div class="leaderboard-rank ${user.rank <= 3 ? 'top-' + user.rank : ''}">
        ${user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
      </div>
      <div class="leaderboard-user">
        <div class="leaderboard-name">${user.name}</div>
        <div class="leaderboard-tier">${user.tier} Tier</div>
      </div>
      <div class="leaderboard-points">
        <span>${user.points}</span>
        <span style="font-size: 0.875rem; color: #6b7280;">pts</span>
      </div>
    </div>
  `).join('');
};

// Update trend graph
const updateTrendGraph = (monthlyTrend) => {
  const chartEl = document.getElementById('trendChart');
  if (!chartEl || !monthlyTrend) return;
  
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const maxValue = Math.max(...monthlyTrend.map(Math.abs));
  
  chartEl.innerHTML = monthlyTrend.map((value, index) => {
    const height = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 20;
    const isNegative = value < 0;
    
    return `
      <div class="trend-bar ${isNegative ? 'negative' : ''}" 
           style="height: ${height}%"
           title="${months[index]}: ${value}% ${isNegative ? 'increase' : 'reduction'}">
        <span class="trend-bar-value">${value > 0 ? '+' : ''}${value}%</span>
        <span class="trend-bar-label">${months[index]}</span>
      </div>
    `;
  }).join('');
};

// Update offset equivalents
const updateOffsetEquivalents = (equivalents) => {
  const gridEl = document.getElementById('equivalentsGrid');
  if (!gridEl || !equivalents) return;
  
  const items = [
    { icon: '🌳', value: equivalents.trees, label: 'Trees Planted' },
    { icon: '🚗', value: equivalents.carKm, label: 'km Not Driven' },
    { icon: '🍔', value: equivalents.meals, label: 'Meals Saved' },
    { icon: '📱', value: equivalents.phones, label: 'Phones Charged (1yr)' }
  ];
  
  gridEl.innerHTML = items.map(item => `
    <div class="equivalent-item">
      <div class="equivalent-icon">${item.icon}</div>
      <span class="equivalent-value">${item.value}</span>
      <span class="equivalent-label">${item.label}</span>
    </div>
  `).join('');
};

// Update challenges
const updateChallenges = (challenges) => {
  const gridEl = document.getElementById('challengesGrid');
  if (!gridEl || !challenges) return;
  
  gridEl.innerHTML = challenges.map(challenge => `
    <div class="challenge-card">
      <div class="challenge-header">
        <div class="challenge-icon">${challenge.icon}</div>
        <div style="flex: 1;">
          <h4 class="challenge-title">${challenge.title}</h4>
          <span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
        </div>
      </div>
      <p class="challenge-description">${challenge.description}</p>
      <div class="challenge-rewards">
        <div class="challenge-reward">
          <span class="challenge-reward-value">${challenge.potentialPoints}</span>
          <span class="challenge-reward-label">Points</span>
        </div>
        <div class="challenge-reward">
          <span class="challenge-reward-value">${challenge.potentialSavings} kg</span>
          <span class="challenge-reward-label">CO₂ Saved</span>
        </div>
      </div>
      <div class="challenge-deadline">⏰ Due: ${challenge.deadline}</div>
      <div class="challenge-actions">
        <button class="challenge-accept" onclick="acceptChallenge('${challenge.id}')">Accept Challenge</button>
        <button class="challenge-dismiss" onclick="dismissChallenge('${challenge.id}')">Maybe Later</button>
      </div>
    </div>
  `).join('');
};

// Challenge handlers
window.acceptChallenge = (challengeId) => {
  speak('Challenge accepted! Track your progress in the challenges section.', false);
  console.log('Accepted challenge:', challengeId);
  
  // In real app, would save to backend
  const existingChallenges = JSON.parse(localStorage.getItem('activeChallenges') || '[]');
  existingChallenges.push({
    id: challengeId,
    acceptedAt: new Date().toISOString(),
    status: 'active'
  });
  localStorage.setItem('activeChallenges', JSON.stringify(existingChallenges));
};

window.dismissChallenge = (challengeId) => {
  speak('Challenge dismissed.', false);
  console.log('Dismissed challenge:', challengeId);
  
  // Remove challenge from display
  const card = event.target.closest('.challenge-card');
  if (card) {
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
  }
};

// Voice command to read ESG score
if (window.location.pathname.includes('esg-score')) {
  window.addEventListener('load', () => {
    const score = document.querySelector('.score-circle text:first-child')?.textContent;
    if (score) {
      console.log(`ESG Score loaded: ${score}/100`);
    }
  });
}
