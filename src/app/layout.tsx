import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZEEUS — Sustainability by Design Tool',
  description:
    'Startup Sustainability Evaluation Tool — Align your startup with SDGs and ESRS dual materiality.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='16' fill='%2339B54A'/><text x='16' y='21' text-anchor='middle' font-family='Inter' font-weight='900' font-size='14' fill='white'>Z</text></svg>"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-surface">{children}</body>
    </html>
  );
}
