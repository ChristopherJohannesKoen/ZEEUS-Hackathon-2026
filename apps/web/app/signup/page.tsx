import { redirect } from 'next/navigation';
import { AuthTopLevelGuard } from '../../components/auth-top-level-guard';
import { SignUpForm } from '../../components/sign-up-form';
import { getCurrentUser, getSsoProviders } from '../../lib/server-api';

export default async function SignupPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect('/app');
  }

  const ssoProviders = await getSsoProviders();

  if (!ssoProviders.localAuthEnabled) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <AuthTopLevelGuard />
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Create your workspace</p>
          <p className="text-sm text-slate-600">
            Create a team account to save evaluations, revisit the wizard, and export reports.
          </p>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
