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
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const successEl = document.getElementById("updateSuccess");
    const errorEl = document.getElementById("updateError");

    successEl.textContent = "";
    errorEl.textContent = "";

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
      } else {
        errorEl.textContent = "Failed to update profile.";
      }
    } catch (err) {
      errorEl.textContent = "Something went wrong.";
    }
  });
});