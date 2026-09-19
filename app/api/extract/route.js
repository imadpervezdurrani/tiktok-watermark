import { NextResponse } from 'next/server';
import axios from 'axios';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

// Strict URL Regex: Only authentic TikTok or Instagram URLs (Blocks Injection & Malicious URLs)
const TIKTOK_REGEX = /^https:\/\/(www\.|vt\.|vm\.|m\.)?tiktok\.com\/(@[\w\.-]+\/video\/\d+|\w+)(\/|\?[\w\.-=&%#]*)?$/i;
const INSTAGRAM_REGEX = /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w\-]+(\/|\?[\w\.-=&%#]*)?$/i;

function validateInputUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length > 300) return false;
  // Reject suspicious shell characters
  if (/[;&|`$<>{}\0\r\n\t]/.test(trimmed)) return false;
  return TIKTOK_REGEX.test(trimmed) || INSTAGRAM_REGEX.test(trimmed);
}

// TikWM pure HTTPS extractor (zero binary dependency, blazing fast <1s, 100% Vercel compatible)
async function extractTikTok(url) {
  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    // Failover silently to yt-dlp if available
  }

  // Fallback to yt-dlp if binary exists
  return await fallbackYtDlp(url, 'tiktok');
}

// Fallback runner using yt-dlp if installed on system/container
async function fallbackYtDlp(url, platform) {
  const binaryPath = path.join(process.cwd(), 'yt-dlp.exe');
  if (!fs.existsSync(binaryPath)) {
    throw new Error('Video information could not be retrieved. Please check if the video is public.');
  }

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-check-certificates',
      '--socket-timeout', '12',
      '--',
      url
    ];

    execFile(binaryPath, args, { maxBuffer: 10 * 1024 * 1024, windowsHide: true, timeout: 18000 }, (error, stdout) => {
      if (error) {
        return reject(new Error('Media could not be retrieved. Ensure the video link is public and active.'));
      }
      try {
        const data = JSON.parse(stdout);
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

        resolve({
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
        });
      } catch (err) {
        reject(new Error('Failed to parse media information.'));
      }
    });
  });
}

// Instagram Extractor
async function extractInstagram(url) {
  try {
    return await fallbackYtDlp(url, 'instagram');
  } catch (err) {
    throw new Error('Instagram video download nahi ho saki. Please make sure the post is public and link is active.');
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { url } = body;
    if (!validateInputUrl(url)) {
      return NextResponse.json({
        success: false,
        error: 'Ghalat URL format. Sirf sahi TikTok ya Instagram video links darj karein.'
      }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const isTikTok = /tiktok\.com/i.test(cleanUrl);

    let result;
    if (isTikTok) {
      result = await extractTikTok(cleanUrl);
    } else {
      result = await extractInstagram(cleanUrl);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Video process nahi ho saki. Please make sure the video is public and link is active.'
    }, { status: 500 });
  }
}
