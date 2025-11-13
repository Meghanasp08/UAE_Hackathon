# Interactive Journey & Push Notifications Feature

## 🎉 Implementation Complete!

This document explains the newly implemented Interactive Journey and Push Notifications system for the Shukria Smart Credit platform.

---

## 📋 Overview

The implementation includes TWO major features:

### 1. **Interactive User Journeys** 
Guided tours with spotlight highlighting to help users learn the platform.

### 2. **Push Notifications System**
In-app toast notifications, notification center, and browser push notifications.

---

## 🎯 Features Implemented

### Interactive Journeys

#### **Built-in Journeys:**
1. **Welcome Tour (Onboarding)** - 6 steps introducing the platform
   - Dashboard overview
   - Voice commands introduction
   - Navigation menu guide
   - ESG tracking explanation
   
2. **Credit Line Management Tour** - 4 steps
   - Quick actions guide
   - SmartPay rules setup
   - Auto-sweep feature explanation

3. **ESG Score Tour** - 4 steps
   - ESG score breakdown
   - Carbon footprint tracking
   - Carbon points & tiers
   - Greener alternatives

#### **Journey Features:**
- ✅ Spotlight highlighting with pulsing animation
- ✅ Step-by-step navigation (Next, Previous, Skip)
- ✅ Progress bar showing current step
- ✅ Completion tracking (remembers finished tours)
- ✅ Auto-start for new users (with confirmation)
- ✅ Restart option for completed journeys
- ✅ Journey help button (❓) on all pages

---

### Notification System

#### **In-App Notifications:**
- 🔔 **Notification Bell** in header with unread badge
- 📋 **Notification Center** dropdown with full history
- 🎨 **Toast Notifications** (slide-in from top-right)
- 📱 **5 Categories**: Financial, ESG, SmartPay, Security, Achievement

#### **Notification Types:**
- ✅ Success (green)
- ❌ Error (red)
- ⚠️ Warning (orange)
- ℹ️ Info (blue)
- 🏆 Achievement (purple)

#### **Priority Levels:**
- 🔴 **Critical** - Persistent, voice announcement
- 🟠 **Important** - 10 second toast
- 🟢 **Normal** - 5 second toast

#### **Browser Push Notifications:**
- 📲 Service Worker registered (`sw.js`)
- 🔒 Permission request system
- 📦 Background notifications (even when app closed)
- 🎯 Click-to-action functionality

---

## 🚀 How to Use

### For Users:

#### **Starting a Journey:**
1. Click the **❓ Help button** (bottom-right)
2. Or manually: Open browser console and type:
   ```javascript
   journeyEngine.startJourney('onboarding')
   ```

#### **Available Journeys:**
- `'onboarding'` - Welcome tour
- `'credit-line-tour'` - Credit management guide
- `'esg-tour'` - ESG score explanation

#### **Using Notifications:**
1. Click the **🔔 Bell icon** in header to view notification center
2. Click "Enable Push" to receive browser notifications
3. Click any notification to mark as read
4. Click "Mark all read" to clear unread count
5. Click **×** on individual notifications to delete

---

## 💻 For Developers

### Creating Notifications:

```javascript
// Simple notification
notificationService.create({
  title: 'Payment Successful',
  message: 'AED 500 has been credited to your account.',
  type: 'success',
  category: 'financial',
  priority: 'normal'
});

// Notification with action
notificationService.create({
  title: 'Credit Utilization Warning',
  message: 'You are using 85% of your credit limit.',
  type: 'warning',
  category: 'financial',
  priority: 'important',
  actionUrl: 'credit-line.php',
  actionLabel: 'Repay Now'
});

// Achievement notification
notificationService.create({
  title: 'Silver Tier Unlocked! 🥈',
  message: 'You earned 50 carbon points!',
  type: 'achievement',
  category: 'esg',
  priority: 'normal',
  icon: '🏆'
});
```

### Creating Custom Journeys:

```javascript
journeyEngine.registerJourney({
  id: 'custom-tour',
  name: 'My Custom Tour',
  description: 'Learn about custom features',
  estimatedTime: '2 min',
  steps: [
    {
      title: 'Step 1 Title',
      description: 'Description of what user should see/do',
      tip: 'Optional helpful tip',
      element: '.css-selector', // Element to highlight
      position: 'bottom', // tooltip position: top, bottom, left, right
      beforeAction: () => {
        // Optional: Execute before showing this step
        console.log('Preparing step...');
      },
      afterAction: () => {
        // Optional: Execute after user clicks "Next"
        console.log('Step completed');
      }
    },
    // ... more steps
  ]
});

// Start the journey
journeyEngine.startJourney('custom-tour');
```

### Triggering Notifications from Actions:

```javascript
// After a payment
window.triggerPaymentNotification(500, 'repay');

// After enabling auto-sweep
window.triggerAutoSweepNotification(0, true);

// After creating SmartPay rule
window.triggerRuleNotification('Weekend Repayment');

// Credit utilization warning
window.triggerCreditWarning(85); // 85% utilization
```

### Sending Backend Push Notifications:

```php
// Send to specific user
$ch = curl_init('http://yourdomain.com/v1/api/notification_send.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'userId' => 'user123',
    'title' => 'Payment Due',
    'message' => 'Your credit payment is due in 3 days',
    'category' => 'financial',
    'priority' => 'important',
    'actionUrl' => 'credit-line.php'
]));
curl_exec($ch);
curl_close($ch);

// Broadcast to all users
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'userId' => 'all',
    'title' => 'System Maintenance',
    'message' => 'Scheduled maintenance on Friday 10 PM',
    'category' => 'general',
    'priority' => 'normal'
]));
```

---

## 📁 Files Created/Modified

### **New Files Created:**
```
v1/
├── js/
│   ├── notification-service.js    (Notification engine)
│   └── journey-engine.js          (Journey orchestrator)
├── css/
│   ├── notifications.css          (Toast & center styling)
│   └── journey.css                (Journey overlay styling)
├── api/
│   ├── notification_subscribe.php (Push subscription)
│   └── notification_send.php      (Send notifications)
└── sw.js                          (Service Worker)
```

### **Modified Files:**
```
v1/
├── index.html          (Added notification bell, scripts)
├── apply.html          (Added notification bell, scripts)
├── transactions.html   (Added notification bell, scripts)
├── esg-score.html      (Added notification bell, scripts)
└── js/main.js          (Added notification triggers)
```

---

## 🎨 UI Components

### Notification Bell (Header)
- Position: Right side of header, before user name
- Badge: Shows unread count (red circle)
- Click: Toggles notification center dropdown

### Notification Center (Dropdown)
- Width: 400px (responsive on mobile)
- Max height: 400px (scrollable)
- Actions: "Mark all read", "Enable Push"
- Shows: Icon, title, message, timestamp, action button

### Toast Notifications
- Position: Top-right corner
- Auto-dismiss: 5 seconds (10 for errors)
- Stackable: Multiple toasts queue
- Types: Color-coded by category

### Journey Overlay
- Full-screen dark overlay (70% opacity)
- Spotlight: Pulsing blue border around highlighted element
- Tooltip: Floating card with title, description, progress, actions
- Position: Auto-adjusts to keep tooltip in viewport

### Journey Help Button
- Position: Bottom-right (above chatbot if present)
- Icon: ❓ (question mark)
- Color: Purple gradient
- Hover: Scales up

---

## ⚙️ Configuration

### Notification Preferences (localStorage):
```javascript
// Check if user has seen onboarding
localStorage.getItem('hasSeenOnboarding');

// Completed journeys
localStorage.getItem('completedJourneys');

// Notification history
localStorage.getItem('notifications');

// Last visit date
localStorage.getItem('lastVisitDate');
```

### Push Subscription (Backend):
```
v1/data/
├── push_subscriptions.json      (User subscriptions)
├── notification_history.json    (Sent notifications)
```

---

## 🔧 Customization

### Change Notification Colors:
Edit `css/notifications.css`:
```css
.toast-success { border-left-color: #10b981; }
.toast-error { border-left-color: #ef4444; }
.toast-warning { border-left-color: #f59e0b; }
```

### Change Journey Theme:
Edit `css/journey.css`:
```css
.journey-tooltip-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Adjust Auto-dismiss Time:
Edit `js/notification-service.js`:
```javascript
const duration = toast.type === 'error' ? 10000 : 5000; // milliseconds
```

---

## 🧪 Testing

### Test Notifications:
```javascript
// Open browser console
notificationService.showToast('Test notification', 'success', 'This is a test');

// Test all notification types
['success', 'error', 'warning', 'info', 'achievement'].forEach(type => {
  notificationService.showToast(`${type} notification`, type);
});
```

### Test Journeys:
```javascript
// Start onboarding
journeyEngine.startJourney('onboarding');

// Skip to specific step
journeyEngine.showStep(3);

// Check completed journeys
console.log(journeyEngine.completedJourneys);

// Reset completion
localStorage.removeItem('completedJourneys');
localStorage.removeItem('hasSeenOnboarding');
```

### Test Push Permissions:
```javascript
// Request permission
notificationService.requestPushPermission();

// Check permission status
console.log(Notification.permission);
```

---

## 🐛 Troubleshooting

### Notifications not showing:
1. Check browser console for errors
2. Verify `notification-service.js` is loaded
3. Check localStorage quota (clear if full)

### Journey not starting:
1. Verify `journey-engine.js` is loaded
2. Check if element selectors exist in DOM
3. Clear completed journeys: `localStorage.removeItem('completedJourneys')`

### Push notifications not working:
1. Check HTTPS (required for push)
2. Verify service worker registered: `navigator.serviceWorker.getRegistration()`
3. Check browser compatibility (Chrome, Firefox, Edge)
4. Ensure notification permission granted

### Notification center not closing:
- Click outside the dropdown
- Press ESC key
- Refresh page

---

## 📊 Analytics Events

The system tracks these events (logged to console, can be sent to analytics):

### Journey Events:
- `journey_started` - User began a journey
- `journey_step_viewed` - User viewed a step
- `journey_completed` - User finished entire journey
- `journey_skipped` - User skipped before completion

### Notification Events:
- Notification created (logged in notification history)
- Notification clicked (actionUrl visited)
- Notification dismissed (deleted or marked read)
- Push permission granted/denied

---

## 🎯 Next Steps / Future Enhancements

1. **Add more journeys:**
   - Transaction filtering guide
   - Voice commands tutorial
   - SmartPay rules wizard

2. **Enhanced notifications:**
   - Notification grouping by category
   - Snooze functionality
   - Scheduled notifications
   - Rich media (images, charts)

3. **Backend integration:**
   - Real Web Push library (minishlink/web-push)
   - Database storage for subscriptions
   - User preference management UI
   - A/B testing different journey flows

4. **Advanced features:**
   - Journey branching (different paths based on user actions)
   - Video tutorials in journey steps
   - Gamification (badges for completing journeys)
   - Multi-language support

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review this documentation
3. Test in incognito mode (fresh state)
4. Clear localStorage and refresh

---

## ✅ Verification Checklist

- [x] Notification bell appears in header
- [x] Clicking bell opens notification center
- [x] Toast notifications slide in from top-right
- [x] Journey help button (❓) visible bottom-right
- [x] Clicking help button starts onboarding tour
- [x] Journey spotlight highlights elements
- [x] Journey tooltip shows progress
- [x] Service worker registered (check DevTools > Application)
- [x] Push permission can be requested
- [x] Notifications persist in localStorage
- [x] Voice feedback announces critical notifications
- [x] Responsive on mobile devices

---

**Implementation Date:** November 13, 2025  
**Version:** 1.0  
**Platform:** Shukria Smart Credit - v1

🎉 **Interactive Journey & Push Notifications are now live!**
