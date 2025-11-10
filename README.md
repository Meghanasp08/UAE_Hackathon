# Mercury Smart Credit + ESG - Demo

A voice-enabled smart credit line platform with integrated ESG (Environmental, Social, Governance) scoring and carbon footprint tracking.

## Features

### 🎤 Voice Commands
- **Navigation**: "Go to dashboard", "Show transactions", "Open ESG score"
- **Transactions**: "Withdraw 500 dirhams", "Repay 1000 dirhams"
- **Auto-Sweep**: "Enable auto sweep", "Disable auto sweep"
- **Status**: "Show balance", "What's my ESG score?"

All commands end with "Shukria" (Thank you) confirmation.

### 💳 Credit Line Management
- Real-time credit utilization tracking
- Flexible pay-as-you-go model (0.5% transaction fee)
- Quick withdraw, repay, and transfer actions
- Visual credit usage indicators

### ⚡ SmartPay Automation
- Create custom repayment rules
- Trigger conditions: balance thresholds, schedules, transaction events
- Auto-sweep functionality
- Rule priority management

### 🌱 ESG Scorecard
- Overall ESG score (0-100) with breakdown
- Carbon footprint tracking per category
- Monthly carbon savings visualization
- Greener alternative recommendations
- Transparent calculation methodology

### 📊 Transaction Management
- Filter by date, category, ESG impact
- Carbon impact badges (low/medium/high)
- Voice-read transaction details
- Downloadable receipts

## Pages

1. **index.html** - Dashboard with quick stats
2. **apply.html** - Multi-step credit application with Nebras consent flow
3. **credit-line.html** - Credit management and SmartPay rules
4. **transactions.html** - Transaction history with filters
5. **esg-score.html** - ESG scorecard and carbon tracking

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Voice**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **APIs**: Mock API functions simulating Open Banking (AIS/PIS)

## Quick Start

1. Open `index.html` in a modern browser (Chrome, Edge, or Safari recommended for voice)
2. Click the floating microphone button (🎤) to activate voice commands
3. Navigate through the app using the top navigation or voice commands

## Voice Command Examples

```
"Withdraw 500 dirhams"
"Repay 200 dirhams"
"Show my ESG score"
"Go to transactions"
"Enable auto sweep"
"Show balance"
```

## Mock API Endpoints

All API calls are simulated with delays:

- `mockAPI.requestConsent()` - Nebras consent flow
- `mockAPI.getTransactions()` - Account transactions (AIS)
- `mockAPI.evaluateCredit()` - Credit assessment
- `mockAPI.initiateSweep()` - Auto-sweep payment (PIS)
- `mockAPI.getESGData()` - ESG scores and carbon data
- `mockAPI.createRule()` - SmartPay rule creation
- `mockAPI.getRules()` - Fetch SmartPay rules

## Browser Support

- **Voice Recognition**: Chrome, Edge, Safari (desktop and mobile)
- **Voice Synthesis**: All modern browsers
- **Fallback**: Full functionality works without voice in any modern browser

## Accessibility

- ARIA labels and live regions
- Keyboard navigation support
- Screen reader compatible
- Focus management in modals
- Color contrast compliant

## Future Enhancements

- Real Nebras Open Banking integration
- Backend API connection
- Push notifications for rule triggers
- PDF report generation
- Multi-language support (Arabic)
- Biometric authentication

## License

Prototype for demonstration purposes.

---

**Built for**: Mercury Smart Credit Platform
**Date**: November 2025
