import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/e2e-db';
import { seededUsers, signIn, signOutFromSidebar } from './support/auth';

test.beforeEach(async () => {
  await resetDatabase('baseline');
});

test('renders the public landing page and auth links', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Build your startup with sustainability in mind from day one'
    })
  ).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Start evaluation' })
  ).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'How it works' })
  ).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'About ZEEUS' })
  ).toBeVisible();
});

test('serves hardened security headers on public and protected pages', async ({ page }) => {
  const landingResponse = await page.goto('/');

  expect(landingResponse?.headers()['x-frame-options']).toBe('DENY');
  expect(landingResponse?.headers()['x-content-type-options']).toBe('nosniff');
  expect(landingResponse?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(landingResponse?.headers()['content-security-policy']).toContain(
    "script-src 'self' 'nonce-"
  );
  const reportOnlyPolicy = landingResponse?.headers()['content-security-policy-report-only'];

  if (reportOnlyPolicy) {
    expect(reportOnlyPolicy).toContain("style-src 'self' 'nonce-");
    expect(reportOnlyPolicy).not.toContain("'unsafe-inline'");
  }

  const loginResponse = await page.goto('/login');

  expect(loginResponse?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(loginResponse?.headers()['permissions-policy']).toContain('geolocation=()');

  await signIn(page, seededUsers.owner);
  const dashboardResponse = await page.goto('/app');

  expect(dashboardResponse?.headers()['cross-origin-opener-policy']).toBe('same-origin');
  expect(dashboardResponse?.headers()['cross-origin-resource-policy']).toBe('same-origin');
});

test('redirects unauthenticated users from protected routes', async ({ page }) => {
  for (const path of ['/app', '/app/evaluations', '/app/settings']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('keeps privileged bootstrap details off public auth pages', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Seeded owner email')).toHaveCount(0);
  await expect(page.getByText(seededUsers.owner.email)).toHaveCount(0);
  await expect(
    page.getByText('Sign in with an existing account to open the protected dashboard.')
  ).toBeVisible();

  await page.goto('/signup');
  await expect(page.getByText('Create the first owner')).toHaveCount(0);
  await expect(page.getByText('The first registered user becomes the owner.')).toHaveCount(0);
  await expect(
    page.getByText(
      'Create a team account to save evaluations, revisit the wizard, and export reports.'
    )
  ).toBeVisible();
});

test('redirects authenticated users away from login and signup', async ({ page }) => {
  await signIn(page, seededUsers.owner);

  await page.goto('/login');
  await expect(page).toHaveURL(/\/app$/);

  await page.goto('/signup');
  await expect(page).toHaveURL(/\/app$/);
});

test('signs in the seeded owner, updates the profile, and logs out', async ({ page }) => {
  await signIn(page, seededUsers.owner);
  await expect(page.getByRole('heading', { name: /Welcome back,/ })).toBeVisible();

  await page.goto('/app/settings');
  await page.getByTestId('profile-name').fill('Template Owner Updated');
  await page.getByTestId('profile-save').click();
  await expect(page.getByTestId('profile-name')).toHaveValue('Template Owner Updated');

  await signOutFromSidebar(page);
});

test('shows an error for invalid login credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('sign-in-email').fill(seededUsers.owner.email);
  await page.getByTestId('sign-in-password').fill('WrongPassword123!');
  await page.getByTestId('sign-in-submit').click();

  await expect(page.getByTestId('sign-in-error-region')).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByTestId('sign-in-error')).toContainText('Invalid email or password.');
});

test('completes the forgot and reset password flow end to end', async ({ page }) => {
  const newPassword = 'ChangedPass123!';

  await page.goto('/forgot-password');
  await page.getByTestId('forgot-password-email').fill(seededUsers.owner.email);
  await page.getByTestId('forgot-password-submit').click();

  await expect(page.getByTestId('forgot-password-result')).toContainText(
    'If the account exists, a password reset link has been generated for this environment.'
  );

  const tokenText = await page.getByTestId('forgot-password-token').textContent();
  const token = tokenText?.replace('Token: ', '').trim();

  if (!token) {
    throw new Error('Password reset token was not rendered.');
  }

  await page.goto(`/reset-password?token=${token}`);
  await page.getByTestId('reset-password-new-password').fill(newPassword);
  await page.getByTestId('reset-password-submit').click();
  await expect(page).toHaveURL(/\/app$/);

  await signOutFromSidebar(page);

  await page.goto('/login');
  await page.getByTestId('sign-in-email').fill(seededUsers.owner.email);
  await page.getByTestId('sign-in-password').fill(seededUsers.owner.password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('sign-in-error')).toContainText('Invalid email or password.');

  await page.getByTestId('sign-in-email').fill(seededUsers.owner.email);
  await page.getByTestId('sign-in-password').fill(newPassword);
  await page.getByTestId('sign-in-submit').click();
  await expect(page).toHaveURL(/\/app$/);
});

test('serves the new public guidance pages', async ({ page }) => {
  await page.goto('/methodology');
  await expect(
    page.getByRole('heading', { name: 'Deterministic scoring with startup-friendly guidance' })
  ).toBeVisible();
  await expect(page.getByText('Relevant topics begin at 2.0.')).toHaveCount(0);

  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();

  await page.goto('/resources');
  await expect(
    page.getByRole('heading', {
      name: 'Guides, manuals, score interpretation, and source-pack downloads'
    })
  ).toBeVisible();
  await expect(page.getByTestId('resource-core-downloads')).toContainText('User manual');
  await expect(page.getByTestId('resource-methodology-library')).toContainText(
    'Interpretation text used by the live workflow'
  );
  await expect(page.getByTestId('resource-methodology-library')).toContainText(
    'How to read relevant and high-priority topics'
  );
  await expect(page.getByTestId('resource-reference-metadata')).toContainText(
    'Active workbook and reference-pack metadata'
  );

  await page.goto('/partners');
  await expect(
    page.getByRole('heading', {
      name: 'Partner and program workflows'
    })
  ).toBeVisible();

  for (const [path, heading] of [
    ['/privacy', 'A clear statement of data handling responsibilities'],
    ['/accessibility', 'Designed for broad access and continuous improvement'],
    ['/cookies', 'Minimal, accountable use of browser storage'],
    ['/terms', 'Guidance-oriented use with institutional governance'],
    ['/funding-support', 'Part of a broader innovation and sustainability effort'],
    ['/consortium', 'A wider network behind the platform']
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('downloads a seeded source-pack asset from the reference hub', async ({ page }) => {
  await page.goto('/resources');

  const downloadPromise = page.waitForEvent('download');
  await page
    .getByTestId('resource-card-zeeus-user-manual')
    .getByRole('link', { name: /Download/i })
    .click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('Usermanual_ZEEUS.pdf');
});
