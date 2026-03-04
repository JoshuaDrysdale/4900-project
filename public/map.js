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

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
    noWrap: true 
}).addTo(map);


//GLOBAL VARIABLES
const pickupInput = document.getElementById("pickupInput");
const dropoffInput = document.getElementById("dropoffInput");
let pickup = null,
    dropoff = null,
    routingControl = null,
    markerPickup = null,
    markerDropoff = null;
    





//END OF GLOBAL VARIABLES



//GLOBAL EVENT LISTINERS
const debouncedPickup = debounce((e) => autocomplete(e, "pickupSuggestions"), 200);
const debouncedDropoff = debounce((e) => autocomplete(e, "dropoffSuggestions"), 200);
pickupInput.addEventListener("input", debouncedPickup);
dropoffInput.addEventListener("input", debouncedDropoff);



//END OF GLOBAL EVENT LISTINERS


getUserLocation();


/*(Below) Allows user to click two points in the map and have a route drawn out
--Click could be useful if user wants to be picked up on a certain distant location 
other than their current location but does not necessarrly know the exact
address of said location.

If we want users to select address for pickup and dropff, it will probably 
follow similar logic below

The distance(km/miles) given by routing machine is slightly inaccurate.

Certain variables and values are set so that users are able to reselect different
points in the map for differnet routes. A reset route button will be implemented later
for a better User Interface and better User Experience. 
*/

map.on("click", async function(e) {
    const coords = e.latlng;

    try {
        const addressLabel = await reverseGeocode(coords.lat, coords.lng);

        if (!pickup) {
            if (markerPickup) map.removeLayer(markerPickup);
            pickup = coords;
            markerPickup = L.marker(coords).addTo(map).bindPopup("Pickup").openPopup();
            pickupInput.value = addressLabel;
        } else if (!dropoff) {
            if (markerDropoff) map.removeLayer(markerDropoff);
            dropoff = coords;
            markerDropoff = L.marker(coords).addTo(map).bindPopup("Dropoff").openPopup();
            dropoffInput.value = addressLabel;
        }

        if (pickup && dropoff) getRoute(pickup, dropoff);

    } catch (err) {
        console.error("Reverse geocode failed:", err);
        alert("Failed to fetch address for clicked location");
    }
});
/*Functionality for Reset button*/
document.getElementById("resetBtn").addEventListener("click",  () => {
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
    pickupInput.value='';
    dropoffInput.value='';
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

// Geocode
async function geocode(address) {
    try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error("Geocode proxy failed");

        const data = await res.json();
        if (!data.features || data.features.length === 0) return null;

        const feature = data.features[0];

        return {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            label: feature.properties.label
        };

    } catch (err) {
        console.error("Geocode failed:", err);
        return null;
    }
}
// Reverse Geocode
async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(`/api/reverse?lat=${lat}&lon=${lng}`);
        if (!res.ok) throw new Error("Reverse proxy failed");
        const data = await res.json();

        if (!data.features || data.features.length === 0)
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        const props = data.features[0].properties;
        const house = props.housenumber || "";
        const street = props.street || props.name || "";
        const city = props.city || props.state || props.country || "";

        return `${house} ${street}, ${city}`.trim();    } 
        catch (err) {
        console.error("Reverse geocode failed:", err);
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

// Set Pickup from address input
async function setPickup() {
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
