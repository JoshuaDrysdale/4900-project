console.log("map.js loaded");
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

  pickup = null;
  dropoff = null;
  pickupInput.value  = "";
  dropoffInput.value = "";
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

    if (pickup && dropoff) getRoute(pickup, dropoff);

  } catch (err) {
    console.error(err);
  }
});

// =============================================================================
// ROUTING
// =============================================================================

async function getRoute(pickup, dropoff) {
  try {
    const response = await fetch("/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [pickup.lng, pickup.lat],
          [dropoff.lng, dropoff.lat]
        ]
      })
    });

    const data = await response.json();
    console.log("Route =", data);

    if (routeLayer) map.removeLayer(routeLayer);

    if (!data.features || data.features.length === 0) {
      console.error("No route found");
      return;
    }

    routeLayer = L.geoJSON(data, {
      style: { color: "blue", weight: 5 }
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds());

  } catch (error) {
    console.error(error);
  }
}

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
  if (!result) { alert("Address not found"); return; }

  const coords = { lat: result.lat, lng: result.lng };
  if (result.label) pickupInput.value = result.label;

  if (markerPickup) map.removeLayer(markerPickup);

  pickup = coords;
  markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
  map.setView(coords, 15);

  if (pickup && dropoff) getRoute(pickup, dropoff);
}

async function setDropoff() {
  if (inputMode !== "address") return;

  const address = dropoffInput.value;
  if (!address) return;

  const result = await geocode(address);
  if (!result) { alert("Address not found"); return; }

  const coords = { lat: result.lat, lng: result.lng };
  if (result.label) dropoffInput.value = result.label;

  if (markerDropoff) map.removeLayer(markerDropoff);

  dropoff = coords;
  markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();
  map.setView(coords, 15);

  if (pickup && dropoff) getRoute(pickup, dropoff);
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
  if (pickup && dropoff) getRoute(pickup, dropoff);
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
      showGeoModal(lat, lng, addressLabel);
    },
    (error) => { console.error("Could not get location:", error.message); }
  );
}
getUserLocation();

function showGeoModal(lat, lng, addressLabel) {
  const modal    = document.getElementById("geoModal");
  const addrEl   = document.getElementById("geoAddressLabel");

  addrEl.textContent = addressLabel;
  modal.classList.add("open");

  // Clone buttons to remove any stale listeners from previous calls
  ["geoSetPickup", "geoRecenterOnly"].forEach(id => {
    const el = document.getElementById(id);
    el.replaceWith(el.cloneNode(true));
  });

  const coords = { lat, lng };
  const close  = () => modal.classList.remove("open");

  document.getElementById("geoSetPickup").addEventListener("click", () => {
    if (markerPickup) map.removeLayer(markerPickup);
    pickup = coords;
    pickupInput.value = addressLabel;
    markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
    if (pickup && dropoff) getRoute(pickup, dropoff);
    close();
  });

  document.getElementById("geoRecenterOnly").addEventListener("click", close);

  // Tap backdrop to dismiss
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); }, { once: true });
}



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

    const res  = await fetch(`/autocomplete?q=${value}`);
    const data = await res.json();

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