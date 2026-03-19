document.addEventListener("DOMContentLoaded", function () {
// =============================================================================
// FORM SUBMISSION
// =============================================================================
document.getElementById("signupForm").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;

    clearErrors(); // clear any previous error messages before revalidating

    let valid = true; // assume valid until a check fails

    // username validation checks

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

        // email validation checks

    if (!form.email.value.trim()) {
        showError("emailError", "Please enter your email.");
        valid = false;
    } else if (!isValidEmail(form.email.value.trim())) {
        showError("emailError", "Please enter a valid email address.");
        valid = false;
    }

        // password validation checks
     
    if (!form.password.value.trim()) {
    showError("passwordError", "Please enter a password.");
    valid = false;
    } else if (getPasswordStrength(form.password.value) < 4) {
    showError("passwordError", "Password is too weak. Please make it stronger.");
    valid = false;
    }
    
        // confirm password
    if (form.confirmPassword.value !== form.password.value) {
    showError("confirmPasswordError", "Passwords do not match.");
    valid = false;
    }

        //DoB cehck
    if (!form.date_of_birth.value) {
        showError("dobError", "Please enter your date of birth.");
        valid = false;
    }

        
    if (!valid) return; // stop submission if any validation failed

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
// =============================================================================
// PASSWORD STRENGTH BAR + REQUIREMENTS CHECKLIST
// updates in real time as the user types
// =============================================================================
document.getElementById('passwordInput').addEventListener('input', function() {
    const val = this.value;
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');

    // strength bar
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

    // update each requirement
    updateReq('req-length',  val.length >= 8);
    updateReq('req-upper',   /[A-Z]/.test(val));
    updateReq('req-number',  /[0-9]/.test(val));
    updateReq('req-special', /[^A-Za-z0-9]/.test(val));
    
// recheck confirm password match whenever password changes
    const confirmVal = document.getElementById('confirmPasswordInput').value;
    const confirmError = document.getElementById('confirmPasswordError');
    if (confirmVal) { // only recheck if confirm field has something in it
        if (confirmVal !== this.value) {
            setHint(confirmError, 'Passwords do not match.', 'error');
        } else {
            setHint(confirmError, '✔ Passwords match!', 'success');
        }
    }
});

// =============================================================================
// FLATPICKR DATE PICKER
// replaces the default browser date input with a styled calendar
// =============================================================================
flatpickr("#date_of_birth", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    maxDate: "today",
    yearRange: [1900, new Date().getFullYear()],
});

// username live validation
// =============================================================================
// LIVE VALIDATION HINTS
// shows red errors and green checkmarks as the user types each field
// =============================================================================
document.querySelector('[name="username"]').addEventListener('input', function() {
    const val = this.value.trim();
    const error = document.getElementById('usernameError');

    if (!val) {
        setHint(error, 'Please enter a username.', 'error');
    } else if (val.length < 4) {
        setHint(error, 'Username must be at least 4 characters.', 'error');
    } else if (val.length > 14) {
        setHint(error, 'Username must be under 14 characters.', 'error');
    } else if (!/^[a-zA-Z0-9_]+$/.test(val)) {
        setHint(error, 'Only letters, numbers, and underscores.', 'error');
    } else {
        setHint(error, '✔ Looks good!', 'success');
    }
});

// email live validation
document.querySelector('[name="email"]').addEventListener('input', function() {
    const val = this.value.trim();
    const error = document.getElementById('emailError');

    if (!val) {
        setHint(error, 'Please enter your email.', 'error');
    } else if (!isValidEmail(val)) {
        setHint(error, 'Please enter a valid email address.', 'error');
    } else {
        setHint(error, '✔ Looks good!', 'success');
    }
});

// confirm password live validation
document.getElementById('confirmPasswordInput').addEventListener('input', function() {
    const val = this.value;
    const password = document.getElementById('passwordInput').value;
    const error = document.getElementById('confirmPasswordError');

    if (!val) {
        setHint(error, 'Please confirm your password.', 'error');
    } else if (val !== password) {
        setHint(error, 'Passwords do not match.', 'error');
    } else {
        setHint(error, '✔ Passwords match!', 'success');
    }
});

}); // end DOMContentLoaded

// =============================================================================
// HELPER FUNCTIONS 
// =============================================================================

//very basic password strength checker, one uppercase letter
//a number, length of 8, and a special letter for max strength, 
// requires all 4 to pass for a strong password


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
// updates a password requirement checklist item to pass (green) or fail (red)

function updateReq(id, passes) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = (passes ? '✔ ' : '✖ ') + el.textContent.slice(2);
        el.style.color = passes ? '#2ecc71' : '#e74c3c';
    }
}
//error message under form

function showError(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
    }
}
// clears all error messages from the form

function clearErrors() {
    ["usernameError", "emailError", "passwordError", "confirmPasswordError", "dobError", "formError"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.style.display = "none";
        }
    });
}
// displays a live hint under a field, green for success and red for error

function setHint(el, message, type) {
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = type === 'success' ? '#2ecc71' : '#e74c3c';
    }
}
//following toggles are to show/hide password for each password field
function togglePassword() {
    const input = document.getElementById("passwordInput");
    const btn = document.getElementById("togglePasswordBtn");
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
    } else {
        input.type = "password";
        btn.textContent = "Show";
    }
}

function toggleConfirmPassword() {
    const input = document.getElementById("confirmPasswordInput");
    const btn = document.getElementById("toggleConfirmBtn");
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
    } else {
        input.type = "password";
        btn.textContent = "Show";
    }
}
/*allow users to copy the password to thier clipboard so that they
easily paste it into the confirm password field */

function copyPassword() {
    const input = document.getElementById("passwordInput");
    const btn = document.getElementById("copyPasswordBtn");
    navigator.clipboard.writeText(input.value).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => {
            btn.textContent = "📋";
        }, 5000); // resets after 5 seconds, change as needed
    });
}