import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/e2e-db';
import { seededUsers, signIn } from './support/auth';

test.beforeEach(async () => {
  await resetDatabase('baseline');
});

test('manager workflows preserve deterministic reviewer parity while handling assignments and comments', async ({
  page
}) => {
  await signIn(page, seededUsers.owner);
  await page.goto('/app/programs');
  await page.getByRole('link', { name: 'Open program' }).first().click();

  await expect(
    page.getByRole('heading', { name: 'ZEEUS Sustainability Cohort 2026' })
  ).toBeVisible();
  await expect(page.getByText('Deterministic workbook summary')).toBeVisible();
  await expect(page.getByText('Recommendation preview')).toBeVisible();
  await expect(page.getByText('Portfolio-level signals from immutable submissions')).toBeVisible();
  await expect(page.getByText('Assignment pressure and overdue states')).toBeVisible();

  await page
    .locator('[data-testid^="program-submission-rationale-"]')
    .first()
    .fill(
      'Approved because the revision already includes a deterministic snapshot, actionable recommendations, and a reviewer-ready evidence trail.'
    );
  await page
    .locator('[data-testid^="program-submission-status-"]')
    .first()
    .selectOption('approved');
  await expect(page.getByText('approved').first()).toBeVisible();
  await expect(page.getByText('Latest decision rationale')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open immutable report snapshot' }).first()
  ).toBeVisible();
  await expect(page.getByText('Review checklist')).toBeVisible();

  await page
    .locator('[data-testid^="program-submission-assignee-"]')
    .first()
    .selectOption({ label: 'ZEEUS Owner / manager' });
  await page.locator('[data-testid^="program-submission-due-"]').first().fill('2026-04-01');
  await page.locator('[data-testid^="program-submission-assign-"]').first().click();
  await expect(page.getByText('ZEEUS Owner', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('overdue').first()).toBeVisible();

  await page
    .locator('[data-testid^="program-submission-comment-"]')
    .first()
    .fill('Please keep the deterministic result and clarify the supporting evidence pack.');
  await page.locator('[data-testid^="program-submission-comment-submit-"]').first().click();

  await expect(
    page.getByText('Please keep the deterministic result and clarify the supporting evidence pack.')
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open immutable report snapshot' }).first()
  ).toBeVisible();
});
