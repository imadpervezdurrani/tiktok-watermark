import './globals.css';

export const metadata = {
  metadataBase: new URL('https://tikgram.app'),
  title: 'TikGram - TikTok & Instagram Video Downloader Without Watermark | Free HD & MP3',
  description: 'Free online tool to download TikTok and Instagram Reels, Stories, and videos without watermark in Ultra HD 1080p / 4K. Fast, unlimited, secure with MP3 audio extraction.',
  keywords: [
    'tiktok video downloader without watermark',
    'download tiktok video no watermark',
    'tiktok to mp3 converter',
    'instagram reels downloader hd',
    'instagram story downloader',
    'save tiktok hd video',
    'tikwm',
    'snaptik alternative',
    'ssstiktok alternative',
    'fast video downloader online'
  ],
  authors: [{ name: 'TikGram Media' }],
  creator: 'TikGram',
  publisher: 'TikGram Media',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://tikgram.app',
  },
  openGraph: {
    title: 'TikGram - TikTok & Instagram Video Downloader (No Watermark)',
    description: 'Download HD TikTok & Instagram Videos without watermark in seconds. 100% Free, Secure & Fast.',
    url: 'https://tikgram.app',
    siteName: 'TikGram',
    images: [
      {
        url: 'https://tikgram.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TikGram Video Downloader',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TikGram - HD TikTok & Instagram Video Downloader Without Watermark',
    description: 'Download crisp HD videos from TikTok and Instagram without watermark for free.',
    images: ['https://tikgram.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  }
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TikGram Video Downloader',
  url: 'https://tikgram.app',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All (Web Browser, Windows, macOS, Android, iOS)',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: 'Download TikTok and Instagram videos, reels, and audio tracks in high definition without watermarks.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '28470',
    bestRating: '5',
    worstRating: '1'
  }
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Download TikTok & Instagram Videos Without Watermark',
  description: 'Step-by-step guide to download clean watermark-free MP4 videos and MP3 sounds using TikGram.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Copy Video Link',
      text: 'Open the TikTok or Instagram app, click the Share icon and select Copy Link.'
    },
    {
      '@type': 'HowToStep',
      name: 'Paste Link in TikGram',
      text: 'Open TikGram in your browser and paste the link into the search box.'
    },
    {
      '@type': 'HowToStep',
      name: 'Download HD Video or MP3',
      text: 'Click Get Video and pick HD No Watermark or MP3 Audio to save the file immediately.'
    }
  ]
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I have to pay to download TikTok videos without watermark?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, TikGram is 100% free and unlimited. You never need an account or credit card.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does TikGram store or keep copies of downloaded videos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Never. TikGram does not host, clone, or store any content. All downloads are fetched dynamically from public content delivery networks directly to your device.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I download Instagram Reels and Stories?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, TikGram fully supports public Instagram Reels, videos, and post media in original high quality.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does TikGram work on iPhone (iOS) and Android?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! TikGram runs seamlessly in Safari, Chrome, Samsung Internet, and all mobile browsers without requiring any third-party app.'
      }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
