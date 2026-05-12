import { renderSidebar, renderTopbar } from "../components/navbar.js";
import { openModal } from "../components/modal.js";
import { createDream, deleteDream, getDreams } from "../services/dreamService.js";
import { escapeHtml, qs, qsa } from "../utils/helpers.js";
import { required } from "../utils/validator.js";

let dreamCache = [];

function getAiText(dream) {
  return dream.interpretations?.[0]?.text || "DreamScope kunne ikke finde en fortolkning til denne besked endnu.";
}

function renderChatMessages(dreams) {
  if (!dreams.length) {
    return `
      <div class="chat-empty">
        <p>Send din første drøm, så svarer DreamScope her.</p>
      </div>
    `;
  }

  return [...dreams].reverse().map((dream) => `
    <article class="chat-message chat-message--user">
      <span class="chat-message__label">You</span>
      <p>${escapeHtml(dream.text)}</p>
    </article>
    <article class="chat-message chat-message--ai">
      <span class="chat-message__label">DreamScope</span>
      <p>${escapeHtml(getAiText(dream))}</p>
    </article>
  `).join("");
}

function renderHistoryList(dreams) {
  return dreams.map((dream) => `
    <div class="latest-row">
      <button class="latest-item" type="button" data-dream-id="${dream.id}">
        <span>${escapeHtml(dream.title)}</span>
      </button>
      <button class="latest-delete" type="button" aria-label="Delete dream" data-delete-id="${dream.id}">×</button>
    </div>
  `).join("");
}

export async function renderDreams() {
  dreamCache = await getDreams();

  return `
    ${renderTopbar({ compact: true })}
    <main class="dashboard-layout">
      ${renderSidebar(dreamCache)}
      <section class="dreams-workspace" aria-labelledby="dreams-title">
        <div class="workspace-heading">
          <p class="workspace-kicker">DreamScope</p>
          <h1 id="dreams-title">What did you dream?</h1>
          <p class="disclaimer">
            DreamScope can make mistakes. We advise you to double check important information.
          </p>
        </div>
        <section class="dream-chat" id="dream-chat" aria-label="DreamScope chat">
          ${renderChatMessages(dreamCache)}
        </section>
        <form class="dream-entry" id="dream-form">
          <label class="visually-hidden" for="dream-input">Write your dream</label>
          <textarea id="dream-input" name="dream" rows="2" placeholder="Message DreamScope"></textarea>
          <button class="button button--primary" type="submit" id="dream-send-button">Send</button>
        </form>
        <button class="terms-fixed link-button" type="button" id="dreams-terms">View terms & condition</button>
      </section>
    </main>
  `;
}

export function initDreams() {
  const chat = qs("#dream-chat");
  const sendButton = qs("#dream-send-button");
  const latestList = qs(".latest-list");
  const refreshHistory = (dreams) => {
    latestList.innerHTML = renderHistoryList(dreams.slice(0, 5));
  };

  qs("#dream-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const value = new FormData(form).get("dream");

    if (!required(value)) {
      qs("#dream-input").focus();
      return;
    }

    form.reset();
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    chat.insertAdjacentHTML("beforeend", `
      <article class="chat-message chat-message--user">
        <span class="chat-message__label">You</span>
        <p>${escapeHtml(value.trim())}</p>
      </article>
      <article class="chat-message chat-message--ai chat-message--loading" id="dreamscope-loading">
        <span class="chat-message__label">DreamScope</span>
        <p>DreamScope is reading your dream...</p>
      </article>
    `);
    chat.scrollTop = chat.scrollHeight;

    try {
      const dream = await createDream(value);
      dreamCache = [dream, ...dreamCache];
      chat.innerHTML = renderChatMessages(dreamCache);
      refreshHistory(dreamCache);
      chat.scrollTop = chat.scrollHeight;
    } catch (error) {
      qs("#dreamscope-loading")?.remove();
      chat.insertAdjacentHTML("beforeend", `
        <article class="chat-message chat-message--ai">
          <span class="chat-message__label">DreamScope</span>
          <p>${escapeHtml(error.message || "DreamScope kunne ikke svare lige nu.")}</p>
        </article>
      `);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send";
    }
  });

  qs("#dream-search").addEventListener("input", (event) => {
    const search = event.target.value.toLowerCase();
    const filtered = dreamCache.filter((dream) =>
      `${dream.title} ${dream.text}`.toLowerCase().includes(search)
    );
    refreshHistory(filtered);
  });

  latestList.addEventListener("click", async (event) => {
    const dreamButton = event.target.closest("[data-dream-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (dreamButton) {
      const id = dreamButton.dataset.dreamId;
      const selected = dreamCache.find((dream) => dream.id === id);
      if (selected) {
        chat.innerHTML = renderChatMessages([selected]);
        chat.scrollTop = chat.scrollHeight;
      }
      return;
    }

    if (deleteButton) {
      await deleteDream(deleteButton.dataset.deleteId);
      dreamCache = dreamCache.filter((dream) => dream.id !== deleteButton.dataset.deleteId);
      chat.innerHTML = renderChatMessages(dreamCache);
      refreshHistory(dreamCache);
    }
  });

  qsa("[data-dream-id]").forEach((button) => {
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const id = button.dataset.dreamId;
      const selected = dreamCache.find((dream) => dream.id === id);
      if (selected) {
        chat.innerHTML = renderChatMessages([selected]);
      }
    });
  });

  qs("#dreams-terms").addEventListener("click", () => {
    openModal({
      title: "Terms and condition",
      body: "<p>Dream interpretations are generated suggestions. Always double check important information.</p>"
    });
  });

  if (new URLSearchParams(window.location.search).get("new") === "true") {
    qs("#dream-input").focus();
    chat.innerHTML = renderChatMessages([]);
  }

  const draft = sessionStorage.getItem("dreamscope:draft");
  if (draft) {
    qs("#dream-input").value = draft;
    qs("#dream-input").focus();
    sessionStorage.removeItem("dreamscope:draft");
  }
}
