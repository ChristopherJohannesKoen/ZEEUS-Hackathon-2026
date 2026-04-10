'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ScenarioConfidenceShift, ScenarioRunSummary, TopicCode } from '@packages/shared';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@packages/ui';
import { createScenarioRun } from '../lib/client-api';

const topicOptions: TopicCode[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'];
const confidenceShiftOptions: ScenarioConfidenceShift[] = ['down', 'same', 'up'];

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
    hypothesis: '',
    assumptions: {
      financialDelta: 0,
      riskDelta: 0,
      opportunityDelta: 0,
      confidenceShift: 'same' as ScenarioConfidenceShift,
      impactedTopicCodes: [] as TopicCode[]
    }
  });

  function toggleTopic(topicCode: TopicCode) {
    setFormState((current) => {
      const exists = current.assumptions.impactedTopicCodes.includes(topicCode);
      const impactedTopicCodes = exists
        ? current.assumptions.impactedTopicCodes.filter((code) => code !== topicCode)
        : [...current.assumptions.impactedTopicCodes, topicCode].slice(0, 4);

      return {
        ...current,
        assumptions: {
          ...current.assumptions,
          impactedTopicCodes
        }
      };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-surface-border">
        <h2 className="text-2xl font-black text-slate-950">Create advisory scenario</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Scenarios let founders stress-test structured assumptions without overwriting the
          canonical evaluation revision.
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
                  hypothesis: '',
                  assumptions: {
                    financialDelta: 0,
                    riskDelta: 0,
                    opportunityDelta: 0,
                    confidenceShift: 'same',
                    impactedTopicCodes: []
                  }
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
          <div className="rounded-[28px] bg-[#f4f9ee] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Scenario assumptions
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field
                hint="Advisory shift against the current financial total."
                label="Financial delta"
              >
                <Input
                  max="4"
                  min="-4"
                  step="0.5"
                  type="number"
                  value={String(formState.assumptions.financialDelta)}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      assumptions: {
                        ...current.assumptions,
                        financialDelta: Number(event.target.value)
                      }
                    }))
                  }
                />
              </Field>
              <Field hint="Expected downside movement." label="Risk delta">
                <Input
                  max="2"
                  min="-2"
                  step="0.5"
                  type="number"
                  value={String(formState.assumptions.riskDelta)}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      assumptions: {
                        ...current.assumptions,
                        riskDelta: Number(event.target.value)
                      }
                    }))
                  }
                />
              </Field>
              <Field hint="Expected upside movement." label="Opportunity delta">
                <Input
                  max="2"
                  min="-2"
                  step="0.5"
                  type="number"
                  value={String(formState.assumptions.opportunityDelta)}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      assumptions: {
                        ...current.assumptions,
                        opportunityDelta: Number(event.target.value)
                      }
                    }))
                  }
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
              <Field label="Confidence shift">
                <Select
                  value={formState.assumptions.confidenceShift}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      assumptions: {
                        ...current.assumptions,
                        confidenceShift: event.target.value as ScenarioConfidenceShift
                      }
                    }))
                  }
                >
                  {confidenceShiftOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-slate-800">Impacted topics</p>
                <div className="flex flex-wrap gap-2">
                  {topicOptions.map((topicCode) => {
                    const selected = formState.assumptions.impactedTopicCodes.includes(topicCode);

                    return (
                      <button
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                          selected
                            ? 'border-brand bg-brand text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'
                        }`}
                        key={topicCode}
                        onClick={(event) => {
                          event.preventDefault();
                          toggleTopic(topicCode);
                        }}
                        type="button"
                      >
                        {topicCode}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Choose up to four topics most affected by the scenario.
                </p>
              </div>
            </div>
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {item.focusArea}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-slate-950">{item.name}</h3>
                </div>
                <Badge tone="emerald">{item.projectedConfidenceBand} confidence</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.hypothesis}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                {item.geography ? <p>Geography: {item.geography}</p> : null}
                {item.dependency ? <p>Dependency: {item.dependency}</p> : null}
                {item.timeframe ? <p>Timeframe: {item.timeframe}</p> : null}
                {item.baseRevisionNumber ? <p>Base revision: {item.baseRevisionNumber}</p> : null}
              </div>
              <div className="mt-4 rounded-[24px] bg-[#f4f9ee] px-4 py-4 text-sm leading-7 text-slate-700">
                {item.advisorySummary}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {item.metricDeltas.map((metric) => (
                  <div className="rounded-[24px] bg-[#fbfdf8] px-4 py-4" key={metric.key}>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#58724d]">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {metric.currentValue.toFixed(1)} {'->'} {metric.scenarioValue.toFixed(1)}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {metric.delta >= 0 ? '+' : ''}
                      {metric.delta.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[24px] bg-[#fbfdf8] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#58724d]">
                    Topic movement
                  </p>
                  <div className="mt-3 grid gap-2">
                    {item.topicDeltas.length === 0 ? (
                      <p className="text-sm text-slate-500">No topic deltas were computed.</p>
                    ) : (
                      item.topicDeltas.map((topic) => (
                        <div
                          className="flex items-center justify-between gap-3 text-sm"
                          key={topic.topicCode}
                        >
                          <span className="font-semibold text-slate-900">{topic.topicCode}</span>
                          <span className="text-slate-600">
                            {topic.currentBand.replaceAll('_', ' ')} {'->'}{' '}
                            {topic.scenarioBand.replaceAll('_', ' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-[24px] bg-[#fbfdf8] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#58724d]">Takeaways</p>
                  <div className="mt-3 grid gap-2 text-sm leading-7 text-slate-600">
                    {item.takeaways.map((takeaway, index) => (
                      <p key={`${item.id}-${index}`}>{takeaway}</p>
                    ))}
                    {item.topicDeltas.map((topic) => (
                      <p key={`${item.id}-${topic.topicCode}-note`}>{topic.note}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
