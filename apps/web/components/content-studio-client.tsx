'use client';

import { useState, useTransition } from 'react';
import type {
  ContentStatus,
  EditorialOverview,
  KnowledgeArticleCategory,
  ResourceAssetCategory
} from '@packages/shared';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@packages/ui';
import { useRouter } from 'next/navigation';
import {
  createCaseStudy,
  createFaqEntry,
  createKnowledgeArticle,
  createResourceAsset,
  uploadResourceAsset
} from '../lib/client-api';

const contentStatusOptions: ContentStatus[] = ['draft', 'published', 'archived'];
const articleCategoryOptions: KnowledgeArticleCategory[] = [
  'how_it_works',
  'methodology',
  'sdg_esrs',
  'partner',
  'contact'
];
const resourceCategoryOptions: ResourceAssetCategory[] = [
  'manual',
  'faq',
  'methodology',
  'sample_report',
  'workflow_asset'
];

function statusTone(status: ContentStatus) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'rose' as const;
  return 'amber' as const;
}

export function ContentStudioClient({ overview }: { overview: EditorialOverview }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [articleForm, setArticleForm] = useState({
    slug: '',
    title: '',
    summary: '',
    body: '',
    category: 'how_it_works' as KnowledgeArticleCategory,
    status: 'draft' as ContentStatus,
    locale: 'en',
    heroImageUrl: ''
  });
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    status: 'draft' as ContentStatus,
    locale: 'en',
    sortOrder: String(overview.faqEntries.length)
  });
  const [caseStudyForm, setCaseStudyForm] = useState({
    slug: '',
    title: '',
    startupName: '',
    summary: '',
    story: '',
    stage: '',
    naceDivision: '',
    status: 'draft' as ContentStatus,
    locale: 'en',
    heroImageUrl: '',
    sortOrder: String(overview.caseStudies.length)
  });
  const [resourceForm, setResourceForm] = useState({
    slug: '',
    title: '',
    description: '',
    category: 'workflow_asset' as ResourceAssetCategory,
    fileLabel: 'Download',
    status: 'draft' as ContentStatus,
    locale: 'en',
    externalUrl: '',
    sortOrder: String(overview.resources.length)
  });

  function resetMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  return (
    <div className="grid gap-6">
      <Card className="border-surface-border bg-[#f4f9ee]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Editorial workflow
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Published content and inbound partner demand
            </h2>
          </div>
          <Badge tone="emerald">{overview.partnerInterestCount} partner leads</Badge>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Keep the public site editor-driven. Create articles, FAQs, case studies, and stored
          downloads without leaving the product.
        </p>
        {errorMessage ? (
          <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">{successMessage}</p>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">New article</h3>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMessages();
              startTransition(async () => {
                try {
                  await createKnowledgeArticle({
                    ...articleForm,
                    heroImageUrl: articleForm.heroImageUrl || null
                  });
                  setArticleForm({
                    slug: '',
                    title: '',
                    summary: '',
                    body: '',
                    category: 'how_it_works',
                    status: 'draft',
                    locale: 'en',
                    heroImageUrl: ''
                  });
                  setSuccessMessage('Article created.');
                  router.refresh();
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error ? error.message : 'Unable to create article.'
                  );
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input
                  required
                  value={articleForm.slug}
                  onChange={(event) =>
                    setArticleForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </Field>
              <Field label="Category">
                <Select
                  value={articleForm.category}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      category: event.target.value as KnowledgeArticleCategory
                    }))
                  }
                >
                  {articleCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Title">
              <Input
                required
                value={articleForm.title}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Summary">
              <Textarea
                required
                value={articleForm.summary}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </Field>
            <Field label="Body">
              <Textarea
                required
                className="min-h-48"
                value={articleForm.body}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, body: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Status">
                <Select
                  value={articleForm.status}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      status: event.target.value as ContentStatus
                    }))
                  }
                >
                  {contentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Locale">
                <Input
                  value={articleForm.locale}
                  onChange={(event) =>
                    setArticleForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="Hero image URL">
                <Input
                  placeholder="https://..."
                  value={articleForm.heroImageUrl}
                  onChange={(event) =>
                    setArticleForm((current) => ({ ...current, heroImageUrl: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : 'Create article'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">New resource</h3>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMessages();
              startTransition(async () => {
                try {
                  const created = await createResourceAsset({
                    ...resourceForm,
                    externalUrl: resourceForm.externalUrl || null,
                    sortOrder: Number(resourceForm.sortOrder)
                  });

                  if (resourceFile) {
                    const payload = new FormData();
                    payload.set('file', resourceFile);
                    await uploadResourceAsset(created.id, payload);
                  }

                  setResourceForm({
                    slug: '',
                    title: '',
                    description: '',
                    category: 'workflow_asset',
                    fileLabel: 'Download',
                    status: 'draft',
                    locale: 'en',
                    externalUrl: '',
                    sortOrder: String(overview.resources.length)
                  });
                  setResourceFile(null);
                  setSuccessMessage('Resource created.');
                  router.refresh();
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error ? error.message : 'Unable to create resource.'
                  );
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input
                  required
                  value={resourceForm.slug}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </Field>
              <Field label="Category">
                <Select
                  value={resourceForm.category}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      category: event.target.value as ResourceAssetCategory
                    }))
                  }
                >
                  {resourceCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Title">
              <Input
                required
                value={resourceForm.title}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Description">
              <Textarea
                required
                value={resourceForm.description}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Download label">
                <Input
                  required
                  value={resourceForm.fileLabel}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, fileLabel: event.target.value }))
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  min="0"
                  step="1"
                  type="number"
                  value={resourceForm.sortOrder}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Status">
                <Select
                  value={resourceForm.status}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      status: event.target.value as ContentStatus
                    }))
                  }
                >
                  {contentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Locale">
                <Input
                  value={resourceForm.locale}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="External URL">
                <Input
                  placeholder="https://..."
                  value={resourceForm.externalUrl}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, externalUrl: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field
              hint="Leave external URL empty and upload a binary to store the asset inside the product."
              label="Binary file"
            >
              <Input
                type="file"
                onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : 'Create resource'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">New FAQ</h3>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMessages();
              startTransition(async () => {
                try {
                  await createFaqEntry({
                    ...faqForm,
                    sortOrder: Number(faqForm.sortOrder)
                  });
                  setFaqForm({
                    question: '',
                    answer: '',
                    category: 'general',
                    status: 'draft',
                    locale: 'en',
                    sortOrder: String(overview.faqEntries.length)
                  });
                  setSuccessMessage('FAQ created.');
                  router.refresh();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : 'Unable to create FAQ.');
                }
              });
            }}
          >
            <Field label="Question">
              <Input
                required
                value={faqForm.question}
                onChange={(event) =>
                  setFaqForm((current) => ({ ...current, question: event.target.value }))
                }
              />
            </Field>
            <Field label="Answer">
              <Textarea
                required
                value={faqForm.answer}
                onChange={(event) =>
                  setFaqForm((current) => ({ ...current, answer: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Category">
                <Input
                  value={faqForm.category}
                  onChange={(event) =>
                    setFaqForm((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </Field>
              <Field label="Status">
                <Select
                  value={faqForm.status}
                  onChange={(event) =>
                    setFaqForm((current) => ({
                      ...current,
                      status: event.target.value as ContentStatus
                    }))
                  }
                >
                  {contentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Locale">
                <Input
                  value={faqForm.locale}
                  onChange={(event) =>
                    setFaqForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  min="0"
                  step="1"
                  type="number"
                  value={faqForm.sortOrder}
                  onChange={(event) =>
                    setFaqForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : 'Create FAQ'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">New case study</h3>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMessages();
              startTransition(async () => {
                try {
                  await createCaseStudy({
                    ...caseStudyForm,
                    heroImageUrl: caseStudyForm.heroImageUrl || null,
                    sortOrder: Number(caseStudyForm.sortOrder)
                  });
                  setCaseStudyForm({
                    slug: '',
                    title: '',
                    startupName: '',
                    summary: '',
                    story: '',
                    stage: '',
                    naceDivision: '',
                    status: 'draft',
                    locale: 'en',
                    heroImageUrl: '',
                    sortOrder: String(overview.caseStudies.length)
                  });
                  setSuccessMessage('Case study created.');
                  router.refresh();
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error ? error.message : 'Unable to create case study.'
                  );
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input
                  required
                  value={caseStudyForm.slug}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </Field>
              <Field label="Startup name">
                <Input
                  required
                  value={caseStudyForm.startupName}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({
                      ...current,
                      startupName: event.target.value
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Title">
              <Input
                required
                value={caseStudyForm.title}
                onChange={(event) =>
                  setCaseStudyForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Summary">
              <Textarea
                required
                value={caseStudyForm.summary}
                onChange={(event) =>
                  setCaseStudyForm((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </Field>
            <Field label="Story">
              <Textarea
                required
                className="min-h-40"
                value={caseStudyForm.story}
                onChange={(event) =>
                  setCaseStudyForm((current) => ({ ...current, story: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-5">
              <Field label="Stage">
                <Input
                  required
                  value={caseStudyForm.stage}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({ ...current, stage: event.target.value }))
                  }
                />
              </Field>
              <Field label="NACE division">
                <Input
                  required
                  value={caseStudyForm.naceDivision}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({
                      ...current,
                      naceDivision: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Status">
                <Select
                  value={caseStudyForm.status}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({
                      ...current,
                      status: event.target.value as ContentStatus
                    }))
                  }
                >
                  {contentStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Locale">
                <Input
                  value={caseStudyForm.locale}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  min="0"
                  step="1"
                  type="number"
                  value={caseStudyForm.sortOrder}
                  onChange={(event) =>
                    setCaseStudyForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Hero image URL">
              <Input
                placeholder="https://..."
                value={caseStudyForm.heroImageUrl}
                onChange={(event) =>
                  setCaseStudyForm((current) => ({
                    ...current,
                    heroImageUrl: event.target.value
                  }))
                }
              />
            </Field>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : 'Create case study'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="border-surface-border xl:col-span-2">
          <h3 className="text-xl font-bold text-slate-950">Articles</h3>
          <div className="mt-5 grid gap-3">
            {overview.articles.map((item) => (
              <div className="rounded-[24px] bg-[#f7f9f4] p-4" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.slug}</p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">FAQs</h3>
          <div className="mt-5 grid gap-3">
            {overview.faqEntries.map((item) => (
              <div className="rounded-[24px] bg-[#f7f9f4] p-4" key={item.id}>
                <p className="font-bold text-slate-950">{item.question}</p>
                <p className="mt-1 text-sm text-slate-600">{item.category}</p>
                <div className="mt-3">
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">Resources</h3>
          <div className="mt-5 grid gap-3">
            {overview.resources.map((item) => (
              <div className="rounded-[24px] bg-[#f7f9f4] p-4" key={item.id}>
                <p className="font-bold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.fileLabel}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {item.category.replaceAll('_', ' ')}
                </p>
                <div className="mt-3">
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
