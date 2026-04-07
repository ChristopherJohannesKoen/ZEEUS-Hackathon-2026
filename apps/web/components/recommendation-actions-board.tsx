'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Select, Textarea } from '@packages/ui';
import type {
  DashboardResponse,
  Recommendation,
  RecommendationActionStatus
} from '@packages/shared';
import { updateRecommendationAction } from '../lib/client-api';

const actionOptions: Array<{
  value: RecommendationActionStatus;
  label: string;
}> = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'dismissed', label: 'Dismissed' }
];

type DraftState = Record<
  string,
  {
    status: RecommendationActionStatus;
    ownerNote: string;
  }
>;

function buildDraftState(recommendations: Recommendation[]): DraftState {
  return Object.fromEntries(
    recommendations.map((recommendation) => [
      recommendation.id,
      {
        status: recommendation.action?.status ?? 'not_started',
        ownerNote: recommendation.action?.ownerNote ?? ''
      }
    ])
  );
}

export function RecommendationActionsBoard({
  evaluationId,
  recommendations
}: {
  evaluationId: string;
  recommendations: DashboardResponse['recommendations'];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftState, setDraftState] = useState<DraftState>(() => buildDraftState(recommendations));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveRecommendation = (recommendationId: string) => {
    const current = draftState[recommendationId];

    if (!current) {
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);

      try {
        await updateRecommendationAction(evaluationId, recommendationId, {
          status: current.status,
          ownerNote: current.ownerNote.trim() || null
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to update the recommendation action.'
        );
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recommendations.map((recommendation) => {
        const current = draftState[recommendation.id] ?? {
          status: 'not_started' as RecommendationActionStatus,
          ownerNote: ''
        };

        return (
          <Card className="border-surface-border bg-[#f7f9f4]" key={recommendation.id}>
            <p className="text-xs uppercase tracking-[0.22em] text-[#5d7355]">
              {recommendation.source} / {recommendation.severityBand}
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">{recommendation.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{recommendation.text}</p>
            {recommendation.evidenceToCollect ? (
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d7355]">
                  Evidence to collect
                </p>
                <p className="mt-2">{recommendation.evidenceToCollect}</p>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4">
              <Field label="Action status">
                <Select
                  data-testid={`recommendation-action-status-${recommendation.id}`}
                  onChange={(event) =>
                    setDraftState((state) => ({
                      ...state,
                      [recommendation.id]: {
                        ...current,
                        status: event.target.value as RecommendationActionStatus
                      }
                    }))
                  }
                  value={current.status}
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Owner note">
                <Textarea
                  data-testid={`recommendation-action-note-${recommendation.id}`}
                  onChange={(event) =>
                    setDraftState((state) => ({
                      ...state,
                      [recommendation.id]: {
                        ...current,
                        ownerNote: event.target.value
                      }
                    }))
                  }
                  placeholder="Capture the owner, next checkpoint, or evidence to gather."
                  rows={3}
                  value={current.ownerNote}
                />
              </Field>

              <div className="flex justify-end">
                <Button
                  data-testid={`recommendation-action-save-${recommendation.id}`}
                  disabled={isPending}
                  onClick={() => saveRecommendation(recommendation.id)}
                  type="button"
                  variant="secondary"
                >
                  {isPending ? 'Saving...' : 'Save action'}
                </Button>
              </div>
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
