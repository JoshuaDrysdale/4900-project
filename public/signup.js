document.getElementById("signupForm").addEventListener("submit", async e =>{
    e.preventDefault();

    const form = e.target;

    const body = {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        date_of_birth: form.date_of_birth.value
    };

    const res = await fetch("/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log(data);
    if(data.success) {
      alert("Signup successful!");
    } else {
      alert("Signup failed: " + data.error);
    }
});