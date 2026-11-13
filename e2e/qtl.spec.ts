import { expect, test, type Page } from '@playwright/test';

async function openHumanIgh(page: Page): Promise<void> {
  const response = await page.goto('/dash_qtl?species=Human&locus=IGH');
  expect(response?.status()).toBeLessThan(400);

  const dashboard = page.locator('app-dash-qtl');
  await expect(dashboard.getByLabel('Species')).toHaveValue(/Human/);
  await expect(dashboard.getByLabel('Locus')).toHaveValue(/IGH/);
  await expect(dashboard.locator('.rail-note', { hasText: 'genes scanned' })).toBeVisible({
    timeout: 45_000,
  });
  await expect(dashboard.locator('.qtl-status.error')).toHaveCount(0);
}

async function openSummary(page: Page): Promise<void> {
  await page.locator('.qtl-rail').getByRole('button', { name: 'Summary of hits' }).click();
  await expect(page.getByRole('heading', { name: 'Per gene, IGH' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.locator('app-qtl-summary table.gene-table tr').nth(1)).toBeVisible();
}

test('QTL summary filters genes and opens a gene scan and its variant', async ({ page }) => {
  test.setTimeout(180_000);
  await openHumanIgh(page);
  await expect(page.getByText('Every analysis here is one study')).toBeVisible();
  await openSummary(page);

  const summary = page.locator('app-qtl-summary');
  await expect(summary.locator('.totals')).toContainText('IGH:');
  await expect(summary.locator('plotly-plot .js-plotly-plot')).toBeVisible();

  const filter = summary.getByPlaceholder('filter by gene name');
  await filter.fill('no-matching-gene-xyz');
  await expect(summary.getByText('No gene matches those filters.')).toBeVisible();
  await summary.getByRole('button', { name: 'clear', exact: true }).click();

  const firstGene = summary.locator('table.gene-table tr').nth(1).locator('td').first()
    .getByRole('button');
  const geneName = (await firstGene.innerText()).trim();
  await firstGene.click();
  await expect(page.locator('app-qtl-manhattan .scan-title')).toHaveText(`Manhattan, ${geneName}`, {
    timeout: 60_000,
  });
  await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('gene');
  await expect(page.locator('app-qtl-manhattan .qtl-summary')).toContainText('variants');
  await expect(page.locator('app-qtl-manhattan plotly-plot .js-plotly-plot')).toBeVisible();

  const lead = page.locator('app-qtl-manhattan table.leads button').first();
  await expect(lead).toBeVisible();
  const variant = (await lead.innerText()).trim();
  await lead.click();
  await expect(page.locator('app-qtl-variant h3.variant-name')).toHaveText(variant, {
    timeout: 60_000,
  });
  await expect(page.locator('app-qtl-variant').getByRole('heading', { name: 'Usage by genotype' }))
    .toBeVisible();
  await expect(page.locator('app-qtl-variant table.assoc tr').nth(1)).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('plot')).toBe(variant);

  await page.reload();
  await expect(page.locator('app-qtl-variant h3.variant-name')).toHaveText(variant, {
    timeout: 60_000,
  });
  await page.locator('app-qtl-variant button.back-to-gene').click();
  await expect(page.locator('app-qtl-manhattan .scan-title')).toHaveText(`Manhattan, ${geneName}`, {
    timeout: 60_000,
  });
});

test('QTL summary opens a variant lookup and plots a gene', async ({ page }) => {
  test.setTimeout(180_000);
  await openHumanIgh(page);
  await openSummary(page);

  const lead = page.locator('app-qtl-summary table.gene-table tr')
    .filter({ has: page.locator('button.mono') }).first().locator('button.mono');
  await expect(lead).toBeVisible();
  const variant = (await lead.innerText()).trim();
  await lead.click();

  const lookup = page.locator('app-qtl-variant-lookup');
  await expect(lookup.locator('h3.variant-name')).toHaveText(variant, { timeout: 60_000 });
  await expect(lookup.locator('.verdict')).toContainText('gene usage QTL');
  await expect(lookup.locator('table.assoc tr').nth(1)).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('variant')).toBe(variant);

  await lookup.getByRole('button', { name: 'plot usage' }).first().click();
  await expect(page.locator('app-qtl-variant h3.variant-name')).toHaveText(variant, {
    timeout: 60_000,
  });
  await expect(page.locator('app-qtl-variant').getByRole('heading', { name: 'Usage by genotype' }))
    .toBeVisible();
  await page.locator('.qtl-rail button.chosen-drop').click();
  await expect(lookup.locator('h3.variant-name')).toHaveText(variant, { timeout: 60_000 });
});

test('QTL variant search finds a result across loci', async ({ page }) => {
  test.setTimeout(180_000);
  await openHumanIgh(page);
  await openSummary(page);

  const lead = page.locator('app-qtl-summary table.gene-table tr')
    .filter({ has: page.locator('button.mono') }).first().locator('button.mono');
  await expect(lead).toBeVisible();
  const variant = (await lead.innerText()).trim();

  await page.getByLabel('Locus').selectOption({ label: 'IGK' });
  await expect(page.getByRole('heading', { name: 'Per gene, IGK' })).toBeVisible({
    timeout: 60_000,
  });
  await page.locator('.qtl-rail').getByRole('button', { name: 'Start from a variant' }).click();
  const search = page.locator('app-qtl-search input');
  await search.fill('no-matching-variant-xyz');
  await expect(page.locator('app-qtl-search')).toContainText('Nothing in this dataset matches', {
    timeout: 60_000,
  });
  await search.fill(variant);
  const hit = page.locator('app-qtl-search button.hit').filter({ hasText: variant }).first();
  await expect(hit).toBeVisible({ timeout: 60_000 });
  await hit.click();

  await expect(page.locator('app-qtl-variant-lookup h3.variant-name')).toHaveText(variant, {
    timeout: 60_000,
  });
  await expect(page.getByLabel('Locus')).toHaveValue(/IGH/);
  await expect.poll(() => new URL(page.url()).searchParams.get('locus')).toBe('IGH');
});

test('QTL pairing loads a variant and switches scan direction', async ({ page }) => {
  test.setTimeout(180_000);
  await openHumanIgh(page);
  await page.locator('.qtl-rail').getByRole('button', { name: 'Gene pairing' }).click();

  const rail = page.locator('.qtl-rail');
  const variants = rail.locator('.variant-list button.variant-link');
  await expect(variants.first()).toBeVisible({ timeout: 60_000 });
  const variant = (await variants.first().locator('.v-id').innerText()).trim();
  await variants.first().click();

  const pairing = page.locator('app-qtl-pairing');
  await expect(pairing.locator('h3.variant-name')).toHaveText(variant, { timeout: 60_000 });
  await expect(pairing.locator('.omnibus-table tr').nth(1)).toBeVisible();
  await expect(pairing.getByText('Pairing test, MANOVA of P(J|D)')).toBeVisible();

  await rail.getByRole('button', { name: 'P(D|J)' }).click();
  await expect(pairing.getByText('Pick a variant to see what it does to P(D|J).')).toBeVisible();
  await expect(variants.first()).toBeVisible({ timeout: 60_000 });
  const otherVariant = (await variants.first().locator('.v-id').innerText()).trim();
  await variants.first().click();
  await expect(pairing.locator('h3.variant-name')).toHaveText(otherVariant, { timeout: 60_000 });
  await expect(pairing.getByText('Pairing test, MANOVA of P(D|J)')).toBeVisible();
  await expect(pairing.locator('.omnibus-table tr').nth(1)).toBeVisible();
});
