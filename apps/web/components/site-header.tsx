import Link from 'next/link';
import { buttonClassName } from '@packages/ui';
import type { SessionUser } from '@packages/shared';
import { isPublicSpaceMode } from '../lib/runtime-mode';
import { ZeeusLogo } from './zeeus-logo';

export function SiteHeader({ currentUser }: { currentUser?: SessionUser }) {
  const publicPreviewMode = isPublicSpaceMode;
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#what-you-get', label: 'What you get' },
    { href: '/#about-zeeus', label: 'About ZEEUS' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' }
  ];
  const primaryHref = publicPreviewMode
    ? '/how-it-works'
    : currentUser
      ? '/app/evaluate/start'
      : '/signup';
  const primaryLabel = publicPreviewMode ? 'Explore workflow' : 'Start evaluation';

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-white/95 backdrop-blur">
      <div className="border-b border-surface-border/80 bg-brand-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-[11px] font-medium tracking-[0.08em] text-white/78">
          <p>Developed by IfaS | Trier University of Applied Sciences under the ZEEUS project.</p>
          <div className="hidden items-center gap-4 md:flex">
            <Link className="transition hover:text-white" href="/#about-zeeus">
              About ZEEUS
            </Link>
            <Link className="transition hover:text-white" href="/contact">
              Contact
            </Link>
            <Link className="transition hover:text-white" href="/resources">
              Resources
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0">
          <ZeeusLogo priority />
        </Link>
        <nav className="flex items-center gap-3">
          <div className="hidden items-center gap-5 xl:flex">
            {navLinks.map((item) => (
              <Link
                className="text-sm font-medium text-slate-600 transition hover:text-brand-dark"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {currentUser ? (
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href="/app"
            >
              Open workspace
            </Link>
          ) : publicPreviewMode ? (
            <>
              <Link
                className={buttonClassName({
                  variant: 'ghost',
                  className: 'text-slate-700 hover:bg-surface-muted'
                })}
                href="/resources"
              >
                Resources
              </Link>
              <Link
                className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
            </>
          ) : (
            <>
              <Link
                className={buttonClassName({
                  variant: 'ghost',
                  className: 'text-slate-700 hover:bg-surface-muted'
                })}
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
