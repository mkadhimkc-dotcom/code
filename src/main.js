// ── VITE ENTRY POINT ─────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xragzrjatiudhbrubejf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWd6cmphdGl1ZGhicnViZWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDY4MTIsImV4cCI6MjA5MTg4MjgxMn0.JyX4aWIK6TTHPeyITWMYGLRRvgANVR2j20wSti5-WUM'

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
