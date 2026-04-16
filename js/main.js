/*
 * main.js
 * ─────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DOES:
 *  1. On page load → initialises navigation, profile, timers
 *  2. Checkbox tracking → saves every tick to Supabase in real time
 *  3. restoreCheckboxes() → called after login to re-tick saved sets
 *  4. Reset button → clears checkboxes from Supabase + screen
 *  5. Calendar → fetches workout logs and renders a monthly grid
 * ─────────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.setupNavigation();
  window.profile.setupProfile();
  if (window.timer && typeof window.timer.setupTimers === 'function') {
    window.timer.setupTimers();
  }
  setupCheckboxTracking();
  setupResetButton();
  setupCalendar();
});

// ── CHECKBOX TRACKING ──────────────────────────────────────────
// Attaches a change listener to every checkbox.
// On tick/untick → saves to Supabase instantly so progress
// is never lost on refresh or switching devices.

function setupCheckboxTracking() {
  const checkboxes = document.querySelectorAll('.set-checkbox input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async (event) => {
      const profileId = localStorage.getItem('profile_id');
      const id = checkbox.getAttribute('data-id');
      // localStorage as instant local fallback
      window.storage.setCheckboxState(id, event.target.checked);
      // Persist to Supabase if user is logged in
      if (profileId) {
        await window.supabaseHelper.saveCheckboxState(profileId, id, event.target.checked);
      }
    });
  });
}

// Fetches all saved checkbox states from Supabase and re-ticks them.
// Called by profile.js right after a successful login or auto-login.
async function restoreCheckboxes(profileId) {
  const states = await window.supabaseHelper.getCheckboxStates(profileId);
  const checkboxes = document.querySelectorAll('.set-checkbox input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const id = checkbox.getAttribute('data-id');
    if (states[id] === true) {
      checkbox.checked = true;
    }
  });
}

// ── RESET BUTTON ───────────────────────────────────────────────
// Clears all checkbox states from Supabase AND the screen.
// Shows a confirmation first so no accidental resets.

function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', async () => {
    if (!confirm('Do you want to clear your cute diary for a new week? 🎀')) return;
    // Untick everything on screen
    document.querySelectorAll('.set-checkbox input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    // Clear localStorage
    window.storage.clearAllCheckboxStates();
    // Clear Supabase
    const profileId = localStorage.getItem('profile_id');
    if (profileId) {
      await window.supabaseHelper.clearCheckboxStates(profileId);
    }
    alert("Diary reset! Let's crush this week! 💖");
  });
}

// ── CALENDAR ───────────────────────────────────────────────────
// Fetches workout logs from Supabase and renders a monthly grid.
// Each day that has a logged workout shows a coloured emoji dot.

async function setupCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const profileId = localStorage.getItem('profile_id');
  if (!profileId) {
    calendarEl.innerHTML = '<p class="calendar-empty">Save your profile to see your workout calendar! 🌸</p>';
    return;
  }

  const logs = await window.supabaseHelper.getWorkoutLogs(profileId);
  renderCalendar(calendarEl, logs);
}

function renderCalendar(container, logs) {
  const emojiMap = { glutes: '🍑', back: '🎀', core: '💪', cardio: '💦' };

  // Build a map of date string (YYYY-MM-DD) → array of workout types
  const dateMap = {};
  logs.forEach(log => {
    const key = new Date(log.created_at).toLocaleDateString('en-CA');
    if (!dateMap[key]) dateMap[key] = [];
    const type = (log.workout_type || '').toLowerCase();
    if (!dateMap[key].includes(type)) dateMap[key].push(type);
  });

  // Build the month grid
  const now      = new Date();
  const year     = now.getFullYear();
  const month    = now.getMonth();
  const monthName   = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = now.toLocaleDateString('en-CA');

  let html = `
    <div class="calendar-header">${monthName}</div>
    <div class="calendar-legend">
      ${Object.entries(emojiMap).map(([k, v]) => `<span>${v} ${k}</span>`).join('')}
    </div>
    <div class="calendar-grid">
      ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="cal-day-label">${d}</div>`).join('')}
      ${'<div class="cal-day empty"></div>'.repeat(firstDay)}
  `;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const workouts = dateMap[dateStr] || [];
    const isToday  = dateStr === todayStr;
    const dots     = workouts.map(w => `<span class="cal-dot">${emojiMap[w] || '✅'}</span>`).join('');
    html += `
      <div class="cal-day ${isToday ? 'today' : ''} ${workouts.length ? 'has-workout' : ''}">
        <span class="cal-date">${d}</span>
        <div class="cal-dots">${dots}</div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ── EXPOSE ─────────────────────────────────────────────────────
// profile.js calls restoreCheckboxes and setupCalendar after login
window.appMain = { restoreCheckboxes, setupCalendar };
