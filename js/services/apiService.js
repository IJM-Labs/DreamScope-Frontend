import { API_BASE_URL } from "../utils/constants.js";

export async function request(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });
  } catch (error) {
    console.error("DreamScope request failed before the server could respond.", error);
    throw new Error("DreamScope is having a technical connection issue. We are working on a fix. Please try again shortly.");
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(friendlyMessage(message, response.status));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function friendlyMessage(message, status) {
  if (!message || message === "Unexpected server error") {
    return "DreamScope is having a technical problem. We are working on a fix. Please try again shortly.";
  }

  if (status >= 500) {
    return "DreamScope is having a technical problem. We are working on a fix. Please try again shortly.";
  }

  return message;
}

async function readErrorMessage(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
    try {
      const error = await response.json();
      return error.detail || error.message || error.title;
    } catch (error) {
      console.info("DreamScope could not read the error response body.", error);
      return "";
    }
  }

  return response.text().catch(() => "");
}
