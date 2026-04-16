window.onload = async function getUserInfo(){

    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/me", {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`
    } }).then(res => res.json()).then(data => {
        console.log(data.user);

        document.getElementById("username").value = data.user.username;
        document.getElementById("email").value = data.user.email;
        
    })
    .catch(err => console.error(err));

}

document.getElementById("updateProfile").addEventListener("click", async (e)=>{
    e.preventDefault();
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const token = localStorage.getItem("token");

    await fetch("http://localhost:3000/update-user-db", {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({username, email})
    });

})


