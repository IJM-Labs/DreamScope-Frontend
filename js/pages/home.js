import { renderTopbar } from "../components/navbar.js";
import { isLoggedIn } from "../services/authService.js";
import { navigateTo, qs } from "../utils/helpers.js";
import { required } from "../utils/validator.js";
import { openModal } from "../components/modal.js";

export function renderHome() {
  return `
    ${renderTopbar()}
    <main class="home-page">
      <div class="night-sky" aria-hidden="true">
        <span class="shooting-star shooting-star--one"></span>
        <span class="shooting-star shooting-star--two"></span>
      </div>
      <section class="home-hero" aria-labelledby="home-title">
        <p class="home-hero__kicker">Dream journal and guide</p>
        <h1 id="home-title">DreamScope <span aria-hidden="true">☾</span></h1>
        <p class="home-hero__intro">What you dream at night, we help you understand with DreamScope as your guide.</p>
        <div class="dream-quotes" aria-label="Dream examples">
          <span>“I was flying over a city at night”</span>
          <span>“I dreamt I won the lottery”</span>
          <span>“I met someone I miss, but they disappeared”</span>
        </div>
        <form class="dream-entry dream-entry--home" id="home-dream-form">
          <label class="visually-hidden" for="home-dream">Write your dream</label>
          <textarea id="home-dream" name="dream" rows="2" placeholder="Write your dream ..."></textarea>
          <button class="button button--primary" type="submit">Send</button>
        </form>
        <p class="disclaimer">
          DreamScope can make mistakes. We advise you to double check important information.
          <button class="link-button" type="button" id="terms-link">View terms & condition</button>
        </p>
      </section>
    </main>
  `;
}

export function initHome() {
  qs("#home-dream-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("dream");

    if (!required(value)) {
      qs("#home-dream").focus();
      return;
    }

    if (!isLoggedIn()) {
      sessionStorage.setItem("dreamscope:draft", value.trim());
      navigateTo("/login");
      return;
    }

    navigateTo("/dreams");
  });

  qs("#terms-link").addEventListener("click", () => {
    openModal({
      title: "Terms and condition",
      body: `
        <p>DreamScope gives reflective, AI-assisted suggestions and should not be used as medical, legal or financial advice.</p>
        <p>Do not share sensitive information you do not want stored in your dream journal.</p>
      `
    });
  });
}
