/* =====================================================
   Personal Links Page - Smooth Particles + Animations
   Optimized for 60-120fps feel (vanilla JS)
   ===================================================== */

(() => {
  "use strict";

  // ---------- CANVAS & PARTICLES ----------
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const particles = [];
  const MAX_PARTICLES = 120;
  const SPAWN_ON_MOVE = 3;
  const AMBIENT_COUNT = 25;

  let pointer = { x: -9999, y: -9999, active: false };

  const COLORS = [
    "rgba(0, 180, 255,",
    "rgba(0, 140, 255,",
    "rgba(80, 200, 255,",
    "rgba(0, 220, 255,",
  ];

  class Particle {
    constructor(x, y, isAmbient = false) {
      this.x = x;
      this.y = y;
      this.isAmbient = isAmbient;

      const angle = Math.random() * Math.PI * 2;
      const speed = isAmbient
        ? 0.15 + Math.random() * 0.35
        : 0.8 + Math.random() * 2.2;

      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      this.size = isAmbient
        ? 1 + Math.random() * 1.8
        : 2 + Math.random() * 3.5;

      this.life = 1;
      this.decay = isAmbient
        ? 0.0008 + Math.random() * 0.0015
        : 0.012 + Math.random() * 0.018;

      this.color = COLORS[(Math.random() * COLORS.length) | 0];
      this.alpha = isAmbient ? 0.25 + Math.random() * 0.35 : 0.7 + Math.random() * 0.3;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.985;
      this.vy *= 0.985;

      if (this.isAmbient) {
        this.life -= this.decay;
        if (this.life <= 0) this.resetAmbient();
      } else {
        this.life -= this.decay;
      }
    }

    resetAmbient() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.life = 1;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.size = 1 + Math.random() * 1.8;
      this.alpha = 0.25 + Math.random() * 0.35;
    }

    draw() {
      if (this.life <= 0) return;

      const a = this.alpha * this.life;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + a + ")";
      ctx.fill();

      if (this.size > 2.2 && a > 0.3) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = this.color + (a * 0.18) + ")";
        ctx.fill();
      }
    }
  }

  function initAmbient() {
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      particles.push(new Particle(
        Math.random() * width,
        Math.random() * height,
        true
      ));
    }
  }

  function spawnParticles(x, y, count = SPAWN_ON_MOVE) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) {
        const idx = particles.findIndex(p => !p.isAmbient);
        if (idx !== -1) particles.splice(idx, 1);
        else break;
      }
      particles.push(new Particle(x, y, false));
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function animate() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();

      if (!p.isAmbient && p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    if (pointer.active) {
      const gradient = ctx.createRadialGradient(
        pointer.x, pointer.y, 0,
        pointer.x, pointer.y, 80
      );
      gradient.addColorStop(0, "rgba(0, 180, 255, 0.12)");
      gradient.addColorStop(0.5, "rgba(0, 140, 255, 0.04)");
      gradient.addColorStop(1, "rgba(0, 100, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(pointer.x - 80, pointer.y - 80, 160, 160);
    }

    requestAnimationFrame(animate);
  }

  function onPointerMove(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    spawnParticles(x, y);
  }

  window.addEventListener("mousemove", (e) => {
    onPointerMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    pointer.active = false;
  });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    }
  }, { passive: true });

  window.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    }
  }, { passive: true });

  window.addEventListener("touchend", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", () => {
    resize();
  }, { passive: true });

  // ---------- TYPEWRITER EFFECT ----------
  function typeWriter(element, text, speed = 70, callback) {
    let i = 0;
    element.innerHTML = "";
    element.classList.add("typing");

    function type() {
      if (i < text.length) {
        if (text.charAt(i) === "\n") {
          element.innerHTML += "<br>";
        } else {
          element.innerHTML += text.charAt(i);
        }
        i++;
        setTimeout(type, speed);
      } else {
        element.classList.remove("typing");
        element.classList.add("typed");
        if (callback) callback();
      }
    }
    type();
  }

  function startTypewriters() {
    const nameEl = document.getElementById("type-name");
    const bioEl = document.getElementById("type-bio");

    typeWriter(nameEl, "MDC", 120, () => {
      setTimeout(() => {
        typeWriter(bioEl, "Hello 👋\nAll my social accounts and contact channels are here.", 45, () => {
          const hint = document.querySelector(".scroll-hint");
          if (hint) hint.classList.add("visible");
        });
      }, 300);
    });
  }

  // ---------- SCROLL REVEAL ----------
  function initReveal() {
    const reveals = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  // ---------- SEND / LAUNCH ANIMATION ----------
  const SEND_ICONS = {
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.932 0-1.31.468-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 013.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.12 3.176.77.84 1.233 1.911 1.233 3.222 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.627 0 12 0z"/></svg>',
    dkplus: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    aistudio: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };
  SEND_ICONS.dk = SEND_ICONS.discord;

  function initSendAnim() {
    const overlay = document.getElementById("send-overlay");
    const iconEl = document.getElementById("send-icon");
    const labelEl = document.getElementById("send-label");
    if (!overlay || !iconEl || !labelEl) return;

    const platforms = ["telegram", "instagram", "youtube", "discord", "github", "dk", "dkplus", "aistudio"];
    let busy = false;

    document.querySelectorAll("a.link-card").forEach((link) => {
      const href = link.getAttribute("href");
      link.setAttribute("data-href", href);
      link.removeAttribute("target");
      link.setAttribute("href", "#");

      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        busy = true;

        const dest = link.getAttribute("data-href") || href;
        const name = (link.querySelector(".link-name") || {}).textContent || "Opening";
        const platform = platforms.find((p) => link.classList.contains(p)) || "default";

        iconEl.innerHTML = SEND_ICONS[platform] || "";
        labelEl.textContent = "Opening " + name.trim() + "...";
        overlay.className = "send-overlay show send--" + platform;
        overlay.setAttribute("aria-hidden", "false");

        setTimeout(() => {
          window.location.href = dest;
        }, 1100);
      }, true);
    });
  }

  // ---------- INIT ----------
  function init() {
    resize();
    initAmbient();
    initReveal();
    initSendAnim();
    requestAnimationFrame(animate);
    setTimeout(startTypewriters, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
