export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function required(value) {
  return String(value || "").trim().length > 0;
}
