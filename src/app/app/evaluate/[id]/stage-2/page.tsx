'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEvaluationStore } from '@/store/evaluationStore';
import {
  RISK_DEFINITIONS,
  OPPORTUNITY_DEFINITIONS,
  PROB_LABELS,
  IMPACT_LABELS
} from '@/data/risks-opportunities';
import {
  calcRiskRating,
  calcOpportunityRating,
  calcOverallRisk,
  calcOverallOpportunity
} from '@/lib/scoring';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskChip, OpportunityChip } from '@/components/ui/Badge';
import { ArrowRight, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

const PROB_VALUES = [0, 1, 2, 3, 4] as const;
const IMPACT_VALUES = [0, 1, 2, 3, 4] as const;

function RatingMatrix({ value, size = 5 }: { value: number; size?: number }) {
  const colors = ['bg-gray-100', 'bg-green-200', 'bg-yellow-200', 'bg-orange-300', 'bg-red-400'];
  return (
    <div className="flex gap-1">
      {Array.from({ length: size }).map((_, i) => (
        <div
          key={i}
          className={cn('h-2 w-2 rounded-full', i < value ? colors[value] : 'bg-gray-100')}
        />
      ))}
    </div>
  );
}

function OpportunityMatrix({ value, size = 5 }: { value: number; size?: number }) {
  const colors = ['bg-gray-100', 'bg-emerald-200', 'bg-green-300', 'bg-brand/50', 'bg-brand'];
  return (
    <div className="flex gap-1">
      {Array.from({ length: size }).map((_, i) => (
        <div
          key={i}
          className={cn('h-2 w-2 rounded-full', i < value ? colors[value] : 'bg-gray-100')}
        />
      ))}
    </div>
  );
}

export default function Stage2Page({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getEvaluation,
    initializeStage2IfNeeded,
    updateRiskItem,
    updateRiskApplicable,
    updateOpportunityItem,
    updateOpportunityApplicable,
    updateStatus
  } = useEvaluationStore();

  const [activeTab, setActiveTab] = useState<'risks' | 'opportunities'>('risks');

  useEffect(() => {
    initializeStage2IfNeeded(id);
  }, [id]);

  const evaluation = getEvaluation(id);
  if (!evaluation?.stage2) return null;

  const { stage2 } = evaluation;

  const overallRisk = calcOverallRisk(stage2);
  const overallOpp = calcOverallOpportunity(stage2);

  const topRisks = Object.values(stage2.risks)
    .filter((r) => r.applicable && r.ratingScore > 0)
    .sort((a, b) => b.ratingScore - a.ratingScore)
    .slice(0, 3);

  const topOpps = Object.values(stage2.opportunities)
    .filter((o) => o.applicable && o.ratingScore > 0)
    .sort((a, b) => b.ratingScore - a.ratingScore)
    .slice(0, 3);

  function handleSaveAndNext() {
    updateStatus(id, 'completed');
    router.push(`/app/evaluate/${id}/impact-summary`);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">
            Stage II — Risks & Opportunities
          </h1>
          <p className="text-sm text-gray-500">
            Outside-in: Assess how the external environment affects your startup.
          </p>
        </div>
        <Button variant="primary" rightIcon={<ArrowRight size={15} />} onClick={handleSaveAndNext}>
          Save & Continue
        </Button>
      </div>

      {/* Live summary bar */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 flex-shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Overall Risk</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-gray-900">
                {overallRisk.score.toFixed(1)}
              </span>
              <RiskChip label={overallRisk.label} />
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-brand flex-shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Overall Opportunity</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-gray-900">
                {overallOpp.score.toFixed(1)}
              </span>
              <OpportunityChip label={overallOpp.label} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-6">
        {[
          {
            key: 'risks' as const,
            label: 'Risks',
            icon: <Shield size={14} />,
            count: topRisks.length
          },
          {
            key: 'opportunities' as const,
            label: 'Opportunities',
            icon: <TrendingUp size={14} />,
            count: topOpps.length
          }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all border',
              activeTab === tab.key
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-white text-gray-600 border-surface-border hover:border-brand'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'rounded-full text-[10px] px-1.5 py-0.5 font-bold',
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-muted text-gray-600'
                )}
              >
                {tab.count} active
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── RISKS ─── */}
      {activeTab === 'risks' && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 flex items-start gap-2 mb-4">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            For each risk, select Probability (how likely?) and Impact (how severe?). The matrix
            produces the rating automatically.
          </div>

          {RISK_DEFINITIONS.map((riskDef) => {
            const riskData = stage2.risks[riskDef.id];
            if (!riskData) return null;
            const { score: livScore, label: livLabel } = calcRiskRating(
              riskData.probability,
              riskData.impact
            );
            return (
              <Card
                key={riskDef.id}
                className={cn(
                  livScore >= 3 && riskData.applicable
                    ? 'border-red-200 bg-red-50/30'
                    : livScore >= 2 && riskData.applicable
                      ? 'border-amber-200 bg-amber-50/20'
                      : ''
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Applicable toggle */}
                  <div
                    onClick={() => updateRiskApplicable(id, riskDef.id, !riskData.applicable)}
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border-2 transition-colors',
                      riskData.applicable
                        ? 'bg-brand border-brand text-white'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    {riskData.applicable && (
                      <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-gray-500">{riskDef.id}</span>
                      <span className="font-bold text-sm text-gray-900">{riskDef.title}</span>
                      <span className="text-[10px] bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
                        {riskDef.category}
                      </span>
                      {riskData.applicable && <RiskChip label={livLabel} score={livScore} />}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{riskDef.description}</p>

                    {riskData.applicable && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Probability */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Probability</p>
                          <p className="text-[11px] text-gray-400 mb-2">{riskDef.probHint}</p>
                          <div className="flex flex-wrap gap-1">
                            {PROB_VALUES.map((v) => (
                              <button
                                key={v}
                                onClick={() => updateRiskItem(id, riskDef.id, v, riskData.impact)}
                                className={cn(
                                  'rounded-lg px-2.5 py-1 text-xs font-medium border transition-all',
                                  riskData.probability === v
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-surface-border hover:border-brand'
                                )}
                              >
                                {PROB_LABELS[v]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Impact */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Impact</p>
                          <p className="text-[11px] text-gray-400 mb-2">{riskDef.impactHint}</p>
                          <div className="flex flex-wrap gap-1">
                            {IMPACT_VALUES.map((v) => (
                              <button
                                key={v}
                                onClick={() =>
                                  updateRiskItem(id, riskDef.id, riskData.probability, v)
                                }
                                className={cn(
                                  'rounded-lg px-2.5 py-1 text-xs font-medium border transition-all',
                                  riskData.impact === v
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-surface-border hover:border-brand'
                                )}
                              >
                                {IMPACT_LABELS[v]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {riskData.applicable && livScore > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <RatingMatrix value={livScore} />
                        <span className="text-xs text-gray-500">Rating: {livLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── OPPORTUNITIES ─── */}
      {activeTab === 'opportunities' && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 flex items-start gap-2 mb-4">
            <TrendingUp size={13} className="mt-0.5 flex-shrink-0" />
            Select Likelihood (how likely to materialise?) and Impact (how big is the upside?).
            Rating is derived automatically.
          </div>

          {OPPORTUNITY_DEFINITIONS.map((oppDef) => {
            const oppData = stage2.opportunities[oppDef.id];
            if (!oppData) return null;
            const { score: livScore, label: livLabel } = calcOpportunityRating(
              oppData.likelihood,
              oppData.impact
            );
            return (
              <Card
                key={oppDef.id}
                className={cn(
                  livScore >= 3 && oppData.applicable ? 'border-green-200 bg-green-50/30' : ''
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => updateOpportunityApplicable(id, oppDef.id, !oppData.applicable)}
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border-2 transition-colors',
                      oppData.applicable
                        ? 'bg-brand border-brand text-white'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    {oppData.applicable && (
                      <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-gray-500">{oppDef.id}</span>
                      <span className="font-bold text-sm text-gray-900">{oppDef.title}</span>
                      <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                        {oppDef.category}
                      </span>
                      {oppData.applicable && <OpportunityChip label={livLabel} score={livScore} />}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{oppDef.description}</p>

                    {oppData.applicable && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Likelihood</p>
                          <p className="text-[11px] text-gray-400 mb-2">{oppDef.likelihoodHint}</p>
                          <div className="flex flex-wrap gap-1">
                            {PROB_VALUES.map((v) => (
                              <button
                                key={v}
                                onClick={() =>
                                  updateOpportunityItem(id, oppDef.id, v, oppData.impact)
                                }
                                className={cn(
                                  'rounded-lg px-2.5 py-1 text-xs font-medium border transition-all',
                                  oppData.likelihood === v
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-surface-border hover:border-brand'
                                )}
                              >
                                {PROB_LABELS[v]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">Impact</p>
                          <p className="text-[11px] text-gray-400 mb-2">{oppDef.impactHint}</p>
                          <div className="flex flex-wrap gap-1">
                            {IMPACT_VALUES.map((v) => (
                              <button
                                key={v}
                                onClick={() =>
                                  updateOpportunityItem(id, oppDef.id, oppData.likelihood, v)
                                }
                                className={cn(
                                  'rounded-lg px-2.5 py-1 text-xs font-medium border transition-all',
                                  oppData.impact === v
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-gray-600 border-surface-border hover:border-brand'
                                )}
                              >
                                {IMPACT_LABELS[v]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {oppData.applicable && livScore > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <OpportunityMatrix value={livScore} />
                        <span className="text-xs text-gray-500">Rating: {livLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-surface-border">
        <Link href={`/app/evaluate/${id}/stage-1`} className="btn-secondary text-sm">
          ← Back to Stage I
        </Link>
        <Button
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight size={16} />}
          onClick={handleSaveAndNext}
        >
          Continue to Impact Summary
        </Button>
      </div>
    </div>
  );
}
