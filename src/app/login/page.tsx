'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZeeusLogo } from '@/components/layout/ZeeusLogo';
import { Input } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mocked auth — always succeeds
    router.push('/app');
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel – decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-zeeus-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 600 800" fill="none">
            <circle cx="100" cy="100" r="250" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="500" cy="400" r="300" stroke="white" strokeWidth="0.8" fill="none" />
            <circle cx="200" cy="700" r="200" stroke="white" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        <div className="relative z-10 text-center max-w-md">
          <ZeeusLogo dark className="justify-center mb-8" />
          <h2 className="text-3xl font-black text-white mb-4">Sustainability by Design</h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Guide your startup toward impact and resilience with the ZEEUS SbyD Tool.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'SDGs', value: '17' },
              { label: 'ESRS Topics', value: '10' },
              { label: 'Minutes', value: '~30' }
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                <div className="text-3xl font-black text-zeeus-lime">{stat.value}</div>
                <div className="text-white/70 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>

          <div className="lg:hidden mb-6">
            <ZeeusLogo />
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to access your evaluations.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  defaultValue="alex@greenventure.io"
                  className="w-full rounded-xl border border-surface-border bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full rounded-xl border border-surface-border bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Sign in to ZEEUS
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Demo mode: any credentials work.</p>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-border text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
