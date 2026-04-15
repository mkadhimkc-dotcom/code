/**
 * schedule.js
 *
 * Responsible for constructing a four week training schedule based
 * on the user’s chosen start date.  Weeks are labelled and
 * decorated to indicate build phases and the deload at the end. A
 * utility for formatting dates to a more human friendly format is
 * also provided.  Should the number of weeks or their labels ever
 * change you can adjust the arrays at the top of `buildWeekSchedule`.
 */

// Wrap everything in an IIFE so we don’t leak variables.  At the end
// we attach our public API to the `window.schedule` object.
(function() {
  /**
   * Format a JavaScript Date into a short US date string (e.g. "Jan 1, 2024").
   * @param {Date} date – date to format
   * @returns {string}
   */
  function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Populate a container with four rows representing the four week
   * progression.  Each row includes the week’s emoji label, date
   * range and training phase description.  The current week is
   * highlighted automatically based on the user’s system clock.  A
   * deload week includes an additional CSS class to style it
   * differently.
   * @param {string} startDateStr – ISO date string from an input[type="date"]
   * @param {HTMLElement} container – element in which to append the schedule rows
   */
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

  // Expose the public API on window
  window.schedule = {
    formatDate,
    buildWeekSchedule
  };
})();