require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: "10kb" }));

// ============================================================================
// JWT Configuration
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";

// ============================================================================
// JWT Middleware - Verify token on protected routes
// ============================================================================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
 
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
 
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

// =============================================================================
// EMAIL CONFIGURATION
// =============================================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
  port: 465,
  secure: true,
    auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
})
 
// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});
 

// ============================================================================
// Route to login page
// ============================================================================

//Making sure login page opens first
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "login.html"));
})

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Serve static files from public folder (signup.html, index.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Also serve static files from root
app.use(express.static(__dirname));
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

       // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
 
        const result = await pool.query(
          `INSERT INTO users (username, email, password, date_of_birth, email_verification_token, email_verification_token_expiry, email_verified) 
           VALUES ($1,$2,$3,$4,$5,$6,FALSE) 
           RETURNING id, username, email`,
          [username, email, hashed, date_of_birth, verificationTokenHash, verificationTokenExpiry]
        );
 
        const user = result.rows[0];
 
        // Generate JWT token (user can access app before verification)
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );
 
        // Send verification email
        const verificationUrl = `http://localhost:3000/verify-email.html?token=${verificationToken}&email=${encodeURIComponent(email)}`;
 
        const mailOptions = {
          from: '"Ride App" <myappemail@gmail.com>',
          to: email,
          subject: '🚗 RHA - Verify Your Email Address',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to RHA! 🚗</h2>
              
              <p>Hi ${username},</p>
              
              <p>Thank you for signing up! Please verify your email address to unlock all features.</p>
              
              <a href="${verificationUrl}" style="
                display: inline-block;
                padding: 12px 24px;
                background: #4caf50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              ">Verify Email</a>
              
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              
              <p><strong>This link expires in 24 hours.</strong></p>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #999;">
                © 2026 RHA (Ride Hailing Aggregator). All rights reserved.
              </p>
            </div>
          `
        };
 
        await transporter.sendMail(mailOptions);
 
        console.log(`✅ User registered: ${user.username}`);
        res.status(201).json({
          success: true,
          message: "Signup successful! Check your email to verify your account.",
          token,
          user: { id: user.id, username: user.username, email: user.email },
          emailVerificationRequired: true
        });
    }
    catch (err) {
        if (err.code === '23505') {
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

     // =========================
    // DEV SHORTCUT (BACKEND)
    // =========================
    if (username === "1" && password === "1") {
        const token = jwt.sign(
            { id: -1, username: "dev", email: "dev@example.com" },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        return res.status(200).json({
            success: true,
            message: "Dev login successful",
            token,
            user: { id: 0, username: "dev", email: "dev@example.com" }
        });
    }

    if (!username || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }
 try {
    const result = await pool.query(
      "SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1",
      [username]
    );

        const user = result.rows[0];
        const match = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !match) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
 
    console.log(`✅ User logged in: ${user.username}`);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});


// ============================================================================
// LOGOUT ENDPOINT (logs server-side, token deletion is client-side)
// ============================================================================
app.post("/logout", verifyToken, (req, res) => {
  console.log(`✅ User logged out: ${req.user.username}`);
  res.status(200).json({ message: "Logged out successfully" });
});

// ============================================================================
// GET CURRENT USER (protected route example)
// ============================================================================
app.get("/me", verifyToken, async (req, res) => {
     if (req.user.id === -1) {
    return res.status(200).json({
      user: {
        id: -1,
        username: "dev",
        email: "dev@example.com",
        date_of_birth: null,
        created_at: null
      }
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, email, date_of_birth, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
 
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
 
    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

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

        const points = route.legs[0].points;

    res.json({
        points,
        distanceMeters: summary.lengthInMeters,
        estimatedMinutes: Math.round(summary.travelTimeInSeconds / 60)
    });

    }catch (err){
        console.error(err);
        res.status(500).json({error:"TomTom api"});
    }
});



// =============================================================================
// REQUEST PASSWORD RESET
// =============================================================================
 
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
 
  try {
    const result = await pool.query(
      "SELECT id, username FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
 
    if (result.rows.length === 0) {
      return res.status(200).json({ 
        message: "If that email exists, we sent a reset link" 
      });
    }
 
    const user = result.rows[0];
 
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
 
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );
 
    const resetUrl = `http://localhost:3000/resetPassword.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
 
    const mailOptions = {
      from: '"Ride App" <myappemail@gmail.com>',
      to: email,
      subject: '🚗 RHA - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          
          <p>Hi ${user.username},</p>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          ">Reset Password</a>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>This link expires in 30 minutes.</strong></p>
          
          <p>If you didn't request a password reset, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #999;">
            © 2026 RHA (Ride Hailing Aggregator). All rights reserved.
          </p>
        </div>
      `
    };
 
    await transporter.sendMail(mailOptions);
 
    res.status(200).json({ 
      message: "If that email exists, we sent a reset link" 
    });
 
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});
 
// =============================================================================
// RESET PASSWORD WITH TOKEN
// =============================================================================
 
app.post("/api/reset-password", async (req, res) => {
  const { token, email, newPassword } = req.body;
 
  if (!token || !email || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }
 
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
 
  try {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
 
    const result = await pool.query(
      `SELECT id, username, reset_token_expiry FROM users 
       WHERE email = $1 
       AND reset_token = $2`,
      [email.toLowerCase(), tokenHash]
    );
 
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
 
    const user = result.rows[0];
 
    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: "Reset token has expired" });
    }
 
    const hashedPassword = await bcrypt.hash(newPassword, 10);
 
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );
 
    console.log(`✅ Password reset for user: ${user.username}`);
    res.status(200).json({ 
      success: true,
      message: "Password reset successful! You can now log in with your new password." 
    });
 
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});
 

// =============================================================================
// VERIFY EMAIL WITH TOKEN
// =============================================================================
 
app.post("/api/verify-email", async (req, res) => {
  const { token, email } = req.body;
 
  if (!token || !email) {
    return res.status(400).json({ error: "Token and email are required" });
  }
 
  try {
    // Hash the token to compare
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
 
    // Find user and verify token
    const result = await pool.query(
      `SELECT id, username FROM users 
       WHERE email = $1 
       AND email_verification_token = $2 
       AND email_verification_token_expiry > NOW()`,
      [email.toLowerCase(), tokenHash]
    );
 
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }
 
    const user = result.rows[0];
 
    // Mark email as verified and clear token
    await pool.query(
      `UPDATE users 
       SET email_verified = TRUE, email_verification_token = NULL, email_verification_token_expiry = NULL 
       WHERE id = $1`,
      [user.id]
    );
 
    console.log(`✅ Email verified for user: ${user.username}`);
    res.status(200).json({ 
      success: true,
      message: "Email verified successfully!" 
    });
 
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});
 
// =============================================================================
// VERIFY EMAIL TOKEN (for validation on frontend)
// =============================================================================
 
app.get("/api/verify-email-token", async (req, res) => {
  const { token, email } = req.query;
 
  if (!token || !email) {
    return res.status(400).json({ error: "Token and email are required" });
  }
 
  try {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
 
    const result = await pool.query(
      `SELECT id FROM users 
       WHERE email = $1 
       AND email_verification_token = $2 
       AND email_verification_token_expiry > NOW()`,
      [email.toLowerCase(), tokenHash]
    );
 
    if (result.rows.length === 0) {
      return res.status(400).json({ valid: false });
    }
 
    res.status(200).json({ valid: true });
 
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(500).json({ error: "Failed to verify token" });
  }
});
 
// =============================================================================
// RESEND VERIFICATION EMAIL
// =============================================================================
 
app.post("/api/resend-verification-email", async (req, res) => {
  const { email } = req.body;
  const token = req.headers.authorization?.split(" ")[1]; // Get user's JWT
 
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
 
  try {
    // Decode JWT to get user ID
    const decoded = jwt.verify(token, JWT_SECRET);
 
    // Get user
    const result = await pool.query(
      "SELECT id, username FROM users WHERE email = $1 AND id = $2",
      [email.toLowerCase(), decoded.id]
    );
 
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
 
    const user = result.rows[0];
 
    // Check if already verified
    const userCheck = await pool.query(
      "SELECT email_verified FROM users WHERE id = $1",
      [user.id]
    );
 
    if (userCheck.rows[0].email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }
 
    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
 
    // Update user with new token
    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1, email_verification_token_expiry = $2 
       WHERE id = $3`,
      [verificationTokenHash, verificationTokenExpiry, user.id]
    );
 
    // Send verification email
    const verificationUrl = `http://localhost:3000/verify-email.html?token=${verificationToken}&email=${encodeURIComponent(email)}`;
 
    const mailOptions = {
      from: '"Ride App" <myappemail@gmail.com>',
      to: email,
      subject: '🚗 RHA - Verify Your Email Address (Resend)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Hi ${user.username},</p>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #4caf50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          ">Verify Email</a>
          <p>Link expires in 24 hours.</p>
        </div>
      `
    };
 
    await transporter.sendMail(mailOptions);
 
    console.log(`✅ Verification email resent to ${email}`);
    res.status(200).json({ message: "Verification email sent" });
 
  } catch (error) {
    console.error("❌ Resend verification email error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
  
 });
// =============================================================================
// VERIFY PASSWORD RESET TOKEN (for validation on frontend)
// =============================================================================
 
app.get("/api/verify-reset-token", async (req, res) => {
  const { token, email } = req.query;
 
  if (!token || !email) {
    return res.status(400).json({ error: "Token and email are required" });
  }
 
  try {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
 
    const result = await pool.query(
      `SELECT id FROM users 
       WHERE email = $1 
       AND reset_token = $2 
       AND reset_token_expiry > NOW()`,
      [email.toLowerCase(), tokenHash]
    );
 
    if (result.rows.length === 0) {
      return res.status(400).json({ valid: false });
    }
 
    res.status(200).json({ valid: true });
 
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(500).json({ error: "Failed to verify token" });
  }
});


app.use(express.static("public"));
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});