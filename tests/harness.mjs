/*
 * tests/harness.mjs — boots the real app in headless Chromium for testing.
 * ─────────────────────────────────────────────────────────────────
 * Serves the repo over HTTP and installs an in-memory stand-in for
 * window.supabaseHelper before any app script runs, so the suite needs no
 * Supabase credentials and makes no network calls.
 * ─────────────────────────────────────────────────────────────────
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

export async function startServer() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url || '/').split('?')[0]);
    const target = resolve(ROOT, '.' + (path === '/' ? '/index.html' : path));
    if (target !== ROOT && !target.startsWith(ROOT + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, port: server.address().port };
}

/*
 * The app is served unbundled, so src/main.js (an ES module importing
 * @sentry/browser and @supabase/supabase-js by bare specifier) cannot execute.
 * That module is the only thing that defines window.supabaseHelper, so the stub
 * below fills that role — the same contract, backed by plain objects.
 */
function installBackendStub(seed) {
  const state = {
    profile: seed.profile,
    workoutLogs: seed.workoutLogs || [],
    checkboxStates: seed.checkboxStates || {},
    customWorkouts: [],
    deleted: { workout_logs: false, checkbox_states: false, user_workouts: false, profiles: false },
    signedOut: false
  };
  window.__testState = state;

  // Deletion and sign-out are reported to the Node side as well as recorded
  // locally: the delete flow ends in a redirect to /signin.html, which tears
  // down this page's JS state before a test could read it.
  const report = (type, name) => {
    if (typeof window.__testRecord === 'function') window.__testRecord(type, name);
  };

  const table = name => ({
    delete: () => ({
      eq: async () => { state.deleted[name] = true; report('delete', name); return { error: null }; }
    }),
    select: () => ({
      eq: () => ({ single: async () => ({ data: state.profile, error: null }) })
    })
  });

  window.supabaseHelper = {
    client: { from: table },
    getSession: async () => (state.profile ? { user: { id: 'test-user' } } : null),
    getUser: async () => (state.profile ? { id: 'test-user' } : null),
    signOut: async () => { state.signedOut = true; report('signOut'); },
    onAuthStateChange: () => ({}),
    saveProfile: async p => {
      state.profile = { id: 'p1', username: p.name, start_date: p.startDate, theme: 'her' };
      return state.profile;
    },
    loadProfile: async () => state.profile,
    loadProfileByAuthId: async () => state.profile,
    saveWorkoutLog: async log => { state.workoutLogs.push(log); },
    getWorkoutLogs: async () => state.workoutLogs.slice(),
    saveCheckboxState: async (_p, id, checked) => { state.checkboxStates[id] = checked; },
    getCheckboxStates: async () => ({ ...state.checkboxStates }),
    clearCheckboxStates: async () => { state.checkboxStates = {}; },
    addCustomWorkout: async a => { state.customWorkouts.push(a); return a; },
    getCustomWorkouts: async () => state.customWorkouts.slice(),
    removeCustomWorkout: async () => {}
  };
}

/**
 * @param {object}  opts
 * @param {string}  opts.timezoneId  IANA zone, e.g. 'America/New_York'
 * @param {object}  opts.seed        backend seed data (profile, workoutLogs, ...)
 * @param {object}  opts.storage     localStorage entries to preinstall
 */
export async function launchApp(port, opts = {}) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined
  });
  const context = await browser.newContext({
    timezoneId: opts.timezoneId || 'UTC'
  });
  const page = await context.newPage();

  // Errors are tagged with the page that raised them. The delete flow ends on
  // signin.html, which pulls supabase-js from a CDN the test run does not
  // fetch, so assertions scope themselves to the app page.
  const pageErrors = [];
  page.on('pageerror', e => {
    // src/main.js cannot resolve its bare imports when served unbundled; the
    // stub above stands in for it, so that one error is expected noise.
    if (/Failed to resolve module specifier/.test(String(e))) return;
    pageErrors.push({ url: page.url(), message: String(e) });
  });
  pageErrors.onAppPage = () => pageErrors.filter(e => e.url.includes('index.html'));

  // Survives navigation, unlike anything held on `window`.
  const events = [];
  await context.exposeFunction('__testRecord', (type, name) => { events.push({ type, name }); });

  const seed = opts.seed || { profile: null };
  const storage = opts.storage || {};
  await page.addInitScript(
    ({ seed, storage, fnSource }) => {
      Object.entries(storage).forEach(([k, v]) => localStorage.setItem(k, v));
      new Function('seed', '(' + fnSource + ')(seed)')(seed);
    },
    { seed, storage, fnSource: installBackendStub.toString() }
  );

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700); // let DOMContentLoaded handlers settle

  return {
    browser, context, page, pageErrors, events,
    deletedTables: () => events.filter(e => e.type === 'delete').map(e => e.name),
    didSignOut: () => events.some(e => e.type === 'signOut')
  };
}

export function makeReporter() {
  let pass = 0;
  const failures = [];
  return {
    ok(name, cond, detail = '') {
      if (cond) { pass++; console.log('  ✓', name); }
      else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  ✗', name, detail); }
    },
    summary() {
      console.log(`\n${pass} passed, ${failures.length} failed`);
      failures.forEach(f => console.log('  FAILED:', f));
      return failures.length === 0;
    }
  };
}
