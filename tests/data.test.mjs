import test from 'node:test';
import assert from 'node:assert/strict';

const { projects, principles, totals, stack } = await import('../src/data/projects.ts');
const { profile, places, routes } = await import('../src/data/profile.ts');

test('every project is uniquely identified and points at real source', () => {
  assert.equal(new Set(projects.map(p => p.id)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.name, `${project.id} needs a name`);
    assert.ok(project.tagline && project.summary, `${project.id} needs copy`);
    assert.ok(project.highlights.length >= 3, `${project.id} needs highlights`);
    assert.ok(project.stack.length, `${project.id} needs a stack`);
    assert.equal(new URL(project.repo).hostname, 'github.com');
    if (project.live) assert.match(project.live, /^https:\/\/|^https:\/\/t\.me\//);
  }
});

test('every project states what it is not claiming', () => {
  for (const project of projects) {
    assert.ok(project.honest.length > 40, `${project.id} needs an honest note`);
  }
});

test('research results keep their limitations attached', () => {
  assert.match(projects.find(p => p.id === 'soundai').honest, /synthetic/i);
  assert.match(projects.find(p => p.id === 'ipiguard').honest, /not a complete defence/i);
});

test('live projects carry a reachable label', () => {
  for (const project of projects.filter(p => p.status === 'live')) {
    assert.ok(project.live, `${project.id} is marked live and needs a URL`);
    assert.ok(project.liveLabel, `${project.id} needs a display label`);
  }
});

test('the wall only shows projects with a real captured screenshot', () => {
  for (const project of projects.filter(p => p.image)) {
    assert.match(project.image, /^\/images\/work\/.+\.webp$/);
    assert.ok(project.imageSm, `${project.id} needs a small variant`);
  }
});

test('totals are derived, never hand-written', () => {
  assert.equal(totals.projects, projects.length);
  assert.equal(totals.live, projects.filter(p => p.status === 'live').length);
  assert.equal(totals.shipped, projects.filter(p => p.status === 'shipped').length);
  assert.equal(
    totals.commits,
    projects.reduce((sum, p) => sum + p.commits, 0),
  );
  assert.equal(
    totals.files,
    projects.reduce((sum, p) => sum + p.files, 0),
  );
});

test('"shipped" means built and running with nothing public to open', () => {
  for (const project of projects.filter(p => p.status === 'shipped')) {
    assert.equal(project.live, undefined, `${project.id} has a URL, so it is live, not shipped`);
  }
});

test('each principle links to public proof', () => {
  assert.equal(principles.length, 6);
  for (const rule of principles) {
    assert.equal(new URL(rule.href).protocol, 'https:');
    assert.ok(rule.proof && rule.body);
  }
});

test('the stack has no empty groups', () => {
  for (const group of stack) assert.ok(group.items.length >= 4, `${group.group} is thin`);
});

test('contact details and globe coordinates are well formed', () => {
  assert.match(profile.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.equal(new URL(profile.github).hostname, 'github.com');
  for (const [name, [lon, lat]] of Object.entries(places)) {
    assert.ok(lon >= -180 && lon <= 180, `${name} longitude out of range`);
    assert.ok(lat >= -90 && lat <= 90, `${name} latitude out of range`);
  }
  for (const [from, to] of routes) {
    assert.ok(places[from] && places[to], `route ${from}→${to} has an unknown endpoint`);
  }
});

/* ── Redesign invariants ─────────────────────────────────────────────────── */

const { existsSync } = await import('node:fs');
const { achievements, certifications, posts, testimonials, education } = await import('../src/data/content.ts');
const { ROUTES } = await import('../src/routes.ts');
const { characterAssets, CHARACTER_WIDTHS } = await import('../src/characters/manifest.ts');

test('every project carries verified git dates in order', () => {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  for (const project of projects) {
    assert.match(project.started, iso, `${project.id} started`);
    assert.match(project.updated, iso, `${project.id} updated`);
    assert.ok(project.started <= project.updated, `${project.id} starts after it ends`);
  }
});

test('a page without real data is never routed or linked', () => {
  const enabled = name => ROUTES.find(r => r.name === name).enabled;
  assert.equal(enabled('achievements'), achievements.length + certifications.length > 0);
  assert.equal(enabled('blog'), posts.length > 0);
  // Today none of these exist, so none may appear.
  assert.equal(achievements.length + certifications.length + posts.length + testimonials.length, 0);
});

test('education only links to projects that exist', () => {
  for (const entry of education) {
    for (const work of entry.work ?? []) {
      assert.ok(projects.some(p => p.id === work.projectId), `${work.course} → ${work.projectId}`);
    }
  }
});

test('every character layer referenced by the manifest is on disk', () => {
  const layers = Object.keys(characterAssets).flatMap(name =>
    name === 'boy-tap' ? ['boy-tap-body', 'boy-tap-hand'] : [name],
  );
  for (const layer of layers) {
    for (const width of CHARACTER_WIDTHS) {
      assert.ok(existsSync(`public/characters/${layer}-${width}.webp`), `${layer}-${width}.webp missing`);
    }
  }
});

test('interaction anchors sit where the components expect them', () => {
  const [tx, ty] = characterAssets['boy-tap'].anchors.fingertip;
  assert.ok(tx < 0.2 && ty > 0.7, 'fingertip should be bottom-left of the tapping boy');
  const [px, py] = characterAssets['boy-tap'].anchors.pivot;
  assert.ok(px > tx && py < ty, 'hand pivot should sit up and right of the fingertip');
  const [lx, ly] = characterAssets['girl-press'].anchors.buttonTopLeft;
  const [rx, ry] = characterAssets['girl-press'].anchors.buttonBottomRight;
  // The pill was her lowest element, so it may overhang the cropped art slightly.
  assert.ok(rx > lx && ry > ly && ry <= 1.1, 'girl-press button box must be well-formed');
});

test('the copy uses no em or en dashes', async () => {
  // The owner asked for none anywhere on the site; rewrite with a comma,
  // colon, full stop or parentheses instead.
  const content = await import('../src/data/content.ts');
  const toolbox = await import('../src/data/toolbox.ts');
  const { HOTSPOTS, CAT_LINES } = await import('../src/room/scene.ts');
  const found = [];
  const walk = (value, path) => {
    if (typeof value === 'string') {
      if (/[–—]/.test(value)) found.push(`${path}: ${value.slice(0, 60)}`);
    } else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`);
    }
  };
  walk({ projects, principles, profile, content: { ...content }, toolbox: { ...toolbox }, HOTSPOTS, CAT_LINES }, 'data');
  assert.deepEqual(found, []);
});

test('every room layer and camera move referenced by the site is on disk', async () => {
  const { existsSync } = await import('node:fs');
  const { CORNERS } = await import('../src/room/corners.ts');
  const { ROOM_WIDTHS } = await import('../src/room/manifest.ts');
  const files = [
    ...ROOM_WIDTHS.map(w => `public/room/room-${w}.webp`),
    'public/room/neon-on.webp',
    'public/room/neon-off.webp',
    'public/room/cat.webp',
  ];
  for (const { id } of CORNERS) {
    for (const ext of ['webm', 'mp4']) files.push(`public/room/move-${id}.${ext}`, `public/room/move-${id}-back.${ext}`);
    files.push(`public/room/corner-${id}-1280.webp`, `public/room/corner-${id}-1920.webp`);
  }
  for (const file of files) assert.ok(existsSync(file), `${file} is missing`);
});
