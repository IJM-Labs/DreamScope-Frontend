const loginForm = document.getElementById("loginForm");
const statusMessage = document.getElementById("statusMessage");

// Skift port hvis din backend kører på en anden port
const API_URL = "http://localhost:8080";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    nickname: document.getElementById("nickname").value,
    email: document.getElementById("email").value
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      statusMessage.innerText =
        "Magic link sent! Please check your email.";

      // US-F04 kommer senere:
      // window.location.href = "/check-email.html";
    } else {
      const errorData = await response.json().catch(() => ({}));

      statusMessage.innerText =
        errorData.message || "Something went wrong.";
    }

  } catch (error) {
    statusMessage.innerText =
      "Could not connect to server.";
  }
});