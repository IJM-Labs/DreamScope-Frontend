import { renderSidebar, renderTopbar } from "../components/navbar.js";
import { openModal } from "../components/modal.js";
import { createDream, deleteDream, getDreams } from "../services/dreamService.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { createId, escapeHtml, qs } from "../utils/helpers.js";
import { required } from "../utils/validator.js";

let dreamCache = [];
let conversationCache = [];
let activeConversationId = "";

function getAiText(dream) {
  return dream.interpretations?.[0]?.text || "DreamScope does not have an interpretation for this message yet.";
}

function readSavedConversations(dreams) {
  const saved = localStorage.getItem(STORAGE_KEYS.conversations);
  const existingDreamIds = new Set(dreams.map((dream) => dream.id));
  let conversations = saved ? JSON.parse(saved) : [];

  conversations = conversations
    .map((conversation) => ({
      ...conversation,
      dreamIds: (conversation.dreamIds || []).filter((dreamId) => existingDreamIds.has(dreamId))
    }))
    .filter((conversation) => conversation.dreamIds.length);

  const assignedDreamIds = new Set(conversations.flatMap((conversation) => conversation.dreamIds));
  const unassignedDreams = dreams.filter((dream) => !assignedDreamIds.has(dream.id));
  if (unassignedDreams.length) {
    conversations.unshift({
      id: createId("chat"),
      title: unassignedDreams[0].title || "Dream chat",
      dreamIds: unassignedDreams.map((dream) => dream.id),
      updatedAt: unassignedDreams[0].createdAt || new Date().toISOString()
    });
  }

  return conversations.sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
}

function saveConversations() {
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversationCache));
}

function getActiveConversation() {
  return conversationCache.find((conversation) => conversation.id === activeConversationId) || conversationCache[0] || null;
}

function getDreamsForConversation(conversation) {
  if (!conversation) {
    return [];
  }

  const dreamById = new Map(dreamCache.map((dream) => [dream.id, dream]));
  return conversation.dreamIds.map((dreamId) => dreamById.get(dreamId)).filter(Boolean);
}

function setActiveConversation(conversationId) {
  activeConversationId = conversationId;
  sessionStorage.setItem(STORAGE_KEYS.activeConversation, conversationId);
}

function startNewConversation() {
  setActiveConversation(createId("chat"));
}

function appendDreamToActiveConversation(dream) {
  let conversation = conversationCache.find((item) => item.id === activeConversationId);

  if (!conversation) {
    conversation = {
      id: activeConversationId || createId("chat"),
      title: dream.title || "Dream chat",
      dreamIds: [],
      updatedAt: dream.createdAt || new Date().toISOString()
    };
    conversationCache.unshift(conversation);
    setActiveConversation(conversation.id);
  }

  conversation.dreamIds = [dream.id, ...conversation.dreamIds.filter((dreamId) => dreamId !== dream.id)];
  conversation.title = conversation.title || dream.title || "Dream chat";
  if (conversation.dreamIds.length === 1 && dream.title) {
    conversation.title = dream.title;
  }
  conversation.updatedAt = dream.createdAt || new Date().toISOString();
  conversationCache = conversationCache.sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
  saveConversations();
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

function renderHistoryList(conversations) {
  return conversations.map((conversation) => `
    <div class="latest-row">
      <button class="latest-item" type="button" data-conversation-id="${conversation.id}">
        <span>${escapeHtml(conversation.title)}</span>
      </button>
      <button class="latest-delete" type="button" aria-label="Delete chat" data-delete-conversation-id="${conversation.id}">×</button>
    </div>
  `).join("");
}

export async function renderDreams() {
  dreamCache = await getDreams();
  conversationCache = readSavedConversations(dreamCache);
  activeConversationId = sessionStorage.getItem(STORAGE_KEYS.activeConversation) || conversationCache[0]?.id || "";

  return `
    ${renderTopbar({ compact: true })}
    <main class="dashboard-layout">
      ${renderSidebar(conversationCache)}
      <section class="dreams-workspace" aria-labelledby="dreams-title">
        <div class="workspace-heading">
          <p class="workspace-kicker">DreamScope</p>
          <h1 id="dreams-title">What did you dream?</h1>
          <p class="disclaimer">
            DreamScope can make mistakes. We advise you to double check important information.
          </p>
        </div>
        <section class="dream-chat" id="dream-chat" aria-label="DreamScope chat">
          ${renderChatMessages(getDreamsForConversation(getActiveConversation()))}
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
  const refreshHistory = (conversations) => {
    latestList.innerHTML = renderHistoryList(conversations.slice(0, 8));
  };
  const refreshChat = () => {
    chat.innerHTML = renderChatMessages(getDreamsForConversation(getActiveConversation()));
    chat.scrollTop = chat.scrollHeight;
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
      appendDreamToActiveConversation(dream);
      refreshChat();
      refreshHistory(conversationCache);
    } catch (error) {
      qs("#dreamscope-loading")?.remove();
      chat.insertAdjacentHTML("beforeend", `
        <article class="chat-message chat-message--ai">
          <span class="chat-message__label">DreamScope</span>
          <p>${escapeHtml(error.message || "DreamScope is having a technical problem. We are working on a fix. Please try again shortly.")}</p>
        </article>
      `);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send";
    }
  });

  qs("#dream-search").addEventListener("input", (event) => {
    const search = event.target.value.toLowerCase();
    const filtered = conversationCache.filter((conversation) =>
      `${conversation.title} ${getDreamsForConversation(conversation).map((dream) => dream.text).join(" ")}`.toLowerCase().includes(search)
    );
    refreshHistory(filtered);
  });

  latestList.addEventListener("click", async (event) => {
    const conversationButton = event.target.closest("[data-conversation-id]");
    const deleteButton = event.target.closest("[data-delete-conversation-id]");

    if (conversationButton) {
      setActiveConversation(conversationButton.dataset.conversationId);
      refreshChat();
      return;
    }

    if (deleteButton) {
      const conversationId = deleteButton.dataset.deleteConversationId;
      const conversation = conversationCache.find((item) => item.id === conversationId);
      await Promise.all((conversation?.dreamIds || []).map((dreamId) => deleteDream(dreamId)));
      dreamCache = dreamCache.filter((dream) => !conversation?.dreamIds.includes(dream.id));
      conversationCache = conversationCache.filter((item) => item.id !== conversationId);
      saveConversations();
      setActiveConversation(conversationCache[0]?.id || "");
      refreshChat();
      refreshHistory(conversationCache);
    }
  });

  qs("#dreams-terms").addEventListener("click", () => {
    openModal({
      title: "Terms and condition",
      body: "<p>Dream interpretations are generated suggestions. Always double check important information.</p>"
    });
  });

  if (new URLSearchParams(window.location.search).get("new") === "true") {
    startNewConversation();
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
