/*
 * main.js — Sprint 2
 * ─────────────────────────────────────────────────────────────────
 *  BUG-04: setupCalendar removed from DOMContentLoaded
 *          it is now called from profile.js after login completes
 *  BUG-05: "Done!" checkboxes now write to workout_logs
 *  BUG-08: Calendar shows loading state while fetching
 *  FEAT-02: Toast notifications for save/reset
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
  setupHeroScroll();
  // ⚠️ setupCalendar is NOT called here anymore
  // It is called from profile.js after login/auto-login completes
});

// ── DONE CHECKBOX MAP ──────────────────────────────────────────
// Maps each section's "Done!" checkbox data-id → workout_type
// so we can log the right type to Supabase when ticked
const DONE_CHECKBOX_MAP = {
  'A-Cardio':   'glutes',
  'B-Cardio':   'back',
  'C-Cardio':   'core',
  'D-Activity': 'cardio',
};

// ── CHECKBOX TRACKING ──────────────────────────────────────────
// Saves every tick to localStorage + Supabase in real time.
// If it's a "Done!" checkbox, also logs the workout to the
// workout_logs table so the calendar gets populated.

function setupCheckboxTracking() {
  const checkboxes = document.querySelectorAll('.set-checkbox input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async (event) => {
      const profileId = localStorage.getItem('profile_id');
      const id = checkbox.getAttribute('data-id');

      // Always save to localStorage as instant fallback
      window.storage.setCheckboxState(id, event.target.checked);

      if (profileId) {
        // Save checkbox state to Supabase
        await window.supabaseHelper.saveCheckboxState(profileId, id, event.target.checked);

        // BUG-05: If this is a "Done!" checkbox being ticked,
        // write a workout log so the calendar populates
        if (event.target.checked && DONE_CHECKBOX_MAP[id]) {
          await window.supabaseHelper.saveWorkoutLog({
            profile_id: profileId,
            workout_type: DONE_CHECKBOX_MAP[id],
          });
          showToast(`Workout logged! ${getWorkoutEmoji(DONE_CHECKBOX_MAP[id])}`);
          // Refresh the calendar to show the new dot
          await setupCalendar();
        }
      }
    });
  });
}

function getWorkoutEmoji(type) {
  const map = { glutes: '🍑', back: '🎀', core: '💪', cardio: '💦' };
  return map[type] || '✅';
}

// ── RESTORE CHECKBOXES ─────────────────────────────────────────
// Called by profile.js after login to re-tick saved sets.

async function restoreCheckboxes(profileId) {
  const states = await window.supabaseHelper.getCheckboxStates(profileId);
  document.querySelectorAll('.set-checkbox input[type="checkbox"]').forEach(cb => {
    const id = cb.getAttribute('data-id');
    if (states[id] === true) cb.checked = true;
  });
}

// ── RESET BUTTON ───────────────────────────────────────────────
// Clears all checkboxes from Supabase + screen with confirmation.

function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', async () => {
    if (!confirm('Clear your cute diary for a new week? This cannot be undone! 🎀')) return;

    document.querySelectorAll('.set-checkbox input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    window.storage.clearAllCheckboxStates();

    const profileId = localStorage.getItem('profile_id');
    if (profileId) {
      await window.supabaseHelper.clearCheckboxStates(profileId);
    }

    showToast("Diary reset! Let's crush this week! 💖");
  });
}

// ── CALENDAR ───────────────────────────────────────────────────
// Called from profile.js after login — never directly on load.
// BUG-04 fix: this ensures profile_id is always ready.

async function setupCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const profileId = localStorage.getItem('profile_id');
  if (!profileId) {
    calendarEl.innerHTML = '<p class="calendar-empty">Save your profile to see your workout calendar! 🌸</p>';
    return;
  }

  // BUG-08: Show loading state while fetching
  calendarEl.innerHTML = '<p class="calendar-empty">Loading your calendar… 🌸</p>';

  const logs = await window.supabaseHelper.getWorkoutLogs(profileId);
  renderCalendar(calendarEl, logs);
}

function renderCalendar(container, logs) {
  const emojiMap = { glutes: '🍑', back: '🎀', core: '💪', cardio: '💦' };

  // Build date → workouts map
  const dateMap = {};
  logs.forEach(log => {
    const key = new Date(log.created_at).toLocaleDateString('en-CA');
    if (!dateMap[key]) dateMap[key] = [];
    const type = (log.workout_type || '').toLowerCase();
    if (!dateMap[key].includes(type)) dateMap[key].push(type);
  });

  const now         = new Date();
  const year        = now.getFullYear();
  const month       = now.getMonth();
  const monthName   = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = now.toLocaleDateString('en-CA');
  const streak      = calculateStreak(dateMap, now);

  let html = `
    <div class="calendar-header">${monthName}</div>
    ${streak > 0 ? `<div class="calendar-streak">🔥 ${streak}-day streak!</div>` : ''}
    <div class="calendar-legend">
      ${Object.entries(emojiMap).map(([k, v]) => `<span>${v} ${k}</span>`).join('')}
    </div>
    <div class="calendar-grid">
      ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="cal-day-label">${d}</div>`).join('')}
      ${'<div class="cal-day empty"></div>'.repeat(firstDay)}
  `;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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

// ── STREAK CALCULATOR ──────────────────────────────────────────
// Walks backwards from today counting consecutive workout days.

function calculateStreak(dateMap, today) {
  let streak = 0;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);

  while (true) {
    const key = d.toLocaleDateString('en-CA');
    if (dateMap[key] && dateMap[key].length > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // If today has no workout yet, don't break the streak — skip today
      if (streak === 0 && key === today.toLocaleDateString('en-CA')) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

// ── HERO SCROLL (BUG-01) ───────────────────────────────────────
// "Start Now" button smoothly scrolls to the quick start guide.

function setupHeroScroll() {
  const cta = document.querySelector('.hero-cta');
  if (!cta) return;
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector('.callout') || document.getElementById('home');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ── TOAST NOTIFICATIONS (FEAT-02) ─────────────────────────────
// Shows a brief pink notification at the bottom of the screen.

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ── EXPOSE ─────────────────────────────────────────────────────
// profile.js calls these after login/auto-login completes
window.appMain = { restoreCheckboxes, setupCalendar, showToast };
