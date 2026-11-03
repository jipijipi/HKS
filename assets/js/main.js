document.addEventListener("DOMContentLoaded", () => {
  const browsers = document.querySelectorAll("[data-unit-browser]");
  const statLinks = document.querySelectorAll("[data-stat-link], [data-unit-link]");

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
    const previousUnit = browser.querySelector("[data-unit-previous]");
    const nextUnit = browser.querySelector("[data-unit-next]");
    const allChips = Array.from(unitChips);
    let activeIndex = 0;

    const categoryLabel = (id) => id === "residences" ? "Appartements" :
      browser.querySelector(`[data-unit-category="${id}"] .unit-browser__filter-label`).textContent.trim();
    const unitName = (chip) => chip.querySelector(".unit-chip__name").textContent.trim();
    const syncNavigation = (categoryId, unitId) => {
      const chips = allChips.filter(chip => chip.dataset.category === categoryId);
      activeIndex = allChips.findIndex(chip => chip.dataset.category === categoryId && chip.dataset.unit === unitId);
      const localIndex = chips.findIndex(chip => chip.dataset.unit === unitId);
      browser.querySelector("[data-unit-position]").textContent = `${categoryLabel(categoryId)} · ${localIndex + 1} sur ${chips.length}`;
      [previousUnit, nextUnit].forEach((button, direction) => {
        const chip = allChips[activeIndex + (direction ? 1 : -1)];
        button.disabled = !chip;
        if (!chip) {
          button.textContent = direction ? "Dernier espace" : "Premier espace";
          return;
        }
        const label = chip.dataset.category !== categoryId
          ? `Découvrir : ${categoryLabel(chip.dataset.category)}` : unitName(chip);
        button.textContent = direction ? `${label} →` : `← ${label}`;
      });
    };

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

      syncNavigation(categoryId, unitId);

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

    const revealUnit = (focus = false) => {
      requestAnimationFrame(() => {
        const card = browser.querySelector('[data-unit-card].is-active');
        if (!card) return;
        if (focus) card.focus({ preventScroll: true });
        card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      });
    };
    [previousUnit, nextUnit].forEach((button, direction) => {
      button.addEventListener("click", () => {
        const target = allChips[activeIndex + (direction ? 1 : -1)];
        if (!target) return;
        activateCategory(target.dataset.category, { unitId: target.dataset.unit });
        revealUnit(true);
      });
    });
    browser.querySelector("[data-unit-pagination]").hidden = false;

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
  let interiorTrigger;
  let previousOverflow = "";

  if (!gallery || !lightbox || !image || !caption || !triggers.length) return;

  const openLightbox = (src, alt) => {
    image.src = src;
    image.alt = alt || "Photo intérieure";
    caption.textContent = alt || "";
    lightbox.hidden = false;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".interior-lightbox__close").focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    image.src = "";
    image.alt = "";
    caption.textContent = "";
    document.body.style.overflow = previousOverflow;
    interiorTrigger?.focus({ preventScroll: true });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const src = trigger.dataset.fullSrc || trigger.getAttribute("href");
      const alt = trigger.dataset.alt || "";
      if (!src) return;
      interiorTrigger = trigger;
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
      // URL keeps playback options before the time fragment (e.g. #t=22s).
      const url = new URL(`https://player.vimeo.com/video/${item.video}`);
      Object.entries({ title: 0, byline: 0, portrait: 0, badge: 0, dnt: 1,
        controls: 1, playsinline: 1, autoplay: 1 }).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      if (/^#t=\d+$/.test(url.hash)) url.hash += "s";
      frame.src = url.href;
      frame.title = `Vidéo — ${activeGallery.dataset.title}`;
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      stage.append(frame);
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
    if (video) items.unshift({ video: video.dataset.galleryVideo, caption: "Visite en vidéo" });
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
    const hasVideo = Boolean(gallery.querySelector("[data-gallery-video]"));
    const hero = gallery.querySelector("[data-gallery-open]");
    const photos = Array.from(gallery.querySelectorAll("[data-gallery-photo]"));
    photos.forEach((button, photoIndex) => {
      button.addEventListener("click", () => {
        selectedIndex = photoIndex + (hasVideo ? 1 : 0);
        hero.setAttribute("aria-label", `Agrandir les visuels de ${gallery.dataset.title}`);
        const play = gallery.querySelector("[data-gallery-play]");
        if (play) play.hidden = true;
        const action = gallery.querySelector("[data-gallery-action]");
        action.textContent = "Agrandir ↗";
        action.hidden = false;
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
    hero.addEventListener("click", () => open(gallery, selectedIndex, hero));
    gallery.querySelectorAll("[data-gallery-video]").forEach(video => {
      video.addEventListener("click", () => open(gallery, 0, video));
    });
  });
});

// The facade stays visible until real playback begins; no video request for reduced motion.
document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector("[data-hero-video]");
  const control = document.querySelector("[data-hero-motion]");
  if (!video || !control) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  let userPaused = false;
  let visible = true;
  let ready = document.readyState === "complete";
  let failed = false;
  video.muted = true;

  const updateControl = () => {
    control.textContent = video.paused ? "Lire l’animation ▶" : "Pause Ⅱ";
    control.setAttribute("aria-label", video.paused ? "Lire l’animation" : "Mettre l’animation en pause");
  };
  const start = () => {
    if (!ready || failed || reducedMotion.matches || saveData || userPaused || !visible || document.hidden) return;
    if (!video.hasAttribute("src")) video.src = video.dataset.src;
    control.hidden = false;
    video.play().catch(() => {
      video.classList.remove("is-playing");
      updateControl();
    });
  };
  video.addEventListener("playing", () => {
    video.classList.add("is-playing");
    updateControl();
  });
  video.addEventListener("pause", updateControl);
  video.addEventListener("error", () => {
    failed = true;
    video.classList.remove("is-playing");
    control.hidden = true;
  });
  control.addEventListener("click", () => {
    if (video.paused) {
      userPaused = false;
      start();
    } else {
      userPaused = true;
      video.pause();
    }
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start(); else video.pause();
  });
  observer.observe(video.closest(".hero"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause(); else start();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      video.pause();
      video.classList.remove("is-playing");
      control.hidden = true;
    } else start();
  });
  if (ready) start();
  else window.addEventListener("load", () => { ready = true; start(); }, { once: true });
});

// Keep the unit context visible in the enquiry and preserve any message already drafted.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-web3forms]");
  if (!form) return;
  const context = form.querySelector("[data-contact-unit]");
  const unit = form.elements.namedItem("bien");
  const message = form.elements.namedItem("message");
  const subject = form.elements.namedItem("subject");
  const defaultSubject = subject.value;
  let suggestedMessage = "";
  const clear = () => {
    context.hidden = true;
    unit.value = "";
    subject.value = defaultSubject;
    if (message.value === suggestedMessage) message.value = "";
    suggestedMessage = "";
  };
  document.querySelectorAll("[data-unit-visit]").forEach(link => {
    link.addEventListener("click", () => {
      const name = link.dataset.unitVisit;
      unit.value = name;
      context.hidden = false;
      subject.value = `Demande de visite — ${name} — Résidence LE 25`;
      const nextMessage = `Bonjour, je souhaite organiser une visite pour le bien suivant : ${name}. Merci de me contacter pour convenir d’un rendez-vous.`;
      if (!message.value.trim() || message.value === suggestedMessage) {
        message.value = nextMessage;
        suggestedMessage = nextMessage;
      }
      requestAnimationFrame(() => form.elements.namedItem("name").focus({ preventScroll: true }));
    });
  });
  form.querySelector("[data-clear-unit]").addEventListener("click", clear);
  form.addEventListener("reset", () => { context.hidden = true; suggestedMessage = ""; });
});
