/**
 * workouts.js
 *
 * Placeholder for future workout data. In a later iteration you
 * could extract the exercise definitions out of the HTML and into
 * this module or an accompanying JSON file.
 *
 * This file follows the same pattern as the rest of the codebase:
 * it defines a private scope and attaches public exports to the
 * `window` object.  This avoids mixing ES module syntax with
 * plain scripts.  See `navigation.js` and `schedule.js` for
 * examples of this pattern.
 */

(function () {
  // Currently no workout definitions are stored here.  In the future
  // you could populate this object with exercise metadata pulled
  // from a JSON file or external API.  Keeping it on `window`
  // allows other scripts to read it if needed.
  const workouts = {};
  window.workouts = workouts;
})();