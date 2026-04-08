import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import { connection } from 'next/server';
import { resolveSiteOrigin } from '../lib/runtime-mode';
import './globals.css';

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700']
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteOrigin()),
  title: {
    default: 'ZEEUS Sustainability by Design',
    template: '%s | ZEEUS'
  },
  description:
    'A guidance-first sustainability platform for startups, with deterministic assessment scoring, SDG exploration, evidence tracking, scenarios, and partner review workflows.',
  applicationName: 'ZEEUS',
  icons: {
    icon: '/mark.svg',
    shortcut: '/mark.svg',
    apple: '/mark.svg'
  },
  openGraph: {
    title: 'ZEEUS Sustainability by Design',
    description:
      'A guidance-first sustainability platform for startup assessments, evidence, SDG exploration, and co-branded reporting.',
    siteName: 'ZEEUS',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZEEUS Sustainability by Design',
    description:
      'Deterministic startup sustainability assessments with public guidance, evidence, scenarios, and partner review workflows.'
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans`}>{children}</body>
    </html>
  );
}
