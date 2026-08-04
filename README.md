# 🌌 Personal Links – Kişisel Link Sayfası

Siyah arkaplanlı, mavi ışıklı partikül efektli, ultra smooth animasyonlu kişisel link sayfası.

Instagram ve WhatsApp linklerini kolayca gösterebileceğin modern bir tek sayfa site.

---

## ✨ Özellikler

- Tam siyah arkaplan
- Fare / dokunma ile **mavi ışık partikülleri** (trail + glow)
- Giriş animasyonları + scroll reveal
- 60–120 FPS hissi (optimize edilmiş canvas)
- Mobil + masaüstü uyumlu
- Sıfır harici kütüphane (vanilla HTML/CSS/JS)
- GitHub Pages ile ücretsiz yayınlama

---

## 🛠 Nasıl Özelleştiririm?

`index.html` dosyasını aç ve şu yerleri değiştir:

### 1. İsim ve Bio
```html
<h1 class="name reveal">Senin Adın</h1>
<p class="bio reveal">Kısa bir tanıtım yazısı buraya gelir...</p>
```

### 2. Avatar harfi
```html
<span class="avatar-letter">A</span>
```
İstersen fotoğraf da koyabilirsin:
```html
<img src="foto.jpg" alt="Ben">
```

### 3. Instagram
```html
<a href="https://instagram.com/kullaniciadi" ...>
  ...
  <span class="link-handle">@kullaniciadi</span>
</a>
```

### 4. WhatsApp
```html
<a href="https://wa.me/905xxxxxxxxx" ...>
```
> `905xxxxxxxxx` yerine kendi numaranı yaz (ülke kodu + numara, boşluksuz)

---

## 🚀 GitHub Pages ile Yayınlama

1. Bu repoyu kendi hesabına fork'la veya klonla.
2. GitHub → Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main` → `/ (root)` → Save
5. Birkaç dakika sonra şu adreste açılır:  
   `https://kullaniciadin.github.io/personal-links`

---

## 📁 Dosya Yapısı

```
personal-links/
├── index.html      ← Ana sayfa (burayı düzenle)
├── style.css       ← Tasarım
├── script.js       ← Partiküller + animasyonlar
└── README.md
```

---

## 💡 İpuçları

- Partikül sayısını değiştirmek için `script.js` içinde `MAX_PARTICLES` ve `AMBIENT_COUNT` değerlerini oyna.
- Renkleri değiştirmek istersen `style.css` içindeki `--blue` değişkenini ve `script.js` içindeki `COLORS` dizisini güncelle.
- Fotoğraf eklemek istersen aynı klasöre koyup avatar kısmına `<img>` ekle.

Keyifli kullanımlar! ✨