import { request } from "./apiService.js";
import { DEFAULT_DREAMS, STORAGE_KEYS } from "../utils/constants.js";
import { createId } from "../utils/helpers.js";

function normalizeDream(dream) {
  const text = dream.content || dream.text || "";

  return {
    id: dream.dreamId || dream.id,
    threadId: dream.threadId || dream.dreamId || dream.id,
    title: dream.title || text.trim().split(/[.!?\n]/)[0].slice(0, 42) || "New dream chat",
    text,
    createdAt: dream.createdAt || new Date().toISOString(),
    interpretations: dream.interpretations || []
  };
}

function readLocalDreams() {
  const savedDreams = localStorage.getItem(STORAGE_KEYS.dreams);
  return savedDreams ? JSON.parse(savedDreams) : DEFAULT_DREAMS;
}

function writeLocalDreams(dreams) {
  localStorage.setItem(STORAGE_KEYS.dreams, JSON.stringify(dreams));
}

export async function getDreams() {
  try {
    const dreams = (await request("/api/dreams")).map(normalizeDream);
    writeLocalDreams(dreams);
    return dreams;
  } catch (error) {
    console.info("Backend dreams endpoint is not available yet, using local dreams.", error);
    return readLocalDreams();
  }
}

export async function createDream(text, threadId) {
  const dream = {
    id: createId("dream"),
    threadId,
    title: text.trim().split(/[.!?\n]/)[0].slice(0, 42) || "New dream chat",
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    const response = await request("/api/dreams", {
      method: "POST",
      body: JSON.stringify({ content: dream.text, threadId })
    });
    return normalizeDream(response);
  } catch (error) {
    console.error("DreamScope could not create or interpret the dream.", error);
    throw new Error(error.message || "DreamScope is having a technical problem. We are working on a fix. Please try again shortly.");
  }
}

export async function deleteDream(id) {
  await request(`/api/dreams/${id}`, { method: "DELETE" });
  writeLocalDreams(readLocalDreams().filter((dream) => dream.id !== id));
}

export async function deleteThread(threadId) {
  if (!threadId) {
    return;
  }

  await request(`/api/dreams/threads/${encodeURIComponent(threadId)}`, { method: "DELETE" });
  writeLocalDreams(readLocalDreams().filter((dream) => dream.threadId !== threadId));
}

export async function updateThreadTitle(threadId, title) {
  await request(`/api/dreams/threads/${encodeURIComponent(threadId)}/title`, {
    method: "PUT",
    body: JSON.stringify({ title: title.trim() })
  });
}
