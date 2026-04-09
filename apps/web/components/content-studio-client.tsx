'use client';

import { useEffect, useState, useTransition } from 'react';
import type {
  ContentStatus,
  ContentRevisionSummary,
  EditorialOverview,
  MediaAsset,
  PartnerLeadStatus,
  ResourceAssetCategory,
  SitePage,
  SitePagePreviewToken,
  SitePageType,
  SiteSetting
} from '@packages/shared';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@packages/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createResourceAsset,
  createSitePagePreviewToken,
  createSitePage,
  createSiteSetting,
  getContentRevisions,
  restoreSitePageRevision,
  updatePartnerLead,
  updateResourceAsset,
  updateSiteMediaAsset,
  updateSitePage,
  updateSiteSetting,
  uploadResourceAsset,
  uploadSiteMediaAsset
} from '../lib/client-api';

const contentStatusOptions: ContentStatus[] = ['draft', 'published', 'archived'];
const pageTypeOptions: SitePageType[] = [
  'landing',
  'institutional',
  'methodology',
  'support',
  'legal',
  'resource_hub'
];
const resourceCategoryOptions: ResourceAssetCategory[] = [
  'manual',
  'faq',
  'methodology',
  'sample_report',
  'workflow_asset'
];
const leadStatusOptions: PartnerLeadStatus[] = [
  'new',
  'reviewing',
  'contacted',
  'qualified',
  'archived'
];

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function toneForStatus(status: ContentStatus | PartnerLeadStatus) {
  if (status === 'published' || status === 'qualified') return 'emerald' as const;
  if (status === 'archived') return 'rose' as const;
  return 'amber' as const;
}

function emptyPageForm() {
  return {
    id: '',
    slug: '',
    locale: 'en',
    title: '',
    summary: '',
    pageType: 'institutional' as SitePageType,
    status: 'draft' as ContentStatus,
    heroEyebrow: '',
    heroTitle: '',
    heroBody: '',
    heroPrimaryCtaLabel: '',
    heroPrimaryCtaHref: '',
    heroSecondaryCtaLabel: '',
    heroSecondaryCtaHref: '',
    heroMediaAssetId: '',
    navigationLabel: '',
    navigationGroup: '',
    showInPrimaryNav: false,
    showInFooter: false,
    canonicalUrl: '',
    seoTitle: '',
    seoDescription: '',
    sortOrder: '0',
    sectionsJson: '[]'
  };
}

function emptySettingForm() {
  return {
    id: '',
    key: '',
    locale: 'en',
    title: '',
    description: '',
    valueJson: '{}'
  };
}

function emptyMediaForm() {
  return {
    id: '',
    slug: '',
    title: '',
    altText: '',
    caption: '',
    attribution: '',
    rights: '',
    locale: 'en',
    status: 'draft' as ContentStatus,
    focalPointX: '',
    focalPointY: ''
  };
}

function emptyResourceForm() {
  return {
    id: '',
    slug: '',
    title: '',
    description: '',
    category: 'workflow_asset' as ResourceAssetCategory,
    fileLabel: 'Download',
    status: 'draft' as ContentStatus,
    locale: 'en',
    externalUrl: '',
    sortOrder: '0'
  };
}

function pageToForm(page: SitePage) {
  return {
    id: page.id,
    slug: page.slug,
    locale: page.locale,
    title: page.title,
    summary: page.summary,
    pageType: page.pageType,
    status: page.status,
    heroEyebrow: page.heroEyebrow ?? '',
    heroTitle: page.heroTitle ?? '',
    heroBody: page.heroBody ?? '',
    heroPrimaryCtaLabel: page.heroPrimaryCtaLabel ?? '',
    heroPrimaryCtaHref: page.heroPrimaryCtaHref ?? '',
    heroSecondaryCtaLabel: page.heroSecondaryCtaLabel ?? '',
    heroSecondaryCtaHref: page.heroSecondaryCtaHref ?? '',
    heroMediaAssetId: page.heroMediaAssetId ?? '',
    navigationLabel: page.navigationLabel ?? '',
    navigationGroup: page.navigationGroup ?? '',
    showInPrimaryNav: page.showInPrimaryNav,
    showInFooter: page.showInFooter,
    canonicalUrl: page.canonicalUrl ?? '',
    seoTitle: page.seoTitle ?? '',
    seoDescription: page.seoDescription ?? '',
    sortOrder: String(page.sortOrder),
    sectionsJson: toPrettyJson(page.sections)
  };
}

function settingToForm(setting: SiteSetting) {
  return {
    id: setting.id,
    key: setting.key,
    locale: setting.locale,
    title: setting.title ?? '',
    description: setting.description ?? '',
    valueJson: toPrettyJson(setting.value)
  };
}

function mediaToForm(asset: MediaAsset) {
  return {
    id: asset.id,
    slug: asset.slug,
    title: asset.title,
    altText: asset.altText,
    caption: asset.caption ?? '',
    attribution: asset.attribution ?? '',
    rights: asset.rights ?? '',
    locale: asset.locale,
    status: asset.status,
    focalPointX: asset.focalPointX === null ? '' : String(asset.focalPointX),
    focalPointY: asset.focalPointY === null ? '' : String(asset.focalPointY)
  };
}

export function ContentStudioClient({ overview }: { overview: EditorialOverview }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [pageForm, setPageForm] = useState(emptyPageForm);
  const [settingForm, setSettingForm] = useState(emptySettingForm);
  const [mediaForm, setMediaForm] = useState(emptyMediaForm);
  const [resourceForm, setResourceForm] = useState(emptyResourceForm);
  const [pageRevisions, setPageRevisions] = useState<ContentRevisionSummary[]>([]);
  const [pagePreview, setPagePreview] = useState<SitePagePreviewToken | null>(null);

  function resetMessages() {
    setMessage(null);
    setErrorMessage(null);
  }

  function runMutation(task: () => Promise<void>) {
    resetMessages();
    startTransition(async () => {
      try {
        await task();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save changes.');
      }
    });
  }

  async function refreshPageRevisions(pageId: string) {
    const response = await getContentRevisions('site_page', pageId);
    setPageRevisions(response.items);
  }

  useEffect(() => {
    let cancelled = false;

    if (!pageForm.id) {
      setPageRevisions([]);
      setPagePreview(null);
      return;
    }

    void getContentRevisions('site_page', pageForm.id)
      .then((response) => {
        if (!cancelled) {
          setPageRevisions(response.items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load revision history.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageForm.id]);

  return (
    <div className="grid gap-6">
      <Card className="border-surface-border bg-[#f4f9ee]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
              Content Studio
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Operate the public site without code edits
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="emerald">{overview.sitePages.length} site pages</Badge>
            <Badge tone="slate">{overview.siteSettings.length} settings</Badge>
            <Badge tone="amber">{overview.partnerLeads.length} leads</Badge>
          </div>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          The critical public-site operating surface now lives here: page content, footer and
          navigation settings, media metadata, downloadable resources, and partner follow-up.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scoring version</p>
            <p className="mt-2 text-sm font-bold text-slate-950">
              {overview.referenceMetadata.scoringVersion}
            </p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Catalog version</p>
            <p className="mt-2 text-sm font-bold text-slate-950">
              {overview.referenceMetadata.catalogVersion}
            </p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workbook digest</p>
            <p className="mt-2 break-all text-xs font-semibold text-slate-950">
              {overview.referenceMetadata.workbookSha256}
            </p>
          </div>
          <div className="rounded-[20px] bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Extracted</p>
            <p className="mt-2 text-sm font-bold text-slate-950">
              {new Date(overview.referenceMetadata.extractedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
        {errorMessage ? (
          <p className="mt-4 text-sm font-medium text-rose-600">{errorMessage}</p>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Site pages</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Load an existing page, update it, or duplicate it into a draft.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setPageForm(emptyPageForm())}>
              New page
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {overview.sitePages.map((page) => (
              <button
                className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-brand hover:text-brand-dark"
                key={page.id}
                type="button"
                onClick={() => {
                  resetMessages();
                  setPageForm(pageToForm(page));
                }}
              >
                {page.slug}
              </button>
            ))}
          </div>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              runMutation(async () => {
                const payload = {
                  slug: pageForm.slug,
                  locale: pageForm.locale,
                  title: pageForm.title,
                  summary: pageForm.summary,
                  pageType: pageForm.pageType,
                  status: pageForm.status,
                  heroEyebrow: pageForm.heroEyebrow || null,
                  heroTitle: pageForm.heroTitle || null,
                  heroBody: pageForm.heroBody || null,
                  heroPrimaryCtaLabel: pageForm.heroPrimaryCtaLabel || null,
                  heroPrimaryCtaHref: pageForm.heroPrimaryCtaHref || null,
                  heroSecondaryCtaLabel: pageForm.heroSecondaryCtaLabel || null,
                  heroSecondaryCtaHref: pageForm.heroSecondaryCtaHref || null,
                  heroMediaAssetId: pageForm.heroMediaAssetId || null,
                  navigationLabel: pageForm.navigationLabel || null,
                  navigationGroup: pageForm.navigationGroup || null,
                  showInPrimaryNav: pageForm.showInPrimaryNav,
                  showInFooter: pageForm.showInFooter,
                  canonicalUrl: pageForm.canonicalUrl || null,
                  seoTitle: pageForm.seoTitle || null,
                  seoDescription: pageForm.seoDescription || null,
                  sections: JSON.parse(pageForm.sectionsJson),
                  sortOrder: Number(pageForm.sortOrder || 0)
                };

                if (pageForm.id) {
                  await updateSitePage(pageForm.id, payload);
                  await refreshPageRevisions(pageForm.id);
                  setMessage(`Updated page ${pageForm.slug}.`);
                } else {
                  await createSitePage(payload);
                  setMessage(`Created page ${pageForm.slug}.`);
                  setPageForm(emptyPageForm());
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input
                  required
                  value={pageForm.slug}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </Field>
              <Field label="Page type">
                <Select
                  value={pageForm.pageType}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      pageType: event.target.value as SitePageType
                    }))
                  }
                >
                  {pageTypeOptions.map((option) => (
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
                value={pageForm.title}
                onChange={(event) =>
                  setPageForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Summary">
              <Textarea
                required
                value={pageForm.summary}
                onChange={(event) =>
                  setPageForm((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hero eyebrow">
                <Input
                  value={pageForm.heroEyebrow}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, heroEyebrow: event.target.value }))
                  }
                />
              </Field>
              <Field label="Hero title">
                <Input
                  value={pageForm.heroTitle}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, heroTitle: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Hero body">
              <Textarea
                value={pageForm.heroBody}
                onChange={(event) =>
                  setPageForm((current) => ({ ...current, heroBody: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary CTA label">
                <Input
                  value={pageForm.heroPrimaryCtaLabel}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      heroPrimaryCtaLabel: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Primary CTA href">
                <Input
                  value={pageForm.heroPrimaryCtaHref}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      heroPrimaryCtaHref: event.target.value
                    }))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Secondary CTA label">
                <Input
                  value={pageForm.heroSecondaryCtaLabel}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      heroSecondaryCtaLabel: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Secondary CTA href">
                <Input
                  value={pageForm.heroSecondaryCtaHref}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      heroSecondaryCtaHref: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Hero media asset">
                <Select
                  value={pageForm.heroMediaAssetId}
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      heroMediaAssetId: event.target.value
                    }))
                  }
                >
                  <option value="">No hero media</option>
                  {overview.mediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.slug}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Status">
                <Select
                  value={pageForm.status}
                  onChange={(event) =>
                    setPageForm((current) => ({
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
                  value={pageForm.locale}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="Nav label">
                <Input
                  value={pageForm.navigationLabel}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, navigationLabel: event.target.value }))
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={pageForm.sortOrder}
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  checked={pageForm.showInPrimaryNav}
                  type="checkbox"
                  onChange={(event) =>
                    setPageForm((current) => ({
                      ...current,
                      showInPrimaryNav: event.target.checked
                    }))
                  }
                />
                Primary navigation
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  checked={pageForm.showInFooter}
                  type="checkbox"
                  onChange={(event) =>
                    setPageForm((current) => ({ ...current, showInFooter: event.target.checked }))
                  }
                />
                Footer
              </label>
            </div>
            <Field label="Sections JSON">
              <Textarea
                className="min-h-48 font-mono text-xs"
                value={pageForm.sectionsJson}
                onChange={(event) =>
                  setPageForm((current) => ({ ...current, sectionsJson: event.target.value }))
                }
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : pageForm.id ? 'Update page' : 'Create page'}
              </Button>
              {pageForm.id ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPageForm((current) => ({
                      ...current,
                      id: '',
                      slug: `${current.slug}-copy`,
                      status: 'draft'
                    }));
                    setMessage('Loaded page as a duplicate draft.');
                  }}
                >
                  Duplicate as draft
                </Button>
              ) : null}
              {pageForm.id ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    runMutation(async () => {
                      const previewToken = await createSitePagePreviewToken(pageForm.id);
                      setPagePreview(previewToken);
                      setMessage(`Created preview link for ${pageForm.slug}.`);
                    })
                  }
                >
                  Create preview link
                </Button>
              ) : null}
            </div>
            {pagePreview ? (
              <div className="rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Preview link</p>
                <a
                  className="mt-2 block break-all font-medium text-brand-dark underline"
                  href={pagePreview.previewUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {pagePreview.previewUrl}
                </a>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Expires {new Date(pagePreview.expiresAt).toLocaleString()}
                </p>
              </div>
            ) : null}
            {pageForm.id ? (
              <div className="rounded-2xl border border-surface-border bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Revision history</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Stored editorial snapshots for rollback and review
                    </p>
                  </div>
                  <Badge tone="slate">{pageRevisions.length} revisions</Badge>
                </div>
                <div className="mt-4 grid gap-3">
                  {pageRevisions.slice(0, 8).map((revision) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3"
                      key={revision.id}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {revision.changeSummary ?? 'Snapshot'}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {new Date(revision.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          runMutation(async () => {
                            const restored = await restoreSitePageRevision(pageForm.id, revision.id);
                            setPageForm(pageToForm(restored));
                            await refreshPageRevisions(pageForm.id);
                            setMessage(`Restored revision for ${pageForm.slug}.`);
                          })
                        }
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        </Card>

        <Card className="border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Site settings</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                These records drive the announcement bar, footer columns, and utility links.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSettingForm(emptySettingForm())}
            >
              New setting
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {overview.siteSettings.map((setting) => (
              <button
                className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-brand hover:text-brand-dark"
                key={setting.id}
                type="button"
                onClick={() => {
                  resetMessages();
                  setSettingForm(settingToForm(setting));
                }}
              >
                {setting.key}
              </button>
            ))}
          </div>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              runMutation(async () => {
                const payload = {
                  key: settingForm.key,
                  locale: settingForm.locale,
                  title: settingForm.title || null,
                  description: settingForm.description || null,
                  value: JSON.parse(settingForm.valueJson)
                };

                if (settingForm.id) {
                  await updateSiteSetting(settingForm.id, payload);
                  setMessage(`Updated setting ${settingForm.key}.`);
                } else {
                  await createSiteSetting(payload);
                  setMessage(`Created setting ${settingForm.key}.`);
                  setSettingForm(emptySettingForm());
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Key">
                <Input
                  required
                  value={settingForm.key}
                  onChange={(event) =>
                    setSettingForm((current) => ({ ...current, key: event.target.value }))
                  }
                />
              </Field>
              <Field label="Locale">
                <Input
                  value={settingForm.locale}
                  onChange={(event) =>
                    setSettingForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Title">
              <Input
                value={settingForm.title}
                onChange={(event) =>
                  setSettingForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={settingForm.description}
                onChange={(event) =>
                  setSettingForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            <Field label="Value JSON">
              <Textarea
                className="min-h-48 font-mono text-xs"
                value={settingForm.valueJson}
                onChange={(event) =>
                  setSettingForm((current) => ({ ...current, valueJson: event.target.value }))
                }
              />
            </Field>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : settingForm.id ? 'Update setting' : 'Create setting'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">Media library</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {overview.mediaAssets.map((asset) => (
              <button
                className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-brand hover:text-brand-dark"
                key={asset.id}
                type="button"
                onClick={() => setMediaForm(mediaToForm(asset))}
              >
                {asset.slug}
              </button>
            ))}
          </div>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              runMutation(async () => {
                if (mediaForm.id) {
                  await updateSiteMediaAsset(mediaForm.id, {
                    title: mediaForm.title,
                    altText: mediaForm.altText,
                    caption: mediaForm.caption || null,
                    attribution: mediaForm.attribution || null,
                    rights: mediaForm.rights || null,
                    locale: mediaForm.locale,
                    status: mediaForm.status,
                    focalPointX:
                      mediaForm.focalPointX === '' ? null : Number(mediaForm.focalPointX),
                    focalPointY: mediaForm.focalPointY === '' ? null : Number(mediaForm.focalPointY)
                  });
                  setMessage(`Updated media asset ${mediaForm.slug}.`);
                } else {
                  if (!mediaFile) {
                    throw new Error('Select a file before uploading a new media asset.');
                  }

                  const formData = new FormData();
                  formData.set('file', mediaFile);
                  formData.set('slug', mediaForm.slug);
                  formData.set('title', mediaForm.title);
                  formData.set('altText', mediaForm.altText);
                  formData.set('caption', mediaForm.caption);
                  formData.set('attribution', mediaForm.attribution);
                  formData.set('rights', mediaForm.rights);
                  formData.set('locale', mediaForm.locale);
                  formData.set('status', mediaForm.status);
                  await uploadSiteMediaAsset(formData);
                  setMessage(`Uploaded media asset ${mediaForm.slug}.`);
                  setMediaForm(emptyMediaForm());
                  setMediaFile(null);
                }
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input
                  required
                  value={mediaForm.slug}
                  onChange={(event) =>
                    setMediaForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </Field>
              <Field label="Title">
                <Input
                  required
                  value={mediaForm.title}
                  onChange={(event) =>
                    setMediaForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Alt text">
              <Input
                required
                value={mediaForm.altText}
                onChange={(event) =>
                  setMediaForm((current) => ({ ...current, altText: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Status">
                <Select
                  value={mediaForm.status}
                  onChange={(event) =>
                    setMediaForm((current) => ({
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
                  value={mediaForm.locale}
                  onChange={(event) =>
                    setMediaForm((current) => ({ ...current, locale: event.target.value }))
                  }
                />
              </Field>
              <Field label="Focal X">
                <Input
                  value={mediaForm.focalPointX}
                  onChange={(event) =>
                    setMediaForm((current) => ({ ...current, focalPointX: event.target.value }))
                  }
                />
              </Field>
              <Field label="Focal Y">
                <Input
                  value={mediaForm.focalPointY}
                  onChange={(event) =>
                    setMediaForm((current) => ({ ...current, focalPointY: event.target.value }))
                  }
                />
              </Field>
            </div>
            {!mediaForm.id ? (
              <Field label="File">
                <Input
                  required
                  type="file"
                  onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                />
              </Field>
            ) : null}
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending
                  ? 'Saving...'
                  : mediaForm.id
                    ? 'Update media asset'
                    : 'Upload media asset'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-surface-border">
          <h3 className="text-xl font-bold text-slate-950">Resources</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {overview.resources.map((resource) => (
              <button
                className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-brand hover:text-brand-dark"
                key={resource.id}
                type="button"
                onClick={() =>
                  setResourceForm({
                    id: resource.id,
                    slug: resource.slug,
                    title: resource.title,
                    description: resource.description,
                    category: resource.category,
                    fileLabel: resource.fileLabel,
                    status: resource.status,
                    locale: resource.locale,
                    externalUrl: resource.externalUrl ?? '',
                    sortOrder: String(resource.sortOrder)
                  })
                }
              >
                {resource.slug}
              </button>
            ))}
          </div>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              runMutation(async () => {
                const payload = {
                  slug: resourceForm.slug,
                  title: resourceForm.title,
                  description: resourceForm.description,
                  category: resourceForm.category,
                  fileLabel: resourceForm.fileLabel,
                  status: resourceForm.status,
                  locale: resourceForm.locale,
                  externalUrl: resourceForm.externalUrl || null,
                  sortOrder: Number(resourceForm.sortOrder || 0)
                };

                let resourceId = resourceForm.id;

                if (resourceForm.id) {
                  const updated = await updateResourceAsset(resourceForm.id, payload);
                  resourceId = updated.id;
                  setMessage(`Updated resource ${resourceForm.slug}.`);
                } else {
                  const created = await createResourceAsset(payload);
                  resourceId = created.id;
                  setMessage(`Created resource ${resourceForm.slug}.`);
                  setResourceForm(emptyResourceForm());
                }

                if (resourceFile && resourceId) {
                  const formData = new FormData();
                  formData.set('file', resourceFile);
                  await uploadResourceAsset(resourceId, formData);
                  setMessage(`Saved resource ${payload.slug} and uploaded its file.`);
                  setResourceFile(null);
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
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="File label">
                <Input
                  value={resourceForm.fileLabel}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, fileLabel: event.target.value }))
                  }
                />
              </Field>
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
              <Field label="Sort order">
                <Input
                  type="number"
                  value={resourceForm.sortOrder}
                  onChange={(event) =>
                    setResourceForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="External URL (optional)">
              <Input
                value={resourceForm.externalUrl}
                onChange={(event) =>
                  setResourceForm((current) => ({ ...current, externalUrl: event.target.value }))
                }
              />
            </Field>
            <Field label="Binary file (optional)">
              <Input
                type="file"
                onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <div>
              <Button className="bg-brand hover:bg-brand-dark" disabled={isPending} type="submit">
                {isPending ? 'Saving...' : resourceForm.id ? 'Update resource' : 'Create resource'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="border-surface-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-950">Partner lead inbox</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Update workflow status, assignee, and notes directly from the inbox.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">{overview.partnerLeads.length} active threads</Badge>
            <Link
              className="inline-flex items-center rounded-full border border-surface-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand-dark"
              href="/api/content/admin/partner-leads/export"
            >
              Export CSV
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {overview.partnerLeads.map((lead) => (
            <Card className="border-surface-border bg-[#fbfdf8]" key={lead.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#58724d]">
                    {lead.organizationName}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">{lead.name}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{lead.message}</p>
                </div>
                <Badge tone={toneForStatus(lead.status)}>{lead.status}</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Status">
                  <Select defaultValue={lead.status} id={`lead-status-${lead.id}`}>
                    {leadStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Assignee name">
                  <Input
                    defaultValue={lead.assigneeName ?? ''}
                    id={`lead-assignee-name-${lead.id}`}
                  />
                </Field>
                <Field label="Assignee email">
                  <Input
                    defaultValue={lead.assigneeEmail ?? ''}
                    id={`lead-assignee-email-${lead.id}`}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea defaultValue={lead.notes ?? ''} id={`lead-notes-${lead.id}`} />
              </Field>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {lead.email}
                  {lead.websiteUrl ? ` / ${lead.websiteUrl}` : ''}
                </p>
                <Button
                  className="bg-brand hover:bg-brand-dark"
                  disabled={isPending}
                  type="button"
                  onClick={() =>
                    runMutation(async () => {
                      const status = (
                        document.getElementById(
                          `lead-status-${lead.id}`
                        ) as HTMLSelectElement | null
                      )?.value;
                      const assigneeName = (
                        document.getElementById(
                          `lead-assignee-name-${lead.id}`
                        ) as HTMLInputElement | null
                      )?.value;
                      const assigneeEmail = (
                        document.getElementById(
                          `lead-assignee-email-${lead.id}`
                        ) as HTMLInputElement | null
                      )?.value;
                      const notes = (
                        document.getElementById(
                          `lead-notes-${lead.id}`
                        ) as HTMLTextAreaElement | null
                      )?.value;

                      await updatePartnerLead(lead.id, {
                        status: (status ?? lead.status) as PartnerLeadStatus,
                        assigneeName: assigneeName || null,
                        assigneeEmail: assigneeEmail || null,
                        notes: notes || null
                      });
                      setMessage(`Updated partner lead ${lead.organizationName}.`);
                    })
                  }
                >
                  Save lead
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
