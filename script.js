(() => {
  "use strict";

  const FORCE_KEY = "mdc-force-high";
  const DISMISS_KEY = "mdc-perf-dismissed";
  const forceHigh = localStorage.getItem(FORCE_KEY) === "1";

  const perf = detectPerformance();
  if (forceHigh) perf.tier = "high";

  document.documentElement.setAttribute("data-perf", perf.tier);

  const PRESETS = {
    high: { maxParticles: 80, spawn: 2, ambient: 15, particles: true },
    mid:  { maxParticles: 30, spawn: 1, ambient: 6, particles: true },
    low:  { maxParticles: 0, spawn: 0, ambient: 0, particles: false }
  };
  const SETTINGS = Object.assign({}, PRESETS[perf.tier]);

  function detectPerformance() {
    const cores = navigator.hardwareConcurrency || 4;
    const ram = navigator.deviceMemory || 4;
    let tier = "high";
    if (cores <= 2 || ram <= 2) tier = "low";
    else if (cores <= 4 || ram <= 4) tier = "mid";
    return { tier };
  }

  const canvas = document.getElementById("particles");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let width = 0, height = 0;
  const particles = [];
  let animating = false;

  let audioContext = null, analyser = null, dataArray = null, audioLevel = 0;
  let avatarViz = null, avatarVizCtx = null;

  class Particle {
    constructor(x, y, ambient = false) {
      this.x = x; this.y = y; this.ambient = ambient;
      const s = ambient ? 0.4 + Math.random() * 0.6 : 0.8 + Math.random() * 1.2;
      this.vx = s * (0.6 + Math.random() * 0.8);
      this.vy = (Math.random() - 0.5) * 0.3;
      this.size = ambient ? 1 + Math.random() * 1.5 : 2 + Math.random() * 2.5;
      this.life = 1;
      this.decay = ambient ? 0.001 : 0.015;
      this.color = "rgba(255, 255, 255,";
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.98; this.vy *= 0.98;
      this.life -= this.decay;
      if (this.ambient && this.life <= 0) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.life = 1;
      }
    }
    draw() {
      if (this.life <= 0 || !ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (0.25 * this.life) + ")";
      ctx.fill();
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function initAmbient() {
    if (!SETTINGS.particles) return;
    particles.length = 0;
    for (let i = 0; i < SETTINGS.ambient; i++) {
      particles.push(new Particle(Math.random() * width, Math.random() * height, true));
    }
  }

  function animate() {
    if (!SETTINGS.particles || !ctx) { animating = false; return; }
    animating = true;
    ctx.clearRect(0, 0, width, height);
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      audioLevel = Math.min(1, (sum / dataArray.length) / 128);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (!particles[i].ambient && particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(animate);
  }

  function startParticles() {
    if (!SETTINGS.particles || animating) return;
    resize();
    initAmbient();
    requestAnimationFrame(animate);
  }

      function typeWriter(el, text, speed, cb) {
    if (!speed) { el.textContent = text; if (cb) cb(); return; }
    let i = 0;
    el.textContent = "";
    el.classList.add("typing");
    function type() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(type, speed);
      } else {
        el.classList.remove("typing");
        if (cb) cb();
      }
    }
    type();
  }

  function startTypewriters() {
    const nameEl = document.getElementById("type-name");
    const bioEl = document.getElementById("type-bio");
    typeWriter(nameEl, "MDC", 100, () => {
      setTimeout(() => typeWriter(bioEl, "Hello 👋\nAll my social accounts and contact channels are here.", 35), 200);
    });
  }

  function initReveal() {
    const reveals = document.querySelectorAll(".reveal");
    if (perf.tier === "low") {
      reveals.forEach(el => el.classList.add("visible"));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => obs.observe(el));
  }

  let busy = false;
  function resetSendOverlay() {
    const overlay = document.getElementById("send-overlay");
    if (overlay) {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }
    busy = false;
  }

  function initSendAnim() {
    const overlay = document.getElementById("send-overlay");
    const iconEl = document.getElementById("send-icon");
    const labelEl = document.getElementById("send-label");
    if (!overlay) return;
    document.querySelectorAll("a.link-card").forEach(link => {
      const href = link.getAttribute("href");
      link.setAttribute("data-href", href);
      link.setAttribute("href", "#");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (busy) return;
        busy = true;
        const dest = link.getAttribute("data-href") || href;
        if (perf.tier === "low") { window.location.href = dest; return; }
        const name = (link.querySelector(".link-name") || {}).textContent || "Opening";
        labelEl.textContent = "Opening " + name.trim() + "...";
        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");
        setTimeout(() => { window.location.href = dest; }, 900);
      });
    });
  }

  function initBackgroundMusic() {
    const audio = document.getElementById("bg-music");
    const muteBtn = document.getElementById("mute-btn");
    const muteIcon = document.getElementById("mute-icon");
    if (!audio) return;

    let sourceConnected = false;

    const mutePath = '<path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    const unmutePath = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';

    function updateMuteIcon() {
      if (muteIcon) muteIcon.innerHTML = audio.muted ? mutePath : unmutePath;
    }

    async function ensureContext() {
      if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (audioContext && audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch (e) {}
      }
    }

    function connectAnalyser() {
      if (sourceConnected || !audioContext) return;
      try {
        const source = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        sourceConnected = true;
      } catch (e) {}
    }

    async function startAudio() {
      await ensureContext();
      connectAnalyser();
      if (audio.paused) {
        try { await audio.play(); } catch (e) {}
      }
    }

    startAudio();
    ["click", "touchstart", "keydown"].forEach(ev => {
      document.addEventListener(ev, startAudio, { passive: true });
    });

    if (muteBtn) {
      muteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        audio.muted = !audio.muted;
        updateMuteIcon();
        if (!audio.muted) await startAudio();
      });
    }
    updateMuteIcon();
  }

  function setupPageRestore() {
    window.addEventListener("pageshow", (e) => {
      resetSendOverlay();
      if (e.persisted) {
        animating = false;
        startParticles();
      }
    });
    window.addEventListener("pagehide", resetSendOverlay);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resetSendOverlay();
    });
  }

    function init() {
    resetSendOverlay();
    startParticles();
    initReveal();
    initSendAnim();
    initBackgroundMusic();
    startTypewriters();
    setupPageRestore();
    window.addEventListener("resize", resize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
