// Runs against an isolated temporary database; never connects to the live site.
// PHP_BIN and optional PHP_EXTENSION_DIR select your PHP runtime.
// PLAYWRIGHT_MODULE may point to an installed Playwright module.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dataDir = await mkdtemp(join(tmpdir(), 'mulembe-cms-test-'));
const php = process.env.PHP_BIN || 'php';
const phpArgs = process.env.PHP_EXTENSION_DIR ? ['-d', `extension_dir=${process.env.PHP_EXTENSION_DIR}`, '-d', 'extension=pdo_sqlite'] : [];
const env = { ...process.env, MULEMBE_CMS_DATA_DIR: dataDir };
const password = `Test-${randomBytes(18).toString('hex')}`;
const phpPort = 8080;
const webPort = 5176;
let server, vite, browser;
async function waitFor(url, child) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('Test server exited before becoming ready.');
    try { if ((await fetch(url)).ok) return; } catch { /* Wait for the test process. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out starting ${url}`);
}
try {
  // Refuse to reuse an existing server: all writes must reach this isolated test process.
  for (const port of [phpPort, webPort]) {
    let occupied = false;
    try { await fetch(`http://127.0.0.1:${port}`); occupied = true; } catch { /* Available. */ }
    assert.equal(occupied, false, `Port ${port} is occupied. Stop that local server before running this test.`);
  }
  const setup = spawnSync(php, [...phpArgs, 'scripts/setup-cms.php', 'admin@example.test', 'Test Administrator'], { env, input: password + '\n', encoding: 'utf8' });
  assert.equal(setup.status, 0, setup.stderr);
  assert.match(setup.stdout, /Administrator created/);
  server = spawn(php, [...phpArgs, '-d', 'upload_max_filesize=6M', '-d', 'post_max_size=32M', '-S', `127.0.0.1:${phpPort}`, '-t', 'public'], { env, stdio: 'ignore' });
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { stdio: 'ignore' });
  await waitFor(`http://127.0.0.1:${phpPort}/cms.php?action=public`, server);
  await waitFor(`http://127.0.0.1:${webPort}`, vite);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const origin = `http://127.0.0.1:${webPort}`;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/#/admin/events');
  await page.getByRole('button', { name: 'Staff Login', exact: true }).waitFor();
  assert.equal((await context.request.get(origin + '/cms.php?action=content')).status(), 401);
  await page.getByLabel('Email address').fill('admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Staff Login', exact: true }).click();
  await page.getByRole('button', { name: 'Create event', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Event / activity title').fill('Test Community Picnic');
  await dialog.getByLabel('Description', { exact: true }).fill('Bring a picnic and meet the community.');
  await dialog.getByLabel('Event date').fill('2027-01-15');
  await dialog.getByLabel('Time (Sydney local time)').fill('10:00 AM');
  await dialog.getByLabel('Venue / location').fill('Sydney Park');
  await dialog.getByLabel('Event category').fill('Community');
  await dialog.getByLabel('Publication status').selectOption('published');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  await dialog.waitFor({ state: 'hidden' });
  let session = await (await context.request.get(origin + '/cms.php?action=session')).json();
  let listing = await (await context.request.get(origin + '/cms.php?action=content')).json();
  const event = listing.items.find(item => item.type === 'event');
  assert.equal(event.status, 'published');
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(origin);
  await publicPage.getByRole('heading', { name: 'Test Community Picnic' }).waitFor();
  assert.equal((await publicContext.request.get(origin + '/cms.php?action=users')).status(), 401);
  assert.equal((await context.request.post(origin + '/cms.php?action=users', { data: {} })).status(), 403);
  // Stale update protection.
  const conflict = await context.request.post(origin + '/cms.php?action=save', { headers: { 'X-CSRF-Token': session.csrf }, multipart: { item: JSON.stringify({ ...event.data, id: event.id, version: 0, type: 'event', status: 'draft' }) } });
  assert.equal(conflict.status(), 409);
  await page.getByRole('button', { name: 'Edit / change status' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Publication status').selectOption('draft');
  await dialog.getByRole('button', { name: 'Save draft' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal((await (await publicContext.request.get(origin + '/cms.php?action=public')).json()).items.length, 0);
  console.log('PASS real login, event publishing, public rendering, withdrawal, CSRF and stale edits');

  await page.goto(origin + '/#/admin/gallery');
  await page.getByRole('button', { name: 'Add images', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Image caption / album title').fill('Test Community Album');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await dialog.locator('input[type=file]').setInputFiles([{ name: 'first.png', mimeType: 'image/png', buffer: png }, { name: 'second.png', mimeType: 'image/png', buffer: png }]);
  await dialog.getByLabel('Publication status').selectOption('published');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  await dialog.waitFor({ state: 'hidden' });
  listing = await (await context.request.get(origin + '/cms.php?action=content')).json();
  const images = listing.items.filter(item => item.type === 'gallery');
  assert.equal(images.length, 2);
  const imageResponse = await publicContext.request.get(origin + '/cms.php?action=image&id=' + images[0].data.image);
  assert.equal(imageResponse.status(), 200);
  assert.equal(imageResponse.headers()['content-type'], 'image/png');
  const invalidUpload = await context.request.post(origin + '/cms.php?action=save', { headers: { 'X-CSRF-Token': session.csrf }, multipart: { item: JSON.stringify({ type: 'gallery', title: 'Invalid', description: '', status: 'published' }), 'images[]': { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') } } });
  assert.equal(invalidUpload.status(), 422);
  console.log('PASS bulk image upload, image delivery and invalid-image rejection');

  await page.goto(origin + '/#/admin/testimonials');
  await page.getByRole('button', { name: 'Add testimonial', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Person’s full name').fill('Test Community Member');
  await dialog.getByLabel('Testimonial', { exact: true }).fill('A welcoming community.');
  await dialog.getByRole('checkbox').check();
  await dialog.getByLabel('Publication status').selectOption('published');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.goto(origin + '/#/admin/business-categories');
  await page.getByRole('button', { name: 'Add category', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Category name').fill('Test Community Services');
  await dialog.getByLabel('Description', { exact: true }).fill('Services from community members.');
  await dialog.getByLabel('Publication status').selectOption('published');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await publicPage.reload();
  await publicPage.getByRole('heading', { name: 'Test Community Member', exact: true }).waitFor();
  await publicPage.getByRole('heading', { name: 'Test Community Services', exact: true }).waitFor();
  await publicPage.getByRole('button', { name: 'View Test Community Album — 1' }).waitFor();
  console.log('PASS testimonial and category dialogs publish to a separate visitor session');

  await page.goto(origin + '/#/admin/users');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Full name', { exact: true }).fill('Test Editor');
  await dialog.getByLabel('Email address').fill('editor@example.test');
  await dialog.getByLabel('Role', { exact: true }).selectOption('editor');
  await dialog.getByLabel('Initial staff password').fill(password);
  await dialog.getByRole('button', { name: 'Save member', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  const editorContext = await browser.newContext();
  const editorSession = await (await editorContext.request.get(origin + '/cms.php?action=session')).json();
  const editorLogin = await editorContext.request.post(origin + '/cms.php?action=login', { headers: { 'X-CSRF-Token': editorSession.csrf }, data: { email: 'editor@example.test', password } });
  assert.equal(editorLogin.status(), 200);
  assert.equal((await editorContext.request.get(origin + '/cms.php?action=users')).status(), 403);
  assert.equal((await editorContext.request.get(origin + '/cms.php?action=content')).status(), 200);
  const users = await (await context.request.get(origin + '/cms.php?action=users')).json();
  assert.ok(users.users.every(user => !Object.hasOwn(user, 'password')));
  const editor = users.users.find(user => user.email === 'editor@example.test');
  const revoke = await context.request.post(origin + '/cms.php?action=users', { headers: { 'X-CSRF-Token': session.csrf }, data: { ...editor, active: false, password: '' } });
  assert.equal(revoke.status(), 200);
  assert.equal((await editorContext.request.get(origin + '/cms.php?action=content')).status(), 401);
  console.log('PASS user onboarding, editor permission enforcement and session revocation');

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + '/#/admin/gallery');
    await page.getByRole('button', { name: 'Add images', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  }
  assert.deepEqual(errors, []);
  await context.request.post(origin + '/cms.php?action=logout', { headers: { 'X-CSRF-Token': session.csrf }, data: {} });
  assert.equal((await context.request.get(origin + '/cms.php?action=content')).status(), 401);
  console.log('PASS mobile/tablet dialogs, no browser exceptions and logout');
} finally {
  await browser?.close();
  for (const child of [vite, server]) if (child && child.exitCode === null) {
    await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  }
  if (resolve(dataDir).startsWith(resolve(tmpdir()) + '/') || resolve(dataDir).startsWith(resolve(tmpdir()) + '\\')) await rm(dataDir, { recursive: true, force: true });
}
