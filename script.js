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
      const raw = (sum / dataArray.length) / 128;
      audioLevel = Math.min(1, Math.max(0.15, raw));
    } else {
      audioLevel = 0.15 + Math.sin(performance.now() / 800) * 0.06;
    }
    const ring = document.querySelector(".avatar-ring");
    if (ring) {
      if (audioLevel > 0.42) ring.classList.add("beat");
      else ring.classList.remove("beat");
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

  const SEND_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.932 0-1.31.468-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 013.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.12 3.176.77.84 1.233 1.911 1.233 3.222 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.627 0 12 0z"/></svg>',
    aistudio: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    mydcbot: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>',
    robloxscripts: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
  };

  function initSendAnim() {
    const overlay = document.getElementById("send-overlay");
    const iconEl = document.getElementById("send-icon");
    const labelEl = document.getElementById("send-label");
    if (!overlay || !iconEl) return;
    const platforms = ["instagram","youtube","telegram","discord","github","aistudio","mydcbot","robloxscripts"];
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
        const platform = platforms.find(p => link.classList.contains(p)) || "default";
        iconEl.innerHTML = SEND_ICONS[platform] || "";
        labelEl.textContent = "Opening " + name.trim() + "...";
        overlay.className = "send-overlay show send--" + platform;
        overlay.setAttribute("aria-hidden", "false");
        setTimeout(() => { window.location.href = dest; }, 950);
      });
    });
  }

  function initBackgroundMusic() {
    const audio = document.getElementById("bg-music");
    const muteBtn = document.getElementById("mute-btn");
    const muteIcon = document.getElementById("mute-icon");
    if (!audio) return;

    let unlocked = false;
    let sourceConnected = false;

    const mutePath = '<path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    const unmutePath = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';

    function updateMuteIcon() {
      if (muteIcon) muteIcon.innerHTML = audio.muted ? mutePath : unmutePath;
    }

    async function unlockAndPlay() {
      if (unlocked && !audio.paused) return;
      if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (audioContext && audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch (e) {}
      }
      if (!sourceConnected && audioContext) {
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
      if (audio.paused && !audio.muted) {
        try { await audio.play(); unlocked = true; } catch (e) {}
      } else if (!audio.paused) {
        unlocked = true;
      }
    }

    // Unlock on first interaction
    const onInteract = () => { unlockAndPlay(); };
    ["click", "touchstart", "scroll", "keydown"].forEach(ev => {
      document.addEventListener(ev, onInteract, { passive: true, once: false });
    });

    // Try immediately (may be blocked)
    unlockAndPlay();

    if (muteBtn) {
      muteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await unlockAndPlay();
        audio.muted = !audio.muted;
        updateMuteIcon();
        if (!audio.muted && audio.paused) {
          try { await audio.play(); } catch (e) {}
        }
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
