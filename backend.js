console.log("map.js loaded");

const map = L.map("map").setView([40.631092, -73.95244], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

L.marker([40.631092, -73.95244])
  .addTo(map)

function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

map.on('click', onMapClick);

L.circle([40.631092, -73.95244], {radius: 350})
  .addTo(map);

function calculateDistance(pointA, pointB){
    const distance = Map.distance(pointA, pointB);

    return distance;
}

L.Routing.control({
  waypoints: [
    L.latLng(40.7128, -74.0060),
    L.latLng(40.73061, -73.935242)
  ],
  routeWhileDragging: true
}).addTo(map);