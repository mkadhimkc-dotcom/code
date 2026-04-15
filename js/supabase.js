/*
 * supabase.js
 *
 * Provides a small wrapper around the Supabase JavaScript client when used
 * via a CDN. Supabase makes it easy to persist data such as workout logs
 * remotely. To use this file you must create a Supabase project and obtain
 * your project’s URL and anon key. See the Supabase documentation for
 * instructions on creating a project and retrieving these values【112244959700895†L118-L133】.
 *
 * Once configured, the global `window.supabaseHelper` object exposes
 * convenience methods for inserting and retrieving workout logs. You can
 * extend this helper with additional functions as your application grows.
 */

// Immediately invoke to avoid leaking locals
(function() {
  // Replace the following placeholder strings with your own Supabase project
  // credentials. The URL should look like `https://xyzcompany.supabase.co` and
  // the anon key should be the “public” API key associated with your project.
  const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_KEY';

  // Ensure the Supabase script has been loaded via the CDN. The CDN defines
  // a global `supabase` namespace from which we destructure createClient.
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Ensure the CDN script tag is included before this file.');
    return;
  }
  const { createClient } = supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /**
   * Insert a workout log into the `workout_logs` table. The log object
   * should contain fields matching your table schema, for example:
   * { user_name: 'Sakura', day: 'A', exercise_id: 'A1', weight: 95,
   *   notes: 'Felt strong!', created_at: new Date().toISOString() }
   *
   * @param {Object} log – record to insert
   * @returns {Promise<Object>} – Supabase response with data and error fields
   */
  async function saveWorkoutLog(log) {
    return await supabaseClient.from('workout_logs').insert([log]);
  }

  /**
   * Retrieve all workout logs ordered by creation timestamp descending.
   * @returns {Promise<Object>} – Supabase response with data and error fields
   */
  async function getWorkoutLogs() {
    return await supabaseClient
      .from('workout_logs')
      .select('*')
      .order('created_at', { ascending: false });
  }

  // Expose helper methods and the client itself under a single object on
  // the global window. This avoids polluting the global namespace with
  // individual functions and makes it easy to find Supabase helpers.
  window.supabaseHelper = {
    client: supabaseClient,
    saveWorkoutLog,
    getWorkoutLogs
  };
})();