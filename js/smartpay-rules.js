// SmartPay Rules Management - Prebuilt Rules Implementation
// Author: AI Assistant
// Date: November 12, 2025

(function() {
  'use strict';

  // ===========================
  // PREBUILT RULES DATA
  // ===========================
  
  const PREBUILT_RULES = {
    aiSmartRepay: {
      id: 'aiSmartRepay',
      icon: '🤖',
      title: 'AI Smart Repay',
      meta: 'AI detects surplus balance',
      action: 'Auto-transfer to credit repayment',
      example: '"AI noticed extra funds → repaid AED 2,000 from Smart Credit."',
      benefits: [
        'Automatically detects when you have extra funds',
        'Reduces interest costs by repaying early',
        'No manual monitoring needed',
        'Optimizes your cash flow intelligently'
      ],
      config: {
        triggerType: 'ai-balance-detection',
        actionType: 'repay',
        minSurplus: 3000,
        repayPercentage: 50
      }
    },
    weekendSweep: {
      id: 'weekendSweep',
      icon: '⏰',
      title: 'Weekend Sweep',
      meta: 'Every Friday 6 PM',
      action: 'Move extra balance to credit repayment',
      example: '"Weekend sweep complete — AED 3,000 paid towards your loan."',
      benefits: [
        'Start your weekend with optimized finances',
        'Automatic weekly credit repayment',
        'Keeps your account balance lean',
        'Perfect for salary earners (paid weekly/bi-weekly)'
      ],
      config: {
        triggerType: 'schedule',
        schedule: 'weekly',
        day: 'friday',
        time: '18:00',
        actionType: 'repay',
        minBalance: 5000,
        keepBuffer: 2000
      }
    },
    dailyRepayRule: {
      id: 'dailyRepayRule',
      icon: '🌙',
      title: 'Daily Repay Rule',
      meta: 'Every day at 10 PM',
      action: 'If balance > AED 10,000 → auto-repay part of credit',
      example: '"SmartRepay transferred AED 1,500 from your account."',
      benefits: [
        'Daily automatic optimization',
        'Reduce interest with frequent repayments',
        'Only triggers when you have sufficient balance',
        'Set and forget convenience'
      ],
      config: {
        triggerType: 'schedule',
        schedule: 'daily',
        time: '22:00',
        actionType: 'repay',
        minBalance: 10000,
        repayAmount: 'percentage',
        repayPercentage: 20
      }
    },
    aiSaveBoost: {
      id: 'aiSaveBoost',
      icon: '💡',
      title: 'AI Save Boost',
      meta: 'AI detects lower spending this week',
      action: 'Move part of unused amount to savings',
      example: '"Spending lower than usual — AED 500 saved automatically."',
      benefits: [
        'AI learns your spending patterns',
        'Automatically saves when you spend less',
        'Builds your savings effortlessly',
        'Smart financial health improvement'
      ],
      config: {
        triggerType: 'ai-spending-analysis',
        actionType: 'transfer-savings',
        analysisWindow: '7-days',
        savePercentage: 30
      }
    }
  };

  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  let activeRules = [];
  let currentView = 'selection'; // 'selection' or 'detail'
  let selectedRule = null;

  // ===========================
  // DOM ELEMENTS
  // ===========================
  
  let elements = {};

  // ===========================
  // INITIALIZATION
  // ===========================
  
  function init() {
    console.log('[SmartPayRules] Initializing...');
    
    // Cache DOM elements
    cacheElements();
    
    // Load active rules from localStorage
    loadActiveRules();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render active rules in the list
    renderActiveRules();
    
    console.log('[SmartPayRules] Initialized successfully');
  }

  function cacheElements() {
    elements = {
      addRuleBtn: document.getElementById('addRuleBtn'),
      ruleModal: document.getElementById('ruleModal'),
      ruleModalBody: document.getElementById('ruleModalBody'),
      ruleSelectView: document.getElementById('ruleSelectView'),
      ruleDetailView: document.getElementById('ruleDetailView'),
      rulesList: document.getElementById('rulesList'),
      
      // Detail view elements
      detailIcon: document.getElementById('detailIcon'),
      detailTitle: document.getElementById('detailTitle'),
      detailMeta: document.getElementById('detailMeta'),
      detailAction: document.getElementById('detailAction'),
      detailExample: document.getElementById('detailExample'),
      detailBenefitsList: document.getElementById('detailBenefitsList'),
      
      // Action buttons
      confirmRuleBtn: document.getElementById('confirmRuleBtn'),
      backToRuleListBtn: document.getElementById('backToRuleListBtn'),
      
      // Modal close buttons
      modalCloseBtn: document.querySelector('#ruleModal .modal-close')
    };
  }

  function setupEventListeners() {
    // Open modal button
    if (elements.addRuleBtn) {
      elements.addRuleBtn.addEventListener('click', openRuleModal);
    }

    // Close modal button
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeRuleModal);
    }

    // Close modal on backdrop click
    if (elements.ruleModal) {
      elements.ruleModal.addEventListener('click', (e) => {
        if (e.target === elements.ruleModal) {
          closeRuleModal();
        }
      });
    }

    // Confirm rule button
    if (elements.confirmRuleBtn) {
      elements.confirmRuleBtn.addEventListener('click', confirmAddRule);
    }

    // Back to list button
    if (elements.backToRuleListBtn) {
      elements.backToRuleListBtn.addEventListener('click', showSelectionView);
    }

    // Setup prebuilt rule card listeners
    setupRuleCardListeners();
  }

  function setupRuleCardListeners() {
    const ruleCards = document.querySelectorAll('.prebuilt-rule-card');
    ruleCards.forEach(card => {
      card.addEventListener('click', () => {
        const ruleId = card.getAttribute('data-rule');
        if (ruleId && PREBUILT_RULES[ruleId]) {
          selectRule(ruleId);
        }
      });
    });
  }

  // ===========================
  // MODAL MANAGEMENT
  // ===========================
  
  function openRuleModal() {
    if (!elements.ruleModal) return;
    
    console.log('[SmartPayRules] Opening modal');
    
    // Reset to selection view
    showSelectionView();
    
    // Show modal
    elements.ruleModal.removeAttribute('hidden');
    
    // Announce with voice
    if (typeof speak === 'function') {
      speak('Select a SmartPay automation rule to add', false);
    }
    
    // Focus management
    setTimeout(() => {
      const firstCard = document.querySelector('.prebuilt-rule-card');
      if (firstCard) firstCard.focus();
    }, 100);
  }

  function closeRuleModal() {
    if (!elements.ruleModal) return;
    
    console.log('[SmartPayRules] Closing modal');
    
    // Hide modal
    elements.ruleModal.setAttribute('hidden', '');
    
    // Reset state
    currentView = 'selection';
    selectedRule = null;
    
    // Clear any selection highlights
    document.querySelectorAll('.prebuilt-rule-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
  }

  // ===========================
  // VIEW MANAGEMENT
  // ===========================
  
  function showSelectionView() {
    currentView = 'selection';
    
    if (elements.ruleSelectView) {
      elements.ruleSelectView.removeAttribute('hidden');
    }
    
    if (elements.ruleDetailView) {
      elements.ruleDetailView.setAttribute('hidden', '');
    }
    
    // Clear selection
    selectedRule = null;
    document.querySelectorAll('.prebuilt-rule-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
  }

  function showDetailView(ruleId) {
    const rule = PREBUILT_RULES[ruleId];
    if (!rule) return;
    
    currentView = 'detail';
    selectedRule = ruleId;
    
    console.log('[SmartPayRules] Showing detail view for:', ruleId);
    
    // Populate detail view
    if (elements.detailIcon) {
      elements.detailIcon.textContent = rule.icon;
    }
    
    if (elements.detailTitle) {
      elements.detailTitle.textContent = rule.title;
    }
    
    if (elements.detailMeta) {
      elements.detailMeta.textContent = rule.meta;
    }
    
    if (elements.detailAction) {
      elements.detailAction.textContent = rule.action;
    }
    
    if (elements.detailExample) {
      elements.detailExample.textContent = rule.example;
    }
    
    // Populate benefits list
    if (elements.detailBenefitsList && rule.benefits) {
      elements.detailBenefitsList.innerHTML = rule.benefits
        .map(benefit => `<li>✓ ${benefit}</li>`)
        .join('');
    }
    
    // Switch views
    if (elements.ruleSelectView) {
      elements.ruleSelectView.setAttribute('hidden', '');
    }
    
    if (elements.ruleDetailView) {
      elements.ruleDetailView.removeAttribute('hidden');
    }
    
    // Announce with voice
    if (typeof speak === 'function') {
      speak(`${rule.title}. ${rule.meta}. ${rule.action}`, false);
    }
  }

  // ===========================
  // RULE SELECTION
  // ===========================
  
  function selectRule(ruleId) {
    console.log('[SmartPayRules] Rule selected:', ruleId);
    
    // Highlight the selected card
    document.querySelectorAll('.prebuilt-rule-card').forEach(card => {
      if (card.getAttribute('data-rule') === ruleId) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
    
    // Show detail view
    showDetailView(ruleId);
  }

  // ===========================
  // RULE MANAGEMENT
  // ===========================
  
  function confirmAddRule() {
    if (!selectedRule) {
      console.warn('[SmartPayRules] No rule selected');
      return;
    }
    
    const rule = PREBUILT_RULES[selectedRule];
    if (!rule) return;
    
    // Check if rule already exists
    const existingRule = activeRules.find(r => r.id === rule.id);
    if (existingRule) {
      if (typeof speak === 'function') {
        speak(`${rule.title} is already active`, false);
      }
      alert(`${rule.title} is already in your active rules.`);
      return;
    }
    
    console.log('[SmartPayRules] Adding rule:', rule.title);
    
    // Create active rule object
    const activeRule = {
      id: rule.id,
      name: rule.title,
      icon: rule.icon,
      trigger: rule.meta,
      action: rule.action,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastExecuted: null,
      executionCount: 0,
      config: rule.config
    };
    
    // Add to active rules
    activeRules.push(activeRule);
    
    // Save to localStorage
    saveActiveRules();
    
    // Render updated list
    renderActiveRules();
    
    // Close modal
    closeRuleModal();
    
    // Success feedback
    if (typeof speak === 'function') {
      speak(`${rule.title} added successfully`, false);
    }
    
    // Show success notification
    showNotification(`✓ ${rule.title} has been activated`, 'success');
  }

  function deleteRule(ruleId) {
    const rule = activeRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    const ruleName = rule.name;
    
    if (!confirm(`Are you sure you want to delete "${ruleName}"?`)) {
      return;
    }
    
    console.log('[SmartPayRules] Deleting rule:', ruleId);
    
    // Remove from active rules
    activeRules = activeRules.filter(r => r.id !== ruleId);
    
    // Save to localStorage
    saveActiveRules();
    
    // Render updated list
    renderActiveRules();
    
    // Success feedback
    if (typeof speak === 'function') {
      speak(`${ruleName} deleted`, false);
    }
    
    showNotification(`${ruleName} has been removed`, 'info');
  }

  function toggleRuleStatus(ruleId) {
    const rule = activeRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    // Toggle status
    rule.status = rule.status === 'active' ? 'paused' : 'active';
    
    console.log('[SmartPayRules] Toggled rule status:', ruleId, rule.status);
    
    // Save to localStorage
    saveActiveRules();
    
    // Render updated list
    renderActiveRules();
    
    // Feedback
    const statusText = rule.status === 'active' ? 'activated' : 'paused';
    if (typeof speak === 'function') {
      speak(`${rule.name} ${statusText}`, false);
    }
  }

  // ===========================
  // RENDERING
  // ===========================
  
  function renderActiveRules() {
    if (!elements.rulesList) return;
    
    console.log('[SmartPayRules] Rendering active rules:', activeRules.length);
    
    if (activeRules.length === 0) {
      elements.rulesList.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px; border: 2px dashed #d1d5db;">
          <p style="margin: 0; font-size: 1.1rem;">No automation rules yet</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Click "+ Add Rule" to create your first SmartPay automation</p>
        </div>
      `;
      return;
    }
    
    // Render rule cards
    const html = activeRules.map(rule => createRuleCardHTML(rule)).join('');
    elements.rulesList.innerHTML = html;
    
    // Setup event listeners for rule actions
    setupRuleActionListeners();
  }

  function createRuleCardHTML(rule) {
    const statusClass = rule.status === 'active' ? 'active' : 'paused';
    const statusText = rule.status === 'active' ? 'Active' : 'Paused';
    const lastExecuted = rule.lastExecuted 
      ? new Date(rule.lastExecuted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Never';
    
    return `
      <div class="rule-card" data-rule-id="${rule.id}">
        <div class="rule-header">
          <div class="rule-info">
            <h4>${rule.icon} ${rule.name}</h4>
            <span class="rule-status ${statusClass}">${statusText}</span>
          </div>
          <div class="rule-actions">
            <button class="btn-icon toggle-rule" aria-label="Toggle rule" title="${rule.status === 'active' ? 'Pause' : 'Activate'} rule">
              ${rule.status === 'active' ? '⏸️' : '▶️'}
            </button>
            <button class="btn-icon delete-rule" aria-label="Delete rule" title="Delete rule">🗑️</button>
          </div>
        </div>
        <div class="rule-body">
          <p><strong>Trigger:</strong> ${rule.trigger}</p>
          <p><strong>Action:</strong> ${rule.action}</p>
          <p><strong>Last executed:</strong> ${lastExecuted}</p>
          ${rule.executionCount > 0 ? `<p><strong>Executions:</strong> ${rule.executionCount} times</p>` : ''}
        </div>
      </div>
    `;
  }

  function setupRuleActionListeners() {
    // Toggle rule status
    document.querySelectorAll('.toggle-rule').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ruleCard = e.target.closest('.rule-card');
        const ruleId = ruleCard.getAttribute('data-rule-id');
        toggleRuleStatus(ruleId);
      });
    });
    
    // Delete rule
    document.querySelectorAll('.delete-rule').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ruleCard = e.target.closest('.rule-card');
        const ruleId = ruleCard.getAttribute('data-rule-id');
        deleteRule(ruleId);
      });
    });
  }

  // ===========================
  // PERSISTENCE
  // ===========================
  
  function loadActiveRules() {
    try {
      const stored = localStorage.getItem('smartpay_active_rules');
      if (stored) {
        activeRules = JSON.parse(stored);
        console.log('[SmartPayRules] Loaded active rules from localStorage:', activeRules.length);
      }
    } catch (error) {
      console.error('[SmartPayRules] Error loading active rules:', error);
      activeRules = [];
    }
  }

  function saveActiveRules() {
    try {
      localStorage.setItem('smartpay_active_rules', JSON.stringify(activeRules));
      console.log('[SmartPayRules] Saved active rules to localStorage');
    } catch (error) {
      console.error('[SmartPayRules] Error saving active rules:', error);
    }
  }

  // ===========================
  // NOTIFICATIONS
  // ===========================
  
  function showNotification(message, type = 'info') {
    // Try to use existing notification system
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }
    
    // Fallback: create simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ===========================
  // PUBLIC API
  // ===========================
  
  window.SmartPayRules = {
    init,
    openRuleModal,
    closeRuleModal,
    getActiveRules: () => activeRules,
    getPrebuiltRules: () => PREBUILT_RULES,
    addRule: confirmAddRule,
    deleteRule,
    toggleRuleStatus
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
