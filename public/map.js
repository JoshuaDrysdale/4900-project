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
    }else{

        if(markerDropoff){
            map.removeLayer(markerDropoff);
        }

        dropoff = e.latlng;
        markerDropoff = L.marker(dropoff).addTo(map).bindPopup("Dropoff").openPopup();

        //drawRoute();
    }
    
    if(pickup != null && dropoff !=null){
        console.log("getting route...");
        getRoute(pickup, dropoff);
    }

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