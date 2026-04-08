'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@packages/ui';
import type { EvaluationNarrativeSummary } from '@packages/shared';
import { createEvaluationNarrative, listEvaluationNarratives } from '../lib/client-api';

const narrativeKinds = [
  {
    kind: 'executive_summary' as const,
    label: 'Executive summary'
  },
  {
    kind: 'material_topics' as const,
    label: 'Material topics'
  },
  {
    kind: 'risks_opportunities' as const,
    label: 'Risks and opportunities'
  },
  {
    kind: 'evidence_guidance' as const,
    label: 'Evidence guidance'
  }
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function NarrativeActionsPanel({
  evaluationId,
  narratives
}: {
  evaluationId: string;
  narratives: EvaluationNarrativeSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const narrativesByKind = useMemo(
    () => new Map(narratives.map((item) => [item.kind, item])),
    [narratives]
  );

  const requestNarrative = (kind: (typeof narrativeKinds)[number]['kind']) => {
    startTransition(async () => {
      setErrorMessage(null);

      try {
        const requested = await createEvaluationNarrative(evaluationId, { kind });
        let latest = requested;

        for (let attempt = 0; attempt < 45; attempt += 1) {
          if (latest.status === 'ready') {
            break;
          }

          if (latest.status === 'failed') {
            throw new Error(latest.errorMessage ?? 'Unable to generate the narrative.');
          }

          await sleep(1000);
          const refreshed = await listEvaluationNarratives(evaluationId);
          latest = refreshed.items.find((item) => item.id === requested.id) ?? latest;
        }

        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to request the narrative.'
        );
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {narrativeKinds.map((item) => {
        const narrative = narrativesByKind.get(item.kind);

        return (
          <Card className="border-surface-border bg-[#f7f9f4]" key={item.kind}>
            <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">AI narrative</p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">{item.label}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {narrative?.content ??
                'Generate a revision-scoped explanation from the immutable report snapshot.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                disabled={isPending}
                onClick={() => requestNarrative(item.kind)}
                type="button"
                variant="secondary"
              >
                {isPending ? 'Working...' : narrative ? 'Regenerate' : 'Generate'}
              </Button>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {narrative?.status ?? 'not requested'}
              </span>
            </div>
          </Card>
        );
      })}

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
