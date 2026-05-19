import { getCurrentUser, isLoggedIn } from "../services/authService.js";
import { escapeHtml, getInitials } from "../utils/helpers.js";

export function renderTopbar({ compact = false } = {}) {
  const user = getCurrentUser();

  return `
    <header class="topbar ${compact ? "topbar--compact" : ""}">
      <a class="brand" href="/" data-link>
        <span class="brand__mark" aria-hidden="true">DS</span>
        <span>DreamScope</span>
      </a>
      <nav class="topbar__nav" aria-label="Primary navigation">
        ${isLoggedIn() ? "" : '<a href="/" data-link>Home</a>'}
        <a href="/dreams" data-link>Dreams</a>
        ${isLoggedIn() ? '<a href="/settings" data-link>Settings</a>' : '<a href="/login" data-link>Login</a>'}
        ${isLoggedIn() ? '<button class="nav-logout" type="button" data-logout>Log out</button>' : ""}
      </nav>
      <a class="profile-chip" href="${isLoggedIn() ? "/settings" : "/login"}" data-link aria-label="Profile">
        ${user ? getInitials(user.name) : "?"}
      </a>
    </header>
  `;
}

export function renderSidebar(conversations = []) {
  const latestConversations = conversations.slice(0, 8);

  return `
    <aside class="sidebar" aria-label="Dreams menu">
      <button class="sidebar__toggle" type="button" id="sidebar-toggle" aria-label="Hide history" aria-expanded="true">☰</button>
      <div class="sidebar__content">
        <a class="button button--primary sidebar__new" href="/dreams?new=true" data-link>New chat</a>
        <label class="search-field">
          <span class="visually-hidden">Search dreams</span>
          <input id="dream-search" type="search" placeholder="Search">
        </label>
        <section class="sidebar__latest">
          <h2>History</h2>
          <div class="latest-list">
            ${latestConversations.map((conversation) => `
              <div class="latest-row">
                <button class="latest-item" type="button" data-conversation-id="${conversation.id}">
                  <span>${escapeHtml(conversation.title)}</span>
                </button>
                <button class="latest-edit" type="button" aria-label="Rename chat" data-edit-conversation-id="${conversation.id}">✎</button>
                <button class="latest-delete" type="button" aria-label="Delete chat" data-delete-conversation-id="${conversation.id}">×</button>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="sidebar__footer">
          <a href="/settings" data-link>Settings</a>
          <button class="sidebar__logout" type="button" data-logout>Log out</button>
          <span>© ${new Date().getFullYear()} DreamScope</span>
        </div>
      </div>
    </aside>
  `;
}
