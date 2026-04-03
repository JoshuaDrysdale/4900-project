# 🚗 RHA — Ride-Hailing Aggregator


RHA is a web application that allows users to plan rides by setting pickup and dropoff locations, view driving routes, and will eventually compare prices across multiple ride-hailing services (Uber, Lyft, etc.) in one place. Deployment of certain technologies will be considered.

Built with **Leaflet.js** on the frontend and a  **Node.js/Express** backend that proxies requests to [OpenRouteService](https://openrouteservice.org/), [Photon by Komoot](https://photon.komoot.io/) and [TomTom](https://www.tomtom.com/).

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
-  **TomTom routing** for real-time distance and duration calculations
-  **Responsive design** — works on both desktop and mobile


### Authentication
- 🔒 **Signup** with username, email, password and date of birth
-  **Email verification** after signup
  * Verification email sent automatically
  * Users can resend verification email
  * Users can access the app before verifying email
- 🔒 **Login** with username or email
-  **Forgot password flow** with secure email reset link 
-  **Password strength checker** with live feedback
-  **Live validation hints** on all signup fields
-  **Show/Hide password** toggle on login and signup
-  **Caps lock warning** on login password field
-  **Forgot password** page (email flow coming soon)
-  **PostgreSQL database** for storing user credentials (bcrypt hashed passwords)
-  **Server-side password validation** matching frontend rules
-  **Supabase** cloud database for deployment
-  **JWT authentication** with 7-day token expiry for protected routes

### Modals/Panels (Soon)

- **Account Modal** — View user profile information with  buttons for:
  * Edit Profile (coming soon)
  * Connect Ride Share Apps (coming soon)
  * Booking History (coming soon)
  * Account Settings (coming soon)

- **Booking Modal** — Plan and book rides with:
  * Route details display (pickup, dropoff, distance, duration)
  * Ride type selection (Uber/Lyft integration)
  * Price breakdown (base fare, distance, time, service fee, tax)
  * Confirm booking button (backend endpoint coming soon)


---

## 🛠️ Technologies

| Layer      | Technology |
|------------|------------|
| Frontend   | HTML, CSS, JavaScript |
| Map        | [Leaflet.js](https://leafletjs.com/) v1.9.4 |
| Backend    | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| Routing    | [OpenRouteService API](https://openrouteservice.org/) |
| Geocoding  | [Photon by Komoot](https://photon.komoot.io/) |
| Database   | [Supabase (PostgreSQL)](https://supabase.com/) |
| Email      | [Nodemailer](https://nodemailer.com/) + Gmail SMTP |


---

##  Installation

### Prerequisites

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) installed and running
- A free [OpenRouteService API key](https://openrouteservice.org/dev/#/signup)
- [Tomtom API key](https://developer.tomtom.com/)
- **Gmail account** with app-specific password for email functionality

### Steps

```bash
# 1. Clone the repository (with submodules)
git clone 
cd 
# 2. Install dependencies
npm install

# 3. Set up your environment variables
Create a .env file in the root directory:

ORS_API_KEY=your_api_key_here
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-specific-password
JWT_SECRET=your-secret-key-here

Follow your database instructions on how to set up the database creditials in your env

# 4. Set up the database

# 5. Start the server
node server.js
# or with nodemon:
nodemon server.jsim

# Server runs at http://localhost:3000
Open your browser and navigate to the URL above to begin using the application.
Please allow location permissions for full functionality.

```

---
## 📖 Usage
 
### 🗺️ Map
1. **Address Mode** (default):
   - Type a pickup address → click "Confirm Pickup"
   - Type a dropoff address → click "Confirm Dropoff"
   - Route appears automatically
 
2. **Map Mode**:
   - Click "🗺 Select on Map" button
   - Click any two points on the map
   - First click sets pickup, second sets dropoff
   - Route draws immediately
 
3. **Other Features**:
   - Click **⇅ Swap** to reverse pickup and dropoff
   - Click **Clear Trip** to remove all markers and route
   - Click **📍 My Location** to fly to your current locatio

### 🔒 Authentication
 
1. **Sign Up** at `/signup`:
   - Enter username (4-14 characters, alphanumeric + underscore)
   - Enter email
   - Enter password (8+ chars, uppercase, number, special character)
   - Enter date of birth
   - Verification email sent automatically
   - Click link in email to verify (valid 24 hours)
 
2. **Log In** at `/login`:
   - Enter username or email
   - Enter password
   - Caps lock warning if enabled
   - JWT token stored in localStorage
 
3. **Forgot Password** at `/forgot-password.html`:
   - Enter your email
   - Check your inbox for reset link (valid 30 minutes)
   - Click link to go to reset page
   - Enter new password (same validation as signup)
   - Confirm password and reset
   - Log in with new password

## Some of future implementations

-  Ride price comparison across Uber, Lyft and other providers
-  Fare estimation based on route distance
-  Server-side rate limiting for login attempts
-  Multiple transportation modes
-  Saved locations
-  Traffic-aware routing
-  Full account & booking management system


## 🧪 Testing
 
### Email Features
**Note:** Email features require valid `GMAIL_USER` and `GMAIL_PASS` in `.env`. Without these, the app works except email-dependent features will fail.
 
To test email flows:
1. Set up Gmail credentials in `.env`
2. Sign up with a real email address
3. Check your inbox for verification email
4. Use "Forgot Password" to test reset flow
