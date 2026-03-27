require("dotenv").config();
const express = require("express");
const path = require("path");
const pool = require("./db");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json({ limit: "10kb" }));

//Making sure login page opens first
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "login.html"));
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

//Accessing files from the public folder
// app.get("public/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
// app.get("public/signup.html", (req, res) => res.sendFile(path.join(__dirname, "signup.html")));


// =============================================================================
// Calling the OpenRouteService API
// =============================================================================
app.post("/route", async (req, res) => {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        return res.status(400).json({ error: "Invalid coordinates." });
    }
    try{
        const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
            method: "POST",
            headers: {
            "Authorization": process.env.ORS_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
    });

    //Checking if OpeRouteServive returned an error
    if(!response.ok){
        return res.status(response.status).json({error:`ORS request failed with status ${response.status}`})
    }

    //parsing response fron json
    const data = await response.json();

    //sending data back to frontend
    res.json(data);

    }catch(error){
        console.log("Frontend sent:", req.body);//THIS LINE IS JUST FOR DEBUGGING 
        console.error("Error fectching OpenRouteService: "+error);
        res.status(500).json({ error: "Server error fetching route" });
    }
});

// =============================================================================
// Calling ORS for autocomplete
// =============================================================================
app.get("/autocomplete", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing query" });

    try {
        const response = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `ORS request failed with status ${response.status}` });
        }

        const data = await response.json();
        res.json(data.features);

    } catch (err) {
        console.error("Autocomplete failed:", err);
        res.status(500).json({ error: "Autocomplete service unavailable." });
    }
});

// =============================================================================
// // Geocode (address -> lat/lng) (address to point on map)
// =============================================================================
app.get("/api/geocode", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing query" });

    try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
        if (!response.ok) throw new Error(`Photon request failed with status ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Photon geocode failed:", err);
        res.status(500).json({ error: "Failed to fetch geocoding data" });
    }
});

// =============================================================================
// Reverse Geocode (lat/lng -> address) (point on map to address)
// =============================================================================
app.get("/api/reverse", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Missing lat/lon" });

    try {
        const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error(`Photon reverse request failed with status ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Photon reverse geocode failed:", err);
        res.status(500).json({ error: "Failed to fetch reverse geocoding data" });
    }
});


// =============================================================================
// SIGNUP ENDPOINT
// =============================================================================
function validatePassword(password) {
  if (password.length < 8)             return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))         return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(password))         return 'Password must contain a number';
  if (!/[^A-Za-z0-9]/.test(password))  return 'Password must contain a special character';
  return null;
}

app.post("/signup", async(req,res)=>{
    const {username, email, password, date_of_birth} = req.body;

    // input validation
    if (!username || !email || !password || !date_of_birth) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (username.length < 4 || username.length > 14) {
        return res.status(400).json({ error: "Invalid username length." });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: "Invalid username characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address." });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
    try{
        const hashed = await bcrypt.hash(password,10);

        await pool.query(
            "INSERT INTO users (username, email, password, date_of_birth) VALUES ($1,$2,$3,$4)", 
            [username, email, hashed, date_of_birth]
        );

        res.json({success: true});

    } catch (err) {

    if (err.code === '23505') { // PostgreSQL unique violation code
        if (err.detail.includes('username')) {
            return res.status(400).json({ error: 'Username already taken.' });
        }
        if (err.detail.includes('email')) {
            return res.status(400).json({ error: 'Email already registered.' });
        }
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: 'Signup failed' });
}
});

// =============================================================================
// LOGIN ENDPOINT
// =============================================================================
app.post("/login", async (req,res)=>{
    const{username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try{
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1 OR email = $1", 
            [username]
        );

        const user = result.rows[0];
        const match = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !match) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        res.json({ success: true, user: user.username });

    }catch (err){
        console.error(err);
        res.status(500).json({error: "login failed"});
    }
})

//tom_tom
app.post("/route-time", async (req,res)=>{
    try{
        const {start, end} = req.body;

        if(!start || !end){
            return res.status(500).json({error: "Mising start or end coordinated"});
        }

        const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lon}:${end.lat},${end.lon}/json?key=${process.env.TOM_TOM_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const route = data.routes?.[0];

        if (!route) {
            return res.status(500).json({ error: "No route found" });
        }

        const summary = route.summary;

        res.json({
            distanceMeters: summary.lengthInMeters,
            travelTimeSeconds: summary.travelTimeInSeconds,
            trafficDelaySeconds: summary.trafficDelayInSeconds,
            estimatedMinutes: Math.round(summary.travelTimeInSeconds / 60)
        });

    }catch (err){
        console.error(err);
        res.status(500).json({error:"TomTom api"});
    }
});


app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});