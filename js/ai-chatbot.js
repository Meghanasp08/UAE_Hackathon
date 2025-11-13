/**
 * AI Chatbot - Rule-based + Template System
 * Smart financial assistant for Shukria platform
 */

class ShukriaChatbot {
  constructor() {
    this.conversationHistory = [];
    this.currentPage = this.detectCurrentPage();
    this.userData = this.loadUserData();
    this.isOpen = false;
    this.activeTab = 'quick-assists';
    
    this.init();
  }

  init() {
    this.createChatbotUI();
    this.attachEventListeners();
    this.loadConversationHistory();
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/')) return 'dashboard';
    if (path.includes('credit-line')) return 'credit-line';
    if (path.includes('apply')) return 'apply';
    if (path.includes('transactions')) return 'transactions';
    if (path.includes('esg-score')) return 'esg-score';
    if (path.includes('accounts')) return 'accounts';
    return 'dashboard';
  }

  loadUserData() {
    // Load user data from localStorage or use defaults
    return {
      name: 'Priya Sharma',
      creditLimit: 15250,
      availableCredit: 12500,
      usedCredit: 2750,
      utilization: 18,
      esgScore: 72,
      loanEligible: 1000000,
      hasAutoSweep: false,
      applicationStatus: null
    };
  }

  createChatbotUI() {
    const chatbotHTML = `
      <!-- Chatbot Toggle Button -->
      <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open AI Assistant">
        🤖
      </button>

      <!-- Chatbot Panel -->
      <div class="chatbot-panel" id="chatbotPanel">
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-left">
            <div class="chatbot-avatar">🤖</div>
            <div class="chatbot-title">
              <h3>Shukria Assistant</h3>
              <p>AI-powered financial help</p>
            </div>
          </div>
          <button class="chatbot-close" id="chatbotClose" aria-label="Close chatbot">×</button>
        </div>

        <!-- Tabs -->
        <div class="chatbot-tabs">
          <button class="chatbot-tab active" data-tab="quick-assists">⚡ Quick Assists</button>
          <button class="chatbot-tab" data-tab="chat">💬 Chat</button>
          <button class="chatbot-tab" data-tab="help">❓ Help</button>
        </div>

        <!-- Tab Contents -->
        <div class="chatbot-content active" id="quick-assists-content">
          <div class="quick-assists" id="quickAssistsContainer">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>

        <div class="chatbot-content" id="chat-content">
          <div class="chat-messages" id="chatMessages">
            <div class="chat-empty-state">
              <div class="chat-empty-state-icon">💬</div>
              <h4>Start a Conversation</h4>
              <p>Ask me anything about your finances!</p>
            </div>
          </div>
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <input 
                type="text" 
                class="chat-input" 
                id="chatInput" 
                placeholder="Type your question..."
                aria-label="Chat input"
              />
              <button class="chat-send-btn" id="chatSendBtn" aria-label="Send message">
                ➤
              </button>
            </div>
          </div>
        </div>

        <div class="chatbot-content" id="help-content">
          <div class="help-content" id="helpContentContainer">
            <!-- Dynamic help content will be loaded here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    this.loadQuickAssists();
    this.loadHelpContent();
  }

  attachEventListeners() {
    // Toggle button
    document.getElementById('chatbotToggle').addEventListener('click', () => {
      this.toggleChatbot();
    });

    // Close button
    document.getElementById('chatbotClose').addEventListener('click', () => {
      this.closeChatbot();
    });

    // Tab switching
    document.querySelectorAll('.chatbot-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Chat input
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Input validation
    chatInput.addEventListener('input', (e) => {
      sendBtn.disabled = !e.target.value.trim();
    });
  }

  toggleChatbot() {
    const panel = document.getElementById('chatbotPanel');
    const toggle = document.getElementById('chatbotToggle');
    
    this.isOpen = !this.isOpen;
    panel.classList.toggle('open', this.isOpen);
    toggle.classList.toggle('active', this.isOpen);

    if (this.isOpen) {
      document.getElementById('chatInput')?.focus();
    }
  }

  closeChatbot() {
    this.isOpen = false;
    document.getElementById('chatbotPanel').classList.remove('open');
    document.getElementById('chatbotToggle').classList.remove('active');
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.chatbot-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.chatbot-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-content`);
    });
  }

  loadQuickAssists() {
    const container = document.getElementById('quickAssistsContainer');
    const assists = this.getContextualAssists();

    let html = '';
    
    for (const [category, items] of Object.entries(assists)) {
      html += `
        <div class="assist-category">
          <h4><span class="assist-category-icon">${items.icon}</span> ${items.label}</h4>
      `;
      
      items.prompts.forEach(prompt => {
        html += `
          <button class="assist-button" onclick="chatbot.handleQuickAssist('${prompt.query.replace(/'/g, "\\'")}')">
            <span class="assist-button-icon">${prompt.icon}</span>
            <span class="assist-button-text">${prompt.text}</span>
          </button>
        `;
      });
      
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  getContextualAssists() {
    const commonAssists = {
      general: {
        icon: '🎯',
        label: 'General Help',
        prompts: [
          { icon: '📊', text: 'Show my account summary', query: 'show account summary' },
          { icon: '💳', text: 'Explain my credit utilization', query: 'explain credit utilization' }
        ]
      }
    };

    const pageSpecificAssists = {
      dashboard: {
        quick: {
          icon: '⚡',
          label: 'Quick Actions',
          prompts: [
            { icon: '💰', text: 'How can I improve my ESG score?', query: 'improve esg score' },
            { icon: '📈', text: 'What\'s my spending pattern?', query: 'spending pattern' },
            { icon: '💡', text: 'Show savings opportunities', query: 'savings opportunities' }
          ]
        }
      },
      'credit-line': {
        credit: {
          icon: '💳',
          label: 'Credit Management',
          prompts: [
            { icon: '🔄', text: 'Help me set up auto-sweep', query: 'setup auto sweep' },
            { icon: '📋', text: 'Explain SmartPay rules', query: 'explain smartpay rules' },
            { icon: '💸', text: 'When should I repay?', query: 'when to repay' },
            { icon: '🧮', text: 'Calculate my fees', query: 'calculate fees' }
          ]
        }
      },
      apply: {
        application: {
          icon: '📝',
          label: 'Application Help',
          prompts: [
            { icon: '🗺️', text: 'Guide me through application', query: 'application guide' },
            { icon: '📄', text: 'What documents do I need?', query: 'required documents' },
            { icon: '🔐', text: 'Explain consent process', query: 'consent process' },
            { icon: '✅', text: 'Check my eligibility', query: 'check eligibility' }
          ]
        }
      },
      transactions: {
        analysis: {
          icon: '📊',
          label: 'Transaction Analysis',
          prompts: [
            { icon: '💳', text: 'Analyze my spending', query: 'analyze spending' },
            { icon: '🌱', text: 'Find high-carbon transactions', query: 'high carbon transactions' },
            { icon: '🔍', text: 'Show unusual activity', query: 'unusual activity' },
            { icon: '💰', text: 'Budget recommendations', query: 'budget recommendations' }
          ]
        }
      },
      'esg-score': {
        esg: {
          icon: '🌍',
          label: 'ESG & Sustainability',
          prompts: [
            { icon: '📊', text: 'How is my ESG score calculated?', query: 'esg calculation' },
            { icon: '🌱', text: 'Ways to reduce carbon footprint', query: 'reduce carbon' },
            { icon: '🏆', text: 'ESG improvement tips', query: 'esg tips' },
            { icon: '♻️', text: 'Green alternatives', query: 'green alternatives' }
          ]
        }
      },
      accounts: {
        accounts: {
          icon: '🏦',
          label: 'Accounts',
          prompts: [
            { icon: '📋', text: 'Explain my account details', query: 'account details' },
            { icon: '💰', text: 'Show account balances', query: 'account balances' },
            { icon: '🔗', text: 'Link new account', query: 'link account' }
          ]
        }
      }
    };

    const pageAssists = pageSpecificAssists[this.currentPage] || {};
    return { ...commonAssists, ...pageAssists };
  }

  handleQuickAssist(query) {
    this.switchTab('chat');
    
    // Add user message
    this.addMessage(query, 'user');
    
    // Process and respond
    setTimeout(() => {
      const response = this.processQuery(query);
      this.addMessage(response, 'bot');
    }, 600);
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';
    document.getElementById('chatSendBtn').disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    // Process and respond
    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.processQuery(message);
      this.addMessage(response, 'bot');
    }, 800);
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove empty state if exists
    const emptyState = messagesContainer.querySelector('.chat-empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const messageHTML = `
      <div class="chat-message ${sender}">
        <div class="message-avatar ${sender}">
          ${sender === 'bot' ? '🤖' : '👤'}
        </div>
        <div>
          <div class="message-content">${this.formatMessage(text)}</div>
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to history
    this.conversationHistory.push({ text, sender, time: Date.now() });
    this.saveConversationHistory();
  }

  formatMessage(text) {
    // Convert markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingHTML = `
      <div class="chat-message bot typing-message">
        <div class="message-avatar bot">🤖</div>
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingMsg = document.querySelector('.typing-message');
    if (typingMsg) typingMsg.remove();
  }

  processQuery(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Intent recognition using pattern matching
    const intent = this.recognizeIntent(normalizedQuery);
    
    // Generate response based on intent
    return this.generateResponse(intent, normalizedQuery);
  }

  recognizeIntent(query) {
    // Define intent patterns (rule-based)
    const intents = {
      // Credit-related
      credit_utilization: ['credit utilization', 'credit usage', 'how much credit', 'credit used'],
      credit_limit: ['credit limit', 'available credit', 'how much available'],
      withdraw: ['withdraw', 'take money', 'borrow'],
      repay: ['repay', 'pay back', 'return money'],
      
      // ESG-related
      esg_score: ['esg score', 'environmental score', 'sustainability score'],
      esg_calculation: ['how is esg', 'esg calculated', 'esg calculation'],
      carbon_footprint: ['carbon footprint', 'carbon emission', 'co2'],
      reduce_carbon: ['reduce carbon', 'lower emissions', 'green', 'eco-friendly'],
      esg_tips: ['esg tips', 'improve esg', 'better esg'],
      
      // Transactions
      spending_pattern: ['spending pattern', 'how do i spend', 'spending habit'],
      analyze_spending: ['analyze spending', 'spending analysis'],
      high_carbon: ['high carbon', 'carbon transactions', 'polluting'],
      unusual_activity: ['unusual', 'suspicious', 'abnormal'],
      
      // SmartPay & Auto-sweep
      auto_sweep: ['auto sweep', 'automatic payment', 'auto repay'],
      smartpay_rules: ['smartpay', 'payment rules', 'automatic rules'],
      when_repay: ['when repay', 'when to pay', 'repayment schedule'],
      calculate_fees: ['calculate fees', 'how much fee', 'transaction fee'],
      
      // Application
      application_guide: ['application guide', 'how to apply', 'apply for credit'],
      required_documents: ['documents', 'what do i need', 'requirements'],
      consent_process: ['consent', 'permission', 'authorization'],
      check_eligibility: ['eligibility', 'eligible', 'qualify'],
      
      // General
      account_summary: ['account summary', 'show account', 'my account'],
      balance: ['balance', 'how much money'],
      savings: ['savings', 'save money', 'opportunities'],
      
      // Greetings
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      thanks: ['thank', 'thanks', 'shukria'],
      
      // Accounts
      account_details: ['account details', 'account info'],
      account_balances: ['account balance', 'bank balance'],
      link_account: ['link account', 'add account', 'connect account']
    };

    // Find matching intent
    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        return intent;
      }
    }

    return 'unknown';
  }

  generateResponse(intent, query) {
    const responses = {
      // Credit responses
      credit_utilization: `Your current credit utilization is **${this.userData.utilization}%**. You're using **AED ${this.userData.usedCredit.toLocaleString()}** out of your **AED ${this.userData.creditLimit.toLocaleString()}** limit.\n\nThis is excellent! Keeping utilization under 30% helps maintain a healthy credit profile. Shukria! 🎉`,
      
      credit_limit: `You have **AED ${this.userData.availableCredit.toLocaleString()}** available credit out of your total limit of **AED ${this.userData.creditLimit.toLocaleString()}**.\n\nYou can use this anytime with just a 0.5% transaction fee. Shukria!`,
      
      withdraw: `To withdraw funds:\n1. Go to **Credit Line** page\n2. Enter amount (up to AED ${this.userData.availableCredit.toLocaleString()})\n3. Confirm the 0.5% transaction fee\n4. Funds transfer instantly!\n\nNeed help with a specific amount? Shukria!`,
      
      repay: `To repay your credit:\n1. Visit the **Credit Line** page\n2. Click "Repay"\n3. Enter amount (current balance: AED ${this.userData.usedCredit.toLocaleString()})\n4. Confirm payment\n\nYou can also set up **auto-sweep** for automatic repayments. Shukria!`,
      
      // ESG responses
      esg_score: `Your current ESG score is **${this.userData.esgScore}/100** 🌱\n\nThis reflects your:\n✅ Environmental impact (carbon footprint)\n✅ Social responsibility (ethical spending)\n✅ Financial governance\n\nVisit the **ESG Score** page for detailed breakdown. Shukria!`,
      
      esg_calculation: `Your ESG score is calculated from:\n\n**Environmental (40%)**\n- Carbon footprint per transaction\n- Green purchases vs. high-emission ones\n\n**Social (30%)**\n- Ethical brand support\n- Local business purchases\n\n**Governance (30%)**\n- On-time payments\n- Responsible credit usage\n\nEvery sustainable choice improves your score! Shukria! 🌍`,
      
      carbon_footprint: `Track your carbon impact on the **ESG Score** page.\n\nYour transactions are categorized:\n🟢 **Low impact**: Public transport, renewable energy\n🟡 **Medium impact**: Groceries, utilities\n🔴 **High impact**: Flights, luxury goods\n\nWe show monthly trends and savings! Shukria!`,
      
      reduce_carbon: `**Ways to reduce your carbon footprint:**\n\n1. 🚇 Use public transport instead of ride-sharing\n2. 🛒 Shop local and sustainable brands\n3. 💚 Choose green energy providers\n4. ♻️ Buy from eco-certified merchants\n5. 🌱 Offset with our carbon credit program\n\nEach green choice boosts your ESG score! Shukria!`,
      
      esg_tips: `**Top ESG improvement tips:**\n\n✨ **Quick wins:**\n- Enable paperless statements\n- Set up auto-repayment (shows responsibility)\n- Choose eco-friendly merchants\n\n🚀 **Long-term:**\n- Maintain <30% credit utilization\n- Support certified sustainable brands\n- Track and reduce monthly carbon footprint\n\nYour score improves with every conscious decision! Shukria!`,
      
      // Transaction responses
      spending_pattern: `Based on your transactions:\n\n📊 **Top categories:**\n1. Groceries (35%)\n2. Transportation (25%)\n3. Utilities (20%)\n4. Entertainment (15%)\n5. Others (5%)\n\n💡 Tip: You could save ~15% by using public transport more. Visit **Transactions** page for detailed analysis. Shukria!`,
      
      analyze_spending: `Let me analyze your spending:\n\n**Monthly average**: AED 4,500\n**Trend**: ↑ 12% vs. last month\n**High-spend days**: Weekends\n**Carbon impact**: Medium (improving! 🌱)\n\n**Recommendations:**\n- Set budget alerts\n- Use auto-sweep for better cash flow\n- Consider green alternatives\n\nShukria!`,
      
      high_carbon: `🔴 **High carbon transactions detected:**\n\n1. Flight booking: 850 kg CO₂\n2. Luxury shopping: 120 kg CO₂\n3. Fuel purchases: 85 kg CO₂\n\n💡 **Greener alternatives:**\n- Consider trains for regional travel\n- Shop sustainable brands\n- Electric vehicle charging\n\nView detailed breakdown in **Transactions** page. Shukria!`,
      
      unusual_activity: `✅ **No unusual activity detected!**\n\nYour spending patterns are consistent. I'll alert you if I notice:\n- Large unexpected charges\n- Foreign transactions\n- Duplicate payments\n- Unusual merchant categories\n\nYour account is secure. Shukria!`,
      
      // SmartPay responses
      auto_sweep: `**Auto-Sweep** automatically repays credit when conditions are met.\n\n**Setup steps:**\n1. Go to **Credit Line** → SmartPay\n2. Click "Enable Auto-Sweep"\n3. Set trigger (e.g., "When salary is credited")\n4. Set amount (percentage or fixed)\n5. Confirm!\n\n✨ Benefits: Never miss a payment, optimize cash flow. Shukria!`,
      
      smartpay_rules: `**SmartPay Rules** automate your credit management:\n\n**Types:**\n🔄 **Auto-Sweep**: Repay on salary credit\n📅 **Scheduled**: Fixed dates/amounts\n📊 **Threshold**: When balance > X amount\n⚡ **Event-based**: After specific transactions\n\n**Priority system** ensures rules don't conflict.\n\nCreate custom rules in **Credit Line** page. Shukria!`,
      
      when_repay: `**Best times to repay:**\n\n1. 💰 **After salary**: Use auto-sweep to repay automatically\n2. 📅 **Before month-end**: Minimize interest accrual\n3. 🎯 **When utilization > 30%**: Keep credit score healthy\n4. ✨ **Anytime**: No prepayment penalties!\n\n**Current balance**: AED ${this.userData.usedCredit.toLocaleString()}\n\nShukria!`,
      
      calculate_fees: `**Fee Structure:**\n\n💳 **Transaction fee**: 0.5% per withdrawal\n📊 **Monthly fee**: AED 0 (no monthly charges!)\n🔄 **Repayment fee**: AED 0 (free!)\n⚡ **Auto-sweep**: AED 0 (free!)\n\n**Example:**\nWithdraw AED 1,000 = AED 5 fee\nTotal charged: AED 1,005\n\nNo hidden fees. Ever. Shukria!`,
      
      // Application responses
      application_guide: `**Credit Application Process:**\n\n**Step 1**: Basic information (2 mins)\n**Step 2**: Link bank account via Nebras (secure)\n**Step 3**: AI assessment (instant)\n**Step 4**: Review & accept terms\n**Step 5**: Credit activated! 🎉\n\n**Total time**: ~5 minutes\n\nReady to start? Visit the **Apply** page. Shukria!`,
      
      required_documents: `**Required Information:**\n\n✅ **No documents needed!**\n\nWe use **Nebras Open Banking** to securely:\n- Verify your identity\n- Check account balances\n- Analyze transaction history\n- Assess creditworthiness\n\nJust link your bank account - that's it! Shukria! 🚀`,
      
      consent_process: `**Nebras Consent Process:**\n\n1. 🔐 You authorize Shukria to access your banking data\n2. 🏦 Redirect to your bank's secure portal\n3. ✅ Approve access (read-only, time-limited)\n4. ↩️ Return to Shukria\n5. ⚡ Instant credit assessment\n\n**Your data is:**\n- Encrypted end-to-end\n- Never stored permanently\n- Used only for credit evaluation\n\nShukria!`,
      
      check_eligibility: `**Eligibility Criteria:**\n\n✅ UAE resident\n✅ Age 21-65\n✅ Regular income (salary/business)\n✅ Bank account with 3+ months history\n\n**Your status**: Eligible for up to **AED ${this.userData.loanEligible.toLocaleString()}** 🎉\n\nReady to apply? Visit **Apply** page. Shukria!`,
      
      // General responses
      account_summary: `**Your Account Summary:**\n\n💳 **Credit**: AED ${this.userData.availableCredit.toLocaleString()} available (${this.userData.creditLimit.toLocaleString()} limit)\n📊 **Utilization**: ${this.userData.utilization}%\n🌱 **ESG Score**: ${this.userData.esgScore}/100\n💰 **Loan Eligible**: AED ${this.userData.loanEligible.toLocaleString()}\n\nEverything looks great! Shukria!`,
      
      balance: `**Your Balances:**\n\n💳 Available Credit: **AED ${this.userData.availableCredit.toLocaleString()}**\n📉 Used Credit: **AED ${this.userData.usedCredit.toLocaleString()}**\n📊 Credit Limit: **AED ${this.userData.creditLimit.toLocaleString()}**\n\nUtilization: ${this.userData.utilization}% (Excellent! 🌟)\n\nShukria!`,
      
      savings: `**Savings Opportunities:**\n\n1. 💡 Switch to auto-sweep: Save ~AED 45/month in fees\n2. 🌱 Use green merchants: Earn ESG rewards\n3. 📊 Reduce utilization <10%: Better loan terms\n4. 🚇 Public transport: Save AED 300/month + lower carbon\n\n**Potential monthly savings**: AED 345+ 🎯\n\nShukria!`,
      
      // Account responses
      account_details: `**Your Linked Account:**\n\n🏦 Bank: Emirates NBD\n💳 Account: ****7890\n📊 Status: Active & Verified\n🔐 Consent: Valid until Dec 2025\n\nAll secure and connected! Shukria!`,
      
      account_balances: `**Account Balances:**\n\nYour bank account balances are displayed on the **Accounts** page with real-time data from Nebras Open Banking.\n\nI can show:\n- Current balance\n- Available balance\n- Account currency\n- Last updated time\n\nShukria!`,
      
      link_account: `**Link New Account:**\n\n1. Go to **Accounts** page\n2. Click "Link New Account"\n3. Authenticate via Nebras\n4. Grant consent\n5. Done! ✅\n\nYou can link multiple accounts for better credit assessment. Shukria!`,
      
      // Social responses
      greeting: `Hello! 👋 I'm your Shukria AI Assistant.\n\nI can help you with:\n💳 Credit management\n🌱 ESG scores\n📊 Transaction analysis\n🤖 SmartPay automation\n\nHow can I assist you today? Shukria!`,
      
      thanks: `You're very welcome! 😊\n\nI'm always here to help with your financial needs.\n\nShukria! 🙏`,
      
      unknown: `I'm not sure I understood that completely. 🤔\n\nI can help you with:\n- Credit line management\n- ESG & carbon tracking\n- Transaction analysis\n- SmartPay rules\n- Application process\n\nTry the **Quick Assists** tab for common questions, or rephrase your question. Shukria!`
    };

    return responses[intent] || responses.unknown;
  }

  loadHelpContent() {
    const container = document.getElementById('helpContentContainer');
    
    const pageHelp = {
      dashboard: {
        title: 'Dashboard Help',
        icon: '📊',
        content: 'View your financial overview including credit status, ESG score, and quick actions.',
        tips: [
          'Check your credit utilization regularly',
          'Monitor your ESG score trends',
          'Use voice commands for quick actions'
        ]
      },
      'credit-line': {
        title: 'Credit Line Help',
        icon: '💳',
        content: 'Manage your credit line with flexible withdraw, repay, and automation features.',
        tips: [
          'Set up auto-sweep for automatic repayments',
          'Create SmartPay rules to automate payments',
          'Keep utilization under 30% for best credit health'
        ]
      },
      apply: {
        title: 'Application Help',
        icon: '📝',
        content: 'Apply for smart credit in minutes using Nebras Open Banking.',
        tips: [
          'Have your bank login ready',
          'Ensure 3+ months transaction history',
          'Process takes only ~5 minutes'
        ]
      },
      transactions: {
        title: 'Transactions Help',
        icon: '💰',
        content: 'View and analyze your transaction history with carbon impact tracking.',
        tips: [
          'Filter by date or category',
          'Check carbon impact badges',
          'Download receipts anytime'
        ]
      },
      'esg-score': {
        title: 'ESG Score Help',
        icon: '🌱',
        content: 'Track your environmental, social, and governance impact.',
        tips: [
          'Choose green merchants to improve score',
          'Monitor monthly carbon savings',
          'View personalized recommendations'
        ]
      },
      accounts: {
        title: 'Accounts Help',
        icon: '🏦',
        content: 'View and manage your linked bank accounts via Nebras.',
        tips: [
          'Link multiple accounts for better assessment',
          'Renew consent before expiry',
          'All data is encrypted and secure'
        ]
      }
    };

    const help = pageHelp[this.currentPage] || pageHelp.dashboard;

    const html = `
      <div class="help-section">
        <h4><span>${help.icon}</span> ${help.title}</h4>
        <p>${help.content}</p>
        <ul>
          ${help.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>

      <div class="help-section">
        <h4><span>🎤</span> Voice Commands</h4>
        <p>Click the microphone button to use voice commands:</p>
        <ul>
          <li>"Show balance"</li>
          <li>"Withdraw 500 dirhams"</li>
          <li>"What's my ESG score?"</li>
          <li>"Go to transactions"</li>
        </ul>
      </div>

      <div class="help-section">
        <h4><span>💬</span> Ask Me Anything</h4>
        <p>I can help you with:</p>
        <ul>
          <li>Credit management questions</li>
          <li>ESG score explanations</li>
          <li>Transaction analysis</li>
          <li>SmartPay automation</li>
          <li>Application guidance</li>
        </ul>
      </div>
    `;

    container.innerHTML = html;
  }

  saveConversationHistory() {
    try {
      // Keep only last 50 messages
      const recentHistory = this.conversationHistory.slice(-50);
      localStorage.setItem('chatbot_history', JSON.stringify(recentHistory));
    } catch (e) {
      console.warn('Could not save conversation history:', e);
    }
  }

  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('chatbot_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        
        // Restore messages to UI
        const messagesContainer = document.getElementById('chatMessages');
        const emptyState = messagesContainer.querySelector('.chat-empty-state');
        
        if (this.conversationHistory.length > 0 && emptyState) {
          emptyState.remove();
          
          this.conversationHistory.forEach(msg => {
            const time = new Date(msg.time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            const messageHTML = `
              <div class="chat-message ${msg.sender}">
                <div class="message-avatar ${msg.sender}">
                  ${msg.sender === 'bot' ? '🤖' : '👤'}
                </div>
                <div>
                  <div class="message-content">${this.formatMessage(msg.text)}</div>
                  <div class="message-time">${time}</div>
                </div>
              </div>
            `;

            messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
          });
        }
      }
    } catch (e) {
      console.warn('Could not load conversation history:', e);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem('chatbot_history');
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
      <div class="chat-empty-state">
        <div class="chat-empty-state-icon">💬</div>
        <h4>Start a Conversation</h4>
        <p>Ask me anything about your finances!</p>
      </div>
    `;
  }
}

// Initialize chatbot when DOM is ready
let chatbot;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chatbot = new ShukriaChatbot();
  });
} else {
  chatbot = new ShukriaChatbot();
}
