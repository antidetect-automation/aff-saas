(function () {
  function bind(header) {
    var btn = header.querySelector("[data-nav-toggle]");
    var nav = header.querySelector("[data-site-nav]") || header.querySelector("nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        header.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".site-header, header.top").forEach(bind);
})();
