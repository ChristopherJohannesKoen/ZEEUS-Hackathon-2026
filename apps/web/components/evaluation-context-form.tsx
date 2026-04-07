'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Field, Input, Select, buttonClassName } from '@packages/ui';
import { getNaceDivisionOptions, getStartupStageOptions } from '@packages/scoring';
import type { EvaluationContextPayload } from '@packages/shared';
import { createEvaluation, updateEvaluationContext } from '../lib/client-api';

const naceOptions = getNaceDivisionOptions();
const startupStageOptions = getStartupStageOptions();

export function EvaluationContextForm({
  initialValue,
  evaluationId,
  mode
}: {
  initialValue?: EvaluationContextPayload;
  evaluationId?: string;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <Card className="border-[#d4e8c2] shadow-[0_25px_60px_-45px_rgba(0,101,74,0.5)]">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-[#e6f4d0] text-[#365c2b]" tone="emerald">
          Startup context
        </Badge>
        <p className="text-sm text-[#4c6146]">
          These inputs personalise the SDG pre-screen and the full assessment workflow.
        </p>
      </div>
      <form
        className="mt-6 grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsPending(true);
          setErrorMessage(null);

          const formData = new FormData(event.currentTarget);
          const payload: EvaluationContextPayload = {
            name: String(formData.get('name') ?? ''),
            country: String(formData.get('country') ?? ''),
            naceDivision: String(formData.get('naceDivision') ?? ''),
            offeringType: String(
              formData.get('offeringType') ?? 'product'
            ) as EvaluationContextPayload['offeringType'],
            launched: String(formData.get('launched') ?? 'false') === 'true',
            currentStage: String(
              formData.get('currentStage') ?? 'pre_seed'
            ) as EvaluationContextPayload['currentStage'],
            innovationApproach: String(
              formData.get('innovationApproach') ?? 'sustaining'
            ) as EvaluationContextPayload['innovationApproach']
          };

          try {
            const evaluation =
              mode === 'create'
                ? await createEvaluation(payload)
                : await updateEvaluationContext(evaluationId!, payload);
            router.push(`/app/evaluate/${evaluation.id}/summary`);
            router.refresh();
          } catch (error) {
            setErrorMessage(
              error instanceof Error ? error.message : 'Unable to save this evaluation.'
            );
          } finally {
            setIsPending(false);
          }
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field hint="Use the startup or venture name shown in your report." label="Name">
            <Input
              defaultValue={initialValue?.name}
              name="name"
              placeholder="Circular Grid Labs"
              required
            />
          </Field>
          <Field
            hint="Country context helps frame stage and market interpretation."
            label="Country"
          >
            <Input
              defaultValue={initialValue?.country}
              name="country"
              placeholder="Germany"
              required
            />
          </Field>
        </div>

        <Field
          hint="The web version uses NACE divisions to keep the business categorisation consistent."
          label="NACE division"
        >
          <Select defaultValue={initialValue?.naceDivision} name="naceDivision" required>
            <option value="">Select a NACE division</option>
            {naceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            hint="The toolkit adapts a few suggestions depending on the offering type."
            label="Offering type"
          >
            <Select defaultValue={initialValue?.offeringType} name="offeringType" required>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </Select>
          </Field>
          <Field
            hint="Choose yes only if the offer is already launched to the market."
            label="Launched"
          >
            <Select
              defaultValue={initialValue ? String(initialValue.launched) : 'false'}
              name="launched"
              required
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            hint="This drives the stage-based SDG suggestions and next-step guidance."
            label="Current stage"
          >
            <Select defaultValue={initialValue?.currentStage} name="currentStage" required>
              {startupStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            hint="Choose the closest fit to how the venture changes the market."
            label="Innovation approach"
          >
            <Select
              defaultValue={initialValue?.innovationApproach}
              name="innovationApproach"
              required
            >
              <option value="sustaining">Sustaining</option>
              <option value="disruptive">Disruptive</option>
            </Select>
          </Field>
        </div>

        <details className="rounded-2xl border border-[#dce8ce] bg-[#fbfdf7] p-4 text-sm text-[#5d7058]">
          <summary className="cursor-pointer font-semibold text-[#355d2d]">
            Why this matters
          </summary>
          <p className="mt-3 leading-7">
            The tool is an early guidance instrument, not a judgement. These answers create an
            initial compass reading before the full inside-out and outside-in assessment.
          </p>
        </details>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-[#00654A] px-5 hover:bg-[#0b7a59]"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Create evaluation' : 'Save context'}
          </Button>
          <button
            className={buttonClassName({ variant: 'secondary' })}
            onClick={() => router.back()}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
