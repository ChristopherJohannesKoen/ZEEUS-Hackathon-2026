'use client';
import { use, useEffect } from 'react';
import Link from 'next/link';
import { useEvaluationStore } from '@/store/evaluationStore';
import { SDG_DEFINITIONS, STAGE_SDG_MAP } from '@/data/sdgs';
import { NACE_SDG_MAP } from '@/data/nace';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/Badge';
import {
  ArrowRight,
  MapPin,
  Tag,
  Layers,
  Rocket,
  Zap,
  Globe2,
  CheckCircle2,
  Info
} from 'lucide-react';
const STARTUP_STAGES = [
  'Ideation',
  'Validation (Problem/Solution Fit)',
  'Prototype / MVP',
  'Pre-Launch / Market Entry',
  'Launch / Early Commercial Activity',
  'Post Launch',
  'Product-Market Fit (PMF)',
  'Growth & Channel Fit',
  'Revenue Validation / Business Model Fit',
  'Operational Foundation',
  'Early Scale / Fundraising Readiness'
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function SummaryPage({ params }: Props) {
  const { id } = use(params);
  const { getEvaluation, computeSDGAlignment, updateSDGAlignment, updateStatus } =
    useEvaluationStore();
  const evaluation = getEvaluation(id);

  useEffect(() => {
    if (evaluation && !evaluation.sdgAlignment) {
      const alignment = computeSDGAlignment(id);
      updateSDGAlignment(id, alignment);
    }
    if (evaluation && evaluation.status === 'draft') {
      updateStatus(id, 'in_progress');
    }
  }, [id]);

  if (!evaluation) return null;
  const ctx = evaluation.context;

  const stageSDGs = new Set<number>(STAGE_SDG_MAP[ctx.stage] ?? []);
  const naceSDGs = new Set<number>(NACE_SDG_MAP[ctx.naceCode] ?? []);
  const allSDGNums = [...new Set([...stageSDGs, ...naceSDGs])].sort((a, b) => a - b);
  const previewSDGs = allSDGNums.slice(0, 8);

  const stageIndex = STARTUP_STAGES.indexOf(ctx.stage as never);
  const stageProgress = Math.round(((stageIndex + 1) / STARTUP_STAGES.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">{ctx.name}</h1>
            <StatusChip status={evaluation.status} />
          </div>
          <p className="text-gray-500">
            Evaluation summary — review your context, then proceed to Stage I.
          </p>
        </div>
        <Link href={`/app/evaluate/${id}/stage-1`}>
          <Button variant="primary" rightIcon={<ArrowRight size={15} />}>
            Begin Stage I
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Startup context card */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe2 size={16} className="text-brand" /> Startup context
          </h2>
          <dl className="space-y-2.5">
            {[
              { label: 'Country', value: ctx.country, icon: <MapPin size={13} /> },
              {
                label: 'NACE Division',
                value: `${ctx.naceCode} — ${ctx.naceLabel}`,
                icon: <Tag size={13} />
              },
              { label: 'Offering', value: ctx.offeringType, icon: <Layers size={13} /> },
              {
                label: 'Status',
                value: ctx.launched ? 'Launched' : 'Pre-launch',
                icon: <Rocket size={13} />
              },
              { label: 'Stage', value: ctx.stage, icon: <Zap size={13} /> },
              { label: 'Innovation', value: ctx.innovationApproach, icon: <Zap size={13} /> }
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">{item.icon}</span>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 min-w-[90px]">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-800">{item.value}</span>
                </div>
              </div>
            ))}
          </dl>
          <Link
            href={`/app/evaluate/start`}
            className="mt-4 block text-xs text-brand hover:text-brand-dark font-medium"
          >
            Edit context →
          </Link>
        </Card>

        {/* Evaluation flow card */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand" /> Your evaluation path
          </h2>
          <div className="space-y-2.5">
            {[
              {
                step: 'Stage I',
                desc: 'Financial + Environmental + Social/Governance',
                done: !!evaluation.stage1
              },
              { step: 'Stage II', desc: 'Risks & Opportunities', done: !!evaluation.stage2 },
              {
                step: 'Impact Summary',
                desc: 'Material topics & priorities',
                done: !!evaluation.stage2
              },
              {
                step: 'SDG Alignment',
                desc: 'Relevant SDGs for your model',
                done: !!evaluation.sdgAlignment
              },
              {
                step: 'Dashboard',
                desc: 'Full results & recommendations',
                done: evaluation.status === 'completed'
              }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-brand' : 'bg-surface-border'}`}
                >
                  {item.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">{item.step}</span>
                  <span className="text-xs text-gray-500 ml-2">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SDG Pre-screen */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Globe2 size={16} className="text-brand" />
              Initial SDG Screening
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Based on your stage ({ctx.stage}) and business category (NACE {ctx.naceCode}), these
              SDGs are likely relevant.
            </p>
          </div>
          <span className="text-xs font-bold text-brand bg-brand/10 rounded-full px-2.5 py-1">
            {allSDGNums.length} SDGs identified
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {previewSDGs.map((num) => {
            const def = SDG_DEFINITIONS.find((s) => s.number === num);
            const isStage = stageSDGs.has(num);
            const isNace = naceSDGs.has(num);
            const source = isStage && isNace ? 'Both' : isStage ? 'Stage' : 'Business';
            return (
              <div
                key={num}
                title={def?.title}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: def?.color ?? '#39B54A' }}
              >
                <span>SDG {num}</span>
                <span className="opacity-70 text-[10px]">({source})</span>
              </div>
            );
          })}
          {allSDGNums.length > 8 && (
            <div className="flex items-center rounded-xl px-3 py-1.5 text-xs font-medium bg-surface-muted text-gray-500">
              +{allSDGNums.length - 8} more
            </div>
          )}
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
          <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            This is an early screening view, not the final SDG assessment. Your full SDG Alignment
            (combining Stage + NACE SDGs) will be generated after Stage II.
          </p>
        </div>
      </Card>

      {/* Next step CTA */}
      <div className="flex justify-end">
        <Link href={`/app/evaluate/${id}/stage-1`}>
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
            Start Stage I — Holistic Assessment
          </Button>
        </Link>
      </div>
    </div>
  );
}
