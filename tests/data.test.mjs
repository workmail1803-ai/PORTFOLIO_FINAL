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
