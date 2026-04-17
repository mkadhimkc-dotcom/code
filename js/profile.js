/*
 * profile.js — Sprint 2 + 3
 * ─────────────────────────────────────────────────────────────────
 *  BUG-04: Calls setupCalendar() after auto-login completes
 *  BUG-06: Saves start_date to localStorage for Edit prefill
 *  FEAT-02: Success toast on save
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
    window.schedule.buildWeekSchedule(profile.startDate, weekSchedule);
  }

  function showForm(profile, profileForm, profileDisplay) {
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'block';
    if (profile) {
      document.getElementById('userName').value = profile.name || '';
      document.getElementById('startDate').value = profile.startDate || '';
    }
  }

  async function setupProfile() {
    const saveProfileBtn  = document.getElementById('saveProfileBtn');
    const editProfileBtn  = document.getElementById('editProfileBtn');
    const profileForm     = document.getElementById('profileForm');
    const profileDisplay  = document.getElementById('profileDisplay');
    const profileGreeting = document.getElementById('profileGreeting');
    const weekSchedule    = document.getElementById('weekSchedule');

    // ── AUTO-LOGIN ──
    const cachedId   = localStorage.getItem('profile_id');
    const cachedName = localStorage.getItem('profile_name');

    if (cachedId && cachedName) {
      profileGreeting.textContent = 'Loading your profile… 🌸';
      profileDisplay.style.display = 'flex';
      profileForm.style.display = 'none';

      const dbProfile = await window.supabaseHelper.loadProfile(cachedName);
      if (dbProfile) {
        const profile = { name: dbProfile.username, startDate: dbProfile.start_date };
        // BUG-06: Cache start_date for edit prefill
        localStorage.setItem('profile_startDate', dbProfile.start_date);
        showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule);
        await window.appMain.restoreCheckboxes(cachedId);
        // BUG-04: Calendar renders only AFTER auto-login completes
        await window.appMain.setupCalendar();
      } else {
        localStorage.removeItem('profile_id');
        localStorage.removeItem('profile_name');
        localStorage.removeItem('profile_startDate');
        showForm(null, profileForm, profileDisplay);
        await window.appMain.setupCalendar(); // Shows empty state
      }
    } else {
      await window.appMain.setupCalendar(); // Shows empty state
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
          alert('Could not save your profile. Check your Supabase connection. 🌸');
          saveProfileBtn.textContent = '💾 Save My Profile';
          saveProfileBtn.disabled = false;
          return;
        }

        localStorage.setItem('profile_id', saved.id);
        localStorage.setItem('profile_name', saved.username);
        localStorage.setItem('profile_startDate', date); // BUG-06

        saveProfileBtn.textContent = '💾 Save My Profile';
        saveProfileBtn.disabled = false;

        showProfileDisplay({ name, startDate: date }, profileForm, profileDisplay, profileGreeting, weekSchedule);
        await window.appMain.restoreCheckboxes(saved.id);
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

  window.profile = { setupProfile };
})();
