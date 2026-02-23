import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key') {
    throw new Error(
      'Supabase environment variables are still set to default placeholders. \n' +
      'Please update .env.local with your actual Supabase URL and Anon Key from: \n' +
      'https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
