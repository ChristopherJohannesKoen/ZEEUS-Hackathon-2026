'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEvaluationStore } from '@/store/evaluationStore';
import { NACE_DIVISIONS } from '@/data/nace';
import type {
  StartupContext,
  StartupStage,
  OfferingType,
  InnovationApproach
} from '@/types/evaluation';
import { Button } from '@/components/ui/Button';
import { Input, Select, SegmentedControl } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Globe2, Lightbulb } from 'lucide-react';

const STARTUP_STAGES: StartupStage[] = [
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

const COUNTRIES = [
  'Germany',
  'Netherlands',
  'France',
  'United Kingdom',
  'South Africa',
  'Kenya',
  'Nigeria',
  'United States',
  'Brazil',
  'India',
  'China',
  'Sweden',
  'Denmark',
  'Finland',
  'Norway',
  'Spain',
  'Portugal',
  'Italy',
  'Poland',
  'Czech Republic',
  'Other'
];

export default function StartEvaluationPage() {
  const router = useRouter();
  const { createEvaluation } = useEvaluationStore();

  const [form, setForm] = useState<Partial<StartupContext>>({
    name: '',
    country: '',
    naceCode: '',
    naceLabel: '',
    offeringType: 'Product',
    launched: false,
    stage: 'Ideation',
    innovationApproach: 'Sustaining'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.name?.trim()) newErrors.name = 'Startup name is required.';
    if (!form.naceCode) newErrors.naceCode = 'Please select a NACE division.';
    if (!form.stage) newErrors.stage = 'Please select a current stage.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const naceDiv = NACE_DIVISIONS.find((n) => n.code === form.naceCode);
    const context: StartupContext = {
      name: form.name!,
      country: form.country || 'Not specified',
      naceCode: form.naceCode!,
      naceLabel: naceDiv?.label ?? '',
      offeringType: form.offeringType as OfferingType,
      launched: form.launched as boolean,
      stage: form.stage as StartupStage,
      innovationApproach: form.innovationApproach as InnovationApproach
    };
    const id = createEvaluation(context);
    router.push(`/app/evaluate/${id}/summary`);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Link href="/app/evaluations" className="hover:text-brand">
            Evaluations
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">New Evaluation</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Start a new evaluation</h1>
        <p className="text-gray-500">
          Tell us about your startup. These inputs personalise your SDG suggestions and shape the
          entire assessment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-live="polite">
        {/* Startup basics */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe2 size={17} className="text-brand" />
            Startup basics
          </h2>
          <div className="space-y-4">
            <Input
              label="Startup name *"
              placeholder="e.g. AquaPure Tech"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <Select
              label="Country (optional)"
              value={form.country ?? ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Select country..."
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              hint="Used for reporting context — doesn't affect scoring."
            />

            <Select
              label="NACE Division *"
              value={form.naceCode ?? ''}
              onChange={(e) => {
                const div = NACE_DIVISIONS.find((n) => n.code === e.target.value);
                setForm({ ...form, naceCode: e.target.value, naceLabel: div?.label ?? '' });
              }}
              placeholder="Select NACE Division..."
              options={NACE_DIVISIONS.map((n) => ({
                value: n.code,
                label: `${n.code} — ${n.label}`
              }))}
              error={errors.naceCode}
              hint="Selects the relevant SDGs for your business category."
            />

            <SegmentedControl
              label="Offering type"
              options={[
                { value: 'Product', label: 'Product' },
                { value: 'Service', label: 'Service' }
              ]}
              value={form.offeringType ?? 'Product'}
              onChange={(v) => setForm({ ...form, offeringType: v as OfferingType })}
            />

            <SegmentedControl
              label="Already launched?"
              options={[
                { value: 'false', label: 'Not yet' },
                { value: 'true', label: 'Yes, launched' }
              ]}
              value={String(form.launched ?? false)}
              onChange={(v) => setForm({ ...form, launched: v === 'true' })}
            />
          </div>
        </Card>

        {/* Stage & innovation */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb size={17} className="text-brand" />
            Stage & innovation approach
          </h2>
          <div className="space-y-4">
            <Select
              label="Current stage *"
              value={form.stage ?? ''}
              onChange={(e) => setForm({ ...form, stage: e.target.value as StartupStage })}
              placeholder="Select stage..."
              options={STARTUP_STAGES.map((s) => ({ value: s, label: s }))}
              error={errors.stage}
              hint="This determines which SDGs are suggested by default."
            />

            <SegmentedControl
              label="Innovation approach"
              options={[
                { value: 'Sustaining', label: 'Sustaining (Incremental)' },
                { value: 'Disruptive', label: 'Disruptive (Radical)' }
              ]}
              value={form.innovationApproach ?? 'Sustaining'}
              onChange={(v) => setForm({ ...form, innovationApproach: v as InnovationApproach })}
            />

            <div className="rounded-xl bg-brand/5 border border-brand/15 p-3 text-xs text-gray-600 leading-relaxed">
              <strong className="text-brand-dark">Sustaining innovation</strong> improves existing
              products/services incrementally.{' '}
              <strong className="text-brand-dark">Disruptive innovation</strong> creates new markets
              or fundamentally changes existing ones.
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/app/evaluations" className="text-sm text-gray-500 hover:text-gray-800">
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            rightIcon={<ArrowRight size={16} />}
          >
            Create evaluation
          </Button>
        </div>
      </form>
    </div>
  );
}
