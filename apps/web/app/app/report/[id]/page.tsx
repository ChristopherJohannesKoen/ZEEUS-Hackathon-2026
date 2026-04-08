import { forbidden, notFound } from 'next/navigation';
import { ApiRequestError } from '../../../../lib/api-error';
import { ReportDocument } from '../../../../components/report-document';
import { getEvaluationReport } from '../../../../lib/server-api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function ReportPage({ params }: { params: Params }) {
  const { id } = await params;

  try {
    const report = await getEvaluationReport(id);
    return <ReportDocument report={report} showToolbar />;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 404) {
        notFound();
      }

      if (error.statusCode === 403) {
        forbidden();
      }
    }

    throw error;
  }
}
