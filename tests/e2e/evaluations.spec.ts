import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/e2e-db';
import { seededUsers, signIn } from './support/auth';

test.beforeEach(async () => {
  await resetDatabase('baseline');
});

test('runs the evaluation workflow through dashboard, completion, and revision history', async ({
  page
}) => {
  await signIn(page, seededUsers.owner);

  await page.goto('/app/evaluate/start');
  await page.getByTestId('evaluation-name').fill('EcoGrid Pilot');
  await page.getByTestId('evaluation-country').fill('South Africa');
  await page.getByTestId('evaluation-nace-division').selectOption({ index: 1 });
  await page.getByTestId('evaluation-offering-type').selectOption('product');
  await page.getByTestId('evaluation-launched').selectOption('true');
  await page.getByTestId('evaluation-current-stage').selectOption('validation');
  await page.getByTestId('evaluation-innovation-approach').selectOption('disruptive');
  await page.getByTestId('evaluation-context-submit').click();

  await expect(page.getByRole('heading', { name: 'EcoGrid Pilot' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue to Stage I' }).click();

  await expect(page.getByRole('heading', { name: 'Holistic Startup Assessment' })).toBeVisible();
  await page.getByTestId('stage-one-financial-roi').selectOption({ index: 1 });
  await page.getByTestId('stage-one-financial-sensitivity').selectOption({ index: 1 });
  await page.getByTestId('stage-one-financial-usp').selectOption({ index: 1 });
  await page.getByTestId('stage-one-financial-market-growth').selectOption({ index: 1 });
  await page.locator('[data-testid$="-applicable"]').first().check();
  await page.locator('[data-testid$="-magnitude"]').first().selectOption('high');
  await page.locator('[data-testid$="-scale"]').first().selectOption('high');
  await page.locator('[data-testid$="-irreversibility"]').first().selectOption('high');
  await page.locator('[data-testid$="-likelihood"]').first().selectOption('very_likely');
  await page.getByTestId('stage-one-submit').click();

  await expect(page.getByRole('heading', { name: 'Risks and opportunities' })).toBeVisible();
  await page.locator('[data-testid^="stage-two-risk-"][data-testid$="-applicable"]').first().check();
  await page
    .locator('[data-testid^="stage-two-risk-"][data-testid$="-probability"]')
    .first()
    .selectOption('very_likely');
  await page
    .locator('[data-testid^="stage-two-risk-"][data-testid$="-impact"]')
    .first()
    .selectOption('high');
  await page
    .locator('[data-testid^="stage-two-opportunity-"][data-testid$="-applicable"]')
    .first()
    .check();
  await page
    .locator('[data-testid^="stage-two-opportunity-"][data-testid$="-likelihood"]')
    .first()
    .selectOption('very_likely');
  await page
    .locator('[data-testid^="stage-two-opportunity-"][data-testid$="-impact"]')
    .first()
    .selectOption('high');
  await page.getByTestId('stage-two-submit').click();

  await expect(page.getByRole('heading', { name: 'What matters most right now' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'High-priority topics' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Relevant topics' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue to SDG alignment' }).click();

  await expect(page.getByRole('heading', { name: 'Merged stage and business SDGs' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue to dashboard' }).click();
  await page.waitForURL(/\/app\/evaluate\/[^/]+\/dashboard$/);

  await expect(page.getByRole('heading', { name: 'EcoGrid Pilot' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete evaluation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Export PDF' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Export CSV' })).toBeVisible();
  await page.getByTestId('evaluation-complete').click();

  await expect(page.getByTestId('evaluation-archive')).toBeVisible();
  await page.getByTestId('evaluation-revisions-link').click();

  await expect(page.getByRole('heading', { name: 'EcoGrid Pilot' })).toBeVisible();
  await expect(page.getByText('Saved revisions')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View snapshot' }).first()).toBeVisible();
});
