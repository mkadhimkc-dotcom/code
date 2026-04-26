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

      const badge = document.createElement('span');
      badge.className = 'week-badge';
      badge.textContent = weekEmojis[w] + (isCurrentWeek ? ' ← Now' : '');

      const info = document.createElement('div');

      const dates = document.createElement('div');
      dates.className = 'week-dates';
      dates.textContent = formatDate(weekStart) + ' – ' + formatDate(weekEnd);

      const label = document.createElement('div');
      label.className = 'week-label';
      label.textContent = weekTypes[w];

      info.appendChild(dates);
      info.appendChild(label);
      row.appendChild(badge);
      row.appendChild(info);
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
      window.location.href = '/signin.html';
      return;
    }

    // ── AUTO-LOAD PROFILE BY AUTH ID ──
    const dbProfile = await window.supabaseHelper.loadProfileByAuthId();

    if (dbProfile) {
      const profile = { name: dbProfile.username, startDate: dbProfile.start_date };
	  if (window.themeManager) window.themeManager.applyFromProfile(dbProfile.theme);
      localStorage.setItem('profile_id', dbProfile.id);
      localStorage.setItem('profile_name', dbProfile.username);
      localStorage.setItem('profile_startDate', dbProfile.start_date);
      showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule);
      await window.appMain.restoreCheckboxStates(dbProfile.id);
      await window.appMain.setupCalendar();
    } else {
      showForm(null, profileForm, profileDisplay);
      await window.appMain.setupCalendar();
    }

    // ── SAVE HANDLER ──
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('userName').value.trim();
        const date = document.getElementById('startDate').value;

        if (!name) { window.appMain.showToast('Please enter your name, cutie! 🎀'); return; }
        if (!date) { window.appMain.showToast('Please pick a start date! 📅'); return; }

        saveProfileBtn.textContent = 'Saving… 💾';
        saveProfileBtn.disabled = true;

        const saved = await window.supabaseHelper.saveProfile({ name, startDate: date });

        if (!saved) {
          window.appMain.showToast('Could not save your profile. Please try again! 🌸');
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

    // ── DELETE ACCOUNT HANDLER ──
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', async () => {
        const confirmed = await window.appMain.showConfirm(
          'Delete your account? This will permanently erase all your workout data and cannot be undone.'
        );
        if (!confirmed) return;

        deleteAccountBtn.textContent = 'Deleting…';
        deleteAccountBtn.disabled = true;

        try {
          const profileId = localStorage.getItem('profile_id');
          const { supabase } = window.supabaseHelper;

          if (profileId) {
            await supabase.from('workout_logs').delete().eq('profile_id', profileId);
            await supabase.from('checkbox_states').delete().eq('profile_id', profileId);
            await supabase.from('user_workouts').delete().eq('profile_id', profileId);
            await supabase.from('profiles').delete().eq('id', profileId);
          }

          await window.supabaseHelper.signOut();
          localStorage.clear();
          window.location.href = '/signin.html?deleted=1';

        } catch (err) {
          console.error('Delete error:', err);
          window.appMain.showToast('Could not delete account. Please email mkadhimkc@gmail.com 💌');
          deleteAccountBtn.textContent = '🗑️ Delete Account';
          deleteAccountBtn.disabled = false;
        }
      });
    }
  }

  // Initialize on DOM ready
  async function waitForSupabase() {
    while (!window.supabaseHelper) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await waitForSupabase();
    setupProfile();
  });

  window.profileManager = { setupProfile };
})();