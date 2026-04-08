'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, cn } from '@packages/ui';
import type { SessionUser } from '@packages/shared';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './logout-button';
import { ZeeusLogo } from './zeeus-logo';

function initials(name: string) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '');

  return letters.join('') || 'ZU';
}

function roleTone(role: SessionUser['role']) {
  if (role === 'owner') return 'amber';
  if (role === 'admin') return 'emerald';
  return 'slate';
}

export function AppShell({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser: SessionUser;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { href: '/app', label: 'Overview' },
    { href: '/app/evaluations', label: 'Evaluations' },
    { href: '/app/organization', label: 'Organization' },
    { href: '/app/programs', label: 'Programs' },
    { href: '/app/settings', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-surface text-slate-900">
      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[#163126]/35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-6">
        <aside
          className={cn(
            'fixed inset-y-4 left-4 z-40 flex w-[280px] flex-col rounded-[32px] border border-surface-border bg-white shadow-card transition lg:static lg:inset-auto lg:w-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-[115%] lg:translate-x-0'
          )}
        >
          <div className="flex items-center justify-between border-b border-surface-border px-6 py-5">
            <Link href="/app" onClick={() => setSidebarOpen(false)}>
              <ZeeusLogo />
            </Link>
            <button
              className="rounded-xl border border-surface-border px-3 py-1 text-xs font-semibold text-slate-500 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="border-b border-surface-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white">
                {initials(currentUser.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{currentUser.name}</p>
                <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge tone={roleTone(currentUser.role)}>{currentUser.role}</Badge>
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Single tenant
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-6 px-4 py-5">
            <div className="space-y-2">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Navigation
              </p>
              {navigationItems.map((item) => {
                const active =
                  item.href === '/app'
                    ? pathname === '/app'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    className={cn(
                      'block rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      active
                        ? 'bg-brand/10 text-brand-dark'
                        : 'text-slate-600 hover:bg-surface-muted hover:text-slate-950'
                    )}
                    data-testid={`sidebar-nav-${item.label.toLowerCase()}`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-3 rounded-[28px] bg-[#f4f9ee] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#58724d]">
                Quick action
              </p>
              <Link
                className="btn-primary w-full bg-brand text-center hover:bg-brand-dark"
                href="/app/evaluate/start"
                onClick={() => setSidebarOpen(false)}
              >
                Start evaluation
              </Link>
              <p className="text-xs leading-6 text-slate-600">
                Reproduce the workbook flow, save each step, and export a report directly from the
                dashboard.
              </p>
            </div>

            <div className="space-y-2">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Resources
              </p>
              <Link
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-surface-muted hover:text-slate-950"
                href="/resources"
              >
                Resource center
              </Link>
              <Link
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-surface-muted hover:text-slate-950"
                href="/partners"
              >
                Partner programs
              </Link>
              <a
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-surface-muted hover:text-slate-950"
                href="https://sdgs.un.org/goals"
                rel="noreferrer"
                target="_blank"
              >
                Official SDGs
              </a>
              <Link
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-surface-muted hover:text-slate-950"
                href="/"
              >
                Public site
              </Link>
            </div>
          </nav>

          <div className="border-t border-surface-border px-4 py-4">
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex items-center justify-between rounded-[28px] border border-surface-border bg-white px-5 py-4 shadow-card lg:hidden">
            <button
              className="rounded-xl border border-surface-border px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              Menu
            </button>
            <ZeeusLogo compact />
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-xs font-black text-white">
              {initials(currentUser.name)}
            </div>
          </header>

          <main className="min-w-0 rounded-[32px] border border-surface-border bg-white p-5 shadow-card lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
