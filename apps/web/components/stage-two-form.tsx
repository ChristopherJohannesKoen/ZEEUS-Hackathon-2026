'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Select, Textarea } from '@packages/ui';
import { getWorkbookGuidance } from '@packages/scoring';
import type { EvaluationDetail, Stage2OpportunityAnswer, Stage2RiskAnswer } from '@packages/shared';
import { saveStage2 } from '../lib/client-api';

const probabilityOptions = [
  { value: 'rare', label: 'Rare' },
  { value: 'could_occur', label: 'Could occur' },
  { value: 'likely', label: 'Likely' },
  { value: 'very_likely', label: 'Very likely' },
  { value: 'na', label: 'Not applicable' }
] as const;
const impactOptions = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
  { value: 'high', label: 'High' },
  { value: 'na', label: 'Not applicable' }
] as const;
const evidenceOptions = [
  { value: 'measured', label: 'Measured' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'assumed', label: 'Assumed' }
] as const;
const workbookGuidance = getWorkbookGuidance();

function normaliseRisk(item: Stage2RiskAnswer, applicable: boolean): Stage2RiskAnswer {
  if (applicable) {
    return {
      ...item,
      applicable
    };
  }

  return {
    ...item,
    applicable: false,
    probability: 'na',
    impact: 'na'
  };
}

function normaliseOpportunity(
  item: Stage2OpportunityAnswer,
  applicable: boolean
): Stage2OpportunityAnswer {
  if (applicable) {
    return {
      ...item,
      applicable
    };
  }

  return {
    ...item,
    applicable: false,
    likelihood: 'na',
    impact: 'na'
  };
}

export function StageTwoForm({ evaluation }: { evaluation: EvaluationDetail }) {
  const router = useRouter();
  const [risks, setRisks] = useState<Stage2RiskAnswer[]>(evaluation.stage2Risks);
  const [opportunities, setOpportunities] = useState<Stage2OpportunityAnswer[]>(
    evaluation.stage2Opportunities
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <form
      className="grid gap-6"
      data-testid="stage-two-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsPending(true);
        setErrorMessage(null);

        try {
          await saveStage2(evaluation.id, {
            risks: risks.map((item) => ({
              riskCode: item.riskCode,
              applicable: item.applicable,
              probability: item.probability,
              impact: item.impact,
              evidenceBasis: item.evidenceBasis,
              evidenceNote: item.evidenceNote
            })),
            opportunities: opportunities.map((item) => ({
              opportunityCode: item.opportunityCode,
              applicable: item.applicable,
              likelihood: item.likelihood,
              impact: item.impact,
              evidenceBasis: item.evidenceBasis,
              evidenceNote: item.evidenceNote
            }))
          });
          router.push(`/app/evaluate/${evaluation.id}/impact-summary`);
          router.refresh();
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to save Stage II.');
        } finally {
          setIsPending(false);
        }
      }}
    >
      <Card className="border-[#d4e8c2]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58724d]">Stage II</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Risks and opportunities</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This outside-in layer captures sustainability-linked downside risks and upside
          opportunities. Ratings stay deterministic and workbook matrix-based.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Use the{' '}
          <Link className="font-semibold text-brand-dark underline" href="/resources">
            reference hub
          </Link>{' '}
          whenever you need the workbook matrix explanation, FAQ wording, or score interpretation
          sheet while completing Stage II.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dbe8cf] bg-[#fbfdf7] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#607557]">Risk matrix legend</p>
            <div className="mt-3 grid gap-3">
              {workbookGuidance.riskMatrixLegend.entries.map((entry) => (
                <div className="rounded-2xl bg-white p-3" key={`risk-${entry.score}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{entry.label}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607557]">
                      {entry.score}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{entry.actionWindow}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#dbe8cf] bg-[#fbfdf7] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#607557]">
              Opportunity matrix legend
            </p>
            <div className="mt-3 grid gap-3">
              {workbookGuidance.opportunityMatrixLegend.entries.map((entry) => (
                <div className="rounded-2xl bg-white p-3" key={`opportunity-${entry.score}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{entry.label}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607557]">
                      {entry.score}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{entry.actionWindow}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-[#d4e8c2]">
        <h3 className="text-xl font-bold text-slate-950">Risks</h3>
        <div className="mt-5 grid gap-5">
          {risks.map((item) => (
            <div
              className="rounded-[28px] border border-[#dde9d0] bg-[#fbfdf8] p-5"
              data-testid={`stage-two-risk-${item.riskCode}`}
              key={item.riskCode}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a7352]">
                    {item.group}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h4>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{item.question}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    data-testid={`stage-two-risk-${item.riskCode}-applicable`}
                    checked={item.applicable}
                    onChange={(event) =>
                      setRisks((current) =>
                        current.map((entry) =>
                          entry.riskCode === item.riskCode
                            ? normaliseRisk(entry, event.target.checked)
                            : entry
                        )
                      )
                    }
                    type="checkbox"
                  />
                  Applicable
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                <Field label="Probability">
                  <Select
                    data-testid={`stage-two-risk-${item.riskCode}-probability`}
                    disabled={!item.applicable}
                    onChange={(event) =>
                      setRisks((current) =>
                        current.map((entry) =>
                          entry.riskCode === item.riskCode
                            ? {
                                ...entry,
                                probability: event.target.value as Stage2RiskAnswer['probability']
                              }
                            : entry
                        )
                      )
                    }
                    value={item.probability}
                  >
                    {probabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Impact">
                  <Select
                    data-testid={`stage-two-risk-${item.riskCode}-impact`}
                    disabled={!item.applicable}
                    onChange={(event) =>
                      setRisks((current) =>
                        current.map((entry) =>
                          entry.riskCode === item.riskCode
                            ? { ...entry, impact: event.target.value as Stage2RiskAnswer['impact'] }
                            : entry
                        )
                      )
                    }
                    value={item.impact}
                  >
                    {impactOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Evidence basis">
                  <Select
                    data-testid={`stage-two-risk-${item.riskCode}-evidence-basis`}
                    onChange={(event) =>
                      setRisks((current) =>
                        current.map((entry) =>
                          entry.riskCode === item.riskCode
                            ? {
                                ...entry,
                                evidenceBasis: event.target
                                  .value as Stage2RiskAnswer['evidenceBasis']
                              }
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
                <div className="rounded-2xl border border-[#d9e8cb] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a7352]">
                    Current rating
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{item.ratingLabel}</p>
                </div>
              </div>

              {item.interpretation ? (
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.interpretation}</p>
              ) : null}
              {item.guidance ? (
                <div className="mt-3 rounded-2xl border border-[#dbe8cf] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#607557]">
                    Workbook guidance
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.guidance}</p>
                </div>
              ) : null}

              <div className="mt-4">
                <Field
                  hint="Optional rationale, evidence source, or trigger note behind this risk rating."
                  label="Evidence note"
                >
                  <Textarea
                    data-testid={`stage-two-risk-${item.riskCode}-evidence-note`}
                    onChange={(event) =>
                      setRisks((current) =>
                        current.map((entry) =>
                          entry.riskCode === item.riskCode
                            ? {
                                ...entry,
                                evidenceNote: event.target.value
                              }
                            : entry
                        )
                      )
                    }
                    placeholder="Add the rationale or evidence behind this risk score."
                    rows={3}
                    value={item.evidenceNote ?? ''}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-[#d4e8c2]">
        <h3 className="text-xl font-bold text-slate-950">Opportunities</h3>
        <div className="mt-5 grid gap-5">
          {opportunities.map((item) => (
            <div
              className="rounded-[28px] border border-[#dde9d0] bg-[#fbfdf8] p-5"
              data-testid={`stage-two-opportunity-${item.opportunityCode}`}
              key={item.opportunityCode}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a7352]">
                    {item.group}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h4>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{item.question}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    data-testid={`stage-two-opportunity-${item.opportunityCode}-applicable`}
                    checked={item.applicable}
                    onChange={(event) =>
                      setOpportunities((current) =>
                        current.map((entry) =>
                          entry.opportunityCode === item.opportunityCode
                            ? normaliseOpportunity(entry, event.target.checked)
                            : entry
                        )
                      )
                    }
                    type="checkbox"
                  />
                  Applicable
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                <Field label="Likelihood">
                  <Select
                    data-testid={`stage-two-opportunity-${item.opportunityCode}-likelihood`}
                    disabled={!item.applicable}
                    onChange={(event) =>
                      setOpportunities((current) =>
                        current.map((entry) =>
                          entry.opportunityCode === item.opportunityCode
                            ? {
                                ...entry,
                                likelihood: event.target
                                  .value as Stage2OpportunityAnswer['likelihood']
                              }
                            : entry
                        )
                      )
                    }
                    value={item.likelihood}
                  >
                    {probabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Impact">
                  <Select
                    data-testid={`stage-two-opportunity-${item.opportunityCode}-impact`}
                    disabled={!item.applicable}
                    onChange={(event) =>
                      setOpportunities((current) =>
                        current.map((entry) =>
                          entry.opportunityCode === item.opportunityCode
                            ? {
                                ...entry,
                                impact: event.target.value as Stage2OpportunityAnswer['impact']
                              }
                            : entry
                        )
                      )
                    }
                    value={item.impact}
                  >
                    {impactOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Evidence basis">
                  <Select
                    data-testid={`stage-two-opportunity-${item.opportunityCode}-evidence-basis`}
                    onChange={(event) =>
                      setOpportunities((current) =>
                        current.map((entry) =>
                          entry.opportunityCode === item.opportunityCode
                            ? {
                                ...entry,
                                evidenceBasis: event.target
                                  .value as Stage2OpportunityAnswer['evidenceBasis']
                              }
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
                <div className="rounded-2xl border border-[#d9e8cb] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a7352]">
                    Current rating
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{item.ratingLabel}</p>
                </div>
              </div>

              {item.interpretation ? (
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.interpretation}</p>
              ) : null}
              {item.guidance ? (
                <div className="mt-3 rounded-2xl border border-[#dbe8cf] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#607557]">
                    Workbook guidance
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.guidance}</p>
                </div>
              ) : null}

              <div className="mt-4">
                <Field
                  hint="Optional rationale, evidence source, or supporting note behind this opportunity rating."
                  label="Evidence note"
                >
                  <Textarea
                    data-testid={`stage-two-opportunity-${item.opportunityCode}-evidence-note`}
                    onChange={(event) =>
                      setOpportunities((current) =>
                        current.map((entry) =>
                          entry.opportunityCode === item.opportunityCode
                            ? {
                                ...entry,
                                evidenceNote: event.target.value
                              }
                            : entry
                        )
                      )
                    }
                    placeholder="Add the rationale or evidence behind this opportunity score."
                    rows={3}
                    value={item.evidenceNote ?? ''}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-[#00654A] hover:bg-[#0b7a59]"
          data-testid="stage-two-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Save Stage II and continue'}
        </Button>
      </div>
    </form>
  );
}
