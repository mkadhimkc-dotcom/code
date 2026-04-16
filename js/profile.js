/*
 * profile.js
 * ─────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DOES:
 *  1. On first visit → shows the name/date form
 *  2. On save → upserts profile to Supabase, caches profile_id
 *     in localStorage so the user never has to re-enter their name
 *  3. On return visit → reads profile_id from localStorage and
 *     fetches the full profile from Supabase automatically
 *  4. Edit button → re-shows the form prefilled with saved values
 * ─────────────────────────────────────────────────────────────────
 */

(function () {

  // ── HELPERS ───────────────────────────────────────────────────

  // Hides the form and shows the greeting + week schedule
  function showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule) {
    profileForm.style.display = 'none';
    profileDisplay.style.display = 'flex';
    const startDate = new Date(profile.startDate + 'T00:00:00');
    profileGreeting.textContent =
      '✨ Hey ' + profile.name + '! Your 4‑week journey started ' +
      startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' 💖';
    window.schedule.buildWeekSchedule(profile.startDate, weekSchedule);
  }

  // Hides the display and shows the form (prefilled if profile exists)
  function showForm(profile, profileForm, profileDisplay) {
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'block';
    if (profile) {
      document.getElementById('userName').value = profile.name || '';
      document.getElementById('startDate').value = profile.startDate || '';
    }
  }

  // ── MAIN SETUP ────────────────────────────────────────────────
  // Called once on DOMContentLoaded from main.js

  async function setupProfile() {
    const saveProfileBtn  = document.getElementById('saveProfileBtn');
    const editProfileBtn  = document.getElementById('editProfileBtn');
    const profileForm     = document.getElementById('profileForm');
    const profileDisplay  = document.getElementById('profileDisplay');
    const profileGreeting = document.getElementById('profileGreeting');
    const weekSchedule    = document.getElementById('weekSchedule');

    // ── AUTO-LOGIN ───────────────────────────────────────────────
    // If we have a cached profile_id + name, fetch from Supabase
    // and skip the form entirely — no re-entry needed on return visits
    const cachedId   = localStorage.getItem('profile_id');
    const cachedName = localStorage.getItem('profile_name');

    if (cachedId && cachedName) {
      // Show a placeholder while we fetch
      profileGreeting.textContent = 'Loading your profile… 🌸';
      profileDisplay.style.display = 'flex';
      profileForm.style.display = 'none';

      const dbProfile = await window.supabaseHelper.loadProfile(cachedName);
      if (dbProfile) {
        // Profile found — show it and restore checkboxes
        const profile = { name: dbProfile.username, startDate: dbProfile.start_date };
        showProfileDisplay(profile, profileForm, profileDisplay, profileGreeting, weekSchedule);
        await window.appMain.restoreCheckboxes(cachedId);
      } else {
        // Cached data is stale (e.g. DB was reset) — show form fresh
        localStorage.removeItem('profile_id');
        localStorage.removeItem('profile_name');
        showForm(null, profileForm, profileDisplay);
      }
    }

    // ── SAVE HANDLER ─────────────────────────────────────────────
    // Runs when user taps "Save My Profile"
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('userName').value.trim();
        const date = document.getElementById('startDate').value;

        if (!name) { alert('Please enter your name, cutie! 🎀'); return; }
        if (!date) { alert('Please pick a start date! 📅'); return; }

        // Show loading state on the button
        saveProfileBtn.textContent = 'Saving… 💾';
        saveProfileBtn.disabled = true;

        // Upsert to Supabase — creates or updates by username
        const saved = await window.supabaseHelper.saveProfile({ name, startDate: date });

        if (!saved) {
          alert('Could not save your profile. Check your Supabase connection. 🌸');
          saveProfileBtn.textContent = '💾 Save My Profile';
          saveProfileBtn.disabled = false;
          return;
        }

        // Cache profile_id locally — this is our lightweight session token
        // On next visit, this is all we need to fetch the full profile
        localStorage.setItem('profile_id', saved.id);
        localStorage.setItem('profile_name', saved.username);

        saveProfileBtn.textContent = '💾 Save My Profile';
        saveProfileBtn.disabled = false;

        showProfileDisplay({ name, startDate: date }, profileForm, profileDisplay, profileGreeting, weekSchedule);
        await window.appMain.restoreCheckboxes(saved.id);
      });
    }

    // ── EDIT HANDLER ─────────────────────────────────────────────
    // Tapping Edit re-shows the form with current values prefilled
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        const name      = localStorage.getItem('profile_name') || '';
        const startDate = localStorage.getItem('profile_startDate') || '';
        showForm({ name, startDate }, profileForm, profileDisplay);
      });
    }
  }

  // Expose to global so main.js can call setupProfile()
  window.profile = { setupProfile };
})();
