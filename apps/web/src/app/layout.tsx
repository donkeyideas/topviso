import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.topviso.com'),
  title: 'Top Viso — The full map of how your app gets found',
  description:
    'Track your app across App Store, Play Store, ChatGPT, Claude, Gemini, Perplexity, and Copilot. The only app store optimization platform built for the AI era.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Top Viso',
                legalName: 'Donkey Ideas LLC',
                url: 'https://www.topviso.com',
                logo: 'https://www.topviso.com/apple-icon.png',
                description:
                  'The app store optimization platform built for the AI era — tracking how apps get found across the App Store, Play Store, and large language models.',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Top Viso',
                url: 'https://www.topviso.com',
              },
            ]),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-E3RT04KNRR" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-E3RT04KNRR');`}
      </Script>
    </html>
  )
}
