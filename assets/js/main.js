document.addEventListener("DOMContentLoaded", () => {
  const browsers = document.querySelectorAll("[data-unit-browser]");
  const statLinks = document.querySelectorAll("[data-stat-link]");

  statLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetHash = link.getAttribute("href");
      if (!targetHash) return;
      event.preventDefault();
      if (window.location.hash === targetHash) {
        window.dispatchEvent(new Event("hashchange"));
        return;
      }
      window.location.hash = targetHash;
    });
  });

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

    // Match the existing tab semantics with keyboard navigation.
    browser.querySelectorAll('[role="tablist"]').forEach((list) => {
      list.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
        const current = tabs.indexOf(event.target);
        if (current < 0) return;
        event.preventDefault();
        let target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
          (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[target].click();
        tabs[target].focus();
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

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector("[data-interior-gallery]");
  const lightbox = document.querySelector("[data-interior-lightbox]");
  const image = document.querySelector("[data-interior-image]");
  const caption = document.querySelector("[data-interior-caption]");
  const triggers = document.querySelectorAll("[data-interior-trigger]");
  const closeButtons = document.querySelectorAll("[data-interior-close]");

  if (!gallery || !lightbox || !image || !caption || !triggers.length) return;

  const openLightbox = (src, alt) => {
    image.src = src;
    image.alt = alt || "Photo intérieure";
    caption.textContent = alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    image.src = "";
    image.alt = "";
    caption.textContent = "";
    document.body.style.overflow = "";
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const src = trigger.dataset.fullSrc || trigger.getAttribute("href");
      const alt = trigger.dataset.alt || "";
      if (!src) return;
      openLightbox(src, alt);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });
});

// Unit galleries share one native dialog: focus trapping and Escape are built in.
document.addEventListener("DOMContentLoaded", () => {
  const viewer = document.querySelector("[data-unit-viewer]");
  if (!viewer) return;
  const stage = viewer.querySelector("[data-viewer-stage]");
  const caption = viewer.querySelector("[data-viewer-caption]");
  const previous = viewer.querySelector("[data-viewer-prev]");
  const next = viewer.querySelector("[data-viewer-next]");
  let activeGallery;
  let items = [];
  let index = 0;
  let returnFocus;
  let savedOverflow = "";
  let touchX;

  const render = () => {
    stage.replaceChildren(); // Removing an iframe also stops playback.
    const item = items[index];
    if (item.video) {
      const frame = document.createElement("iframe");
      frame.src = `https://player.vimeo.com/video/${item.video}?title=0&byline=0&portrait=0&badge=0&dnt=1&controls=1&playsinline=1`;
      frame.title = `Vidéo — ${activeGallery.dataset.title}`;
      frame.allow = "fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      stage.append(frame);
      const fallback = document.createElement("a");
      fallback.href = `https://vimeo.com/${item.video}`;
      fallback.target = "_blank";
      fallback.rel = "noopener";
      fallback.textContent = "Ouvrir la vidéo sur Vimeo ↗";
      fallback.className = "unit-viewer__fallback";
      stage.append(fallback);
    } else {
      const image = document.createElement("img");
      image.src = item.full;
      image.alt = `${item.caption} — rendu d’illustration`;
      stage.append(image);
    }
    caption.textContent = `${item.caption} · ${index + 1} / ${items.length}`;
    previous.disabled = next.disabled = items.length < 2;
  };
  const move = (direction) => {
    index = (index + direction + items.length) % items.length;
    render();
  };
  const open = (gallery, selectedIndex, trigger) => {
    activeGallery = gallery;
    items = Array.from(gallery.querySelectorAll("[data-gallery-photo]"), button => ({ ...button.dataset }));
    const video = gallery.querySelector("[data-gallery-video]");
    if (video) items.push({ video: video.dataset.galleryVideo, caption: "Visite en vidéo" });
    index = selectedIndex;
    returnFocus = trigger;
    viewer.querySelector("#unit-viewer-title").textContent = gallery.dataset.title;
    viewer.querySelectorAll("details").forEach(detail => { detail.open = false; });
    render();
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    viewer.showModal();
  };
  viewer.querySelector("[data-viewer-close]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    stage.replaceChildren();
    document.body.style.overflow = savedOverflow;
    returnFocus?.focus();
  });
  viewer.addEventListener("click", event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  viewer.addEventListener("keydown", event => {
    if (event.target.tagName === "SUMMARY") return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  stage.addEventListener("touchstart", event => { touchX = event.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", event => {
    if (touchX == null || items[index].video) return;
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 60) move(delta > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll("img[data-src]").forEach(image => {
        image.src = image.dataset.src;
        delete image.dataset.src;
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "200px" });
  document.querySelectorAll("[data-unit-gallery]").forEach(gallery => {
    observer.observe(gallery);
    let selectedIndex = 0;
    const photos = Array.from(gallery.querySelectorAll("[data-gallery-photo]"));
    photos.forEach((button, photoIndex) => {
      button.addEventListener("click", () => {
        selectedIndex = photoIndex;
        const cover = gallery.querySelector("[data-gallery-cover]");
        cover.src = button.dataset.medium;
        cover.removeAttribute("data-src");
        cover.alt = `${button.dataset.caption} — rendu d’illustration`;
        gallery.querySelector("[data-gallery-caption]").textContent = button.dataset.caption;
        photos.forEach(photo => {
          const selected = photo === button;
          photo.classList.toggle("is-active", selected);
          photo.setAttribute("aria-pressed", String(selected));
        });
      });
    });
    const hero = gallery.querySelector("[data-gallery-open]");
    hero.addEventListener("click", () => open(gallery, selectedIndex, hero));
    gallery.querySelectorAll("[data-gallery-video]").forEach(video => {
      video.addEventListener("click", () => open(gallery, photos.length, video));
    });
  });
});
