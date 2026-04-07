'use client';

import { Button } from '@packages/ui';

export function PrintReportButton({ evaluationId }: { evaluationId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        className="btn-secondary"
        data-testid="report-download-pdf"
        href={`/api/evaluations/${evaluationId}/export.pdf`}
      >
        Download PDF
      </a>
      <Button
        className="bg-[#00654A] hover:bg-[#0b7a59]"
        data-testid="report-print"
        onClick={() => {
          window.print();
        }}
        type="button"
      >
        Print report
      </Button>
    </div>
  );
}
