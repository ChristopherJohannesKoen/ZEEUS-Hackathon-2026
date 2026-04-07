"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ZeeusLogo } from "./ZeeusLogo";
import { useEvaluationStore } from "@/store/evaluationStore";
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  Leaf,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/evaluations", label: "Evaluations", icon: ClipboardList },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useEvaluationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-border flex flex-col",
          "transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-5 border-b border-surface-border flex-shrink-0">
          <Link href="/app" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <ZeeusLogo />
          </Link>
          <button
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-surface-muted"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-brand/10 text-brand-dark font-semibold"
                    : "text-gray-600 hover:bg-surface-muted hover:text-gray-900"
                )}
              >
                <Icon size={16} className={active ? "text-brand" : "text-gray-400"} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 pb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Quick Actions
            </p>
            <Link
              href="/app/evaluate/start"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-dark bg-brand/8 hover:bg-brand/15 transition-all duration-150"
            >
              <Plus size={16} className="text-brand" />
              New Evaluation
            </Link>
          </div>

          <div className="pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Resources
            </p>
            <a
              href="#"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-surface-muted hover:text-gray-900 transition-all duration-150"
            >
              <BookOpen size={16} className="text-gray-400" />
              User Guide
            </a>
            <a
              href="#"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-surface-muted hover:text-gray-900 transition-all duration-150"
            >
              <Leaf size={16} className="text-gray-400" />
              SDG Reference
            </a>
          </div>
        </nav>

        {/* User menu */}
        <div className="border-t border-surface-border p-3">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-surface-muted transition-all duration-150"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold flex-shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="mt-1 rounded-xl border border-surface-border bg-white shadow-card-hover overflow-hidden">
              <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-surface-muted">
                <User size={14} />
                Profile
              </button>
              <Link
                href="/login"
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={14} />
                Sign out
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center h-14 px-4 bg-white border-b border-surface-border z-30 sticky top-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-muted"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <ZeeusLogo className="mx-auto" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
