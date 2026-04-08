import Link from 'next/link';
import { buttonClassName } from '@packages/ui';
import type { SessionUser } from '@packages/shared';
import { isPublicSpaceMode } from '../lib/runtime-mode';
import { ZeeusLogo } from './zeeus-logo';

export function SiteHeader({ currentUser }: { currentUser?: SessionUser }) {
  const publicPreviewMode = isPublicSpaceMode;
  const publicLinks = [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/methodology', label: 'Methodology' },
    { href: '/faq', label: 'FAQ' },
    { href: '/partners', label: 'Partners' }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0">
          <ZeeusLogo />
        </Link>
        <nav className="flex items-center gap-4">
          <div className="hidden items-center gap-4 lg:flex">
            {publicLinks.map((item) => (
              <Link
                className="text-sm font-medium text-slate-600 transition hover:text-brand-dark"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href={publicPreviewMode ? '/partners' : '/app'}
            className="hidden text-sm font-medium text-slate-600 transition hover:text-brand-dark md:inline-flex"
          >
            {publicPreviewMode ? 'Programs' : 'Workspace'}
          </Link>
          {currentUser ? (
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href="/app"
            >
              {currentUser.name}
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
                href="/partners"
              >
                Public preview
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
                href="/signup"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
