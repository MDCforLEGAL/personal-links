# 🌌 Personal Links

A modern single-page personal link site with a pure black background, interactive blue light particles, smooth entrance animations, and typewriter effect.

Perfect for sharing Instagram, WhatsApp, YouTube, Telegram, Discord, GitHub and more.

---

## ✨ Features

- Pure black background
- Blue glowing particles that react to mouse / touch
- Typewriter animation on page load
- Smooth scroll reveal animations
- 60–120 FPS feel (optimized canvas)
- Fully responsive (mobile + desktop)
- Zero external libraries (vanilla HTML / CSS / JS)
- Free hosting with GitHub Pages

---

## 🛠 How to Customize

Open `index.html` and edit the following:

### 1. Name & Bio (typewriter text)
The texts are typed automatically in `script.js`:
```js
typeWriter(nameEl, "muddachergd", 90, ...)
typeWriter(bioEl, "Hello 👋\nAll my social accounts...", 45, ...)
```

### 2. Avatar / Logo
Currently uses your GitHub profile picture:
```html
<img src="https://avatars.githubusercontent.com/u/295631830?v=4" alt="muddachergd" />
```

### 3. Social Links
Just change the `href` and the handle text inside each `.link-card`.

---

## 🚀 Deploy with GitHub Pages

1. Go to the repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → folder: `/ (root)` → **Save**
4. After a minute or two your site will be live at:  
   `https://MDCforLEGAL.github.io/personal-links`

---

## 📁 File Structure

```
personal-links/
├── index.html      ← Main page
├── style.css       ← Styles + typewriter cursor
├── script.js       ← Particles + typewriter + reveal
└── README.md
```

---

## 💡 Tips

- Change particle density in `script.js` → `MAX_PARTICLES` and `AMBIENT_COUNT`
- Change the blue color in `style.css` (`--blue`) and in the `COLORS` array in `script.js`
- To use a custom logo, replace the `<img>` src with your own image

Enjoy! ✨