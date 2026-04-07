'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonClassName } from '@packages/ui';
import type { EvaluationStatus } from '@packages/shared';
import {
  archiveEvaluation,
  completeEvaluation,
  reopenEvaluation,
  unarchiveEvaluation
} from '../lib/client-api';

export function EvaluationLifecycleActions({
  evaluationId,
  status,
  className
}: {
  evaluationId: string;
  status: EvaluationStatus;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAction = (action: 'complete' | 'reopen' | 'archive' | 'unarchive') => {
    startTransition(async () => {
      setErrorMessage(null);

      try {
        if (action === 'complete') {
          await completeEvaluation(evaluationId);
          router.refresh();
          return;
        }

        if (action === 'archive') {
          await archiveEvaluation(evaluationId);
          router.refresh();
          return;
        }

        if (action === 'unarchive') {
          await unarchiveEvaluation(evaluationId);
          router.refresh();
          return;
        }

        await reopenEvaluation(evaluationId);
        router.push(`/app/evaluate/${evaluationId}/summary`);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to update the evaluation lifecycle.'
        );
      }
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {(status === 'draft' || status === 'in_progress') && (
          <Button
            className="bg-[#00654A] hover:bg-[#0b7a59]"
            data-testid="evaluation-complete"
            disabled={isPending}
            onClick={() => runAction('complete')}
            type="button"
          >
            Complete evaluation
          </Button>
        )}

        {status === 'completed' && (
          <Button
            data-testid="evaluation-archive"
            disabled={isPending}
            onClick={() => runAction('archive')}
            type="button"
            variant="secondary"
          >
            Archive
          </Button>
        )}

        {status === 'archived' && (
          <Button
            data-testid="evaluation-unarchive"
            disabled={isPending}
            onClick={() => runAction('unarchive')}
            type="button"
            variant="secondary"
          >
            Unarchive
          </Button>
        )}

        {(status === 'completed' || status === 'archived') && (
          <Button
            data-testid="evaluation-reopen"
            disabled={isPending}
            onClick={() => runAction('reopen')}
            type="button"
            variant="ghost"
          >
            Reopen as draft
          </Button>
        )}

        <Link
          className={buttonClassName({ variant: 'secondary' })}
          data-testid="evaluation-revisions-link"
          href={`/app/evaluate/${evaluationId}/revisions`}
        >
          Revision history
        </Link>
        <a
          className={buttonClassName({ variant: 'ghost' })}
          data-testid="evaluation-export-pdf"
          href={`/api/evaluations/${evaluationId}/export.pdf`}
        >
          Download PDF
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
