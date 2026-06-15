import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap', preload: true })

export const metadata: Metadata = {
  title: 'Mal Approval Engine',
  description: 'Config-driven, multi-flow internal approval engine. Budget requests, leave, and more — one platform, every flow is a config file.',
  metadataBase: new URL('https://mal-approval-engine.vercel.app'),
  openGraph: {
    title: 'Mal Approval Engine',
    description: 'Config-driven, multi-flow internal approval engine. Budget requests, leave, and more — one platform, every flow is a config file.',
    url: 'https://mal-approval-engine.vercel.app',
    siteName: 'Mal Approval Engine',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mal Approval Engine',
    description: 'Config-driven, multi-flow internal approval engine. Budget requests, leave, and more — one platform, every flow is a config file.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body className="antialiased bg-[var(--mal-bg-white-0)] text-[var(--mal-text-strong-950)]">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
