'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEvaluationStore } from '@/store/evaluationStore';
import { FINANCIAL_KPIS, ESG_TOPICS } from '@/data/esg-topics';
import {
  calcImpactScore,
  scoreToBand,
  bandLabel,
  bandColor,
  calcFinancialTotal
} from '@/lib/scoring';
import type {
  ESGTopicAssessment,
  FinancialLevel,
  DimensionScore,
  LikelihoodValue,
  EvidenceBasis
} from '@/types/evaluation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityChip } from '@/components/ui/Badge';
import { ScoreBar } from '@/components/ui/ProgressBar';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  DollarSign,
  Leaf,
  Users,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

const SECTIONS = ['financial', 'environmental', 'social'] as const;
type Section = (typeof SECTIONS)[number];

const LIKELIHOOD_OPTIONS: { value: LikelihoodValue; label: string }[] = [
  { value: 0.25, label: 'Very unlikely (25%)' },
  { value: 0.5, label: 'Unlikely (50%)' },
  { value: 0.75, label: 'Likely (75%)' },
  { value: 1, label: 'Very likely (100%)' }
];

const DIMENSION_OPTIONS: { value: DimensionScore; label: string }[] = [
  { value: 0, label: 'N/A' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Significant' },
  { value: 4, label: 'High' }
];

function FormulaHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-surface-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-brand-dark hover:bg-brand/5 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={13} />
          How is the impact score calculated?
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-gray-600 bg-brand/3 space-y-2">
          <p className="font-mono bg-white border border-surface-border rounded-lg p-3 text-center text-sm">
            Score = ((Magnitude + Scale + Irreversibility) ÷ 3) × Likelihood
          </p>
          <ul className="space-y-1 list-disc pl-4">
            <li>
              <strong>Magnitude</strong> — severity of the impact if it occurs (1–4)
            </li>
            <li>
              <strong>Scale</strong> — how many people/areas are affected (1–4)
            </li>
            <li>
              <strong>Irreversibility</strong> — how hard is it to fix (1–4)
            </li>
            <li>
              <strong>Likelihood</strong> — probability of it occurring (25–100%)
            </li>
          </ul>
          <p className="text-gray-500">
            Score ≥ 2 = material topic. Score ≥ 2.5 = high priority. Mark N/A if the topic genuinely
            doesn't apply.
          </p>
        </div>
      )}
    </div>
  );
}

function ESGTopicRow({
  topic,
  assessment,
  onChange
}: {
  topic: (typeof ESG_TOPICS)[0];
  assessment: ESGTopicAssessment;
  onChange: (data: Partial<ESGTopicAssessment>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = calcImpactScore(assessment);
  const band = scoreToBand(score, assessment.applicable);

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        assessment.applicable
          ? 'border-surface-border bg-white'
          : 'border-dashed border-gray-200 bg-gray-50/50',
        band === 'high' && assessment.applicable && 'border-red-200 bg-red-50/30',
        band === 'relevant' && assessment.applicable && 'border-amber-200 bg-amber-50/20'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-gray-900">
              {topic.code} — {topic.title}
            </span>
            {assessment.applicable && <PriorityChip band={band} score={score} />}
          </div>
          <p className="text-xs text-gray-500 italic">"{topic.question}"</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {assessment.applicable && (
            <div className="w-28 hidden sm:block">
              <ScoreBar score={score} />
            </div>
          )}

          {/* Applicable toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <div
              onClick={() => onChange({ applicable: !assessment.applicable })}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors cursor-pointer',
                assessment.applicable ? 'bg-brand' : 'bg-gray-300'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  assessment.applicable ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </div>
            <span
              className={assessment.applicable ? 'text-brand-dark font-semibold' : 'text-gray-400'}
            >
              {assessment.applicable ? 'Applicable' : 'N/A'}
            </span>
          </label>

          <button
            onClick={() => setExpanded((v) => !v)}
            disabled={!assessment.applicable}
            className="p-1.5 rounded-lg hover:bg-surface-muted text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded inputs */}
      {expanded && assessment.applicable && (
        <div className="px-4 pb-4 border-t border-surface-border pt-4 space-y-4 animate-fade-in">
          {/* Magnitude guide */}
          <div className="rounded-xl bg-brand/5 p-3">
            <p className="text-[11px] font-bold text-brand-dark mb-2">
              Indicator-specific guide for {topic.title}:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className="text-[11px] text-gray-600">
                  <span className="font-semibold">
                    {['Low', 'Moderate', 'Significant', 'High'][level - 1]}:{' '}
                  </span>
                  {topic.magnitudeGuide[level as 1 | 2 | 3 | 4]}
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Magnitude */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Magnitude
                <span className="text-gray-400 font-normal ml-1">— severity if it occurs</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DIMENSION_OPTIONS.filter((o) => o.value !== 0).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ magnitude: opt.value })}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                      assessment.magnitude === opt.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-surface-border hover:border-brand hover:text-brand'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Scale
                <span className="text-gray-400 font-normal ml-1">— breadth of impact</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DIMENSION_OPTIONS.filter((o) => o.value !== 0).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ scale: opt.value })}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                      assessment.scale === opt.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-surface-border hover:border-brand hover:text-brand'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Irreversibility */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Irreversibility
                <span className="text-gray-400 font-normal ml-1">— difficulty to fix</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DIMENSION_OPTIONS.filter((o) => o.value !== 0).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ irreversibility: opt.value })}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                      assessment.irreversibility === opt.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-surface-border hover:border-brand hover:text-brand'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Likelihood */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Likelihood</label>
              <div className="flex gap-1.5 flex-wrap">
                {LIKELIHOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ likelihood: opt.value })}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                      assessment.likelihood === opt.value
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-surface-border hover:border-brand hover:text-brand'
                    )}
                  >
                    {opt.label.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence basis */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Evidence basis
              <span className="text-gray-400 font-normal ml-1">
                — how confident are you in these inputs?
              </span>
            </label>
            <div className="flex gap-2">
              {(['measured', 'estimated', 'assumed'] as EvidenceBasis[]).map((basis) => (
                <button
                  key={basis}
                  onClick={() => onChange({ evidenceBasis: basis })}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all border capitalize',
                    assessment.evidenceBasis === basis
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'bg-white text-gray-600 border-surface-border hover:border-brand'
                  )}
                >
                  {basis}
                </button>
              ))}
            </div>
          </div>

          {/* Live score display */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-3',
              band === 'high'
                ? 'bg-red-50 border border-red-100'
                : band === 'relevant'
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-brand/5 border border-brand/15'
            )}
          >
            <div className="text-2xl font-black text-brand-dark">{score.toFixed(2)}</div>
            <div>
              <PriorityChip band={band} />
              <p className="text-[11px] text-gray-500 mt-0.5">
                {band === 'high'
                  ? 'Strategic action recommended.'
                  : band === 'relevant'
                    ? 'Review recommendations for this topic.'
                    : band === 'low'
                      ? 'Monitor and reassess later.'
                      : band === 'verylow'
                        ? 'Minimal impact — no action needed now.'
                        : 'Not applicable — excluded from assessment.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Stage1Page({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { getEvaluation, updateStage1, updateESGTopic, initializeStage1IfNeeded } =
    useEvaluationStore();
  const [activeSection, setActiveSection] = useState<Section>('financial');

  useEffect(() => {
    initializeStage1IfNeeded(id);
  }, [id]);

  const evaluation = getEvaluation(id);
  if (!evaluation?.stage1) return null;

  const { stage1 } = evaluation;
  const envTopics = ESG_TOPICS.filter((t) => t.category === 'E');
  const socTopics = ESG_TOPICS.filter((t) => t.category === 'S' || t.category === 'G');

  const financialTotal = calcFinancialTotal(stage1.financial);

  function handleSaveAndNext() {
    router.push(`/app/evaluate/${id}/stage-2`);
  }

  const sectionConfig = [
    { key: 'financial' as Section, label: 'Financial', icon: <DollarSign size={15} /> },
    { key: 'environmental' as Section, label: 'Environmental', icon: <Leaf size={15} /> },
    { key: 'social' as Section, label: 'Social & Governance', icon: <Users size={15} /> }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">Stage I — Holistic Assessment</h1>
          <p className="text-sm text-gray-500">
            Inside-out: Financial, Environmental, and Social/Governance indicators for{' '}
            {evaluation.context.name}.
          </p>
        </div>
        <Button variant="primary" rightIcon={<ArrowRight size={15} />} onClick={handleSaveAndNext}>
          Save & Continue
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {sectionConfig.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all border',
              activeSection === sec.key
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-white text-gray-600 border-surface-border hover:border-brand hover:text-brand'
            )}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      {/* ─── Financial section ─── */}
      {activeSection === 'financial' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Financial Indicators</h2>
            <span className="text-sm font-bold text-brand-dark">{financialTotal} / 12</span>
          </div>

          {FINANCIAL_KPIS.map((kpi) => {
            const currentLevel = stage1.financial[
              kpi.id as keyof typeof stage1.financial
            ] as number;
            return (
              <Card key={kpi.id}>
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-gray-900 mb-0.5">{kpi.title}</h3>
                  <p className="text-xs text-gray-500">{kpi.description}</p>
                </div>
                <div className="space-y-2">
                  {([0, 1, 2, 3] as FinancialLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        const updated = { ...stage1.financial, [kpi.id]: level };
                        updateStage1(id, { ...stage1, financial: updated });
                      }}
                      className={cn(
                        'flex items-start gap-3 w-full rounded-xl px-4 py-3 text-left transition-all border',
                        currentLevel === level
                          ? 'bg-brand/8 border-brand/30 shadow-sm'
                          : 'bg-white border-surface-border hover:border-brand/30 hover:bg-brand/3'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0',
                          currentLevel === level ? 'border-brand bg-brand' : 'border-gray-300'
                        )}
                      >
                        {currentLevel === level && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span
                          className={cn(
                            'text-xs font-bold',
                            currentLevel === level ? 'text-brand-dark' : 'text-gray-700'
                          )}
                        >
                          Level {level}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">— {kpi.levels[level]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Environmental section ─── */}
      {activeSection === 'environmental' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Environmental Indicators (E1–E5)</h2>
          </div>
          <FormulaHelp />
          {envTopics.map((topic) => (
            <ESGTopicRow
              key={topic.id}
              topic={topic}
              assessment={
                stage1.environmental[topic.id] ?? {
                  topicId: topic.id,
                  applicable: true,
                  magnitude: 1,
                  scale: 1,
                  irreversibility: 1,
                  likelihood: 0.5,
                  evidenceBasis: 'assumed'
                }
              }
              onChange={(data) => updateESGTopic(id, topic.id, data)}
            />
          ))}
        </div>
      )}

      {/* ─── Social/Governance section ─── */}
      {activeSection === 'social' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Social & Governance Indicators (S1–S4, G1)</h2>
          </div>
          <FormulaHelp />
          {socTopics.map((topic) => (
            <ESGTopicRow
              key={topic.id}
              topic={topic}
              assessment={
                stage1.social[topic.id] ?? {
                  topicId: topic.id,
                  applicable: true,
                  magnitude: 1,
                  scale: 1,
                  irreversibility: 1,
                  likelihood: 0.5,
                  evidenceBasis: 'assumed'
                }
              }
              onChange={(data) => updateESGTopic(id, topic.id, data)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-surface-border">
        <Link href={`/app/evaluate/${id}/summary`} className="btn-secondary text-sm">
          ← Back to Summary
        </Link>
        <Button
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight size={16} />}
          onClick={handleSaveAndNext}
        >
          Continue to Stage II
        </Button>
      </div>
    </div>
  );
}
