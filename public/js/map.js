// =============================================================================
// JWT TOKEN VERIFICATION — Protect the map page
// =============================================================================
 
function getToken() {
  return localStorage.getItem("token");
}
 
function isAuthenticated() {
  const token = getToken();
  return token !== null;
}
 
// Redirect to login if not authenticated
window.addEventListener("DOMContentLoaded", () => {
  if (!isAuthenticated()) {
    console.warn("⚠️ No token found, redirecting to login");
    window.location.href = "/pages/login.html";
  }
});

// =============================================================================
// DARK MODE
// =============================================================================
const DARK_MODE_KEY = "rha_dark_mode";

function initDarkMode() {
  const isDark = localStorage.getItem(DARK_MODE_KEY) === "true";
  if (isDark) {
    document.body.classList.add("dark");
    document.getElementById("darkModeBtn").textContent = "☀️";
  }
}

document.getElementById("darkModeBtn").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(DARK_MODE_KEY, isDark);
  document.getElementById("darkModeBtn").textContent = isDark ? "☀️" : "🌙";
});

initDarkMode();

// =============================================================================
// LOGOUT FUNCTION
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

function logout() {
  localStorage.removeItem("token");
  console.log("✅ Logged out, token removed from localStorage");
  window.location.href = "/pages/login.html";
}
// =============================================================================
// MAP INITIALIZATION
// =============================================================================

const map = L.map("map", {
  worldCopyJump: false,
  minZoom: 3,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ],
  maxBoundsViscosity: 0.5
}).setView([40.631092, -73.95244], 16);

// =============================================================================
// TILE LAYERS
// =============================================================================

const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  noWrap: true
});

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles © Esri",
  noWrap: true
});

const esriStreet = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles © Esri"
});

const esriTopo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles © Esri"
});

const osmHum = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
});

// Experimenting — too light or dark for now

// const lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
//   attribution: "&copy; OpenStreetMap &copy; Carto",
//   subdomains: "abcd"
// });

// const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
//   attribution: "&copy; OpenStreetMap &copy; Carto",
//   subdomains: "abcd",
//   maxZoom: 19
// });


// Add default layer
streetLayer.addTo(map);

// Layer control
L.control.layers({
  "Street":    streetLayer,
  "Satellite": satelliteLayer,
  "Test1":     esriStreet,
  "Test2":     esriTopo,
  "Test3":     osmHum
  // "Light":  lightLayer,
  // "Dark":   darkLayer
}).addTo(map);

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================
let distanceUnit = "km";
const pickupInput  = document.getElementById("pickupInput");
const dropoffInput = document.getElementById("dropoffInput");

const tripHistoryList = document.getElementById("tripHistoryList");
const TRIP_HISTORY_KEY = "rha_trip_history";

let pickup        = null;
let dropoff       = null;
let markerPickup  = null;
let markerDropoff = null;
let inputMode     = "address"; // "address" = Enter Address mode (default)

const pickupIcon = L.divIcon({
  className: "",
  html: '<div class="pulse-marker"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

const dropoffIcon = L.divIcon({
  className: "",
  html: '<div class="pulse-marker dropoff"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

// =============================================================================
// GLOBAL EVENT LISTENERS
// =============================================================================

const debouncedPickup  = debounce((e) => autocomplete(e, "pickupSuggestions"), 200);
const debouncedDropoff = debounce((e) => autocomplete(e, "dropoffSuggestions"), 200);

pickupInput.addEventListener("input", debouncedPickup);
dropoffInput.addEventListener("input", debouncedDropoff);

document.getElementById("swapLocations").addEventListener("click", swapLocations);

document.getElementById("resetBtn").addEventListener("click", () => {
  if (markerPickup)  { map.removeLayer(markerPickup);  markerPickup  = null; }
  if (markerDropoff) { map.removeLayer(markerDropoff); markerDropoff = null; }
  
  if (window.currentRoute) { map.removeLayer(window.currentRoute); window.currentRoute = null; }
  if (window.startMarker)  { map.removeLayer(window.startMarker);  window.startMarker  = null; }
  if (window.endMarker)    { map.removeLayer(window.endMarker);    window.endMarker    = null; }

  pickup = null;
  dropoff = null;
  pickupInput.value  = "";
  dropoffInput.value = "";
  pickupInput.dispatchEvent(new Event("input")); 
dropoffInput.dispatchEvent(new Event("input")); 
  const trafficEl = document.getElementById("trafficIndicator");
  if (trafficEl) trafficEl.remove();
  hideBottomTab();

});
document.getElementById("addressModeBtn").addEventListener("click", () => {
  inputMode = "address";

  pickupInput.disabled  = false;
  dropoffInput.disabled = false;

  map.getContainer().style.cursor = "";

  document.getElementById("addressModeBtn").classList.add("active");
  document.getElementById("mapModeBtn").classList.remove("active");
});

document.getElementById("mapModeBtn").addEventListener("click", () => {
  inputMode = "map";

  pickupInput.disabled  = true;
  dropoffInput.disabled = true;

  map.getContainer().style.cursor = "crosshair";

  document.getElementById("mapModeBtn").classList.add("active");
  document.getElementById("addressModeBtn").classList.remove("active");
});

function getTrafficLevel(delaySeconds) {
  if (delaySeconds < 60)  return { level: "light",    label: "Light traffic",    color: "#22c55e" };
  if (delaySeconds < 300) return { level: "moderate",  label: "Moderate traffic", color: "#f59e0b" };
  return                         { level: "heavy",     label: "Heavy traffic",    color: "#ef4444" };
}

//Recenter button will always reset the optional pickup assignment
document.getElementById("recenterBtn").addEventListener("click", getUserLocation);


// =============================================================================
// MAP CLICK — SELECT PICKUP / DROPOFF ON MAP
// =============================================================================

map.on("click", async function (e) {
  // Only process clicks in "map" input mode
  if (inputMode !== "map") return;

  const coords = e.latlng;

  try {
    const addressLabel = await reverseGeocode(coords.lat, coords.lng);

    // Set pickup if not yet placed
    if (!pickup) {
      if (markerPickup) map.removeLayer(markerPickup);

      pickup = coords;
      pickupInput.value = addressLabel;
      pickupInput.dispatchEvent(new Event("input"));
      markerPickup = L.marker(coords, { icon: pickupIcon }).addTo(map).bindPopup("Pickup").openPopup();
    // Set dropoff if pickup is already placed
    } else if (!dropoff) {
      if (markerDropoff) map.removeLayer(markerDropoff);

      dropoff = coords;
      dropoffInput.value = addressLabel;
      dropoffInput.dispatchEvent(new Event("input"));
    markerDropoff = L.marker(coords, { icon: dropoffIcon }).addTo(map).bindPopup("Dropoff").openPopup();   
   }

    if (pickup && dropoff) {
     tomRoute(pickup, dropoff);
   }

  } catch (err) {
    console.error(err);
  }
});

// =============================================================================
// GEOCODING
// =============================================================================

// Convert an address string to geographic coordinates (lat/lng)
async function geocode(address) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error("Geocode proxy failed");

    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    return {
      lat:   feature.geometry.coordinates[1],
      lng:   feature.geometry.coordinates[0],
      label: feature.properties.label
    };

  } catch (err) {
    console.error("Geocode failed:", err);
    return null;
  }
}

// Convert geographic coordinates to a human-readable address
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`/api/reverse?lat=${lat}&lon=${lng}`);
    if (!res.ok) throw new Error("Reverse proxy failed");

    const data = await res.json();
    if (!data.features || data.features.length === 0)
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    const props  = data.features[0].properties;
    const house  = props.housenumber || "";
    const street = props.street || props.name || "";
    const city   = props.city || props.state || props.country || "";

    return `${house} ${street}, ${city}`.trim();

  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// =============================================================================
// SET PICKUP / DROPOFF FROM ADDRESS INPUT
// =============================================================================

async function setPickup() {
  document.getElementById("pickupSuggestions").innerHTML = "";
  if (inputMode !== "address") return;

  const address = pickupInput.value;
  if (!address) return;

  const result = await geocode(address);
  if (!result) {
    const input = document.getElementById("pickupInput");
    input.style.borderColor = "#ef4444";
    showInputError("pickupError", "Address not found, please try again.");
    setTimeout(() => {
        input.style.borderColor = "";
        clearInputError("pickupError");
    }, 3000);
    return;
}
  const coords = { lat: result.lat, lng: result.lng };
  if (result.label) pickupInput.value = result.label;

  if (markerPickup) map.removeLayer(markerPickup);

  pickup = coords;
      markerPickup = L.marker(coords, { icon: pickupIcon }).addTo(map).bindPopup("Pickup").openPopup();
  map.setView(coords, 15);

  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

async function setDropoff() {
  document.getElementById("dropoffSuggestions").innerHTML = "";
  if (inputMode !== "address") return;

  const address = dropoffInput.value;
  if (!address) return;

  const result = await geocode(address);
  if (!result) {
    const input = document.getElementById("dropoffInput");
    input.style.borderColor = "#ef4444";
    showInputError("dropoffError", "Address not found, please try again.");
    setTimeout(() => {
        input.style.borderColor = "";
        clearInputError("dropoffError");
    }, 3000);
    return;
}

  const coords = { lat: result.lat, lng: result.lng };
  if (result.label) dropoffInput.value = result.label;

  if (markerDropoff) map.removeLayer(markerDropoff);

  dropoff = coords;
  markerDropoff = L.marker(coords, { icon: dropoffIcon }).addTo(map).bindPopup("Dropoff").openPopup();

  map.setView(coords, 15);

  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

// =============================================================================
// SWAP LOCATIONS
// =============================================================================

function swapLocations() {
  // Swap coordinates
  [pickup, dropoff] = [dropoff, pickup];

  // Swap input text
  [pickupInput.value, dropoffInput.value] = [dropoffInput.value, pickupInput.value];
  pickupInput.dispatchEvent(new Event("input")); 
dropoffInput.dispatchEvent(new Event("input")); 

  // Redraw markers
  if (markerPickup)  map.removeLayer(markerPickup);
  if (markerDropoff) map.removeLayer(markerDropoff);

if (pickup)  markerPickup  = L.marker(pickup, { icon: pickupIcon }).addTo(map).bindPopup("Pickup");
if (dropoff) markerDropoff = L.marker(dropoff, { icon: dropoffIcon }).addTo(map).bindPopup("Dropoff");

  // Redraw route
  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

// =============================================================================
// GEOLOCATION — CENTER MAP + OPTIONAL PICKUP ASSIGNMENT
// =============================================================================

function getUserLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      map.setView([lat, lng], 15);

      const addressLabel = await reverseGeocode(lat, lng);

      // Set pickup directly instead of going through setPickup()
      const coords = { lat, lng };
      if (markerPickup) map.removeLayer(markerPickup);
      pickup = coords;
      pickupInput.value = addressLabel;
      pickupInput.dispatchEvent(new Event("input"));
    markerPickup = L.marker(coords, { icon: pickupIcon }).addTo(map).bindPopup("Pickup").openPopup();

      if (pickup && dropoff) tomRoute(pickup, dropoff);
    },
    (error) => { console.error("Could not get location:", error.message); }
  );
}
getUserLocation();

// =============================================================================
// AUTOCOMPLETE
// =============================================================================

async function autocomplete(e, suggestionId) {
  try {
    const value = e.target.value;
    const suggestions = document.getElementById(suggestionId);

    if (value.length < 3) {
      suggestions.innerHTML = "";
      return;
    }

    const res = await fetch(`/autocomplete?q=${encodeURIComponent(value)}`);    const data = await res.json();

    console.log("Autocomplete response:", data); // debug

    suggestions.innerHTML = "";

    data.forEach(place => {
      const li = document.createElement("li");
      li.textContent = place.properties.label;

      li.addEventListener("click", () => {
        e.target.value = place.properties.label;
        suggestions.innerHTML = "";
      });

      suggestions.appendChild(li);
    });

  } catch (error) {
    console.error("Autocomplete failed:", error);
  }
}

//tomtom draw route
async function tomRoute(pickup, dropoff) {


  document.getElementById("loadingIndicator").style.display = "flex";
  try {
    const res = await fetch("/route-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { lat: pickup.lat, lon: pickup.lng },
        end: { lat: dropoff.lat, lon: dropoff.lng }
      })
    });

    const data = await res.json();

    if (!data.points || !data.points.length) {
      throw new Error("No route points returned");
    }

    const latlngs = data.points.map(p => [p.latitude, p.longitude]);

    if (window.currentRoute) map.removeLayer(window.currentRoute);
    if (window.startMarker) map.removeLayer(window.startMarker);
    if (window.endMarker) map.removeLayer(window.endMarker);

    // Get traffic level BEFORE drawing polyline so we can color it correctly
    const traffic = getTrafficLevel(data.trafficDelaySeconds || 0);

    // Draw route with traffic color
    window.currentRoute = L.polyline(latlngs, { color: traffic.color, weight: 5 }).addTo(map);

window.startMarker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map).bindPopup("Start").openPopup();
window.endMarker = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon }).addTo(map).bindPopup("End");

      saveTripToHistory({
      pickupLabel: pickupInput.value,
      dropoffLabel: dropoffInput.value,
      savedAt: new Date().toLocaleTimeString()
    });

    renderTripHistory();

map.fitBounds(window.currentRoute.getBounds(), {
  padding: [80, 80],
  maxZoom: 14
});
    console.log(`Route added! Distance: ${data.distanceMeters}m, ETA: ${data.estimatedMinutes} min, Traffic delay: ${data.trafficDelaySeconds}s`);
    showBottomTab(data);

  } catch (err) {
     console.error("Routing error:", err);
  const tab = document.getElementById("comparisonTab");
  tab.innerHTML = `
    <div class="tab-stat">
      <span class="tab-icon">⚠️</span>
      <span class="tab-value" style="color:#ef4444; font-size:15px;">Could not find a route. Please try again.</span>
    </div>
  `;
  tab.classList.add("show");;
  }
  finally {
    // Hide spinner — runs whether it succeeded or failed
    document.getElementById("loadingIndicator").style.display = "none";
  }
}
//buttons: home, settings profile
document.getElementById("profileBtn").addEventListener("click", ()=>{
  window.location.href= "../pages/profile.html";
})
document.getElementById("settingsBtn").addEventListener("click", ()=>{
  window.location.href= "../pages/settings.html";
})

// =============================================================================
// READ TRIP HISTORY
// =============================================================================

function getTripHistory(){
  const data = localStorage.getItem(TRIP_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function renderTripHistory(){
  const trips = getTripHistory();

  if (!tripHistoryList) return;

  if (trips.length === 0){
    tripHistoryList.innerHTML = "No recent trips yet.";
    return;
  }

  tripHistoryList.innerHTML = trips
   .map(trip => `${trip.pickupLabel} -> ${trip.dropoffLabel}`)
   .join("<br>"); 
}

renderTripHistory();

function saveTripToHistory(trip){
  const trips = getTripHistory();

  trips.unshift(trip);

  if(trips.length > 5){
    trips.pop();
  }

  localStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(trips));
}

// =============================================================================
// SAVED LOCATIONS
// =============================================================================

let savedLocations = [];

// Fetch all saved locations from backend and re-render both popovers
async function loadSavedLocations() {
  try {
    const res = await fetch("/api/saved-locations", {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    savedLocations = data.locations || [];
    renderSavedPopover("pickup");
    renderSavedPopover("dropoff");
  } catch (err) {
    console.error("Failed to load saved locations:", err);
  }
}

// Render the list inside a given popover ("pickup" or "dropoff")
function renderSavedPopover(which) {
  const list   = document.getElementById(`${which}SavedList`);
  const empty  = document.getElementById(`${which}PopoverEmpty`);

  list.innerHTML = "";

  if (savedLocations.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  savedLocations.forEach(loc => {
    const icon = getLocationIcon(loc.name);

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="saved-loc-icon">${icon}</span>
      <div class="saved-loc-info">
        <div class="saved-loc-name">${escapeHtml(loc.name)}</div>
        <div class="saved-loc-addr">${escapeHtml(loc.address)}</div>
      </div>
      <button class="saved-loc-delete" data-id="${loc.id}" title="Remove">✕</button>
    `;

    // Click row → fill the input and close popover
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("saved-loc-delete")) return;
      fillFromSaved(which, loc);
      closeAllPopovers();
    });

    // Delete button
    li.querySelector(".saved-loc-delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteSavedLocation(loc.id);
    });

    list.appendChild(li);
  });
}

// Fill pickup or dropoff input from a saved location object
async function fillFromSaved(which, loc) {
  const input = document.getElementById(`${which}Input`);
  input.value = loc.address;
  input.dispatchEvent(new Event("input"));

  const coords = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
  console.log("fillFromSaved", which, coords, "pickup:", pickup, "dropoff:", dropoff);

  if (which === "pickup") {
    if (markerPickup) map.removeLayer(markerPickup);
    pickup = coords;
markerPickup = L.marker([coords.lat, coords.lng], { icon: pickupIcon }).addTo(map).bindPopup("Pickup").openPopup();    map.setView([coords.lat, coords.lng], 15);
  } else {
    if (markerDropoff) map.removeLayer(markerDropoff);
    dropoff = coords;
markerDropoff = L.marker([coords.lat, coords.lng], { icon: dropoffIcon }).addTo(map).bindPopup("Dropoff").openPopup();
    map.setView([coords.lat, coords.lng], 15);
  }

  console.log("after set — pickup:", pickup, "dropoff:", dropoff);
  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

// Delete a saved location by id
async function deleteSavedLocation(id) {
  try {
    const res = await fetch(`/api/saved-locations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Delete failed");
    savedLocations = savedLocations.filter(l => l.id !== id);
    renderSavedPopover("pickup");
    renderSavedPopover("dropoff");
  } catch (err) {
    console.error("Failed to delete saved location:", err);
  }
}

// Open the "name this location" modal to save current input address
function openSaveModal(which) {
  const input   = document.getElementById(`${which}Input`);
  const address = input.value.trim();
  const coords  = which === "pickup" ? pickup : dropoff;

  if (!address || !coords) {
    alert("Please confirm a location first before saving it.");
    return;
  }

  const modal = document.getElementById("saveLocationModal");
  document.getElementById("slmAddress").textContent = address;
  document.getElementById("slmNameInput").value = "";
  document.getElementById("slmError").textContent = "";
  modal.classList.add("open");
  document.getElementById("slmNameInput").focus();

  // Wire up Save button (replace to remove stale listeners)
  const saveBtn = document.getElementById("slmSave");
  const newSave = saveBtn.cloneNode(true);
  saveBtn.replaceWith(newSave);

  newSave.addEventListener("click", async () => {
    const name = document.getElementById("slmNameInput").value.trim();
    const errEl = document.getElementById("slmError");
    if (!name) { errEl.textContent = "Please enter a name."; return; }

    try {
      const res = await fetch("/api/saved-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name, address, lat: coords.lat, lng: coords.lng })
      });

      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || "Failed to save."; return; }

      savedLocations.unshift(data.location);
      renderSavedPopover("pickup");
      renderSavedPopover("dropoff");
      closeSaveModal();
    } catch (err) {
      document.getElementById("slmError").textContent = "Something went wrong.";
    }
  });
}

function closeSaveModal() {
  document.getElementById("saveLocationModal").classList.remove("open");
}

function closeAllPopovers() {
  document.getElementById("pickupPopover").classList.remove("open");
  document.getElementById("dropoffPopover").classList.remove("open");
}

// Toggle a popover open/closed
function togglePopover(which) {
  const popover = document.getElementById(`${which}Popover`);
  const other   = which === "pickup" ? "dropoffPopover" : "pickupPopover";
  document.getElementById(other).classList.remove("open");
  popover.classList.toggle("open");
}

// Pick an icon emoji based on the location name
function getLocationIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("home"))   return "🏠";
  if (n.includes("work") || n.includes("office")) return "🏢";
  if (n.includes("gym"))    return "💪";
  if (n.includes("school") || n.includes("uni") || n.includes("college")) return "🎓";
  if (n.includes("airport")) return "✈️";
  if (n.includes("hotel"))  return "🏨";
  return "📍";
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// =============================================================================
// SAVED LOCATIONS EVENT LISTENERS
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Star buttons → toggle popover
  document.getElementById("pickupStarBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopover("pickup");
  });
  document.getElementById("dropoffStarBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopover("dropoff");
  });

  // "Save current" buttons inside popovers → open naming modal
  document.getElementById("pickupSaveCurrentBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllPopovers();
    openSaveModal("pickup");
  });
  document.getElementById("dropoffSaveCurrentBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllPopovers();
    openSaveModal("dropoff");
  });

  // Cancel button in modal
  document.getElementById("slmCancel").addEventListener("click", closeSaveModal);

  // Close modal on backdrop click
  document.getElementById("saveLocationModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("saveLocationModal")) closeSaveModal();
  });

  // Close popovers when clicking anywhere outside
  document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-container")) {
    closeAllPopovers();
    document.getElementById("pickupSuggestions").innerHTML = "";
    document.getElementById("dropoffSuggestions").innerHTML = "";
  }
});

  // Enter key in modal name input → trigger save
  document.getElementById("slmNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("slmSave").click();
  });

  // Load saved locations on page load
  loadSavedLocations();
});

async function showBottomTab(data) {
  const traffic = getTrafficLevel(data.trafficDelaySeconds || 0);
  const tab = document.getElementById("comparisonTab");

  const km = (data.distanceMeters / 1000).toFixed(1);
  const miles = (data.distanceMeters / 1609.34).toFixed(1);
  tab.innerHTML = `
    <div class="tab-stat">
   <span class="tab-icon">📍</span>
      <span class="tab-value" id="distanceValue">${distanceUnit === "km" ? km : miles}</span>
      <span class="tab-unit" id="distanceUnit">${distanceUnit}</span>
    </div>
    <div class="tab-divider"></div>
    <div class="tab-stat">
      <span class="tab-icon">⏱</span>
      <span class="tab-value">${data.estimatedMinutes}</span>
      <span class="tab-unit">min</span>
    </div>
    <div class="tab-divider"></div>
    <div class="tab-stat">
      <span class="tab-dot" style="background:${traffic.color}"></span>
      <span class="tab-value" style="color:${traffic.color}">${traffic.label}</span>
       </div>
       <div class="tab-divider"></div>
  <button id="unitToggleBtn" class="unit-toggle-btn">Switch to ${distanceUnit === "km" ? "mi" : "km"}</button>   
  `;

   document.getElementById("unitToggleBtn").addEventListener("click", () => {
    distanceUnit = distanceUnit === "km" ? "mi" : "km";
    document.getElementById("distanceValue").textContent = distanceUnit === "km" ? km : miles;
    document.getElementById("distanceUnit").textContent = distanceUnit;
  document.getElementById("unitToggleBtn").textContent = `Switch to ${distanceUnit === "km" ? "mi" : "km"}`;  
});

  tab.classList.add("show");
  document.body.classList.add("tab-open");
}
async function hideBottomTab(){
  const tab = document.getElementById("comparisonTab");
  tab.classList.remove("show");
  document.body.classList.remove("tab-open");

}

// =============================================================================
// UTILITIES
// =============================================================================

// Debounce — limits how often a function fires (used for autocomplete input)
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// =============================================================================
// Error messages
// =============================================================================

function showInputError(id, message) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("div");
        el.id = id;
        el.style.cssText = "color:#ef4444; font-size:12px; margin-top:2px;";
    }
    el.textContent = message;
    const container = id === "pickupError"
        ? document.querySelector("#pickupInput").closest(".autocomplete-container")
        : document.querySelector("#dropoffInput").closest(".autocomplete-container");
    container.appendChild(el);
}

function clearInputError(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

document.getElementById("pickupInput").addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    setPickup();
  }
});

document.getElementById("dropoffInput").addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    setDropoff();
  }
});

const confirmPickupBtn = document.querySelector(".autocomplete-container:first-of-type button:not(.star-btn)");
const confirmDropoffBtn = document.querySelector(".autocomplete-container:last-of-type button:not(.star-btn)");

pickupInput.addEventListener("input", () => {
  confirmPickupBtn.disabled = pickupInput.value.trim() === "";
});

dropoffInput.addEventListener("input", () => {
  confirmDropoffBtn.disabled = dropoffInput.value.trim() === "";
});

// Set initial state on page load
confirmPickupBtn.disabled = true;
confirmDropoffBtn.disabled = true;




