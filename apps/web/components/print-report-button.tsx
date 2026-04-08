'use client';

import { Button } from '@packages/ui';
import { ArtifactActions } from './artifact-actions';

export function PrintReportButton({ evaluationId }: { evaluationId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <ArtifactActions evaluationId={evaluationId} />
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
