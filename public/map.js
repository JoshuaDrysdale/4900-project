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
    window.location.href = "/login.html";
  }
});
 
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
  window.location.href = "/login.html";
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

const pickupInput  = document.getElementById("pickupInput");
const dropoffInput = document.getElementById("dropoffInput");

const tripHistoryList = document.getElementById("tripHistoryList");
const TRIP_HISTORY_KEY = "rha_trip_history";

let pickup        = null;
let dropoff       = null;
let routingControl = null;
let markerPickup  = null;
let markerDropoff = null;
let routeLayer    = null;
let inputMode     = "address"; // "address" = Enter Address mode (default)

// =============================================================================
// GLOBAL EVENT LISTENERS
// =============================================================================

const debouncedPickup  = debounce((e) => autocomplete(e, "pickupSuggestions"), 200);
const debouncedDropoff = debounce((e) => autocomplete(e, "dropoffSuggestions"), 200);

pickupInput.addEventListener("input", debouncedPickup);
dropoffInput.addEventListener("input", debouncedDropoff);

document.getElementById("swapLocations").addEventListener("click", swapLocations);

document.getElementById("resetBtn").addEventListener("click", () => {
  if (routeLayer)    { map.removeLayer(routeLayer);    routeLayer    = null; }
  if (markerPickup)  { map.removeLayer(markerPickup);  markerPickup  = null; }
  if (markerDropoff) { map.removeLayer(markerDropoff); markerDropoff = null; }
  
  if (window.currentRoute) { map.removeLayer(window.currentRoute); window.currentRoute = null; }
  if (window.startMarker)  { map.removeLayer(window.startMarker);  window.startMarker  = null; }
  if (window.endMarker)    { map.removeLayer(window.endMarker);    window.endMarker    = null; }

  pickup = null;
  dropoff = null;
  pickupInput.value  = "";
  dropoffInput.value = "";
  document.getElementById("routeInfo").textContent = "";
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

      markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();

    // Set dropoff if pickup is already placed
    } else if (!dropoff) {
      if (markerDropoff) map.removeLayer(markerDropoff);

      dropoff = coords;
      dropoffInput.value = addressLabel;

      markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();
    }

    if (pickup && dropoff) {
    // getRoute(pickup, dropoff);
    // routeTime(pickup, dropoff);
     tomRoute(pickup, dropoff);
   }

  } catch (err) {
    console.error(err);
  }
});

// =============================================================================
// ROUTING
// =============================================================================

// async function getRoute(pickup, dropoff) {
//     document.getElementById("loadingIndicator").style.display = "block";

//   try {
//     const response = await fetch("/route", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         coordinates: [
//           [pickup.lng, pickup.lat],
//           [dropoff.lng, dropoff.lat]
//         ]
//       })
//     });

//     const data = await response.json();
//     console.log("Route =", data);

//     if (routeLayer) map.removeLayer(routeLayer);

//     if (!data.features || data.features.length === 0) {
//       console.error("No route found");
//       return;
//     }

//     // // extract distance and duration from ORS response
//     // const summary = data.features[0].properties.summary;
//     // const distanceKm = (summary.distance / 1000).toFixed(1);
//     // const durationMin = Math.round(summary.duration / 60);

//     // document.getElementById("routeInfo").textContent = `${distanceKm} km · ${durationMin} min`;

//     routeLayer = L.geoJSON(data, {
//       style: { color: "blue", weight: 5 }
//     }).addTo(map);

//     map.fitBounds(routeLayer.getBounds());
//         document.getElementById("loadingIndicator").style.display = "none";

//   } catch (error) {
//     console.error(error);
//         document.getElementById("loadingIndicator").style.display = "none";

//   }
// }

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
  markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
  map.setView(coords, 15);

  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

async function setDropoff() {
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
  markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();
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

  // Redraw markers
  if (markerPickup)  map.removeLayer(markerPickup);
  if (markerDropoff) map.removeLayer(markerDropoff);

  if (pickup)  markerPickup  = L.marker(pickup).addTo(map).bindPopup("Pickup");
  if (dropoff) markerDropoff = L.marker(dropoff).addTo(map).bindPopup("Dropoff");

  // Redraw route
  if (pickup && dropoff) tomRoute(pickup, dropoff);
}

// =============================================================================
// GEOLOCATION — CENTER MAP + OPTIONAL PICKUP ASSIGNMENT
// =============================================================================

function getUserLocation() {
  if (!navigator.geolocation) {
    console.log("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      map.setView([lat, lng], 15);

      const addressLabel = await reverseGeocode(lat, lng);

      //setting user location as default pickup position
      pickupInput.value = addressLabel;
      setPickup();
      
      // showGeoModal(lat, lng, addressLabel);
    },
    (error) => { console.error("Could not get location:", error.message); }
  );
}
getUserLocation();

// function showGeoModal(lat, lng, addressLabel) {
//   const modal    = document.getElementById("geoModal");
//   const addrEl   = document.getElementById("geoAddressLabel");

//   addrEl.textContent = addressLabel;
//   modal.classList.add("open");

//   // Clone buttons to remove any stale listeners from previous calls
//   ["geoRecenterOnly"].forEach(id => {
//     const el = document.getElementById(id);
//     el.replaceWith(el.cloneNode(true));
//   });

//   const coords = { lat, lng };
//   const close  = () => modal.classList.remove("open");

//   document.getElementById("geoSetPickup").addEventListener("click", () => {
//     if (markerPickup) map.removeLayer(markerPickup);
//     pickup = coords;
//     pickupInput.value = addressLabel;
//     markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
//     if (pickup && dropoff) tomRoute(pickup, dropoff);
//     close();
//   });

//   document.getElementById("geoRecenterOnly").addEventListener("click", close);

//   // Tap backdrop to dismiss
//   modal.addEventListener("click", (e) => { if (e.target === modal) close(); }, { once: true });
// }



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

//get route time  
/*
async function routeTime(pickup, dropoff){
  try{
    const start = { lat: pickup.lat, lon: pickup.lng };
    const end = { lat: dropoff.lat, lon: dropoff.lng };

    const response = await fetch("/route-time", {
      method: "POST",
      headers: {"Content-Type" : "application/json"},
      body: JSON.stringify({start, end})
    }) ;

    const data = await response.json();
    console.log("Route time =", data);

     document.getElementById("routeInfo").textContent = `${data.distanceMeters/1000} km · ${data.estimatedMinutes} min`;

  }catch(err){
    console.error(err);
  }
}
 */

//tomtom draw route
async function tomRoute(pickup, dropoff) {
  try {
    // Send POST request to backend
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

    // Map points to Leaflet [lat, lon] array
    const latlngs = data.points.map(p => [p.latitude, p.longitude]);

    // Remove previous route if it exists
    if (window.currentRoute) map.removeLayer(window.currentRoute);
    if (window.startMarker) map.removeLayer(window.startMarker);
    if (window.endMarker) map.removeLayer(window.endMarker);

    // Add polyline for route
    window.currentRoute = L.polyline(latlngs, { color: "red", weight: 5 }).addTo(map);

    // Add markers for start and end
    window.startMarker = L.marker([pickup.lat, pickup.lng]).addTo(map).bindPopup("Start").openPopup();
    window.endMarker = L.marker([dropoff.lat, dropoff.lng]).addTo(map).bindPopup("End");

    showBottomTab(data);

  // if we want to show miles, below is the routeInfo display 
  //document.getElementById("routeInfo").textContent = `${(data.distanceMeters/1609.34).toFixed(1)} mi · ${data.estimatedMinutes} min`;

  saveTripToHistory({
    pickupLabel: pickupInput.value,
    dropoffLabel: dropoffInput.value,
    savedAt: new Date().toLocaleTimeString()
  });

  renderTripHistory(); 

    // Fit map to route bounds
    map.fitBounds(window.currentRoute.getBounds());
    
  } catch (err) {
    console.error("Routing error:", err);
  }
}
//buttons: home, settings profile
document.getElementById("profileBtn").addEventListener("click", ()=>{
  window.location.href= "menu/profile.html";
})
document.getElementById("settingsBtn").addEventListener("click", ()=>{
  window.location.href= "menu/settings.html";
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

function getToken() {
  return localStorage.getItem("token");
}

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
  const input  = document.getElementById(`${which}Input`);
  input.value  = loc.address;

  const coords = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };

  if (which === "pickup") {
    if (markerPickup) map.removeLayer(markerPickup);
    pickup = coords;
    markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
    map.setView(coords, 15);
  } else {
    if (markerDropoff) map.removeLayer(markerDropoff);
    dropoff = coords;
    markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();
    map.setView(coords, 15);
  }

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
    if (!e.target.closest(".autocomplete-container")) closeAllPopovers();
  });

  // Enter key in modal name input → trigger save
  document.getElementById("slmNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("slmSave").click();
  });

  // Load saved locations on page load
  loadSavedLocations();
});

//Comparison tab functionality
async function showBottomTab(data){
  const tab = document.getElementById("comparisonTab");
  tab.classList.add("show");

  tab.textContent = "Ride Information = "+`${(data.distanceMeters/1000).toFixed(1)} km · ${data.estimatedMinutes} min`;
}

async function hideBottomTab(){
  const tab = document.getElementById("comparisonTab");
  tab.classList.remove("show");

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