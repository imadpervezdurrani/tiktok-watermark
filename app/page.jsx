'use client';

import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [platform, setPlatform] = useState('tiktok');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mediaData, setMediaData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [activeFaq, setActiveFaq] = useState(null);
  const videoRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tikgram_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3500);
  };

  // Handle URL paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        showToast('Link pasted from clipboard!', 'success');
        detectPlatform(text.trim());
      }
    } catch {
      showToast('Clipboard access denied. Please paste manually.', 'error');
    }
  };

  // Auto detect platform based on URL
  const detectPlatform = (text) => {
    if (/tiktok\.com/i.test(text)) {
      setPlatform('tiktok');
    } else if (/instagram\.com/i.test(text)) {
      setPlatform('instagram');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    if (val.trim()) {
      detectPlatform(val.trim());
    }
  };

  const clearInput = () => {
    setUrlInput('');
    setErrorMsg('');
  };

  // Save to history helper
  const saveToHistory = (item) => {
    try {
      const current = [...history.filter((h) => h.url !== item.url)];
      const updated = [item, ...current].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('tikgram_history', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tikgram_history');
    showToast('Download history cleared.', 'info');
  };

  // Main extraction submit handler
  const handleExtract = async (e) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();

    if (!cleanUrl) {
      showToast('Please enter a TikTok or Instagram link first.', 'error');
      return;
    }

    const isTikTok = /tiktok\.com/i.test(cleanUrl);
    const isInsta = /instagram\.com/i.test(cleanUrl);

    if (!isTikTok && !isInsta) {
      setErrorMsg('Please enter a valid TikTok or Instagram URL.');
      return;
    }

    setErrorMsg('');
    setMediaData(null);
    setLoading(true);

    const steps = [
      'Connecting to CDN servers...',
      'Bypassing watermark headers...',
      'Generating high-speed HD download links...'
    ];
    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 900);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();
      clearInterval(stepInterval);
      setLoading(false);

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to extract video. Please verify the URL.');
        return;
      }

      setMediaData(data);
      saveToHistory({
        title: data.title,
        thumbnail: data.thumbnail,
        platform: data.platform,
        url: cleanUrl,
        date: new Date().toLocaleDateString()
      });

      showToast('Media extracted successfully!', 'success');
      // Scroll smoothly to results
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      clearInterval(stepInterval);
      setLoading(false);
      setErrorMsg('Server connection failed. Please check your internet and try again.');
    }
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="site-wrapper">
      {/* Dynamic Background Ambient Blobs */}
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      <div className="ambient-blob blob-3"></div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <i className={toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-info'}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Navigation */}
      <header className="site-header">
        <div className="container nav-container">
          <a href="#" className="brand-logo">
            <div className="logo-icon">
              <i className="fa-brands fa-tiktok"></i>
              <span className="logo-badge">HD</span>
            </div>
            <span className="logo-text">
              Tik<span className="logo-highlight">Gram</span>
            </span>
          </a>

          <div className="header-badges">
            <span className="shield-tag">
              <i className="fa-solid fa-shield-halved"></i> 100% Secure &amp; SSL
            </span>
            <span className="shield-tag free-tag">
              <i className="fa-solid fa-bolt"></i> Free Forever
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="main-content">
        <section className="hero-section">
          <div className="container">
            <div className="hero-badge-pill">
              <i className="fa-solid fa-sparkles"></i> Next-Gen Video Downloader (App Router)
            </div>
            <h1 className="hero-title">
              Download TikTok &amp; Instagram Videos{' '}
              <span className="gradient-text">Without Watermark</span>
            </h1>
            <p className="hero-subtitle">
              Save crisp Ultra HD (1080p / 4K) videos and original MP3 audio from TikTok and Instagram
              instantly. No app needed, 100% free &amp; unlimited.
            </p>

            {/* Platform Selector Tabs */}
            <div className="platform-tabs" role="tablist">
              <button
                type="button"
                className={`platform-btn ${platform === 'tiktok' ? 'active' : ''}`}
                onClick={() => setPlatform('tiktok')}
              >
                <i className="fa-brands fa-tiktok"></i>
                <span>TikTok Downloader</span>
              </button>
              <button
                type="button"
                className={`platform-btn ${platform === 'instagram' ? 'active' : ''}`}
                onClick={() => setPlatform('instagram')}
              >
                <i className="fa-brands fa-instagram"></i>
                <span>Instagram Reels</span>
              </button>
            </div>

            {/* Downloader Form Card */}
            <div className="downloader-card">
              <form onSubmit={handleExtract} className="input-form">
                <div className="input-field-wrapper">
                  <span className="input-icon">
                    <i className={platform === 'tiktok' ? 'fa-brands fa-tiktok' : 'fa-brands fa-instagram'}></i>
                  </span>
                  <input
                    type="url"
                    id="videoUrlInput"
                    placeholder={
                      platform === 'tiktok'
                        ? 'Paste TikTok video link here (e.g. https://vm.tiktok.com/...)'
                        : 'Paste Instagram Reel or Video link here...'
                    }
                    value={urlInput}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {urlInput && (
                    <button
                      type="button"
                      className="action-btn clear-btn"
                      onClick={clearInput}
                      title="Clear text"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                  <button
                    type="button"
                    className="action-btn paste-btn"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                  >
                    <i className="fa-regular fa-clipboard"></i>
                    <span>Paste</span>
                  </button>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download"></i>
                      <span>Get Video</span>
                    </>
                  )}
                </button>
              </form>

              {/* Extraction Progress Animation */}
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner-ring"></div>
                  <div className="loading-status-text">{loadingStep}</div>
                  <div className="loading-bar">
                    <div className="loading-progress"></div>
                  </div>
                </div>
              )}

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="error-alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{errorMsg}</span>
                  <button type="button" onClick={() => setErrorMsg('')} className="close-alert-btn">
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Google AdSense Banner Placement 1 */}
            <div className="ad-container ad-leaderboard">
              <span className="ad-label">Advertisement</span>
              <div className="ad-placeholder">
                <i className="fa-solid fa-rectangle-ad"></i>
                <span>Google AdSense Display Banner (Responsive)</span>
              </div>
            </div>

            {/* Results Preview Card */}
            {mediaData && (
              <section id="result-section" className="result-section">
                <div className="result-card">
                  <div className="result-media-col">
                    <div className="video-player-wrapper">
                      {mediaData.downloads?.[0]?.url ? (
                        <video
                          ref={videoRef}
                          controls
                          playsInline
                          poster={mediaData.thumbnail}
                          src={mediaData.downloads[0].url}
                          className="preview-video"
                        ></video>
                      ) : (
                        <img
                          src={mediaData.thumbnail}
                          alt={mediaData.title}
                          className="preview-poster-img"
                        />
                      )}
                    </div>
                  </div>

                  <div className="result-info-col">
                    <div className="author-badge">
                      {mediaData.author?.avatar && (
                        <img
                          src={mediaData.author.avatar}
                          alt={mediaData.author.nickname || 'Author'}
                          className="author-avatar"
                        />
                      )}
                      <div className="author-details">
                        <span className="author-name">{mediaData.author?.nickname || 'Creator'}</span>
                        <span className="author-handle">@{mediaData.author?.username || 'user'}</span>
                      </div>
                    </div>

                    <h2 className="result-title">{mediaData.title || 'Video Media'}</h2>

                    <div className="download-options-group">
                      <h3 className="options-heading">
                        <i className="fa-solid fa-cloud-arrow-down"></i> Choose Download Quality:
                      </h3>

                      <div className="download-buttons-list">
                        {mediaData.downloads?.map((item, idx) => (
                          <a
                            key={idx}
                            href={`/api/download?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(mediaData.title)}&type=mp4`}
                            download
                            className="dl-button dl-button-hd"
                          >
                            <div className="dl-btn-left">
                              <i className="fa-solid fa-circle-play"></i>
                              <div className="dl-btn-text">
                                <span className="dl-quality-name">{item.quality}</span>
                                <span className="dl-format-badge">MP4 {item.size ? `• ${item.size}` : ''}</span>
                              </div>
                            </div>
                            <span className="dl-badge-tag">{item.badge || 'Download'}</span>
                          </a>
                        ))}

                        {mediaData.audio?.url && (
                          <a
                            href={`/api/download?url=${encodeURIComponent(mediaData.audio.url)}&title=${encodeURIComponent(mediaData.title)}&type=mp3`}
                            download
                            className="dl-button dl-button-audio"
                          >
                            <div className="dl-btn-left">
                              <i className="fa-solid fa-music"></i>
                              <div className="dl-btn-text">
                                <span className="dl-quality-name">Extract Audio (MP3)</span>
                                <span className="dl-format-badge">
                                  {mediaData.audio.title || 'Original Sound'} • MP3
                                </span>
                              </div>
                            </div>
                            <span className="dl-badge-tag">Audio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Recent History Drawer */}
            {history.length > 0 && (
              <div className="history-drawer">
                <div className="history-header">
                  <h3>
                    <i className="fa-solid fa-clock-rotate-left"></i> Recent Downloads
                  </h3>
                  <button type="button" onClick={clearHistory} className="clear-history-btn">
                    Clear History
                  </button>
                </div>
                <div className="history-chips">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="history-chip"
                      onClick={() => {
                        setUrlInput(h.url);
                        setPlatform(h.platform);
                      }}
                    >
                      <i className={h.platform === 'tiktok' ? 'fa-brands fa-tiktok' : 'fa-brands fa-instagram'}></i>
                      <span className="history-chip-title">{h.title || 'Saved Video'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-pill">Why Choose TikGram?</span>
              <h2 className="section-title">The Fastest &amp; Most Secure Downloader</h2>
              <p className="section-desc">
                Engineered for maximum reliability, military-grade SSL data safety, and zero compression loss.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon feature-icon-cyan">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h3>100% Watermark Free</h3>
                <p>
                  TikGram automatically removes the bouncing TikTok watermark and username tags, giving you pristine
                  original frames.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon feature-icon-magenta">
                  <i className="fa-solid fa-film"></i>
                </div>
                <h3>Crystal Clear HD &amp; 4K</h3>
                <p>
                  Download in original resolution without re-compression or pixelation. Best quality guaranteed for
                  content creators.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon feature-icon-gold">
                  <i className="fa-solid fa-music"></i>
                </div>
                <h3>Fast MP3 Extraction</h3>
                <p>
                  Save trending background music, voiceovers, and sounds directly into 320kbps high-fidelity MP3
                  files.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon feature-icon-green">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h3>No Sign-Up or Tracking</h3>
                <p>
                  No accounts, no credit cards, and zero cookies. All downloads are fetched dynamically and never
                  stored.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Guide */}
        <section className="how-it-works-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-pill">Simple 3-Step Guide</span>
              <h2 className="section-title">How to Download Videos in 3 Seconds</h2>
            </div>

            <div className="steps-container">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon">
                  <i className="fa-solid fa-share-nodes"></i>
                </div>
                <h3>Copy the Link</h3>
                <p>Open TikTok or Instagram, find the video or reel you want, tap Share and click Copy Link.</p>
              </div>

              <div className="step-connector">
                <i className="fa-solid fa-angle-right"></i>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon">
                  <i className="fa-solid fa-paste"></i>
                </div>
                <h3>Paste in TikGram</h3>
                <p>Paste the video URL into the input box above and hit the Get Video button.</p>
              </div>

              <div className="step-connector">
                <i className="fa-solid fa-angle-right"></i>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon">
                  <i className="fa-solid fa-cloud-arrow-down"></i>
                </div>
                <h3>Save &amp; Enjoy</h3>
                <p>Choose HD No Watermark or MP3 Audio to start saving the file instantly to your device.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Google AdSense Banner Placement 2 */}
        <div className="container">
          <div className="ad-container ad-middle">
            <span className="ad-label">Advertisement</span>
            <div className="ad-placeholder">
              <i className="fa-solid fa-rectangle-ad"></i>
              <span>Google AdSense In-Article Ad Unit</span>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <section className="faq-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-pill">Got Questions?</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>

            <div className="faq-accordion">
              {[
                {
                  q: 'Is TikGram completely free to use?',
                  a: 'Yes, TikGram is 100% free with unlimited downloads. You never have to pay or install software.'
                },
                {
                  q: 'Where are downloaded videos saved on my phone or PC?',
                  a: 'Videos are automatically saved in your device’s default Downloads folder (e.g., Files on iPhone, Downloads on Android and Windows).'
                },
                {
                  q: 'Does TikGram keep a copy of videos or track users?',
                  a: 'No. TikGram does not host, clone, or store any media. All requests stream directly from public CDNs with zero telemetry.'
                },
                {
                  q: 'Can I download videos from private TikTok or Instagram accounts?',
                  a: 'No. To respect copyright and user privacy, TikGram only processes public videos and reels.'
                },
                {
                  q: 'How do I download on iPhone or iPad (iOS)?',
                  a: 'Open TikGram in Safari on your iPhone, paste the link, and tap Download. Safari will prompt you to save the file directly to your Files app or Photos.'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="faq-question">
                    <span>{item.q}</span>
                    <i className={`fa-solid ${activeFaq === idx ? 'fa-minus' : 'fa-plus'}`}></i>
                  </div>
                  {activeFaq === idx && <div className="faq-answer">{item.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Site Footer with AdSense Compliance Links */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <a href="#" className="brand-logo">
                <span className="logo-text">
                  Tik<span className="logo-highlight">Gram</span>
                </span>
              </a>
              <p className="footer-about">
                TikGram is the premier online tool to download TikTok and Instagram videos in HD without watermarks.
                Fast, secure, and always free.
              </p>
            </div>

            <div className="footer-col">
              <h4>Tools</h4>
              <ul className="footer-links">
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setPlatform('tiktok'); }}>
                    TikTok Video Downloader
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setPlatform('tiktok'); }}>
                    TikTok MP3 Sound Downloader
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setPlatform('instagram'); }}>
                    Instagram Reels Downloader
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Legal &amp; Policy</h4>
              <ul className="footer-links">
                <li>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#dmca" onClick={(e) => { e.preventDefault(); setActiveModal('dmca'); }}>
                    DMCA &amp; Disclaimer
                  </a>
                </li>
                <li>
                  <a href="#contact" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> TikGram is an independent web utility and is NOT affiliated with, sponsored
              by, or endorsed by TikTok, ByteDance, Instagram, or Meta Platforms. All trademarks, logos, and brand names
              are the property of their respective owners. TikGram does not host or store any media files on its
              servers.
            </p>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TikGram Media. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ========================================================================== */}
      {/* GOOGLE ADSENSE COMPLIANCE LEGAL MODALS */}
      {/* ========================================================================== */}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa-solid fa-user-shield"></i> Privacy Policy
              </h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Effective Date:</strong> January 1, 2026
              </p>
              <p>
                At TikGram, we take your personal privacy very seriously. This Privacy Policy outlines how your
                information is handled when utilizing our web utility.
              </p>
              <h3>1. Information We Do NOT Collect</h3>
              <p>
                TikGram does not require user registration or account creation. We do not store, catalog, or archive
                the URLs you paste, nor do we host or copy downloaded video content.
              </p>
              <h3>2. Server Logs and Web Analytics</h3>
              <p>
                Standard anonymous telemetry (such as browser user-agent and IP addresses) is processed purely in
                volatile memory to protect against DDoS attacks and brute-force scraping.
              </p>
              <h3>3. Google AdSense &amp; Third-Party Cookies</h3>
              <p>
                We may partner with third-party advertising vendors such as Google AdSense to serve ads. Google uses
                cookies (such as the DoubleClick cookie) to serve ads based on visits to this and other websites. You
                may opt out of personalized advertising by visiting Google Ads Settings.
              </p>
              <h3>4. Contact</h3>
              <p>For inquiries, reach out to privacy@tikgram.app.</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa-solid fa-file-contract"></i> Terms of Service
              </h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Effective Date:</strong> January 1, 2026
              </p>
              <p>
                By accessing and utilizing TikGram, you agree to be bound by the following terms and conditions.
              </p>
              <h3>1. Personal &amp; Fair Use Only</h3>
              <p>
                TikGram is provided exclusively for personal, fair-use backup and educational purposes. Users agree not
                to infringe upon the intellectual property of original content creators.
              </p>
              <h3>2. Prohibited Conduct</h3>
              <p>
                Users agree not to flood the service with automated requests, attempt denial-of-service (DDoS) attacks,
                or inject malicious code.
              </p>
              <h3>3. Limitation of Liability</h3>
              <p>
                TikGram is provided &quot;as-is&quot; without warranty of any kind. Under no circumstances shall TikGram be liable
                for any direct, indirect, or incidental damages resulting from the use of this service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DMCA Disclaimer Modal */}
      {activeModal === 'dmca' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa-solid fa-scale-balanced"></i> DMCA &amp; Copyright Policy
              </h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                TikGram respects intellectual property rights and adheres strictly to the Digital Millennium Copyright
                Act (DMCA).
              </p>
              <h3>1. No Media Hosted on Servers</h3>
              <p>
                TikGram does not host, upload, store, or cache any copyrighted video or audio on our servers. All media
                is streamed directly from publicly available third-party CDN nodes.
              </p>
              <h3>2. Copyright Infringement Notices</h3>
              <p>
                If you are a copyright owner or authorized representative wishing to restrict your content from being
                queried by this search utility, please contact dmca@tikgram.app with proof of ownership and the exact
                URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {activeModal === 'contact' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa-solid fa-envelope"></i> Contact Us
              </h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>We welcome your questions, feedback, bug reports, and copyright inquiries.</p>
              <div className="contact-methods">
                <div className="contact-item">
                  <i className="fa-solid fa-at"></i>
                  <div>
                    <strong>General Support:</strong> support@tikgram.app
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fa-solid fa-shield-halved"></i>
                  <div>
                    <strong>DMCA &amp; Legal:</strong> dmca@tikgram.app
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fa-solid fa-briefcase"></i>
                  <div>
                    <strong>Partnerships &amp; Ads:</strong> ads@tikgram.app
                  </div>
                </div>
              </div>
              <p className="contact-note">
                Our support team typically responds to inquiries within 24 to 48 business hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
