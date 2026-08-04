/* =====================================================
   Kişisel Link Sayfası - Smooth Partikül + Animasyonlar
   120fps hissi için optimize edilmiş vanilla JS
   ===================================================== */

(() => {
  "use strict";

  // ---------- CANVAS & PARTICLES ----------
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2); // performans için max 2x

  // Partikül listesi
  const particles = [];
  const MAX_PARTICLES = 120;          // soft limit
  const SPAWN_ON_MOVE = 3;            // her hareketde kaç tane
  const AMBIENT_COUNT = 25;           // sürekli yüzen partiküller

  // Pointer pozisyonu
  let pointer = { x: -9999, y: -9999, active: false };

  // Renkler (mavi tonları)
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

      // Hız
      const angle = Math.random() * Math.PI * 2;
      const speed = isAmbient
        ? 0.15 + Math.random() * 0.35
        : 0.8 + Math.random() * 2.2;

      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      // Görünüm
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

      // Hafif sürüklenme
      this.vx *= 0.985;
      this.vy *= 0.985;

      // Ambient olanlar yavaşça yeniden doğsun
      if (this.isAmbient) {
        this.life -= this.decay;
        if (this.life <= 0) {
          this.resetAmbient();
        }
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

      // Hafif glow (sadece büyük partiküllerde)
      if (this.size > 2.2 && a > 0.3) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = this.color + (a * 0.18) + ")";
        ctx.fill();
      }
    }
  }

  // Ambient partikülleri başlat
  function initAmbient() {
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      particles.push(new Particle(
        Math.random() * width,
        Math.random() * height,
        true
      ));
    }
  }

  // Partikül spawn (mouse / touch)
  function spawnParticles(x, y, count = SPAWN_ON_MOVE) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) {
        // En eski non-ambient'i sil
        const idx = particles.findIndex(p => !p.isAmbient);
        if (idx !== -1) particles.splice(idx, 1);
        else break;
      }
      particles.push(new Particle(x, y, false));
    }
  }

  // Resize
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Ana loop - requestAnimationFrame ile 60-120fps
  let lastTime = 0;
  function animate(time) {
    // Delta time (opsiyonel, şimdilik sabit hız)
    // const dt = Math.min((time - lastTime) / 16.67, 2);
    lastTime = time;

    // Temizle (hafif trail efekti için alpha ile)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)"; // trail uzunluğu
    ctx.fillRect(0, 0, width, height);

    // Partikülleri güncelle ve çiz
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();

      // Ölü non-ambient'leri sil
      if (!p.isAmbient && p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Pointer glow (isteğe bağlı ekstra ışık)
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

  // ---------- EVENT LISTENERS ----------
  function onPointerMove(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    spawnParticles(x, y);
  }

  // Mouse
  window.addEventListener("mousemove", (e) => {
    onPointerMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    pointer.active = false;
  });

  // Touch
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

  // ---------- SCROLL REVEAL ----------
  function initReveal() {
    const reveals = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Bir kez göründükten sonra unobserve (performans)
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

    // Hero elemanlarını hemen göster (sayfa yüklenince)
    setTimeout(() => {
      document.querySelectorAll(".hero .reveal").forEach((el) => {
        el.classList.add("visible");
      });
    }, 120);
  }

  // ---------- BAŞLAT ----------
  function init() {
    resize();
    initAmbient();
    initReveal();
    requestAnimationFrame(animate);
  }

  // DOM hazır olunca başlat
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();