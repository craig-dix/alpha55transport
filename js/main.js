// Alpha55 Transport — site interactions
(function () {
  "use strict";

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal sections on scroll
  const revealEls = document.querySelectorAll(".card, .fleet-item, .state-list li, .bolt-panel, .section-title");
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("reveal"); });
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Count-up animation for stats
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  // Quote form: no backend yet, so build a pre-filled email to Craig
  const form = document.getElementById("quote-form");
  const status = document.getElementById("form-status");
  const EMAIL_TO = "craig@alpha55transport.com";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "form-status";

    const data = new FormData(form);
    const required = ["name", "email"];
    let valid = true;
    required.forEach(function (name) {
      const input = form.elements[name];
      const ok = input.value.trim() !== "" && input.checkValidity();
      input.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      status.textContent = "Please enter your name and a valid email address.";
      status.classList.add("error");
      return;
    }

    const weight = data.get("weight");
    if (weight && Number(weight) > 7500) {
      status.textContent = "Heads up: our max capacity is 7,500 lbs — we'll follow up to discuss options.";
    }

    const lines = [
      "Name: " + data.get("name"),
      "Company: " + (data.get("company") || "-"),
      "Phone: " + (data.get("phone") || "-"),
      "Email: " + data.get("email"),
      "",
      "Pickup: " + (data.get("pickup") || "-"),
      "Delivery: " + (data.get("delivery") || "-"),
      "Hauling: " + data.get("type"),
      "Approx. weight: " + (weight ? weight + " lbs" : "-"),
      "",
      "Details:",
      data.get("details") || "-"
    ];
    const subject = "Quote Request - " + data.get("name");
    const href = "mailto:" + EMAIL_TO +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));

    window.location.href = href;
    if (!status.textContent) {
      status.textContent = "Opening your email app… If nothing happens, email us at " + EMAIL_TO + ".";
    }
  });
})();
