import Link from 'next/link';
import { buttonClassName } from '@packages/ui';
import type { SessionUser, SiteSettings } from '@packages/shared';
import { ZeeusLogo } from './zeeus-logo';

export function SiteHeader({
  currentUser,
  settings
}: {
  currentUser?: SessionUser;
  settings: SiteSettings;
}) {
  const navLinks = settings.primaryNavigation;
  const utilityLinks = settings.contactLinks;
  const primaryHref = currentUser ? '/app/evaluate/start' : '/signup';
  const primaryLabel = 'Start evaluation';

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-white/95 backdrop-blur">
      <div className="border-b border-surface-border/80 bg-brand-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-[11px] font-medium tracking-[0.08em] text-white/78">
          <p>
            {settings.announcement ??
              'Developed by IfaS | Trier University of Applied Sciences under the ZEEUS project.'}
          </p>
          <div className="hidden items-center gap-4 md:flex">
            {utilityLinks.map((item) => (
              <Link className="transition hover:text-white" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
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
          <details className="xl:hidden">
            <summary className="inline-flex cursor-pointer items-center justify-center rounded-full border border-surface-border px-4 py-2 text-sm font-semibold text-slate-700">
              Menu
            </summary>
            <div className="absolute right-6 top-[5.5rem] z-50 grid min-w-64 gap-2 rounded-3xl border border-surface-border bg-white p-4 shadow-card">
              {navLinks.map((item) => (
                <Link
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#f4f9ee] hover:text-brand-dark"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
              {!currentUser ? (
                <>
                  <Link
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#f4f9ee] hover:text-brand-dark"
                    href="/login"
                  >
                    Sign in
                  </Link>
                  <Link
                    className="rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                    href={primaryHref}
                  >
                    {primaryLabel}
                  </Link>
                </>
              ) : null}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
