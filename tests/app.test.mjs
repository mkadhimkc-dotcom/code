/*
 * tests/app.test.mjs — end-to-end checks for the Clulee app.
 * Run with: npm test
 */
import { startServer, launchApp, makeReporter } from './harness.mjs';

const { server, port } = await startServer();
const r = makeReporter();

const PROFILE = { id: 'p1', username: 'Tester', start_date: '2026-07-01', theme: 'her' };
const STORAGE = { profile_id: 'p1', profile_name: 'Tester', profile_startDate: '2026-07-01' };

// ── 1. Calendar/streak use the viewer's timezone, not UTC ─────────────
// An evening workout in a negative-offset zone has a UTC timestamp on the
// following calendar day. Keying off toISOString() filed it under tomorrow and
// left the streak at zero.
{
  console.log('\nTimezone-correct calendar keys (America/New_York):');
  // 2026-08-01 20:30 EDT === 2026-08-02T00:30Z — UTC says Aug 2, the user says Aug 1.
  const seed = {
    profile: PROFILE,
    workoutLogs: [{ profile_id: 'p1', workout_type: 'glutes', created_at: '2026-08-02T00:30:00.000Z' }]
  };
  const { browser, page, pageErrors } = await launchApp(port, {
    timezoneId: 'America/New_York', seed, storage: STORAGE
  });

  const localDay = await page.evaluate(() =>
    new Date('2026-08-02T00:30:00.000Z').getDate());
  r.ok('fixture really is the previous day locally', localDay === 1, 'got day ' + localDay);

  const marked = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.calendar-day.has-workouts'))
      .map(c => c.dataset.date));
  r.ok('workout lands on the local date', marked.includes('2026-08-01'),
    'marked: ' + JSON.stringify(marked));
  r.ok('workout does NOT land on the UTC date', !marked.includes('2026-08-02'),
    'marked: ' + JSON.stringify(marked));

  r.ok('no unexpected page errors', pageErrors.onAppPage().length === 0,
    JSON.stringify(pageErrors.onAppPage()));
  await browser.close();
}

// ── 2. Positive-offset zones key calendar cells correctly too ─────────
// Local midnight in UTC+10 is the *previous* day in UTC, which shifted the
// calendar grid's own cell keys backwards by one.
{
  console.log('\nTimezone-correct calendar keys (Australia/Sydney):');
  const seed = {
    profile: PROFILE,
    workoutLogs: [{ profile_id: 'p1', workout_type: 'core', created_at: '2026-08-01T02:00:00.000Z' }]
  };
  const { browser, page } = await launchApp(port, {
    timezoneId: 'Australia/Sydney', seed, storage: STORAGE
  });
  const expected = await page.evaluate(() => {
    const d = new Date('2026-08-01T02:00:00.000Z');
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const marked = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.calendar-day.has-workouts')).map(c => c.dataset.date));
  r.ok('workout lands on the local date', marked.includes(expected),
    'expected ' + expected + ', marked ' + JSON.stringify(marked));
  await browser.close();
}

// ── 3. showConfirm supports both callback and awaited-boolean callers ──
{
  console.log('\nshowConfirm dual API:');
  const { browser, page } = await launchApp(port, { seed: { profile: PROFILE }, storage: STORAGE });

  const confirmed = await page.evaluate(async () => {
    const p = window.appMain.showConfirm('proceed?');
    document.querySelectorAll('.confirm-modal button')[1].click(); // "Yes, do it!"
    return await p;
  });
  r.ok('awaited call resolves true on confirm', confirmed === true, 'got ' + confirmed);

  const cancelled = await page.evaluate(async () => {
    const p = window.appMain.showConfirm('proceed?');
    document.querySelectorAll('.confirm-modal button')[0].click(); // "Cancel"
    return await p;
  });
  r.ok('awaited call resolves false on cancel', cancelled === false, 'got ' + cancelled);

  const viaCallback = await page.evaluate(async () => {
    let called = false;
    window.appMain.showConfirm('proceed?', () => { called = true; });
    document.querySelectorAll('.confirm-modal button')[1].click();
    return called;
  });
  r.ok('callback form still fires', viaCallback === true);

  const dismissed = await page.evaluate(() => !document.querySelector('.confirm-modal'));
  r.ok('modal is removed after choosing', dismissed);
  await browser.close();
}

// ── 4. Delete Account actually deletes ────────────────────────────────
// Previously blocked twice over: showConfirm returned undefined so the handler
// bailed, and it destructured a `supabase` key the helper never exported.
{
  console.log('\nDelete Account:');
  const { browser, page, pageErrors, deletedTables, didSignOut } = await launchApp(port, {
    seed: { profile: PROFILE }, storage: STORAGE
  });

  const hasBtn = await page.evaluate(() => !!document.getElementById('deleteAccountBtn'));
  r.ok('delete button exists', hasBtn);

  if (hasBtn) {
    await page.evaluate(() => document.getElementById('deleteAccountBtn').click());
    await page.waitForTimeout(150);
    const modalShown = await page.evaluate(() => !!document.querySelector('.confirm-modal'));
    r.ok('confirmation modal appears', modalShown);

    await page.evaluate(() => document.querySelectorAll('.confirm-modal button')[1].click());
    await page.waitForTimeout(800); // handler ends in a redirect to /signin.html

    const deleted = deletedTables();
    r.ok('workout_logs deleted', deleted.includes('workout_logs'), JSON.stringify(deleted));
    r.ok('checkbox_states deleted', deleted.includes('checkbox_states'), JSON.stringify(deleted));
    r.ok('user_workouts deleted', deleted.includes('user_workouts'), JSON.stringify(deleted));
    r.ok('profiles deleted', deleted.includes('profiles'), JSON.stringify(deleted));
    r.ok('user signed out', didSignOut());
    r.ok('no page errors during delete', pageErrors.onAppPage().length === 0,
      JSON.stringify(pageErrors.onAppPage()));
  }
  await browser.close();
}

// ── 5. Cancelling Delete Account deletes nothing ──────────────────────
{
  console.log('\nDelete Account (cancelled):');
  const { browser, page, deletedTables, didSignOut } = await launchApp(port, {
    seed: { profile: PROFILE }, storage: STORAGE
  });
  await page.evaluate(() => document.getElementById('deleteAccountBtn').click());
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelectorAll('.confirm-modal button')[0].click());
  await page.waitForTimeout(400);
  r.ok('nothing deleted on cancel', deletedTables().length === 0, JSON.stringify(deletedTables()));
  r.ok('still signed in', didSignOut() === false);
  await browser.close();
}

// ── 6. Dashboard stats populate on load, not just after logging ───────
{
  console.log('\nDashboard stats on load:');
  const seed = {
    profile: PROFILE,
    workoutLogs: [
      { profile_id: 'p1', workout_type: 'glutes', created_at: new Date().toISOString() },
      { profile_id: 'p1', workout_type: 'back', created_at: new Date().toISOString() }
    ]
  };
  const { browser, page } = await launchApp(port, { seed, storage: STORAGE });
  const total = await page.evaluate(() =>
    document.getElementById('statTotal')?.textContent.trim());
  r.ok('total workouts rendered without logging first', total === '2', 'got ' + JSON.stringify(total));
  await browser.close();
}

// ── 7. Calendar modal does not stack backdrop listeners ───────────────
{
  console.log('\nCalendar modal listener hygiene:');
  const seed = {
    profile: PROFILE,
    workoutLogs: [{ profile_id: 'p1', workout_type: 'core', created_at: new Date().toISOString() }]
  };
  const { browser, page } = await launchApp(port, { seed, storage: STORAGE });
  const closesCleanly = await page.evaluate(() => {
    const cell = document.querySelector('.calendar-day[data-date]');
    if (!cell) return 'no-cell';
    for (let i = 0; i < 3; i++) { cell.click(); window.appMain.closeCalendarModal(); }
    cell.click();
    const modal = document.getElementById('calendar-modal');
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return !modal.classList.contains('visible');
  });
  r.ok('modal still closes after repeated opens', closesCleanly === true, String(closesCleanly));
  await browser.close();
}

// ── 8. Onboarding quiz advances past the limitations step ─────────────
// Regression guard for the previously dead #limitationsNext handler.
{
  console.log('\nQuiz limitations step (regression guard):');
  const { browser, page } = await launchApp(port, { seed: { profile: PROFILE }, storage: STORAGE });
  await page.evaluate(() => window.cluleeQuiz.open());
  await page.waitForTimeout(300);
  const step = () => page.evaluate(() =>
    document.querySelector('.quiz-step.active')?.dataset.step ?? '(none)');

  for (const sel of [
    '[data-step="1"] [data-q="gender"][data-v="him"]',
    '[data-step="2b"] [data-q="goal"]',
    '[data-step="3"] [data-q="experience"]',
    '[data-step="4"] [data-q="days"]',
    '[data-step="5"] [data-q="equipment"]'
  ]) { await page.click(sel); await page.waitForTimeout(400); }

  r.ok('reaches limitations step', await step() === '6', 'got ' + await step());
  await page.click('[data-step="6"] .quiz-option-multi');
  await page.click('#limitationsNext');
  await page.waitForTimeout(300);
  r.ok('Continue advances past limitations', await step() === '8', 'got ' + await step());
  await browser.close();
}

server.close();
process.exit(r.summary() ? 0 : 1);
