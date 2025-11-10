// Login.js - Mobile OTP Authentication

let currentStep = 1;
let mobileNumber = '';
let otpTimer = null;
let otpAttempts = 0;
let maxOtpAttempts = 3;
let generatedOTP = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  initializeLogin();
});

const initializeLogin = () => {
  // Mobile form submission
  const mobileForm = document.getElementById('mobileForm');
  if (mobileForm) {
    mobileForm.addEventListener('submit', handleMobileSubmit);
  }

  // OTP form submission
  const otpForm = document.getElementById('otpForm');
  if (otpForm) {
    otpForm.addEventListener('submit', handleOtpSubmit);
  }

  // Resend OTP
  const resendBtn = document.getElementById('resendOtpBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResendOtp);
  }

  // Change number
  const changeNumberLink = document.getElementById('changeNumberLink');
  if (changeNumberLink) {
    changeNumberLink.addEventListener('click', (e) => {
      e.preventDefault();
      goToStep(1);
      clearOtpTimer();
    });
  }

  // OTP input auto-focus and movement
  setupOtpInputs();
};

const handleMobileSubmit = async (e) => {
  e.preventDefault();
  
  const mobileInput = document.getElementById('mobileNumber');
  const mobileError = document.getElementById('mobileError');
  const sendBtn = document.getElementById('sendOtpBtn');
  
  mobileNumber = mobileInput.value.trim();
  
  // Validate mobile number
  const validation = validateMobileNumber(mobileNumber);
  
  if (!validation.valid) {
    showError(mobileError, validation.message);
    mobileInput.classList.add('error');
    speak(validation.message, false);
    return;
  }
  
  // Clear error
  hideError(mobileError);
  mobileInput.classList.remove('error');
  
  // Disable button and show loading
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="loading-spinner"></span>Sending OTP...';
  
  try {
    // Send OTP (mock API call)
    await sendOTP(mobileNumber);
    
    // Show OTP step
    goToStep(2);
    startOtpTimer();
    
    // Display mobile number
    const displayMobile = document.getElementById('displayMobile');
    if (displayMobile) {
      displayMobile.textContent = formatMobileDisplay(mobileNumber);
    }
    
    speak('OTP sent successfully. Please check your messages.', false);
    
    // Focus first OTP input
    const firstOtpInput = document.querySelector('.otp-input');
    if (firstOtpInput) {
      setTimeout(() => firstOtpInput.focus(), 300);
    }
    
  } catch (error) {
    showError(mobileError, 'Failed to send OTP. Please try again.');
    speak('Failed to send OTP. Please try again.', false);
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = 'Send OTP';
  }
};

const handleOtpSubmit = async (e) => {
  e.preventDefault();
  
  const otpInputs = document.querySelectorAll('.otp-input');
  const otpError = document.getElementById('otpError');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  
  // Get OTP from inputs
  const otp = Array.from(otpInputs).map(input => input.value).join('');
  
  // Validate OTP length
  if (otp.length !== 6) {
    showError(otpError, 'Please enter all 6 digits');
    speak('Please enter all 6 digits', false);
    return;
  }
  
  // Clear error
  hideError(otpError);
  
  // Disable button and show loading
  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<span class="loading-spinner"></span>Verifying...';
  
  try {
    // Verify OTP (mock API call)
    const result = await verifyOTP(mobileNumber, otp);
    
    if (result.success) {
      // Clear timer
      clearOtpTimer();
      
      // Save authentication
      saveAuthentication(result.user, result.token);
      
      // Show success
      goToStep(3);
      speak('Login successful. Welcome to Shukria!', false);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      
    } else {
      otpAttempts++;
      
      if (otpAttempts >= maxOtpAttempts) {
        showError(otpError, 'Maximum attempts reached. Please request a new OTP.');
        speak('Maximum attempts reached. Please request a new OTP.', false);
        
        // Clear OTP inputs
        otpInputs.forEach(input => {
          input.value = '';
          input.classList.remove('filled');
        });
        otpInputs[0].focus();
        
        // Reset attempts after clearing
        otpAttempts = 0;
      } else {
        showError(otpError, `Invalid OTP. ${maxOtpAttempts - otpAttempts} attempts remaining.`);
        speak('Invalid OTP. Please try again.', false);
        
        // Clear OTP inputs
        otpInputs.forEach(input => {
          input.value = '';
          input.classList.remove('filled');
        });
        otpInputs[0].focus();
      }
    }
    
  } catch (error) {
    showError(otpError, 'Verification failed. Please try again.');
    speak('Verification failed. Please try again.', false);
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = 'Verify OTP';
  }
};

const handleResendOtp = async () => {
  const resendBtn = document.getElementById('resendOtpBtn');
  const otpError = document.getElementById('otpError');
  
  resendBtn.disabled = true;
  resendBtn.innerHTML = '<span class="loading-spinner"></span>Resending...';
  
  try {
    // Resend OTP
    await sendOTP(mobileNumber);
    
    hideError(otpError);
    speak('OTP resent successfully.', false);
    
    // Clear OTP inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
    otpInputs[0].focus();
    
    // Restart timer
    startOtpTimer();
    otpAttempts = 0;
    
  } catch (error) {
    showError(otpError, 'Failed to resend OTP. Please try again.');
    speak('Failed to resend OTP.', false);
  } finally {
    resendBtn.innerHTML = 'Resend OTP';
  }
};

// Validate mobile number (UAE format)
const validateMobileNumber = (mobile) => {
  // Remove spaces and dashes
  mobile = mobile.replace(/[\s-]/g, '');
  
  // Check if empty
  if (!mobile) {
    return { valid: false, message: 'Please enter your mobile number' };
  }
  
  // UAE mobile patterns: +971XXXXXXXXX or 971XXXXXXXXX or 05XXXXXXXX or 5XXXXXXXX
  const patterns = [
    /^\+971[0-9]{9}$/,           // +971501234567
    /^971[0-9]{9}$/,              // 971501234567
    /^0[0-9]{9}$/,                // 0501234567
    /^[0-9]{9}$/                  // 501234567
  ];
  
  const isValid = patterns.some(pattern => pattern.test(mobile));
  
  if (!isValid) {
    return { 
      valid: false, 
      message: 'Please enter a valid UAE mobile number (e.g., +971 50 123 4567)' 
    };
  }
  
  return { valid: true, message: '' };
};

// Format mobile for display
const formatMobileDisplay = (mobile) => {
  mobile = mobile.replace(/[\s-]/g, '');
  
  // Normalize to +971 format
  if (mobile.startsWith('+971')) {
    return mobile.slice(0, 4) + ' XX XXX ' + mobile.slice(-4);
  } else if (mobile.startsWith('971')) {
    return '+971 XX XXX ' + mobile.slice(-4);
  } else if (mobile.startsWith('0')) {
    return '+971 ' + mobile.slice(1, 2) + 'X XXX ' + mobile.slice(-4);
  } else {
    return '+971 XX XXX ' + mobile.slice(-4);
  }
};

// Send OTP (mock API)
const sendOTP = async (mobile) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate random 6-digit OTP
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // For demo, always use 123456 or log the generated OTP
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 OTP SENT TO:', mobile);
  console.log('🔐 YOUR OTP IS:', '123456');
  console.log('🔐 GENERATED OTP:', generatedOTP);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Simulate SMS sending
  return { success: true };
};

// Verify OTP (mock API)
const verifyOTP = async (mobile, otp) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo, accept 123456 or any 6-digit number
  const isValid = otp === '123456' || otp === generatedOTP || /^\d{6}$/.test(otp);
  
  if (isValid) {
    // Generate mock user data
    const user = {
      mobile: mobile,
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      emiratesId: 'AE123456789',
      loginTime: new Date().toISOString()
    };
    
    // Generate mock token
    const token = 'Bearer ' + btoa(mobile + ':' + Date.now());
    
    return { success: true, user, token };
  }
  
  return { success: false };
};

// Save authentication
const saveAuthentication = (user, token) => {
  // Save to localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('userInfo', JSON.stringify(user));
  localStorage.setItem('loginTime', Date.now().toString());
  
  console.log('✅ User authenticated:', user.name);
};

// Check if authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const loginTime = localStorage.getItem('loginTime');
  
  if (!token || !loginTime) {
    return false;
  }
  
  // Check if session expired (24 hours)
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  const elapsed = Date.now() - parseInt(loginTime);
  
  if (elapsed > sessionDuration) {
    // Session expired
    clearAuthentication();
    return false;
  }
  
  return true;
};

// Clear authentication
const clearAuthentication = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('loginTime');
};

// OTP Timer
const startOtpTimer = () => {
  let timeLeft = 60;
  const timerDisplay = document.getElementById('timerDisplay');
  const timerText = document.getElementById('timerText');
  const resendBtn = document.getElementById('resendOtpBtn');
  
  // Clear any existing timer
  clearOtpTimer();
  
  // Update display
  timerDisplay.textContent = timeLeft;
  timerText.classList.remove('expired');
  resendBtn.disabled = true;
  
  otpTimer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearOtpTimer();
      timerText.classList.add('expired');
      timerText.innerHTML = 'OTP expired. <span class="resend-link" id="resendFromTimer">Resend OTP</span>';
      resendBtn.disabled = false;
      
      // Add click handler to inline resend link
      const resendLink = document.getElementById('resendFromTimer');
      if (resendLink) {
        resendLink.addEventListener('click', handleResendOtp);
      }
    }
  }, 1000);
};

const clearOtpTimer = () => {
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
};

// Setup OTP inputs
const setupOtpInputs = () => {
  const otpInputs = document.querySelectorAll('.otp-input');
  
  otpInputs.forEach((input, index) => {
    // Only allow numbers
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      
      // Remove non-numeric characters
      e.target.value = value.replace(/[^0-9]/g, '');
      
      // Move to next input if filled
      if (e.target.value.length === 1) {
        e.target.classList.add('filled');
        
        if (index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        } else {
          // All inputs filled, can auto-submit
          e.target.blur();
        }
      } else {
        e.target.classList.remove('filled');
      }
    });
    
    // Handle backspace
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
        otpInputs[index - 1].value = '';
        otpInputs[index - 1].classList.remove('filled');
      }
    });
    
    // Handle paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
      
      // Fill all inputs with pasted data
      for (let i = 0; i < Math.min(pastedData.length, otpInputs.length); i++) {
        otpInputs[i].value = pastedData[i];
        otpInputs[i].classList.add('filled');
      }
      
      // Focus appropriate input
      const nextEmptyIndex = Math.min(pastedData.length, otpInputs.length - 1);
      otpInputs[nextEmptyIndex].focus();
    });
  });
};

// Navigate between steps
const goToStep = (stepNumber) => {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show target step
  const targetStep = document.getElementById(`step${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }
  
  currentStep = stepNumber;
};

// Show error message
const showError = (element, message) => {
  if (element) {
    element.textContent = message;
    element.classList.add('show');
  }
};

// Hide error message
const hideError = (element) => {
  if (element) {
    element.textContent = '';
    element.classList.remove('show');
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.isAuthenticated = isAuthenticated;
  window.clearAuthentication = clearAuthentication;
  window.getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  };
}
