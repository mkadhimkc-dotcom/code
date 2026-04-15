/**
 * storage.js
 *
 * A small collection of helper functions that wrap localStorage
 * interactions. All keys for set tracking share a common prefix to
 * avoid polluting the user’s other data. Profile data is stored as
 * a single JSON string under a dedicated key. You can swap
 * localStorage out for another persistence layer (e.g. IndexedDB)
 * without changing the rest of the application by modifying this
 * module.
 */

// Immediately invoked function expression so the helpers live in a
// private scope. At the end of the file the API is attached to
// `window.storage`.

(function() {
  const STORAGE_PREFIX = 'girly_fitness_app_';
  const PROFILE_KEY = 'girly_fitness_profile';

  /**
   * Return whether a given checkbox (identified by its data-id) was
   * previously marked complete.
   * @param {string} id – the data-id attribute of the checkbox
   * @returns {boolean}
   */
  function getCheckboxState(id) {
    return localStorage.getItem(STORAGE_PREFIX + id) === 'true';
  }

  /**
   * Persist a checkbox’s state.
   * @param {string} id – the data-id attribute of the checkbox
   * @param {boolean} value – true if completed, false otherwise
   */
  function setCheckboxState(id, value) {
    localStorage.setItem(STORAGE_PREFIX + id, value);
  }

  /**
   * Remove a checkbox’s persisted state.
   * @param {string} id – the data-id attribute of the checkbox
   */
  function clearCheckboxState(id) {
    localStorage.removeItem(STORAGE_PREFIX + id);
  }

  /**
   * Remove all persisted checkbox states belonging to this app.
   */
  function clearAllCheckboxStates() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Save the user’s profile information.  The profile must contain
   * at least a `name` and a `startDate` field.
   * @param {{name: string, startDate: string}} profile
   */
  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Load the saved user profile if it exists.
   * @returns {{name: string, startDate: string} | null}
   */
  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Remove the saved profile entirely.
   */
  function removeProfile() {
    localStorage.removeItem(PROFILE_KEY);
  }

  // Expose the API
  window.storage = {
    getCheckboxState,
    setCheckboxState,
    clearCheckboxState,
    clearAllCheckboxStates,
    saveProfile,
    loadProfile,
    removeProfile
  };
})();