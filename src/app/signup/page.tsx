'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZeeusLogo } from '@/components/layout/ZeeusLogo';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Mail, Lock, User, Building2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push('/app');
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <ZeeusLogo className="mb-6" />
        <h1 className="text-2xl font-black text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-8">
          Start building your sustainability roadmap in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">First name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Alex"
                  className="w-full rounded-xl border border-surface-border bg-white pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Last name</label>
              <input
                type="text"
                placeholder="Müller"
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Organisation (optional)
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Your startup name"
                className="w-full rounded-xl border border-surface-border bg-white pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="you@startup.com"
                className="w-full rounded-xl border border-surface-border bg-white pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-surface-border bg-white pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2">
            Create account
          </Button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Demo mode: account creation goes straight to the app.
        </p>

        <div className="mt-6 pt-6 border-t border-surface-border text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
