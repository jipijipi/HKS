document.addEventListener("DOMContentLoaded", () => {
  const filters = document.querySelectorAll("[data-unit-filter]");
  const panels = document.querySelectorAll("[data-unit-panel]");

  if (!filters.length) return;

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const id = filter.getAttribute("data-unit-filter");

      filters.forEach((btn) => {
        const active = btn === filter;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
        btn.setAttribute("tabindex", active ? "0" : "-1");
      });

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.getAttribute("data-unit-panel") === id);
      });
    });
  });
});
