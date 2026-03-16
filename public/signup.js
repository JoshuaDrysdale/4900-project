document.addEventListener("DOMContentLoaded", function () {

document.getElementById("signupForm").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;

    clearErrors();

    let valid = true;

    if (!form.username.value.trim()) {
        showError("usernameError", "Please enter a username.");
        valid = false;
    }
    else if (form.username.value.trim().length < 4) {
    showError("usernameError", "Username must be at least 4 characters.");
    valid = false;
    }
     else if (form.username.value.trim().length > 14) {
    showError("usernameError", "Username must be under 14 characters.");
    valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username.value.trim())) { //regular expression for no special characters
    showError("usernameError", "Username can only contain letters, numbers, and underscores.");
    valid = false;
    }

    if (!form.email.value.trim()) {
        showError("emailError", "Please enter your email.");
        valid = false;
    } else if (!isValidEmail(form.email.value.trim())) {
        showError("emailError", "Please enter a valid email address.");
        valid = false;
    }

   
    if (!form.password.value.trim()) {
    showError("passwordError", "Please enter a password.");
    valid = false;
    } else if (getPasswordStrength(form.password.value) < 3) {
    showError("passwordError", "Password is too weak. Please make it stronger.");
    valid = false;
    }
    
    // confirm password
    if (form.confirmPassword.value !== form.password.value) {
    showError("confirmPasswordError", "Passwords do not match.");
    valid = false;
    }


    if (!form.date_of_birth.value) {
        showError("dobError", "Please enter your date of birth.");
        valid = false;
    }

    if (!valid) return;

    const body = {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        date_of_birth: form.date_of_birth.value
    };

    try {
        const res = await fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            alert("Signup successful!");
            window.location.href = "/login";
        } else {
            showError("formError", data.error || "Signup failed. Please try again.");
        }
    } catch (err) {
        showError("formError", "Something went wrong. Please try again.");
    }
});

document.getElementById('passwordInput').addEventListener('input', function() {
    const val = this.value;
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');

    const strength = getPasswordStrength(val);
    
       const levels = [
      { width: '0%',   color: '#e0e0e0', label: '' },
      { width: '25%',  color: '#e74c3c', label: 'Weak' },
      { width: '50%',  color: '#e67e22', label: 'Fair' },
      { width: '75%',  color: '#f1c40f', label: 'Good' },
      { width: '100%', color: '#2ecc71', label: 'Strong' },
    ];

    fill.style.width = levels[strength].width;
    fill.style.background = levels[strength].color;
    text.textContent = levels[strength].label;
    text.style.color = levels[strength].color;
});


flatpickr("#date_of_birth", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    maxDate: "today",
    yearRange: [1900, new Date().getFullYear()],
});

}); // end DOMContentLoaded

// =============================================================================
// HELPER FUNCTIONS 
// =============================================================================

//very basic password strength checker, at lesat one uppercase letter
//a number, length of 8, and a special letter for max strength, 


function getPasswordStrength(val) {
     let strength = 0;
    if (val.length >= 8) strength++;
    // rule 1: is the password at least 8 characters long?
    // "hi" → fails, "mypassword" → passes ✓
    if (/[A-Z]/.test(val)) strength++;
    // rule 2: does it contain at least one UPPERCASE letter?
    // "mypassword" → fails, "Mypassword" → passes ✓
    if (/[0-9]/.test(val)) strength++;
    // rule 3: does it contain at least one NUMBER?
    // "Mypassword" → fails, "Mypassword1" → passes ✓
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    // rule 4: does it contain a special character? (anything that is NOT a-z, A-Z, or 0-9)
    // "Mypassword1" → fails, "Mypassword1!" → passes ✓
    return strength;
    //Change rules as needed, as with length, more characters needed, etc
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); //regular expression script to check for valid email address
}

function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
    }
}

function clearErrors() {
    ["usernameError", "emailError", "passwordError", "confirmPasswordError", "dobError", "formError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    });
}

function togglePassword() {
    const input = document.getElementById("passwordInput");
    input.type = input.type === "password" ? "text" : "password";
}

function toggleConfirmPassword() {
    const input = document.getElementById("confirmPasswordInput");
    input.type = input.type === "password" ? "text" : "password";
}