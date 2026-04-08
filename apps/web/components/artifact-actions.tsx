'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonClassName } from '@packages/ui';
import { getEvaluationArtifactStatus, requestEvaluationArtifact } from '../lib/client-api';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ArtifactActions({
  evaluationId,
  className
}: {
  evaluationId: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestArtifact = (kind: 'csv' | 'pdf') => {
    startTransition(async () => {
      setErrorMessage(null);

      try {
        const artifact = await requestEvaluationArtifact(evaluationId, { kind });
        let latestArtifact = artifact;

        for (let attempt = 0; attempt < 45; attempt += 1) {
          if (latestArtifact.status === 'ready') {
            break;
          }

          if (latestArtifact.status === 'failed') {
            throw new Error(
              latestArtifact.errorMessage ??
                `Unable to generate the ${kind.toUpperCase()} artifact.`
            );
          }

          await sleep(1000);
          latestArtifact = await getEvaluationArtifactStatus(evaluationId, artifact.id);
        }

        if (latestArtifact.status !== 'ready') {
          throw new Error(
            `The ${kind.toUpperCase()} artifact is still processing. Refresh the page and try downloading again in a moment.`
          );
        }

        const response = await fetch(
          `/api/evaluations/${evaluationId}/artifacts/${latestArtifact.id}/download`,
          {
            credentials: 'same-origin'
          }
        );

        if (!response.ok) {
          throw new Error(`Unable to download the ${kind.toUpperCase()} artifact.`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = latestArtifact.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to generate the export artifact.'
        );
      }
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        <Button
          data-testid="artifact-request-csv"
          disabled={isPending}
          onClick={() => requestArtifact('csv')}
          type="button"
          variant="secondary"
        >
          {isPending ? 'Generating...' : 'Generate CSV'}
        </Button>
        <Button
          data-testid="artifact-request-pdf"
          disabled={isPending}
          onClick={() => requestArtifact('pdf')}
          type="button"
          variant="ghost"
        >
          {isPending ? 'Generating...' : 'Generate PDF'}
        </Button>
        <a
          className={buttonClassName({ variant: 'ghost' })}
          href={`/app/evaluate/${evaluationId}/revisions`}
        >
          Artifact history
        </a>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
