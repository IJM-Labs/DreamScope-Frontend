import { deleteCurrentUser, getCurrentUser, updateCurrentUser } from "../services/authService.js";
import { escapeHtml, navigateTo, qs } from "../utils/helpers.js";
import { required } from "../utils/validator.js";

export function renderSettings() {
  const user = getCurrentUser() || { name: "" };
  const displayName = user.nickname || user.name || "";

  return `
    <main class="settings-page">
      <a class="back-link" href="/dreams" data-link>Go back</a>
      <section class="settings-panel" aria-labelledby="settings-title">
        <h1 id="settings-title">Settings</h1>
        <form class="settings-form" id="settings-form">
          <label for="display-name">Change Name:</label>
          <div class="inline-control">
            <input id="display-name" name="name" value="${escapeHtml(displayName)}" placeholder="...">
            <button class="button button--primary" type="submit">Save</button>
          </div>
          <p class="form-message" id="settings-message" role="status"></p>
        </form>
        <button class="danger-button" type="button" id="delete-account">Delete account</button>
      </section>
    </main>
  `;
}

export function initSettings() {
  qs("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    const message = qs("#settings-message");

    if (!required(name)) {
      message.textContent = "Skriv et navn før du gemmer.";
      return;
    }

    await updateCurrentUser({ name, nickname: name });
    message.textContent = "Navnet er gemt.";
  });

  qs("#delete-account").addEventListener("click", async () => {
    const shouldDelete = window.confirm("Vil du slette kontoen og lokale drømme?");
    if (!shouldDelete) {
      return;
    }

    await deleteCurrentUser();
    navigateTo("/");
  });
}
