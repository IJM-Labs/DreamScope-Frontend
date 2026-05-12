import { request } from "./apiService.js";
import { STORAGE_KEYS } from "../utils/constants.js";

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
      message: response.message || "Engangskode sendt. Tjek din email eller backend-terminalen."
    };
  } catch (error) {
    console.error("DreamScope login request failed.", error);
    throw new Error(error.message || "Kunne ikke sende magic link. Tjek at backenden kører på port 8080.");
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
    return user;
  } catch (error) {
    throw new Error(error.message || "Koden kunne ikke verificeres.");
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
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.user);
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
  sessionStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.token);
}
