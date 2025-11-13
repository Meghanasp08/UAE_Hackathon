// Journey Engine - Interactive User Onboarding & Feature Discovery
// Orchestrates step-by-step guided tours with spotlight highlighting

class JourneyEngine {
  constructor() {
    this.currentJourney = null;
    this.currentStep = 0;
    this.journeys = {};
    this.completedJourneys = this.loadCompletedJourneys();
    this.overlay = null;
    this.spotlight = null;
    this.tooltip = null;
  }

  // Load completed journeys from localStorage
  loadCompletedJourneys() {
    const stored = localStorage.getItem('completedJourneys');
    return stored ? JSON.parse(stored) : [];
  }

  // Save completed journey
  saveCompletedJourney(journeyId) {
    if (!this.completedJourneys.includes(journeyId)) {
      this.completedJourneys.push(journeyId);
      localStorage.setItem('completedJourneys', JSON.stringify(this.completedJourneys));
    }
  }

  // Register a journey
  registerJourney(journey) {
    this.journeys[journey.id] = journey;
  }

  // Start a journey
  startJourney(journeyId) {
    const journey = this.journeys[journeyId];
    if (!journey) {
      console.error(`Journey ${journeyId} not found`);
      return;
    }

    // Check if already completed and user preference
    if (this.completedJourneys.includes(journeyId)) {
      const restart = confirm(`You've already completed "${journey.name}". Start again?`);
      if (!restart) return;
    }

    this.currentJourney = journey;
    this.currentStep = 0;

    // Create overlay and UI
    this.createOverlay();
    this.showStep(0);

    // Track journey start
    this.trackEvent('journey_started', { journeyId, name: journey.name });
  }

  // Create overlay elements
  createOverlay() {
    // Remove existing overlay if any
    this.removeOverlay();

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'journeyOverlay';
    this.overlay.className = 'journey-overlay';

    // Create spotlight
    this.spotlight = document.createElement('div');
    this.spotlight.id = 'journeySpotlight';
    this.spotlight.className = 'journey-spotlight';

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'journeyTooltip';
    this.tooltip.className = 'journey-tooltip';

    // Add to DOM
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.spotlight);
    document.body.appendChild(this.tooltip);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  // Remove overlay
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.spotlight) {
      this.spotlight.remove();
      this.spotlight = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    
    // Remove bottom bar
    const bottomBar = document.getElementById('journeyBottomBar');
    if (bottomBar) {
      bottomBar.remove();
    }
    
    document.body.style.overflow = '';
  }

  // Show specific step
  showStep(stepIndex) {
    if (!this.currentJourney) return;

    const step = this.currentJourney.steps[stepIndex];
    if (!step) {
      this.completeJourney();
      return;
    }

    this.currentStep = stepIndex;

    // Execute pre-step action
    if (step.beforeAction) {
      step.beforeAction();
    }

    // Highlight element
    if (step.element) {
      this.highlightElement(step.element);
    } else {
      this.spotlight.style.display = 'none';
    }

    // Show tooltip
    this.showTooltip(step);

    // Track step view
    this.trackEvent('journey_step_viewed', {
      journeyId: this.currentJourney.id,
      step: stepIndex,
      title: step.title
    });
  }

  // Highlight element with spotlight
  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element ${selector} not found`);
      this.spotlight.style.display = 'none';
      return;
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Get element position and size
    const rect = element.getBoundingClientRect();
    const padding = 8;

    // Position spotlight
    this.spotlight.style.display = 'block';
    this.spotlight.style.left = `${rect.left - padding}px`;
    this.spotlight.style.top = `${rect.top - padding}px`;
    this.spotlight.style.width = `${rect.width + padding * 2}px`;
    this.spotlight.style.height = `${rect.height + padding * 2}px`;

    // Add pulsing class
    this.spotlight.classList.add('journey-spotlight-pulse');

    // Store highlighted element for interactions
    element.setAttribute('data-journey-highlighted', 'true');
  }

  // Show tooltip
  showTooltip(step) {
    const totalSteps = this.currentJourney.steps.length;
    
    // Generate progress dots
    let dotsHTML = '';
    for (let i = 0; i < totalSteps; i++) {
      dotsHTML += `<div class="journey-progress-dot ${i === this.currentStep ? 'active' : ''}"></div>`;
    }

    this.tooltip.innerHTML = `
      <div class="journey-tooltip-header">
        <h3 class="journey-tooltip-title">${step.title}</h3>
        <button class="journey-tooltip-close" id="journeyClose" aria-label="Close journey">×</button>
      </div>
      
      <div class="journey-tooltip-content">
        <p>${step.description}</p>
        ${step.tip ? `<div class="journey-tooltip-tip">💡 ${step.tip}</div>` : ''}
      </div>

      <div class="journey-tooltip-progress">
        <div class="journey-tooltip-progress-dots">
          ${dotsHTML}
        </div>
        <div class="journey-tooltip-progress-text">${this.currentStep + 1}/${totalSteps}</div>
      </div>

      <div class="journey-tooltip-actions">
        ${this.currentStep > 0 ? '<button class="journey-btn journey-btn-secondary" id="journeyPrevDesktop">←</button>' : ''}
        <button class="journey-btn journey-btn-skip" id="journeySkipDesktop">Skip</button>
        ${this.currentStep < totalSteps - 1 ? 
          '<button class="journey-btn journey-btn-primary" id="journeyNextDesktop">Next →</button>' : 
          '<button class="journey-btn journey-btn-primary" id="journeyCompleteDesktop">Complete ✓</button>'}
      </div>
    `;

    // Create or update bottom bar
    this.showBottomBar();

    // Position tooltip
    this.positionTooltip(step);

    // Add event listeners
    this.attachTooltipListeners();
  }

  // Show floating bottom button bar
  showBottomBar() {
    const totalSteps = this.currentJourney.steps.length;
    
    // Remove existing bottom bar if any
    const existingBar = document.getElementById('journeyBottomBar');
    if (existingBar) {
      existingBar.remove();
    }

    // Create bottom bar
    const bottomBar = document.createElement('div');
    bottomBar.id = 'journeyBottomBar';
    bottomBar.className = 'journey-bottom-bar';

    bottomBar.innerHTML = `
      ${this.currentStep > 0 ? '<button class="journey-btn journey-btn-prev-icon" id="journeyPrev" aria-label="Previous">←</button>' : ''}
      <button class="journey-btn journey-btn-skip" id="journeySkip">Skip</button>
      ${this.currentStep < totalSteps - 1 ? 
        '<button class="journey-btn journey-btn-primary" id="journeyNext">Next →</button>' : 
        '<button class="journey-btn journey-btn-primary" id="journeyComplete">Complete ✓</button>'}
    `;

    document.body.appendChild(bottomBar);

    // Add event listeners to bottom bar buttons
    const nextBtn = document.getElementById('journeyNext');
    const prevBtn = document.getElementById('journeyPrev');
    const skipBtn = document.getElementById('journeySkip');
    const completeBtn = document.getElementById('journeyComplete');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipJourney());
    }
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeJourney());
    }
  }

  // Position tooltip relative to highlighted element
  positionTooltip(step) {
    if (!step.element) {
      // Center tooltip if no element
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const element = document.querySelector(step.element);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const position = step.position || 'bottom';

    let left, top;

    switch (position) {
      case 'top':
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        top = rect.top - tooltipRect.height - 20;
        break;
      case 'bottom':
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        top = rect.bottom + 20;
        break;
      case 'left':
        left = rect.left - tooltipRect.width - 20;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        left = rect.right + 20;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        break;
      default:
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        top = rect.bottom + 20;
    }

    // Keep tooltip within viewport
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.transform = 'none';
  }

  // Attach event listeners to tooltip buttons
  attachTooltipListeners() {
    const closeBtn = document.getElementById('journeyClose');
    
    // Desktop buttons
    const nextBtnDesktop = document.getElementById('journeyNextDesktop');
    const prevBtnDesktop = document.getElementById('journeyPrevDesktop');
    const skipBtnDesktop = document.getElementById('journeySkipDesktop');
    const completeBtnDesktop = document.getElementById('journeyCompleteDesktop');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.skipJourney());
    }
    if (nextBtnDesktop) {
      nextBtnDesktop.addEventListener('click', () => this.nextStep());
    }
    if (prevBtnDesktop) {
      prevBtnDesktop.addEventListener('click', () => this.previousStep());
    }
    if (skipBtnDesktop) {
      skipBtnDesktop.addEventListener('click', () => this.skipJourney());
    }
    if (completeBtnDesktop) {
      completeBtnDesktop.addEventListener('click', () => this.completeJourney());
    }
  }

  // Next step
  nextStep() {
    const step = this.currentJourney.steps[this.currentStep];
    
    // Execute post-step action
    if (step.afterAction) {
      step.afterAction();
    }

    this.showStep(this.currentStep + 1);
  }

  // Previous step
  previousStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  // Skip journey
  skipJourney() {
    if (confirm('Are you sure you want to skip this tour? You can restart it anytime from Help.')) {
      this.trackEvent('journey_skipped', {
        journeyId: this.currentJourney.id,
        stepsCompleted: this.currentStep + 1
      });
      this.endJourney();
    }
  }

  // Complete journey
  completeJourney() {
    const journeyId = this.currentJourney.id;
    const journeyName = this.currentJourney.name;

    // Save as completed
    this.saveCompletedJourney(journeyId);

    // Track completion
    this.trackEvent('journey_completed', {
      journeyId: journeyId,
      name: journeyName
    });

    // Show completion message
    if (typeof notificationService !== 'undefined') {
      notificationService.create({
        title: `${journeyName} Complete! 🎉`,
        message: 'You\'ve mastered this feature. Keep exploring!',
        type: 'achievement',
        category: 'achievement',
        priority: 'normal'
      });
    }

    // Voice confirmation
    if (typeof speak === 'function') {
      speak(`Congratulations! You completed the ${journeyName} tour`);
    }

    this.endJourney();
  }

  // End journey
  endJourney() {
    this.removeOverlay();
    this.currentJourney = null;
    this.currentStep = 0;

    // Remove highlighted attributes
    document.querySelectorAll('[data-journey-highlighted]').forEach(el => {
      el.removeAttribute('data-journey-highlighted');
    });
  }

  // Check if user is new (for auto-start)
  isNewUser() {
    return !localStorage.getItem('hasSeenOnboarding');
  }

  // Mark as not new
  markAsReturningUser() {
    localStorage.setItem('hasSeenOnboarding', 'true');
  }

  // Track events (can be sent to analytics)
  trackEvent(eventName, data) {
    console.log(`[Journey Event] ${eventName}:`, data);
    // In production, send to analytics service
  }

  // Get journey progress
  getProgress(journeyId) {
    return this.completedJourneys.includes(journeyId) ? 100 : 0;
  }

  // Show journey menu
  showJourneyMenu() {
    const journeyList = Object.values(this.journeys).map(journey => {
      const isCompleted = this.completedJourneys.includes(journey.id);
      return `
        <div class="journey-menu-item ${isCompleted ? 'completed' : ''}">
          <div class="journey-menu-info">
            <h4>${journey.name}</h4>
            <p>${journey.description}</p>
            <small>${journey.steps.length} steps • ${journey.estimatedTime}</small>
          </div>
          <button class="journey-btn journey-btn-primary" onclick="journeyEngine.startJourney('${journey.id}')">
            ${isCompleted ? 'Restart' : 'Start'} ${isCompleted ? '✓' : ''}
          </button>
        </div>
      `;
    }).join('');

    // Show in modal or dedicated UI
    alert('Journey menu would appear here. Call journeyEngine.startJourney(id) to start a tour.');
  }
}

// Initialize journey engine
const journeyEngine = new JourneyEngine();

// Define Onboarding Journey
journeyEngine.registerJourney({
  id: 'onboarding',
  name: 'Welcome Tour',
  description: 'Learn the basics of your Shukria Smart Credit platform',
  estimatedTime: '2 min',
  steps: [
    {
      title: 'Welcome to Shukria! 👋',
      description: 'This quick tour will help you understand your smart credit platform. Let\'s explore the key features together.',
      tip: 'You can skip this tour anytime and restart it from the help menu.',
      element: null,
      position: 'center'
    },
    {
      title: 'Your Financial Dashboard',
      description: 'Here you can see your available credit, current usage, and loan eligibility at a glance. These numbers update in real-time.',
      tip: 'Click on any card to see more details about that metric.',
      element: '.cards',
      position: 'bottom'
    },
    {
      title: 'Voice Commands',
      description: 'Click this microphone to use voice commands. Try saying "Show balance" or "Go to transactions". All commands end with "Shukria"!',
      tip: 'Voice works best in Chrome, Edge, or Safari browsers.',
      element: '#voiceBtn',
      position: 'left'
    },
    {
      title: 'Navigation Menu',
      description: 'Use these tabs to navigate between Dashboard, Credit Line management, Applications, Accounts, and Transactions.',
      tip: 'You can also use voice commands like "Go to credit line" to navigate.',
      element: '.nav-links',
      position: 'bottom'
    },
    {
      title: 'ESG & Carbon Tracking',
      description: 'Track your environmental impact! Your ESG score and carbon footprint are calculated from your transactions.',
      tip: 'Choose greener alternatives to earn carbon points and improve your score.',
      element: '.esg-card',
      position: 'top',
      beforeAction: () => {
        // Ensure ESG card is visible
        const esgCard = document.querySelector('.esg-card');
        if (esgCard) esgCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    {
      title: 'You\'re All Set! 🎉',
      description: 'You\'ve completed the basics! Explore the platform and discover features like SmartPay automation, AI chatbot, and more.',
      tip: 'Access this tour anytime from the help menu.',
      element: null,
      position: 'center'
    }
  ]
});

// Define Credit Line Journey
journeyEngine.registerJourney({
  id: 'credit-line-tour',
  name: 'Credit Line Management',
  description: 'Master your credit line with SmartPay rules and auto-sweep',
  estimatedTime: '3 min',
  steps: [
    {
      title: 'Welcome to Credit Management',
      description: 'Here you can withdraw, repay, and automate your credit line with smart rules.',
      element: null
    },
    {
      title: 'Quick Actions',
      description: 'Use these buttons to quickly withdraw, repay, or transfer funds. Try them now!',
      element: '.quick-actions',
      position: 'bottom'
    },
    {
      title: 'SmartPay Rules',
      description: 'Create automated repayment rules based on your balance, schedule, or transaction patterns.',
      element: '.smartpay-section',
      position: 'top'
    },
    {
      title: 'Auto-Sweep Feature',
      description: 'Enable auto-sweep to automatically pay off your credit balance when your account has surplus funds.',
      element: '.auto-sweep-toggle',
      position: 'bottom'
    }
  ]
});

// Define ESG Journey
journeyEngine.registerJourney({
  id: 'esg-tour',
  name: 'ESG Score & Carbon Tracking',
  description: 'Understand your environmental impact and earn rewards',
  estimatedTime: '2 min',
  steps: [
    {
      title: 'Your ESG Score',
      description: 'Your ESG score is calculated from Environmental, Social, and Governance factors in your transactions.',
      element: '.esg-score-display',
      position: 'bottom'
    },
    {
      title: 'Carbon Footprint',
      description: 'Track your carbon emissions by category. Each transaction shows its environmental impact.',
      element: '.carbon-breakdown',
      position: 'top'
    },
    {
      title: 'Carbon Points & Tiers',
      description: 'Earn carbon points by reducing emissions. Advance through Bronze, Silver, Gold, Platinum, and Diamond tiers!',
      element: '.tier-badge',
      position: 'bottom'
    },
    {
      title: 'Greener Alternatives',
      description: 'We suggest eco-friendly alternatives for your transactions to help reduce your footprint.',
      element: '.greener-alternatives',
      position: 'top'
    }
  ]
});

// Auto-start onboarding for new users
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (journeyEngine.isNewUser() && window.location.pathname.includes('index.html')) {
      setTimeout(() => {
        if (confirm('Welcome to Shukria! Would you like a quick tour of the platform?')) {
          journeyEngine.startJourney('onboarding');
        }
        journeyEngine.markAsReturningUser();
      }, 2000);
    }
  });
} else {
  if (journeyEngine.isNewUser() && window.location.pathname.includes('index.html')) {
    setTimeout(() => {
      if (confirm('Welcome to Shukria! Would you like a quick tour of the platform?')) {
        journeyEngine.startJourney('onboarding');
      }
      journeyEngine.markAsReturningUser();
    }, 2000);
  }
}
