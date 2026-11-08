(() => {
  "use strict";
  const cores = navigator.hardwareConcurrency || 4;
  const ram = navigator.deviceMemory || 4;
  let tier = "high";
  if (cores <= 2 || ram <= 2) tier = "low";
  else if (cores <= 4 || ram <= 4) tier = "mid";
  document.documentElement.setAttribute("data-perf", tier);

  const SETTINGS = {
    high: { ambient: 12, particles: true },
    mid:  { ambient: 6, particles: true },
    low:  { ambient: 0, particles: false }
  }[tier];

  const canvas = document.getElementById("particles");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let width = 0, height = 0, animating = false;
  const particles = [];
  let beatPeaks = [], beatIntensity = 0.15;
  let avatarViz = null, avatarVizCtx = null;
  let audioContext = null;

  class Particle {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0.4 + Math.random() * 0.7;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.size = 1 + Math.random() * 1.6;
      this.life = 1;
      this.decay = 0.001;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0) { this.x = Math.random() * width; this.y = Math.random() * height; this.life = 1; }
    }
    draw() {
      if (!ctx) return;
      const a = 0.2 * this.life * (1 + beatIntensity * 0.6);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 + beatIntensity * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
      ctx.fill();
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
  }

  function initAmbient() {
    if (!SETTINGS.particles) return;
    particles.length = 0;
    for (let i = 0; i < SETTINGS.ambient; i++) particles.push(new Particle(Math.random() * width, Math.random() * height));
  }

  async function analyzeBeats(url) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const offline = new OfflineAudioContext(1, 44100 * 180, 44100);
      const decoded = await offline.decodeAudioData(buf.slice(0));
      const src = offline.createBufferSource();
      src.buffer = decoded;
      const filter = offline.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 140;
      src.connect(filter); filter.connect(offline.destination); src.start(0);
      const rendered = await offline.startRendering();
      const data = rendered.getChannelData(0);
      const sr = rendered.sampleRate;
      const win = Math.floor(sr * 0.05);
      const peaks = [];
      let maxW = 0;
      for (let i = 0; i < data.length; i += win) {
        let sum = 0; const end = Math.min(i + win, data.length);
        for (let j = i; j < end; j++) sum += Math.abs(data[j]);
        const avg = sum / (end - i);
        if (avg > maxW * 0.62 && avg > 0.035) { peaks.push(i / sr); maxW = avg; }
        else if (avg > maxW) maxW = avg;
      }
      beatPeaks = peaks;
    } catch (e) { beatPeaks = []; }
  }

  function getBeatIntensity(t) {
    if (!beatPeaks.length) return 0.15 + Math.sin(performance.now() / 700) * 0.05;
    let closest = 999;
    for (let i = 0; i < beatPeaks.length; i++) {
      const d = Math.abs(beatPeaks[i] - t);
      if (d < closest) closest = d;
      if (beatPeaks[i] > t + 0.3) break;
    }
    if (closest < 0.07) return 1;
    if (closest < 0.16) return 0.5;
    return 0.12 + Math.sin(performance.now() / 600) * 0.04;
  }

  function animate() {
    if (!SETTINGS.particles || !ctx) { animating = false; return; }
    animating = true;
    ctx.clearRect(0, 0, width, height);
    const audio = document.getElementById("bg-music");
    if (audio && !audio.paused) beatIntensity = getBeatIntensity(audio.currentTime);
    else beatIntensity = 0.15 + Math.sin(performance.now() / 700) * 0.05;
    for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].draw(); }
    drawWaveViz();
    requestAnimationFrame(animate);
  }

  function startParticles() {
    if (!SETTINGS.particles || animating) return;
    resize(); initAmbient(); requestAnimationFrame(animate);
  }

  function initAvatarViz() {
    avatarViz = document.getElementById("avatar-viz");
    if (!avatarViz) return;
    avatarVizCtx = avatarViz.getContext("2d");
    const size = 200, dpr = Math.min(window.devicePixelRatio || 1, 2);
    avatarViz.width = size * dpr; avatarViz.height = size * dpr;
    avatarViz.style.width = size + "px"; avatarViz.style.height = size + "px";
    avatarVizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawWaveViz() {
    if (!avatarVizCtx) return;
    const c = avatarVizCtx, w = 200, h = 200, cx = 100, cy = 100;
    c.clearRect(0, 0, w, h);
    const points = 64;
    const baseR = 62;
    const amp = 8 + beatIntensity * 18;
    c.beginPath();
    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = (idx / points) * Math.PI * 2 - Math.PI / 2;
      const wave = Math.sin(performance.now() / 380 + idx * 0.35) * 0.5 + 0.5;
      const r = baseR + wave * amp;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(0,220,255,0.85)");
    g.addColorStop(1, "rgba(0,140,255,0.75)");
    c.strokeStyle = g;
    c.lineWidth = 2.4;
    c.stroke();
  }

  function typeWriter(el, text, speed, cb) {
    if (!speed) { el.textContent = text; if (cb) cb(); return; }
    let i = 0; el.textContent = ""; el.classList.add("typing");
    function type() {
      if (i < text.length) { el.textContent += text[i++]; setTimeout(type, speed); }
      else { el.classList.remove("typing"); if (cb) cb(); }
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
    if (tier === "low") { reveals.forEach(el => el.classList.add("visible")); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(el => obs.observe(el));
  }

  let busy = false;
  function resetSendOverlay() {
    const o = document.getElementById("send-overlay");
    if (o) { o.classList.remove("show"); o.setAttribute("aria-hidden", "true"); }
    busy = false;
  }

  const SEND_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.445.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.618-1.25.077.077 0 00-.078-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.932 0-1.31.468-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 013.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.12 3.176.77.84 1.233 1.911 1.233 3.222 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.627 0 12 0z"/></svg>',
    aistudio: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    mydcbot: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.445.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.618-1.25.077.077 0 00-.078-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>',
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
        if (tier === "low") { window.location.href = dest; return; }
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

  function initMusicUI() {
    const audio = document.getElementById("bg-music");
    const npBtn = document.getElementById("now-playing-btn");
    const panel = document.getElementById("music-panel");
    const playBtn = document.getElementById("mp-play");
    const muteBtn = document.getElementById("mp-mute");
    const vol = document.getElementById("mp-volume");
    if (!audio) return;

    async function unlock() {
      if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (audioContext && audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch (e) {}
      }
      if (audio.paused && !audio.muted) {
        try { await audio.play(); } catch (e) {}
      }
    }

    ["click", "touchstart", "scroll", "keydown"].forEach(ev => {
      document.addEventListener(ev, unlock, { passive: true });
    });
    unlock();

    if (npBtn && panel) {
      npBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("show");
        panel.setAttribute("aria-hidden", panel.classList.contains("show") ? "false" : "true");
      });
      document.addEventListener("click", () => {
        panel.classList.remove("show");
        panel.setAttribute("aria-hidden", "true");
      });
    }

    if (playBtn) {
      playBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await unlock();
        if (audio.paused) { try { await audio.play(); } catch (e) {} playBtn.textContent = "⏸"; }
        else { audio.pause(); playBtn.textContent = "▶"; }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        audio.muted = !audio.muted;
        muteBtn.textContent = audio.muted ? "🔇" : "🔊";
      });
    }

    if (vol) {
      vol.addEventListener("input", () => { audio.volume = vol.value; });
    }

    analyzeBeats(audio.src);
  }

  function setupPageRestore() {
    window.addEventListener("pageshow", (e) => {
      resetSendOverlay();
      if (e.persisted) { animating = false; startParticles(); }
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
    initMusicUI();
    startTypewriters();
    setupPageRestore();
    window.addEventListener("resize", resize);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
