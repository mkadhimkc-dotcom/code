/*
 * profile.js — Auth-aware version
 * ─────────────────────────────────────────────────────────────────
 */

(function () {

  function showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule) {
    profileForm.style.display = 'none';
    profileDisplay.style.display = 'flex';
    const startDate = new Date(profile.startDate + 'T00:00:00');
    profileGreeting.textContent =
      '✨ Hey ' + profile.name + '! Your 4‑week journey started ' +
      startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' 💖';
    buildWeekSchedule(profile.startDate, weekSchedule);
  }

  function showForm(profile, profileForm, profileDisplay) {
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'block';
    if (profile) {
      document.getElementById('userName').value = profile.name || '';
      document.getElementById('startDate').value = profile.startDate || '';
    }
  }

  function buildWeekSchedule(startDateStr, container) {
    if (!container) return;
    const start = new Date(startDateStr + 'T00:00:00');
    container.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEmojis = ['🌸 Week 1', '🎀 Week 2', '💪 Week 3', '⭐ Week 4'];
    const weekTypes = ['Build', 'Build', 'Push', 'Deload 🧘'];

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const isCurrentWeek = today >= weekStart && today <= weekEnd;
      const isDeload = w === 3;

      const row = document.createElement('div');
      row.className = 'week-row';
      if (isCurrentWeek) row.classList.add('current-week');
      if (isDeload) row.classList.add('deload-week');

      row.innerHTML =
        '<span class="week-badge">' + weekEmojis[w] + (isCurrentWeek ? ' ← Now' : '') + '</span>' +
        '<div>' +
          '<div class="week-dates">' + formatDate(weekStart) + ' – ' + formatDate(weekEnd) + '</div>' +
          '<div class="week-label">' + weekTypes[w] + '</div>' +
        '</div>';
      container.appendChild(row);
    }
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function setupProfile() {
    const saveProfileBtn  = document.getElementById('saveProfileBtn');
    const editProfileBtn  = document.getElementById('editProfileBtn');
    const profileForm     = document.getElementById('profileForm');
    const profileDisplay  = document.getElementById('profileDisplay');
    const profileGreeting = document.getElementById('profileGreeting');
    const weekSchedule    = document.getElementById('weekSchedule');

// ── CHECK AUTH SESSION ──
const session = await window.supabaseHelper.getSession();

if (!session) {
  // Auth coming soon — continue without session for now
  await window.appMain.setupCalendar();
  return;
}
    // ── AUTO-LOAD PROFILE BY AUTH ID ──
    const dbProfile = await window.supabaseHelper.loadProfileByAuthId();

    if (dbProfile) {
      const profile = { name: dbProfile.username, startDate: dbProfile.start_date };
      localStorage.setItem('profile_id', dbProfile.id);
      localStorage.setItem('profile_name', dbProfile.username);
      localStorage.setItem('profile_startDate', dbProfile.start_date);
      showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule);
      await window.appMain.restoreCheckboxStates(dbProfile.id);
      await window.appMain.setupCalendar();
    } else {
      // Logged in but no profile yet — show form
      showForm(null, profileForm, profileDisplay);
      await window.appMain.setupCalendar();
    }

    // ── SAVE HANDLER ──
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('userName').value.trim();
        const date = document.getElementById('startDate').value;

        if (!name) { alert('Please enter your name, cutie! 🎀'); return; }
        if (!date) { alert('Please pick a start date! 📅'); return; }

        saveProfileBtn.textContent = 'Saving… 💾';
        saveProfileBtn.disabled = true;

        const saved = await window.supabaseHelper.saveProfile({ name, startDate: date });

        if (!saved) {
          alert('Could not save your profile. Please try again! 🌸');
          saveProfileBtn.textContent = '💾 Save My Profile';
          saveProfileBtn.disabled = false;
          return;
        }

        localStorage.setItem('profile_id', saved.id);
        localStorage.setItem('profile_name', saved.username);
        localStorage.setItem('profile_startDate', date);

        saveProfileBtn.textContent = '💾 Save My Profile';
        saveProfileBtn.disabled = false;

        showProfileDisplay({ name, startDate: date }, profileForm, profileDisplay, profileGreeting, weekSchedule);
        await window.appMain.restoreCheckboxStates(saved.id);
        await window.appMain.setupCalendar();
        window.appMain.showToast(`Profile saved! Welcome ${name} 💖`);
      });
    }

    // ── EDIT HANDLER ──
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        const name      = localStorage.getItem('profile_name') || '';
        const startDate = localStorage.getItem('profile_startDate') || '';
        showForm({ name, startDate }, profileForm, profileDisplay);
      });
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', setupProfile);

  window.profileManager = { setupProfile };
})();
