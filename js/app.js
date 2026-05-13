import { renderLoader } from "./components/loader.js";
import { closeModal, openModal } from "./components/modal.js";
import { isLoggedIn, logout } from "./services/authService.js";
import { navigateTo, qsa, qs } from "./utils/helpers.js";
import { renderHome, initHome } from "./pages/home.js";
import { renderLogin, initLogin } from "./pages/login.js";
import { renderDreams, initDreams } from "./pages/dreams.js";
import { renderSettings, initSettings } from "./pages/dashboard.js";
import { STORAGE_KEYS } from "./utils/constants.js";
import { acceptLatestTerms } from "./services/termsService.js";

const app = qs("#app");
localStorage.removeItem(STORAGE_KEYS.user);
localStorage.removeItem(STORAGE_KEYS.token);

const routes = {
  "/": {
    render: renderHome,
    init: initHome
  },
  "/login": {
    render: renderLogin,
    init: initLogin
  },
  "/dreams": {
    render: renderDreams,
    init: initDreams,
    protected: true
  },
  "/settings": {
    render: renderSettings,
    init: initSettings,
    protected: true
  }
};

async function router() {
  const rawPath = window.location.pathname.replace("/root-files", "") || "/";
  const path = rawPath.length > 1 ? rawPath.replace(/\/$/, "") : rawPath;
  const route = routes[path] || routes["/"];

  if (isLoggedIn() && (path === "/" || path === "/login")) {
    navigateTo("/dreams");
    return;
  }

  if (route.protected && !isLoggedIn()) {
    navigateTo("/login");
    return;
  }

  app.innerHTML = renderLoader();
  app.innerHTML = await route.render();
  route.init?.();
  bindLinks();
  bindLogout();
  showConsentModal();
}

function bindLinks() {
  qsa("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      navigateTo(url.pathname + url.search);
    });
  });
}

function bindLogout() {
  qsa("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await logout();
      navigateTo("/");
    });
  });
}

function showConsentModal() {
  localStorage.removeItem(STORAGE_KEYS.termsAccepted);

  if (sessionStorage.getItem(STORAGE_KEYS.termsAccepted) === "true") {
    return;
  }

  openModal({
    title: "Terms, condition and cookies",
    body: `
      <p>DreamScope bruger cookies og lokal browser-lagring til login-flow, cookievalg og din midlertidige brugeroplevelse.</p>
      <p>AI-fortolkninger er forslag og kan tage fejl. Dobbelttjek altid vigtig information.</p>
    `,
    actions: `
      <button class="button button--secondary" type="button" id="decline-consent">Decline</button>
      <button class="button button--primary" type="button" id="accept-consent">Accept</button>
    `,
    showClose: false,
    closeOnBackdrop: false
  });

  qs("#accept-consent")?.addEventListener("click", async () => {
    const acceptButton = qs("#accept-consent");
    acceptButton.disabled = true;

    try {
      if (isLoggedIn()) {
        await acceptLatestTerms();
      }
      sessionStorage.setItem(STORAGE_KEYS.termsAccepted, "true");
      closeModal();
    } catch (error) {
      acceptButton.disabled = false;
      console.error("DreamScope could not register terms acceptance.", error);
      qs(".modal__body").insertAdjacentHTML(
        "beforeend",
        "<p class=\"modal__error\">DreamScope could not register your acceptance right now. Please try again.</p>"
      );
    }
  });

  qs("#decline-consent")?.addEventListener("click", () => {
    closeModal();
    window.setTimeout(showConsentModal, 250);
  });
}

window.addEventListener("popstate", router);
window.addEventListener("DOMContentLoaded", router);
