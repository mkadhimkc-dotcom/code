/*
 * supabase.js — Sprint 3 + Auth
 */

(function () {
  const { createClient } = window.supabase;

  const client = createClient(
    'https://xragzrjatiudhbrubejf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWd6cmphdGl1ZGhicnViZWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDY4MTIsImV4cCI6MjA5MTg4MjgxMn0.JyX4aWIK6TTHPeyITWMYGLRRvgANVR2j20wSti5-WUM',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  );

  async function getSession() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) { console.error('getSession error:', error.message); return null; }
    return session;
  }

  async function getUser() {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return null;
    return user;
  }

  async function signOut() {
    const { error } = await client.auth.signOut({ scope: 'global' });
    if (error) console.error('signOut error:', error.message);
    window.location.href = '/signin.html';
  }

  function onAuthStateChange(callback) {
    return client.auth.onAuthStateChange(callback);
  }

  async function saveProfile(profile) {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('profiles')
      .upsert(
        {
          username: profile.name,
          start_date: profile.startDate,
          auth_user_id: user.id
        },
        { onConflict: 'username' }
      )
      .select()
      .single();
    if (error) { console.error('saveProfile error:', error.message); return null; }
    return data;
  }

  async function loadProfile(username) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error) return null;
    return data;
  }

  async function loadProfileByAuthId() {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    if (error) return null;
    return data;
  }

  async function saveWorkoutLog(log) {
    const { error } = await client.from('workout_logs').insert([log]);
    if (error) console.error('saveWorkoutLog error:', error.message);
  }

  async function getWorkoutLogs(profileId) {
    const { data, error } = await client
      .from('workout_logs')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) { console.error('getWorkoutLogs error:', error.message); return []; }
    return data;
  }

  async function saveCheckboxState(profileId, checkboxId, checked) {
    const { error } = await client
      .from('checkbox_states')
      .upsert(
        { profile_id: profileId, checkbox_id: checkboxId, checked },
        { onConflict: 'profile_id,checkbox_id' }
      );
    if (error) console.error('saveCheckboxState error:', error.message);
  }

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

  async function clearCheckboxStates(profileId) {
    const { error } = await client
      .from('checkbox_states')
      .delete()
      .eq('profile_id', profileId);
    if (error) console.error('clearCheckboxStates error:', error.message);
  }

  async function addCustomWorkout(assignment) {
    const { data, error } = await client
      .from('user_workouts')
      .insert([assignment])
      .select()
      .single();
    if (error) { console.error('addCustomWorkout error:', error.message); return null; }
    return data;
  }

  async function getCustomWorkouts(profileId) {
    const { data, error } = await client
      .from('user_workouts')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true });
    if (error) { console.error('getCustomWorkouts error:', error.message); return []; }
    return data;
  }

  async function removeCustomWorkout(assignmentId) {
    const { error } = await client
      .from('user_workouts')
      .delete()
      .eq('id', assignmentId);
    if (error) console.error('removeCustomWorkout error:', error.message);
  }

  window.supabaseHelper = {
    client,
    getSession,
    getUser,
    signOut,
    onAuthStateChange,
    saveProfile,
    loadProfile,
    loadProfileByAuthId,
    saveWorkoutLog,
    getWorkoutLogs,
    saveCheckboxState,
    getCheckboxStates,
    clearCheckboxStates,
    addCustomWorkout,
    getCustomWorkouts,
    removeCustomWorkout,
  };
})();
