require("dotenv").config();
const express = require("express");
const path = require("path");
const pool = require("./db");

const app = express();
app.use(express.json());


//Making sure login page opens first
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "login.html"));
})
app.get("public/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

//Calling the OpenRouteService API
app.post("/route", async (req, res) => {
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

//Calling ORS for autocomplete
app.get("/autocomplete", async (req,res)=>{
    const query = req.query.q;
    const response = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${process.env.ORS_API_KEY}&text=${query}`);

    if(!response.ok){
        return res.status(response.status).json({error:`ORS request failed with status ${response.status}`})
    }
    
    const data = await response.json();
    res.json(data.features);
});

// Geocode (address -> lat/lng) (address to point on map)
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

// Reverse Geocode (lat/lng -> address) (point on map to address)
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

//Call Database
app.get("/person", async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM person");
        res.json(result.rows);

    }catch(err){
        console.error(err);
        res.status(500).send(err.message);
        res.status(500).send("Database Error");
    }
})


app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});