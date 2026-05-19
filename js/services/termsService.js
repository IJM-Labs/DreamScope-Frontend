import { request } from "./apiService.js";

export async function getLatestTerms() {
  return request("/api/terms");
}

export async function acceptLatestTerms() {
  const terms = await getLatestTerms();
  await request("/api/terms/accept-terms", {
    method: "POST",
    body: JSON.stringify({ termsId: terms.termsId })
  });
  return terms;
}
