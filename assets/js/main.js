document.addEventListener("DOMContentLoaded", () => {
  const browsers = document.querySelectorAll("[data-unit-browser]");

  if (!browsers.length) return;

  browsers.forEach((browser) => {
    const categoryButtons = browser.querySelectorAll("[data-unit-category]");
    const panels = browser.querySelectorAll("[data-unit-panel]");
    const unitChips = browser.querySelectorAll("[data-unit-chip]");
    const unitCards = browser.querySelectorAll("[data-unit-card]");

    const activateUnit = (categoryId, unitId) => {
      const chips = browser.querySelectorAll(`[data-unit-chip][data-category="${categoryId}"]`);
      chips.forEach((chip) => {
        const isActive = chip.dataset.unit === unitId;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-selected", isActive ? "true" : "false");
        chip.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      unitCards.forEach((card) => {
        const isActive = card.dataset.category === categoryId && card.dataset.unit === unitId;
        card.classList.toggle("is-active", isActive);
        card.setAttribute("aria-hidden", isActive ? "false" : "true");
        card.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    };

    const activateCategory = (categoryId) => {
      categoryButtons.forEach((btn) => {
        const isActive = btn.dataset.unitCategory === categoryId;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.unitPanel === categoryId;
        panel.classList.toggle("is-active", isActive);
      });

      const firstChip = browser.querySelector(`[data-unit-chip][data-category="${categoryId}"]`);
      if (firstChip) {
        activateUnit(categoryId, firstChip.dataset.unit);
      } else {
        unitCards.forEach((card) => card.classList.remove("is-active"));
      }
    };

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activateCategory(btn.dataset.unitCategory);
      });
    });

    unitChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const categoryId = chip.dataset.category;
        const unitId = chip.dataset.unit;
        const panel = browser.querySelector(`[data-unit-panel="${categoryId}"]`);
        if (panel && !panel.classList.contains("is-active")) {
          activateCategory(categoryId);
        } else {
          activateUnit(categoryId, unitId);
        }
      });
    });

    if (categoryButtons.length) {
      activateCategory(categoryButtons[0].dataset.unitCategory);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("[data-web3forms]");

  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const statusEl = form.querySelector("[data-form-status]");
      const submitBtn = form.querySelector("button[type='submit']");

      if (statusEl) {
        statusEl.textContent = "Envoi en cours…";
        statusEl.classList.remove("is-success", "is-error");
      }

      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: "POST",
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          if (statusEl) {
            statusEl.textContent = "Merci, votre message a bien été envoyé. Nous revenons vers vous rapidement.";
            statusEl.classList.add("is-success");
          }
          form.reset();
        } else {
          throw new Error(result.message || "Une erreur est survenue.");
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = "Impossible d’envoyer le message pour le moment. Merci de réessayer ou d’écrire directement à sicorep.imo@gmail.com.";
          statusEl.classList.add("is-error");
        }
        console.error("Web3Forms error:", error);
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
});
