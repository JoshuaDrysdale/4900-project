const params = new URLSearchParams(window.location.search);
let token = params.get('token');
const email = params.get('email');

// Make sure token isn't double-encoded
if (token && token.includes('%')) {
  token = decodeURIComponent(token);
}

console.log('Token from URL (first 20):', token ? token.substring(0, 20) : 'MISSING');

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('resetForm')
    .addEventListener('submit', handleResetPassword);
});

async function handleResetPassword(e) {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    return showError('Passwords do not match');
  }

  try {
    console.log('Sending token (first 20):', token.substring(0, 20));
    
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, newPassword })
    });

    if (res.ok) {
      document.getElementById('resetForm').style.display = 'none';
      document.getElementById('successMessage').style.display = 'block';
    } else {
      const data = await res.json();
      showError(data.error || 'Reset failed');
    }
  } catch (err) {
    showError('Error occurred: ' + err.message);
  }
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
}