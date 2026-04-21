import { createClient } from '@supabase/supabase-js'

// Expose createClient so js/supabase.js can use it
window.supabase = { createClient }

import '/js/supabase.js'
import '/js/theme.js'
import '/js/profile.js'
import '/js/customWorkouts.js'
import '/js/main.js'
