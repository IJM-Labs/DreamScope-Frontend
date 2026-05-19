import { request } from "./apiService.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { acceptLatestTerms } from "./termsService.js";

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.userId || user.id,
    email: user.email,
    nickname: user.nickname || user.name,
    name: user.nickname || user.name
  };
}

export function getCurrentUser() {
  const user = sessionStorage.getItem(STORAGE_KEYS.user);
  return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export async function sendMagicLink({ name, email }) {
  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, nickname: name })
    });

    sessionStorage.setItem("dreamscope:pending-user", JSON.stringify({ name, nickname: name, email }));
    return {
      mode: "backend",
      message: response.message || "One-time code sent. Check your email or the backend terminal."
    };
  } catch (error) {
    console.error("DreamScope login request failed.", error);
    throw new Error(error.message || "Could not send the one-time code. DreamScope is checking the technical issue.");
  }
}

export async function verifyMagicLink(token) {
  try {
    const response = await request("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code: token.trim() })
    });
    const user = normalizeUser(response);
    sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    sessionStorage.setItem(STORAGE_KEYS.token, token.trim());
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem("dreamscope:pending-user");
    if (sessionStorage.getItem(STORAGE_KEYS.termsAccepted) === "true") {
      await acceptLatestTerms();
    }
    return user;
  } catch (error) {
    throw new Error(error.message || "The one-time code could not be verified.");
  }
}

export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.info("Backend logout endpoint is not available yet.", error);
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.conversations);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.activeConversation);
}

export async function updateCurrentUser(updates) {
  const nextUser = { ...getCurrentUser(), ...updates };

  try {
    const response = await request("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({
        email: nextUser.email,
        nickname: nextUser.nickname || nextUser.name
      })
    });
    const user = normalizeUser(response);
    sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    return user;
  } catch (error) {
    console.info("Backend update user endpoint is not available yet, saving locally.", error);
  }

  sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  return nextUser;
}

export async function deleteCurrentUser() {
  try {
    await request("/api/users/me", { method: "DELETE" });
  } catch (error) {
    console.info("Backend delete user endpoint is not available yet, deleting locally.", error);
  }

  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.dreams);
  localStorage.removeItem(STORAGE_KEYS.conversations);
  sessionStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.activeConversation);
}
