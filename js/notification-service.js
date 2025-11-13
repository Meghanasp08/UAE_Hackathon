// Notification Service - Push Notifications & In-App Alerts
// Handles toast notifications, notification center, and browser push

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.toastQueue = [];
    this.isToastShowing = false;
    this.pushEnabled = false;
    this.loadFromLocalStorage();
    this.initializePushNotifications();
  }

  // Load notifications from localStorage
  loadFromLocalStorage() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      this.notifications = JSON.parse(stored);
      this.updateUnreadCount();
    }
  }

  // Save notifications to localStorage
  saveToLocalStorage() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Initialize browser push notifications
  async initializePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/v1/sw.js');
      console.log('Service Worker registered:', registration);

      // Check if user already granted permission
      const permission = await Notification.permission;
      if (permission === 'granted') {
        this.pushEnabled = true;
        await this.subscribeToPush(registration);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Request push notification permission
  async requestPushPermission() {
    if (!('Notification' in window)) {
      this.showToast('Push notifications not supported', 'error');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      this.pushEnabled = true;
      const registration = await navigator.serviceWorker.ready;
      await this.subscribeToPush(registration);
      this.showToast('Push notifications enabled! Shukria', 'success');
      return true;
    } else {
      this.showToast('Push notifications denied', 'error');
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(registration) {
    try {
      // In production, you'd use real VAPID keys from your backend
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nqm';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to backend
  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('api/notification_subscribe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription,
          userId: this.getUserId()
        })
      });
      const result = await response.json();
      console.log('Subscription sent to backend:', result);
    } catch (error) {
      console.error('Failed to send subscription:', error);
    }
  }

  // Get user ID from localStorage
  getUserId() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.userId || user.email || 'demo_user';
    }
    return 'demo_user';
  }

  // Create a notification
  create(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info', // success, error, warning, info, achievement
      category: notification.category || 'general', // financial, esg, smartpay, security, achievement
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: notification.actionUrl || null,
      actionLabel: notification.actionLabel || null,
      priority: notification.priority || 'normal', // critical, important, normal
      icon: notification.icon || this.getIconForType(notification.type)
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;
    this.saveToLocalStorage();
    this.updateUI();

    // Show toast for important/critical
    if (notification.priority === 'critical' || notification.priority === 'important' || notification.showToast !== false) {
      this.showToast(notification.title, notification.type, notification.message);
    }

    // Speak for critical notifications
    if (notification.priority === 'critical' && typeof speak === 'function') {
      speak(notification.title, true);
    }

    return newNotification;
  }

  // Get icon based on type
  getIconForType(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      achievement: '🏆',
      financial: '💰',
      esg: '🌱',
      security: '🔒'
    };
    return icons[type] || 'ℹ️';
  }

  // Show toast notification
  showToast(title, type = 'info', message = '') {
    this.toastQueue.push({ title, type, message });
    
    if (!this.isToastShowing) {
      this.processToastQueue();
    }
  }

  // Process toast queue
  async processToastQueue() {
    if (this.toastQueue.length === 0) {
      this.isToastShowing = false;
      return;
    }

    this.isToastShowing = true;
    const toast = this.toastQueue.shift();
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${toast.type}`;
    toastEl.innerHTML = `
      <div class="toast-icon">${this.getIconForType(toast.type)}</div>
      <div class="toast-content">
        <div class="toast-title">${toast.title}</div>
        ${toast.message ? `<div class="toast-message">${toast.message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">×</button>
    `;

    // Add to DOM
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toastEl);

    // Close button
    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toastEl.classList.add('toast-exit');
      setTimeout(() => {
        toastEl.remove();
        this.processToastQueue();
      }, 300);
    });

    // Auto dismiss based on priority
    const duration = toast.type === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.classList.add('toast-exit');
        setTimeout(() => {
          toastEl.remove();
          this.processToastQueue();
        }, 300);
      }
    }, duration);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount--;
      this.saveToLocalStorage();
      this.updateUI();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.saveToLocalStorage();
    this.updateUI();
  }

  // Delete notification
  delete(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      if (!this.notifications[index].read) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);
      this.saveToLocalStorage();
      this.updateUI();
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveToLocalStorage();
    this.updateUI();
  }

  // Update unread count
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // Update UI
  updateUI() {
    this.updateBadge();
    this.updateNotificationCenter();
  }

  // Update notification badge
  updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Update notification center
  updateNotificationCenter() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-empty">
          <div class="notification-empty-icon">🔔</div>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-title">${n.title}</span>
            <span class="notification-time">${this.formatTime(n.timestamp)}</span>
          </div>
          <div class="notification-message">${n.message}</div>
          ${n.actionUrl ? `
            <a href="${n.actionUrl}" class="notification-action">${n.actionLabel || 'View'}</a>
          ` : ''}
        </div>
        <button class="notification-delete" onclick="notificationService.delete(${n.id}); event.stopPropagation();" aria-label="Delete">×</button>
      </div>
    `).join('');

    // Add click handlers for marking as read and navigation
    list.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking delete button or action link
        if (e.target.classList.contains('notification-delete') || 
            e.target.closest('.notification-delete') ||
            e.target.classList.contains('notification-action')) {
          return;
        }
        
        const notifId = parseFloat(item.dataset.id);
        this.markAsRead(notifId);
        
        // Navigate to action URL if available and not clicking the link directly
        const actionUrl = item.querySelector('.notification-action');
        if (actionUrl && !e.target.classList.contains('notification-action')) {
          window.location.href = actionUrl.href;
        }
      });
    });
  }

  // Format timestamp
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // Toggle notification center
  toggleNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (center) {
      const isHidden = center.hasAttribute('hidden');
      if (isHidden) {
        center.removeAttribute('hidden');
        this.updateNotificationCenter();
      } else {
        center.setAttribute('hidden', '');
      }
    }
  }
}

// Initialize notification service
const notificationService = new NotificationService();

// Demo notifications for testing
function initializeDemoNotifications() {
  // Only add demo notifications if none exist
  if (notificationService.notifications.length === 0) {
    // Welcome notification
    notificationService.create({
      title: 'Welcome to Shukria!',
      message: 'Your smart credit platform is ready. Start exploring features.',
      type: 'success',
      category: 'general',
      priority: 'normal',
      showToast: false
    });
  }
}

// Trigger demo notifications on specific events
function setupNotificationTriggers() {
  // Credit utilization warning
  const checkCreditUtilization = () => {
    const utilization = parseFloat(document.getElementById('usedCredit')?.textContent?.match(/[\d,]+/)?.[0]?.replace(',', '') || 0);
    const limit = 15250; // AED
    const percentage = (utilization / limit) * 100;

    if (percentage > 80 && !localStorage.getItem('credit_warning_shown')) {
      notificationService.create({
        title: 'High Credit Utilization',
        message: `You're using ${percentage.toFixed(0)}% of your credit limit. Consider a repayment.`,
        type: 'warning',
        category: 'financial',
        priority: 'important',
        actionUrl: 'credit-line.php',
        actionLabel: 'Manage Credit'
      });
      localStorage.setItem('credit_warning_shown', 'true');
    }
  };

  // Check on dashboard load
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/v1/') {
    setTimeout(checkCreditUtilization, 2000);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDemoNotifications();
    setupNotificationTriggers();
  });
} else {
  initializeDemoNotifications();
  setupNotificationTriggers();
}
