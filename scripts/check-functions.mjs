/** Exercises the site's working parts end to end. */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];
const check = (label, pass, detail = '') => results.push([label, Boolean(pass), detail]);
const go = async path => {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
};

try {
// Projects: filter, search, sort, empty state.
await go('/projects');
const count = async () => page.locator('.project-grid .project-card').count();
check('all 11 projects listed', (await count()) === 11, String(await count()));
await page.getByRole('group', { name: 'Filter by type' }).getByRole('button', { name: 'Research', exact: true }).click();
await page.waitForTimeout(200);
check('filter by type', (await count()) === 2, String(await count()));
await page.getByRole('button', { name: 'All', exact: true }).first().click();
await page.getByPlaceholder('Search name, stack…').fill('grammy');
await page.waitForTimeout(200);
check('search by stack', (await count()) === 1 && (await page.locator('.project-grid h3').first().innerText()).includes('PixelSub'));
await page.getByPlaceholder('Search name, stack…').fill('zzzz-nothing');
await page.waitForTimeout(200);
check('empty state shows', await page.getByText('Nothing matches that.').isVisible());
await page.getByRole('button', { name: 'Clear filters' }).click();
await page.waitForTimeout(200);
check('clear filters restores all', (await count()) === 11);
await page.getByLabel('Sort projects').selectOption('name');
await page.waitForTimeout(200);
const titles = await page.locator('.project-grid .project-title').allInnerTexts();
check('sort by name', titles.join('|') === [...titles].sort((a, b) => a.localeCompare(b)).join('|'), titles[0]);
await page.getByLabel('Filter by status').selectOption('research');
await page.waitForTimeout(200);
const statuses = await page.locator('.project-grid .project-card').count();
check('filter by status', statuses > 0 && statuses < 11, String(statuses));
await page.getByLabel('Filter by status').selectOption('all');

// Case study route, previous/next, deep link.
await page.locator('.project-grid .project-title').first().click();
await page.waitForURL(/\/projects\/[\w-]+$/);
check('card opens its case study', /\/projects\/[\w-]+$/.test(page.url()), page.url());
await go('/projects/does-not-exist');
check('unknown project → 404', await page.getByText('Looks like this page wandered away.').isVisible());

// Back button restores the scroll position.
await go('/about');
// Scroll the link into view first — a click would do it anyway, after we had
// already recorded the position.
await page.locator('.now-list a').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const before = await page.evaluate(() => window.scrollY);
await page.locator('.now-list a').first().click();
await page.waitForURL(/\/projects\//);
await page.waitForTimeout(500);
await page.goBack();
await page.waitForTimeout(900);
const after = await page.evaluate(() => window.scrollY);
check('back restores scroll', Math.abs(after - before) < 40, `${before} → ${after}`);

// Anchor links.
await go('/');
await page.getByRole('link', { name: /All six/ }).click();
await page.waitForURL(/\/about#method$/);
await page.waitForTimeout(1200);
const methodTop = await page.evaluate(() => document.getElementById('method').getBoundingClientRect().top);
check('hash link lands on its section', Math.abs(methodTop) < 160, `top ${Math.round(methodTop)}`);

// Lamp: button and the T shortcut.
await go('/');
const lamp = () => page.evaluate(() => document.documentElement.dataset.lamp);
const start = await lamp();
await page.keyboard.press('t');
await page.waitForTimeout(150);
check('T toggles the lamp', (await lamp()) !== start, `${start} → ${await lamp()}`);
await page.getByRole('button', { name: /Turn the lamp/ }).click();
await page.waitForTimeout(150);
check('lamp button toggles it back', (await lamp()) === start);

// "More" menu.
await page.getByRole('button', { name: /More/ }).click();
check('More menu opens', await page.getByRole('link', { name: 'Playground' }).first().isVisible());
await page.keyboard.press('Escape');

// Playground: chips and the girl's button both change the shape.
await go('/playground');
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Plane' }).click();
check('shape chip selects', (await page.getByRole('button', { name: 'Plane' }).getAttribute('aria-pressed')) === 'true');
await page.getByRole('button', { name: 'Next shape' }).click();
await page.waitForTimeout(600);
check('Next shape advances', (await page.getByRole('button', { name: 'Telegram' }).getAttribute('aria-pressed')) === 'true');
check('field canvas mounted', (await page.locator('.backdrop canvas').count()) === 1);

// Contact: required fields enforced, then a prefilled mail is composed.
await go('/contact');
await page.getByRole('button', { name: 'Send message' }).click();
await page.waitForTimeout(300);
check('empty form is blocked', !(await page.getByText('Nearly there.').isVisible()));
await page.getByLabel('Your name').fill('Test Person');
await page.getByLabel('Your email').fill('test@example.com');
await page.getByLabel('Message', { exact: true }).fill('Hello, testing the contact form.');
await page.getByRole('button', { name: 'Send message' }).click();
await page.waitForTimeout(700);
const composed = decodeURIComponent((await page.locator('.sent-retry').getAttribute('href')) ?? '');
check('form composes a prefilled email', composed.startsWith('mailto:') && composed.includes('?subject=A project, from Test Person') && composed.includes('testing the contact form'), composed.slice(0, 70));
check('success state shows', await page.getByText('Nearly there.').isVisible());

// 404 easter egg.
await go('/nowhere');
const bubble = page.locator('.lost-bubble');
const first = await bubble.innerText();
await page.getByRole('button', { name: 'Ask her where the page went' }).click();
check('404 easter egg responds', (await bubble.innerText()) !== first);

// Footer easter egg.
await go('/');
await page.getByRole('button', { name: 'Wake the sleeping developer' }).click();
check('sleeping dev wakes', (await page.locator('.footer-snore').innerText()).includes('five more minutes'));

// The camera: each page is a corner of the room, reached by a short glide.
await go('/');
await page.waitForTimeout(3500); // clips are fetched at idle
const still = () => page.evaluate(() => document.querySelector('.corner-still.is-on')?.src.match(/corner-(\w+)/)?.[1] ?? 'room');
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' }).click();
const glided = await page.waitForSelector('.scene-video.is-on', { timeout: 1500 }).then(() => true, () => false);
check('the camera glides to a new corner', glided);
await page.waitForTimeout(1500);
check('Projects rests on the bookshelf', (await still()) === 'shelf', await still());
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
await page.waitForTimeout(2600);
check('About rests on the desk', (await still()) === 'desk', await still());
check('the painting’s own life steps aside in a corner', await page.evaluate(() => document.querySelector('.room').classList.contains('is-away')));
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
await page.waitForTimeout(2600);
check('Home returns to the whole room', (await still()) === 'room' && !(await page.evaluate(() => document.querySelector('.room').classList.contains('is-away'))));

// The room: objects in the painting that do something, where the page leaves them showing.
await page.setViewportSize({ width: 1672, height: 940 });
await go('/');
const centre = async sel => {
  const b = await page.locator(sel).boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
};
let [x, y] = await centre('.hot-cat');
await page.mouse.click(x, y);
await page.waitForTimeout(300);
check('the cat answers', (await page.locator('.cat-bubble').innerText()).length > 0);
const lampBefore = await lamp();
[x, y] = await centre('.hot-lamp');
await page.mouse.click(x, y);
await page.waitForTimeout(300);
check('the desk lamp toggles the theme', (await lamp()) !== lampBefore);
await page.mouse.click(x, y);
[x, y] = await centre('.hot-projects');
await page.mouse.click(x, y);
await page.waitForURL(/\/projects$/);
check('the Projects book opens Projects', page.url().endsWith('/projects'));
await go('/');
await page.getByRole('link', { name: 'Start a project' }).click();
await page.waitForURL(/\/contact$/);
check('page content is never blocked by the room', page.url().endsWith('/contact'));

} catch (error) {
  check('script ran to the end', false, error.message.split(/\r?\n/)[0]);
}

await browser.close();
let ok = true;
for (const [label, pass, detail] of results) {
  console.log(`${pass ? '✔' : '✖'} ${label}${detail ? `  (${detail})` : ''}`);
  ok &&= pass;
}
process.exit(ok ? 0 : 1);
