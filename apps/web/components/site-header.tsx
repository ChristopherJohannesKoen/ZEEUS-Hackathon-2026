import Link from 'next/link';
import { buttonClassName } from '@packages/ui';
import type { SessionUser } from '@packages/shared';
import { ZeeusLogo } from './zeeus-logo';

export function SiteHeader({ currentUser }: { currentUser?: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-border/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0">
          <ZeeusLogo />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/app"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-brand-dark md:inline-flex"
          >
            Workspace
          </Link>
          {currentUser ? (
            <Link className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })} href="/app">
              {currentUser.name}
            </Link>
          ) : (
            <>
              <Link className={buttonClassName({ variant: 'ghost', className: 'text-slate-700 hover:bg-surface-muted' })} href="/login">
                Sign in
              </Link>
              <Link className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })} href="/signup">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
