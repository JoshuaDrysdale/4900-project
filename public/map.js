console.log("map.js loaded");

const map = L.map("map", {
  worldCopyJump: false,
  minZoom: 3,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ],
  maxBoundsViscosity: 0.5
}).setView([40.631092, -73.95244], 16);

// --- 1. Map Tile Layers ---
const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  noWrap: true
});

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles © Esri",
  noWrap: true

});
//Layers following that are commmenteds are either too light or dark, experimenting
/*

const lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "&copy; OpenStreetMap &copy; Carto",
    subdomains: "abcd",
  }
); 

const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap &copy; Carto",
  subdomains: 'abcd',
  maxZoom: 19
});

*/
const esriStreet = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles © Esri"
  }
);
const esriTopo = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles © Esri"
  }
);

const osmHum = L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap contributors"
  }
);
// Add default layer to map
streetLayer.addTo(map);

// --- 2. Layer Control ---
L.control.layers({
  "Street": streetLayer,
  "Satellite": satelliteLayer,
  "Test1": esriStreet,
  "Test2": esriTopo,
  "Test3":osmHum
  //"Light": lightLayer
  //"Dark": darkLayer"
}).addTo(map);

//GLOBAL VARIABLES
const pickupInput = document.getElementById("pickupInput");
const dropoffInput = document.getElementById("dropoffInput");
let pickup = null,
    dropoff = null,
    routingControl = null,
    markerPickup = null,
    markerDropoff = null;
    inputMode = "address";
//^inputMode="address" sets the intial locaiton mode selection to "Enter address"
//END OF GLOBAL VARIABLES

//GLOBAL EVENT LISTINERS
const debouncedPickup = debounce((e) => autocomplete(e, "pickupSuggestions"), 200);
const debouncedDropoff = debounce((e) => autocomplete(e, "dropoffSuggestions"), 200);
pickupInput.addEventListener("input", debouncedPickup);
dropoffInput.addEventListener("input", debouncedDropoff);
//END OF GLOBAL EVENT LISTINERS


getUserLocation();

// Handle map click events for selecting pickup and dropoff locations
map.on("click", async function(e) {

    // Only allow map clicks if the user selected "map input mode"
    if (inputMode !== "map") return;

    // Get the latitude and longitude of the click
    const coords = e.latlng;

    try {

        // Convert coordinates to a human-readable address
        const addressLabel = await reverseGeocode(coords.lat, coords.lng);

        // --- Set Pickup Location ---
        if (!pickup) {

            // Remove existing pickup marker if it exists
            if (markerPickup) map.removeLayer(markerPickup);

            // Save pickup coordinates and update input field
            pickup = coords;
            pickupInput.value = addressLabel;

            // Create and display pickup marker
            markerPickup = L.marker(coords)
                .addTo(map)
                .bindPopup("Pickup")
                .openPopup();

        // --- Set Dropoff Location ---
        } else if (!dropoff) {

            // Remove existing dropoff marker if it exists
            if (markerDropoff) map.removeLayer(markerDropoff);

            // Save dropoff coordinates and update input field
            dropoff = coords;
            dropoffInput.value = addressLabel;

            // Create and display dropoff marker
            markerDropoff = L.marker(coords)
                .addTo(map)
                .bindPopup("Dropoff")
                .openPopup();

        }
        // If both locations are selected, request a route
        if (pickup && dropoff) {
            getRoute(pickup, dropoff);
        }

    } catch (err) {
        // Log errors from reverse geocoding or routing
        console.error(err);
    }

});
/*Functionality for Reset button*/
document.getElementById("resetBtn").addEventListener("click", () => {

    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    if (markerPickup) {
        map.removeLayer(markerPickup);
        markerPickup = null;
    }

    if (markerDropoff) {
        map.removeLayer(markerDropoff);
        markerDropoff = null;
    }

    pickup = null;
    dropoff = null;

    pickupInput.value = "";
    dropoffInput.value = "";
/*Functionality for Address Mode button*/
});
document.getElementById("addressModeBtn").addEventListener("click", () => {

    inputMode = "address";

    pickupInput.disabled = false;
    dropoffInput.disabled = false;

    map.getContainer().style.cursor = "";
});
/*Functionality for Select on Map Mode button*/
document.getElementById("mapModeBtn").addEventListener("click", () => {

    inputMode = "map";

    pickupInput.disabled = true;
    dropoffInput.disabled = true;

    map.getContainer().style.cursor = "crosshair";
});


let routeLayer;
async function getRoute(pickup, dropoff){
    try{
        const response = await fetch("/route",{method: "POST",headers: {"Content-Type": "application/json"},
            body: JSON.stringify({coordinates: [[pickup.lng, pickup.lat],[dropoff.lng, dropoff.lat]]}) } );
        
        const data = await response.json();
        console.log("Route = ", data);

        if(routeLayer){
            map.removeLayer(routeLayer);
        }

        if (!data.features || data.features.length === 0) {
            console.error("No route found");
            return;
        }
        routeLayer = L.geoJSON(data, {
                        style: {
                        color: "blue",
                        weight: 5
                            }
                    }).addTo(map);
        map.fitBounds(routeLayer.getBounds());


    }catch (error){
        console.error(error);
    }
}

// Convert an address string to geographic coordinates (lat/lng)
async function geocode(address) {
    try {
        // Call backend geocode API
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error("Geocode proxy failed");

        const data = await res.json();

        // Return null if no features found
        if (!data.features || data.features.length === 0) return null;

        const feature = data.features[0];

        // Return coordinates and label
        return {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            label: feature.properties.label
        };

    } catch (err) {
        // Log errors and return null
        console.error("Geocode failed:", err);
        return null;
    }
}

// Convert geographic coordinates to a human-readable address
async function reverseGeocode(lat, lng) {
    try {
        // Call backend reverse geocode API
        const res = await fetch(`/api/reverse?lat=${lat}&lon=${lng}`);
        if (!res.ok) throw new Error("Reverse proxy failed");

        const data = await res.json();

        // Return coordinates if no address found
        if (!data.features || data.features.length === 0)
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        const props = data.features[0].properties;
        const house = props.housenumber || "";
        const street = props.street || props.name || "";
        const city = props.city || props.state || props.country || "";

        // Format address string
        return `${house} ${street}, ${city}`.trim();    

    } catch (err) {
        // Log errors and fallback to coordinates
        console.error("Reverse geocode failed:", err);
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

// Set Pickup from address input
async function setPickup() {
    if (inputMode !== "address") return;
    const address = pickupInput.value;
    if (!address) return;

    const result = await geocode(address);

    if (!result) {
        alert("Address not found");
        return;
    }

    const coords = { lat: result.lat, lng: result.lng };

    if (result.label) pickupInput.value = result.label;

    if (markerPickup) map.removeLayer(markerPickup);

    pickup = coords;
    markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();

    map.setView(coords, 15);

    if (pickup && dropoff) getRoute(pickup, dropoff);
}
// Set Dropoff from address input
async function setDropoff() {
    if (inputMode !== "address") return;
    const address = dropoffInput.value;
    if (!address) return;

    const result = await geocode(address);

    if (!result) {
        alert("Address not found");
        return;
    }

    const coords = { lat: result.lat, lng: result.lng };

    if (result.label) dropoffInput.value = result.label;

    if (markerDropoff) map.removeLayer(markerDropoff);

    dropoff = coords;
    markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();

    map.setView(coords, 15);

    if (pickup && dropoff) getRoute(pickup, dropoff);
}
//get user location from browser

function getUserLocation(){
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 15);

                L.marker([lat, lng]).addTo(map)
                    .bindPopup("You are here")
                    .openPopup();

                console.log("Your latitude: ", lat);
                console.log("Your longitude: ", lng);
            }, (error) =>{ console.error("Could not get location", error.message);}
        );
    } else {
        console.log("Geolocation not supported");
    }
};

//autocomplete
async function autocomplete(e, suggestionId) {
    
    try{
        const value = e.target.value;
        const suggestions = document.getElementById(suggestionId);

        if (value.length < 3) {
            suggestions.innerHTML = "";
            return;
        }

        const res = await fetch(`/autocomplete?q=${value}`);
        const data = await res.json();

        suggestions.innerHTML = "";

        console.log("Response from backend:", data);//FOR DEBUGGING

        data.forEach(place => {
            const li = document.createElement("li");
            li.textContent = place.properties.label;

            li.addEventListener("click", () => {
                e.target.value = place.properties.label;
                suggestions.innerHTML = "";
            });

            suggestions.appendChild(li);
        });

    }catch(error){
        console.error("Autocomplete failed:", error);
    }
}

//throttle autocomplete
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    }
}

document.getElementById("swapLocations").addEventListener("click", swapLocations);

function swapLocations() {

    // swap coordinates
    let temp = pickup;
    pickup = dropoff;
    dropoff = temp;

    // swap input text
    let tempText = pickupInput.value;
    pickupInput.value = dropoffInput.value;
    dropoffInput.value = tempText;

    // swap markers
    if (markerPickup) map.removeLayer(markerPickup);
    if (markerDropoff) map.removeLayer(markerDropoff);

    if (pickup) {
        markerPickup = L.marker(pickup)
            .addTo(map)
            .bindPopup("Pickup");
    }

    if (dropoff) {
        markerDropoff = L.marker(dropoff)
            .addTo(map)
            .bindPopup("Dropoff");
    }

    // redraw route
    if (pickup && dropoff) {
        getRoute(pickup, dropoff);
    }
}

//Location Selection Mode Event listener
document.addEventListener("DOMContentLoaded", () => {

    const addressBtn = document.getElementById("addressModeBtn");
    const mapBtn = document.getElementById("mapModeBtn");

    addressBtn.addEventListener("click", () => {
        addressBtn.classList.add("active");
        mapBtn.classList.remove("active");
    });

    mapBtn.addEventListener("click", () => {
        mapBtn.classList.add("active");
        addressBtn.classList.remove("active");
    });

    

});