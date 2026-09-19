/**
 * The site's copy carries no em or en dashes (the owner asked for none).
 * Walks every rendered page, including every case study, and checks visible
 * text, page titles, meta tags, structured data, noscript and the aria-label,
 * title, alt and placeholder attributes.
 */
import { chromium } from '@playwright/test';
const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const ROUTES = ['/', '/about', '/projects', '/skills', '/lab', '/contact', '/build-log', '/education', '/resume', '/playground', '/nowhere'];
const { projects } = await import('../src/data/projects.ts').catch(() => ({ projects: [] }));
for (const p of projects) ROUTES.push(`/projects/${p.id}`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const DASH = /[—–]|--/;
let hits = 0;
for (const r of ROUTES) {
  await page.goto(base + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const found = await page.evaluate(re => {
    const rx = new RegExp(re.source);
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const t = walker.currentNode.nodeValue; if (rx.test(t) && !walker.currentNode.parentElement.closest('script,style')) out.push('text: ' + t.trim().slice(0, 90)); }
    for (const el of document.querySelectorAll('[aria-label],[title],[alt],[placeholder]'))
      for (const a of ['aria-label', 'title', 'alt', 'placeholder']) { const v = el.getAttribute(a); if (v && rx.test(v)) out.push(`${a}: ${v.slice(0, 90)}`); }
    if (rx.test(document.title)) out.push('title: ' + document.title);
    for (const m of document.querySelectorAll('meta[content]')) if (rx.test(m.content)) out.push(`meta ${m.name || m.getAttribute('property')}: ${m.content.slice(0, 80)}`);
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) if (rx.test(s.textContent)) out.push('ld+json');
    const ns = document.querySelector('noscript'); if (ns && rx.test(ns.textContent)) out.push('noscript');
    return out;
  }, { source: DASH.source });
  hits += found.length;
  console.log(`${found.length ? '✖' : '✔'} ${r}${found.length ? '\n    ' + found.join('\n    ') : ''}`);
}
await browser.close();
console.log(hits ? `${hits} dash(es) still on the site` : 'no dashes anywhere on the rendered site');
process.exit(hits ? 1 : 0);
