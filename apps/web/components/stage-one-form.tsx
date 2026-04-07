'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Field,
  Select
} from '@packages/ui';
import { getFinancialIndicatorOptions } from '@packages/scoring';
import type {
  EvaluationDetail,
  Stage1FinancialAnswersPayload,
  Stage1TopicAnswer
} from '@packages/shared';
import { saveStage1Financial, saveStage1Topics } from '../lib/client-api';
import { formatEnumLabel } from '../lib/display';

const financialOptions = getFinancialIndicatorOptions();
const dimensionOptions = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
  { value: 'high', label: 'High' },
  { value: 'na', label: 'Not applicable' }
] as const;
const likelihoodOptions = [
  { value: 'very_unlikely', label: 'Very unlikely' },
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'likely', label: 'Likely' },
  { value: 'very_likely', label: 'Very likely' },
  { value: 'na', label: 'Not applicable' }
] as const;
const evidenceOptions = [
  { value: 'measured', label: 'Measured' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'assumed', label: 'Assumed' }
] as const;

function normaliseTopicAnswer(item: Stage1TopicAnswer, applicable: boolean): Stage1TopicAnswer {
  if (applicable) {
    return {
      ...item,
      applicable
    };
  }

  return {
    ...item,
    applicable: false,
    magnitude: 'na',
    scale: 'na',
    irreversibility: 'na',
    likelihood: 'na'
  };
}

export function StageOneForm({ evaluation }: { evaluation: EvaluationDetail }) {
  const router = useRouter();
  const [financial, setFinancial] = useState<Stage1FinancialAnswersPayload>({
    roiLevel: evaluation.stage1Financial?.roiLevel ?? 'not_evaluated',
    sensitivityLevel: evaluation.stage1Financial?.sensitivityLevel ?? 'not_evaluated',
    uspLevel: evaluation.stage1Financial?.uspLevel ?? 'not_evaluated',
    marketGrowthLevel: evaluation.stage1Financial?.marketGrowthLevel ?? 'not_evaluated'
  });
  const [topics, setTopics] = useState<Stage1TopicAnswer[]>(evaluation.stage1Topics);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const topicGroups = [
    {
      title: 'Environmental indicators',
      items: topics.filter((item) => item.topicCode.startsWith('E'))
    },
    {
      title: 'Social and governance indicators',
      items: topics.filter((item) => item.topicCode.startsWith('S') || item.topicCode.startsWith('G'))
    }
  ];

  return (
    <form
      className="grid gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsPending(true);
        setErrorMessage(null);

        try {
          await saveStage1Financial(evaluation.id, financial);
          await saveStage1Topics(evaluation.id, {
            items: topics.map((item) => ({
              topicCode: item.topicCode,
              applicable: item.applicable,
              magnitude: item.magnitude,
              scale: item.scale,
              irreversibility: item.irreversibility,
              likelihood: item.likelihood,
              evidenceBasis: item.evidenceBasis
            }))
          });
          router.push(`/app/evaluate/${evaluation.id}/stage-2`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to save Stage I.');
        } finally {
          setIsPending(false);
        }
      }}
    >
      <Card className="border-[#d4e8c2]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">
            Stage I
          </p>
          <h2 className="text-2xl font-black text-slate-950">Holistic Startup Assessment</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Financial scores use workbook lookup levels. Environmental, social, and governance
            topics use the deterministic formula
            {' '}
            <strong>((Magnitude + Scale + Irreversibility) / 3) × Likelihood</strong>.
          </p>
        </div>

        <details className="mt-5 rounded-2xl border border-[#dbe8cf] bg-[#fbfdf7] p-4 text-sm text-[#566953]">
          <summary className="cursor-pointer font-semibold text-[#355d2d]">Formula help</summary>
          <p className="mt-3 leading-7">
            Preserve Excel parity. Topics below 2 stay low-priority. Topics from 2 to below 2.5 are
            shown as relevant, and 2.5 or above are shown as high priority.
          </p>
        </details>
      </Card>

      <Card className="border-[#d4e8c2]">
        <h3 className="text-xl font-bold text-slate-950">Financial indicators</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field hint="ROI, IRR, NPV, and payback period." label={financialOptions.roi.label}>
            <Select
              name="roiLevel"
              onChange={(event) =>
                setFinancial((current) => ({ ...current, roiLevel: event.target.value as Stage1FinancialAnswersPayload['roiLevel'] }))
              }
              value={financial.roiLevel}
            >
              {financialOptions.roi.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.score})
                </option>
              ))}
            </Select>
          </Field>
          <Field hint="How stable the business case stays across scenarios." label={financialOptions.sensitivity.label}>
            <Select
              name="sensitivityLevel"
              onChange={(event) =>
                setFinancial((current) => ({
                  ...current,
                  sensitivityLevel: event.target.value as Stage1FinancialAnswersPayload['sensitivityLevel']
                }))
              }
              value={financial.sensitivityLevel}
            >
              {financialOptions.sensitivity.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.score})
                </option>
              ))}
            </Select>
          </Field>
          <Field hint="How differentiated and strategically defendable the venture is." label={financialOptions.usp.label}>
            <Select
              name="uspLevel"
              onChange={(event) =>
                setFinancial((current) => ({ ...current, uspLevel: event.target.value as Stage1FinancialAnswersPayload['uspLevel'] }))
              }
              value={financial.uspLevel}
            >
              {financialOptions.usp.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.score})
                </option>
              ))}
            </Select>
          </Field>
          <Field hint="Use the closest market growth band available." label={financialOptions.marketGrowth.label}>
            <Select
              name="marketGrowthLevel"
              onChange={(event) =>
                setFinancial((current) => ({
                  ...current,
                  marketGrowthLevel: event.target.value as Stage1FinancialAnswersPayload['marketGrowthLevel']
                }))
              }
              value={financial.marketGrowthLevel}
            >
              {financialOptions.marketGrowth.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.score})
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {topicGroups.map((group) => (
        <Card className="border-[#d4e8c2]" key={group.title}>
          <h3 className="text-xl font-bold text-slate-950">{group.title}</h3>
          <div className="mt-5 grid gap-5">
            {group.items.map((item) => (
              <div className="rounded-[28px] border border-[#dde9d0] bg-[#fbfdf8] p-5" key={item.topicCode}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a7352]">
                      {item.topicCode}
                    </p>
                    <h4 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h4>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{item.question}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      checked={item.applicable}
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? normaliseTopicAnswer(entry, event.target.checked)
                              : entry
                          )
                        )
                      }
                      type="checkbox"
                    />
                    Applicable
                  </label>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4 xl:grid-cols-5">
                  <Field label="Magnitude">
                    <Select
                      disabled={!item.applicable}
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? { ...entry, magnitude: event.target.value as Stage1TopicAnswer['magnitude'] }
                              : entry
                          )
                        )
                      }
                      value={item.magnitude}
                    >
                      {dimensionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Scale">
                    <Select
                      disabled={!item.applicable}
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? { ...entry, scale: event.target.value as Stage1TopicAnswer['scale'] }
                              : entry
                          )
                        )
                      }
                      value={item.scale}
                    >
                      {dimensionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Irreversibility">
                    <Select
                      disabled={!item.applicable}
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? {
                                  ...entry,
                                  irreversibility: event.target.value as Stage1TopicAnswer['irreversibility']
                                }
                              : entry
                          )
                        )
                      }
                      value={item.irreversibility}
                    >
                      {dimensionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Likelihood">
                    <Select
                      disabled={!item.applicable}
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? { ...entry, likelihood: event.target.value as Stage1TopicAnswer['likelihood'] }
                              : entry
                          )
                        )
                      }
                      value={item.likelihood}
                    >
                      {likelihoodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Evidence basis">
                    <Select
                      onChange={(event) =>
                        setTopics((current) =>
                          current.map((entry) =>
                            entry.topicCode === item.topicCode
                              ? { ...entry, evidenceBasis: event.target.value as Stage1TopicAnswer['evidenceBasis'] }
                              : entry
                          )
                        )
                      }
                      value={item.evidenceBasis}
                    >
                      {evidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#607557]">
                  Current band: {formatEnumLabel(item.priorityBand)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button className="bg-[#00654A] hover:bg-[#0b7a59]" disabled={isPending} type="submit">
          {isPending ? 'Saving...' : 'Save Stage I and continue'}
        </Button>
      </div>
    </form>
  );
}
