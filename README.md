# 🚗 RHA — Ride-Hailing Aggregator


RHA is a web application that allows users to plan rides by setting pickup and dropoff locations, view driving routes, and will eventually compare prices across multiple ride-hailing services (Uber, Lyft, etc.) in one place. Deployment of certain technologies will be considered.

Built with **Leaflet.js** on the frontend and a  **Node.js/Express** backend that proxies requests to [OpenRouteService](https://openrouteservice.org/) and [Photon by Komoot](https://photon.komoot.io/).

---

##  Current Features

### Map

- 🗺 **Interactive map** powered by Leaflet.js with multiple tile layer options (Street, Satellite, Topo, etc.)
-  **Two input modes** — type an address or click directly on the map to place markers
-  **Swap pickup/dropoff** with a single button click
-  **Driving route rendering** via OpenRouteService Directions API
-  **Geolocation support** — detects your current location and optionally sets it as your pickup
-  **Route distance and duration** displayed after route is drawn
-  **Address autocomplete** via ORS Geocode API
-  **Geocoding & Reverse Geocoding** via Photon (address ↔ coordinates)
-  **Responsive design** — works on both desktop and mobile

### Authentication
- 🔒 **Signup** with username, email, password and date of birth
- 🔒 **Login** with username or email
-  **Password strength checker** with live feedback
-  **Live validation hints** on all signup fields
-  **Show/Hide password** toggle on login and signup
-  **Caps lock warning** on login password field
-  **Forgot password** page (email flow coming soon)
-  **PostgreSQL database** for storing user credentials (bcrypt hashed passwords)
-  **Server-side password validation** matching frontend rules

---

## 🛠️ Technologies

| Layer      | Technology |
|------------|------------|
| Frontend   | HTML, CSS, JavaScript |
| Map        | [Leaflet.js](https://leafletjs.com/) v1.9.4 |
| Backend    | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| Routing    | [OpenRouteService API](https://openrouteservice.org/) |
| Geocoding  | [Photon by Komoot](https://photon.komoot.io/) |
| Database   | [PostgreSQL](https://www.postgresql.org/) |
| Email (planned)| [Nodemailer](https://nodemailer.com/) + Gmail |

---

##  Installation

### Prerequisites

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) installed and running
- A free [OpenRouteService API key](https://openrouteservice.org/dev/#/signup)

### Steps

```bash
# 1. Clone the repository (with submodules)

# 2. Install dependencies

# 3. Set up your environment variables
Create a .env file in the root directory:

ORS_API_KEY=your_api_key_here

# 4. Set up the database

# 5. Start the server
node server.js

# Server runs at http://localhost:3000
Open your browser and navigate to the URL above to begin using the application.
Please allow location permissions for full functionality.

```

---
## 📖 Usage

### Map

1. **Address mode (default):** Type a pickup address → click **Set Pickup**. Type a dropoff address → click **Set Dropoff**. A route appears automatically.
2. **Map mode:** Click **Select on Map**, then click any two points on the map. The first click sets pickup, the second sets dropoff, and the route draws immediately.
3. **Swap:** Click ⇅ to reverse pickup and dropoff.
4. **Reset:** Click the red **Reset** button to clear all markers and the route.
5. **My Location:** Click 📍 to fly to your current location. A modal asks if you'd like to set it as your pickup.

### Authentication
1. **Sign up** at `/signup` with a username, email, password and date of birth.
2. **Log in** at `/login` with your username or email and password
3. **Forgot password** — Soon


## Some of future implementations

-  JWT authentication to protect routes
-  Forgot password email flow via Nodemailer
-  Ride price comparison across Uber, Lyft and other providers
-  Fare estimation based on route distance
-  Supabase cloud database for deployment
-  Server-side rate limiting for login attempts
-  Multiple transportation modes
-  Saved locations
-  Traffic-aware routing

## 📝 Notes
- The forgot password button exists but the email sending functionality and the page itself is not yet active.
