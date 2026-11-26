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
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        const r = el.getBoundingClientRect();
        window.A55FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 40, power: 0.7 });
      }
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

  const form = document.getElementById("quote-form");

  // Service detail popups
  const modal = document.getElementById("svc-modal");
  const modalTitle = document.getElementById("svc-modal-title");
  const modalIcon = document.getElementById("svc-modal-icon");
  const modalBody = document.getElementById("svc-modal-body");
  const modalQuote = document.getElementById("svc-modal-quote");

  function openService(card, e) {
    modalTitle.textContent = card.querySelector(".card-link").textContent;
    modalIcon.innerHTML = card.querySelector(".card-icon").innerHTML;
    modalBody.innerHTML = card.querySelector(".card-details").innerHTML;
    modalQuote.dataset.quote = card.dataset.quote || "";

    if (!modal.open) {
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "");
    }
    modal.scrollTop = 0;
    window.A55FX.mount(modal);
    let x = e.clientX, y = e.clientY;
    if (!x && !y) {
      const r = card.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    window.A55FX.burst(x, y, { count: 70, power: 1 });
  }

  function closeService() {
    if (typeof modal.close === "function") modal.close();
    else { modal.removeAttribute("open"); window.A55FX.mount(document.body); }
  }

  document.querySelectorAll(".card .card-link").forEach(function (btn) {
    btn.addEventListener("click", function (e) { openService(btn.closest(".card"), e); });
  });
  modal.addEventListener("close", function () { window.A55FX.mount(document.body); });
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest("[data-close]")) closeService();
  });
  modalQuote.addEventListener("click", function (e) {
    e.preventDefault();
    const type = modalQuote.dataset.quote;
    if (type) form.elements.type.value = type;
    closeService();
    document.getElementById("contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    form.elements.name.focus({ preventScroll: true });
  });

  // Quote form: no backend yet, so build a pre-filled email to Craig
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
