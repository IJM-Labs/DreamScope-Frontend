const currentHost = window.location.hostname || "localhost";
const apiHost = currentHost === "127.0.0.1" || currentHost === "localhost" ? currentHost : "localhost";

export const API_BASE_URL = window.DREAMSCOPE_API_BASE_URL || `http://${apiHost}:8080`;

export const ROUTES = {
  home: "/",
  login: "/login",
  dreams: "/dreams",
  settings: "/settings"
};

export const STORAGE_KEYS = {
  user: "dreamscope:user",
  dreams: "dreamscope:dreams",
  token: "dreamscope:token",
  termsAccepted: "dreamscope:terms-accepted"
};

export const DEFAULT_DREAMS = [
  {
    id: "demo-1",
    title: "Missen over byen",
    text: "I was flying over a city at night.",
    createdAt: "2026-05-01T20:15:00.000Z"
  },
  {
    id: "demo-2",
    title: "Lotteriet",
    text: "I dreamt I won the lottery.",
    createdAt: "2026-04-28T06:45:00.000Z"
  },
  {
    id: "demo-3",
    title: "Forsvundet ven",
    text: "I met someone I miss, but they disappeared.",
    createdAt: "2026-04-21T07:10:00.000Z"
  }
];
