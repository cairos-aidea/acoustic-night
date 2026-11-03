import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mxmepnntyatisdmuwkcm.supabase.co'
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Support localStorage override for easy configuration in browser
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key_override') : null
const supabaseAnonKey = (storedKey && storedKey.trim()) || (envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' ? envKey : '')

export const isConfigured = Boolean(envUrl && supabaseAnonKey)

export const supabase = isConfigured
  ? createClient(envUrl, supabaseAnonKey)
  : createClient(envUrl, 'placeholder-key')

export function saveAnonKey(key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_anon_key_override', key.trim())
    window.location.reload()
  }
}

export function clearAnonKey() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_anon_key_override')
    window.location.reload()
  }
}

