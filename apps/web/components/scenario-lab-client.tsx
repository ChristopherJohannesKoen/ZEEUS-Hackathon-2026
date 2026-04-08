'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ScenarioRunSummary } from '@packages/shared';
import { Button, Card, Field, Input, Textarea } from '@packages/ui';
import { createScenarioRun } from '../lib/client-api';

export function ScenarioLabClient({
  evaluationId,
  items
}: {
  evaluationId: string;
  items: ScenarioRunSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    focusArea: '',
    geography: '',
    dependency: '',
    timeframe: '',
    hypothesis: ''
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-surface-border">
        <h2 className="text-2xl font-black text-slate-950">Create advisory scenario</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Scenarios let founders stress-test assumptions without overwriting the canonical
          evaluation revision.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            startTransition(async () => {
              try {
                await createScenarioRun(evaluationId, formState);
                setFormState({
                  name: '',
                  focusArea: '',
                  geography: '',
                  dependency: '',
                  timeframe: '',
                  hypothesis: ''
                });
                router.refresh();
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : 'Unable to create the scenario.'
                );
              }
            });
          }}
        >
          <Field label="Scenario name">
            <Input
              required
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Focus area">
            <Input
              required
              value={formState.focusArea}
              onChange={(event) =>
                setFormState((current) => ({ ...current, focusArea: event.target.value }))
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Geography">
              <Input
                value={formState.geography}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, geography: event.target.value }))
                }
              />
            </Field>
            <Field label="Dependency">
              <Input
                value={formState.dependency}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, dependency: event.target.value }))
                }
              />
            </Field>
            <Field label="Timeframe">
              <Input
                value={formState.timeframe}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, timeframe: event.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Hypothesis">
            <Textarea
              required
              value={formState.hypothesis}
              onChange={(event) =>
                setFormState((current) => ({ ...current, hypothesis: event.target.value }))
              }
            />
          </Field>
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          <div>
            <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
              {isPending ? 'Saving...' : 'Save scenario'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <Card className="border-dashed border-surface-border bg-[#fbfdf8]">
            <h2 className="text-xl font-bold text-slate-950">No scenarios yet</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Start with one scenario to compare a baseline design against an improved or stressed
              case.
            </p>
          </Card>
        ) : (
          items.map((item) => (
            <Card className="border-surface-border" key={item.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                {item.focusArea}
              </p>
              <h3 className="mt-3 text-xl font-bold text-slate-950">{item.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.hypothesis}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                {item.geography ? <p>Geography: {item.geography}</p> : null}
                {item.dependency ? <p>Dependency: {item.dependency}</p> : null}
                {item.timeframe ? <p>Timeframe: {item.timeframe}</p> : null}
              </div>
              <div className="mt-4 rounded-[24px] bg-[#f4f9ee] px-4 py-4 text-sm leading-7 text-slate-700">
                {item.advisorySummary}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
