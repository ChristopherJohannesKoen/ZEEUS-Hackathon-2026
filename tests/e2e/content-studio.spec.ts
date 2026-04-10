import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/e2e-db';
import { seededUsers, signIn } from './support/auth';

test.beforeEach(async () => {
  await resetDatabase('baseline');
});

test('content studio stores site-page revisions and creates preview links', async ({ page }) => {
  const slug = 'playwright-preview-page';
  const originalSummary =
    'A Playwright-managed page used to verify editorial revisions, previews, and restore flows.';
  const updatedSummary =
    'An updated summary used to verify that revision restore returns the page to its earlier state.';

  await signIn(page, seededUsers.owner);
  await page.goto('/app/content-studio');
  await expect(page.getByText('Workbook digest')).toBeVisible();

  const sitePageForm = page.locator('form').first();

  await sitePageForm.getByLabel('Slug').fill(slug);
  await sitePageForm.getByLabel('Title', { exact: true }).fill('Playwright Preview Page');
  await sitePageForm.getByLabel('Summary').fill(originalSummary);
  await sitePageForm.getByLabel('Hero title').fill('Preview and revision testing');
  await sitePageForm
    .getByLabel('Hero body')
    .fill('This page is created by the E2E suite to verify editorial preview and restore support.');
  await sitePageForm.getByLabel('Primary CTA label').fill('Start evaluation');
  await sitePageForm.getByLabel('Primary CTA href').fill('/signup');
  await sitePageForm.getByRole('button', { name: 'Create page' }).click();

  await expect(page.getByText(`Created page ${slug}.`)).toBeVisible();
  await expect(page.getByRole('button', { name: slug })).toBeVisible();

  await page.getByRole('button', { name: slug }).click();
  await expect(sitePageForm.getByLabel('Summary')).toHaveValue(originalSummary);

  await sitePageForm.getByLabel('Summary').fill(updatedSummary);
  await sitePageForm.getByRole('button', { name: 'Update page' }).click();

  await expect(page.getByText(`Updated page ${slug}.`)).toBeVisible();
  await expect(page.getByText(/2 revisions/)).toBeVisible();

  await sitePageForm.getByRole('button', { name: 'Create preview link' }).click();
  await expect(page.getByText(`Created preview link for ${slug}.`)).toBeVisible();

  const previewHref = (await page.getByText(/\/preview\/[a-f0-9]+/).textContent())?.trim();
  if (!previewHref) {
    throw new Error('Preview link was not rendered.');
  }

  await page.goto(previewHref);
  await expect(page.getByRole('heading', { name: 'Preview and revision testing' })).toBeVisible();
  await expect(page.getByText('Preview mode.')).toBeVisible();

  await page.goto('/app/content-studio');
  await page.getByRole('button', { name: slug }).click();
  await expect(sitePageForm.getByLabel('Summary')).toHaveValue(updatedSummary);
  await page.getByRole('button', { name: 'Restore' }).nth(1).click();
  await expect(sitePageForm.getByLabel('Summary')).toHaveValue(originalSummary);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('zeeus-partner-leads.csv');
});
