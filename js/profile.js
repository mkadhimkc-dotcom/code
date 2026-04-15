/**
 * profile.js
 *
 * Handles user profile creation, editing and display. The profile
 * contains the user’s name and program start date. When saved the
 * profile is persisted via the storage helpers. The schedule is
 * generated on demand whenever a profile is displayed. A profile can
 * be edited at any time by revealing the form again with the saved
 * values prefilled.
 */

// Wrap in an IIFE so our internal variables don’t leak to the global
// scope. At the end we attach the setup function to window.profile.
(function() {
  /**
   * Show the profile display and hide the form. Populate greeting and
   * schedule based on the saved profile.
   * @param {{name: string, startDate: string}} profile
   * @param {HTMLElement} profileForm
   * @param {HTMLElement} profileDisplay
   * @param {HTMLElement} profileGreeting
   * @param {HTMLElement} weekSchedule
   */
  function showProfile(profile, profileForm, profileDisplay, profileGreeting, weekSchedule) {
    if (!profile) return;
    profileForm.style.display = 'none';
    profileDisplay.style.display = 'flex';
    const startDate = new Date(profile.startDate + 'T00:00:00');
    profileGreeting.textContent =
      '✨ Hey ' + profile.name + '! Your 4‑week journey started ' + startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' 💖';
    window.schedule.buildWeekSchedule(profile.startDate, weekSchedule);
  }

  /**
   * Show the profile form. If a profile is provided the form will be
   * prefilled with its values.
   * @param {{name: string, startDate: string}|null} profile
   * @param {HTMLElement} profileForm
   * @param {HTMLElement} profileDisplay
   */
  function showForm(profile, profileForm, profileDisplay) {
    profileDisplay.style.display = 'none';
    profileForm.style.display = 'block';
    if (profile) {
      const userNameInput = document.getElementById('userName');
      const startDateInput = document.getElementById('startDate');
      userNameInput.value = profile.name;
      startDateInput.value = profile.startDate;
    }
  }

  /**
   * Initialise profile related event listeners and render the
   * previously saved profile if available. Should be called on
   * DOMContentLoaded.
   */
  function setupProfile() {
    // Grab DOM elements once
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const profileDisplay = document.getElementById('profileDisplay');
    const profileGreeting = document.getElementById('profileGreeting');
    const weekSchedule = document.getElementById('weekSchedule');

    // Load existing profile on startup
    const existing = window.storage.loadProfile();
    if (existing && existing.name && existing.startDate) {
      showProfile(existing, profileForm, profileDisplay, profileGreeting, weekSchedule);
    }

    // Save profile handler
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('userName');
        const dateInput = document.getElementById('startDate');
        const name = nameInput.value.trim();
        const date = dateInput.value;
        if (!name) {
          alert('Please enter your name, cutie! 🎀');
          return;
        }
        if (!date) {
          alert('Please pick a start date! 📅');
          return;
        }
        const profile = { name, startDate: date };
        window.storage.saveProfile(profile);
        showProfile(profile, profileForm, profileDisplay, profileGreeting, weekSchedule);
      });
    }

    // Edit profile handler
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        const saved = window.storage.loadProfile();
        showForm(saved, profileForm, profileDisplay);
      });
    }
  }

  // Expose to global
  window.profile = {
    setupProfile
  };
})();