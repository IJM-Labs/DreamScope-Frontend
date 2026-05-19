import { qs } from "../utils/helpers.js";

export function openModal({ title, body, actions = "", showClose = true, closeOnBackdrop = true }) {
  const root = qs("#modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        ${showClose ? '<button class="modal__close" type="button" aria-label="Close">×</button>' : ""}
        <h2 id="modal-title">${title}</h2>
        <div class="modal__body">${body}</div>
        ${actions ? `<div class="modal__actions">${actions}</div>` : ""}
      </section>
    </div>
  `;

  qs(".modal__close", root)?.addEventListener("click", closeModal);
  qs(".modal-backdrop", root).addEventListener("click", (event) => {
    if (closeOnBackdrop && event.target.classList.contains("modal-backdrop")) {
      closeModal();
    }
  });
}

export function closeModal() {
  qs("#modal-root").innerHTML = "";
}
