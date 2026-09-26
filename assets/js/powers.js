(() => {
  "use strict";

  if (window.__XIRAIYA_POWERS_LOADED__) return;
  window.__XIRAIYA_POWERS_LOADED__ = true;

  const root = document.documentElement;
  const body = document.body;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const state = {
    open: false,
    busy: false,
    wind: false,
    ssj: false
  };

  function make(tag, className, parent = body) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    parent.appendChild(node);
    return node;
  }

  function later(ms, fn) {
    return window.setTimeout(fn, reducedMotion ? 0 : ms);
  }

  /* =========================================================
     EFFECT LAYERS
     ========================================================= */

  const canvas = make("canvas", "pw-canvas");
  const ctx = canvas.getContext("2d");

  const dim = make("div", "pw-dim");
  const flash = make("div", "pw-flash");
  const aura = make("div", "pw-aura");
  const shadow = make("div", "pw-shadow");
  const bars = make("div", "pw-bars");

  const system = make("div", "pw-sys");

  system.innerHTML = `
    <div class="pw-sys-h">
      <i>!</i>
      <b>SYSTEM</b>
    </div>

    <p>
      <em>Power sequence activated.</em><br>
      Synchronizing energy...
    </p>

    <div class="pw-sys-bar">
      <span></span>
    </div>

    <div class="pw-sys-n">
      0%
    </div>
  `;

  const seal = make("div", "pw-seal");

  seal.innerHTML = `
    <svg viewBox="0 0 500 500" aria-hidden="true">
      <circle
        cx="250"
        cy="250"
        r="190"
        fill="none"
        stroke="#9a6bff"
        stroke-width="3"
      />

      <circle
        cx="250"
        cy="250"
        r="145"
        fill="none"
        stroke="#5fd0ff"
        stroke-width="2"
        stroke-dasharray="12 8"
      />

      <polygon
        points="
          250,80
          290,195
          410,195
          312,265
          350,380
          250,310
          150,380
          188,265
          90,195
          210,195
        "
        fill="none"
        stroke="#b99cff"
        stroke-width="3"
      />

      <circle
        cx="250"
        cy="250"
        r="42"
        fill="none"
        stroke="#ffffff"
        stroke-width="2"
      />
    </svg>
  `;

  const title = make("div", "pw-title");

  title.innerHTML = `
    <div class="pw-title-k">影</div>

    <small>起きろ</small>

    <b>ARISE</b>

    <i></i>

    <span>
      SHADOW <em>MONARCH</em>
    </span>
  `;

  /* =========================================================
     CANVAS
     ========================================================= */

  let DPR = 1;
  let W = 0;
  let H = 0;

  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);

  function clearCanvas() {
    ctx.clearRect(0, 0, W, H);
  }

  function animate(ms, draw, done) {
    const start = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - start) / ms);

      clearCanvas();

      draw(progress, now);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        clearCanvas();

        if (done) done();
      }
    }

    requestAnimationFrame(frame);
  }

  /* =========================================================
     FLASH
     ========================================================= */

  function screenFlash(color = "#fff", strength = 0.9) {
    flash.style.background = color;
    flash.style.opacity = String(strength);

    later(60, () => {
      flash.style.transition = "opacity .35s";
      flash.style.opacity = "0";
    });
  }

  /* =========================================================
     LIGHTNING
     ========================================================= */

  function drawBolt(x1, y1, x2, y2, width, color) {
    const segments = 18;

    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const x =
        x1 +
        dx * i +
        (Math.random() - 0.5) * 28;

      const y =
        y1 +
        dy * i +
        (Math.random() - 0.5) * 28;

      ctx.lineTo(x, y);
    }

    ctx.lineTo(x2, y2);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  /* =========================================================
     CHIDORI
     ========================================================= */

  function chidori() {
    if (state.busy) return;

    state.busy = true;

    dim.classList.add("on");

    const cx = W * 0.5;
    const cy = H * 0.55;

    screenFlash("#dff6ff", 0.8);

    animate(
      reducedMotion ? 150 : 1450,

      (p, now) => {
        const pulse =
          0.75 +
          Math.sin(now / 50) * 0.25;

        const radius =
          30 +
          p * Math.min(W, H) * 0.13;

        ctx.save();

        ctx.globalCompositeOperation = "lighter";

        const glow = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          radius
        );

        glow.addColorStop(
          0,
          `rgba(255,255,255,${0.95 * pulse})`
        );

        glow.addColorStop(
          0.25,
          `rgba(110,210,255,${0.8 * pulse})`
        );

        glow.addColorStop(
          1,
          "rgba(40,120,255,0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 13; i++) {
          const angle =
            Math.random() * Math.PI * 2;

          const len =
            radius *
            (1.2 + Math.random() * 2.3);

          const tx =
            cx + Math.cos(angle) * len;

          const ty =
            cy + Math.sin(angle) * len;

          drawBolt(
            cx,
            cy,
            tx,
            ty,
            1 + Math.random() * 3,
            Math.random() > 0.5
              ? "#bdeeff"
              : "#459cff"
          );
        }

        ctx.restore();
      },

      () => {
        dim.classList.remove("on");
        state.busy = false;
      }
    );
  }

  /* =========================================================
     KAMEHAMEHA
     ========================================================= */

  function kamehameha() {
    if (state.busy) return;

    state.busy = true;

    dim.classList.add("on", "kame");

    const startX = W * 0.12;
    const y = H * 0.55;

    screenFlash("#c8e9ff", 0.65);

    animate(
      reducedMotion ? 150 : 1700,

      (p, now) => {
        const endX =
          startX +
          W * 0.82 * Math.min(1, p * 1.8);

        const beamWidth =
          18 +
          Math.sin(now / 45) * 5 +
          p * 26;

        ctx.save();

        ctx.globalCompositeOperation = "lighter";

        ctx.strokeStyle =
          "rgba(70,150,255,.35)";

        ctx.lineWidth = beamWidth * 2.2;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        ctx.strokeStyle = "#64baff";
        ctx.lineWidth = beamWidth;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = beamWidth * 0.34;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
          endX,
          y,
          beamWidth * 1.1,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(185,225,255,.8)";

        ctx.fill();

        ctx.restore();
      },

      () => {
        dim.classList.remove("on", "kame");
        state.busy = false;
      }
    );
  }

  /* =========================================================
     WIND
     ========================================================= */

  function toggleWind(button) {
    state.wind = !state.wind;

    root.classList.toggle(
      "pw-windy",
      state.wind
    );

    button.setAttribute(
      "aria-pressed",
      String(state.wind)
    );
  }

  /* =========================================================
     SUPER SAIYAN
     ========================================================= */

  function toggleSaiyan(button) {
    state.ssj = !state.ssj;

    root.classList.toggle(
      "pw-ssj",
      state.ssj
    );

    aura.classList.toggle(
      "on",
      state.ssj
    );

    dim.classList.toggle(
      "ssj",
      state.ssj
    );

    button.setAttribute(
      "aria-pressed",
      String(state.ssj)
    );

    if (state.ssj) {
      screenFlash("#fff1a8", 0.55);
    }
  }

  /* =========================================================
     SYSTEM WINDOW
     ========================================================= */

  function systemProgress() {
    const bar =
      system.querySelector(
        ".pw-sys-bar span"
      );

    const number =
      system.querySelector(
        ".pw-sys-n"
      );

    let start = 0;

    function update(now) {
      if (!start) start = now;

      const p = Math.min(
        1,
        (now - start) / 1200
      );

      const value =
        Math.round(p * 100);

      bar.style.width =
        value + "%";

      number.textContent =
        value + "%";

      if (p < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* =========================================================
     ARISE
     ========================================================= */

  function arise() {
    if (state.busy) return;

    state.busy = true;

    shadow.classList.add("on");
    bars.classList.add("on");
    seal.classList.add("on");
    system.classList.add("on");

    systemProgress();

    root.classList.add(
      "pw-neg",
      "pw-neg-violet"
    );

    screenFlash("#cbb8ff", 0.45);

    later(450, () => {
      root.classList.remove(
        "pw-neg",
        "pw-neg-violet"
      );
    });

    later(650, () => {
      title.classList.add("on");
    });

    animate(
      reducedMotion ? 200 : 2400,

      (p, now) => {
        ctx.save();

        ctx.globalCompositeOperation =
          "lighter";

        const baseY =
          H * 0.92;

        for (let i = 0; i < 34; i++) {
          const phase =
            i * 0.47;

          const x =
            W *
            (0.05 +
              ((i * 0.071) % 0.9));

          const height =
            20 +
            150 *
              Math.max(
                0,
                Math.sin(
                  p * Math.PI -
                    phase * 0.08
                )
              );

          const wobble =
            Math.sin(
              now / 180 + i
            ) * 5;

          ctx.strokeStyle =
            `rgba(145,90,255,${
              0.18 +
              p * 0.45
            })`;

          ctx.lineWidth =
            2 + (i % 3);

          ctx.beginPath();

          ctx.moveTo(
            x,
            baseY
          );

          ctx.lineTo(
            x + wobble,
            baseY - height
          );

          ctx.stroke();
        }

        const gradient =
          ctx.createRadialGradient(
            W / 2,
            H * 0.88,
            0,
            W / 2,
            H * 0.88,
            Math.min(W, H) * 0.45
          );

        gradient.addColorStop(
          0,
          `rgba(130,60,255,${
            0.35 * p
          })`
        );

        gradient.addColorStop(
          1,
          "rgba(80,20,180,0)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
          0,
          0,
          W,
          H
        );

        ctx.restore();
      },

      () => {}
    );

    later(3000, () => {
      system.classList.remove("on");
    });

    later(3600, () => {
      title.classList.remove("on");
      bars.classList.remove("on");
      seal.classList.remove("on");

      shadow.classList.add("thin");
    });

    later(4300, () => {
      shadow.classList.remove(
        "on",
        "thin"
      );

      clearCanvas();
      state.busy = false;
    });
  }

  /* =========================================================
     POWER DOCK
     ========================================================= */

  const dock = make("aside", "pw-dock");

  dock.setAttribute(
    "aria-label",
    "Anime powers"
  );

  const toggle =
    document.createElement("button");

  toggle.type = "button";
  toggle.className = "pw-toggle";

  toggle.setAttribute(
    "aria-label",
    "Open powers"
  );

  toggle.setAttribute(
    "aria-expanded",
    "false"
  );

  toggle.innerHTML =
    "<span>⚡</span>";

  dock.appendChild(toggle);

  const list =
    document.createElement("div");

  list.className = "pw-list";

  dock.appendChild(list);

  const powers = [
    {
      id: "chidori",
      icon: "雷",
      title: "Chidori",
      sub: "Lightning Blade",
      color: "#59c8ff"
    },

    {
      id: "wind",
      icon: "風",
      title: "Wind",
      sub: "Gale Mode",
      color: "#7fe7cf"
    },

    {
      id: "kame",
      icon: "波",
      title: "Kamehameha",
      sub: "Energy Wave",
      color: "#4ba4ff"
    },

    {
      id: "ssj",
      icon: "超",
      title: "Super Saiyan",
      sub: "Golden Aura",
      color: "#ffd35a"
    },

    {
      id: "arise",
      icon: "影",
      title: "Arise",
      sub: "Shadow Monarch",
      color: "#9a6bff"
    }
  ];

  const buttons = {};

  powers.forEach((power, index) => {
    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "pw-item";

    button.style.setProperty(
      "--pw-c",
      power.color
    );

    button.style.setProperty(
      "--i",
      index
    );

    button.dataset.power =
      power.id;

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    button.innerHTML = `
      <b>${power.icon}</b>

      <span>
        ${power.title}

        <small>
          ${power.sub}
        </small>
      </span>
    `;

    list.appendChild(button);

    buttons[power.id] =
      button;
  });

  toggle.addEventListener(
    "click",
    () => {
      state.open =
        !state.open;

      dock.classList.toggle(
        "open",
        state.open
      );

      toggle.setAttribute(
        "aria-expanded",
        String(state.open)
      );
    }
  );

  list.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(
          ".pw-item"
        );

      if (!button) return;

      const power =
        button.dataset.power;

      switch (power) {
        case "chidori":
          chidori();
          break;

        case "wind":
          toggleWind(button);
          break;

        case "kame":
          kamehameha();
          break;

        case "ssj":
          toggleSaiyan(button);
          break;

        case "arise":
          arise();
          break;
      }
    }
  );

  window.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape")
        return;

      state.open = false;

      dock.classList.remove("open");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  );

  /* =========================================================
     OPTIONAL GLOBAL API
     ========================================================= */

  window.XIRAIYA_POWERS = {
    chidori,
    kamehameha,
    arise,

    wind(on) {
      if (
        typeof on === "boolean" &&
        on !== state.wind
      ) {
        toggleWind(buttons.wind);
      }
    },

    superSaiyan(on) {
      if (
        typeof on === "boolean" &&
        on !== state.ssj
      ) {
        toggleSaiyan(buttons.ssj);
      }
    }
  };
})();
