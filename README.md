# 🎬 TikGram - TikTok & Instagram No-Watermark Downloader

<p align="center">
  <strong>High-Speed, Bank-Grade Secure Web Application to download TikTok and Instagram Videos & Audio without watermarks in Full HD.</strong>
</p>

---

## ✨ Features

- ⚡ **Ultra-Fast Express Backend Engine**:
  - Direct HTTPS TikWM API integration with instant streaming (<1s response time).
  - Clean client-side rendering with zero heavy bundle overhead.
  - Ready for 1-click cloud deployment on Vercel via `@vercel/node`.
- 📱 **Dual Platform Engine**: Auto-detects and extracts videos from **TikTok** (videos, sounds) and **Instagram** (Reels, Videos, Posts).
- 🚫 **100% Zero Watermark**: Extracts the pristine direct media stream before watermark overlays are added.
- 🎬 **Multi-Format Downloads**:
  - Full HD MP4 Video
  - Standard Fast MP4 Video
  - Original 320kbps MP3 Audio
  - HD Cover Art & Thumbnail
- 📥 **Direct Save Engine**: Proxies media with `Content-Disposition: attachment` headers to trigger direct file downloads on iPhone, Android, and PC.
- 🎨 **Modern Responsive UI**:
  - Dark-mode glassmorphism theme (`#08090d`) with neon cyan & pink accents.
  - 100% fully responsive across phones (iPhone, Samsung Galaxy), tablets, and 4K displays.
  - One-click clipboard paste button.
  - Video preview player with creator details and duration badge.
  - Local download history stored in `localStorage`.
- 💼 **Google AdSense, Monetag & SEO Ready**:
  - Pre-configured Monetag service worker (`/sw.js`).
  - 4 Mandatory legal modals (Privacy Policy, Terms of Service, DMCA Disclaimer, Contact Us).
  - Schema.org Structured Data (`WebApplication`, `HowTo`, `FAQPage`).
  - Native `robots.txt` & `sitemap.xml`.
- 🛡️ **Military-Grade Hardened Security**:
  - **Anti-SSRF**: Strict CDN regex whitelist and private IP / loopback blocking.
  - **Anti-Command Injection**: Strict input regex validation and argument array child process execution.
  - **Anti-DDoS / Bot Floods**: Multi-tier rate limiters.
  - **Helmet Headers**: Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - **Path Traversal & CRLF Guard**: Filename sanitization.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/imadpervezdurrani/tiktok-watermark.git

# Navigate to project directory
cd tiktok-watermark

# Install dependencies
npm install
```

### 3. Run the Server
```bash
# Start in production mode
npm start

# Or start in live-reload development mode
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## ☁️ 1-Click Vercel Deployment

1. Push this repository to your GitHub account (`https://github.com/imadpervezdurrani/tiktok-watermark.git`).
2. Go to [vercel.com](https://vercel.com) and log in with GitHub.
3. Click **Add New Project** and select `tiktok-watermark`.
4. Leave framework preset as **Next.js** and click **Deploy**.
5. Your site is live on the global Vercel CDN within 60 seconds with free SSL!

---

## 🔒 Security Architecture

| Defense Layer | Implementation | Protection |
| :--- | :--- | :--- |
| **Command Injection Guard** | Strict Regex & `execFile` | Disallows shell characters (`;&\|`$<>{}`). |
| **SSRF Shield** | CDN Domain Whitelist | Blocks access to internal IPs (`127.0.0.1`, `169.254.169.254`, `192.168.x`). |
| **DDoS & Bot Limits** | `express-rate-limit` | 20 extractions/min, 250 requests/15 min. Max 8 concurrent tasks. |
| **MIME Sniffing & XSS** | `helmet` | Content-Security-Policy and strict MIME headers. |
| **Clickjacking** | `X-Frame-Options: DENY` | Prevents iframe embedding. |

---

## 📄 License
MIT License. Created for educational and personal use.
