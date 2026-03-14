// =============================================================================
// LOGIN
// =============================================================================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const body = {
        username: username,
        password: password
    };

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    if (username === "1" && password === "1"){
         window.location.href = "index.html";
    }else{
        alert("Invalid login");
    }

    const data = await res.json();
    if (data.success){
        window.location.href = "index.html";
    }else{
        alert("Invalid login");
    }

}

function signup(){
    window.location.href = "signup.html";
}