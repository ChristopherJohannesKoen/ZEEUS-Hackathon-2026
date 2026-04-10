'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  EvidenceAssetSummary,
  EvidenceReviewState,
  OpportunityCode,
  RiskCode,
  TopicCode
} from '@packages/shared';
import { Button, Card, Field, Input, Select, Textarea } from '@packages/ui';
import { createEvidenceAsset, uploadEvidenceFile } from '../lib/client-api';

const topicOptions: TopicCode[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'];
const riskOptions: RiskCode[] = [
  'climate_policy_risk',
  'water_scarcity_risk',
  'biodiversity_regulation_risk',
  'resource_scarcity_risk',
  'community_stability_risk',
  'consumer_governance_risk'
];
const opportunityOptions: OpportunityCode[] = [
  'climate_transition_opportunity',
  'water_reputation_opportunity',
  'biodiversity_reputation_opportunity',
  'circular_efficiency_opportunity',
  'community_reputation_opportunity',
  'governance_trust_opportunity'
];
const reviewStateOptions: EvidenceReviewState[] = [
  'draft',
  'review_requested',
  'validated',
  'needs_update'
];

export function EvidenceVaultClient({
  evaluationId,
  items
}: {
  evaluationId: string;
  items: EvidenceAssetSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formState, setFormState] = useState({
    kind: 'link',
    title: '',
    description: '',
    sourceUrl: '',
    ownerName: '',
    sourceDate: '',
    evidenceBasis: 'estimated',
    confidenceWeight: '0.5',
    linkedTopicCode: '',
    linkedRiskCode: '',
    linkedOpportunityCode: '',
    reviewState: 'draft'
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-surface-border">
        <h2 className="text-2xl font-black text-slate-950">Add evidence</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Capture notes, links, and supporting references so assumptions become easier to review and
          improve over time.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            startTransition(async () => {
              try {
                if (formState.kind === 'file') {
                  if (!selectedFile) {
                    throw new Error('Choose a file before saving a file evidence item.');
                  }

                  const payload = new FormData();
                  payload.set('file', selectedFile);
                  payload.set('title', formState.title || selectedFile.name);
                  payload.set('description', formState.description || '');
                  payload.set('ownerName', formState.ownerName || '');
                  payload.set('sourceDate', formState.sourceDate || '');
                  payload.set('evidenceBasis', formState.evidenceBasis);
                  payload.set('confidenceWeight', formState.confidenceWeight);
                  payload.set('linkedTopicCode', formState.linkedTopicCode || '');
                  payload.set('linkedRiskCode', formState.linkedRiskCode || '');
                  payload.set('linkedOpportunityCode', formState.linkedOpportunityCode || '');
                  payload.set('reviewState', formState.reviewState);
                  await uploadEvidenceFile(evaluationId, payload);
                } else {
                  await createEvidenceAsset(evaluationId, {
                    kind: formState.kind as 'file' | 'link' | 'note',
                    title: formState.title,
                    description: formState.description || null,
                    sourceUrl: formState.sourceUrl || null,
                    ownerName: formState.ownerName || null,
                    sourceDate: formState.sourceDate || null,
                    evidenceBasis: formState.evidenceBasis as 'measured' | 'estimated' | 'assumed',
                    confidenceWeight: Number(formState.confidenceWeight),
                    linkedTopicCode: (formState.linkedTopicCode || null) as TopicCode | null,
                    linkedRiskCode: (formState.linkedRiskCode || null) as RiskCode | null,
                    linkedOpportunityCode: (formState.linkedOpportunityCode ||
                      null) as OpportunityCode | null,
                    reviewState: formState.reviewState as EvidenceReviewState
                  });
                }
                setFormState({
                  kind: 'link',
                  title: '',
                  description: '',
                  sourceUrl: '',
                  ownerName: '',
                  sourceDate: '',
                  evidenceBasis: 'estimated',
                  confidenceWeight: '0.5',
                  linkedTopicCode: '',
                  linkedRiskCode: '',
                  linkedOpportunityCode: '',
                  reviewState: 'draft'
                });
                setSelectedFile(null);
                setFileInputKey((current) => current + 1);
                router.refresh();
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : 'Unable to create the evidence item.'
                );
              }
            });
          }}
        >
          <Field label="Evidence kind">
            <Select
              value={formState.kind}
              onChange={(event) =>
                setFormState((current) => ({ ...current, kind: event.target.value }))
              }
            >
              <option value="link">External link</option>
              <option value="note">Internal note</option>
              <option value="file">Binary upload</option>
            </Select>
          </Field>
          {formState.kind === 'file' ? (
            <Field label="File">
              <Input
                key={fileInputKey}
                required
                type="file"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setSelectedFile(nextFile);
                  if (nextFile && !formState.title) {
                    setFormState((current) => ({ ...current, title: nextFile.name }));
                  }
                }}
              />
            </Field>
          ) : null}
          <Field label="Title">
            <Input
              required
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            {formState.kind !== 'file' ? (
              <Field label="Source URL">
                <Input
                  placeholder="https://..."
                  value={formState.sourceUrl}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, sourceUrl: event.target.value }))
                  }
                />
              </Field>
            ) : (
              <div />
            )}
            <Field label="Owner">
              <Input
                value={formState.ownerName}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, ownerName: event.target.value }))
                }
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Source date">
              <Input
                type="date"
                value={formState.sourceDate}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, sourceDate: event.target.value }))
                }
              />
            </Field>
            <Field label="Evidence basis">
              <Select
                value={formState.evidenceBasis}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, evidenceBasis: event.target.value }))
                }
              >
                <option value="measured">Measured</option>
                <option value="estimated">Estimated</option>
                <option value="assumed">Assumed</option>
              </Select>
            </Field>
            <Field label="Confidence weight">
              <Input
                max="1"
                min="0"
                step="0.05"
                type="number"
                value={formState.confidenceWeight}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, confidenceWeight: event.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Linked topic">
            <Select
              value={formState.linkedTopicCode}
              onChange={(event) =>
                setFormState((current) => ({ ...current, linkedTopicCode: event.target.value }))
              }
            >
              <option value="">No direct topic link</option>
              {topicOptions.map((topicCode) => (
                <option key={topicCode} value={topicCode}>
                  {topicCode}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Linked risk">
              <Select
                value={formState.linkedRiskCode}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, linkedRiskCode: event.target.value }))
                }
              >
                <option value="">No direct risk link</option>
                {riskOptions.map((riskCode) => (
                  <option key={riskCode} value={riskCode}>
                    {riskCode.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Linked opportunity">
              <Select
                value={formState.linkedOpportunityCode}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    linkedOpportunityCode: event.target.value
                  }))
                }
              >
                <option value="">No direct opportunity link</option>
                {opportunityOptions.map((opportunityCode) => (
                  <option key={opportunityCode} value={opportunityCode}>
                    {opportunityCode.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Review state">
              <Select
                value={formState.reviewState}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, reviewState: event.target.value }))
                }
              >
                {reviewStateOptions.map((reviewState) => (
                  <option key={reviewState} value={reviewState}>
                    {reviewState.replaceAll('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}
          <div>
            <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
              {isPending ? 'Saving...' : 'Save evidence'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <Card className="border-dashed border-surface-border bg-[#fbfdf8]">
            <h2 className="text-xl font-bold text-slate-950">No evidence yet</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Start with one supporting note or external reference so the confidence layer has
              something concrete to point at.
            </p>
          </Card>
        ) : (
          items.map((item) => (
            <Card className="border-surface-border" key={item.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#58724d]">
                <span>{item.kind}</span>
                <span>/</span>
                <span>{item.evidenceBasis}</span>
                {item.linkedTopicCode ? (
                  <>
                    <span>/</span>
                    <span>{item.linkedTopicCode}</span>
                  </>
                ) : null}
                {item.reviewState ? (
                  <>
                    <span>/</span>
                    <span>{item.reviewState.replaceAll('_', ' ')}</span>
                  </>
                ) : null}
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-950">{item.title}</h3>
              {item.description ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              ) : null}
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                {item.sourceUrl ? (
                  <a
                    className="font-medium text-brand-dark"
                    href={item.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source
                  </a>
                ) : null}
                {item.hasBinary ? (
                  <a
                    className="font-medium text-brand-dark"
                    href={`/api/evaluations/${evaluationId}/evidence/${item.id}/download`}
                  >
                    Download file{item.fileName ? ` (${item.fileName})` : ''}
                  </a>
                ) : null}
                {item.ownerName ? <p>Owner: {item.ownerName}</p> : null}
                {item.sourceDate ? <p>Source date: {item.sourceDate}</p> : null}
                {item.linkedRiskCode ? (
                  <p>Risk link: {item.linkedRiskCode.replaceAll('_', ' ')}</p>
                ) : null}
                {item.linkedOpportunityCode ? (
                  <p>Opportunity link: {item.linkedOpportunityCode.replaceAll('_', ' ')}</p>
                ) : null}
                {item.byteSize !== null ? (
                  <p>File size: {(item.byteSize / 1024).toFixed(1)} KB</p>
                ) : null}
                {item.confidenceWeight !== null ? (
                  <p>Confidence weight: {(item.confidenceWeight * 100).toFixed(0)}%</p>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
