// =============================================================================
// LOGIN
// =============================================================================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "1" && password === "1"){
         window.location.href = "index.html";
    }else{
        alert("Invalid login");
    }
}