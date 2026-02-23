console.log("map.js loaded");

const map = L.map("map").setView([40.631092, -73.95244], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);


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
let pickup = null,
    dropoff = null,
    routingControl = null,
    markerPickup = null,
    markerDropoff = null;

map.on("click", function(e){

    if(!pickup){

        if(markerPickup){
            map.removeLayer(markerPickup);
        }

        pickup = e.latlng;
        markerPickup = L.marker(pickup).addTo(map).bindPopup("Pickup").openPopup();
    }

    else if(!dropoff){

        if(markerDropoff){
            map.removeLayer(markerDropoff);
        }

        dropoff = e.latlng;
        markerDropoff = L.marker(dropoff).addTo(map).bindPopup("Dropoff").openPopup();

        drawRoute();

        
    }
});
function drawRoute(){ 

    if (routingControl){
        map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(pickup.lat, pickup.lng),
            L.latLng(dropoff.lat, dropoff.lng)
        ],
        routeWhileDragging:false
    }).addTo(map);

   pickup = null, dropoff = null;
}
//circle and marker are temporary, just testing of leaflet methods
L.circle([40.631092, -73.95244], {radius: 350})
  .addTo(map);
L.marker([40.631092, -73.95244])
  .addTo(map)
//neccesary? if we have leaflet routing machine?
function calculateDistance(pointA, pointB){
    const distance = map.distance(pointA, pointB);

    return distance;
}