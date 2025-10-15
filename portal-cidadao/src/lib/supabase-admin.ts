import { createClient } from '@supabase/supabase-js'

// Admin client (server-side only)
// Requer SUPABASE_SERVICE_ROLE_KEY no .env.local (NÃO expor como NEXT_PUBLIC)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createSupabaseAdmin() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

