require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

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

app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});