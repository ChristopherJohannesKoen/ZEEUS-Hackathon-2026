import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ReportResponseSchema } from '@packages/shared';
import { ReportDocument } from '../../../../../components/report-document';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ revisionNumber?: string }>;

async function fetchInternalReport(evaluationId: string, revisionNumber?: number) {
  const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:4000';
  const token = process.env.INTERNAL_SERVICE_TOKEN;

  if (!token) {
    throw new Error('INTERNAL_SERVICE_TOKEN is not configured for internal report rendering.');
  }

  const url = new URL(`${apiOrigin}/api/internal/evaluations/${evaluationId}/report`);

  if (revisionNumber) {
    url.searchParams.set('revisionNumber', String(revisionNumber));
  }

  const response = await fetch(url, {
    headers: {
      'x-internal-service-token': token
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }

    throw new Error(`Internal report render request failed with status ${response.status}.`);
  }

  return ReportResponseSchema.parse(await response.json());
}

export default async function InternalRenderReportPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  const requestHeaders = await headers();

  if (!token || requestHeaders.get('x-internal-service-token') !== token) {
    notFound();
  }

  const { id } = await params;
  const query = await searchParams;
  const revisionNumber = query.revisionNumber ? Number(query.revisionNumber) : undefined;
  const report = await fetchInternalReport(id, revisionNumber);

  return (
    <main className="min-h-screen bg-white px-8 py-10">
      <ReportDocument report={report} />
    </main>
  );
}
