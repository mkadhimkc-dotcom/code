// ── VITE ENTRY POINT ─────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Expose BEFORE importing other scripts
window.supabase = { createClient: () => client }

// Also expose the client directly for supabase.js
window.supabaseClient = client

import '/js/supabase.js'
import '/js/theme.js'
import '/js/profile.js'
import '/js/customWorkouts.js'
import '/js/main.js'
