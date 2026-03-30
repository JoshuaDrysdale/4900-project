
// =============================================================================
// RATE LIMITING — disables login after 5 failed attempts for 30 seconds
// =============================================================================
let failedAttempts = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 30000;

function lockout() {
    const btn = document.getElementById("submitButtonLogin");
    btn.disabled = true;

    let remaining = LOCKOUT_TIME / 1000;
    btn.textContent = `Too many attempts. Try again in ${remaining}s`;

    const countdown = setInterval(() => {
        remaining--;
        btn.textContent = `Too many attempts. Try again in ${remaining}s`;
        if (remaining <= 0) {
            clearInterval(countdown);
            btn.disabled = false;
            btn.textContent = "Login";
            failedAttempts = 0;
            clearErrors();
        }
    }, 1000);
}

// =============================================================================
// LOGIN
// =============================================================================

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("rememberMe").checked;

    const body = {
        username: username,
        password: password
    };

    clearErrors();
    // wipes all error messages from the screen every time login is clicked
    // so old errors don't stack up or stay visible from a previous attempt

    let valid = true;
    // assumes everything is valid to start, gets flipped to false if any rule fails

    //if username or password field is empty
    if (!username) {
        showError("usernameError", "Please enter your username or email.");
        valid = false;
    }

    if (!password) {
        showError("passwordError", "Please enter your password.");
        valid = false;
    }

    if (!valid) return;

    if (username === "1" && password === "1") { //dev shortcut for now
    console.warn("⚠️ DEV SHORTCUT USED — Remove before deployment");
    localStorage.setItem("token");
    window.location.href = "/index.html";
        return;
    }

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            // save username to localStorage if remember me is checked
            failedAttempts = 0;
             // Store JWT token in localStorage
        localStorage.setItem("token", data.token);
        console.log("✅ Login successful, JWT token stored");
            if (rememberMe) {
                localStorage.setItem("rememberedUser", username);
            } else {
                localStorage.removeItem("rememberedUser");
            }

        setTimeout(() => {
        window.location.href = "/index.html";
      }, 300);        
    } else {
    failedAttempts++;
    shakeForm();

    if (failedAttempts >= MAX_ATTEMPTS) {
        lockout();
    } else {
        const left = MAX_ATTEMPTS - failedAttempts;
        const plural = left === 1 ? "attempt" : "attempts";
        showError("formError", `Incorrect username or password. ${left} ${plural} remaining.`);
    }
}
    } catch (err) {
        showError("formError", "Something went wrong. Please try again.");
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// displays an error message under a form field
function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
        el.style.color = "#e74c3c";
    }
}

// clears all error messages from the form
function clearErrors() {
    ["usernameError", "passwordError", "formError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    });
}

// toggles password visibility between shown and hidden
function togglePassword() {
    const input = document.getElementById("password");
    const btn = document.getElementById("togglePasswordBtn");
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
    } else {
        input.type = "password";
        btn.textContent = "Show";
    }
}

function shakeForm() {
    const container = document.querySelector(".loginContainer");
    container.classList.add("shake");
    setTimeout(() => container.classList.remove("shake"), 500);
}

// =============================================================================
// REMEMBER ME
// saves and loads username from localStorage
// =============================================================================
function loadRememberedUser() {
    const saved = localStorage.getItem("rememberedUser");
    if (saved) {
        document.getElementById("username").value = saved;
        document.getElementById("rememberMe").checked = true;
    }
}

// =============================================================================
// CAPS LOCK WARNING
// runs after DOM is fully loaded
// =============================================================================
document.addEventListener("DOMContentLoaded", function () {

    // load remembered username if it exists
    loadRememberedUser();

    // caps lock warning on password field — checks on keyup and focus
    document.getElementById("password").addEventListener("keyup", checkCapsLock);
    document.getElementById("password").addEventListener("keydown", checkCapsLock);


});

// checks if caps lock is on and shows/hides warning accordingly
function checkCapsLock(e) {
    const capsWarning = document.getElementById("capsWarning");
    if (e.getModifierState("CapsLock")) {
        capsWarning.style.display = "block";
    } else {
        capsWarning.style.display = "none";
    }
}

// redirects to the signup page
function signup() {
    window.location.href = "/signup.html";
}
