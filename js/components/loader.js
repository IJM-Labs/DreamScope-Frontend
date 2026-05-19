export function renderLoader(label = "Loading DreamScope") {
  return `
    <div class="loader" role="status">
      <span class="loader__moon" aria-hidden="true"></span>
      <span>${label}</span>
    </div>
  `;
}
