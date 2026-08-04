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

  function animate(time) {
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

  // ---------- EVENTS ----------
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
        // Handle line breaks
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

    // Type name first
    typeWriter(nameEl, "muddachergd", 90, () => {
      // Then type bio after a short pause
      setTimeout(() => {
        typeWriter(bioEl, "Hello 👋\nAll my social accounts and contact channels are here.", 45, () => {
          // After typing finishes, show the scroll hint
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

  // ---------- INIT ----------
  function init() {
    resize();
    initAmbient();
    initReveal();
    requestAnimationFrame(animate);

    // Start typewriter after a tiny delay so page feels ready
    setTimeout(startTypewriters, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();