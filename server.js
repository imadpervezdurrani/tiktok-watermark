/**
 * TikGram - Ultra Secure TikTok & Instagram Downloader Engine
 * Hardened against: SSRF, Command Injection, DDoS, XSS, Path Traversal, CRLF, HTTP Parameter Pollution
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const axios = require('axios');
const compression = require('compression');
const { execFile } = require('child_process');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;
const YTDLP_PATH = path.join(__dirname, 'yt-dlp.exe');

// 0. Performance: Gzip/Brotli compression for ultra-fast response times
app.use(compression());

// 1. Security: Hide backend server identity (Prevents server reconnaissance)
app.disable('x-powered-by');

// 2. Security: Helmet HTTP Headers (Prevents XSS, Clickjacking, MIME-Sniffing)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        mediaSrc: ["'self'", "blob:", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https://www.tikwm.com", "https://*.tiktokcdn.com", "https://*.tiktokcdn-us.com"],
        frameAncestors: ["'none'"], // Disallows site from being embedded in iframes (Anti-Clickjacking)
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    frameguard: { action: 'deny' }, // Anti-clickjacking
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// 3. Security: CORS - Restricted to standard web requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 4. Security: HTTP Parameter Pollution (HPP) defense
app.use(hpp());

// 5. Security: Strict body parser limit (Anti-DoS memory exhaustion)
app.use(express.json({ limit: '10kb', strict: true }));

// 6. Security: Multi-tier Rate Limiting (Anti-DDoS & Bot Flood Protection)
// Tier A: General website traffic limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // max 250 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again in a few minutes.' }
});
app.use(globalLimiter);

// Tier B: Video Extraction API Limiter (Strict limits on resource-intensive extraction)
const extractLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // max 20 extractions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'Rate limit reached: Aap ek minute me zyada se zyada 20 videos extract kar sakte hain. Please wait.' 
  }
});

// Tier C: Download Proxy Limiter
const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // max 30 downloads per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Download limit reached. Please wait a few moments.' }
});

// Serve frontend static assets with caching control
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1h'
}));

// ==========================================================================
// SECURITY VALIDATION ENGINE
// ==========================================================================

// Robust URL Normalizer & Validator (Blocks Shell & Injection Attacks, supports all TikTok & Instagram share formats)
function normalizeAndValidateUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let trimmed = rawInput.trim();

  // Length guard (prevents memory buffer overflow)
  if (trimmed.length > 500) return null;

  // Block suspicious shell meta-characters (Command Injection Defense)
  if (/[;|\`$<>{}\0\r\n]/.test(trimmed)) return null;

  // If user pasted text with URL inside (e.g. from TikTok mobile app), extract the URL
  const match = trimmed.match(/https?:\/\/[^\s]+/i);
  if (match) {
    trimmed = match[0];
  } else if (/^(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com|instagram\.com)/i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

    const host = parsed.hostname.toLowerCase();
    const isTikTok = /^(.*\.)?tiktok\.com$/i.test(host) || host === 'douyin.com';
    const isInstagram = /^(.*\.)?instagram\.com$/i.test(host);

    if (!isTikTok && !isInstagram) return null;

    return {
      cleanUrl: parsed.toString(),
      isTikTok: isTikTok,
      isInstagram: isInstagram
    };
  } catch {
    return null;
  }
}

// Whitelist of allowed CDN hosts for proxy download (SSRF Shield)
const ALLOWED_CDN_PATTERNS = [
  /^([a-z0-9\-_]+\.)*tiktokcdn\.com$/i,
  /^([a-z0-9\-_]+\.)*tiktokcdn-us\.com$/i,
  /^([a-z0-9\-_]+\.)*tiktokv\.com$/i,
  /^([a-z0-9\-_]+\.)*tiktok\.com$/i,
  /^([a-z0-9\-_]+\.)*musical\.ly$/i,
  /^([a-z0-9\-_]+\.)*byteoversea\.com$/i,
  /^([a-z0-9\-_]+\.)*byteoversea\.net$/i,
  /^([a-z0-9\-_]+\.)*ibytedtos\.com$/i,
  /^([a-z0-9\-_]+\.)*ibyteimg\.com$/i,
  /^([a-z0-9\-_]+\.)*tikwm\.com$/i,
  /^([a-z0-9\-_]+\.)*cdninstagram\.com$/i,
  /^([a-z0-9\-_]+\.)*fbcdn\.net$/i,
  /^([a-z0-9\-_]+\.)*instagram\.com$/i,
  /^([a-z0-9\-_]+\.)*akamaized\.net$/i
];

function isSafeDownloadUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    
    // Must be secure HTTPS
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();

    // Anti-SSRF: Block localhost, cloud metadata, and all private IP spaces
    if (
      host === 'localhost' ||
      host === '169.254.169.254' || // AWS/GCP metadata service
      host === 'metadata.google.internal' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }

    // Must strictly match allowed CDN patterns
    return ALLOWED_CDN_PATTERNS.some(re => re.test(host));
  } catch {
    return false;
  }
}

// Safe Filename Sanitizer (Anti-Path-Traversal & Anti-CRLF-Injection)
function sanitizeFilename(rawTitle, rawType) {
  const safeTitle = (rawTitle || 'video')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Keep only alphanumeric, space, hyphens
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 35) || 'video';

  const ext = rawType === 'mp3' ? 'mp3' : 'mp4';
  return `${safeTitle}_nowatermark.${ext}`;
}

// Concurrency Limiter: Max 8 simultaneous extraction tasks to protect CPU/Memory
let activeExtractions = 0;
const MAX_CONCURRENT_EXTRACTIONS = 8;

// Safe child_process runner: Uses execFile with separated args (NO shell, immune to injection)
function runYtDlpSecure(url) {
  return new Promise((resolve, reject) => {
    if (activeExtractions >= MAX_CONCURRENT_EXTRACTIONS) {
      return reject(new Error('Server busy. Please try again in a few seconds.'));
    }

    activeExtractions++;

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-check-certificates',
      '--socket-timeout', '12',
      '--', // End of option flags (prevents flag injection)
      url
    ];

    execFile(YTDLP_PATH, args, { maxBuffer: 10 * 1024 * 1024, windowsHide: true, timeout: 16000 }, (error, stdout, stderr) => {
      activeExtractions--;
      if (error) {
        return reject(new Error('Media could not be retrieved.'));
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (err) {
        reject(new Error('Failed to parse media information.'));
      }
    });
  });
}

// ==========================================================================
// EXTRACTION WORKFLOWS
// ==========================================================================

// Fast TikTok extractor using TikWM API with fallback
async function extractTikTok(url) {
  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.data && res.data.code === 0 && res.data.data) {
      const d = res.data.data;
      const baseUrl = 'https://www.tikwm.com';
      const playUrl = d.play ? (d.play.startsWith('http') ? d.play : `${baseUrl}${d.play}`) : null;
      const hdUrl = d.hdplay ? (d.hdplay.startsWith('http') ? d.hdplay : `${baseUrl}${d.hdplay}`) : playUrl;
      const musicUrl = d.music ? (d.music.startsWith('http') ? d.music : `${baseUrl}${d.music}`) : null;
      const coverUrl = d.cover ? (d.cover.startsWith('http') ? d.cover : `${baseUrl}${d.cover}`) : null;

      const downloads = [];
      if (hdUrl) {
        downloads.push({
          quality: 'HD (No Watermark)',
          format: 'mp4',
          url: hdUrl,
          size: d.hd_size ? `${(d.hd_size / (1024 * 1024)).toFixed(1)} MB` : null,
          badge: 'Best Quality'
        });
      }
      if (playUrl && playUrl !== hdUrl) {
        downloads.push({
          quality: 'Standard (No Watermark)',
          format: 'mp4',
          url: playUrl,
          size: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : null,
          badge: 'Fast Download'
        });
      } else if (downloads.length === 0 && playUrl) {
        downloads.push({
          quality: 'Standard (No Watermark)',
          format: 'mp4',
          url: playUrl,
          size: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : null,
          badge: 'Fast Download'
        });
      }

      return {
        success: true,
        platform: 'tiktok',
        title: d.title || 'TikTok Video',
        author: {
          username: d.author?.unique_id || 'tiktok_user',
          nickname: d.author?.nickname || 'TikTok Creator',
          avatar: d.author?.avatar ? (d.author.avatar.startsWith('http') ? d.author.avatar : `${baseUrl}${d.author.avatar}`) : null
        },
        duration: d.duration || 0,
        thumbnail: coverUrl,
        downloads: downloads,
        audio: musicUrl ? {
          title: d.music_info?.title || 'Original Audio',
          author: d.music_info?.author || d.author?.nickname || 'TikTok Sound',
          url: musicUrl,
          format: 'mp3'
        } : null
      };
    }
  } catch (err) {
    // Failover silently to safe secondary engine
  }

  // Fallback to yt-dlp
  const ytdlpData = await runYtDlpSecure(url);
  return formatYtDlpResponse(ytdlpData, 'tiktok');
}

// Instagram extractor
async function extractInstagram(url) {
  try {
    const ytdlpData = await runYtDlpSecure(url);
    return formatYtDlpResponse(ytdlpData, 'instagram');
  } catch (err) {
    throw new Error('Instagram video download nahi ho saki. Please make sure the post is public and link is active.');
  }
}

// Unified response formatter
function formatYtDlpResponse(data, platform) {
  let videoUrl = data.url;
  let audioUrl = null;

  if (data.formats && Array.isArray(data.formats)) {
    const directVideos = data.formats.filter(f => f.url && f.vcodec !== 'none' && f.acodec !== 'none');
    if (directVideos.length > 0) {
      directVideos.sort((a, b) => (b.height || 0) - (a.height || 0));
      videoUrl = directVideos[0].url;
    } else {
      const videos = data.formats.filter(f => f.url && f.vcodec !== 'none');
      if (videos.length > 0) {
        videos.sort((a, b) => (b.height || 0) - (a.height || 0));
        videoUrl = videos[0].url;
      }
    }

    const audios = data.formats.filter(f => f.url && f.acodec !== 'none' && f.vcodec === 'none');
    if (audios.length > 0) {
      audioUrl = audios[0].url;
    }
  }

  return {
    success: true,
    platform: platform,
    title: data.title || (platform === 'tiktok' ? 'TikTok Video' : 'Instagram Video'),
    author: {
      username: data.uploader_id || data.uploader || 'Creator',
      nickname: data.uploader || 'Creator',
      avatar: null
    },
    duration: data.duration || 0,
    thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0]?.url) || null,
    downloads: [
      {
        quality: 'Original HD (No Watermark)',
        format: 'mp4',
        url: videoUrl,
        badge: 'Best Quality'
      }
    ],
    audio: audioUrl ? {
      title: data.track || data.title || 'Extracted Audio',
      author: data.artist || data.uploader || 'Audio',
      url: audioUrl,
      format: 'mp3'
    } : null
  };
}

// ==========================================================================
// API ROUTES (PROTECTED)
// ==========================================================================

// Route: Extract Media Details
app.post('/api/extract', extractLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    // Strict validation and normalization
    const validated = normalizeAndValidateUrl(url);
    if (!validated) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ghalat URL format. Sirf sahi TikTok ya Instagram video links darj karein.' 
      });
    }

    let result;
    if (validated.isTikTok) {
      result = await extractTikTok(validated.cleanUrl);
    } else {
      result = await extractInstagram(validated.cleanUrl);
    }

    return res.json(result);
  } catch (error) {
    // Mask sensitive system details from client
    return res.status(500).json({
      success: false,
      error: error.message || 'Video process nahi ho saki. Please make sure the video is public and link is active.'
    });
  }
});

// Route: Secure Download Stream Proxy
app.get('/api/download', downloadLimiter, async (req, res) => {
  try {
    const { url, title, type } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).send('Invalid request');
    }

    const targetUrl = decodeURIComponent(url.trim());

    // Security check: SSRF and CDN Domain Whitelist
    if (!isSafeDownloadUrl(targetUrl)) {
      return res.status(403).send('Forbidden: Target domain is not permitted.');
    }

    // Security check: Filename sanitization
    const filename = sanitizeFilename(title, type);
    const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 25000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (err) {
    if (req.query.url && isSafeDownloadUrl(req.query.url)) {
      return res.redirect(req.query.url);
    }
    return res.status(500).send('Download could not be completed');
  }
});

// Route: Health & Security Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    security_shield: {
      anti_ssrf: 'Active',
      anti_ddos: 'Active (3-tier limiters)',
      anti_injection: 'Active (Strict regex & execFile)',
      anti_hpp: 'Active',
      helmet_csp: 'Active'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🛡️  TikGram Military-Grade Secure Server is Running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`🔒 Security: SSRF, DDoS, HPP, Helmet, Injection Shields Active`);
    console.log(`======================================================\n`);
  });
  server.setTimeout(30000);
}

module.exports = app;
