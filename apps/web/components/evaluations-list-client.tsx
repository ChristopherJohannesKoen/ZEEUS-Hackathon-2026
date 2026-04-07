'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, buttonClassName } from '@packages/ui';
import type { EvaluationListItem, EvaluationStatus } from '@packages/shared';
import { confidenceTone, evaluationStatusTone, formatDate, formatEnumLabel } from '../lib/display';

const continueRoute: Record<string, string> = {
  start: 'summary',
  summary: 'summary',
  stage_1: 'stage-1',
  stage_2: 'stage-2',
  impact_summary: 'impact-summary',
  sdg_alignment: 'sdg-alignment',
  dashboard: 'dashboard',
  report: 'dashboard'
};

type StatusFilter = 'all' | EvaluationStatus;

export function EvaluationsListClient({ evaluations }: { evaluations: EvaluationListItem[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredEvaluations = useMemo(
    () =>
      evaluations.filter((evaluation) => {
        const matchesQuery =
          evaluation.name.toLowerCase().includes(query.toLowerCase()) ||
          evaluation.country.toLowerCase().includes(query.toLowerCase()) ||
          evaluation.naceDivision.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [evaluations, query, statusFilter]
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[240px] flex-1 rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-dark"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by startup, country, or NACE division"
          type="search"
          value={query}
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'draft', 'in_progress', 'completed'] as const).map((status) => (
            <button
              className={
                statusFilter === status
                  ? 'rounded-xl bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white'
                  : 'rounded-xl border border-surface-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-surface-muted'
              }
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {status === 'all' ? 'All' : formatEnumLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <Card className="border-dashed border-surface-border bg-[#fbfdf8]">
          <h2 className="text-xl font-bold text-slate-950">
            No evaluations match the current filters
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Adjust the search term or status filter, or start a fresh evaluation from the wizard.
          </p>
          <div className="mt-5">
            <Link
              className={buttonClassName({ className: 'bg-brand hover:bg-brand-dark' })}
              href="/app/evaluate/start"
            >
              Start evaluation
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredEvaluations.map((evaluation) => (
            <Card className="border-surface-border" key={evaluation.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={evaluationStatusTone(evaluation.status)}>
                      {evaluation.status}
                    </Badge>
                    <Badge tone={confidenceTone(evaluation.confidenceBand)}>
                      {evaluation.confidenceBand} confidence
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{evaluation.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {evaluation.country} · {evaluation.naceDivision}
                    </p>
                  </div>
                </div>
                <Link
                  className={buttonClassName({ variant: 'secondary' })}
                  href={`/app/evaluate/${evaluation.id}/${continueRoute[evaluation.currentStep]}`}
                >
                  Continue
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Financial</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {evaluation.financialTotal}/12
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">Risk overall</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {evaluation.riskOverall.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4f9ee] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5c7353]">
                    Opportunity overall
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {evaluation.opportunityOverall.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Stage {formatEnumLabel(evaluation.currentStage)}</span>
                <span>Current step {formatEnumLabel(evaluation.currentStep)}</span>
                <span>Updated {formatDate(evaluation.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
