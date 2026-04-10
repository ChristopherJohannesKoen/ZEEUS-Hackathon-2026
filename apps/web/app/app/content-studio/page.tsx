import { forbidden } from 'next/navigation';
import { Card } from '@packages/ui';
import { ContentStudioClient } from '../../../components/content-studio-client';
import { ApiRequestError } from '../../../lib/api-error';
import { getEditorialOverview, requireCurrentUser } from '../../../lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ContentStudioPage() {
  const currentUser = await requireCurrentUser();

  try {
    const overview = await getEditorialOverview();

    return (
      <div className="grid gap-6">
        <Card className="border-surface-border">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
            Content studio
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Editorial and download admin</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Owner/admin controls for the public ZEEUS site. Publish knowledge pages, curate the
            download center, and keep partner-facing content current without editing seed data.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
            Signed in as {currentUser.role}
          </p>
        </Card>

        <ContentStudioClient overview={overview} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 403) {
      forbidden();
    }

    throw error;
  }
}
