import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Anon key публичен по дизайну Supabase. Доступ к данным ограничен политиками RLS.
 * service_role key в браузерное приложение не попадает никогда.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null

export class NotConfiguredError extends Error {
  constructor() {
    super('База данных портала не подключена.')
    this.name = 'NotConfiguredError'
  }
}

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new NotConfiguredError()
  return supabase
}
