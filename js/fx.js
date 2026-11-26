// Alpha55 Transport — flames, embers & pyrotechnics
// Exposes window.A55FX = { burst(x, y, opts), rocket(x0, y0, x1, y1), mount(parentEl) }.
// Everything is skipped for visitors who prefer reduced motion.
(function () {
  "use strict";

  const noop = function () {};
  window.A55FX = { burst: noop, rocket: noop, mount: noop };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rand = function (a, b) { return a + Math.random() * (b - a); };
  const pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };

  // Pre-rendered soft glow sprites, hottest (white-yellow) to coolest (dark red)
  function makeSprite(r, g, b) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",1)");
    gr.addColorStop(0.35, "rgba(" + r + "," + g + "," + b + ",0.55)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return c;
  }
  const FIRE = [
    [255, 248, 220], [255, 214, 110], [255, 150, 40],
    [240, 80, 20], [215, 25, 32], [120, 10, 10]
  ].map(function (c) { return makeSprite(c[0], c[1], c[2]); });

  /* ================= Hero flames + embers ================= */
  const hero = document.querySelector(".hero");
  if (hero) {
    const cv = document.createElement("canvas");
    cv.className = "hero-fire";
    cv.setAttribute("aria-hidden", "true");
    hero.prepend(cv);
    const ctx = cv.getContext("2d");

    let W = 0, H = 0, t = 0, last = 0, running = false, visible = true;
    let spawnAcc = 0;
    const flames = [];
    const embers = [];

    function newEmber(anyHeight) {
      return {
        x: rand(0, W),
        y: anyHeight ? rand(0, H) : H + rand(0, 40),
        vy: -rand(25, 75),
        size: rand(3, 7),
        phase: rand(0, 6.28),
        sway: rand(10, 35)
      };
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      W = cv.width = Math.max(1, Math.round(r.width));
      H = cv.height = Math.max(1, Math.round(r.height));
      const want = Math.round(W / 20);
      embers.length = 0;
      for (let i = 0; i < want; i++) embers.push(newEmber(true));
    }

    function spawnFlame() {
      // Bias spawns toward drifting "tongues" so the fire has shape
      let x = 0;
      for (let tries = 0; tries < 4; tries++) {
        x = Math.random() * W;
        const d = 0.5 + 0.5 * Math.sin(x * 0.011 + t * 1.6) * Math.sin(x * 0.0047 - t * 0.8);
        if (Math.random() < 0.2 + 0.8 * d) break;
      }
      flames.push({
        x: x, y: H + 10,
        vx: rand(-12, 12),
        vy: -rand(80, 210),
        size: rand(14, 30),
        life: 0, max: rand(0.45, 1.05),
        seed: rand(0, 6.28)
      });
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Flames
      spawnAcc += W * 1.5 * dt;
      while (spawnAcc >= 1 && flames.length < 2600) { spawnFlame(); spawnAcc -= 1; }
      for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i];
        f.life += dt;
        const k = f.life / f.max;
        if (k >= 1) { flames[i] = flames[flames.length - 1]; flames.pop(); continue; }
        f.x += (f.vx + Math.sin(t * 5 + f.seed + f.y * 0.03) * 28) * dt;
        f.y += f.vy * dt;
        const s = f.size * (1 - k * 0.65);
        const sprite = FIRE[Math.min(FIRE.length - 1, (k * FIRE.length) | 0)];
        ctx.globalAlpha = (k < 0.12 ? k / 0.12 : 1 - k) * 0.85;
        ctx.drawImage(sprite, f.x - s, f.y - s, s * 2, s * 2);
      }

      // Embers
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y += e.vy * dt;
        e.phase += dt * 2;
        const x = e.x + Math.sin(e.phase) * e.sway;
        if (e.y < -20) { embers[i] = newEmber(false); continue; }
        const fade = Math.min(1, e.y / (H * 0.6));
        ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(e.phase * 3.3));
        ctx.drawImage(FIRE[1], x - e.size, e.y - e.size, e.size * 2, e.size * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(frame);
    }

    function setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); requestAnimationFrame(frame); }
    }

    resize();
    window.addEventListener("resize", resize);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        setRunning(visible && !document.hidden);
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      setRunning(visible && !document.hidden);
    });
    setRunning(true);
  }

  /* ================= Pyrotechnics overlay ================= */
  const fx = document.createElement("canvas");
  fx.className = "fx-layer";
  fx.setAttribute("aria-hidden", "true");
  document.body.appendChild(fx);
  const fctx = fx.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let VW = 0, VH = 0;

  function fxResize() {
    VW = window.innerWidth; VH = window.innerHeight;
    fx.width = Math.round(VW * dpr);
    fx.height = Math.round(VH * dpr);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fxResize();
  window.addEventListener("resize", fxResize);

  const PALETTES = {
    fire: ["#ffffff", "#ffe6a3", "#ffb347", "#ff7a1a", "#d71920"],
    chrome: ["#ffffff", "#eef0f2", "#c4c7cc", "#ffd9a0", "#d71920"]
  };
  const sparks = [];
  const rockets = [];
  const flashes = [];
  let fxRunning = false, fxLast = 0;

  function burst(x, y, opts) {
    const o = opts || {};
    const n = o.count || 70;
    const pal = PALETTES[o.palette || "fire"];
    const power = o.power || 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(110, 400) * power;
      sparks.push({
        x: x, y: y, px: x, py: y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50 * power,
        life: 0, max: rand(0.55, 1.25),
        color: pick(pal), w: rand(1, 2.6),
        g: o.gravity != null ? o.gravity : 480,
        crackle: Math.random() < 0.25
      });
    }
    flashes.push({ x: x, y: y, r: 46 * power, life: 0, max: 0.28 });
    startFx();
  }

  function rocket(x0, y0, x1, y1, opts) {
    rockets.push({ x0: x0, y0: y0, x1: x1, y1: y1, x: x0, y: y0, t: 0, dur: rand(0.6, 0.85), opts: opts || {} });
    startFx();
  }

  function startFx() {
    if (fxRunning) return;
    fxRunning = true;
    fxLast = performance.now();
    requestAnimationFrame(fxFrame);
  }

  function fxFrame(now) {
    const dt = Math.min((now - fxLast) / 1000, 0.05);
    fxLast = now;
    fctx.clearRect(0, 0, VW, VH);
    fctx.globalCompositeOperation = "lighter";
    fctx.lineCap = "round";

    // Rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.t += dt;
      const k = Math.min(r.t / r.dur, 1);
      const e = 1 - (1 - k) * (1 - k);
      r.x = r.x0 + (r.x1 - r.x0) * e;
      r.y = r.y0 + (r.y1 - r.y0) * e;
      for (let j = 0; j < 3; j++) {
        sparks.push({
          x: r.x, y: r.y, px: r.x, py: r.y,
          vx: rand(-40, 40), vy: rand(40, 120),
          life: 0, max: rand(0.2, 0.45),
          color: pick(["#ffe6a3", "#ffb347", "#ff7a1a"]), w: rand(1, 2), g: 200, crackle: false
        });
      }
      fctx.globalAlpha = 1;
      fctx.drawImage(FIRE[0], r.x - 10, r.y - 10, 20, 20);
      if (k >= 1) {
        rockets.splice(i, 1);
        burst(r.x, r.y, { count: r.opts.count || 120, power: r.opts.power || 1.35, palette: r.opts.palette });
      }
    }

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      const k = s.life / s.max;
      if (k >= 1) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
      s.px = s.x; s.py = s.y;
      const drag = 1 - 2.4 * dt;
      s.vx *= drag; s.vy = s.vy * drag + s.g * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      let a = 1 - k;
      if (s.crackle && k > 0.5) a *= Math.random() < 0.5 ? 0.15 : 1;
      fctx.globalAlpha = a;
      fctx.strokeStyle = s.color;
      fctx.lineWidth = s.w;
      fctx.beginPath();
      fctx.moveTo(s.px, s.py);
      fctx.lineTo(s.x, s.y);
      fctx.stroke();
      fctx.globalAlpha = a * 0.45;
      fctx.drawImage(FIRE[2], s.x - 5, s.y - 5, 10, 10);
    }

    // Flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life += dt;
      const k = f.life / f.max;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      const r = f.r * (1 + k);
      fctx.globalAlpha = (1 - k) * 0.85;
      fctx.drawImage(FIRE[0], f.x - r, f.y - r, r * 2, r * 2);
    }

    fctx.globalAlpha = 1;
    fctx.globalCompositeOperation = "source-over";

    if (sparks.length || rockets.length || flashes.length) {
      requestAnimationFrame(fxFrame);
    } else {
      fctx.clearRect(0, 0, VW, VH);
      fxRunning = false;
    }
  }

  // Lets the popup host the overlay so sparks draw above it (dialogs sit in the top layer)
  function mount(parent) {
    (parent || document.body).appendChild(fx);
  }

  window.A55FX = { burst: burst, rocket: rocket, mount: mount };

  /* ================= Triggers ================= */

  // Sparks from every button click
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { // keyboard activation: use the button's centre
      const r = btn.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    burst(x, y, { count: 55, power: 0.85 });
  });

  // Opening fireworks over the hero
  window.addEventListener("load", function () {
    if (!hero || window.scrollY > 120) return;
    const r = hero.getBoundingClientRect();
    const fromY = Math.min(r.bottom, VH);
    [[0.18, 0.28, 350], [0.82, 0.24, 800], [0.5, 0.14, 1250]].forEach(function (s) {
      setTimeout(function () {
        const x = r.left + r.width * s[0];
        rocket(x + rand(-30, 30), fromY, x, r.top + r.height * s[1]);
      }, s[2]);
    });
  });

  // Electric sparks off the lightning bolt while it's on screen
  const bolt = document.querySelector(".bolt");
  if (bolt && "IntersectionObserver" in window) {
    let timer = null;
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!timer) timer = setInterval(function () {
          if (document.hidden) return;
          const r = bolt.getBoundingClientRect();
          burst(r.left + r.width * rand(0.3, 0.7), r.top + r.height * rand(0.2, 0.8),
            { count: 26, power: 0.6, palette: "chrome", gravity: 300 });
        }, 2200);
      } else if (timer) {
        clearInterval(timer); timer = null;
      }
    }, { threshold: 0.4 }).observe(bolt);
  }
})();
