    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    let resendCountdown = 0;

    // Verify email on page load
    window.addEventListener('DOMContentLoaded', verifyEmail);

    async function verifyEmail() {
      if (!token || !email) {
        showError('Invalid verification link. Please check your email again.');
        return;
      }

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email })
        });

        const data = await response.json();

        if (response.ok) {
          showSuccess();
        } else {
          showError(data.error || 'Email verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        showError('Something went wrong. Please try again.');
      }
    }

    function showSuccess() {
      document.getElementById('loadingBox').style.display = 'none';
      document.getElementById('successBox').style.display = 'block';
      console.log('✅ Email verified successfully');
    }

    function showError(message) {
      document.getElementById('loadingBox').style.display = 'none';
      document.getElementById('errorBox').style.display = 'block';
      document.getElementById('errorMessage').textContent = message;
    }

    async function resendVerificationEmail() {
      const resendBtn = document.getElementById('resendBtn');
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please log in first');
        goToLogin();
        return;
      }

      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';

      try {
        const response = await fetch('/api/resend-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
          alert('✓ Verification email sent! Check your inbox.');
          startResendCountdown();
        } else {
          alert('❌ ' + (data.error || 'Failed to resend email'));
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Verification Email';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Verification Email';
      }
    }

    function startResendCountdown() {
      const resendBtn = document.getElementById('resendBtn');
      const countdown = document.getElementById('countdown');
      resendCountdown = 60;

      const interval = setInterval(() => {
        resendCountdown--;
        countdown.textContent = `Can resend in ${resendCountdown}s`;

        if (resendCountdown <= 0) {
          clearInterval(interval);
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Verification Email';
          countdown.textContent = '';
        }
      }, 1000);
    }

    function goToMap() {
      window.location.href = '../pages/index.html';
    }

    function goToAccount() {
      // Open account modal on map page
      localStorage.setItem('openAccountModal', 'true');
      window.location.href = '../pages/index.html';
    }

    function goToLogin() {
      window.location.href = '../pages/login.html';
    }