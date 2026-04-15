/**
 * main.js
 *
 * Serves as the entrypoint for the Girly Fitness app. Once the DOM
 * finishes loading it initialises navigation, profile management and
 * set tracking. Checkbox states are restored from storage on
 * startup and updated whenever the user checks a box. A reset
 * button is provided to clear the entire week’s progress.
 */

// The main script does not use ES module imports because local file
// origins block module loading in most browsers. Instead, helper
// functions live on the `window` object.  See navigation.js,
// storage.js, profile.js and schedule.js for details.

// Run once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialise modules from global namespaces
  window.navigation.setupNavigation();
  window.profile.setupProfile();
  // Initialise rest timers after the DOM is ready.  Timer buttons will be
  // appended to each card’s metadata for quick access.  If you add or
  // remove cards dynamically you should call this again after modifying
  // the DOM.
  if (window.timer && typeof window.timer.setupTimers === 'function') {
    window.timer.setupTimers();
  }
  setupCheckboxTracking();
  setupResetButton();
});

/**
 * Sync every checkbox’s checked state with localStorage and
 * persist changes when the user interacts with them.
 */
function setupCheckboxTracking() {
  const checkboxes = document.querySelectorAll('.set-checkbox input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const id = checkbox.getAttribute('data-id');
    // Restore saved state
    if (window.storage.getCheckboxState(id)) {
      checkbox.checked = true;
    }
    // Persist on change
    checkbox.addEventListener('change', event => {
      window.storage.setCheckboxState(id, event.target.checked);
    });
  });
}

/**
 * Attach click listener to the reset button to clear all saved
 * checkbox states. A confirmation prompt guards against accidental
 * deletion. When confirmed all boxes are unchecked and storage is
 * cleared via the storage module.
 */
function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', () => {
    if (confirm('Do you want to clear your cute diary for a new week? 🎀')) {
      // Uncheck all boxes on the page
      document.querySelectorAll('.set-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      // Clear persisted state
      window.storage.clearAllCheckboxStates();
      alert("Diary reset! Let's crush this week! 💖");
    }
  });
}