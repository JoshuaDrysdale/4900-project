function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
    }
}

function clearErrors() {
    ["usernameError", "passwordError", "formError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    });
}

// =============================================================================
// LOGIN
// =============================================================================
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

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
            window.location.href = "/index.html";
        } else {
            showError("formError", data.error || "Invalid username or password.");
        }
    } catch (err) {
        showError("formError", "Something went wrong. Please try again.");
    }
}
function togglePassword() {
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
}

function signup() {
    window.location.href = "/signup.html";
}