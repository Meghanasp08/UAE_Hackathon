// Carbon Points System - Gamification for carbon footprint reduction
// Tracks user's carbon reduction achievements and calculates points

const CarbonPointsSystem = {
  // Point calculation constants
  POINTS_PER_KG: 1, // Base: 1 point = 1 kg CO₂e reduced
  MULTIPLIERS: {
    CONSECUTIVE_MONTHS: {
      2: 1.2,
      3: 1.5,
      6: 2.0,
      12: 3.0
    },
    CHALLENGE_COMPLETION: 1.5,
    MILESTONE_BONUS: 2.0
  },

  // Tier thresholds (in points)
  TIERS: {
    BRONZE: { min: 0, max: 49, name: 'Bronze', icon: '🥉', color: '#cd7f32' },
    SILVER: { min: 50, max: 199, name: 'Silver', icon: '🥈', color: '#c0c0c0' },
    GOLD: { min: 200, max: 499, name: 'Gold', icon: '🥇', color: '#ffd700' },
    PLATINUM: { min: 500, max: 999, name: 'Platinum', icon: '💎', color: '#e5e4e2' },
    DIAMOND: { min: 1000, max: Infinity, name: 'Diamond', icon: '💠', color: '#b9f2ff' }
  },

  // Average carbon emissions per category (kg CO₂e per AED spent)
  EMISSION_FACTORS: {
    transport: {
      fuel: 0.35,           // Per AED spent on fuel
      taxi: 0.12,           // Per AED spent on taxi
      metro: 0.02,          // Per AED spent on metro (much lower)
      ev_charging: 0.05     // Per AED spent on EV charging
    },
    food: {
      restaurant: 0.08,     // Per AED spent
      fast_food: 0.12,      // Higher emissions
      organic: 0.04,        // Lower emissions
      grocery: 0.06
    },
    energy: {
      electricity: 0.49,    // kg CO₂e per kWh (UAE grid factor)
      gas: 2.3              // kg CO₂e per cubic meter
    },
    shopping: {
      electronics: 0.15,    // Per AED spent
      clothing: 0.10,
      local: 0.05,          // Local products have lower emissions
      imported: 0.18
    },
    default: 0.10          // Default emission factor
  },

  /**
   * Calculate carbon emissions for a transaction
   * @param {Object} transaction - Transaction object with amount and category
   * @returns {number} Carbon emissions in kg CO₂e
   */
  calculateTransactionCarbon(transaction) {
    const amount = Math.abs(transaction.amount);
    const category = (transaction.category || 'default').toLowerCase();
    const merchant = (transaction.merchant || '').toLowerCase();

    let emissionFactor = this.EMISSION_FACTORS.default;

    // Determine emission factor based on category and merchant
    if (category.includes('transport') || merchant.includes('fuel') || merchant.includes('petrol')) {
      if (merchant.includes('metro') || merchant.includes('bus')) {
        emissionFactor = this.EMISSION_FACTORS.transport.metro;
      } else if (merchant.includes('ev') || merchant.includes('electric')) {
        emissionFactor = this.EMISSION_FACTORS.transport.ev_charging;
      } else if (merchant.includes('taxi') || merchant.includes('uber') || merchant.includes('careem')) {
        emissionFactor = this.EMISSION_FACTORS.transport.taxi;
      } else {
        emissionFactor = this.EMISSION_FACTORS.transport.fuel;
      }
    } else if (category.includes('food') || category.includes('dining')) {
      if (merchant.includes('organic') || merchant.includes('local')) {
        emissionFactor = this.EMISSION_FACTORS.food.organic;
      } else if (merchant.includes('fast') || merchant.includes('mcdonald') || merchant.includes('burger')) {
        emissionFactor = this.EMISSION_FACTORS.food.fast_food;
      } else if (merchant.includes('restaurant') || merchant.includes('cafe')) {
        emissionFactor = this.EMISSION_FACTORS.food.restaurant;
      } else {
        emissionFactor = this.EMISSION_FACTORS.food.grocery;
      }
    } else if (category.includes('bill') || category.includes('utilit')) {
      emissionFactor = this.EMISSION_FACTORS.energy.electricity;
    } else if (category.includes('shopping')) {
      if (merchant.includes('electronic') || merchant.includes('tech')) {
        emissionFactor = this.EMISSION_FACTORS.shopping.electronics;
      } else if (merchant.includes('cloth') || merchant.includes('fashion')) {
        emissionFactor = this.EMISSION_FACTORS.shopping.clothing;
      } else if (merchant.includes('local') || merchant.includes('souk')) {
        emissionFactor = this.EMISSION_FACTORS.shopping.local;
      } else {
        emissionFactor = this.EMISSION_FACTORS.shopping.imported;
      }
    }

    return parseFloat((amount * emissionFactor).toFixed(2));
  },

  /**
   * Calculate carbon impact level for visual badge
   * @param {number} carbonKg - Carbon emissions in kg
   * @returns {Object} Impact level with color and label
   */
  getCarbonImpactLevel(carbonKg) {
    if (carbonKg < 5) {
      return { level: 'low', color: '#16a34a', label: 'Low Impact', icon: '🌱' };
    } else if (carbonKg < 20) {
      return { level: 'medium', color: '#f59e0b', label: 'Medium Impact', icon: '⚠️' };
    } else {
      return { level: 'high', color: '#dc2626', label: 'High Impact', icon: '🔴' };
    }
  },

  /**
   * Calculate total carbon for an array of transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Carbon breakdown by category
   */
  calculateTotalCarbon(transactions) {
    const breakdown = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      other: 0,
      total: 0
    };

    transactions.forEach(txn => {
      const carbon = this.calculateTransactionCarbon(txn);
      const category = (txn.category || 'other').toLowerCase();

      if (category.includes('transport') || category.includes('atm')) {
        breakdown.transport += carbon;
      } else if (category.includes('food') || category.includes('dining')) {
        breakdown.food += carbon;
      } else if (category.includes('bill') || category.includes('utilit')) {
        breakdown.energy += carbon;
      } else if (category.includes('shopping')) {
        breakdown.shopping += carbon;
      } else {
        breakdown.other += carbon;
      }
    });

    // Round all values
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = parseFloat(breakdown[key].toFixed(2));
    });

    breakdown.total = parseFloat((
      breakdown.transport + 
      breakdown.food + 
      breakdown.energy + 
      breakdown.shopping + 
      breakdown.other
    ).toFixed(2));

    return breakdown;
  },

  /**
   * Calculate carbon reduction points
   * @param {number} baseline - Baseline carbon emissions (kg)
   * @param {number} current - Current carbon emissions (kg)
   * @param {number} consecutiveMonths - Number of consecutive months with reduction
   * @returns {Object} Points calculation details
   */
  calculateReductionPoints(baseline, current, consecutiveMonths = 1) {
    const reduction = Math.max(0, baseline - current);
    let basePoints = reduction * this.POINTS_PER_KG;

    // Apply consecutive months multiplier
    let multiplier = 1.0;
    if (consecutiveMonths >= 12) {
      multiplier = this.MULTIPLIERS.CONSECUTIVE_MONTHS[12];
    } else if (consecutiveMonths >= 6) {
      multiplier = this.MULTIPLIERS.CONSECUTIVE_MONTHS[6];
    } else if (consecutiveMonths >= 3) {
      multiplier = this.MULTIPLIERS.CONSECUTIVE_MONTHS[3];
    } else if (consecutiveMonths >= 2) {
      multiplier = this.MULTIPLIERS.CONSECUTIVE_MONTHS[2];
    }

    const totalPoints = Math.round(basePoints * multiplier);

    return {
      reduction: parseFloat(reduction.toFixed(2)),
      basePoints: Math.round(basePoints),
      multiplier,
      totalPoints,
      consecutiveMonths
    };
  },

  /**
   * Get user's tier based on total points
   * @param {number} totalPoints - Total accumulated points
   * @returns {Object} Tier information
   */
  getTier(totalPoints) {
    for (const [key, tier] of Object.entries(this.TIERS)) {
      if (totalPoints >= tier.min && totalPoints <= tier.max) {
        const progress = tier.max === Infinity 
          ? 100 
          : Math.min(100, ((totalPoints - tier.min) / (tier.max - tier.min + 1)) * 100);
        
        return {
          ...tier,
          key,
          currentPoints: totalPoints,
          progress: parseFloat(progress.toFixed(1)),
          nextTier: this.getNextTier(key),
          pointsToNext: tier.max === Infinity ? 0 : tier.max + 1 - totalPoints
        };
      }
    }
    return this.TIERS.BRONZE;
  },

  /**
   * Get next tier information
   * @param {string} currentTierKey - Current tier key
   * @returns {Object|null} Next tier or null if at max
   */
  getNextTier(currentTierKey) {
    const tierKeys = Object.keys(this.TIERS);
    const currentIndex = tierKeys.indexOf(currentTierKey);
    
    if (currentIndex < tierKeys.length - 1) {
      const nextKey = tierKeys[currentIndex + 1];
      return this.TIERS[nextKey];
    }
    return null;
  },

  /**
   * Calculate carbon offset equivalents
   * @param {number} carbonKg - Carbon saved in kg
   * @returns {Object} Equivalent metrics
   */
  getOffsetEquivalents(carbonKg) {
    return {
      trees: parseFloat((carbonKg / 21).toFixed(1)), // 1 tree absorbs ~21kg CO₂/year
      carKm: parseFloat((carbonKg / 0.12).toFixed(0)), // Average car emits 0.12kg/km
      flights: parseFloat((carbonKg / 90).toFixed(2)), // 1 hour flight ~90kg CO₂
      meals: parseFloat((carbonKg / 2.5).toFixed(0)), // Average meal ~2.5kg CO₂
      phones: parseFloat((carbonKg / 0.086).toFixed(0)) // Charging phone for year ~0.086kg
    };
  },

  /**
   * Generate personalized challenges
   * @param {Object} carbonData - User's carbon data
   * @returns {Array} Array of challenge objects
   */
  generateChallenges(carbonData) {
    const challenges = [];
    const breakdown = carbonData.breakdown || {};

    // Transport challenge
    if (breakdown.transport > 50) {
      challenges.push({
        id: 'transport_metro',
        title: 'Metro Commuter',
        description: 'Use Dubai Metro for 5 trips this week',
        category: 'transport',
        potentialSavings: 40,
        potentialPoints: 40,
        difficulty: 'easy',
        icon: '🚇',
        deadline: this.getWeekendDate()
      });
    }

    // Food challenge
    if (breakdown.food > 30) {
      challenges.push({
        id: 'food_local',
        title: 'Local Food Champion',
        description: 'Shop at local organic markets 3 times this month',
        category: 'food',
        potentialSavings: 25,
        potentialPoints: 38, // With multiplier
        difficulty: 'medium',
        icon: '🌿',
        deadline: this.getMonthEndDate()
      });
    }

    // Shopping challenge
    if (breakdown.shopping > 20) {
      challenges.push({
        id: 'shopping_sustainable',
        title: 'Sustainable Shopper',
        description: 'Make 80% of purchases from eco-certified brands',
        category: 'shopping',
        potentialSavings: 15,
        potentialPoints: 23,
        difficulty: 'medium',
        icon: '♻️',
        deadline: this.getMonthEndDate()
      });
    }

    // Energy challenge
    challenges.push({
      id: 'energy_saver',
      title: 'Energy Saver',
      description: 'Reduce electricity bill by 10% this month',
      category: 'energy',
      potentialSavings: 20,
      potentialPoints: 30,
      difficulty: 'easy',
      icon: '💡',
      deadline: this.getMonthEndDate()
    });

    return challenges;
  },

  /**
   * Get date for end of current week
   * @returns {string} Formatted date string
   */
  getWeekendDate() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const sunday = new Date(today.setDate(today.getDate() + daysUntilSunday));
    return sunday.toISOString().split('T')[0];
  },

  /**
   * Get date for end of current month
   * @returns {string} Formatted date string
   */
  getMonthEndDate() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  },

  /**
   * Calculate monthly trend (percentage change)
   * @param {Array} monthlyData - Array of monthly carbon totals
   * @returns {Array} Array of percentage changes
   */
  calculateTrend(monthlyData) {
    if (!monthlyData || monthlyData.length < 2) return [];

    const trends = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const previous = monthlyData[i - 1];
      const current = monthlyData[i];
      const change = previous === 0 ? 0 : ((previous - current) / previous) * 100;
      trends.push(parseFloat(change.toFixed(1)));
    }
    return trends;
  },

  /**
   * Get greener alternative suggestion
   * @param {Object} transaction - Transaction object
   * @returns {Object|null} Alternative suggestion
   */
  getGreenerAlternative(transaction) {
    const merchant = (transaction.merchant || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();

    // Transport alternatives
    if (merchant.includes('fuel') || merchant.includes('petrol')) {
      return {
        suggestion: 'Use Dubai Metro or RTA Bus',
        potentialSaving: this.calculateTransactionCarbon(transaction) * 0.75,
        icon: '🚇',
        link: 'https://www.rta.ae/'
      };
    }

    if (merchant.includes('taxi') && !merchant.includes('metro')) {
      return {
        suggestion: 'Consider carpooling or metro for this trip',
        potentialSaving: this.calculateTransactionCarbon(transaction) * 0.5,
        icon: '🚇',
        link: null
      };
    }

    // Food alternatives
    if (category.includes('food') && !merchant.includes('organic')) {
      return {
        suggestion: 'Try local organic markets',
        potentialSaving: this.calculateTransactionCarbon(transaction) * 0.4,
        icon: '🌿',
        link: null
      };
    }

    // Shopping alternatives
    if (category.includes('shopping') && !merchant.includes('local')) {
      return {
        suggestion: 'Shop at local sustainable brands',
        potentialSaving: this.calculateTransactionCarbon(transaction) * 0.3,
        icon: '♻️',
        link: null
      };
    }

    return null;
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.CarbonPointsSystem = CarbonPointsSystem;
}
