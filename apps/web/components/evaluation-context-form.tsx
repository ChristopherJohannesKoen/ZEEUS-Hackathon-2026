'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Field, Input, Select, buttonClassName } from '@packages/ui';
import {
  getBusinessCategoryOptions,
  getBusinessSubcategoryOptions,
  getExtendedNaceOptions,
  getStartupStageOptions,
  getWorkbookGuidance
} from '@packages/scoring';
import type { EvaluationContextPayload } from '@packages/shared';
import { createEvaluation, updateEvaluationContext } from '../lib/client-api';

const businessCategoryOptions = getBusinessCategoryOptions();
const startupStageOptions = getStartupStageOptions();
const workbookGuidance = getWorkbookGuidance();

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
  const [businessCategoryMain, setBusinessCategoryMain] = useState(
    initialValue?.businessCategoryMain ?? ''
  );
  const [businessCategorySubcategory, setBusinessCategorySubcategory] = useState(
    initialValue?.businessCategorySubcategory ?? initialValue?.naceDivision ?? ''
  );
  const [extendedNaceCode, setExtendedNaceCode] = useState(initialValue?.extendedNaceCode ?? '');

  const subcategoryOptions = getBusinessSubcategoryOptions(businessCategoryMain || null);
  const selectedSubcategory = subcategoryOptions.find(
    (option) => option.value === businessCategorySubcategory
  );
  const extendedNaceOptions = getExtendedNaceOptions({
    businessCategoryMain: businessCategoryMain || null,
    divisionCode: selectedSubcategory?.code ?? null
  });
  const selectedExtendedNace = extendedNaceOptions.find(
    (option) => option.code === extendedNaceCode
  );

  return (
    <Card className="border-[#d4e8c2] shadow-[0_25px_60px_-45px_rgba(0,101,74,0.5)]">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-[#e6f4d0] text-[#365c2b]" tone="emerald">
          Startup context
        </Badge>
        <p className="text-sm text-[#4c6146]">
          These inputs mirror the workbook primary-data section and personalise the SDG pre-screen,
          Stage I, and Stage II workflow.
        </p>
      </div>
      <form
        className="mt-6 grid gap-5"
        data-testid={`evaluation-context-form-${mode}`}
        onSubmit={async (event) => {
          event.preventDefault();
          setIsPending(true);
          setErrorMessage(null);

          const formData = new FormData(event.currentTarget);
          const payload: EvaluationContextPayload = {
            name: String(formData.get('name') ?? ''),
            country: String(formData.get('country') ?? '').trim() || null,
            businessCategoryMain: businessCategoryMain || null,
            businessCategorySubcategory: businessCategorySubcategory || null,
            extendedNaceCode: selectedExtendedNace?.code ?? null,
            extendedNaceLabel: selectedExtendedNace?.label ?? null,
            naceDivision:
              businessCategorySubcategory ||
              (selectedExtendedNace
                ? `${selectedExtendedNace.divisionCode} ${selectedExtendedNace.divisionLabel}`
                : null) ||
              businessCategoryMain ||
              null,
            offeringType: String(
              formData.get('offeringType') ?? 'product'
            ) as EvaluationContextPayload['offeringType'],
            launched: String(formData.get('launched') ?? 'false') === 'true',
            currentStage: String(
              formData.get('currentStage') ?? 'ideation'
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
          <Field hint="Use the startup or venture name shown in the report." label="Name">
            <Input
              data-testid="evaluation-name"
              defaultValue={initialValue?.name}
              name="name"
              placeholder="Circular Grid Labs"
              required
            />
          </Field>
          <Field
            hint="Optional in workbook logic. Add the country if it helps frame market and regulatory context."
            label="Country"
          >
            <Input
              data-testid="evaluation-country"
              defaultValue={
                initialValue?.country === 'Not specified' ? '' : (initialValue?.country ?? '')
              }
              name="country"
              placeholder="Germany"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            hint="This is the main workbook business category and drives the initial SDG screening."
            label="Business category (Main)"
          >
            <Select
              data-testid="evaluation-business-category-main"
              name="businessCategoryMain"
              onChange={(event) => {
                setBusinessCategoryMain(event.target.value);
                setBusinessCategorySubcategory('');
                setExtendedNaceCode('');
              }}
              required
              value={businessCategoryMain}
            >
              <option value="">Select a main business category</option>
              {businessCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            hint="Use the closest workbook subcategory when it is already clear."
            label="Subcategory"
          >
            <Select
              data-testid="evaluation-business-subcategory"
              disabled={!businessCategoryMain}
              name="businessCategorySubcategory"
              onChange={(event) => {
                setBusinessCategorySubcategory(event.target.value);
                setExtendedNaceCode('');
              }}
              value={businessCategorySubcategory}
            >
              <option value="">Select a subcategory</option>
              {subcategoryOptions.map((option) => (
                <option key={option.code} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          hint="Optional: use the extended NACE list when the main/subcategory view is still too broad."
          label="Extended NACE (Optional)"
        >
          <Select
            data-testid="evaluation-extended-nace"
            disabled={!businessCategoryMain}
            name="extendedNaceCode"
            onChange={(event) => setExtendedNaceCode(event.target.value)}
            value={extendedNaceCode}
          >
            <option value="">Select an extended NACE entry</option>
            {extendedNaceOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            hint="The workbook adapts some guidance depending on whether the offer is product- or service-led."
            label="Offering type"
          >
            <Select
              data-testid="evaluation-offering-type"
              defaultValue={initialValue?.offeringType}
              name="offeringType"
              required
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </Select>
          </Field>
          <Field
            hint="Choose yes only if the offer has already been launched to the market."
            label="Launched"
          >
            <Select
              data-testid="evaluation-launched"
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
            hint="This drives the stage-based SDG suggestions and the workbook phase guidance."
            label="Current stage"
          >
            <Select
              data-testid="evaluation-current-stage"
              defaultValue={initialValue?.currentStage}
              name="currentStage"
              required
            >
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
              data-testid="evaluation-innovation-approach"
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
            Workbook guidance for the initial summary
          </summary>
          <div className="mt-3 grid gap-3">
            {workbookGuidance.initialSummaryExplanationBlocks.slice(0, 3).map((block) => (
              <div key={block.title}>
                <p className="font-semibold text-[#355d2d]">{block.title}</p>
                <p className="mt-1 leading-7">{block.body}</p>
              </div>
            ))}
          </div>
        </details>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-[#00654A] px-5 hover:bg-[#0b7a59]"
            data-testid="evaluation-context-submit"
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
