/*const DARK_MODE_KEY = "rha_dark_mode";

function initDarkMode() {
  const isDark = localStorage.getItem(DARK_MODE_KEY) === "true";
  if (isDark) {
    document.body.classList.add("dark");
    document.getElementById("darkModeBtn").textContent = "☀️";
  }
}*/

const DARK_MODE_KEY = "rha_dark_mode";
(function initDarkMode() {
  if (localStorage.getItem(DARK_MODE_KEY) === "true") {
    document.body.classList.add("dark");
  }
})()

document.addEventListener("DOMContentLoaded", async () => {
  /*initDarkMode();

  // Dark mode toggle
  document.getElementById("darkModeBtn").addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(DARK_MODE_KEY, isDark);
    document.getElementById("darkModeBtn").textContent = isDark ? "☀️" : "🌙";
  }); */

  // Home button
  document.getElementById("homeBtn").addEventListener("click", () => {
    window.location.href = "../pages/index.html";
  });
 //Settings button
  document.getElementById("settingsBtn").addEventListener("click", () => {
  window.location.href = "/pages/settings.html";
});

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
  });

  // Live username validation
  document.getElementById("username").addEventListener("input", function () {
  const val = this.value.trim();
  const error = document.getElementById("usernameError");
  if (!val) {
    setHint(error, "Please enter a username.", "error");
  } else if (val.length < 4) {
    setHint(error, "Username must be at least 4 characters.", "error");
  } else if (val.length > 14) {
    setHint(error, "Username must be under 14 characters.", "error");
  } else if (!/^[a-zA-Z0-9_]+$/.test(val)) {
    setHint(error, "Only letters, numbers, and underscores.", "error");
  } else {
    setHint(error, "✔ Looks good!", "success");
  }
});

// Live email validation
document.getElementById("email").addEventListener("input", function () {
  const val = this.value.trim();
  const error = document.getElementById("emailError");
  if (!val) {
    setHint(error, "Please enter your email.", "error");
  } else if (!isValidEmail(val)) {
    setHint(error, "Please enter a valid email address.", "error");
  } else {
    setHint(error, "✔ Looks good!", "success");
  }
});

  // Load user info
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:3000/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
 // Replace skeleton with real content
  document.getElementById("profileCard").innerHTML = `
    <div class="profile-avatar">👤</div>
    <h2 class="profile-name" id="displayUsername">${data.user.username}</h2>
    <p class="profile-email" id="displayEmail">${data.user.email}</p>
  `;

  document.getElementById("username").value = data.user.username;
  document.getElementById("email").value = data.user.email;
} catch (err) {
  document.getElementById("profileCard").innerHTML = `
    <div class="profile-avatar">👤</div>
    <h2 class="profile-name">Could not load profile</h2>
    <p class="profile-email">Please refresh the page</p>
  `;
  console.error(err);
}
  // Update profile
document.getElementById("updateProfile").addEventListener("click", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const successEl = document.getElementById("updateSuccess");
  const errorEl = document.getElementById("updateError");

  clearFormErrors();
  successEl.textContent = "";
  errorEl.textContent = "";

  let valid = true;

  if (!username) {
    showFormError("usernameError", "Please enter a username.");
    valid = false;
  } else if (username.length < 4) {
    showFormError("usernameError", "Username must be at least 4 characters.");
    valid = false;
  } else if (username.length > 14) {
    showFormError("usernameError", "Username must be under 14 characters.");
    valid = false;
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showFormError("usernameError", "Only letters, numbers, and underscores.");
    valid = false;
  }

  if (!email) {
    showFormError("emailError", "Please enter your email.");
    valid = false;
  } else if (!isValidEmail(email)) {
    showFormError("emailError", "Please enter a valid email address.");
    valid = false;
  }

  if (!valid) return;

  try {
    const res = await fetch("http://localhost:3000/update-user-db", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username, email })
    });
  if (res.ok) {
    const data = await res.json();
    console.log("emailChanged:", data.emailChanged);

    if (data.emailChanged) {
      successEl.textContent = "Profile updated! Check your email to verify your new address.";
      await fetch("/api/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
    } else {
      successEl.textContent = "Profile updated successfully!";
    }
    document.getElementById("displayUsername").textContent = username;
    document.getElementById("displayEmail").textContent = email;
    setTimeout(() => { successEl.textContent = ""; }, 5000);
  } else {
    const data = await res.json();
    console.log("Update failed:", data);
    errorEl.textContent = "Failed to update profile.";
  }
} catch (err) {
  errorEl.textContent = "Something went wrong. Try again later";
}
});

// Live new password validation
document.getElementById("newPassword").addEventListener("input", function () {
  const val = this.value;
  const error = document.getElementById("newPasswordError");
  if (!val) {
    setHint(error, "Please enter a new password.", "error");
  } else if (getPasswordStrength(val) < 4) {
    setHint(error, "Password is too weak.", "error");
  } else {
    setHint(error, "✔ Strong password!", "success");
  }

  // recheck confirm if already typed
  const confirmVal = document.getElementById("confirmNewPassword").value;
  if (confirmVal) {
    const confirmError = document.getElementById("confirmNewPasswordError");
    if (confirmVal !== val) {
      setHint(confirmError, "Passwords do not match.", "error");
    } else {
      setHint(confirmError, "✔ Passwords match!", "success");
    }
  }
});

// Live confirm password validation
document.getElementById("confirmNewPassword").addEventListener("input", function () {
  const val = this.value;
  const newPassword = document.getElementById("newPassword").value;
  const error = document.getElementById("confirmNewPasswordError");
  if (!val) {
    setHint(error, "Please confirm your password.", "error");
  } else if (val !== newPassword) {
    setHint(error, "Passwords do not match.",  "error");
  } else {
    setHint(error, "✔ Passwords match!", "success");
  }
});

// Update password
document.getElementById("updatePassword").addEventListener("click", async () => {
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();
  const successEl = document.getElementById("passwordSuccess");
  const errorEl = document.getElementById("passwordError");

  successEl.textContent = "";
  errorEl.textContent = "";

  let valid = true;

  if (!currentPassword) {
    showFormError("currentPasswordError", "Please enter your current password.");
    valid = false;
  }

  if (!newPassword) {
    showFormError("newPasswordError", "Please enter a new password.");
    valid = false;
  } else if (getPasswordStrength(newPassword) < 4) {
    showFormError("newPasswordError", "Password is too weak.");
    valid = false;
  }

  if (!confirmNewPassword) {
    showFormError("confirmNewPasswordError", "Please confirm your new password.");
    valid = false;
  } else if (confirmNewPassword !== newPassword) {
    showFormError("confirmNewPasswordError", "Passwords do not match.");
    valid = false;
  }

  if (!valid) return;

  try {
    const res = await fetch("http://localhost:3000/update-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

if (res.ok) {
  successEl.textContent = "Password updated successfully!";
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
  setTimeout(() => { successEl.textContent = ""; }, 3000);
} else {
  const data = await res.json();
  errorEl.textContent = data.error || "Failed to update password.";
}

 } catch (err) {
    errorEl.textContent = "Something went wrong.";
  }
});
});
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.style.display = "block";
  }
}

function clearFormErrors() {
  ["usernameError", "emailError"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
  });
}

function setHint(el, message, type) {
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    el.style.color = type === "success" ? "#2ecc71" : "#e74c3c";
  }
}

function getPasswordStrength(val) {
  let strength = 0;
  if (val.length >= 8) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;
  return strength;
}

function toggleInput(id, btn) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}