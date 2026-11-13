import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/', selector: 'app-home' },
  { path: '/datarep', selector: 'app-rep-explore-data' },
  { path: '/samplerep/null', selector: 'app-sample-rep' },
  { path: '/generep', selector: 'app-rep-gene-table' },
  { path: '/datagen', selector: 'app-gen-explore-data' },
  { path: '/genesample/null', selector: 'app-gen-sample' },
  { path: '/genetable', selector: 'app-genetable' },
  { path: '/genebrowser/Human/IGH', selector: 'app-gene-browser' },
  { path: '/dash_refbook', selector: 'app-dash-refbook' },
  { path: '/dash_qtl', selector: 'app-dash-qtl' },
  { path: '/reports', selector: 'app-reports' },
  { path: '/downloads', selector: 'app-downloads' },
  { path: '/quick-ref', selector: 'app-quick-ref' },
  { path: '/user-guide', selector: 'app-user-guide' },
  { path: '/licensing', selector: 'app-licensing' },
  { path: '/auth', selector: 'app-auth' },
];

const backendBaseURL = 'http://127.0.0.1:5000';

async function openRoute(page: Page, path: string, selector: string): Promise<void> {
  const response = await page.goto(path);
  expect(response?.status(), `Opening ${path}`).toBeLessThan(400);
  await expect(page.locator(selector), `${path} should render ${selector}`).toBeVisible();
}

test('all application routes render directly', async ({ page }) => {
  test.setTimeout(300_000);
  for (const route of routes) {
    await openRoute(page, route.path, route.selector);
    await expect(page.locator('app-header')).toBeVisible();
  }

  await openRoute(page, '/reference_book/Human', 'app-home');
});

test('same-origin links on every route return successful responses', async ({ page, request, baseURL }) => {
  test.setTimeout(300_000);
  const allowedOrigins = new Set([
    new URL(baseURL!).origin,
    new URL(backendBaseURL).origin,
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ]);
  const targets = new Set<string>();

  for (const route of routes) {
    await openRoute(page, route.path, route.selector);
    const loadingIndicators = page.locator('app-root .spinner-border');
    await expect(loadingIndicators).toHaveCount(0, { timeout: 45_000 });

    const hrefs = await page.locator('a[href]').evaluateAll(anchors =>
      anchors.map(anchor => (anchor as HTMLAnchorElement).href),
    );

    for (const href of hrefs) {
      const target = new URL(href);
      if (!allowedOrigins.has(target.origin) || target.protocol !== 'http:' && target.protocol !== 'https:') {
        continue;
      }

      target.hash = '';
      targets.add(target.href);
    }
  }

  expect(targets.size, 'Expected to discover internal links').toBeGreaterThan(0);

  for (const url of targets) {
    let response = await request.head(url, { timeout: 30_000 });
    if (response.status() === 405 || response.status() === 501) {
      response = await request.get(url, { timeout: 30_000 });
    }
    expect(response.status(), `Checking internal link ${url}`).toBeLessThan(400);
  }
});

test('home search finds results and curated-data selection opens the chosen downloads', async ({ page }) => {
  await openRoute(page, '/', 'app-home');

  const siteSearch = page.getByRole('searchbox', { name: 'Search VDJbase' });
  await siteSearch.fill('IGH');
  await expect(page.locator('#site-results')).toContainText('IGH', { timeout: 30_000 });
  await siteSearch.press('Escape');
  await expect(page.locator('#site-results')).toBeHidden();

  await page.getByRole('button', { name: 'Download curated data' }).click();
  const species = page.locator('#dl-species');
  await expect(species.locator('option')).not.toHaveCount(0);
  await species.selectOption({ label: 'Human' });

  const loci = page.getByRole('group', { name: 'Locus' });
  const firstLocus = loci.getByRole('button').first();
  await expect(firstLocus).toBeVisible();
  const selectedDataset = (await firstLocus.innerText()).trim();
  await firstLocus.click();
  await page.getByRole('link', { name: 'Go to downloads' }).click();

  await expect(page).toHaveURL(new RegExp(`/downloads\\?species=Human&dataset=${selectedDataset}`));
  await expect(page.getByRole('heading', { name: `Studies in Human ${selectedDataset}` })).toBeVisible();
  await expect(page.locator('app-study-table')).toBeVisible();
});

test('gene table selection and quick search work with backend data', async ({ page }) => {
  const formWarnings: string[] = [];
  page.on('console', message => {
    if (message.type() === 'warning' && message.text().includes('NG01354')) {
      formWarnings.push(message.text());
    }
  });
  await openRoute(page, '/generep', 'app-rep-gene-table');

  const species = page.locator('#selectSpecies');
  await expect(species.locator('option')).not.toHaveCount(0);
  await species.selectOption({ label: 'Human' });

  const rows = page.locator('app-rep-gene-table-panel mat-row');
  await expect(rows.first()).toBeVisible({ timeout: 45_000 });
  const firstName = (await rows.first().locator('mat-cell').first().innerText()).trim();
  expect(firstName.length).toBeGreaterThan(0);

  const nameFilter = page.locator('mat-header-cell.mat-column-name app-filter button');
  await nameFilter.click();
  await page.getByRole('combobox', { name: 'Select Filter' }).click();
  await page.getByRole('option', { name: 'Matches' }).click();
  await page.getByPlaceholder('Filter value').fill(firstName);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(rows.first()).toContainText(firstName, { timeout: 30_000 });
  await nameFilter.click();
  await page.getByRole('button', { name: 'Clear Filter', exact: true }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  const search = page.locator('input[placeholder="Search..."]');
  await search.pressSequentially(firstName);
  await expect(rows.first()).toContainText(firstName, { timeout: 30_000 });

  await search.fill('');
  await search.pressSequentially('no-matching-gene-name-xyz');
  await expect(rows).toHaveCount(0, { timeout: 30_000 });
  expect(formWarnings).toEqual([]);
});

test('navigation works at desktop and mobile widths', async ({ page }) => {
  await openRoute(page, '/', 'app-home');
  await page.getByRole('link', { name: 'Allele Reference' }).click();
  await expect(page).toHaveURL(/\/dash_refbook(?:\?.*)?$/);
  await expect(page.locator('app-dash-refbook')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('link', { name: 'Explore AIRR-Seq Data' })).toBeVisible();
  await page.getByRole('link', { name: 'Explore AIRR-Seq Data' }).click();
  await expect(page).toHaveURL(/\/datarep$/);
  await expect(page.locator('app-rep-explore-data')).toBeVisible();
});
