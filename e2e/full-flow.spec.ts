import { expect, test, type Page } from '@playwright/test';

const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'password123';
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@deckeval.local', password: process.env.SEED_ADMIN_PASSWORD ?? 'admin12345' };
const RATER = { email: 'rater1@deckeval.local', password: PASSWORD };
const REVIEWER = { email: 'reviewer@deckeval.local', password: PASSWORD };

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAGUlEQVR4nGP8z0AaYCJR/aiGUQ2jGoaTBgDUzAERsbHvDwAAAABJRU5ErkJggg==',
  'base64',
);
const EXPLANATION = 'Slide 2 states the headline figure clearly and the chart labels match the numbers in the brief.';

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function fillActivePanel(page: Page) {
  const panel = page.getByRole('complementary', { name: 'Rating' });
  for (const group of await panel.getByRole('radiogroup').all()) {
    const label = await group.getAttribute('aria-label');
    if (label?.startsWith('Rank')) continue;
    await group.getByRole('radio', { name: /^5/ }).click();
  }
  for (const box of await panel.locator('textarea').all()) await box.fill(EXPLANATION);
}

test('admin publishes, rater submits, reviewer returns then approves, admin exports', async ({ page }) => {
  const title = `E2E deck ${Date.now()}`;

  await signIn(page, ADMIN);
  await page.goto('/admin/tasks/new');
  await page.fill('#title', title);
  await page.selectOption('#priority', '1');
  await page.getByRole('button', { name: 'Create and continue' }).click();
  await page.waitForURL(/\/admin\/tasks\/[^/]+\/edit\?step=2/);
  const taskId = page.url().split('/admin/tasks/')[1].split('/')[0];

  await page.getByRole('textbox', { name: 'Instructions' }).fill('Please rate each response independently.');
  await page.getByRole('textbox', { name: 'User request' }).fill('Make a short deck about our quarter.');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.waitForURL(/step=3/);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL(/step=4/);

  for (const label of ['A', 'B', 'C']) {
    await page.getByRole('button', { name: 'Add response' }).click();
    await expect(page.getByRole('heading', { name: new RegExp(`Response ${label}`) })).toBeVisible();
    const input = page.locator('section', { has: page.getByRole('heading', { name: new RegExp(`Response ${label}`) }) }).locator('input[type=file][accept^="image"]');
    await input.setInputFiles([
      { name: 'slide2.png', mimeType: 'image/png', buffer: PNG },
      { name: 'slide10.png', mimeType: 'image/png', buffer: PNG },
      { name: 'slide1.png', mimeType: 'image/png', buffer: PNG },
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(`Response ${label}`) })).toContainText('3 slides');
  }

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published', { exact: true }).first()).toBeVisible();

  await signIn(page, RATER);
  await page.goto(`/tasks/${taskId}`);
  await page.getByRole('button', { name: 'Start task' }).click();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

  for (const label of ['A', 'B', 'C']) {
    await page.getByRole('tab', { name: new RegExp(`Response ${label}`) }).click();
    await fillActivePanel(page);
  }
  await page.getByRole('tab', { name: /Ranking/ }).click();
  const panel = page.getByRole('complementary', { name: 'Rating' });
  for (const [rank, label] of [['Rank 1', 'A'], ['Rank 2', 'B'], ['Rank 3', 'C']]) {
    await panel.getByRole('radiogroup', { name: rank }).getByRole('radio', { name: `Response ${label}` }).click();
  }
  await panel.locator('textarea').fill('A had the clearest story and B was close behind on layout.');
  await expect(page.getByText(/Saved ·/)).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForURL((url) => url.pathname === '/');

  await signIn(page, REVIEWER);
  await page.goto('/review');
  await page.getByRole('row', { name: new RegExp(title) }).getByRole('link', { name: 'Review' }).click();
  await page.getByRole('complementary', { name: 'Rating' }).getByRole('button', { name: 'Add a comment' }).first().click();
  await page.getByRole('textbox', { name: 'Comment' }).fill('This score looks generous given slide 3.');
  await page.getByRole('spinbutton', { name: 'Suggested value' }).fill('4');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Return' }).click();
  await page.waitForURL((url) => url.pathname === '/review');

  await signIn(page, RATER);
  await page.goto(`/tasks/${taskId}`);
  await expect(page.getByText('A reviewer sent this back')).toBeVisible();
  await page.getByRole('complementary', { name: 'Rating' }).getByRole('radiogroup').first().getByRole('radio', { name: /^4/ }).click();
  await expect(page.getByText(/Saved ·/)).toBeVisible();
  await page.getByRole('button', { name: 'Resubmit' }).click();
  await page.waitForURL((url) => url.pathname === '/');

  await signIn(page, REVIEWER);
  await page.goto('/review');
  await page.getByRole('row', { name: new RegExp(title) }).getByRole('link', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.waitForURL((url) => url.pathname === '/review');

  await signIn(page, ADMIN);
  const csv = await (await page.request.get('/api/admin/exports?format=csv&status=APPROVED')).text();
  const rows = csv.split('\r\n').filter((line) => line.includes(title));
  expect(rows).toHaveLength(3);
  expect(rows[0]).toContain(',A,4,');
});
