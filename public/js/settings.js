const DARK_MODE_KEY = "rha_dark_mode";
const UNIT_KEY = "rha_distance_unit";
const LAYER_KEY = "rha_default_layer";
const AUTO_PICKUP_KEY = "rha_auto_pickup";
const TRIP_HISTORY_KEY = "rha_trip_history";

function initDarkMode() {
  const isDark = localStorage.getItem(DARK_MODE_KEY) === "true";
  if (isDark) {
    document.body.classList.add("dark");
   // document.getElementById("darkModeBtn").textContent = "☀️"; //
    document.getElementById("darkModeToggle").checked = true;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
/*
  // Dark mode button
  document.getElementById("darkModeBtn").addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(DARK_MODE_KEY, isDark);
    document.getElementById("darkModeBtn").textContent = isDark ? "☀️" : "🌙";
    document.getElementById("darkModeToggle").checked = isDark;
  });
  */

  // Dark mode toggle
  document.getElementById("darkModeToggle").addEventListener("change", (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem(DARK_MODE_KEY, isDark);
    
    const darkModeBtn = document.getElementById("darkModeBtn");
    if(darkModeBtn){
      darkModeBtn.textContent = isDark ? "☀️" : "🌙";
    }
  });

  // Distance unit
  const unitSelect = document.getElementById("distanceUnitSelect");
  unitSelect.value = localStorage.getItem(UNIT_KEY) || "km";
  unitSelect.addEventListener("change", () => {
    localStorage.setItem(UNIT_KEY, unitSelect.value);
  });

  // Default map layer
  const layerSelect = document.getElementById("defaultLayerSelect");
  layerSelect.value = localStorage.getItem(LAYER_KEY) || "street";
  layerSelect.addEventListener("change", () => {
    localStorage.setItem(LAYER_KEY, layerSelect.value);
  });

  // Auto pickup toggle
  const autoPickup = document.getElementById("autoPickupToggle");
  autoPickup.checked = localStorage.getItem(AUTO_PICKUP_KEY) !== "false";
  autoPickup.addEventListener("change", () => {
    localStorage.setItem(AUTO_PICKUP_KEY, autoPickup.checked);
  });

  // Clear trip history
  document.getElementById("clearTripHistoryBtn").addEventListener("click", () => {
    if (confirm("Clear your trip history?")) {
      localStorage.removeItem(TRIP_HISTORY_KEY);
      showToast("Trip history cleared");
    }
  });

  // Profile button
  document.getElementById("profileBtn").addEventListener("click", () => {
    window.location.href = "/pages/profile.html";
  });

  // Home button
  document.getElementById("homeBtn").addEventListener("click", () => {
    window.location.href = "/pages/index.html";
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
  });
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "settings-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}