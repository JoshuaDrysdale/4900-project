document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('forgotPasswordForm')
    .addEventListener('submit', handleForgotPassword);
});

async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const error = document.getElementById('emailError');
  const btn = document.getElementById('submitBtn');

  console.log('Form submitted with email:', email);  // DEBUG

  try {
    btn.disabled = true;

    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    console.log('Response status:', res.status);  // DEBUG
    console.log('Response ok:', res.ok);  // DEBUG

    if (res.ok) {
      document.getElementById('forgotPasswordForm').style.display = 'none';
      document.getElementById('successBox').style.display = 'block';
    } else {
      const data = await res.json();
      error.textContent = data.error || 'Failed to send email';
      error.style.display = 'block';
    }
  } catch (err) {
    console.error('Error:', err);  // DEBUG
    error.textContent = 'Error occurred: ' + err.message;
    error.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}