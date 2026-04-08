import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { connection } from 'next/server';
import { resolveSiteOrigin } from '../lib/runtime-mode';
import './globals.css';

const brandFont = Montserrat({
  subsets: ['latin'],
  variable: '--font-brand',
  weight: ['400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteOrigin()),
  title: {
    default: 'ZEEUS Sustainability by Design Tool',
    template: '%s | ZEEUS'
  },
  description:
    'A founder-friendly guidance tool from IfaS at Trier University of Applied Sciences under the ZEEUS project, helping startups explore SDGs, ESRS double materiality, risks, opportunities, and practical next steps.',
  applicationName: 'ZEEUS',
  icons: {
    icon: '/brand/zeeus/logos/logo-symbol-circle.png',
    shortcut: '/brand/zeeus/logos/logo-symbol-circle.png',
    apple: '/brand/zeeus/logos/logo-symbol-circle.png'
  },
  openGraph: {
    title: 'ZEEUS Sustainability by Design Tool',
    description:
      'Assess your startup idea through sustainability, risk, and opportunity lenses with guidance from the ZEEUS project and IfaS at Trier University of Applied Sciences.',
    siteName: 'ZEEUS',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZEEUS Sustainability by Design Tool',
    description:
      'A guidance tool, not a judgment tool, for founders exploring SDGs, ESRS dual materiality, material topics, risks, and opportunities.'
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();

  return (
    <html lang="en">
      <body className={`${brandFont.variable} font-sans`}>{children}</body>
    </html>
  );
}
