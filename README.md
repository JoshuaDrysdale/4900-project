#  Ride-Hailing Aggregator

As of right now, this is a web application ride route planner that lets users set pickup and dropoff locations — either by typing an address or clicking directly on the map — and displays a driving route between them.

Future implementaitons will include combining many ride share apps and displaying prices so that users can pick thier preferred option

Built with **Leaflet.js** on the frontend and a lightweight **Node.js/Express** backend that proxies requests to [OpenRouteService](https://openrouteservice.org/) and [Photon by Komoot](https://photon.komoot.io/).

---

##  Features as of so far

-  **Interactive map** powered by Leaflet.js with multiple tile layer options (Street, Satellite, Topo, etc.)
-  **Two input modes** — type an address or click directly on the map to place markers
-  **Swap pickup/dropoff** with a single button click
-  **Driving route rendering** via OpenRouteService Directions API 
-  **Address autocomplete** via ORS Geocode API
-  **Geocoding & Reverse Geocoding** via Photon (address ↔ coordinates)
-  **Geolocation support** — detects your current location and optionally sets it as your pickup
-  **Responsive design** — works on both desktop and mobile
-  **Signup and Login** - Stores information in a PostgreSQL database

---

## 🛠️ Technologies

| Layer      | Technology |
|------------|------------|
| Frontend   | HTML, CSS, JavaScript |
| Map        | [Leaflet.js](https://leafletjs.com/) v1.9.4 |
| Backend    | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| Routing    | [OpenRouteService API](https://openrouteservice.org/) |
| Geocoding  | [Photon by Komoot](https://photon.komoot.io/) |
| Database   | PostgreSQL |

---

##  Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 
- A free [OpenRouteService API key]

Sign up for an API key here:
https://openrouteservice.org/dev/#/signup

### Steps

```bash
# 1. Clone the repository (with submodules)

# 2. Install dependencies

# 3. Set up your environment variables
Create a .env file in the root directory:

ORS_API_KEY=your_api_key_here

# 4. Start the server
node server.js

# Server runs at http://localhost:3000
```
Open your browser and navigate to the URL above to begin using the application.
Please allow location permissions for full functionality.

Start experiemnting with it!

---

## 📖 Usage

1. **Address mode (default):** Type a pickup address → click **Set Pickup**. Type a dropoff address → click **Set Dropoff**. A route appears automatically.
2. **Map mode:** Click **Select on Map**, then click any two points on the map. The first click sets pickup, the second sets dropoff, and the route draws immediately.
3. **Swap:** Click ⇅ to reverse pickup and dropoff.
4. **Reset:** Click the red **Reset** button to clear all markers and the route.
5. **My Location:** Click 📍 to fly to your current location. A modal asks if you'd like to set it as your pickup.

## Some of future implementations

Ride price estimation

Multiple transportation modes

Real ride-hailing service comparison

Saved locations

Route duration and distance display

Traffic-aware routing
