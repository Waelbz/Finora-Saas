import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finora · Comptabilité IA',
  description: 'Assistant comptable IA pour experts-comptables et entreprises françaises. Analysez vos factures, relevés bancaires et bulletins de paie. Export ARF Coala pour Sage GE.',
  keywords: 'comptabilité, IA, facture, ARF, Sage, expert-comptable, paie, relevé bancaire',
  authors: [{ name: 'Finora' }],
  openGraph: {
    title: 'Finora · Comptabilité IA',
    description: 'Analysez vos documents comptables avec l\'IA. Export ARF Coala pour Sage Génération Expert.',
    type: 'website',
    locale: 'fr_FR',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
