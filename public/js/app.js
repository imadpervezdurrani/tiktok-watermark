// TikGram Client Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const downloadForm = document.getElementById('downloadForm');
  const videoUrlInput = document.getElementById('videoUrlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const submitBtn = document.getElementById('submitBtn');
  const inputStatusIcon = document.getElementById('inputStatusIcon');
  
  const loaderCard = document.getElementById('loaderCard');
  const loaderStatusText = document.getElementById('loaderStatusText');
  const loaderSubText = document.getElementById('loaderSubText');
  
  const resultCard = document.getElementById('resultCard');
  const videoPreview = document.getElementById('videoPreview');
  const imagePreview = document.getElementById('imagePreview');
  const platformBadge = document.getElementById('platformBadge');
  const authorAvatar = document.getElementById('authorAvatar');
  const authorName = document.getElementById('authorName');
  const authorHandle = document.getElementById('authorHandle');
  const videoDuration = document.getElementById('videoDuration');
  const videoTitle = document.getElementById('videoTitle');
  const downloadButtons = document.getElementById('downloadButtons');
  const newSearchBtn = document.getElementById('newSearchBtn');
  const shareResultBtn = document.getElementById('shareResultBtn');

  const platformTabs = document.querySelectorAll('.platform-tab');
  const demoChips = document.querySelectorAll('.chip');
  
  // History Elements
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');

  // FAQ Elements
  const faqItems = document.querySelectorAll('.faq-item');

  let currentPlatform = 'all';
  let lastExtractedData = null;

  // Monetag SmartLink Direct Monetization
  const MONETAG_SMARTLINK = 'https://omg10.com/4/11841288';
  function triggerMonetizationAd() {
    try {
      window.open(MONETAG_SMARTLINK, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.debug('Monetag ad open error:', e);
    }
  }

  // Initialize
  loadHistory();

  // --- Platform Tabs ---
  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      platformTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPlatform = tab.dataset.platform;
      updateInputPlaceholder();
    });
  });

  function updateInputPlaceholder() {
    if (currentPlatform === 'tiktok') {
      videoUrlInput.placeholder = 'Paste TikTok link (e.g. https://www.tiktok.com/@... or vt.tiktok.com/...)';
    } else if (currentPlatform === 'instagram') {
      videoUrlInput.placeholder = 'Paste Instagram Reel or Post link (e.g. https://www.instagram.com/reel/...)';
    } else {
      videoUrlInput.placeholder = 'Paste TikTok or Instagram link here...';
    }
  }

  // --- Input Change & Auto-detection ---
  videoUrlInput.addEventListener('input', () => {
    const val = videoUrlInput.value.trim();
    if (val.length > 0) {
      clearBtn.classList.remove('hidden');
      detectPlatform(val);
    } else {
      clearBtn.classList.add('hidden');
      resetPlatformIcon();
    }
  });

  function detectPlatform(url) {
    if (/tiktok\.com/i.test(url)) {
      inputStatusIcon.className = 'fa-brands fa-tiktok';
      inputStatusIcon.style.color = '#00f2fe';
    } else if (/instagram\.com/i.test(url)) {
      inputStatusIcon.className = 'fa-brands fa-instagram';
      inputStatusIcon.style.color = '#f56040';
    } else {
      resetPlatformIcon();
    }
  }

  function resetPlatformIcon() {
    inputStatusIcon.className = 'fa-solid fa-link';
    inputStatusIcon.style.color = '';
  }

  // --- Paste from Clipboard ---
  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          videoUrlInput.value = text.trim();
          clearBtn.classList.remove('hidden');
          detectPlatform(text);
          showToast('Link pasted from clipboard!', 'success');
        }
      } else {
        videoUrlInput.focus();
        showToast('Please press Ctrl+V to paste link', 'info');
      }
    } catch (err) {
      videoUrlInput.focus();
      showToast('Clipboard access denied, please paste manually', 'error');
    }
  });

  // --- Clear Input ---
  clearBtn.addEventListener('click', () => {
    videoUrlInput.value = '';
    clearBtn.classList.add('hidden');
    resetPlatformIcon();
    videoUrlInput.focus();
  });

  // --- Demo Chips ---
  demoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.sample;
      if (type === 'tiktok') {
        videoUrlInput.value = 'https://www.tiktok.com/@tiktok/video/7342898982310128938';
      } else if (type === 'instagram') {
        videoUrlInput.value = 'https://www.instagram.com/reel/C3x9aL1M_9b/';
      }
      clearBtn.classList.remove('hidden');
      detectPlatform(videoUrlInput.value);
      videoUrlInput.focus();
    });
  });

  // --- Form Submit ---
  downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let url = videoUrlInput.value.trim();

    if (!url) {
      showToast('Please enter a video URL', 'error');
      return;
    }

    // Extract URL if extra text was included from mobile share
    const match = url.match(/https?:\/\/[^\s]+/i);
    if (match) {
      url = match[0];
      videoUrlInput.value = url;
    } else if (/^(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com|instagram\.com)/i.test(url)) {
      url = 'https://' + url;
      videoUrlInput.value = url;
    }

    if (!/tiktok\.com|instagram\.com/i.test(url)) {
      showToast('Please enter a valid TikTok or Instagram link', 'error');
      return;
    }

    startExtraction(url);
  });

  // --- Extraction Process ---
  async function startExtraction(url) {
    // UI state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
    resultCard.classList.add('hidden');
    loaderCard.classList.remove('hidden');
    loaderCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Step updates
    const steps = [
      { text: 'Connecting to video server...', sub: 'Locating original media stream' },
      { text: 'Bypassing watermark...', sub: 'Extracting pristine clean video feed' },
      { text: 'Generating HD download options...', sub: 'Finalizing high-speed file streams' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      loaderStatusText.textContent = steps[stepIndex].text;
      loaderSubText.textContent = steps[stepIndex].sub;
    }, 900);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch video details');
      }

      displayResult(data, url);
      saveToHistory(data, url);
      showToast('Video ready for download!', 'success');
    } catch (err) {
      clearInterval(interval);
      showToast(err.message || 'Error occurred while processing video', 'error');
    } finally {
      loaderCard.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-text">Download</span> <i class="fa-solid fa-arrow-down"></i>';
    }
  }

  // --- Display Result Card ---
  function displayResult(data, sourceUrl) {
    lastExtractedData = { data, sourceUrl };
    resultCard.classList.remove('hidden');

    // Title
    videoTitle.textContent = data.title || 'Untitled Media';

    // Author
    if (data.author) {
      authorName.textContent = data.author.nickname || data.author.username || 'Creator';
      authorHandle.textContent = `@${data.author.username || 'user'}`;
      if (data.author.avatar) {
        authorAvatar.src = data.author.avatar;
        authorAvatar.classList.remove('hidden');
      } else {
        authorAvatar.classList.add('hidden');
      }
    }

    // Duration
    if (data.duration) {
      const mins = Math.floor(data.duration / 60);
      const secs = Math.floor(data.duration % 60);
      videoDuration.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      videoDuration.classList.remove('hidden');
    } else {
      videoDuration.classList.add('hidden');
    }

    // Platform Badge
    const isTk = data.platform === 'tiktok';
    platformBadge.className = `platform-badge-overlay ${isTk ? 'tiktok' : 'instagram'}`;
    platformBadge.innerHTML = isTk 
      ? '<i class="fa-brands fa-tiktok"></i> TikTok' 
      : '<i class="fa-brands fa-instagram"></i> Instagram';

    // Media Preview
    if (data.downloads && data.downloads[0] && data.downloads[0].url) {
      videoPreview.src = data.downloads[0].url;
      if (data.thumbnail) {
        videoPreview.poster = data.thumbnail;
      }
      videoPreview.classList.remove('hidden');
      imagePreview.classList.add('hidden');
    } else if (data.thumbnail) {
      imagePreview.src = data.thumbnail;
      imagePreview.classList.remove('hidden');
      videoPreview.classList.add('hidden');
    }

    // Download Buttons Generation
    downloadButtons.innerHTML = '';

    // Video downloads
    if (data.downloads && data.downloads.length > 0) {
      data.downloads.forEach((dl, idx) => {
        const btn = document.createElement('a');
        btn.className = `dl-btn ${idx === 0 ? 'dl-btn-hd' : 'dl-btn-sd'}`;
        
        // Proxy URL for direct download
        const proxyUrl = `/api/download?url=${encodeURIComponent(dl.url)}&title=${encodeURIComponent(data.title || 'video')}&type=mp4`;
        btn.href = proxyUrl;
        btn.setAttribute('download', `${(data.title || 'video').substring(0, 30)}.mp4`);
        btn.rel = 'noopener noreferrer';

        btn.innerHTML = `
          <div class="dl-left">
            <i class="fa-solid fa-circle-arrow-down dl-icon"></i>
            <div>
              <span>Download ${dl.quality}</span>
              ${dl.badge ? `<span class="dl-badge">${dl.badge}</span>` : ''}
            </div>
          </div>
          <div>
            ${dl.size ? `<span class="dl-size">${dl.size}</span>` : '<span class="dl-size">MP4</span>'}
          </div>
        `;

        // Direct download click handler with toast feedback and Monetag monetization
        btn.addEventListener('click', () => {
          showToast('Starting HD video download...', 'info');
          setTimeout(triggerMonetizationAd, 400);
        });

        downloadButtons.appendChild(btn);
      });
    }

    // Audio download
    if (data.audio && data.audio.url) {
      const audioBtn = document.createElement('a');
      audioBtn.className = 'dl-btn dl-btn-audio';
      const audioProxyUrl = `/api/download?url=${encodeURIComponent(data.audio.url)}&title=${encodeURIComponent(data.title || 'audio')}&type=mp3`;
      audioBtn.href = audioProxyUrl;
      audioBtn.setAttribute('download', `${(data.title || 'audio').substring(0, 30)}.mp3`);
      audioBtn.rel = 'noopener noreferrer';

      audioBtn.innerHTML = `
        <div class="dl-left">
          <i class="fa-solid fa-music dl-icon"></i>
          <div>
            <span>Download Audio Only</span>
            <span class="dl-badge">MP3</span>
          </div>
        </div>
        <span class="dl-size">Audio</span>
      `;

      audioBtn.addEventListener('click', () => {
        showToast('Starting MP3 audio download...', 'info');
        setTimeout(triggerMonetizationAd, 400);
      });

      downloadButtons.appendChild(audioBtn);
    }

    // Thumbnail download
    if (data.thumbnail) {
      const thumbBtn = document.createElement('a');
      thumbBtn.className = 'dl-btn dl-btn-sd';
      thumbBtn.href = data.thumbnail;
      thumbBtn.target = '_blank';
      thumbBtn.setAttribute('download', 'cover.jpg');
      thumbBtn.innerHTML = `
        <div class="dl-left">
          <i class="fa-regular fa-image dl-icon"></i>
          <span>Download Cover / Thumbnail</span>
        </div>
        <span class="dl-size">JPG</span>
      `;
      downloadButtons.appendChild(thumbBtn);
    }

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Reset / Search Again ---
  newSearchBtn.addEventListener('click', () => {
    videoUrlInput.value = '';
    clearBtn.classList.add('hidden');
    resetPlatformIcon();
    resultCard.classList.add('hidden');
    videoPreview.pause();
    videoUrlInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Share Result ---
  shareResultBtn.addEventListener('click', () => {
    if (navigator.share && lastExtractedData) {
      navigator.share({
        title: lastExtractedData.data.title || 'TikGram Download',
        text: 'Download TikTok & Instagram videos without watermark!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Website link copied to clipboard!', 'success');
    }
  });

  // --- Download History (localStorage) ---
  function saveToHistory(data, url) {
    let history = JSON.parse(localStorage.getItem('tikgram_history') || '[]');
    const newItem = {
      id: Date.now(),
      title: data.title || 'Video',
      platform: data.platform || 'video',
      thumbnail: data.thumbnail || '',
      url: url,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Filter duplicates
    history = history.filter(item => item.url !== url);
    history.unshift(newItem);
    if (history.length > 20) history.pop();

    localStorage.setItem('tikgram_history', JSON.stringify(history));
    loadHistory();
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem('tikgram_history') || '[]');
    historyCount.textContent = history.length;

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-history">
          <i class="fa-regular fa-folder-open"></i>
          <p>No recent downloads yet</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        ${item.thumbnail ? `<img src="${item.thumbnail}" class="history-thumb" alt="Thumb">` : ''}
        <div class="history-info">
          <div class="history-title">${escapeHtml(item.title)}</div>
          <div class="history-time"><i class="fa-regular fa-clock"></i> ${item.time} &bull; ${item.platform.toUpperCase()}</div>
        </div>
        <button class="btn btn-glass btn-sm history-reload" title="Re-download">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </button>
      `;

      div.querySelector('.history-reload').addEventListener('click', () => {
        closeDrawer();
        videoUrlInput.value = item.url;
        clearBtn.classList.remove('hidden');
        detectPlatform(item.url);
        startExtraction(item.url);
      });

      historyList.appendChild(div);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('tikgram_history');
    loadHistory();
    showToast('Download history cleared', 'info');
  });

  // Drawer Toggles
  historyToggleBtn.addEventListener('click', openDrawer);
  closeHistoryBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  function openDrawer() {
    historyDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
  }

  function closeDrawer() {
    historyDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }

  // --- FAQ Accordion ---
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // --- Legal Policy Modals (AdSense Compliance) ---
  const legalModals = {
    privacy: document.getElementById('privacyModal'),
    terms: document.getElementById('termsModal'),
    dmca: document.getElementById('dmcaModal'),
    contact: document.getElementById('contactModal')
  };

  const legalLinks = {
    linkPrivacy: 'privacy',
    linkTerms: 'terms',
    linkDmca: 'dmca',
    linkContact: 'contact'
  };

  Object.entries(legalLinks).forEach(([id, modalKey]) => {
    const linkEl = document.getElementById(id);
    if (linkEl) {
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        openLegalModal(modalKey);
      });
    }
  });

  function openLegalModal(key) {
    closeAllLegalModals();
    const modal = legalModals[key];
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeAllLegalModals() {
    Object.values(legalModals).forEach(modal => {
      if (modal) modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  // Close on modal-close button or backdrop click
  document.querySelectorAll('.legal-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal-close')) {
        closeAllLegalModals();
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllLegalModals();
      closeDrawer();
    }
  });

  // Check URL hash on initial load (e.g. #privacy, #terms, #dmca, #contact)
  const initialHash = window.location.hash.replace('#', '');
  if (legalModals[initialHash]) {
    openLegalModal(initialHash);
  }

  // --- Toast Notification ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `<i class="${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 280);
    }, 3500);
  }

  function escapeHtml(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }
});

