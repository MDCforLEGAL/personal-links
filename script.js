(() => {
  "use strict";

  const FORCE_KEY = "mdc-force-high";
  const forceHigh = localStorage.getItem(FORCE_KEY) === "1";
  const perf = detectPerformance();
  if (forceHigh) perf.tier = "high";
  document.documentElement.setAttribute("data-perf", perf.tier);

  const PRESETS = {
    high: { maxParticles: 60, ambient: 12, particles: true },
    mid:  { maxParticles: 25, ambient: 6, particles: true },
    low:  { maxParticles: 0, ambient: 0, particles: false }
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

  let audioContext = null, analyser = null, dataArray = null;
  let beatPeaks = []; // timestamps in seconds
  let beatIntensity = 0;
  let avatarViz = null, avatarVizCtx = null;

  class Particle {
    constructor(x, y, ambient = false) {
      this.x = x; this.y = y; this.ambient = ambient;
      const s = ambient ? 0.3 + Math.random() * 0.5 : 0.7 + Math.random() * 1.0;
      this.vx = s * (0.5 + Math.random() * 0.7);
      this.vy = (Math.random() - 0.5) * 0.25;
      this.size = ambient ? 1 + Math.random() * 1.4 : 1.8 + Math.random() * 2;
      this.life = 1;
      this.decay = ambient ? 0.001 : 0.012;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.985; this.vy *= 0.985;
      this.life -= this.decay;
      if (this.ambient && this.life <= 0) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.life = 1;
      }
    }
    draw() {
      if (this.life <= 0 || !ctx) return;
      const a = 0.22 * this.life * (1 + beatIntensity * 0.8);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 + beatIntensity * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
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

  // --- Beat map analysis ---
  async function analyzeBeats(url) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const offline = new OfflineAudioContext(1, 44100 * 180, 44100);
      const decoded = await offline.decodeAudioData(buf.slice(0));
      const src = offline.createBufferSource();
      src.buffer = decoded;
      const filter = offline.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 150;
      src.connect(filter);
      filter.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      const data = rendered.getChannelData(0);
      const sampleRate = rendered.sampleRate;
      const peaks = [];
      const windowSize = Math.floor(sampleRate * 0.05);
      let maxInWindow = 0;
      for (let i = 0; i < data.length; i += windowSize) {
        let sum = 0;
        const end = Math.min(i + windowSize, data.length);
        for (let j = i; j < end; j++) sum += Math.abs(data[j]);
        const avg = sum / (end - i);
        if (avg > maxInWindow * 0.65 && avg > 0.04) {
          peaks.push(i / sampleRate);
          maxInWindow = avg;
        } else if (avg > maxInWindow) {
          maxInWindow = avg;
        }
      }
      beatPeaks = peaks;
    } catch (e) {
      beatPeaks = [];
    }
  }

  function getBeatIntensity(currentTime) {
    if (!beatPeaks.length) return 0.15 + Math.sin(performance.now() / 700) * 0.05;
    let closest = 999;
    for (let i = 0; i < beatPeaks.length; i++) {
      const d = Math.abs(beatPeaks[i] - currentTime);
      if (d < closest) closest = d;
      if (beatPeaks[i] > currentTime + 0.3) break;
    }
    if (closest < 0.08) return 1.0;
    if (closest < 0.18) return 0.55;
    return 0.12 + Math.sin(performance.now() / 600) * 0.04;
  }

  function animate() {
    if (!SETTINGS.particles || !ctx) { animating = false; return; }
    animating = true;
    ctx.clearRect(0, 0, width, height);

    const audio = document.getElementById("bg-music");
    if (audio && !audio.paused) {
      beatIntensity = getBeatIntensity(audio.currentTime);
    } else {
      beatIntensity = 0.15 + Math.sin(performance.now() / 700) * 0.05;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (!particles[i].ambient && particles[i].life <= 0) particles.splice(i, 1);
    }
    drawAvatarViz();
    requestAnimationFrame(animate);
  }

  function startParticles() {
    if (!SETTINGS.particles || animating) return;
    resize();
    initAmbient();
    requestAnimationFrame(animate);
  }

  function initAvatarViz() {
    avatarViz = document.getElementById("avatar-viz");
    if (!avatarViz) return;
    avatarVizCtx = avatarViz.getContext("2d");
    const size = 200;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    avatarViz.width = size * dpr;
    avatarViz.height = size * dpr;
    avatarViz.style.width = size + "px";
    avatarViz.style.height = size + "px";
    avatarVizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawAvatarViz() {
    if (!avatarVizCtx) return;
    const c = avatarVizCtx;
    const w = 200, h = 200, cx = 100, cy = 100;
    c.clearRect(0, 0, w, h);
    const bars = 36;
    const baseR = 62;
    const maxLen = 28 + beatIntensity * 22;
    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const wave = Math.sin(performance.now() / 400 + i * 0.3) * 0.15;
      const amp = Math.min(1, beatIntensity + wave);
      const len = amp * maxLen;
      const x1 = cx + Math.cos(angle) * baseR;
      const y1 = cy + Math.sin(angle) * baseR;
      const x2 = cx + Math.cos(angle) * (baseR + len);
      const y2 = cy + Math.sin(angle) * (baseR + len);
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.strokeStyle = "rgba(0," + (180 + amp * 75) + ",255," + (0.45 + amp * 0.5) + ")";
      c.lineWidth = 2.8;
      c.lineCap = "round";
      c.stroke();
    }
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
    const mutePath = '<path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    const unmutePath = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';

    function updateMuteIcon() {
      if (muteIcon) muteIcon.innerHTML = audio.muted ? mutePath : unmutePath;
    }

    async function unlockAndPlay() {
      if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (audioContext && audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch (e) {}
      }
      if (audio.paused && !audio.muted) {
        try { await audio.play(); unlocked = true; } catch (e) {}
      }
    }

    ["click", "touchstart", "scroll", "keydown"].forEach(ev => {
      document.addEventListener(ev, unlockAndPlay, { passive: true });
    });
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

    // Start beat analysis in background
    analyzeBeats(audio.src);
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
    initAvatarViz();
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
