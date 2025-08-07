const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js'

// Only create client if environment variables are properly set
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to get user role
export const getUserRole = async () => {
  if (!supabase) return 'borrower'
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.role || 'borrower'
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}