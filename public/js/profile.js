const DARK_MODE_KEY = "rha_dark_mode";

function initDarkMode() {
  const isDark = localStorage.getItem(DARK_MODE_KEY) === "true";
  if (isDark) {
    document.body.classList.add("dark");
    document.getElementById("darkModeBtn").textContent = "☀️";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initDarkMode();

  // Dark mode toggle
  document.getElementById("darkModeBtn").addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(DARK_MODE_KEY, isDark);
    document.getElementById("darkModeBtn").textContent = isDark ? "☀️" : "🌙";
  });

  // Home button
  document.getElementById("homeBtn").addEventListener("click", () => {
    window.location.href = "../pages/index.html";
  });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
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
    document.getElementById("username").value = data.user.username;
    document.getElementById("email").value = data.user.email;
    document.getElementById("displayUsername").textContent = data.user.username;
    document.getElementById("displayEmail").textContent = data.user.email;
  } catch (err) {
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
      successEl.textContent = "Profile updated successfully!";
      document.getElementById("displayUsername").textContent = username;
      document.getElementById("displayEmail").textContent = email;

      setTimeout(() => {
    successEl.textContent = "";
}, 3000);
    } else {
      errorEl.textContent = "Failed to update profile.";
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