/*
 * supabase.js
 * ─────────────────────────────────────────────────────────────────
 * SETUP INSTRUCTIONS:
 *  1. Go to supabase.com → your project → Settings → API
 *  2. Copy "Project URL" and paste it as SUPABASE_URL below
 *  3. Copy "anon public" key and paste it as SUPABASE_ANON_KEY below
 *  4. Save the file and commit to GitHub
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  const SUPABASE_URL = 'https://xragzrjatiudhbrubejf.supabase.co';  // ← replace this
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWd6cmphdGl1ZGhicnViZWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDY4MTIsImV4cCI6MjA5MTg4MjgxMn0.JyX4aWIK6TTHPeyITWMYGLRRvgANVR2j20wSti5-WUM';         // ← replace this

  if (typeof supabase === 'undefined') {
    console.error('Supabase CDN not loaded.');
    return;
  }

  const { createClient } = supabase;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── PROFILES ────────────────────────────────────────────────────
  // Saves or updates a user profile by username.
  // Called when user taps "Save My Profile".
  async function saveProfile(profile) {
    const { data, error } = await client
      .from('profiles')
      .upsert(
        { username: profile.name, start_date: profile.startDate },
        { onConflict: 'username' }
      )
      .select()
      .single();
    if (error) { console.error('saveProfile error:', error.message); return null; }
    return data;
  }

  // Fetches a profile from Supabase by username.
  // Called on app load to auto-login returning users.
  async function loadProfile(username) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error) return null;
    return data;
  }

  // ── WORKOUT LOGS ────────────────────────────────────────────────
  // Saves a completed workout to the workout_logs table.
  // log = { profile_id, workout_type }
  async function saveWorkoutLog(log) {
    const { error } = await client.from('workout_logs').insert([log]);
    if (error) console.error('saveWorkoutLog error:', error.message);
  }

  // Fetches all workout logs for a profile, newest first.
  // Used to populate the calendar view.
  async function getWorkoutLogs(profileId) {
    const { data, error } = await client
      .from('workout_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) { console.error('getWorkoutLogs error:', error.message); return []; }
    return data;
  }

  // ── CHECKBOX STATES ─────────────────────────────────────────────
  // Saves a single checkbox tick to Supabase.
  // Called every time a user checks/unchecks a set.
  async function saveCheckboxState(profileId, checkboxId, checked) {
    const { error } = await client
      .from('checkbox_states')
      .upsert(
        { profile_id: profileId, checkbox_id: checkboxId, checked },
        { onConflict: 'profile_id,checkbox_id' }
      );
    if (error) console.error('saveCheckboxState error:', error.message);
  }

  // Fetches all checkbox states for a profile.
  // Returns an object like { 'A1-1': true, 'B2-3': false, ... }
  // Used to restore ticked sets when user returns to the app.
  async function getCheckboxStates(profileId) {
    const { data, error } = await client
      .from('checkbox_states')
      .select('checkbox_id, checked')
      .eq('profile_id', profileId);
    if (error) return {};
    const map = {};
    (data || []).forEach(row => { map[row.checkbox_id] = row.checked; });
    return map;
  }

  // Deletes all checkbox states for a profile.
  // Called when user hits "Reset My Diary for a New Week".
  async function clearCheckboxStates(profileId) {
    const { error } = await client
      .from('checkbox_states')
      .delete()
      .eq('profile_id', profileId);
    if (error) console.error('clearCheckboxStates error:', error.message);
  }

  // ── EXPOSE ──────────────────────────────────────────────────────
  // All functions are attached to window.supabaseHelper so every
  // other JS file in the app can call them via window.supabaseHelper.X
  window.supabaseHelper = {
    client,
    saveProfile,
    loadProfile,
    saveWorkoutLog,
    getWorkoutLogs,
    saveCheckboxState,
    getCheckboxStates,
    clearCheckboxStates,
  };
})();
