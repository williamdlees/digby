// Smoke test: loads each page in headless Chrome and checks that its component rendered.
// Needs the front end (npm start) and the back end running. No npm packages; uses the system Chrome.
// Run: npx -y -p node@22 node tests/smoke.mjs [base url, default http://localhost:4200]

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] || 'http://localhost:4200').replace(/\/$/, '');
const chrome = process.env.CHROME || 'google-chrome';

// route, component selector that must render with content, text the page must show
const pages = [
  ['/', 'app-home', 'Start with a question'],
  ['/', 'app-home', 'Cite VDJbase'],
  ['/', 'app-home', 'Download curated data'],
  ['/', 'app-home', 'post-card'],
  ['/', 'app-home', 'Search VDJbase'],
  ['/datarep', 'app-rep-explore-data', ''],
  ['/datagen', 'app-gen-explore-data', ''],
  ['/generep', 'app-rep-gene-table', ''],
  ['/genetable', 'app-genetable', ''],
  ['/reports', 'app-reports', ''],
  ['/dash_refbook', 'app-dash-refbook', ''],
  ['/dash_qtl', 'app-dash-qtl', ''],
  ['/user-guide', 'app-user-guide', ''],
  ['/quick-ref', 'app-quick-ref', ''],
  ['/licensing', 'app-licensing', 'CC0'],
];

// files that must be served as themselves, not as the app's index.html
const rootFiles = ['/robots.txt', '/sitemap.xml', '/llms.txt'];

const profile = mkdtempSync(join(tmpdir(), 'digby-smoke-'));
let failures = 0;

function check(ok, label, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) failures++;
}

function render(url) {
  const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`,
    '--virtual-time-budget=15000', '--enable-logging=stderr', '--v=0', '--dump-dom', url], { encoding: 'utf8', timeout: 60000 });
  const consoleErrors = (r.stderr || '').split('\n').filter(l => l.includes('CONSOLE') && /error/i.test(l));
  return { dom: r.stdout || '', consoleErrors };
}

try {
  for (const [route, selector, text] of pages) {
    const { dom, consoleErrors } = render(base + route);
    const m = dom.match(new RegExp(`<${selector}[^>]*>([\\s\\S]*?)</${selector}>`));
    check(m && /<[a-z]/i.test(m[1]), `${route} renders <${selector}>`);
    check(dom.includes('<app-header'), `${route} shows the menu`);
    if (text) check(dom.includes(text), `${route} shows "${text}"`);
    for (const e of consoleErrors) console.log(`     console: ${e.trim().slice(0, 200)}`);
  }

  for (const file of rootFiles) {
    let body = '';
    try { body = await (await fetch(base + file)).text(); } catch (e) { body = String(e); }
    check(body && !/<!doctype html/i.test(body), `${file} is served as a file`);
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
