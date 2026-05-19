import { openModal } from "../components/modal.js";
import { sendMagicLink, verifyMagicLink } from "../services/authService.js";
import { navigateTo, qs } from "../utils/helpers.js";
import { isValidEmail, required } from "../utils/validator.js";

let generatedToken = "";
let codeTimerId = null;

export function renderLogin() {
  return `
    <main class="auth-page">
      <a class="back-link" href="/" data-link>Go back</a>
      <section class="auth-panel" aria-labelledby="login-title">
        <h1 id="login-title">Login with your email</h1>
        <form class="auth-form" id="login-form" novalidate>
          <label for="name">Name</label>
          <input id="name" name="name" autocomplete="name" placeholder="Enter name">
          <label for="email">Email</label>
          <input id="email" name="email" inputmode="email" autocomplete="email" placeholder="email.com">
          <button class="button button--secondary" type="submit" id="send-link-button">Send one-time code</button>
        </form>
        <form class="auth-form auth-form--token" id="magic-form">
          <label for="token">One-time code:</label>
          <input id="token" name="token" autocomplete="one-time-code" placeholder="2nf#721">
          <button class="button button--primary" type="submit">Login</button>
          <p class="code-timer" id="code-timer" aria-live="polite" hidden>Code expires in 10:00</p>
          <p class="form-message" id="login-message" role="status"></p>
        </form>
      </section>
      <p class="auth-terms">
        By continuing, you agree to DreamScope's
        <button class="link-button" type="button" id="login-terms">terms & condition</button>
        and private policy.
      </p>
    </main>
  `;
}

export function initLogin() {
  qs("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = qs("#login-message");
    const button = qs("#send-link-button");

    if (!required(name) || !isValidEmail(email)) {
      message.textContent = "Enter your name and a valid email.";
      return;
    }

    button.disabled = true;
    button.textContent = "Sending...";
    message.textContent = "Sending one-time code...";

    try {
      const result = await sendMagicLink({ name, email });
      generatedToken = result.token || "";
      qs("#token").value = generatedToken;
      message.textContent = result.message;
      startCodeTimer();
    } catch (error) {
      message.textContent = error.message || "Could not send one-time code.";
    } finally {
      button.disabled = false;
      button.textContent = "Send one-time code";
    }
  });

  qs("#magic-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = new FormData(event.currentTarget).get("token") || generatedToken;
    const message = qs("#login-message");

    try {
      await verifyMagicLink(token);
      navigateTo("/dreams");
    } catch (error) {
      message.textContent = error.message;
    }
  });

  qs("#login-terms").addEventListener("click", () => {
    openModal({
      title: "Terms and condition",
      body: `
        <p>DreamScope is a school project frontend connected to the planned API endpoints.</p>
        <p>By continuing, you accept that demo data may be saved locally in this browser.</p>
      `
    });
  });
}

function startCodeTimer() {
  const timer = qs("#code-timer");
  let remainingSeconds = 10 * 60;

  clearInterval(codeTimerId);
  timer.hidden = false;
  updateCodeTimer(timer, remainingSeconds);
  codeTimerId = setInterval(() => {
    remainingSeconds -= 1;
    updateCodeTimer(timer, remainingSeconds);

    if (remainingSeconds <= 0) {
      clearInterval(codeTimerId);
    }
  }, 1000);
}

function updateCodeTimer(timer, remainingSeconds) {
  if (!timer) {
    return;
  }

  if (remainingSeconds <= 0) {
    timer.textContent = "Code expired. Request a new one-time code.";
    timer.classList.add("code-timer--expired");
    return;
  }

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  timer.classList.remove("code-timer--expired");
  timer.textContent = `Code expires in ${minutes}:${seconds}`;
}
