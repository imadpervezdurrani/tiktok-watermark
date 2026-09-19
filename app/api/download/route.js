import { NextResponse } from 'next/server';

// Whitelist of allowed CDN hosts for proxy download (SSRF Shield)
const ALLOWED_CDN_PATTERNS = [
  /^([a-z0-9\-_]+\.)*tiktokcdn\.com$/i,
  /^([a-z0-9\-_]+\.)*tiktokcdn-us\.com$/i,
  /^([a-z0-9\-_]+\.)*byteoversea\.com$/i,
  /^([a-z0-9\-_]+\.)*ibytedtos\.com$/i,
  /^([a-z0-9\-_]+\.)*tikwm\.com$/i,
  /^([a-z0-9\-_]+\.)*cdninstagram\.com$/i,
  /^([a-z0-9\-_]+\.)*fbcdn\.net$/i,
  /^([a-z0-9\-_]+\.)*instagram\.com$/i,
  /^([a-z0-9\-_]+\.)*akamaized\.net$/i
];

function isSafeDownloadUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();

    // Anti-SSRF: Block localhost, cloud metadata, and private IP spaces
    if (
      host === 'localhost' ||
      host === '169.254.169.254' ||
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

    return ALLOWED_CDN_PATTERNS.some(re => re.test(host));
  } catch {
    return false;
  }
}

function sanitizeFilename(rawTitle, rawType) {
  const safeTitle = (rawTitle || 'video')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 35) || 'video';

  const ext = rawType === 'mp3' ? 'mp3' : 'mp4';
  return `${safeTitle}_nowatermark.${ext}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'video';
  const type = searchParams.get('type') || 'mp4';

  if (!targetUrl) {
    return new NextResponse('Invalid request: url parameter required', { status: 400 });
  }

  const decodedUrl = decodeURIComponent(targetUrl.trim());

  // Anti-SSRF validation
  if (!isSafeDownloadUrl(decodedUrl)) {
    return new NextResponse('Forbidden: Target domain is not permitted.', { status: 403 });
  }

  const filename = sanitizeFilename(title, type);
  const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';

  try {
    const upstream = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    if (!upstream.ok) {
      return NextResponse.redirect(decodedUrl);
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', contentType);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(upstream.body, {
      status: 200,
      headers
    });
  } catch (err) {
    // If proxy fetch fails, safe redirect fallback
    return NextResponse.redirect(decodedUrl);
  }
}
