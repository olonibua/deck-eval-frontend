import { expect, test, type Browser, type Page } from '@playwright/test';

const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'password123';
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@deckeval.local', password: process.env.SEED_ADMIN_PASSWORD ?? 'admin12345' };
const RAE = { email: 'rater1@deckeval.local', password: PASSWORD };
const SAM = { email: 'rater2@deckeval.local', password: PASSWORD };

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAGUlEQVR4nGP8z0AaYCJR/aiGUQ2jGoaTBgDUzAERsbHvDwAAAABJRU5ErkJggg==',
  'base64',
);

async function signedIn(browser: Browser, user: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
  return page;
}

async function createTeamTask(admin: Page) {
  await admin.goto('/admin/tasks/new');
  await admin.fill('#title', `Team deck ${Date.now()}`);
  await admin.getByRole('button', { name: 'Create and continue' }).click();
  await admin.waitForURL(/\/admin\/tasks\/[^/]+\/edit\?step=2/);
  const taskId = admin.url().split('/admin/tasks/')[1].split('/')[0];
  await admin.getByRole('textbox', { name: 'Instructions' }).fill('Rate each response on its own.');
  await admin.getByRole('textbox', { name: 'User request' }).fill('Make a short deck about our quarter.');
  await admin.getByRole('button', { name: 'Save and continue' }).click();
  await admin.waitForURL(/step=3/);
  await admin.goto(`/admin/tasks/${taskId}/edit?step=4`);

  for (const label of ['A', 'B']) {
    await admin.getByRole('button', { name: 'Add response' }).click();
    const heading = admin.getByRole('heading', { name: new RegExp(`Response ${label}`) });
    await expect(heading).toBeVisible();
    await admin.locator('section', { has: heading }).locator('input[type=file][accept^="image"]').setInputFiles([{ name: 'slide1.png', mimeType: 'image/png', buffer: PNG }]);
    await expect(heading).toContainText('1 slide');
  }

  await admin.goto(`/admin/tasks/${taskId}/edit?step=5`);
  await admin.getByLabel('Only the people picked below').check();
  await admin.getByLabel(/Rae Rater/).check();
  await admin.getByLabel(/Sam Rater/).check();
  await admin.getByRole('button', { name: 'Save assignment' }).click();
  await expect(admin.getByText('Assignment saved')).toBeVisible();
  await admin.getByRole('button', { name: 'Publish' }).click();
  await expect(admin.getByText('Published', { exact: true }).first()).toBeVisible();
  return taskId;
}

const explanationBox = (page: Page) => page.getByRole('complementary', { name: 'Rating' }).locator('textarea').first();

test('two teammates edit one shared sheet live', async ({ browser }) => {
  const admin = await signedIn(browser, ADMIN);
  const taskId = await createTeamTask(admin);

  const rae = await signedIn(browser, RAE);
  const sam = await signedIn(browser, SAM);
  for (const page of [rae, sam]) {
    await page.goto(`/tasks/${taskId}`);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  }

  await expect(rae.getByText(/You and Sam Rater are rating this deck together/)).toBeVisible();
  await expect(sam.getByText(/You and Rae Rater are rating this deck together/)).toBeVisible();

  await explanationBox(rae).click();
  await explanationBox(rae).pressSequentially('i am boy, ');
  await expect(explanationBox(sam)).toHaveValue('i am boy, ', { timeout: 5000 });
  await expect(sam.getByText(/Rae Rater is (typing in|on) Response A/)).toBeVisible();
  await expect(sam.getByRole('complementary', { name: 'Rating' }).getByText(/Rae Rater is (typing…|here)/)).toBeVisible();

  await explanationBox(sam).fill('');
  await expect(explanationBox(rae)).toHaveValue('', { timeout: 5000 });

  await sam.getByRole('tab', { name: /Response B/ }).click();
  await expect(rae.getByText(/Sam Rater is (looking at|on|typing in) Response B/)).toBeVisible({ timeout: 5000 });
  await explanationBox(sam).fill('Sam wrote this on B.');
  await rae.getByRole('tab', { name: /Response B/ }).click();
  await expect(explanationBox(rae)).toHaveValue('Sam wrote this on B.', { timeout: 5000 });

  await explanationBox(sam).click();
  await explanationBox(sam).pressSequentially(' More');
  await expect(rae.getByRole('complementary', { name: 'Rating' }).getByText(/Sam Rater is typing…/)).toBeVisible();
  await rae.reload();
  await rae.getByRole('tab', { name: /Response B/ }).click();
  await expect(explanationBox(rae)).toHaveValue('Sam wrote this on B. More');

  await rae.getByRole('button', { name: 'Leave team' }).click();
  await rae.getByRole('button', { name: 'Leave', exact: true }).click();
  await rae.waitForURL((url) => url.pathname === '/');
  await expect(sam.getByText(/Rae Rater (has not joined yet|is away)/)).toBeVisible({ timeout: 5000 });
  await sam.reload();
  await sam.getByRole('tab', { name: /Response B/ }).click();
  await expect(explanationBox(sam)).toHaveValue('Sam wrote this on B. More');
});
