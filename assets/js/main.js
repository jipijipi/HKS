document.addEventListener("DOMContentLoaded", () => {
  const browsers = document.querySelectorAll("[data-unit-browser]");

  if (!browsers.length) return;

  const decodeHashState = () => {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    if (!raw) return null;
    const [categoryId, unitId] = raw.split("/");
    if (!categoryId) return null;
    return {
      categoryId,
      unitId: unitId || null
    };
  };

  const encodeHash = (categoryId, unitId) => {
    if (!categoryId) return "";
    const cat = encodeURIComponent(categoryId);
    if (!unitId) return `#${cat}`;
    const unit = encodeURIComponent(unitId);
    return `#${cat}/${unit}`;
  };

  const scrollToPlans = () => {
    const target = document.querySelector("#plans");
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  browsers.forEach((browser) => {
    const categoryButtons = browser.querySelectorAll("[data-unit-category]");
    const panels = browser.querySelectorAll("[data-unit-panel]");
    const unitChips = browser.querySelectorAll("[data-unit-chip]");
    const unitCards = browser.querySelectorAll("[data-unit-card]");

    const setHash = (categoryId, unitId) => {
      const newHash = encodeHash(categoryId, unitId);
      if (!newHash || window.location.hash === newHash) return;
      if (history.replaceState) {
        history.replaceState(null, "", newHash);
      } else {
        window.location.hash = newHash;
      }
    };

    const activateUnit = (categoryId, unitId, options = {}) => {
      const { updateHash = true } = options;
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

      if (updateHash && categoryId && unitId) {
        setHash(categoryId, unitId);
      }
    };

    const activateCategory = (categoryId, options = {}) => {
      const { unitId = null, updateHash = true } = options;
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

      let targetUnitId = unitId;

      if (targetUnitId) {
        const matchingChip = browser.querySelector(
          `[data-unit-chip][data-category="${categoryId}"][data-unit="${targetUnitId}"]`
        );
        if (!matchingChip) {
          targetUnitId = null;
        }
      }

      if (!targetUnitId) {
        const firstChip = browser.querySelector(`[data-unit-chip][data-category="${categoryId}"]`);
        targetUnitId = firstChip ? firstChip.dataset.unit : null;
      }

      if (targetUnitId) {
        activateUnit(categoryId, targetUnitId, { updateHash });
      } else {
        unitCards.forEach((card) => {
          const shouldDeactivate = card.dataset.category === categoryId;
          if (shouldDeactivate) {
            card.classList.remove("is-active");
            card.setAttribute("aria-hidden", "true");
            card.setAttribute("tabindex", "-1");
          }
        });
        if (updateHash && categoryId) {
          setHash(categoryId);
        }
      }
    };

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activateCategory(btn.dataset.unitCategory, { updateHash: true });
      });
    });

    unitChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const categoryId = chip.dataset.category;
        const unitId = chip.dataset.unit;
        const panel = browser.querySelector(`[data-unit-panel="${categoryId}"]`);
        if (panel && !panel.classList.contains("is-active")) {
          activateCategory(categoryId, { unitId, updateHash: true });
        } else {
          activateUnit(categoryId, unitId, { updateHash: true });
        }
      });
    });

    const syncFromHash = () => {
      const state = decodeHashState();
      if (!state) return;

      const { categoryId, unitId } = state;
      const matchingCategory = browser.querySelector(`[data-unit-category="${categoryId}"]`);
      if (!matchingCategory) return;

      activateCategory(categoryId, { unitId, updateHash: false });
      scrollToPlans();
    };

    window.addEventListener("hashchange", syncFromHash);

    const initialState = decodeHashState();
    if (initialState) {
      const { categoryId, unitId } = initialState;
      const matchingCategory = browser.querySelector(`[data-unit-category="${categoryId}"]`);
      if (matchingCategory) {
        activateCategory(categoryId, { unitId, updateHash: false });
        scrollToPlans();
        return;
      }
    }

    if (categoryButtons.length) {
      activateCategory(categoryButtons[0].dataset.unitCategory, { updateHash: false });
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
